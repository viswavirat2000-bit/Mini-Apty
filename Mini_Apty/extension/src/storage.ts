import { AuthResponse, Walkthrough } from "./types";

const STORAGE_KEYS = {
  token: "miniAptyAuthToken",
  user: "miniAptyUser",
  cachedWalkthroughs: "miniAptyCachedWalkthroughs",
  pendingSteps: "miniAptyPendingSteps",
  draftTitle: "miniAptyDraftTitle",
  draftPathPattern: "miniAptyDraftPathPattern",
};

export async function getToken(): Promise<string | null> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.token);
  return result[STORAGE_KEYS.token] || null;
}

export async function setToken(token: string): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.token]: token });
}

export async function clearToken(): Promise<void> {
  await chrome.storage.local.remove([STORAGE_KEYS.token, STORAGE_KEYS.user]);
}

export async function cacheWalkthroughs(origin: string, path: string, items: Walkthrough[]): Promise<void> {
  const key = `${STORAGE_KEYS.cachedWalkthroughs}:${origin}:${path}`;
  await chrome.storage.local.set({ [key]: items });
}

export async function getCachedWalkthroughs(origin: string, path: string): Promise<Walkthrough[] | null> {
  const key = `${STORAGE_KEYS.cachedWalkthroughs}:${origin}:${path}`;
  const result = await chrome.storage.local.get(key);
  return result[key] || null;
}

export async function getPendingSteps(): Promise<any[]> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.pendingSteps);
  return result[STORAGE_KEYS.pendingSteps] || [];
}

export async function setPendingSteps(steps: any[]): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.pendingSteps]: steps });
}

export async function clearPendingSteps(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEYS.pendingSteps);
}

export async function getDraftTitle(): Promise<string | null> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.draftTitle);
  return result[STORAGE_KEYS.draftTitle] || null;
}

export async function setDraftTitle(title: string): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.draftTitle]: title });
}

export async function getDraftPathPattern(): Promise<string | null> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.draftPathPattern);
  return result[STORAGE_KEYS.draftPathPattern] || null;
}

export async function setDraftPathPattern(pathPattern: string): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.draftPathPattern]: pathPattern });
}
