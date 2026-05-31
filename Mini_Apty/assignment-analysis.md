# Assignment Analysis

## Overview
The challenge is to build a small but realistic Digital Adoption Platform (DAP) slice consisting of:
- A Chrome Manifest V3 extension called Mini Apty.
- A Node.js backend with a real persistence layer.
- Support for authoring walkthroughs on arbitrary public websites, previewing them, and storing them securely.

The goal is to demonstrate depth in:
- Manifest V3 service worker/runtime model
- Robust DOM element targeting across SPA and re-render boundaries
- Reliable client-backend integration with auth and persistence
- Good error handling and developer hygiene

## Core Deliverables
1. **Author mode**
   - Start recording on the current tab.
   - Click to capture page elements with visible affordance.
   - Edit title/description for each captured step.
   - Save walkthroughs to backend and extension storage.
   - Walkthroughs keyed by origin + path pattern.

2. **Preview mode**
   - Load saved walkthroughs from backend with caching.
   - Show step balloon anchored to the target element.
   - Advance by configured trigger.
   - Persist progress across refresh/navigation.

3. **Node.js backend**
   - REST API for walkthrough CRUD and auth.
   - Real persistent store: SQLite/Postgres/MongoDB.
   - Email/password signup/login with JWT.
   - Authorization by owning user.
   - Runnable locally with `docker compose up`.

## Hard Requirements
- Manifest V3 service worker, not background page.
- Robust element targeting, not brittle selectors only.
- Cross-origin storage by backend and retrieval by origin/path.
- Network failure tolerance in player.
- Non-conflicting overlay UI.
- TypeScript strict mode in both packages.
- Extension error handling (React error boundary, API normalizer, clear messaging).
- Working build commands in pnpm workspace.
- `.env.example` for JWT secret and DB URL.

## Success Criteria and Evaluation
High-weight areas in rubric:
- Architecture & MV3 understanding (25%)
- Element targeting & SPA/mutation handling (25%)
- Backend auth/authZ/DB/error handling (25%)
- React overlay and error handling (10%)
- README and trade-off articulation (10%)
- Code quality & hygiene (5%)
- Bonus features up to +5%

## Recommended Architecture
### Extension
- `manifest.json` MV3 with service worker and optional devtools/page scripts.
- React UI for popup/side-panel and authoring overlay.
- Zustand state for auth/session, recording mode, and current walkthrough.
- In-page injected overlay component for author UI and preview balloons.
- Messaging channel between service worker, extension UI, and content script.
- Local cache in `chrome.storage.local` for offline playback and resume state.

### Element Targeting Strategy
- Prefer semantic / stable targeting over brittle CSS paths.
- Collect:
  - element `id`, `data-*` attributes, `name`, `aria-label`, `textContent` fallback
  - `role` and tag name
  - relative anchor heuristics to parent/preceding sibling labels
- Persist a fallback path signature for re-query when exact target is unavailable.
- Re-evaluate the target on route change / mutation using a prioritized resolver.
- Document trade-offs: better than pure `nth-child`, but not perfect on dynamic apps.

### Backend
- Node.js with Express or Fastify and TypeScript strict mode.
- Persistent store: SQLite for easiest local setup, with proper connection lifecycle.
- JWT-based auth with refresh token optional or simple access token.
- Walkthrough ownership enforced at service layer.
- Error middleware to normalize API errors.
- Docker Compose with SQLite volume or Postgres service if chosen.

### Data Model
- `User`: id, email, passwordHash, createdAt
- `Walkthrough`: id, userId, title, origin, pathPattern, steps, createdAt, updatedAt
- `Step`: target metadata, title, description, trigger

## Key Risks and Mitigations
- **Brittle targeting on SPA sites**: mitigate by using a multi-factor selector and fallback matching, plus author guidance.
- **Service worker lifecycle constraints**: minimize work in worker, persist state to storage, use content scripts for UI interactions.
- **Auth state across extension components**: centralize session management in service worker with message-based queries.
- **Offline/failed backend calls**: use cached walkthrough payload, queue saves if needed, show clear offline state.
- **Host page style collisions**: use shadow DOM or strict scoping with high z-index and safe CSS reset.

## Implementation Plan
1. Set up monorepo with `pnpm` workspaces for `extension` and `backend`.
2. Create backend API and DB schemas first; implement auth/login/signup.
3. Build extension UI shell and MV3 manifest/service worker.
4. Add authoring flow: capture page step, edit metadata, save walkthrough.
5. Add preview mode: load from backend, render balloon, resume progress.
6. Add offline caching, error handling, and backend authorization.
7. Create `.env.example`, README trade-off section, and demo instructions.

## Expected Submission Artifacts
- `Mini_Apty/extension` package with MV3 extension build.
- `Mini_Apty/backend` package with Node.js API.
- `pnpm-workspace.yaml` and root `package.json`.
- `.env.example` for JWT secret and DB URL.
- README covering design, trade-offs, and setup.
- Public GitHub repo or repo zip plus demo video.

## Notes
- AI assistance is allowed, but every technical decision must be defendable.
- The focus is depth in runtime, targeting, auth, and integration, not on building a large feature surface.
- A 10-minute walkthrough video should highlight signup/login, authoring on a real site, and the targeting/auth design decisions.
