# BẠCH ĐẰNG 938 — EXTENDED CUT V3 — PRODUCTION SPEC

## Purpose / fidelity

Develop a NEW 48-second, 9:16, 25fps historical cartoon short built with the actual
MIT-licensed \`mromidev/claude-animated-shorts\` toon/ink/grade engine.
Previous V2 is retained; V3 composition and video are separate.
Artwork is a dramatized **interpretation** of the Southern Han / Việt forces in AD 938,
not a verified reconstruction of precise ship dimensions, uniforms or face types.

Historical research:
- [National Museum of History (Vietnam)](https://baotanglichsu.vn/vi/Articles/3098/13934/ngo-quyen-va-chienthang-bach-dang-nam-938.html) — light boats feint and withdraw at high tide; stakes impale Southern Han hulls at ebb; Vietnamese ambush attacks.
- [Thăng Long Imperial Citadel](https://hoangthanhthanglong.vn/en/king-ngo-quyen-and-co-loa-royal-capital/) — tidal river and wooden stakes, flanking forces.
- [Institute of Nautical Archaeology](https://nauticalarch.org/projects/battle-of-bach-dang-research-project/) — study of local craft / river battlefield; does not confirm exact V3 ship silhouettes.

## Running time / shot list

| Time | Visual storytelling | Animation detail / camera |
| --- | --- | --- |
| 0–6s | Establishing Bạch Đằng, high tide, hidden stakes | Wide wide; strong teal river, river banks |
| 6–12s | Southern Han warship approaches | Port-side 3/4 tracking of a *CURVED* wooden hull, ribs, high bows, rowing |
| 12–18s | Việt light craft feints, retreats | Small oarcraft at outer flank, cloth colours and head-wraps readable |
| 18–24s | Tide ebb accelerates | Static stake field exposed by animated sea-level decline; not rising stakes |
| 24–31s | First then second hull impaled | Faces of bow-side hull physically absent, damaged interior and flying wood, white water |
| 31–39s | Water ingress, sinking | Water level rises inside boats; enemy hull settles, pitches and rolls |
| 39–45s | Việt boats return and counterattack | Both outer flank boats accelerate inward along safe corridors; arrows over water |
| 45–48s | Final tableau | Flanking boats, damaged ships and exposed stake barrier; 938 victory title |

## Locked geometry and historical safety

- Southern Han: 2 larger boats, beams 2.75, with raised curved prow/stern, 20 longitudinal hull stations, real V-shaped keel, rails, ribs, inner deck, oars, cloth banner.
- Việt: 2 small, shallow, light oarcraft, beams 1.72, separate safe flanks.
- Never produce a raft-like flat board or overlapping hulls.
- Four fixed X lanes -12.6 / -4.4 / +4.4 / +12.6; per-frame AABB clearance tests prevent boat interpenetration.
- Stakes are grouped at fixed riverbed positions; only the water plane falls.
- High tide ~ y=1.60; low tide ~ y=-0.65 between 18 and 29 s.
- Ship 1 damaged at 26.4 s, ship 2 at 29.8 s; sinking is gradual to retain a visible upper hull. Damaged hull uses geometry with missing side faces. No gore or injury closeups.
- Ships do not sink vertically instantly; damage → debris → inner flood → pitch/roll → slow descent.

## Costume silhouette

- Việt: wrapped headcloth, handwoven short cross-collar tunic, cloth waist sash, earth / indigo, commander dark vermilion with simple sash. No western-style coat, uniform shakos, European hats.
- Southern Han: low broad curved metal-like helmet, cheek guards, layered lamellar skirt and vest in charcoal/petrol, restrained brass accents. No Qing queues or anachronistic Ming court attire.
- Both use upstream Canvas2D \`bodyFront()\` / \`Pen\` figure style with SOLID cutout sprites (\`alphaTest .42\`, \`depthWrite:true\`). 
- This is broad era-inspired design, not definitive archaeological proof.

## Cinematography / finish

- 720×1280 Remotion composition; exported at 0.75 scale = **540×960**, H.264 MP4.
- Nine purposeful cinematic camera setups, including separate close views of both Vietnamese flanking boats.
- Saturated deep teal water, bronze sunset rim, brown wooden hulls, black ink outlines.
- \`InkPass\`, \`BloomEffect\`, neutral tone-map, \`GradeEffect\` directly reused.
- \`LensBlur\` purposely omitted: blacked out prior software-WebGL scenes.
- Original 48s deterministic stereo score and Foley (no copyrighted samples).

## Technical outputs / verification

- New source: \`src/videos/bach-dang/BachDangExtended.tsx\`
- New composition: \`BachDangExtended\` (48sec×25fps = 1200 frames)
- New audio: \`scripts/make_bach_dang_extended_audio.py\` writes \`public/audio/bach-dang-extended.wav\`
- GitHub Actions: \`Render Bach Dang 938 Extended V3\`.
- Preview multiple frames across action; auto-validate video file existence/size.
- After cloud render, extract MP4, sample scenes independently, verify H.264/AAC, inspect that enemy hull breaches and sinking are visible.

## Deferred realism

- No exact reconstruction of tenth-century vessel archeology is asserted.
- True volumetric water simulation, cloth solver and physically based fluid ingress are
  outside scope; deterministic rig animation and partial mesh damage simulate them.
- If independent visual inspection fails, the MP4 should be marked a preview/prototype, not a polished final cut.
