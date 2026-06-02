import express from "express";
import {
  createWalkthrough,
  listOwnWalkthroughs,
  listRelevantWalkthroughs,
  getWalkthrough,
  updateWalkthrough,
  deleteWalkthrough,
  getProgress,
  saveProgress,
} from "../controllers/walkthroughController";
import { requireAuth } from "../middleware/authMiddleware";

const router: express.Router = express.Router();

router.use(requireAuth);

router.get("/mine", listOwnWalkthroughs);
router.get("", listRelevantWalkthroughs);
router.post("", createWalkthrough);
router.get("/:id", getWalkthrough);
router.put("/:id", updateWalkthrough);
router.delete("/:id", deleteWalkthrough);
router.get("/:id/progress", getProgress);
router.post("/:id/progress", saveProgress);

export default router;
