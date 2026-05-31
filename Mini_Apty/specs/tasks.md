# Mini Apty Implementation Backlog

## Milestone 1: Project Setup

- ID: T1.1
  Title: Initialize monorepo structure
  Description: Create the repository layout with `extension`, `backend`, and `specs` folders; add initial root package manifest and workspace config.
  Dependencies: []
  Definition of Done: Repository contains `pnpm-workspace.yaml`, root `package.json`, `extension/`, `backend/`, and `specs/` directories with placeholder package manifests.
  Parallel: yes

- ID: T1.2
  Title: Configure TypeScript strict setup
  Description: Add TypeScript configuration for both extension and backend packages with strict mode enabled, consistent compiler settings, and shared base config.
  Dependencies: [T1.1]
  Definition of Done: Both packages compile with TypeScript strict mode and share a common base `tsconfig` where applicable.
  Parallel: yes

- ID: T1.3
  Title: Add development scripts
  Description: Define `pnpm` scripts for backend dev, extension build, and lint/type-checking in root and package manifests.
  Dependencies: [T1.1]
  Definition of Done: Root and package-level scripts include commands to run backend development, build the extension, and perform type checks.
  Parallel: yes

- ID: T1.4
  Title: Add placeholder specification and analysis docs
  Description: Ensure `specs/spec.md`, `specs/plan.md`, and `assignment-analysis.md` remain available and referenced in the repo.
  Dependencies: [T1.1]
  Definition of Done: Documentation files exist in the repository and are mentioned in README or project onboarding notes.
  Parallel: yes

## Milestone 2: Authentication

- ID: T2.1
  Title: Implement backend user signup/login flows
  Description: Build server-side routes for account creation and authentication using email/password and JWT issuance.
  Dependencies: [T1.2]
  Definition of Done: Backend accepts signup and login requests, validates unique email, returns JWTs, and rejects invalid credentials.
  Parallel: no

- ID: T2.2
  Title: Implement authentication state in extension
  Description: Add extension UI flow for sign-in, sign-out, and authenticated state management.
  Dependencies: [T1.2, T2.1]
  Definition of Done: Extension users can sign in, access protected flows, and sign out, with state updated consistently.
  Parallel: no

- ID: T2.3
  Title: Secure protected routes and access control
  Description: Enforce authentication on backend walkthrough CRUD and discovery endpoints.
  Dependencies: [T2.1]
  Definition of Done: Backend returns auth errors for unauthenticated access and allows protected operations only for signed-in users.
  Parallel: no

- ID: T2.4
  Title: Add session token handling and expiration
  Description: Implement secure JWT handling in the extension runtime and manage token refresh or expiration errors.
  Dependencies: [T2.2, T2.3]
  Definition of Done: Extension stores session tokens securely, refresh/reauth behavior is defined, and expired tokens produce a clear sign-in prompt.
  Parallel: no

## Milestone 3: Walkthrough Storage

- ID: T3.1
  Title: Design walkthrough data model and persistence
  Description: Define backend entities for users, walkthroughs, steps, and playback progress with origin/path context.
  Dependencies: [T1.2]
  Definition of Done: Data model documents exist and backend schema supports walkthrough ownership, step metadata, and context association.
  Parallel: yes

- ID: T3.2
  Title: Implement walkthrough CRUD storage
  Description: Build backend handlers for creating, reading, updating, and deleting walkthroughs.
  Dependencies: [T2.3, T3.1]
  Definition of Done: Walkthrough CRUD endpoints persist data, enforce ownership, and return correct context metadata.
  Parallel: no

- ID: T3.3
  Title: Implement walkthrough discovery by website context
  Description: Retrieve walkthroughs matching current website origin and path pattern for authors and participants.
  Dependencies: [T3.2]
  Definition of Done: The backend can return relevant walkthroughs based on origin/path context and user ownership.
  Parallel: yes

- ID: T3.4
  Title: Add backend authorization checks for walkthrough lifecycle
  Description: Enforce that only owners can edit/delete walkthroughs and that discovery only returns accessible content.
  Dependencies: [T3.2]
  Definition of Done: Unauthorized edit/delete requests are rejected and discovery only returns allowed walkthroughs.
  Parallel: no

## Milestone 4: Recording Experience

- ID: T4.1
  Title: Implement authoring UI shell
  Description: Add extension UI for creating walkthroughs, editing titles, and managing steps.
  Dependencies: [T2.2, T3.1]
  Definition of Done: Authors can start a new walkthrough, enter metadata, and access step editing screens.
  Parallel: yes

- ID: T4.2
  Title: Add page interaction layer for step capture
  Description: Implement host page injection to capture clicked elements and gather target metadata.
  Dependencies: [T4.1]
  Definition of Done: The page integration layer can capture elements and send metadata to the authoring UI.
  Parallel: no

- ID: T4.3
  Title: Add step metadata editing and triggers
  Description: Allow authors to set step title, description, and advance trigger for each captured step.
  Dependencies: [T4.1, T4.2]
  Definition of Done: Authors can update step details and trigger configuration before saving.
  Parallel: yes

- ID: T4.4
  Title: Save walkthrough drafts to backend
  Description: Persist captured walkthrough data and author edits to the backend with website context.
  Dependencies: [T4.1, T4.3, T3.2]
  Definition of Done: Saved walkthroughs appear in author-owned discovery and include origin/path records.
  Parallel: no

- ID: T4.5
  Title: Provide author feedback on capture reliability
  Description: Surface warnings when element capture metadata is weak or likely to fail on site changes.
  Dependencies: [T4.2, T4.3]
  Definition of Done: Authors receive capture reliability feedback and can adjust step targets accordingly.
  Parallel: yes

## Milestone 5: Playback Experience

- ID: T5.1
  Title: Implement playback UI overlay
  Description: Add playback balloon UI and controls that anchor to page elements during walkthrough playback.
  Dependencies: [T4.2, T4.4]
  Definition of Done: Participants can start playback and see step balloons anchored to resolved page elements.
  Parallel: no

- ID: T5.2
  Title: Build element resolution and re-anchoring logic
  Description: Implement the multi-factor element identification strategy for step target resolution and re-anchoring.
  Dependencies: [T4.2]
  Definition of Done: Playback can resolve steps using semantic identifiers, text context, and structural cues.
  Parallel: no

- ID: T5.3
  Title: Add navigation controls and trigger handling
  Description: Support next/previous navigation and configured advance triggers during playback.
  Dependencies: [T5.1, T5.2]
  Definition of Done: Users can move through walkthroughs with controls and step-specific triggers.
  Parallel: yes

- ID: T5.4
  Title: Detect route changes and revalidate steps
  Description: Monitor SPA route transitions and DOM mutations to re-run step resolution when the page changes.
  Dependencies: [T5.2]
  Definition of Done: Playback detects route changes, re-resolves current step, and maintains progress when possible.
  Parallel: yes

- ID: T5.5
  Title: Add discovery of relevant walkthroughs on the current site
  Description: Show available walkthroughs for the current origin/path context to both authors and participants.
  Dependencies: [T3.3, T2.2]
  Definition of Done: The extension surfaces relevant walkthroughs for the current website and allows starting playback.
  Parallel: yes

## Milestone 6: Progress Persistence

- ID: T6.1
  Title: Persist walkthrough progress checkpoints
  Description: Save current playback step index and progress status for users returning to interrupted walkthroughs.
  Dependencies: [T5.1, T5.2, T3.2]
  Definition of Done: Progress is stored and can be resumed after reload, navigation, or session refresh.
  Parallel: no

- ID: T6.2
  Title: Resume interrupted walkthroughs safely
  Description: Restore walkthrough state from the last good checkpoint and re-anchor the step before resuming.
  Dependencies: [T6.1, T5.2]
  Definition of Done: Interrupted sessions resume from the correct step with re-resolved targets when available.
  Parallel: yes

- ID: T6.3
  Title: Prevent unauthorized progress access
  Description: Ensure persisted progress is only accessible to the correct user/session and does not expose private walkthroughs.
  Dependencies: [T2.3, T6.1]
  Definition of Done: Progress data is only returned for authorized users and is protected from cross-user access.
  Parallel: yes

## Milestone 7: Offline Behavior

- ID: T7.1
  Title: Implement local caching for walkthroughs and progress
  Description: Cache downloaded walkthrough content and progress locally for temporary offline resilience.
  Dependencies: [T5.1, T6.1]
  Definition of Done: Playback can continue with cached walkthroughs and progress when the backend is unreachable.
  Parallel: yes

- ID: T7.2
  Title: Add offline failure messaging and recovery
  Description: Show clear messaging when backend connectivity is lost and provide retry or cached play options.
  Dependencies: [T7.1]
  Definition of Done: Users see explicit offline state and can continue with cached content or retry when available.
  Parallel: yes

- ID: T7.3
  Title: Ensure host page remains stable during offline/errors
  Description: Prevent playback or authoring failures from leaving the host website broken or unusable.
  Dependencies: [T5.1, T7.2]
  Definition of Done: The host page remains functional after failures, and extension overlays can be dismissed safely.
  Parallel: yes

## Milestone 8: Testing

- ID: T8.1
  Title: Add unit tests for authentication and state management
  Description: Create unit tests for backend auth handlers, extension session state, and validation logic.
  Dependencies: [T2.1, T2.2, T1.2]
  Definition of Done: Unit tests cover signup/login, token handling, and core state transitions with passing results.
  Parallel: yes

- ID: T8.2
  Title: Add unit tests for element resolution and walkthrough logic
  Description: Test step target resolution, fallback matching, and progress checkpoint logic.
  Dependencies: [T5.2, T6.1]
  Definition of Done: Unit tests verify element matching outcomes, route-change handling, and persistence behavior.
  Parallel: yes

- ID: T8.3
  Title: Add integration tests for recording and playback flows
  Description: Create end-to-end tests covering walkthrough creation, save, discovery, start, progress, and resume.
  Dependencies: [T4.4, T5.5, T6.1]
  Definition of Done: Integration tests exercise critical end-to-end flows and pass on the CI/test environment.
  Parallel: no

- ID: T8.4
  Title: Add failure and edge-case tests
  Description: Test missing elements, changed pages, lost connectivity, unauthorized access, and deleted walkthroughs.
  Dependencies: [T5.2, T7.1, T3.4]
  Definition of Done: Edge-case tests validate behavior for missing steps, offline play, unauthorized access, and deleted walkthroughs.
  Parallel: yes

## Milestone 9: Documentation

- ID: T9.1
  Title: Write setup and usage README
  Description: Document how to install dependencies, run the backend and extension, and use the main flows.
  Dependencies: [T1.1, T2.1, T4.4, T5.1]
  Definition of Done: README includes setup steps, environment requirements, and usage instructions for key flows.
  Parallel: yes

- ID: T9.2
  Title: Document architecture and tradeoffs
  Description: Capture the technical plan, element targeting strategy, and major tradeoffs in README or docs.
  Dependencies: [T5.2, T7.1, T8.3]
  Definition of Done: Documentation explains architecture decisions, resilience strategy, and why chosen options were made.
  Parallel: yes

- ID: T9.3
  Title: Create environment example files
  Description: Add `.env.example` with JWT secret and backend/store configuration placeholders.
  Dependencies: [T2.1, T3.1]
  Definition of Done: `.env.example` exists with all required variables documented.
  Parallel: yes
