import { query, execute } from "../db";

export interface PlaybackProgress {
  id: number;
  walkthroughId: number;
  userId: number;
  stepIndex: number;
  updatedAt: string;
}

export async function getProgress(walkthroughId: number, userId: number): Promise<PlaybackProgress | null> {
  const row = await query<PlaybackProgress>(`SELECT * FROM progress WHERE walkthroughId = ? AND userId = ?`, [walkthroughId, userId]);
  return row || null;
}

export async function saveProgress(walkthroughId: number, userId: number, stepIndex: number): Promise<PlaybackProgress> {
  const updatedAt = new Date().toISOString();
  const existing = await getProgress(walkthroughId, userId);
  if (existing) {
    await execute(`UPDATE progress SET stepIndex = ?, updatedAt = ? WHERE id = ?`, [stepIndex, updatedAt, existing.id]);
    return { ...existing, stepIndex, updatedAt };
  }
  const result = await execute(
    `INSERT INTO progress (walkthroughId, userId, stepIndex, updatedAt) VALUES (?, ?, ?, ?)`,
    [walkthroughId, userId, stepIndex, updatedAt]
  );
  return {
    id: Number(result.lastID),
    walkthroughId,
    userId,
    stepIndex,
    updatedAt,
  };
}
