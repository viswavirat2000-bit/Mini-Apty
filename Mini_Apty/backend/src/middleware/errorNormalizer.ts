import { Request, Response, NextFunction } from "express";

/**
 * Detect sqlite constraint errors from thrown error messages.
 * @param err Error object from sqlite operations.
 * @returns True when the error appears to be a unique constraint or DB constraint failure.
 */
function isSqliteConstraintError(err: any) {
  const msg = String(err?.message || "").toLowerCase();
  return msg.includes("unique constraint") || msg.includes("sqlite_3") || msg.includes("constraint failed");
}

/**
 * Express error middleware that normalizes API error responses.
 */
export default function errorNormalizer(err: any, req: Request, res: Response, next: NextFunction) {
  // If response already sent, forward
  if (res.headersSent) return next(err);

  // Use explicit status if present
  const status = err?.status || err?.statusCode;

  // Known error shapes
  if (typeof status === "number" && status >= 400 && status < 600) {
    return res.status(status).json({ error: String(err?.message || "error"), details: err?.details || undefined });
  }

  // Common database constraint => conflict
  if (isSqliteConstraintError(err)) {
    return res.status(409).json({ error: "conflict", details: String(err?.message || "") });
  }

  // Validation-like messages thrown as Error from controllers
  const msg = String(err?.message || "");
  if (msg.match(/required|invalid|must be|steps must|title required|origin required|pathpattern required|invalid walkthrough id/i)) {
    return res.status(400).json({ error: msg });
  }

  // Fallback: internal server error with safe message
  console.error("Uncaught API error:", err);
  return res.status(500).json({ error: "internal_error" });
}
