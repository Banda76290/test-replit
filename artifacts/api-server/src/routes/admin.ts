import { Router, type IRouter } from "express";
import { mockUser } from "../mocks/users";
import { mockActivities } from "../mocks/activities";
import { requireAdmin } from "../lib/session";
import archiver from "archiver";
import { simpleGit } from "simple-git";
import path from "path";
import os from "os";
import fs from "fs";

const router: IRouter = Router();

const PROJECT_ROOT = path.resolve(process.cwd(), "../..");

const EXCLUDE_GLOBS = [
  "node_modules/**",
  ".git/**",
  "dist/**",
  ".local/**",
  ".env",
  ".env.local",
  ".env.*.local",
  ".cache/**",
  ".replit",
  "replit.nix",
  ".config/**",
  "*.tsbuildinfo",
];

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

router.get("/admin/export", requireAdmin, async (_req, res) => {
  const tmpFile = path.join(os.tmpdir(), `oasis-export-${Date.now()}.zip`);

  try {
    const output = fs.createWriteStream(tmpFile);
    const archive = archiver("zip", { zlib: { level: 9 } });

    await new Promise<void>((resolve, reject) => {
      output.on("close", resolve);
      output.on("error", reject);
      archive.on("error", reject);

      archive.pipe(output);
      archive.glob("**/*", {
        cwd: PROJECT_ROOT,
        ignore: EXCLUDE_GLOBS,
        dot: true,
      });
      archive.finalize();
    });

    const stat = fs.statSync(tmpFile);
    res.set({
      "Content-Type": "application/zip",
      "Content-Disposition": "attachment; filename=oasis-projet-export.zip",
      "Content-Length": stat.size.toString(),
    });

    const readStream = fs.createReadStream(tmpFile);
    const cleanup = () => fs.unlink(tmpFile, () => {});
    readStream.on("end", cleanup);
    readStream.on("error", cleanup);
    res.on("close", cleanup);
    readStream.pipe(res);
  } catch (error: any) {
    fs.unlink(tmpFile, () => {});
    res.status(500).json({
      error: "Échec de l'export",
    });
  }
});

router.post("/admin/git-push", requireAdmin, async (req, res) => {
  const { remoteUrl, branch = "main", token } = req.body;

  if (!remoteUrl) {
    res.status(400).json({ error: "L'URL du dépôt distant est requise" });
    return;
  }

  const remoteName = `export-${Date.now()}`;

  try {
    let authUrl = remoteUrl;
    if (token && remoteUrl.startsWith("https://")) {
      authUrl = remoteUrl.replace("https://", `https://x-access-token:${token}@`);
    }

    const git = simpleGit(PROJECT_ROOT);

    await git.env({
      ...process.env,
      GIT_TERMINAL_PROMPT: "0",
    });

    await git.addConfig("credential.helper", "");

    await git.addRemote(remoteName, authUrl);

    try {
      await git.push(remoteName, `HEAD:refs/heads/${branch}`, ["--force", "--set-upstream"]);
    } finally {
      try {
        await git.removeRemote(remoteName);
      } catch {
      }
    }

    res.json({
      success: true,
      message: `Code poussé avec succès sur ${branch}`,
    });
  } catch (error: any) {
    try {
      const git = simpleGit(PROJECT_ROOT);
      await git.removeRemote(remoteName);
    } catch {
    }

    const sanitized = (error.message || "")
      .replace(/x-access-token:[^@]+@/g, "x-access-token:***@")
      .replace(/https?:\/\/[^@]*@/g, "https://***@");
    res.status(500).json({
      error: "Échec du push Git",
      details: sanitized,
    });
  }
});

export default router;
