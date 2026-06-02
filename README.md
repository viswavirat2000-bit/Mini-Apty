# Mini Apty (monorepo)

Mini Apty is a small Digital Adoption Platform prototype: a Chrome Manifest V3 extension for authoring and playing walkthroughs, and a Node.js backend with SQLite persistence and JWT auth.

Workspace layout
- `Mini_Apty/extension` — Chrome extension (React popup, content script, MV3 service worker)
- `Mini_Apty/backend` — Express + TypeScript API with SQLite

Quick prerequisites
- Node.js 18+ (for local builds)
- Docker & Docker Compose (optional — recommended for running backend cleanly)

Local dev (quick)
1. Install dependencies at repo root (pnpm recommended):

```bash
pnpm -w install
```

2. Run backend locally (dev):

```bash
cd Mini_Apty/backend
# copy .env.example -> .env and edit JWT_SECRET if desired
npm run dev
```

3. Run extension dev (Vite):

```bash
cd Mini_Apty/extension
npm run dev
# build for production (dist) when ready: npm run build
```

4. Load the extension in Chrome (unpacked): open `chrome://extensions`, enable Developer mode, and load the `Mini_Apty/extension/dist` directory.

Run backend in Docker (recommended)

```bash
# at repo root
docker compose up --build
# backend will be available at http://localhost:4000
```

Environment
- See `Mini_Apty/backend/.env.example` for the minimal variables required: `JWT_SECRET`, `DATABASE_URL`, `PORT`.

What is implemented
- Author mode: start/stop capture, highlight elements, persist pending steps to `chrome.storage.local`, edit titles and descriptions in popup, save walkthroughs to backend (origin + path pattern)
- Playback/preview: loads saved walkthroughs, anchors balloon UI to resolved target, supports next/prev/stop, persists playback progress to backend
- Backend: Express + SQLite, JWT auth, password hashing with bcrypt, walkthrough CRUD with owner authorization
- Offline/caching: popup caches relevant walkthroughs per origin+path in `chrome.storage.local` for offline playback
- SPA-friendly: content script detects SPA route changes and restores capture/playback state

Known limitations / trade-offs
- Targeting: uses `id`, generated CSS selector, `data-*` attributes and text fallback. This is pragmatic but not as robust as a full multi-factor semantic resolver (no `aria-label`/`name` anchors or advanced heuristics yet).
- In-page UI: the capture/playback overlay is DOM-based in the content script rather than an injected React component; simpler and smaller but less structured.
- Error handling: API errors are surfaced in the popup, but there is no React Error Boundary implemented yet.
- Docker: SQLite is used for simplicity. For production or multi-user testing, swap to Postgres (not included).

Next recommended improvements (low effort → high impact)
- Add `aria/name` and relative-label heuristics to `content.ts` target collection
- Add React Error Boundary in `Mini_Apty/extension/src/popup.tsx`
- Add `.env` support and `.env.example` (added) and Docker Compose (added)
- Add integration tests and a short demo video showing author → playback on a public page

Repro steps to demo (5 minutes)
1. Start backend (Docker or `npm run dev`). Ensure backend at `http://localhost:4000`.
2. Build the extension: `cd Mini_Apty/extension && npm run build`.
3. Load unpacked extension from `Mini_Apty/extension/dist` in Chrome.
4. Open any public page, open the extension popup and `Capture Step` to start capture, click a few elements on the page, then stop and save the walkthrough.
5. Switch to Playback tab and start playback — observe balloons and step navigation.

Where to find things
- Extension source: `Mini_Apty/extension/src`
- Backend source: `Mini_Apty/backend/src`
- Docker compose: `docker-compose.yml`
- Env example: `Mini_Apty/backend/.env.example`

Questions or next step
If you'd like, I can now:
- Add the React Error Boundary in the popup (`Mini_Apty/extension/src/popup.tsx`)
- Improve targeting heuristics in `Mini_Apty/extension/src/content.ts`
- Add a short developer-focused demo README and a 2–3 step script for the video

— Mini Apty maintainer
