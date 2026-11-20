# Animated History Studio

Create animated history shorts with **2D ink-outlined characters inside a real 3D scene**. This repository uses **Three.js / React Three Fiber / Remotion**. GitHub Actions renders MP4 in the cloud using software WebGL.

## Bạch Đằng 938 — Extended Cut V3 (48 seconds)

This is a new **48-second cinematic story**, rendered by Three.js + Remotion with the
actual upstream animated-shorts toon, ink and grading engine. It replaces raft-like
flat boards with curved-section hulls, raised prow/stern, V keels, ribs, decks,
oars, a true missing-panel hull breach, animated floating splinters, flooding,
slow ship sinking, tidal ebb exposing static iron-tipped stakes, and a Việt small
boat counterattack.

**[Full Production Specification](docs/BACH_DANG_EXTENDED_V3_SPEC.md)**

**GitHub Actions:** `Render Bach Dang 938 Extended V3`
creates `bach-dang-938-extended-v3`, including an actual MP4
`Bach_Dang_938_Extended_V3.mp4` plus keyframe preview images.

```bash
python3 scripts/make_bach_dang_extended_audio.py
npm install
npx remotion render src/index.ts BachDangExtended out/Bach_Dang_938_Extended_V3.mp4 --gl swangle --scale 0.75 --concurrency 1 --crf 18
```

This stylized film is not an exact tenth-century archaeological reconstruction.

## New film: BẠCH ĐẰNG 938 (Ngô Quyền versus the Southern Han fleet)

### Bạch Đằng V2 — historical costume / no ship overlap

- Redesigned **all four boats**: 2 Southern Han boats in separate central lanes,
  2 Vietnamese boats along the outer river channels. Guaranteed side clearance
  at **every frame** with an in-scene collision assertion.
- Replaced the reference rig's Napoleonic **shako** with original painted
  helmet/lamellar details for Southern Han and wrapped headcloths/cross-front
  tunics for Việt forces, using the **actual 600×1000 drawing coordinates** from
  the upstream toon bodyFront renderer. These are interpretive 10th-century
  costumes, **not authenticated reconstructions**.
- Opaque alpha-tested character cutouts with depth buffering remain enabled.
- Wooden stakes are fixed to the riverbed and become visible as the water recedes.
- GitHub Actions workflow **Render Bach Dang 938 V2 — historical costumes and ship spacing**
  exports `Bach_Dang_938_V2.mp4` in artifact `bach-dang-938-v2-film`.



**A new original 24-second cinematic story; not the source Bridge sample.**

Render with GitHub Actions → **Render Bach Dang 938 — original film**.
The render uses the actual MIT-licensed `mromidev/claude-animated-shorts` artistic engine:
`bodyFront` and `Pen` for 2D walk/pose animation on Three.js ships,
`InkPass` for environment ink contours, `GradeEffect`, bloom and tone mapping.
The scene and score are completely new. `LensBlur` is intentionally omitted due
to a known software WebGL incompatibility in our previous Pompeii scene.

Style enhancements relative to the previous movie: hard alpha-tested character
cutouts with `depthWrite: true` (no translucent faces or torsos), stronger
value separation, saturated teal water and dark brown ships, deeper ink lines,
five purposeful camera angles, animated oarsmen, waving flags, tidal recession,
fixed wooden stakes exposed by receding water, boats that advance and then tilt,
contact shadows, water wakes and a dramatic final title.

Video: 24s, 25fps, 9:16, 540x960 output on cloud runner.
`src/videos/bach-dang/BachDang938.tsx` is the new film source.
`scripts/make_bach_dang_audio.py` produces original music/SFX and
`.github/workflows/bach-dang.yml` renders MP4 and shot previews.
Historical setup: **Bạch Đằng, late AD 938**, led by Ngô Quyền against
the Southern Han fleet. The story simplifies details for visual narration.

## New original short: POMPEII — The Last Delivery (AD 79)

This is **not** a re-render of BridgeShort and **not** a collection of still images.
New story and staging: a Roman baker carries bread through a bustling street; the
ground shakes, Vesuvius erupts, ash falls, roof tiles drop, and townspeople flee.
The 20-second animated short has six original shots, deterministic character motion
and hand-synthesized original music/SFX. It avoids the historically inaccurate image
of red lava flowing down Pompeii's streets.

Source: `src/videos/pompeii-adapted/PompeiiAdapted.tsx`. It directly imports and
uses these MIT-licensed components of the original
`mromidev/claude-animated-shorts` repository:
- `bodyFront`, `Pen` and `Outfit` from `upstream/bridge/toon.ts`
  (real walking/expressions/blinking, not a still-card pan);
- `NOINK` and `InkPass` from `upstream/bridge/ink.ts` (3D geometry outlines);
- `LensBlur` from `upstream/bridge/lensblur.ts` (available but temporarily disabled in the final effect chain: software WebGL rendered this pass as black in the new scene);
- `GradeEffect` and `gradeFor` from `upstream/bridge/grade.ts`;
- `twoTone` from `upstream/bridge/shade.ts`;
- `EffectComposer`, `BloomEffect` and `ToneMappingEffect` in the original
  ink → bloom → tone → grade order (lens pass omitted for compatibility).

**Run on GitHub:** Actions → **Render ORIGINAL-story Pompeii (upstream style)** →
Run workflow → download `pompeii-new-story-upstream-engine` artifact after success.

Local render (480? no; the composition is 500 frames at 25fps, 720x1280 source,
360x640 rendered at 0.5 scale for software WebGL):
```bash
python3 scripts/make_pompeii_adapted_audio.py
npm install
npm run render:pompeii:adapted
```

This is an original **20-second proof-of-style short** (25fps, 360x640 in GitHub Actions), not the polished 67-second
Bridge sample and not a ready-to-publish full film with narration.
To improve production quality next, add Kenney Nature Kit scenery, voice-over,
more animation beats, higher render resolution, and frame-by-frame QC.

## Render the ORIGINAL `mromidev/claude-animated-shorts` BridgeShort

The original MIT-licensed Bridge source files (camera keys, 2D character rig, 3D world,
custom ink lines, thin-lens blur, bloom and grading) are checked in under
[`upstream/bridge/`](upstream/bridge/). Our `BridgeTemplate` composition invokes
`BridgeShort` from `upstream/bridge/Bridge.tsx` **directly**; the wrapper at
`src/videos/bridge/BridgeWithMusic.tsx` only adds a new soundtrack. The upstream
Bridge.tsx contains a local `@ts-nocheck` compatibility line to handle a type
mismatch in optional `EffectComposer` children; its rendering logic is otherwise intact.

**GitHub Actions:** Open **Actions → Render original bridge template (smoke test) → Run workflow**.
It creates a reference still and renders a 4-second excerpt to MP4. Download the
`original-bridge-template-preview` artifact. The short preview is intentional:
the complete 67.5-second upstream film, with many software-WebGL effects, can be
resource intensive on a GitHub-hosted runner.

**Original Kenney Nature Kit assets:** the upstream project references
`public/bridge/kenney/*.glb`, but the source template ZIP does not include
those binary models. The renderer catches failed asset loads, so the test
can run without them, but some trees/props will be missing. Obtain relevant
CC0 models from [Kenney Nature Kit](https://kenney.nl/assets/nature-kit)
and place them at that path for closer fidelity.

To render the full Bridge original locally (or edit a dedicated full-length
GitHub workflow), after running `python3 scripts/make_bridge_audio.py`:
```bash
npx remotion render src/index.ts BridgeTemplate out/bridge_full.mp4 \
  --codec h264 --gl swangle --concurrency 1 --crf 20 \
  --scale 0.5 --props='{"post":{"dpr":0.5}}'
```

The original creator's private-study reference frames are **not** included
or redistributed. The full Bridge example is the original example story,
**not** an original Pompeii animation created for this project.

## What is here
- `src/videos/pompeii/`: original **Pompeii, AD 79** animated demo (24s, vertical 720x1280, 24 fps).
- `upstream/bridge/`: exact MIT-licensed TypeScript template source from [mromidev/claude-animated-shorts](https://github.com/mromidev/claude-animated-shorts) for reference. `toon.ts` is reused in our scene for its drawing API.
- `upstream/SKILL.md`, `upstream/STYLE_BIBLE.md`: upstream instructions for extending the look.
- `scripts/make_audio.py`: deterministic original synth score and effects, generated without paid services.
- `.github/workflows/render.yml`: render and upload MP4 + still as Actions artifacts.

## Generate MP4 on GitHub
Go to **Actions → Render animation → Run workflow** (the workflow also triggers when main changes).
1. GitHub installs npm dependencies and creates `public/audio/pompeii.wav`.
2. It uses Chromium with `--gl=swangle` (software rendering, no GPU required).
3. It renders a still preview, then the 24-second `PompeiiShort` composition, exports `out/pompeii.mp4`.
4. Download **pompeii-animation** artifact from the completed workflow run.

The starter is **code-based animation, not stitched AI images**. Figures, limbs, particles, camera, lighting and the volcano are posed on every frame. It is a *technical proof of concept*, not a finished full-quality short or a claim to reproduce the source's polished 67-second bridge film.

## Run locally
Requires Node 22, Python 3 and Chromium availability.
```bash
npm install
npm run audio
npm run studio
npm run render
```
Default output: `out/pompeii.mp4`. You can edit `src/videos/pompeii/` and rerun.

## Attribution
Based on the visual/code architecture of **mromidev/claude-animated-shorts**, MIT licensed. Source license is preserved in `upstream/LICENSE`. Their reference frames are not copied: those are marked study-only. Our Pompeii scene and audio are original.

This animation is a dramatization of the eruption of Mount Vesuvius in AD 79. Ash and pumice, not street-level lava.
