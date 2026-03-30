import { Router, type IRouter } from "express";

const router: IRouter = Router();

let currentPreferences = {
  theme: "light",
  language: "en",
  responseDetail: "detailed",
  notifications: true,
  autoSave: true,
};

router.get("/preferences", (_req, res) => {
  res.json(currentPreferences);
});

router.put("/preferences", (req, res) => {
  currentPreferences = { ...currentPreferences, ...req.body };
  res.json(currentPreferences);
});

export default router;
