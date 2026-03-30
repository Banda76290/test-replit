import { Router, type IRouter } from "express";
import { mockUser } from "../mocks/users";
import { mockActivities } from "../mocks/activities";

const router: IRouter = Router();

router.get("/admin/profile", (_req, res) => {
  res.json({
    user: mockUser,
    recentLogins: [
      { date: "2026-03-29T08:30:00Z", ip: "192.168.1.42", device: "Chrome 124 — macOS" },
      { date: "2026-03-28T09:00:00Z", ip: "192.168.1.42", device: "Chrome 124 — macOS" },
      { date: "2026-03-27T08:45:00Z", ip: "10.0.0.15", device: "Safari 17 — iPad" },
      { date: "2026-03-26T14:00:00Z", ip: "192.168.1.42", device: "Chrome 124 — macOS" },
      { date: "2026-03-25T08:30:00Z", ip: "192.168.1.42", device: "Chrome 124 — macOS" },
    ],
    activityHistory: mockActivities,
    sessionSettings: {
      timeout: 30,
      maxSessions: 3,
    },
  });
});

export default router;
