# Passenger

The anime passenger who rides the train, built as a Rive rig. It is authored entirely in code with the Rive CLI. Do not hand-edit `scene.rml`: it is generated.

## Pipeline

```
design/poses/*.png  --prep.py-->  art/*.webp  --gen.py-->  scene.rml  --rive-->  passenger.riv
```

- `design/poses/`: the approved Higgsfield images. They are all edits of one seated pose and line up pixel for pixel.
  - `base_cut`, `glasses_cut`, `closed_cut`: background-removed full bodies.
  - `blink`, `lookup`, `smile`, `closed_blink`: the same image with only the face changed.
- `prep.py`: halves the resolution to 896 × 1200 and removes the grey halo left by background removal. It writes the three body poses and four feathered face patches.
- `gen.py`: builds the rig:
  - Spine → Neck → Head bones, plus two hair chains.
  - One weighted mesh shared by the three bodies inside a `Solo`. The legs are bound to the identity slot so they never move, which means `weight-without-bone` warnings are expected.
  - Face patches on the head bone.
  - The state machine.

## Driving it

View model `Passenger`, bound to the artboard:

| Property | Type | Effect |
|---|---|---|
| `station` | number 0–4 | 0 reading, 1 smiles at you, 2 reading, 3 looks up at the route map, 4 book closed and smiling |
| `poking` | boolean | while true, the push-up-the-glasses beat (1.4 s) plays, then she returns to the station pose once it is false |
| `still` | boolean | reduced motion: sway and breathing ease to rest; blinking continues |

The state machine has three layers: `Motion` (8 s idle loop, or rest when `still`), `Blink`, and `Pose`.

## Rebuild

```bash
rive/passenger/build.sh
```

This regenerates `art/`, `scene.rml`, `public/rive/passenger.riv` and `public/rive/pose-0..4.webp`. The pose images are transparent stills, used as the fallback when the runtime can't load. Running it twice gives byte-identical outputs.

To check a pose by eye:

```bash
cd rive/passenger
rive . --screenshot=shots/x.png --data=station=3 --advance=10
rive .            # live preview window (idle loop at station 0)
```

## Signing

The rig has no Luau scripts, so the unsigned `--once` build loads in web runtimes. A clean signed build needs the project pushed to a workspace on a paid plan (`rive push`) and then `rive . --publish`.

The project is linked to file `2645352` in the `sabera` workspace (Cadet plan, active until 2026-10-15). See `push:` in `rive.yaml`. `passenger.signed.riv` is the `--publish` backup from 2026-10-10. It was checked in the web runtime: no watermark, and the view model is writable.
