# Weft demo video

`weft-demo.mp4` (about 3½ minutes) explains the problem and the solution with infographics, walks through the running app on the Black Drop case study, and maps each FalkorDB feature to where the app uses it. Every scene is captioned.

Regenerate it from a clean state:

```bash
cd web && pnpm seed && pnpm build && pnpm start -p 3000      # production build, no dev overlay
cd ../docs && python3 -m http.server 8777 &                  # the infographic scenes load from docs/
cd demo && npm i playwright@1 && npx playwright install chromium
BASE=http://localhost:3000 DOCS=http://127.0.0.1:8777 DEMO_OUT=./out DEMO_SHOTS=./shots node record-demo.mjs
ffmpeg -i out/*.webm -c:v libx264 -pix_fmt yuv420p -crf 23 -movflags +faststart weft-demo.mp4
```

Run it on a freshly seeded graph: the walkthrough assumes the Countdown state.
