# Mini Apty Constitution

## Product Mission
Mini Apty empowers users to create and replay guided walkthroughs on third-party websites with confidence, continuity, and respect for the host experience. It exists to help people accomplish tasks without losing trust in the platform or the websites they use.

## Core Principles

### 1. Walkthrough Reliability
- Description: Walkthroughs must execute consistently and predictably for end users.
- Rationale: Users trust the product when it works every time, and the product fails when guidance breaks unexpectedly.
- Expected Outcomes: Users can complete walkthroughs without frequent interruptions or unexplained failures.

### 2. User Trust
- Description: Mini Apty must behave transparently, preserve user expectations, and avoid surprising or intrusive behavior.
- Rationale: Trust is the foundation of adoption, especially when interacting with third-party websites.
- Expected Outcomes: Users feel confident that walkthroughs are safe, their data is respected, and the product behaves responsibly.

### 3. Resilience to Change
- Description: The system should tolerate modifications to target websites and continue to deliver guidance.
- Rationale: Third-party websites change often, so value comes from minimizing the need to re-author walkthroughs.
- Expected Outcomes: Walkthroughs remain functional after normal site updates and require minimal recovery effort.

### 4. Graceful Failure Handling
- Description: Failures must be handled in a way that preserves context, explains the issue, and offers recovery options.
- Rationale: When failure occurs, the product should reduce harm instead of leaving users confused or stranded.
- Expected Outcomes: Users receive clear, actionable feedback and can continue or recover safely.

### 5. Clear Ownership and Access Control
- Description: Walkthrough ownership and access permissions must be explicit, consistent, and easy to understand.
- Rationale: Users need assurance that their created content belongs to them and is only changeable by authorized parties.
- Expected Outcomes: Access boundaries are enforced reliably and ownership is transparent.

### 6. Consistent User Experience
- Description: The product should behave consistently across creation, playback, and recovery flows.
- Rationale: Predictability reduces cognitive load and increases confidence in the product.
- Expected Outcomes: Authors and participants enjoy coherent behavior and familiar interactions in all modes.

### 7. Accessibility and Usability
- Description: Walkthrough creation and playback should be usable by as many people as possible.
- Rationale: Inclusive products serve broader audiences and are more resilient to different environments.
- Expected Outcomes: Users can understand, navigate, and interact with guidance in a range of assistive and standard settings.

### 8. Data Persistence and Continuity
- Description: User content and progress should persist through restarts, navigation, and interruptions.
- Rationale: Guidance loses value when progress is lost or content disappears unexpectedly.
- Expected Outcomes: Walkthroughs and session state survive interruptions and return users to a meaningful point.

### 9. Maintainability
- Description: The product should be easy for the team to understand, update, and extend.
- Rationale: Maintainable systems allow the team to respond to new needs with confidence and speed.
- Expected Outcomes: Future changes are less risky, and the product remains stable as it evolves.

### 10. Observability and Diagnosability
- Description: The product should expose clear signals about its behavior, health, and failure modes.
- Rationale: Visible observability enables faster diagnosis and better long-term improvement.
- Expected Outcomes: Teams can detect issues early, trace problems, and measure reliability effectively.

## User Experience Principles

### 1. Intuitive Guidance
- Description: Walkthroughs should feel natural and easy to follow.
- Rationale: Users adopt guidance when it is clear and unobtrusive.
- Expected Outcomes: Each step is easy to understand and users can confidently continue to the next action.

### 2. Minimal Host Interference
- Description: Walkthrough overlays and interactions should not disrupt the underlying website.
- Rationale: The host page must remain usable and trustworthy for the user.
- Expected Outcomes: The host experience remains intact, and walkthroughs coexist peacefully with page content.

### 3. Transparent State
- Description: Users should always understand whether walkthroughs are active, paused, completed, or unavailable.
- Rationale: Visibility into state prevents surprises and supports informed decisions.
- Expected Outcomes: Status is communicated clearly and users know what to expect next.

### 4. Progressive Disclosure
- Description: Show only the information required for the current task.
- Rationale: Too much detail creates noise and slows users down.
- Expected Outcomes: Guidance stays focused, and users can stay on task without distraction.

## Reliability Principles

### 1. Robust Targeting
- Description: Step targets must be defined to tolerate page updates and DOM changes.
- Rationale: Durable targeting is essential for walkthroughs to stay valid over time.
- Expected Outcomes: Steps resolve accurately even when the page structure evolves.

### 2. Redundant Validation
- Description: Validate step availability and context before presenting it.
- Rationale: Catching issues early prevents users from following broken guidance.
- Expected Outcomes: Invalid steps are detected before they cause user confusion.

### 3. Session Continuity
- Description: Progress should be recoverable after reloads, navigation, or interruptions.
- Rationale: Users should not lose their place due to transient issues.
- Expected Outcomes: Walkthroughs resume from a meaningful point whenever possible.

### 4. Non-Blocking Degradation
- Description: When full functionality is unavailable, provide the most useful experience possible.
- Rationale: Partial capability is better than full failure.
- Expected Outcomes: Users can still access walkthroughs, retry operations, or understand what went wrong.

## Data & Ownership Principles

### 1. Explicit Scope
- Description: Walkthroughs should be clearly associated with the content and context they were created for.
- Rationale: Clear scope prevents misuse and confusion.
- Expected Outcomes: Users can easily find and manage walkthroughs in the correct context.

### 2. Ownership Clarity
- Description: Ownership of walkthrough content must be obvious and unambiguous.
- Rationale: Clear ownership supports accountability and safe collaboration.
- Expected Outcomes: Users understand what belongs to them and how it can be modified.

### 3. Persistent Continuity
- Description: Saved content must survive time, sessions, and environment changes.
- Rationale: Users rely on guidance to be available when they return.
- Expected Outcomes: Walkthroughs remain accessible and intact across repeated use.

### 4. Access Control Transparency
- Description: Access rights should be easy to understand and consistently enforced.
- Rationale: Users need to know who can view or edit walkthroughs.
- Expected Outcomes: Permission states are unambiguous and dependable.

## Error Handling Principles

### 1. Clear Communication
- Description: Errors should be explained plainly and offer actionable next steps.
- Rationale: Users need guidance when things go wrong.
- Expected Outcomes: Users understand issues and can recover or seek help.

### 2. Differentiated Response
- Description: Treat distinct failure types appropriately.
- Rationale: Different problems require different remedies.
- Expected Outcomes: Messaging and recovery actions match the failure type.

### 3. Safe Recovery
- Description: Recovery should preserve progress and avoid data loss.
- Rationale: Users should not pay for errors by losing their work.
- Expected Outcomes: Users can recover without losing walkthrough content or their place.

### 4. Non-Intrusive Alerts
- Description: Error notices should be visible without interrupting the workflow excessively.
- Rationale: Excessive interruption frustrates users and breaks momentum.
- Expected Outcomes: Errors are noticeable, helpful, and respectful of the user’s flow.

## Maintainability Principles

### 1. Clear Ownership of Behavior
- Description: Responsibilities and expected behavior should be explicit.
- Rationale: Clear boundaries make the product easier to maintain and evolve.
- Expected Outcomes: Teams can identify where to change behavior and why.

### 2. Predictable Evolution
- Description: Changes should preserve core expectations and minimize surprises.
- Rationale: Predictability reduces regression risk and supports stability.
- Expected Outcomes: Improvements do not invalidate existing walkthroughs.

### 3. Observability by Design
- Description: The product should expose meaningful signals about health and operation.
- Rationale: Observability enables faster diagnosis and better long-term quality.
- Expected Outcomes: Issues can be detected, understood, and measured reliably.

### 4. Prioritized Simplicity
- Description: Prefer the simplest approach that still delivers value.
- Rationale: Simplicity improves reliability, maintainability, and clarity.
- Expected Outcomes: The product remains easier to support and improve.

## Decision-Making Framework

### 1. Trust and Safety First
- Description: When options conflict, prioritize user trust, safety, and predictability.
- Rationale: Trust is essential for adoption and long-term retention.
- Expected Outcomes: Decisions favor stable, transparent behavior over short-term convenience.

### 2. Resilience Over Fragility
- Description: Prefer solutions that continue to work under change, even if they are less glamorous.
- Rationale: Resilient behavior preserves value over time.
- Expected Outcomes: The product remains dependable through website changes and common failures.

### 3. Clarity Over Cleverness
- Description: Favor clear behavior and communication over complexity.
- Rationale: Clear systems are easier to use, maintain, and debug.
- Expected Outcomes: The product is straightforward for users and teams.

### 4. Outcome-Oriented Trade-Offs
- Description: Evaluate options by the value they preserve for users.
- Rationale: Product success depends on helping users accomplish goals reliably.
- Expected Outcomes: Decisions align with the mission of dependable guidance.

### 5. Data Continuity as Non-Negotiable
- Description: Preserve user-created walkthroughs and progress whenever possible.
- Rationale: Loss of user content damages confidence more than nearly any other failure.
- Expected Outcomes: User data is treated as a durable asset and recoverability is built into workflows.
