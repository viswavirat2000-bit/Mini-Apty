import { Request, Response, NextFunction } from "express";
import * as walkthroughService from "../services/walkthroughService";
import * as progressService from "../services/progressService";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

const validTrigger = new Set(["click", "next", "manual"]);

/**
 * Normalize incoming step payloads from the API into the service model.
 * @param input Raw request body steps data.
 * @returns Validated walkthrough steps.
 */
function normalizeSteps(input: any): walkthroughService.WalkthroughStep[] {
  if (!Array.isArray(input)) throw new Error("steps must be an array");
  return input.map((step) => {
    if (!step || typeof step !== "object") throw new Error("invalid step");
    if (typeof step.title !== "string" || !step.title.trim()) throw new Error("step title required");
    if (typeof step.description !== "string") throw new Error("step description required");
    const target = step.target;
    if (!target || typeof target !== "object") throw new Error("step target required");
    return {
      title: step.title.trim(),
      description: step.description.trim(),
      trigger: validTrigger.has(step.trigger) ? step.trigger : "manual",
      target: {
        id: typeof target.id === "string" ? target.id : undefined,
        selector: typeof target.selector === "string" ? target.selector : undefined,
        text: typeof target.text === "string" ? target.text : undefined,
        value: typeof target.value === "string" ? target.value : undefined,
        role: typeof target.role === "string" ? target.role : undefined,
        attributes: typeof target.attributes === "object" && target.attributes ? target.attributes : undefined,
        pageUrl: typeof target.pageUrl === "string" ? target.pageUrl : undefined,
      },
    };
  });
}

/**
 * Create a new walkthrough for the authenticated user.
 */
export async function createWalkthrough(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { title, origin, pathPattern, steps } = req.body;
    if (!req.user) return res.status(401).json({ error: "authorization required" });
    if (typeof title !== "string" || !title.trim()) return res.status(400).json({ error: "title required" });
    if (typeof origin !== "string" || !origin.trim()) return res.status(400).json({ error: "origin required" });
    if (typeof pathPattern !== "string" || !pathPattern.trim()) return res.status(400).json({ error: "pathPattern required" });
    const normalized = normalizeSteps(steps);
    const walkthrough = await walkthroughService.createWalkthrough(req.user.id, title.trim(), origin.trim(), pathPattern.trim(), normalized);
    res.status(201).json(walkthrough);
  } catch (err: any) {
    next(err);
  }
}

/**
 * List walkthroughs owned by the authenticated user.
 */
export async function listOwnWalkthroughs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ error: "authorization required" });
    const items = await walkthroughService.listWalkthroughsByOwner(req.user.id);
    res.json(items);
  } catch (err: any) {
    next(err);
  }
}

/**
 * Return walkthroughs relevant to a given origin/path pair.
 */
export async function listRelevantWalkthroughs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { origin, path } = req.query;
    if (typeof origin !== "string" || typeof path !== "string") {
      return res.status(400).json({ error: "origin and path query parameters required" });
    }
    const items = await walkthroughService.findRelevantWalkthroughs(origin, path);
    res.json(items);
  } catch (err: any) {
    next(err);
  }
}

/**
 * Return a single walkthrough by id.
 */
export async function getWalkthrough(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "invalid walkthrough id" });
    const item = await walkthroughService.getWalkthroughById(id);
    if (!item) return res.status(404).json({ error: "walkthrough not found" });
    res.json(item);
  } catch (err: any) {
    next(err);
  }
}

/**
 * Update an existing walkthrough belonging to the authenticated user.
 */
export async function updateWalkthrough(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ error: "authorization required" });
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "invalid walkthrough id" });
    const existing = await walkthroughService.getWalkthroughById(id);
    if (!existing) return res.status(404).json({ error: "walkthrough not found" });
    if (existing.ownerId !== req.user.id) return res.status(403).json({ error: "not authorized" });
    const updates: any = {};
    if (typeof req.body.title === "string") updates.title = req.body.title.trim();
    if (typeof req.body.origin === "string") updates.origin = req.body.origin.trim();
    if (typeof req.body.pathPattern === "string") updates.pathPattern = req.body.pathPattern.trim();
    if (req.body.steps) updates.steps = normalizeSteps(req.body.steps);
    const updated = await walkthroughService.updateWalkthrough(id, req.user.id, updates);
    if (!updated) return res.status(404).json({ error: "update failed" });
    res.json(updated);
  } catch (err: any) {
    next(err);
  }
}

/**
 * Delete a walkthrough owned by the authenticated user.
 */
export async function deleteWalkthrough(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ error: "authorization required" });
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "invalid walkthrough id" });
    const success = await walkthroughService.deleteWalkthrough(id, req.user.id);
    if (!success) return res.status(404).json({ error: "walkthrough not found or unauthorized" });
    res.status(204).send();
  } catch (err: any) {
    next(err);
  }
}

/**
 * Retrieve playback progress for a walkthrough for the current user.
 */
export async function getProgress(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ error: "authorization required" });
    const walkthroughId = Number(req.params.id);
    if (!walkthroughId) return res.status(400).json({ error: "invalid walkthrough id" });
    const progress = await progressService.getProgress(walkthroughId, req.user.id);
    res.json(progress || { walkthroughId, userId: req.user.id, stepIndex: 0 });
  } catch (err: any) {
    next(err);
  }
}

/**
 * Save playback progress for a walkthrough for the current user.
 */
export async function saveProgress(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ error: "authorization required" });
    const walkthroughId = Number(req.params.id);
    const stepIndex = Number(req.body.stepIndex);
    if (!walkthroughId || Number.isNaN(stepIndex) || stepIndex < 0) {
      return res.status(400).json({ error: "invalid progress payload" });
    }
    const progress = await progressService.saveProgress(walkthroughId, req.user.id, stepIndex);
    res.json(progress);
  } catch (err: any) {
    next(err);
  }
}
