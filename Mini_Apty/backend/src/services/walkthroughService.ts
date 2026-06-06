import { execute, query, queryAll } from "../db";

export interface WalkthroughStep {
  target: {
    id?: string;
    selector?: string;
    text?: string;
    value?: string;
    role?: string;
    attributes?: Record<string, string>;
  };
  title: string;
  description: string;
  trigger?: "click" | "next" | "manual";
}

export interface Walkthrough {
  id: number;
  ownerId: number;
  title: string;
  origin: string;
  pathPattern: string;
  steps: WalkthroughStep[];
  createdAt: string;
  updatedAt: string;
}

interface WalkthroughRow {
  id: number;
  ownerId: number;
  title: string;
  origin: string;
  pathPattern: string;
  stepsJson: string;
  createdAt: string;
  updatedAt: string;
}

const serializeSteps = (steps: WalkthroughStep[]) => JSON.stringify(steps);
const parseSteps = (data: string) => JSON.parse(data) as WalkthroughStep[];

/**
 * Create and persist a new walkthrough for a user.
 */
export async function createWalkthrough(
  ownerId: number,
  title: string,
  origin: string,
  pathPattern: string,
  steps: WalkthroughStep[]
): Promise<Walkthrough> {
  const createdAt = new Date().toISOString();
  const updatedAt = createdAt;
  const result = await execute(
    `INSERT INTO walkthroughs (ownerId, title, origin, pathPattern, stepsJson, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [ownerId, title, origin, pathPattern, serializeSteps(steps), createdAt, updatedAt]
  );
  return {
    id: Number(result.lastID),
    ownerId,
    title,
    origin,
    pathPattern,
    steps,
    createdAt,
    updatedAt,
  };
}

/**
 * Load a walkthrough by its id.
 * @param id Walkthrough identifier.
 * @returns Walkthrough record or null if not found.
 */
export async function getWalkthroughById(id: number): Promise<Walkthrough | null> {
  const row = await query<WalkthroughRow>(`SELECT * FROM walkthroughs WHERE id = ?`, [id]);
  if (!row) return null;
  return {
    id: row.id,
    ownerId: row.ownerId,
    title: row.title,
    origin: row.origin,
    pathPattern: row.pathPattern,
    steps: parseSteps(row.stepsJson),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * List all walkthroughs owned by a specific user.
 * @param ownerId User id.
 * @returns Array of walkthroughs.
 */
export async function listWalkthroughsByOwner(ownerId: number): Promise<Walkthrough[]> {
  const rows = await queryAll<WalkthroughRow>(`SELECT * FROM walkthroughs WHERE ownerId = ? ORDER BY updatedAt DESC`, [ownerId]);
  return rows.map((row) => ({
    id: row.id,
    ownerId: row.ownerId,
    title: row.title,
    origin: row.origin,
    pathPattern: row.pathPattern,
    steps: parseSteps(row.stepsJson),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

/**
 * Find walkthroughs matching an origin and path pattern.
 * @param origin Page origin.
 * @param path Page path.
 * @returns Matching walkthroughs.
 */
export async function findRelevantWalkthroughs(origin: string, path: string): Promise<Walkthrough[]> {
  const rows = await queryAll<WalkthroughRow>(
    `SELECT * FROM walkthroughs WHERE origin = ? AND (? LIKE pathPattern) ORDER BY updatedAt DESC`,
    [origin, path]
  );
  return rows.map((row) => ({
    id: row.id,
    ownerId: row.ownerId,
    title: row.title,
    origin: row.origin,
    pathPattern: row.pathPattern,
    steps: parseSteps(row.stepsJson),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

/**
 * Update a walkthrough metadata or steps for the given owner.
 */
export async function updateWalkthrough(
  id: number,
  ownerId: number,
  updates: Partial<Omit<Walkthrough, "id" | "ownerId" | "createdAt">>
): Promise<Walkthrough | null> {
  const existing = await getWalkthroughById(id);
  if (!existing || existing.ownerId !== ownerId) return null;
  const updatedAt = new Date().toISOString();
  const title = updates.title ?? existing.title;
  const origin = updates.origin ?? existing.origin;
  const pathPattern = updates.pathPattern ?? existing.pathPattern;
  const steps = updates.steps ?? existing.steps;
  await execute(
    `UPDATE walkthroughs SET title = ?, origin = ?, pathPattern = ?, stepsJson = ?, updatedAt = ? WHERE id = ?`,
    [title, origin, pathPattern, serializeSteps(steps), updatedAt, id]
  );
  return {
    id,
    ownerId,
    title,
    origin,
    pathPattern,
    steps,
    createdAt: existing.createdAt,
    updatedAt,
  };
}

/**
 * Delete a walkthrough owned by the user.
 * @param id Walkthrough identifier.
 * @param ownerId Owner user id.
 * @returns True if deletion succeeded.
 */
export async function deleteWalkthrough(id: number, ownerId: number): Promise<boolean> {
  const result = await execute(`DELETE FROM walkthroughs WHERE id = ? AND ownerId = ?`, [id, ownerId]);
  return result.changes > 0;
}
