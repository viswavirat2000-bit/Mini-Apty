import { AuthResponse, PlaybackProgress, Walkthrough } from "./types";
import { getToken, cacheWalkthroughs } from "./storage";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

/**
 * Send an authenticated JSON request to the backend and normalize errors.
 * @param path Backend path to call.
 * @param options Fetch options to apply.
 * @returns Parsed JSON response body.
 */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const response = await fetch(`${BACKEND_URL}${path}`, { ...options, headers, credentials: "omit" });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error || response.statusText || "request failed");
  }
  if (response.status === 204) {
    return undefined as unknown as T;
  }
  return response.json();
}

/**
 * Send a backend request with a provided token instead of the stored token.
 * Used for lookups from trusted callers that already have a token.
 * @param path Backend path to call.
 * @param token Optional bearer token to use.
 * @param options Fetch options to apply.
 * @returns Parsed JSON response body.
 */
async function requestWithToken<T>(path: string, token: string | null, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const response = await fetch(`${BACKEND_URL}${path}`, { ...options, headers, credentials: "omit" });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error || response.statusText || "request failed");
  }
  return response.json();
}

/**
 * Register a new user account with email and password.
 * @param email User email address.
 * @param password User password.
 * @returns Auth token and user details.
 */
export async function signup(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

/**
 * Authenticate an existing user and return auth credentials.
 * @param email User email address.
 * @param password User password.
 * @returns Auth token and user details.
 */
export async function login(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

/**
 * Create a new walkthrough on the backend for the current user.
 * @param payload Walkthrough payload containing title, origin, path pattern and steps.
 * @returns Created walkthrough record.
 */
export async function createWalkthrough(payload: {
  title: string;
  origin: string;
  pathPattern: string;
  steps: Walkthrough["steps"];
}): Promise<Walkthrough> {
  return request<Walkthrough>("/api/walkthroughs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Fetch all walkthroughs owned by the current authenticated user.
 * @returns Array of walkthroughs created by the user.
 */
export async function listMyWalkthroughs(): Promise<Walkthrough[]> {
  return request<Walkthrough[]>("/api/walkthroughs/mine");
}

/**
 * Fetch the current user's walkthroughs using an explicit token.
 * @param token Bearer token to authenticate the request.
 * @returns Array of walkthroughs created by the user.
 */
export async function listMyWalkthroughsWithToken(token: string | null): Promise<Walkthrough[]> {
  return requestWithToken<Walkthrough[]>('/api/walkthroughs/mine', token);
}

/**
 * Load a single walkthrough by its id.
 * @param id Walkthrough identifier.
 * @returns Walkthrough data.
 */
export async function getWalkthrough(id: number): Promise<Walkthrough> {
  return request<Walkthrough>(`/api/walkthroughs/${id}`);
}

/**
 * Find walkthroughs relevant to the current page by origin and path.
 * Results are cached locally for offline use.
 * @param origin Current page origin.
 * @param path Current page path.
 * @returns Relevant walkthroughs for the page.
 */
export async function findRelevantWalkthroughs(origin: string, path: string): Promise<Walkthrough[]> {
  const items = await request<Walkthrough[]>(`/api/walkthroughs?origin=${encodeURIComponent(origin)}&path=${encodeURIComponent(path)}`);
  await cacheWalkthroughs(origin, path, items);
  return items;
}

/**
 * Find relevant walkthroughs using an explicit auth token.
 * @param origin Current page origin.
 * @param path Current page path.
 * @param token Bearer token to use for authentication.
 * @returns Relevant walkthroughs for the page.
 */
export async function findRelevantWalkthroughsWithToken(origin: string, path: string, token: string | null): Promise<Walkthrough[]> {
  const items = await requestWithToken<Walkthrough[]>(`/api/walkthroughs?origin=${encodeURIComponent(origin)}&path=${encodeURIComponent(path)}`, token);
  await cacheWalkthroughs(origin, path, items);
  return items;
}

/**
 * Load saved playback progress for a walkthrough.
 * @param walkthroughId Walkthrough identifier.
 * @returns Progress record for the walkthrough.
 */
export async function getProgress(walkthroughId: number): Promise<PlaybackProgress> {
  return request<PlaybackProgress>(`/api/walkthroughs/${walkthroughId}/progress`);
}

/**
 * Persist the currently viewed step index for a walkthrough.
 * @param walkthroughId Walkthrough identifier.
 * @param stepIndex Current step index.
 * @returns Updated progress record.
 */
export async function saveProgress(walkthroughId: number, stepIndex: number): Promise<PlaybackProgress> {
  return request<PlaybackProgress>(`/api/walkthroughs/${walkthroughId}/progress`, {
    method: "POST",
    body: JSON.stringify({ stepIndex }),
  });
}

/**
 * Delete a walkthrough belonging to the current authenticated user.
 * @param id Walkthrough identifier.
 */
export async function deleteWalkthrough(id: number): Promise<void> {
  return request<void>(`/api/walkthroughs/${id}`, {
    method: "DELETE",
  });
}
