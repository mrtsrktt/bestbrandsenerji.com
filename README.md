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

The 24-second introductory story moves from solar generation to inspection and a shared infrastructure landscape. The final camera composition remains in place with subtle light and inspection activity. Chapter buttons select a scene. Pause and replay controls are available. Reduced motion begins with a static overview. A CSS fallback preserves the page when WebGL is unavailable. Mobile has a separate layout and lower render resolution.

Navigation temporarily links to the relevant existing website pages pending the next project phase. The contact and investor URLs were checked against the source website. The English link leads to the existing English homepage; translating the new prototype is outside this first Turkish hero scope.

## Visual review

For repeatable review, `?time=4&still=1`, `?time=14&still=1` and `?time=21&still=1` show paused scene frames. These do not appear in the normal interface. `window.heroReview` is available for local developer review.

## Verification

Production build, browser rendering, chapter selection, pause control, mobile navigation and 390-pixel mobile overflow were checked during implementation. Low-end physical-device performance has not been measured.
