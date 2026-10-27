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

The full-bleed 26-second story shows incoming sunlight over photovoltaic cells, follows collected energy through inverters, transformer, switching equipment and the grid, then follows a free measurement wave continuously into the BESTE/ESBİ inspection hall. There is no white-screen sector transition or Sun photo overlay. It starts automatically and loops. Click the scene to pause/resume; Enter/Space also work. No visible start/play button. The only hero text is a small heading at bottom-left. Reduced motion slows the flight; a photo fallback preserves the page when WebGL is unavailable. Mobile uses a wider field of view and lower render resolution. Desktop adds contact ambient occlusion.

Navigation temporarily links to the relevant existing website pages pending the next project phase. The contact and investor URLs were checked against the source website. The English link leads to the existing English homepage; translating the new prototype is outside this first Turkish hero scope.

## Visual review

For repeatable review, `?time=1.5&still=1`, `?time=9&still=1`, `?time=14.5&still=1` and `?time=19&still=1` show paused frames. These do not appear in the normal interface. `window.heroReview` and canvas time/paused data attributes support local developer review. Asset attribution is available at /credits.html. The geographic alternative remains deferred in ALTERNATIVES.md.

## Verification

Production build and desktop/mobile browser rendering are checked during implementation, including autoplay, click-to-pause/resume and loop timing. Low-end physical-device performance has not been measured.
