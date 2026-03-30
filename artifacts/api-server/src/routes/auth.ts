import { Router, type IRouter } from "express";
import { mockUser } from "../mocks/users";
import { sessions } from "../lib/session";

const router: IRouter = Router();

router.get("/me", (req, res) => {
  const sessionId = req.cookies?.session;
  if (!sessionId || !sessions.has(sessionId)) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json(mockUser);
});

router.post("/auth/login", (_req, res) => {
  const sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  sessions.add(sessionId);
  res.cookie("session", sessionId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 24 * 60 * 60 * 1000,
  });
  res.json(mockUser);
});

router.post("/auth/logout", (req, res) => {
  const sessionId = req.cookies?.session;
  if (sessionId) {
    sessions.delete(sessionId);
  }
  res.clearCookie("session", { path: "/" });
  res.json({ success: true });
});

export default router;
