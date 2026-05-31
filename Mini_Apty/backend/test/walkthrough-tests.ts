import assert from "assert";
import { getDb, migrate } from "../src/db";
import { createUser, findUserByEmail, verifyPassword } from "../src/services/userService";
import * as walkthroughService from "../src/services/walkthroughService";
import * as progressService from "../src/services/progressService";

async function runAuthTests() {
  const email = `test+${Date.now()}@example.com`;
  const password = "s3cr3t";
  const user = await createUser(email, password);
  assert(user.id, "user created with id");
  const fetched = await findUserByEmail(email);
  assert(fetched, "user fetched");
  const ok = await verifyPassword(fetched!, password);
  assert(ok, "password verified");
}

async function runWalkthroughTests() {
  const db = await getDb();
  const email = `owner+${Date.now()}@example.com`;
  const owner = await createUser(email, "ownerpass");
  const walkthrough = await walkthroughService.createWalkthrough(owner.id, "Test Walkthrough", "https://example.com", "%/checkout%", [
    {
      target: { selector: "#start", text: "Start" },
      title: "First step",
      description: "Click start",
      trigger: "click",
    },
  ]);
  assert(walkthrough.id, "walkthrough created");

  const loaded = await walkthroughService.getWalkthroughById(walkthrough.id);
  assert(loaded, "walkthrough loaded");
  assert(loaded?.steps.length === 1, "one step loaded");

  const list = await walkthroughService.listWalkthroughsByOwner(owner.id);
  assert(list.length >= 1, "owner walkthrough list returns items");

  const updated = await walkthroughService.updateWalkthrough(walkthrough.id, owner.id, { title: "Updated" });
  assert(updated?.title === "Updated", "walkthrough updated");

  const relevant = await walkthroughService.findRelevantWalkthroughs("https://example.com", "/checkout/confirm");
  assert(relevant.some((item) => item.id === walkthrough.id), "relevant walkthrough found");

  const progress = await progressService.saveProgress(walkthrough.id, owner.id, 1);
  assert(progress.stepIndex === 1, "progress saved");

  const loadedProgress = await progressService.getProgress(walkthrough.id, owner.id);
  assert(loadedProgress?.stepIndex === 1, "progress loaded");

  const deleted = await walkthroughService.deleteWalkthrough(walkthrough.id, owner.id);
  assert(deleted, "walkthrough deleted");
  const missing = await walkthroughService.getWalkthroughById(walkthrough.id);
  assert(!missing, "walkthrough no longer exists");
}

async function run() {
  process.env.DATABASE_URL = ":memory:";
  await migrate();
  await runAuthTests();
  await runWalkthroughTests();
  console.log("All backend tests passed");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
