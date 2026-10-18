# Weft demo video

`weft-demo.mp4` is a screen recording of the running app on the Black Drop case study, with captions. It is about two minutes long.

Regenerate it from a clean state:

```bash
cd web && pnpm seed && pnpm build && pnpm start -p 3000   # production build, no dev overlay
cd ../docs/demo && npm i playwright@1 && npx playwright install chromium
DEMO_OUT=./out DEMO_SHOTS=./shots node record-demo.mjs
ffmpeg -i out/*.webm -c:v libx264 -pix_fmt yuv420p -crf 23 -movflags +faststart weft-demo.mp4
```

`record-demo.mjs` drives the app in headless Chromium: the check-in, the delay call, a scenario applied, Ask, the brand map, day nine, the restock approved and received. It injects the captions and title cards into the page. Run it on a freshly seeded graph, because it assumes the Countdown state.
