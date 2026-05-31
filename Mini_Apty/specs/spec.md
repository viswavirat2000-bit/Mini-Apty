# Mini Apty Product Specification

## Product Overview
Mini Apty enables users to create guided walkthroughs on existing websites and replay them later as step-by-step assisted experiences. The product is intended to help people learn unfamiliar interfaces, complete multistep tasks, and follow standardized procedures without leaving the context of the website they are using.

The primary goals of Mini Apty are:
- Make walkthrough creation simple and repeatable for authors.
- Deliver reliable, contextual guidance to end users on third-party websites.
- Preserve user progress and walkthrough state across interruptions.
- Maintain trust by clearly defining ownership, access, and recovery behavior.

Intended users:
- Authors: people who define and maintain walkthroughs for business processes, training, or onboarding.
- Participants: people who consume walkthroughs to complete tasks on external websites.

## User Roles

### Author
- Can create new walkthroughs.
- Can edit existing walkthroughs they own.
- Can delete walkthroughs they own.
- Can discover walkthroughs relevant to the sites they manage.
- Can replay walkthroughs for preview or validation.

### Participant
- Can discover walkthroughs made available for the site they are on.
- Can start and follow walkthroughs.
- Can resume interrupted walkthroughs.

### Account Holder
- Can create and manage their own account.
- Can authenticate to access Mini Apty features.
- Owns the walkthroughs they create and controls access to them.

## Functional Requirements

### 1. Account Creation
- Users must be able to create an account using an email address and password.
- Account creation must validate that the email is not already in use.
- Users should receive confirmation of successful account creation.

### 2. Authentication
- Users must be able to log in using their account credentials.
- Authentication must prevent access to walkthrough creation, editing, deletion, and private discovery until the user is signed in.
- Users must be able to log out and terminate their session.

### 3. Walkthrough Creation
- Authors must be able to create a new walkthrough and assign it a title.
- Authors must be able to capture a sequence of steps on a website.
- Each step must include a target, a short title, and a description.
- Authors must be able to configure an advance trigger for each step.
- Authors must be able to save the walkthrough and associate it with a website context using origin and path pattern information.

### 4. Walkthrough Editing
- Authors must be able to update walkthrough metadata such as title and description.
- Authors must be able to add, remove, reorder, and modify steps within an existing walkthrough.
- Authors must be able to change step titles, descriptions, and advance triggers.
- Changes to a walkthrough must be saved and made available for future playback.

### 5. Walkthrough Storage
- Walkthroughs must be stored persistently so they remain available across sessions and device restarts.
- Walkthroughs must be associated with the account that created them.
- Walkthroughs must be discoverable when returning to the same website context.
- Walkthroughs must be retrievable across browser restarts, different browser profiles, and device changes when using the same backend.

### 6. Walkthrough Discovery
- Authors must be able to see a list of walkthroughs they own.
- Participants must be able to see walkthroughs relevant to the site they are visiting.
- Discovery should surface the most relevant walkthroughs for the current website.

### 7. Walkthrough Playback
- Participants must be able to start a walkthrough from the relevant website context.
- Walkthrough playback must present steps one at a time.
- Each step must be anchored to the appropriate target on the page.
- Playback must include controls for moving forward and backward through steps.
- Playback must continue to function with cached content if the backend is temporarily unavailable.

### 8. Progress Persistence
- Walkthrough progress must be persisted so users can return to their place after reload or navigation.
- If a walkthrough is interrupted, the participant should be able to resume from the last completed or active step.
- Progress persistence must not expose content to unauthorized users.

### 9. Walkthrough Deletion
- Authors must be able to delete walkthroughs they own.
- Deleted walkthroughs must no longer appear in discovery for authors or participants.
- Users should receive confirmation before a walkthrough is permanently removed.

### 10. Error Handling
- The product must provide clear feedback when walkthrough creation, editing, discovery, or playback fails.
- Users should be informed when required elements are missing or no longer available.
- The product should preserve the user’s context and progress when possible after an error.
- Different failure types should be distinguished, including authentication, connectivity, validation, and unknown errors.
- Errors should be presented with guidance on how to recover or retry.
- Walkthrough UI must avoid breaking or interfering with the underlying website’s normal behavior.

## User Stories

### Account Creation
- As an author,
  I want to create an account with an email and password,
  So that I can manage walkthroughs securely.

- As an account holder,
  I want to know if my email is already registered,
  So that I can recover my account or choose a different address.

### Authentication
- As an author,
  I want to log in to Mini Apty,
  So that I can create, edit, and manage walkthroughs.

- As a participant,
  I want to log out when I’m done,
  So that my session is closed and no one else can use my account.

### Walkthrough Creation
- As an author,
  I want to capture a sequence of steps on a website,
  So that I can turn those actions into a guided walkthrough.

- As an author,
  I want to add titles and descriptions to each step,
  So that participants understand what to do next.

### Walkthrough Editing
- As an author,
  I want to update a walkthrough after a website change,
  So that the guidance stays accurate.

- As an author,
  I want to reorder steps in a walkthrough,
  So that the guidance reflects the correct task flow.

### Walkthrough Storage
- As an author,
  I want my saved walkthroughs to remain available later,
  So that I can reuse and update them over time.

### Walkthrough Discovery
- As a participant,
  I want to find walkthroughs relevant to the site I’m on,
  So that I can start the right guidance quickly.

- As an author,
  I want to see the walkthroughs I own,
  So that I can manage and update them.

### Walkthrough Playback
- As a participant,
  I want to start a walkthrough from the current website,
  So that I can complete the task with guided support.

- As a participant,
  I want to move through the walkthrough step by step,
  So that I can follow the process in order.

### Progress Persistence
- As a participant,
  I want to resume a walkthrough after reloading the page,
  So that I do not lose my place.

- As a participant,
  I want the walkthrough to remember my last step if I leave and return,
  So that I can finish without starting over.

### Walkthrough Deletion
- As an author,
  I want to delete a walkthrough I no longer need,
  So that it is removed from available guidance.

- As an author,
  I want confirmation before deleting a walkthrough,
  So that I do not remove something by mistake.

### Error Handling
- As an author,
  I want to know when a step target is missing,
  So that I can fix the walkthrough before releasing it.

- As a participant,
  I want clear recovery options when playback fails,
  So that I can continue without losing context.

## Acceptance Criteria

### Account Creation
- Users can create an account with a unique email and password.
- The system rejects duplicate emails and shows an explanatory message.
- Successful account creation results in a confirmation message.

### Authentication
- Users can log in with valid credentials.
- Invalid credentials produce a clear login error.
- Logged-in users can access walkthrough authoring and management.
- Logged-out users cannot access protected walkthrough actions.
- Users can log out and end their session.

### Walkthrough Creation
- Authors can start a new walkthrough with a title.
- Authors can capture at least one step with target, title, and description.
- Authors can configure a step advance trigger.
- Saved walkthroughs are listed for the author and are associated with the site context.

### Walkthrough Editing
- Authors can modify walkthrough metadata and step details.
- Authors can add, remove, and reorder steps.
- Edits are saved and reflected in discovery and playback.

### Walkthrough Storage
- Walkthroughs remain available after the author logs out and back in.
- Walkthroughs remain available after a browser restart or session refresh.
- Walkthroughs remain associated with the correct website context.
- Walkthroughs remain retrievable when the user returns on a different browser profile or device with the same backend.

### Walkthrough Discovery
- Authors see a list of their own walkthroughs.
- Participants see walkthroughs that match the current website context.
- Discovery returns the most relevant walkthroughs for the site.

### Walkthrough Playback
- Participants can start playback from a relevant walkthrough.
- Playback shows steps sequentially with visible controls.
- Each step is anchored to the page element it describes.
- Participants can move forward and backward through steps.
- Playback can continue using cached walkthrough content when the backend is temporarily unavailable.

### Progress Persistence
- Walkthrough progress is saved after each completed step.
- Participants can resume after page reload or navigation.
- Resumption starts from the last active or completed step.

### Walkthrough Deletion
- Authors can delete walkthroughs they own.
- Deleted walkthroughs are removed from discovery lists.
- Deletion requires user confirmation.

### Error Handling
- Errors are presented in clear, non-technical language.
- The system distinguishes missing targets, unavailable walkthroughs, permission issues, authentication errors, and connectivity problems.
- Users receive guidance on how to recover or retry.
- The user’s current walkthrough state is preserved where possible.
- Error states do not leave the underlying website interface broken or unusable.

## Non-Functional Requirements

### Reliability
- The product must deliver walkthrough guidance consistently across sessions.
- Users must be able to rely on saved walkthroughs when they return to the same context.

### Availability
- Users should be able to sign in, manage walkthroughs, and access relevant guidance when the service is available.
- Walkthrough discovery and playback should be available during normal use.

### Consistency
- Walkthrough behavior should be predictable across similar actions.
- Saved content and progress should behave the same way for authors and participants.

### Usability
- The product must present workflows clearly and minimize friction.
- Creation, editing, discovery, and playback flows should be easy to understand.
- Walkthrough UI must not interfere with the underlying website’s normal behavior, layout, or interaction patterns.

### Accessibility
- Walkthrough creation and playback must be usable by people with varying abilities.
- Controls and guidance must be perceivable and operable in a range of assistive environments.

### Security
- Users must only be able to access and manage walkthroughs they are authorized to use.
- Account authentication must control access to authoring and protected walkthroughs.
- Access control must clearly enforce ownership and prevent unauthorized viewing or editing.

### Recoverability
- Users must be able to recover from interrupted walkthroughs without losing progress.
- The product must preserve state and enable resumption after transient disruptions.
- Walkthrough recovery should use the last known good step and avoid restarting users unnecessarily.

## Edge Cases

### Missing Elements
- If a target element no longer exists during playback, the system should stop playback, notify the user, and offer steps to recover or edit the walkthrough.

### Changed Pages
- If the page structure has changed enough that a step cannot be reliably resolved, the system should surface the issue to the author or participant and avoid presenting misleading guidance.

### User Logout
- If a user logs out during authoring or playback, the session should end cleanly and sensitive data should no longer be accessible.
- Progress should be preserved where possible, and the user should be prompted to log in again to continue.

### Lost Connectivity
- If connectivity is lost during creation, editing, discovery, or playback, the user should receive a clear message and retain existing context.
- The product should allow retrying or gracefully pausing until connectivity is restored.

### Interrupted Walkthroughs
- If playback is interrupted by navigation, refresh, or tab change, the user should be able to resume from the last known step.
- Interrupted walkthroughs should not cause data loss for completed steps.

### Deleted Walkthroughs
- If a walkthrough is deleted while a participant is viewing or resuming it, the system should stop playback and notify the user that it is no longer available.

### Unauthorized Access
- Users trying to view or edit walkthroughs they do not own should receive a clear authorization message.
- Unauthorized actions should be blocked consistently.

## Success Criteria
- Authors can create, edit, and delete walkthroughs reliably.
- Participants can discover and start relevant walkthroughs for existing websites.
- Walkthrough progress persists across reloads and interruptions.
- Errors are communicated clearly and recovery is supported.
- Walkthroughs remain associated with the correct website context and ownership.
- The product demonstrates consistent behavior and user trust through clear permissions and state handling.
