import { AuthResponse, PlaybackProgress, Walkthrough } from "./types";
import { getToken, cacheWalkthroughs } from "./storage";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

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
  return response.json();
}

export async function signup(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

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

export async function listMyWalkthroughs(): Promise<Walkthrough[]> {
  return request<Walkthrough[]>("/api/walkthroughs/mine");
}

export async function findRelevantWalkthroughs(origin: string, path: string): Promise<Walkthrough[]> {
  const items = await request<Walkthrough[]>(`/api/walkthroughs?origin=${encodeURIComponent(origin)}&path=${encodeURIComponent(path)}`);
  await cacheWalkthroughs(origin, path, items);
  return items;
}

export async function getProgress(walkthroughId: number): Promise<PlaybackProgress> {
  return request<PlaybackProgress>(`/api/walkthroughs/${walkthroughId}/progress`);
}

export async function saveProgress(walkthroughId: number, stepIndex: number): Promise<PlaybackProgress> {
  return request<PlaybackProgress>(`/api/walkthroughs/${walkthroughId}/progress`, {
    method: "POST",
    body: JSON.stringify({ stepIndex }),
  });
}
