# Animated History Studio

Create animated history shorts with **2D ink-outlined characters inside a real 3D scene**. This repository uses **Three.js / React Three Fiber / Remotion**. GitHub Actions renders MP4 in the cloud using software WebGL.

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
