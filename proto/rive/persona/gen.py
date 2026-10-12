"""Generate scene.rml for the persona standing at the hatch.

Artboard is 200x320, feet at y=300. Draw order in Rive: the first declared
child paints on top, so every group lists front-most items first.
"""
import math

_next = [100]


def nid():
    _next[0] += 1
    return f"0:{_next[0]}"


INK = "FF0B0C10"
COAT = "FF1A1C23"
HAIR = "FF14161C"
RIM = "FFB9CFFF"
SKIN = "FF4A3F4C"


def ease(x1=0.42, y1=0, x2=0.58, y2=1):
    return f'<CubicEaseInterpolator x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}"/>'


def verts(points, ids=None):
    """points: (x, y) straight, or (x, y, angle_deg, dist) smooth mirrored."""
    out = []
    for i, p in enumerate(points):
        vid = f' id="{ids[i]}"' if ids and ids[i] else ""
        if len(p) == 2:
            out.append(f'<StraightVertex x="{p[0]}" y="{p[1]}"{vid}/>')
        else:
            out.append(f'<CubicMirroredVertex x="{p[0]}" y="{p[1]}" rotation="{math.radians(p[2]):.4f}" distance="{p[3]}"{vid}/>')
    return "\n".join(out)


def fill(c):
    return f'<Fill><SolidColor colorValue="{c}"/></Fill>'


def stroke(c, w, cap="round"):
    return f'<Stroke thickness="{w}" cap="{cap}" join="round"><SolidColor colorValue="{c}"/></Stroke>'


def shape(name, points, paints, closed=True, cw=True, ids=None, sid=None, opacity=None):
    i = f' id="{sid}"' if sid else ""
    o = f' opacity="{opacity}"' if opacity is not None else ""
    return (f'<Shape name="{name}"{i}{o}><PointsPath isClosed="{str(closed).lower()}" isClockwise="{str(cw).lower()}">'
            f'{verts(points, ids)}</PointsPath>{paints}</Shape>')


def keys(obj, prop, frames, cubic=True):
    kf = []
    for f, v in frames:
        if cubic:
            kf.append(f'<KeyFrameDouble frame="{f}" value="{v}" interpolationType="cubic">{ease()}</KeyFrameDouble>')
        else:
            kf.append(f'<KeyFrameDouble frame="{f}" value="{v}" interpolationType="linear"/>')
    return f'<KeyedObject objectId="{obj}"><KeyedProperty property="{prop}">{"".join(kf)}</KeyedProperty></KeyedObject>'


# ---- ids we animate ----
BODY, HEAD_LOOK, HEAD_IDLE, HAIR_SHIFT, CHEEK, HIT = (nid() for _ in range(6))
hair_tip_l, hair_tip_r = nid(), nid()
hem = [nid() for _ in range(5)]

# ---- geometry ----
hair_pts = [(58, 102), (60, 50, -84, 22), (100, 22, 0, 27), (140, 50, 84, 22), (143, 100),
            (133, 95), (124, 103), (113, 96), (101, 104), (89, 96), (78, 103), (68, 95)]
hair_ids = [hair_tip_l, None, None, None, hair_tip_r] + [None] * 7

hem_pts = [(52, 240), (76, 246), (100, 248), (124, 246), (148, 240)]
coat_pts = [(88, 106), (66, 120, 200, 10), (58, 180, 95, 30)] + hem_pts + [(142, 180, -85, 30), (134, 120, 160, 10), (112, 106)]
coat_ids = [None, None, None] + hem + [None, None, None]

head = f'''
<Node name="HeadLook" id="{HEAD_LOOK}" x="100" y="104">
 <Node name="HeadIdle" id="{HEAD_IDLE}">
  <Node name="Offset" x="-100" y="-104">
   <Node name="HairShift" id="{HAIR_SHIFT}">
    {shape("HairRim", [(126, 30, 30, 8), (141, 56, 86, 15), (143, 98)], stroke(RIM, 2.5), closed=False)}
    {shape("HairRimL", [(66, 38, 120, 6), (60, 60, 95, 10), (59, 96)], stroke(RIM, 1.5), closed=False, opacity=0.5)}
    {shape("HairStrands3", [(72, 44), (70, 74, 95, 12), (72, 98)], stroke(INK, 2), closed=False)}
    {shape("HairStrands4", [(127, 40), (129, 70, 85, 12), (126, 99)], stroke(INK, 2), closed=False)}
    {shape("HairStrands", [(86, 36), (84, 70, 95, 14), (86, 96)], stroke(INK, 2), closed=False)}
    {shape("HairStrands2", [(112, 32), (114, 66, 88, 14), (112, 96)], stroke(INK, 2), closed=False)}
    {shape("Hair", hair_pts, fill(HAIR) + stroke(INK, 3.5), ids=hair_ids)}
   </Node>
   <Node name="Cheek" id="{CHEEK}" opacity="0">
    {shape("GlassGlint", [(150, 55), (152, 66)], stroke("FFF0C98A", 2), closed=False)}
    {shape("GlassLens", [(147, 53), (153, 52), (152, 68), (148, 69)], fill("FF8A5A2C") + stroke(INK, 2))}
    {shape("GlassArm", [(118, 64), (148, 59)], stroke("FF6E4422", 3), closed=False)}
    {shape("CheekRim", [(146, 56), (153, 74, 92, 9), (147, 92)], stroke("FFD6E0FF", 2.5), closed=False)}
    {shape("CheekSkin", [(126, 50), (142, 50, 10, 8), (153, 72, 92, 11), (146, 92, 125, 8), (132, 102), (124, 100)], fill(SKIN) + stroke(INK, 2.5))}
   </Node>
   {shape("Neck", [(93, 92), (107, 92), (107, 114), (93, 114)], fill(INK))}
  </Node>
 </Node>
</Node>'''

body = f'''
<Node name="Body" id="{BODY}" x="100" y="240">
 <Node name="BodyOffset" x="-100" y="-240">
  {head}
  {shape("ArmL", [(68, 128), (60, 180, 95, 20), (62, 222)], stroke(INK, 11), closed=False)}
  {shape("ArmR", [(132, 128), (140, 180, 85, 20), (138, 222)], stroke(INK, 11), closed=False)}
  {shape("CoatRimR", [(134, 122), (142, 180, 85, 30), (148, 240)], stroke(RIM, 3.5), closed=False)}
  {shape("CoatRimL", [(66, 122), (58, 180, 95, 30), (52, 240)], stroke(RIM, 2), closed=False, opacity=0.55)}
  {shape("Seam", [(100, 116), (100, 246)], stroke(INK, 2.5), closed=False)}
  {shape("Coat", coat_pts, fill(COAT) + stroke(INK, 4), cw=False, ids=coat_ids)}
 </Node>
</Node>'''

legs = f'''
{shape("BootL", [(80, 290), (98, 290), (98, 300), (78, 300)], fill(INK))}
{shape("BootR", [(102, 290), (120, 290), (122, 300), (102, 300)], fill(INK))}
{shape("LegL", [(84, 238), (96, 238), (97, 292), (83, 292)], fill("FF12141A") + stroke(INK, 3))}
{shape("LegR", [(104, 238), (116, 238), (117, 292), (103, 292)], fill("FF12141A") + stroke(INK, 3))}
<Shape name="Shadow" x="100" y="300" opacity="0.5"><Ellipse width="150" height="14"/>{fill(INK)}</Shape>'''

# transparent hit area covering the figure
hit = f'<Shape name="Hit" id="{HIT}" x="100" y="165"><Rectangle width="110" height="280"/><Fill><SolidColor colorValue="00000000"/></Fill></Shape>'

# ---- animations ----
IDLE, REST, LOOK = nid(), nid(), nid()
idle = [keys(BODY, "scaleY", [(0, 1), (120, 1.013), (240, 1)]),
        keys(HEAD_IDLE, "rotation", [(0, 0), (90, 0.018), (240, 0)])]
# hair tips + coat hem drift in the draught from the hatch, out of phase
for k, (vid, base) in enumerate([(hair_tip_l, 58), (hair_tip_r, 143)]):
    d = 2.2 if k else -2.2
    idle.append(keys(vid, "x", [(0, base), (80 + k * 30, base + d), (240, base)]))
for k, (vid, (bx, _)) in enumerate(zip(hem, hem_pts)):
    ph = 40 * k
    idle.append(keys(vid, "x", [(0, bx), (min(60 + ph, 200), bx + 2.5), (240, bx)]))

look = [keys(HEAD_LOOK, "rotation", [(0, 0.09)]), keys(HEAD_LOOK, "x", [(0, 103)]),
        keys(HAIR_SHIFT, "x", [(0, -6)]), keys(CHEEK, "opacity", [(0, 1)])]
rest = [keys(HEAD_LOOK, "rotation", [(0, 0)]), keys(HEAD_LOOK, "x", [(0, 100)]),
        keys(HAIR_SHIFT, "x", [(0, 0)]), keys(CHEEK, "opacity", [(0, 0)])]

VM, VM_HOVER, VM_INST = "0:40", "0:41", "0:42"
BIND = f'{VM}-{VM_HOVER}'


def cond(v):
    return (f'<TransitionViewModelCondition opValue="equal"><TransitionPropertyViewModelComparator>'
            f'<BindablePropertyBoolean><DataBindContext sourcePathIds="{BIND}" propertyKey="634"/></BindablePropertyBoolean>'
            f'</TransitionPropertyViewModelComparator><TransitionValueBooleanComparator value="{str(v).lower()}"/></TransitionViewModelCondition>')


def listener(kind, v):
    return (f'<StateMachineListenerSingle targetId="{HIT}" listenerTypeValue="{kind}" name="{kind}">'
            f'<ListenerViewModelChange><BindablePropertyBoolean propertyValue="{str(v).lower()}">'
            f'<DataBindContext sourcePathIds="{BIND}" propertyKey="634" direction="true"/>'
            f'</BindablePropertyBoolean></ListenerViewModelChange></StateMachineListenerSingle>')


S_IDLE, S_REST, S_LOOK = nid(), nid(), nid()
sm = f'''
<StateMachine name="Persona" id="0:7">
 {listener("enter", True)}
 {listener("exit", False)}
 <StateMachineLayer name="Idle" id="{nid()}">
  <AnyState x="300" y="-120"/><ExitState x="500" y="-120"/>
  <EntryState><StateTransition stateToId="{S_IDLE}"/></EntryState>
  <AnimationState x="160" animationId="{IDLE}" id="{S_IDLE}"/>
 </StateMachineLayer>
 <StateMachineLayer name="Look" id="{nid()}">
  <AnyState x="300" y="-120"/><ExitState x="500" y="-120"/>
  <EntryState><StateTransition stateToId="{S_REST}"/></EntryState>
  <AnimationState x="160" animationId="{REST}" id="{S_REST}">
   <StateTransition stateToId="{S_LOOK}" duration="550" interpolationType="cubic">{ease(0.3, 0, 0.2, 1)}{cond(True)}</StateTransition>
  </AnimationState>
  <AnimationState x="360" animationId="{LOOK}" id="{S_LOOK}">
   <StateTransition stateToId="{S_REST}" duration="800" interpolationType="cubic">{ease(0.4, 0, 0.2, 1)}{cond(False)}</StateTransition>
  </AnimationState>
 </StateMachineLayer>
</StateMachine>'''

anims = (f'<LinearAnimation loopValue="loop" duration="240" name="Idle" id="{IDLE}">{"".join(idle)}</LinearAnimation>'
         f'<LinearAnimation duration="1" name="Rest" id="{REST}">{"".join(rest)}</LinearAnimation>'
         f'<LinearAnimation duration="1" name="Look" id="{LOOK}">{"".join(look)}</LinearAnimation>')

doc = f'''<Rive version="1" kind="fragment">
<Artboard defaultStateMachineId="0:7" viewModelId="{VM}" styleId="0:5" width="200" height="320" name="Persona" id="0:2">
 <LayoutComponentStyle name="Artboard Style" id="0:5"/>
 {hit}
 {body}
 {legs}
 {sm}
 {anims}
</Artboard>
<ViewModel defaultInstanceId="{VM_INST}" name="Persona" id="{VM}">
 <ViewModelPropertyBoolean name="hover" id="{VM_HOVER}"/>
 <ViewModelInstance exports="true" name="Instance" id="{VM_INST}">
  <ViewModelInstanceBoolean propertyValue="false" viewModelPropertyId="{VM_HOVER}"/>
 </ViewModelInstance>
</ViewModel>
</Rive>
'''

open("scene.rml", "w").write(doc)
print("ok")
