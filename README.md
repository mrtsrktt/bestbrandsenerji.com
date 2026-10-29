# Best Brands — Enerjiden Güvene

Header and hero design prototype built with Three.js and Vite. Original Best Brands logos are sourced from the existing company website. No video, TURKA branding, analytics or tracking.

## Development

```sh
npm install
npm run dev -- --port 5173
npm run build
```

The production output is `dist/`. The existing company domain is not modified.

For desktop client review, build once and run `npm run preview -- --port 4173 --strictPort`. This serves the production build without the Vite HMR client. Use http://127.0.0.1:4173/ for review; the development server at 5173 remains available for the separate hermes/ alternative. Source edits do not reset the 4173 scene clock.

## Experience

The full-bleed story has exactly three scenes. Scene 1 (12s) starts at the real HDR sun and descends to panel absorption, close parallel flight and a climbing wide view. “Enerji dönüşümünü keşfet” starts scene 2 (11s) through collection, inverters, transformer leads and the grid. “Araç muayene istasyonlarına ilerle” starts scene 3 (16s): facade, three detailed inspection figures, real front brake geometry, continuous engine cutaway entry and tablet review. Every scene waits for a click at its end. Explicit restart returns in 4.6s. No optional detours, Sun photo overlay or white-screen cut. Cosine speed ramps preserve cruise and smooth endpoints. Mouse parallax and keyboard scene/pause controls remain. Desktop only; mobile work is deferred.

DC cables and light overlays share the same curves. Rays and key light align with Hausdorf Clear Sky's actual sun. PV absorption and conductor pulses live on the tilted panel material. Detailed Innerscene/MakeHuman source figures retain skin, hair and fabric textures; these are posed meshes with breathing deformation. Hood transparency reveals the authored engine and illustrative moving internal parts. This is explanatory visual storytelling, not an exact engineering simulation or a claim that this GES powers the station. Sources are in /credits.html and public/assets/people/LICENSE.md. BESTE/ESBİ logos retain their unobstructed fascia.

Navigation temporarily links to the relevant existing website pages pending the next project phase. The contact and investor URLs were checked against the source website. The English link leads to the existing English homepage; translating the new prototype is outside this first Turkish hero scope.

## Visual review

For repeatable review: ?time=0&still=1 (sun), ?time=4.7&still=1 (panels), ?time=18&still=1 (transformer), ?time=28.6&still=1 (brake check), ?time=32.3&still=1 (engine). window.heroReview and canvas data attributes support local review. The geographic alternative is deferred in ALTERNATIVES.md. The user's hermes/ backup is excluded from this source/deployment.

## Verification

Run `node --test src/cinema/scene-playback.test.js src/cinema/flight-sampler.test.js` for gate holds, explicit-target advancement, stale/duplicate-click rejection, continuous camera velocity and finite engine close-ups. The camera uses derivatives in real seconds and normalized aim directions, avoiding the distant Sun target's overshoot into the panel shot.

Performance: fixed point/spot light membership, fixed transparent material variants, reflective glazing without a transmission re-render, native desktop render resolution, cached sector shadows, no timed GTAO/Bokeh pass activation, and no repeated full rendering while waiting/paused. Hidden crew/engine materials compile asynchronously; representative frames upload all geometry/textures before the loading cover clears. A nonblocking GPU fence drains the warm-up queue before autoplay. This preparation is intentionally part of loading rather than the shot transitions.

Canvas data-prewarmed, data-baseline-programs, data-programs, data-advances and data-profile expose review diagnostics; profile records per-scene frame interval count, p95, max and frames over 100ms. data-instance on the hero verifies that a button click did not reload the document. These are local debug attributes, not analytics. Actual results are specific to the review machine; physical low-end devices and mobile are not newly tested.

Desktop production-preview run (1440×900, 2026-10-29): all three scenes completed with one unchanged document instance; shader programs stayed at the warmed baseline of 100. Frame-interval p95 was 10.0 / 10.0 / 10.1ms and maximum was 15.1 / 80.2 / 40.0ms; no frame exceeded 100ms. Console had no warnings/errors. This is an observed run on this machine, not a universal frame-rate guarantee. Nine playback/camera tests pass.
