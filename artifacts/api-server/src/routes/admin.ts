import { Router, type IRouter } from "express";
import { mockUser } from "../mocks/users";
import { mockActivities } from "../mocks/activities";
import { requireAdmin } from "../lib/session";
import { simpleGit } from "simple-git";
import archiver from "archiver";
import path from "path";
import fs from "fs";
import os from "os";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const router: IRouter = Router();

const PROJECT_ROOT = process.env.OASIS_PROJECT_ROOT
  ?? path.resolve(process.cwd(), "../..");

const EXPORT_IGNORE = [
  "node_modules/**",
  ".git/**",
  "dist/**",
  ".cache/**",
  ".local/**",
  ".config/**",
  ".env",
  ".env.*",
  ".replit",
  "replit.nix",
  "CoteOptimale/**",
  "attached_assets/**",
  "artifacts/mockup-sandbox/**",
];

async function isGitAvailable(): Promise<boolean> {
  try {
    await execFileAsync("git", ["--version"]);
    return true;
  } catch {
    return false;
  }
}

async function ensureGitRepo(git: ReturnType<typeof simpleGit>): Promise<void> {
  try {
    await git.status();
  } catch {
    await git.init();
    await git.addConfig("user.email", "oasis@local");
    await git.addConfig("user.name", "OASIS Export");
    await git.add(".");
    try {
      await git.commit("chore: export initial OASIS");
    } catch {}
  }
}

async function ensureCleanHead(git: ReturnType<typeof simpleGit>): Promise<void> {
  const status = await git.status();
  if (status.files.length === 0) return;
  await git.addConfig("user.email", "oasis@local");
  await git.addConfig("user.name", "OASIS Export");
  await git.add(".");
  try {
    await git.commit(`chore: export OASIS — ${new Date().toISOString()}`);
  } catch {}
}

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

// ── GET /api/admin/export ─────────────────────────────────────────────────
// Pattern CoteOptimale : écrit le ZIP dans un fichier temporaire d'abord
// (intégrité garantie), puis l'envoie avec Content-Length exact.
// Les exclusions sont gérées par EXPORT_IGNORE.
router.get("/admin/export", requireAdmin, async (_req, res) => {
  if (!fs.existsSync(PROJECT_ROOT)) {
    res.status(500).json({
      error: `Répertoire source introuvable : ${PROJECT_ROOT}. Définissez OASIS_PROJECT_ROOT dans les variables d'environnement.`,
    });
    return;
  }

  let tmpFile: string | null = null;

  try {
    tmpFile = path.join(os.tmpdir(), `oasis-export-${Date.now()}.zip`);
    const output = fs.createWriteStream(tmpFile);
    const archive = archiver("zip", { zlib: { level: 6 } });

    await new Promise<void>((resolve, reject) => {
      output.on("close", resolve);
      output.on("error", reject);
      archive.on("error", reject);

      archive.pipe(output);

      archive.glob("**/*", {
        cwd: PROJECT_ROOT,
        ignore: EXPORT_IGNORE,
        dot: true,
      });

      archive.finalize();
    });

    const stat = fs.statSync(tmpFile);
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", "attachment; filename=\"oasis-projet-export.zip\"");
    res.setHeader("Content-Length", stat.size);

    const fileStream = fs.createReadStream(tmpFile);
    fileStream.pipe(res);

    fileStream.on("end", () => {
      if (tmpFile && fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    });
    fileStream.on("error", () => {
      if (tmpFile && fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    });
  } catch (error: any) {
    if (tmpFile) {
      try {
        if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
      } catch {}
    }
    if (!res.headersSent) {
      res.status(500).json({ error: "Échec de l'export", details: error.message });
    }
  }
});

// ── POST /api/admin/git-push ──────────────────────────────────────────────
// Push le code source vers un dépôt distant.
// Compatible Docker/K8s : vérifie git, initialise le repo si absent,
// utilise OASIS_PROJECT_ROOT si défini.
router.post("/admin/git-push", requireAdmin, async (req, res) => {
  const { remoteUrl, branch = "main", token } = req.body;

  if (!remoteUrl) {
    res.status(400).json({ error: "L'URL du dépôt distant est requise" });
    return;
  }

  const gitOk = await isGitAvailable();
  if (!gitOk) {
    res.status(500).json({
      error: "Git n'est pas installé dans cet environnement.",
      details: "Ajoutez git à l'image Docker (ex: RUN apt-get install -y git).",
    });
    return;
  }

  if (!fs.existsSync(PROJECT_ROOT)) {
    res.status(500).json({
      error: `Répertoire source introuvable : ${PROJECT_ROOT}. Définissez OASIS_PROJECT_ROOT dans les variables d'environnement.`,
    });
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
    await ensureGitRepo(git);
    await ensureCleanHead(git);

    await git.addRemote(remoteName, authUrl);

    try {
      await git.push(remoteName, `HEAD:refs/heads/${branch}`, ["--force", "--set-upstream"]);
    } finally {
      try {
        await git.removeRemote(remoteName);
      } catch {}
    }

    res.json({
      success: true,
      message: `Code poussé avec succès sur ${branch}`,
      exportPath: PROJECT_ROOT,
    });
  } catch (error: any) {
    try {
      const git = simpleGit(PROJECT_ROOT);
      await git.removeRemote(remoteName);
    } catch {}

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
