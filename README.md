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

The full-bleed story has exactly three scenes. Scene 1 autoplays sunlight and photovoltaic generation (6.8s), then waits indefinitely for “Enerjinin dönüşümünü keşfet”. That click starts scene 2 through inverters, transformer, switching equipment and the grid (8.4s), then waits for “Güvene doğru ilerle”. This starts scene 3, continuously flying into the BESTE/ESBİ inspection hall and its vehicle measurement sequence (12.8s). The final scene waits for an explicit restart, with a 4.6s return flight to the opening. No automatic scene progression, optional detours, Sun photo overlay or white-screen sector transition. Quintic scene timing provides acceleration and deceleration with matching camera endpoints. Mouse position adds damped parallax. The single next-scene button and separate pause/resume control support keyboard activation. The small heading stays bottom-left and recedes during later scenes. Reduced motion slows the flight; a photo fallback preserves the page when WebGL is unavailable. This phase targets desktop only; mobile improvements and QA are deferred.

DC cables and energy overlays use the same CurvePath; photon endpoints use the panel's actual tilt transform. Light remains on cell geometry and real conductors. The visualization describes the process without claiming an electrical simulation or that this GES powers the station. Scanned Rock 07 models, textured terrain, curved curbs and fine verge grass add environmental detail. BESTE/ESBİ logos have a larger unobstructed fascia.

Navigation temporarily links to the relevant existing website pages pending the next project phase. The contact and investor URLs were checked against the source website. The English link leads to the existing English homepage; translating the new prototype is outside this first Turkish hero scope.

## Visual review

For repeatable review, `?time=1.5&still=1`, `?time=9&still=1`, `?time=14.5&still=1` and `?time=19&still=1` show paused frames. These do not appear in the normal interface. `window.heroReview` and canvas time/paused data attributes support local developer review. Asset attribution is available at /credits.html. The geographic alternative remains deferred in ALTERNATIVES.md.

## Verification

Run `node --test src/cinema/scene-playback.test.js` to verify indefinite gate holds, click-only advancement, duplicate-click protection, monotonic scene timing and explicit restart. Production build and the complete three-scene desktop flow are checked in the browser, including keyboard activation and pause/resume. No new mobile verification in this phase. Low-end physical-device performance has not been measured.
