# Best Brands — Enerjiden Güvene

Header and hero design prototype built with Three.js and Vite. Original Best Brands logos are sourced from the existing company website. No video, TURKA branding, analytics or tracking.

## Development

```sh
npm install
npm run dev -- --port 5173
npm run build
```

The production output is `dist/`. The existing company domain is not modified.

## Experience

The full-bleed story has exactly three scenes. Scene 1 (12s) starts at the real HDR sun and descends to panel absorption, close parallel flight and a climbing wide view. “Enerji dönüşümünü keşfet” starts scene 2 (11s) through collection, inverters, transformer leads and the grid. “Araç muayene istasyonlarına ilerle” starts scene 3 (16s): facade, three detailed inspection figures, real front brake geometry, continuous engine cutaway entry and tablet review. Every scene waits for a click at its end. Explicit restart returns in 4.6s. No optional detours, Sun photo overlay or white-screen cut. Cosine speed ramps preserve cruise and smooth endpoints. Mouse parallax and keyboard scene/pause controls remain. Desktop only; mobile work is deferred.

DC cables and light overlays share the same curves. Rays and key light align with Hausdorf Clear Sky's actual sun. PV absorption and conductor pulses live on the tilted panel material. Detailed Innerscene/MakeHuman source figures retain skin, hair and fabric textures; these are posed meshes with breathing deformation. Hood transparency reveals the authored engine and illustrative moving internal parts. This is explanatory visual storytelling, not an exact engineering simulation or a claim that this GES powers the station. Sources are in /credits.html and public/assets/people/LICENSE.md. BESTE/ESBİ logos retain their unobstructed fascia.

Navigation temporarily links to the relevant existing website pages pending the next project phase. The contact and investor URLs were checked against the source website. The English link leads to the existing English homepage; translating the new prototype is outside this first Turkish hero scope.

## Visual review

For repeatable review: ?time=0&still=1 (sun), ?time=4.7&still=1 (panels), ?time=18&still=1 (transformer), ?time=28.6&still=1 (brake check), ?time=32.3&still=1 (engine). window.heroReview and canvas data attributes support local review. The geographic alternative is deferred in ALTERNATIVES.md. The user's hermes/ backup is excluded from this source/deployment.

## Verification

Run `node --test src/cinema/scene-playback.test.js` to verify indefinite gate holds, click-only advancement, duplicate-click protection, monotonic scene timing and explicit restart. Production build and the complete three-scene desktop flow are checked in the browser, including keyboard activation and pause/resume. No new mobile verification in this phase. Low-end physical-device performance has not been measured.
