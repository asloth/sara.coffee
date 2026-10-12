"""Cut the approved Higgsfield poses into Rive-ready art.

Every pose is an edit of the same seated image and lines up with it pixel for pixel, so:
- full-body poses (read / glasses / closed) ship as whole cutouts at half resolution;
- face-only poses (blink / lookup / smile) ship as small feathered patches of the face,
  painted over the reading body and carried by the head bone.

python3 prep.py  -> art/*.webp
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

SRC = Path(__file__).resolve().parents[2] / "design" / "poses"
OUT = Path(__file__).resolve().parent / "art"
OUT.mkdir(exist_ok=True)
W, H = 896, 1200                      # half of the 1792 x 2400 source

# face patch box in artboard (half-res) pixels; covers brows, glasses, eyes and mouth
FACE = (365, 135, 545, 280)


def defringe(img, passes=6):
    """The background remover leaves the grey studio wall in the soft edge pixels, which reads as a
    light halo on the dark train. Bleed the colour of solid neighbours outward into the edge, and
    tighten the alpha ramp a little."""
    a = np.asarray(img).astype(np.float32) / 255.0
    rgb, al = a[:, :, :3].copy(), a[:, :, 3]
    solid = (al > 0.92).astype(np.float32)
    for _ in range(passes):
        acc, cnt = np.zeros_like(rgb), np.zeros_like(al)
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                s = np.roll(np.roll(solid, dy, 0), dx, 1)
                acc += np.roll(np.roll(rgb, dy, 0), dx, 1) * s[:, :, None]
                cnt += s
        grow = (solid == 0) & (cnt > 0)
        rgb[grow] = acc[grow] / cnt[grow][:, None]
        solid = np.maximum(solid, grow.astype(np.float32))
    al = np.clip((al - 0.12) / 0.88, 0, 1)
    return Image.fromarray((np.dstack([rgb, al]) * 255).round().astype(np.uint8), "RGBA")


def half(img):
    img = img.resize((W, H), Image.LANCZOS)
    return defringe(img) if img.mode == "RGBA" else img


def save(img, name):
    img.save(OUT / f"{name}.webp", "WEBP", quality=90, method=6)


base_cut = half(Image.open(SRC / "base_cut.png").convert("RGBA"))
save(base_cut, "body_read")
save(half(Image.open(SRC / "glasses_cut.png").convert("RGBA")), "body_glasses")
closed_cut = half(Image.open(SRC / "closed_cut.png").convert("RGBA"))
save(closed_cut, "body_closed")

# feathered ellipse inside the face box, clipped to the body's own silhouette
x0, y0, x1, y1 = FACE
pw, ph = x1 - x0, y1 - y0
yy, xx = np.mgrid[0:ph, 0:pw]
ell = (((xx - pw / 2) / (pw / 2 * 0.92)) ** 2 + ((yy - ph / 2) / (ph / 2 * 0.92)) ** 2) < 1.0
feather = Image.fromarray((ell * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(7))


def face_patch(src, cut, out):
    body_alpha = np.asarray(cut.crop(FACE))[:, :, 3].astype(np.float32) / 255.0
    m = (np.asarray(feather).astype(np.float32) / 255.0) * body_alpha
    rgb = np.asarray(half(Image.open(SRC / f"{src}.png").convert("RGB")).crop(FACE))
    save(Image.fromarray(np.dstack([rgb, (m * 255).astype(np.uint8)]), "RGBA"), out)


for name in ("blink", "lookup", "smile"):
    face_patch(name, base_cut, f"face_{name}")
# the closed-book pose raises her head, so it gets its own blink cut from its own silhouette
face_patch("closed_blink", closed_cut, "face_closed_blink")

print("face patch", FACE, "->", sorted(p.name for p in OUT.iterdir()))
