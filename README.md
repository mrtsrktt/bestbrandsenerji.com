# Best Brands — Enerjiden Güvene

Header and hero design prototype built with Three.js, GSAP and Vite. Original Best Brands logos are sourced from the existing company website. No video, TURKA branding, analytics or tracking.

## Development

```sh
npm install
npm run dev -- --port 5173
npm run build
```

The production output is `dist/`. The existing company domain is not modified.

## Experience

The full-bleed 26-second base story shows incoming sunlight over photovoltaic cells, follows collected energy through inverters, transformer, switching equipment and the grid, then follows a measurement wave continuously into the BESTE/ESBİ inspection hall. No white-screen sector transition or Sun photo overlay. Autoplay and loop remain; clicking now enters contextual close-up journeys rather than pausing. Users can join collection, inspect energy conversion, follow the grid or examine vehicle measurement. Camera detours join the current pose and return to the exact continuing film pose. Mouse position adds damped parallax. A separate round button pauses/resumes; a return button rejoins the film smoothly. Hotspots and controls support keyboard activation. The small heading stays bottom-left and recedes during close-ups. Reduced motion slows the flight; a photo fallback preserves the page when WebGL is unavailable. This phase targets desktop only; mobile improvements and QA are deferred.

DC cables and energy overlays use the same CurvePath; photon endpoints use the panel's actual tilt transform. Light remains on cell geometry and real conductors. The visualization describes the process without claiming an electrical simulation or that this GES powers the station. Scanned Rock 07 models, textured terrain, curved curbs and fine verge grass add environmental detail. BESTE/ESBİ logos have a larger unobstructed fascia.

Navigation temporarily links to the relevant existing website pages pending the next project phase. The contact and investor URLs were checked against the source website. The English link leads to the existing English homepage; translating the new prototype is outside this first Turkish hero scope.

## Visual review

For repeatable review, `?time=1.5&still=1`, `?time=9&still=1`, `?time=14.5&still=1` and `?time=19&still=1` show paused frames. These do not appear in the normal interface. `window.heroReview` and canvas time/paused data attributes support local developer review. Asset attribution is available at /credits.html. The geographic alternative remains deferred in ALTERNATIVES.md.

## Verification

Production build, desktop browser interactions, pause/resume, and camera route entry/exit continuity are checked during implementation. No new mobile verification in this phase. Low-end physical-device performance has not been measured.
