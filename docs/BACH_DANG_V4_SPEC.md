# Bạch Đằng 938 — V4 Fleet & Water QA Specification

## Objectives
- Correct **three** large Southern Han sail warships and **two** medium Han escorts;
  add **six** small Vietnamese rowing boats = **eleven boats total**.
- Larger hull silhouettes, high raised prows/sterns, deep V-keel, curved gunwales,
  horizontal timber ribs, full tall masts and visibly battened cloth sails.
- Correct the visible-water-through-boat defect. The external river surface
  uses an opaque depth-writing MeshPhongMaterial with a per-vessel GLSL cutout
  mask. Interior flooding is a **separate** water plane appearing only after a
  breach; transparent ripples are hidden if they intersect any hull's footprint.
- Preserve the V3 story, original 48-second soundtrack, period-inspired
  Việt/Nam Hán costumes, historical ebb exposing fixed stakes and
  damaged/sinking hull animations.

## Fleet layout / collision policy
Southern Han: 3 large ships at x=-8.5, 0, +8.5; two escorts at
x=-16.3 and +16.3. Việt: two leading small boats at -21.6 and +21.6,
four more appear during the counterattack at x=-26.1,+26.1,-21.6,+21.6,
with staggered Z approach. Pairwise collision invariant: no two
hull rectangles overlap after a 1.2-world-unit safety margin.
Each boat is shaded by a dedicated oval mask on the river surface.

## Nine review checkpoints
- f45: fleet establishing shot, count ship silhouette and sail masts
- f185: view of raised wooden hull, sails & rowing details
- f320: Vietnamese fast river boats
- f485: receding tide, hidden stake barrier revealed
- f660: first large ship's hull breach
- f755: second ship / more deep-water action
- f905: damaged ship sinking with *inside* flooding only
- f1040: Vietnamese small boats emerge from flank
- f1170: final victory wide view

## Deliverable
Remotion composition \`BachDangV4\`, 48 s at 25 fps; source 720x1280,
cloud export 540x960 H.264 MP4 with original stereo AAC.
Film references upstream ink, grade and 2D canvas toon actors and
does **not** claim exact historical reconstruction of 10th-century warships.
