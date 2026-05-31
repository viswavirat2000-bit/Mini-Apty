import express from "express";
import authRouter from "./routes/auth";
import walkthroughRouter from "./routes/walkthroughs";
import { migrate } from "./db";

const app = express();

app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/walkthroughs", walkthroughRouter);

app.get("/health", (req, res) => res.json({ status: "ok" }));

// error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err);
  res.status(500).json({ error: err?.message || "internal_error" });
});

// run migrations on start
migrate().catch((err) => console.error("Migration error", err));

export default app;
