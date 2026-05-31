# Mini Apty Technical Implementation Plan

## Architecture Overview
Mini Apty is composed of three major logical components:
- **Extension Client**: Runs in the browser and provides the user-facing authoring and playback experience.
- **Content Interaction Layer**: Injected into the target website to capture walkthrough steps, anchor guidance, and resolve page elements.
- **Backend Service**: Manages user accounts, walkthrough persistence, ownership, and authorization.

Responsibilities:
- The Extension Client orchestrates user flows, state, and communication with the Content Interaction Layer and backend.
- The Content Interaction Layer is responsible for interacting with the host page DOM safely and reliably.
- The Backend Service is responsible for managing durable walkthrough data, user authentication, and access control.
- The runtime includes a persistent background host that maintains state and coordinates across tabs, navigations, and page lifecycles.

## Technology Stack
- **Extension**: Chrome Manifest V3, TypeScript strict mode, React with functional components and hooks, Zustand for state management, Zod for validation.
- **Backend**: Node.js with Express, TypeScript strict mode, SQLite as the persistent store, JWT-based email/password authentication.
- **Quality**: Unit tests focused on handlers and services to validate business logic and safeguard critical flows.

## Frontend Architecture

### Browser extension architecture
The frontend is structured around distinct runtime surfaces:
- **UI surface**: The extension’s user interface for sign-in, walkthrough authoring, and walkthrough discovery.
- **Page integration surface**: The injected experience that overlays the host website during authoring or playback.
- **Runtime manager**: The component that manages cross-surface state, message passing, and lifecycle transitions.

### Runtime responsibilities
- Maintain the user session state and enforcement of authentication for protected flows.
- Manage the switch between authoring and playback modes.
- Coordinate retrieval and caching of walkthrough content.
- Handle host page interaction events and route changes.

### User interface boundaries
- **Author UI**: A dedicated interface for walkthrough creation, step editing, and management.
- **Participant UI**: A walkthrough playback experience that appears on the host page with step balloons and navigation controls.
- **Global status UI**: A consistent indication of whether Mini Apty is active, idle, or in error state.
- UI overlays and interactions must avoid breaking the host page’s normal behavior and styling.

### State management
State is organized into clearly defined domains:
- **Session state**: current user authentication and identity.
- **Authoring state**: current walkthrough draft, captured steps, and editing progress.
- **Playback state**: active walkthrough, current step index, and progress checkpoints.
- **Cache state**: recently loaded walkthroughs and persisted progress.

### Authentication flow
- Users sign in through the extension UI.
- Authenticated state is kept separate from walkthrough content state.
- Once signed in, the extension can access authoring and user-specific walkthrough discovery.
- Users can sign out to terminate their session and clear sensitive state.

### Persistence strategy
- Walkthrough metadata and progress are persisted to the backend as the source of truth.
- The extension keeps a local cache of recently loaded walkthroughs and progress checkpoints for resilience.
- Local persistence is used only to improve continuity and recovery, not as the authoritative copy.
- Walkthroughs are keyed by website origin and path pattern so they can be retrieved reliably across restarts, different browser profiles, and device changes.

## Element Identification Strategy
This section is critical and must focus on resilient element targeting.

### Strategy overview
Walkthrough steps are defined by a combination of stable page signals and contextual cues rather than a single brittle selector. The goal is to relocate elements reliably after DOM changes, re-renders, SPA route transitions, and refreshes.

### Primary identification factors
- **Semantic identifiers**: element IDs, data attributes, names, and labels.
- **Text context**: stable visible text associated with the element or nearby label content.
- **Structural context**: the element’s relationship to nearby landmarks such as form groups, headings, or labels.
- **Element fingerprints**: tag name, class names, and accessible roles used as fallback.

### Resolution process
1. Attempt to find the exact element using its strongest stable identifier.
2. If that fails, fallback to matching semantic context and nearby labels.
3. If a stable match cannot be found, validate the best candidate against the saved step metadata.
4. If resolution still fails, surface the issue and avoid presenting misleading guidance.

### SPA and route transition handling
- Detect route changes or significant DOM mutations on the host page.
- Re-run resolution logic for the current step when the page context changes.
- Preserve current step progress and re-anchor the step if a matching target is found.

### Refresh and persistence handling
- Persist step metadata and the current playback step index separately.
- On refresh, reload the cached walkthrough and attempt to resolve the step from the saved metadata.
- Resume playback only when the step can be reliably re-anchored.

### Tradeoffs
- **Durability vs precision**: A multi-factor matching approach is more robust than a single selector but may sometimes require additional validation to avoid incorrect matches.
- **Complexity vs usability**: The resolution algorithm must remain understandable and debuggable, even if it uses several fallback heuristics.
- **Automated recovery vs explicit failure**: It is better to fail with a clear error than to continue with an incorrect target.

## Walkthrough Recording Flow

### End-to-end flow
1. Author opens the Mini Apty author interface and signs in.
2. Author begins a new walkthrough and provides a title.
3. The author enters recording mode for the current website context.
4. The author clicks or selects page elements that should become walkthrough steps.
5. For each captured element, the author provides a step title, description, and optionally selects an advance trigger.
6. The author reviews the captured steps and adjusts the order or content as needed.
7. The author saves the walkthrough, associating it with the current website context.
8. The saved walkthrough becomes available for later discovery and playback.

### Key responsibilities
- Capture stable element metadata and context at the moment of authoring.
- Keep editing controls available so authors can refine each step.
- Provide feedback when a step cannot be captured reliably.
- Persist the finished walkthrough to durable storage.

## Walkthrough Playback Flow

### End-to-end flow
1. Participant arrives on a website with a relevant walkthrough available.
2. The extension detects the context and offers the walkthrough for playback.
3. Participant starts the walkthrough.
4. Playback loads the walkthrough content and resolves the first step target.
5. The UI displays a step balloon anchored to the resolved element, with instructions and navigation controls.
6. Participant advances through the walkthrough using the configured trigger or controls.
7. On each transition, playback validates the next step target and re-anchors as necessary.
8. Progress is persisted so the participant can resume later if interrupted.
9. When the walkthrough completes, the participant receives a clear completion state.

### Key responsibilities
- Resolve each step target before showing it.
- Provide clear navigation and feedback at every step.
- Preserve progress and restore the correct state after interruptions.
- Handle missing or changed targets gracefully.

## Offline and Failure Strategy

### Cached content
- Cache walkthrough content after it is successfully loaded.
- Cache the participant’s most recent progress checkpoint.
- Use cached content to continue playback when the backend is temporarily unavailable.

### Failure handling
- Distinguish between recoverable issues and fatal failures.
- For missing or changed targets, notify the user and provide an option to pause or retry.
- For connectivity issues, allow the user to continue with cached content when available.
- For authentication failures, prompt the user to re-authenticate.
- For host page failures, the extension should avoid leaving the page in a broken or unresponsive state.

### Recovery behavior
- On browser refresh or navigation, attempt to resume from the last persisted step.
- If the active step cannot be resolved after recovery, stop playback and provide an explanatory message.
- If the walkthrough cannot be loaded from the backend, fall back to cached content or show a clear offline notice.

## Backend Architecture

### Authentication
- Authenticate users using a credential-based sign-in flow.
- Maintain user session state for authoring and management.
- Ensure that only authenticated users can create, edit, or delete walkthroughs.

### Authorization
- Enforce ownership checks for walkthrough editing and deletion.
- Ensure users can only access walkthroughs belonging to them or those available to the current context.
- Differentiate between private author-only management and participant discovery.
- Ensure authorization policy is applied consistently across retrieval, edit, and deletion operations.

### Walkthrough lifecycle
- Support walkthrough creation, update, retrieval, and deletion.
- Store walkthrough metadata, step sequences, and context associations.
- Maintain ownership metadata for each walkthrough.

### Ownership enforcement
- Walkthroughs are associated with the user who created them.
- Only the owner can modify or delete a walkthrough.
- Discovery surfaces available walkthroughs while preventing unauthorized access to private content.

## Data Model

### Entities
- **User**: Represents the account holder and content owner.
- **Walkthrough**: Represents a named set of steps associated with a website context.
- **Step**: Represents a single guidance action within a walkthrough.
- **Playback Progress**: Represents the last known position in a walkthrough for a participant session.

### Relationships
- A User owns zero or more Walkthroughs.
- Each Walkthrough contains an ordered list of Steps.
- Playback Progress is associated with a Walkthrough and a participant’s session or identity.

### Key fields
- User: email, ownership metadata.
- Walkthrough: title, context association, owner reference, status.
- Step: target metadata, title, description, advance trigger, order.
- Playback Progress: walkthrough reference, current step index, last update timestamp.

## Security Plan

### Authentication
- Require users to sign in before accessing protected authoring capabilities.
- Treat session state as the authority for whether protected actions are allowed.

### Authorization
- Enforce that only walkthrough owners can modify or delete their content.
- Prevent participants from accessing author-only management features.

### Token handling
- Ensure any session tokens or credentials are handled securely in the extension runtime.
- Do not expose sensitive session state to the host page beyond what is needed for playback.

### Validation
- Validate walkthrough content before it is stored.
- Ensure step metadata includes required fields such as title, description, and target context.
- Validate that playback progress references a valid walkthrough and step index.

## Testing Strategy

### Unit tests
- Cover core state management for authoring, playback, and session handling.
- Test element resolution logic and fallback behavior.
- Verify validation rules for walkthrough creation and editing.

### Integration tests
- Test end-to-end recording flows from walkthrough creation through save.
- Test playback flows including step navigation and progress persistence.
- Test failure scenarios such as missing targets, lost connectivity, and unauthorized access.

### Critical flows
- Walkthrough creation and save.
- Walkthrough playback start and step progression.
- Progress persistence across refresh and recovery.
- Authentication and ownership enforcement.

## Deployment Strategy

### Local development
- Enable a local development mode for the extension and backend with clear environment configuration.
- Provide a straightforward workflow for starting the backend service and launching the extension in a development browser.

### Containerization
- Package the backend service so it can run consistently in a local containerized environment.
- Use environment variables to configure the runtime behavior for local and test environments.
- Supply an example environment configuration file for required secrets and service endpoints.

### Environment management
- Define environment configuration for development and local testing.
- Keep secrets and session configuration separate from application logic.

## Tradeoffs

### Architecture tradeoffs
- A lightweight extension-driven approach is chosen to keep the project scope manageable while still demonstrating meaningful browser integration.
- A separate backend service is retained to provide durable persistence, ownership, and authorization, rather than relying purely on local runtime storage.

### Element identification tradeoffs
- The chosen multi-factor identification strategy favors resilience over absolute precision.
- This means the system may require additional validation logic, but it avoids the brittleness of single-selector targeting.
- The alternative of using only page selectors would be simpler, but would fail quickly on re-renders and site changes.

### Persistence tradeoffs
- Local caching is used for continuity, but the authoritative source remains the backend.
- This balances the need for offline resilience with the need to preserve ownership and centralized state.

### Recovery tradeoffs
- The plan prefers explicit failure and clear user messaging over silent auto-recovery when a target cannot be resolved.
- This protects user trust and avoids misleading participants into following incorrect guidance.
