import { AuthResponse, Walkthrough } from "./types";

const STORAGE_KEYS = {
  token: "miniAptyAuthToken",
  user: "miniAptyUser",
  cachedWalkthroughs: "miniAptyCachedWalkthroughs",
  pendingSteps: "miniAptyPendingSteps",
  draftTitle: "miniAptyDraftTitle",
  draftPathPattern: "miniAptyDraftPathPattern",
};

/**
 * Load the stored auth token from Chrome local storage.
 * @returns Stored bearer token or null if missing.
 */
export async function getToken(): Promise<string | null> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.token);
  return result[STORAGE_KEYS.token] || null;
}

/**
 * Store the auth token in Chrome local storage.
 * @param token Bearer token to save.
 */
export async function setToken(token: string): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.token]: token });
}

/**
 * Remove auth credentials from local storage.
 */
export async function clearToken(): Promise<void> {
  await chrome.storage.local.remove([STORAGE_KEYS.token, STORAGE_KEYS.user]);
}

/**
 * Cache walkthroughs for the current origin/path pair.
 * @param origin Page origin.
 * @param path Page path.
 * @param items Walkthroughs to cache.
 */
export async function cacheWalkthroughs(origin: string, path: string, items: Walkthrough[]): Promise<void> {
  const key = `${STORAGE_KEYS.cachedWalkthroughs}:${origin}:${path}`;
  await chrome.storage.local.set({ [key]: items });
}

/**
 * Retrieve cached walkthroughs for an origin/path pair.
 * @param origin Page origin.
 * @param path Page path.
 * @returns Cached walkthroughs or null when none exist.
 */
export async function getCachedWalkthroughs(origin: string, path: string): Promise<Walkthrough[] | null> {
  const key = `${STORAGE_KEYS.cachedWalkthroughs}:${origin}:${path}`;
  const result = await chrome.storage.local.get(key);
  return result[key] || null;
}

/**
 * Load any pending captured steps waiting to be saved.
 * @returns Pending step descriptors.
 */
export async function getPendingSteps(): Promise<any[]> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.pendingSteps);
  return result[STORAGE_KEYS.pendingSteps] || [];
}

/**
 * Persist pending capture steps for later review or saving.
 * @param steps Step payloads to persist.
 */
export async function setPendingSteps(steps: any[]): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.pendingSteps]: steps });
}

/**
 * Remove any pending captured steps from storage.
 */
export async function clearPendingSteps(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEYS.pendingSteps);
}

/**
 * Load the currently saved draft walkthrough title.
 * @returns Draft title or null if none is saved.
 */
export async function getDraftTitle(): Promise<string | null> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.draftTitle);
  return result[STORAGE_KEYS.draftTitle] || null;
}

/**
 * Persist the draft walkthrough title.
 * @param title Title text to save.
 */
export async function setDraftTitle(title: string): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.draftTitle]: title });
}

/**
 * Load the saved draft path-matching pattern.
 * @returns Draft path pattern or null if none is stored.
 */
export async function getDraftPathPattern(): Promise<string | null> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.draftPathPattern);
  return result[STORAGE_KEYS.draftPathPattern] || null;
}

/**
 * Persist the draft path pattern used for walkthrough matching.
 * @param pathPattern Path pattern string.
 */
export async function setDraftPathPattern(pathPattern: string): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.draftPathPattern]: pathPattern });
}
