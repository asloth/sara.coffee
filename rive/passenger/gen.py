"""Generate the passenger rig (scene.rml) from the art in art/.

Limited animation in the Evangelion sense: held key poses that cut, with secondary motion
running underneath them all the time.

- Three full-body poses (read / glasses / closed) sit in a Solo and share one skinned mesh,
  so breathing, train sway, head tilt and hair swing move whichever pose is showing.
- Three face patches (blink / lookup / smile) ride on the head bone over the reading body.
- View model `Passenger`: `station` (0-4, set by the page as you scroll) picks the pose,
  `poking` (true while the visitor clicks) plays the push-up-the-glasses beat.

Artboard pixels == art pixels (896 x 1200). Body images sit at the origin with origin 0,0,
so mesh-local == world and every bind pose is a plain world transform.

python3 gen.py  -> scene.rml
"""
import base64
import itertools
import math
import os
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

HERE = Path(__file__).resolve().parent
W, H = 896, 1200
FACE = (365, 135, 545, 280)            # must match prep.py
UP = -math.pi / 2

_ids = itertools.count(10)


def nid():
    return f"0:{next(_ids)}"


body = Image.open(HERE / "art" / "body_read.webp").convert("RGBA")
A = np.asarray(body).astype(np.float32) / 255.0
alpha = A[:, :, 3]
lum = 0.3 * A[:, :, 0] + 0.59 * A[:, :, 1] + 0.11 * A[:, :, 2]

# ------------------------------------------------------------------ bones (world transforms)
SPINE_O, SPINE_L, NECK_L, HEAD_L = (453.0, 600.0), 270.0, 40.0, 200.0
HEAD_O = (SPINE_O[0], SPINE_O[1] - SPINE_L - NECK_L)          # (453, 290)
HAIR = {  # side: root (world), world rotation, segment lengths
    "L": ((368.0, 135.0), math.pi / 2 + 0.10, (110.0, 110.0)),
    "R": ((538.0, 135.0), math.pi / 2 - 0.10, (110.0, 110.0)),
}
BONE = {n: nid() for n in ("Spine", "Neck", "Head", "HairL1", "HairL2", "HairR1", "HairR2")}

# world origin + rotation of every bone at bind time, in tendon order
WORLD = {
    "Spine": (SPINE_O, UP),
    "Neck": ((SPINE_O[0], SPINE_O[1] - SPINE_L), UP),
    "Head": (HEAD_O, UP),
}
for s, ((ox, oy), r, (l1, _)) in HAIR.items():
    WORLD[f"Hair{s}1"] = ((ox, oy), r)
    WORLD[f"Hair{s}2"] = ((ox + math.cos(r) * l1, oy + math.sin(r) * l1), r)
TENDONS = list(BONE)


def head_local(wx, wy):
    """World point -> head-bone local (the bone points up, so local x is up and local y is +x)."""
    return HEAD_O[1] - wy, wx - HEAD_O[0]


# ------------------------------------------------------------------ mesh (shared by every body pose)
STEP = 18
grow = Image.fromarray((alpha > 0.02).astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(2 * STEP + 1))
m = np.asarray(grow) > 0
xs = np.unique(np.arange(0, W + STEP, STEP).clip(0, W))
ys = np.unique(np.arange(0, H + STEP, STEP).clip(0, H))
vid, verts, tris = {}, [], []


def v(ix, iy):
    if (ix, iy) not in vid:
        vid[(ix, iy)] = len(verts)
        verts.append((float(xs[ix]), float(ys[iy])))
    return vid[(ix, iy)]


for iy in range(len(ys) - 1):
    for ix in range(len(xs) - 1):
        x0, x1, y0, y1 = xs[ix], xs[ix + 1], ys[iy], ys[iy + 1]
        if not m[min(y0, H - 1):max(y1, y0 + 1), min(x0, W - 1):max(x1, x0 + 1)].any():
            continue
        a, b, c, d = v(ix, iy), v(ix + 1, iy), v(ix + 1, iy + 1), v(ix, iy + 1)
        tris += [(a, b, c), (a, c, d)]


def varuint(n):
    out = bytearray()
    while True:
        byte, n = n & 0x7F, n >> 7
        out.append(byte | (0x80 if n else 0))
        if not n:
            return bytes(out)


TRI_BYTES = base64.b64encode(b"".join(varuint(i) for t in tris for i in t)).decode()

# ------------------------------------------------------------------ weights from pixels
yy, xx = np.mgrid[0:H, 0:W]
face_ell = ((xx - 453) / 72) ** 2 + ((yy - 212) / 80) ** 2 < 1.0
hair = (lum < 0.22) & (alpha > 0.5) & ~face_ell & (yy > 95) & (yy < 345) & ((xx < 408) | (xx > 498))
hair_blur = np.asarray(Image.fromarray(hair.astype(np.uint8) * 255).filter(ImageFilter.GaussianBlur(9))) / 255.0


def smooth(e0, e1, x):
    t = min(1.0, max(0.0, (x - e0) / (e1 - e0)))
    return t * t * (3 - 2 * t)


def weights(x, y):
    xi, yi = int(min(W - 1, x)), int(min(H - 1, y))
    head = smooth(345, 295, y)
    upper = smooth(645, 545, y)         # legs and seat stay put: they take the identity slot
    w = {"Head": head, "Spine": (1 - head) * upper, None: (1 - head) * (1 - upper)}
    a = min(1.0, hair_blur[yi, xi] * 1.7) * smooth(150, 235, y)
    if a > 0.01:
        side = "L" if x < 453 else "R"
        tip = smooth(235, 335, y)
        w = {k: val * (1 - a) for k, val in w.items()}
        w[f"Hair{side}1"] = a * (1 - tip)
        w[f"Hair{side}2"] = a * tip
    top = sorted(((val, k) for k, val in w.items() if val > 0.004), key=lambda t: -t[0])[:4]
    tot = sum(val for val, _ in top)
    q = [max(1, round(255 * val / tot)) for val, _ in top]
    q[0] += 255 - sum(q)
    idx = vals = 0
    for slot, ((_, k), qv) in enumerate(zip(top, q)):
        idx |= (0 if k is None else TENDONS.index(k) + 1) << (8 * slot)
        vals |= qv << (8 * slot)
    return idx, vals


WEIGHTS = [weights(x, y) for x, y in verts]

# ------------------------------------------------------------------ RML
out = []
w_ = out.append


def tendon_xml(name):
    (ox, oy), r = WORLD[name]
    c, s = math.cos(r), math.sin(r)
    return (f'<Tendon boneId="{BONE[name]}" xx="{c:.6f}" xy="{s:.6f}" yx="{-s:.6f}" yy="{c:.6f}" '
            f'tx="{ox:.3f}" ty="{oy:.3f}" name="{name}"/>')


def skinned_body(asset_id, name, img_id):
    w_(f'<Image x="0" y="0" originX="0" originY="0" assetId="{asset_id}" name="{name}" id="{img_id}">')
    w_(f'<Mesh triangleIndexBytes="{TRI_BYTES}" name="Mesh">')
    for (x, y), (idx, vals) in zip(verts, WEIGHTS):
        w_(f'<MeshVertex x="{x:.1f}" y="{y:.1f}" u="{x / W:.6f}" v="{y / H:.6f}">'
           f'<Weight values="{vals}" indices="{idx}"/></MeshVertex>')
    w_('<Skin tx="0" ty="0" name="Skin">')
    for n in TENDONS:
        w_(tendon_xml(n))
    w_('</Skin></Mesh></Image>')


ASSET = {n: nid() for n in ("body_read", "body_glasses", "body_closed", "face_blink", "face_lookup", "face_smile", "face_closed_blink")}
VM, VM_INST, P_STATION, P_POKING, P_STILL = nid(), nid(), nid(), nid(), nid()
SM, ART = nid(), nid()
BODY_SOLO = nid()
BODY = {n: nid() for n in ("read", "glasses", "closed")}
GROUP = {n: nid() for n in ("ReadFace", "LookFace", "SmileFace", "ClosedFace")}
BLINK, CLOSED_BLINK = nid(), nid()
BLINKS = [BLINK, CLOSED_BLINK]

w_('<Rive version="1" kind="fragment">')
for n, i in ASSET.items():
    w_(f'<ImageAsset file="art/{n}.webp" name="{n}" id="{i}"/>')

w_(f'<ViewModel defaultInstanceId="{VM_INST}" name="Passenger" id="{VM}">')
w_(f'<ViewModelPropertyNumber name="station" id="{P_STATION}"/>')
w_(f'<ViewModelPropertyBoolean name="poking" id="{P_POKING}"/>')
w_(f'<ViewModelPropertyBoolean name="still" id="{P_STILL}"/>')
w_(f'<ViewModelInstance exports="true" name="Default" id="{VM_INST}">')
w_(f'<ViewModelInstanceNumber propertyValue="0" viewModelPropertyId="{P_STATION}"/>')
w_(f'<ViewModelInstanceBoolean propertyValue="false" viewModelPropertyId="{P_POKING}"/>')
w_(f'<ViewModelInstanceBoolean propertyValue="false" viewModelPropertyId="{P_STILL}"/>')
w_('</ViewModelInstance></ViewModel>')

w_(f'<Artboard defaultStateMachineId="{SM}" viewModelId="{VM}" viewModelInstanceId="{VM_INST}" '
   f'width="{W}" height="{H}" styleId="0:5" name="Passenger" id="{ART}">')
w_('<LayoutComponentStyle name="Artboard Style" id="0:5"/>')
if os.environ.get("MATTE"):   # build.sh renders the fallbacks on black and on white to recover alpha
    w_(f'<Fill name="Matte"><SolidColor colorValue="{os.environ["MATTE"]}" name="C"/></Fill>')

# skeleton first: it carries the face patches, and earlier siblings draw on top
sx, sy = SPINE_O
w_(f'<RootBone x="{sx}" y="{sy}" length="{SPINE_L}" rotation="{UP:.7f}" name="Spine" id="{BONE["Spine"]}">')
w_(f'<Bone length="{NECK_L}" rotation="0" name="Neck" id="{BONE["Neck"]}">')
w_(f'<Bone length="{HEAD_L}" rotation="0" name="Head" id="{BONE["Head"]}">')
fx, fy = head_local((FACE[0] + FACE[2]) / 2, (FACE[1] + FACE[3]) / 2)
for group, asset, inner_id, start in (("LookFace", "face_lookup", nid(), 0),
                                      ("SmileFace", "face_smile", nid(), 0),
                                      ("ReadFace", "face_blink", BLINK, 1),
                                      ("ClosedFace", "face_closed_blink", CLOSED_BLINK, 0)):
    w_(f'<Node opacity="{start}" name="{group}" id="{GROUP[group]}">')
    w_(f'<Image x="{fx:.2f}" y="{fy:.2f}" rotation="{math.pi / 2:.7f}" originX="0.5" originY="0.5" '
       f'opacity="{0 if inner_id in BLINKS else 1}" assetId="{ASSET[asset]}" name="{asset}" id="{inner_id}"/>')
    w_('</Node>')
for s, ((ox, oy), r, (l1, l2)) in HAIR.items():
    lx, ly = head_local(ox, oy)
    w_(f'<RootBone x="{lx:.2f}" y="{ly:.2f}" length="{l1}" rotation="{r - UP:.7f}" name="Hair{s}1" id="{BONE[f"Hair{s}1"]}">')
    w_(f'<Bone length="{l2}" rotation="0" name="Hair{s}2" id="{BONE[f"Hair{s}2"]}"/>')
    w_('</RootBone>')
w_('</Bone></Bone></RootBone>')

w_(f'<Solo activeComponentId="{BODY["read"]}" name="Body" id="{BODY_SOLO}">')
for pose in ("read", "glasses", "closed"):
    skinned_body(ASSET[f"body_{pose}"], f"Body {pose}", BODY[pose])
w_('</Solo>')

# ------------------------------------------------------------------ state machine
def bind_number(op_value, value):
    return (f'<TransitionViewModelCondition opValue="{op_value}"><TransitionPropertyViewModelComparator>'
            f'<BindablePropertyNumber><DataBindContext sourcePathIds="{VM}-{P_STATION}" propertyKey="636"/>'
            f'</BindablePropertyNumber></TransitionPropertyViewModelComparator>'
            f'<TransitionValueNumberComparator value="{value}"/></TransitionViewModelCondition>')


def bind_bool(prop, value):
    return (f'<TransitionViewModelCondition opValue="equal"><TransitionPropertyViewModelComparator>'
            f'<BindablePropertyBoolean><DataBindContext sourcePathIds="{VM}-{prop}" propertyKey="634"/>'
            f'</BindablePropertyBoolean></TransitionPropertyViewModelComparator>'
            f'<TransitionValueBooleanComparator value="{value}"/></TransitionViewModelCondition>')


def bind_poking(value):
    return bind_bool(P_POKING, value)


# station -> (body pose, ReadFace, LookFace, SmileFace, ClosedFace)
POSES = {
    0: ("read", 1, 0, 0, 0),      # departure: absorbed in the book
    1: ("read", 0, 0, 1, 0),      # about: looks up at you and smiles
    2: ("read", 1, 0, 0, 0),      # work: back to reading
    3: ("read", 0, 1, 0, 0),      # experience: glances up at the route map
    4: ("closed", 0, 0, 0, 1),    # last stop: book closed, smiling at you
}
ANIM_MOTION, ANIM_REST, ANIM_BLINK = nid(), nid(), nid()
ANIM_POSE = {k: nid() for k in POSES}
ANIM_POKE = nid()
ST_MOTION, ST_REST, ST_BLINK, ST_POSE, ST_POKE = nid(), nid(), nid(), {k: nid() for k in POSES}, nid()

w_(f'<StateMachine name="Main" id="{SM}">')
# secondary motion; `still` (reduced motion) eases her to rest and holds there
w_('<StateMachineLayer name="Motion">')
w_('<AnyState x="200" y="-120"/><ExitState x="560" y="-120"/>')
w_(f'<EntryState x="0" y="0"><StateTransition stateToId="{ST_MOTION}"/></EntryState>')
w_(f'<AnimationState x="200" y="0" animationId="{ANIM_MOTION}" id="{ST_MOTION}">')
w_(f'<StateTransition stateToId="{ST_REST}" duration="300">{bind_bool(P_STILL, "true")}</StateTransition>')
w_('</AnimationState>')
w_(f'<AnimationState x="380" y="0" animationId="{ANIM_REST}" id="{ST_REST}">')
w_(f'<StateTransition stateToId="{ST_MOTION}" duration="300">{bind_bool(P_STILL, "false")}</StateTransition>')
w_('</AnimationState>')
w_('</StateMachineLayer>')
# blinking runs regardless of `still`
w_('<StateMachineLayer name="Blink">')
w_('<AnyState x="200" y="-120"/><ExitState x="400" y="-120"/>')
w_(f'<EntryState x="0" y="0"><StateTransition stateToId="{ST_BLINK}"/></EntryState>')
w_(f'<AnimationState x="200" y="0" animationId="{ANIM_BLINK}" id="{ST_BLINK}"/>')
w_('</StateMachineLayer>')

w_('<StateMachineLayer name="Pose">')
w_('<AnyState x="160" y="-160"/><ExitState x="1100" y="-160"/>')
w_(f'<EntryState x="0" y="0"><StateTransition stateToId="{ST_POSE[0]}"/></EntryState>')
for k in POSES:
    w_(f'<AnimationState x="{160 + k * 180}" y="0" animationId="{ANIM_POSE[k]}" id="{ST_POSE[k]}">')
    for j in POSES:
        if j != k:
            w_(f'<StateTransition stateToId="{ST_POSE[j]}" duration="90">{bind_number("equal", j)}</StateTransition>')
    w_(f'<StateTransition stateToId="{ST_POKE}">{bind_poking("true")}</StateTransition>')
    w_('</AnimationState>')
w_(f'<AnimationState x="520" y="220" animationId="{ANIM_POKE}" reset="true" id="{ST_POKE}">')
for j in POSES:
    w_(f'<StateTransition stateToId="{ST_POSE[j]}" duration="90" enableExitTime="true" '
       f'exitTimeIsPercetange="true" exitTime="100">{bind_number("equal", j)}{bind_poking("false")}</StateTransition>')
w_('</AnimationState>')
w_('</StateMachineLayer>')
w_('</StateMachine>')

# ------------------------------------------------------------------ animations
EASE = '<CubicEaseInterpolator x1="0.42" y1="0" x2="0.58" y2="1"/>'


def keys(obj, prop, frames, hold=False):
    w_(f'<KeyedObject objectId="{obj}"><KeyedProperty property="{prop}">')
    for f, val in frames:
        if hold:
            w_(f'<KeyFrameDouble value="{val}" frame="{f}" interpolationType="hold"/>')
        else:
            w_(f'<KeyFrameDouble value="{val:.6f}" frame="{f}" interpolationType="cubic">{EASE}</KeyFrameDouble>')
    w_('</KeyedProperty></KeyedObject>')


DUR = 480   # 8 s loop at 60 fps
w_(f'<LinearAnimation loopValue="loop" duration="{DUR}" fps="60" name="Motion" id="{ANIM_MOTION}">')
# the car rocks: the upper body leans with the rails, and a joint in the track bumps it twice
keys(BONE["Spine"], "rotation", [(0, UP), (120, UP + 0.010), (250, UP - 0.005), (370, UP + 0.008), (480, UP)])
keys(BONE["Spine"], "y", [(0, sy), (196, sy), (200, sy + 1.6), (210, sy), (412, sy), (416, sy + 1.2), (426, sy), (480, sy)])
# breathing, two slow breaths per loop
keys(BONE["Spine"], "scaleX", [(0, 1), (120, 1.005), (240, 1), (360, 1.005), (480, 1)])
keys(BONE["Spine"], "scaleY", [(0, 1), (120, 1.009), (240, 1), (360, 1.009), (480, 1)])
# head drifts as she reads; hair trails it on its own phase
keys(BONE["Head"], "rotation", [(0, 0), (190, 0.028), (330, -0.012), (480, 0)])
for s, ph in (("L", 0), ("R", 40)):
    r0 = HAIR[s][1] - UP
    keys(BONE[f"Hair{s}1"], "rotation", [(0, r0), (130 + ph, r0 + 0.030), (300 + ph // 2, r0 - 0.020), (480, r0)])
    keys(BONE[f"Hair{s}2"], "rotation", [(0, 0), (170 + ph, 0.050), (330 + ph // 2, -0.035), (480, 0)])
w_('</LinearAnimation>')

# the rest pose every Motion key starts from
w_(f'<LinearAnimation duration="1" fps="60" name="Rest" id="{ANIM_REST}">')
keys(BONE["Spine"], "rotation", [(0, UP)])
keys(BONE["Spine"], "y", [(0, sy)])
keys(BONE["Spine"], "scaleX", [(0, 1)])
keys(BONE["Spine"], "scaleY", [(0, 1)])
keys(BONE["Head"], "rotation", [(0, 0)])
for s in ("L", "R"):
    keys(BONE[f"Hair{s}1"], "rotation", [(0, HAIR[s][1] - UP)])
    keys(BONE[f"Hair{s}2"], "rotation", [(0, 0)])
w_('</LinearAnimation>')

# blink at 2.5 s, double blink at 6.3 s
w_(f'<LinearAnimation loopValue="loop" duration="{DUR}" fps="60" name="Blink" id="{ANIM_BLINK}">')
for lid in BLINKS:
    keys(lid, "opacity", [(0, 0), (150, 1), (158, 0), (378, 1), (384, 0), (392, 1), (398, 0)], hold=True)
w_('</LinearAnimation>')


def pose_anim(anim_id, name, body_pose, read, look, smile, closed, duration=1):
    w_(f'<LinearAnimation duration="{duration}" fps="60" name="{name}" id="{anim_id}">')
    w_(f'<KeyedObject objectId="{BODY_SOLO}"><KeyedProperty propertyKey="296">'
       f'<KeyFrameId value="{BODY[body_pose]}" frame="0" interpolationType="hold"/></KeyedProperty></KeyedObject>')
    for gid, val in ((GROUP["ReadFace"], read), (GROUP["LookFace"], look), (GROUP["SmileFace"], smile),
                     (GROUP["ClosedFace"], closed)):
        w_(f'<KeyedObject objectId="{gid}"><KeyedProperty property="opacity">'
           f'<KeyFrameDouble value="{val}" frame="0" interpolationType="hold"/></KeyedProperty></KeyedObject>')
    w_('</LinearAnimation>')


for k, (pose, *faces) in POSES.items():
    pose_anim(ANIM_POSE[k], f"Station {k}", pose, *faces)
pose_anim(ANIM_POKE, "Poke", "glasses", 0, 0, 0, 0, duration=84)   # hold the glasses beat for 1.4 s

w_('</Artboard></Rive>')
(HERE / "scene.rml").write_text("\n".join(out))
print(f"{len(verts)} vertices, {len(tris)} triangles per body; {len(out)} lines")
