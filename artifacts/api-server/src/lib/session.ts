import type { Request, Response, NextFunction } from "express";
import { mockUser } from "../mocks/users";

export const sessions = new Set<string>();

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const sessionId = req.cookies?.session;
  if (!sessionId || !sessions.has(sessionId)) {
    res.status(401).json({ error: "Non authentifié" });
    return;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const sessionId = req.cookies?.session;
  if (!sessionId || !sessions.has(sessionId)) {
    res.status(401).json({ error: "Non authentifié" });
    return;
  }
  if (!mockUser.isAdmin) {
    res.status(403).json({ error: "Accès réservé aux administrateurs" });
    return;
  }
  next();
}
