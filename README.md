# מפת צירי זמן — Timelines Map

World map + zoomable timeline: pick layers of historical events, dive through
time, see what happened where. Hebrew UI, mobile-first, static site.

```sh
npm ci
npm run dev      # http://localhost:5173
npm run check    # typecheck, lint, story coverage, unit, build, browser tests
```

- Layers live in `data/layers/*.json` — see `CLAUDE.md` § "Adding a layer".
- Behavior: `STORIES.md`. Design: `docs/superpowers/specs/`.
- Deploys to GitHub Pages on push to `master`.

Built from a vibe-coding template; process rules are in `CLAUDE.md`.
