#!/usr/bin/env bash
# Rebuild the passenger from the approved poses and ship it to the site.
#   design/poses/*.png --prep.py--> art/*.webp --gen.py--> scene.rml --rive--> passenger.riv
# Outputs (committed, served as-is):
#   public/rive/passenger.riv            unsigned build; the rig has no scripts, so web runtimes accept it
#   public/rive/pose-<station>.webp      transparent still of each station's pose, the no-runtime fallback
#   public/rive/pose-<station>-sm.webp   the same at half size, for phones
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
out="$here/../../public/rive"
mkdir -p "$out" "$here/build"

cd "$here"
python3 prep.py

# fallbacks: screenshots are opaque, so shoot every pose on black and on white and recover alpha
for matte in FF000000 FFFFFFFF; do
  MATTE=$matte python3 gen.py >/dev/null
  for s in 0 1 2 3 4; do
    rive . --screenshot="build/pose-$s-$matte.png" --data="station=$s" --data=still=true --advance=10 >/dev/null
  done
done
python3 - "$out" <<'EOF'
import sys
import numpy as np
from PIL import Image

for s in range(5):
    k = np.asarray(Image.open(f"build/pose-{s}-FF000000.png").convert("RGB")).astype(np.float32)
    w = np.asarray(Image.open(f"build/pose-{s}-FFFFFFFF.png").convert("RGB")).astype(np.float32)
    alpha = np.clip(1 - (w - k).mean(2) / 255.0, 0, 1)
    rgb = np.where(alpha[..., None] > 0.004, k / np.maximum(alpha[..., None], 0.004), 0)
    rgba = np.dstack([np.clip(rgb, 0, 255), alpha * 255]).round().astype(np.uint8)
    im = Image.fromarray(rgba, "RGBA")
    im.save(f"{sys.argv[1]}/pose-{s}.webp", "WEBP", quality=88, method=6)
    im.resize((448, 600), Image.LANCZOS).save(f"{sys.argv[1]}/pose-{s}-sm.webp", "WEBP", quality=85, method=6)
EOF

# the shipped rig has no matte
python3 gen.py
rive . --verify
rive . --once
cp build/passenger.riv "$out/passenger.riv"
# the runtime's wasm, self-hosted at the pinned @rive-app/canvas version
cp "$here/../../node_modules/@rive-app/canvas/rive.wasm" "$out/rive.wasm"

ls -la "$out"
