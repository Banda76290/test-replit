import { Router, type IRouter } from "express";
import { mockUser } from "../mocks/users";
import { mockActivities } from "../mocks/activities";
import { requireAdmin } from "../lib/session";
import { simpleGit } from "simple-git";
import path from "path";
import fs from "fs";
import { execFile, spawn } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const router: IRouter = Router();

const PROJECT_ROOT = process.env.OASIS_PROJECT_ROOT
  ?? path.resolve(process.cwd(), "../..");

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
// Utilise `git archive HEAD --format=zip` pour générer un ZIP agnostique.
// Les exclusions sont pilotées uniquement par le .gitignore — plus besoin
// d'une liste manuelle. Compatible Docker / Kubernetes.
router.get("/admin/export", requireAdmin, async (_req, res) => {
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

  try {
    const git = simpleGit(PROJECT_ROOT);
    await ensureGitRepo(git);
    await ensureCleanHead(git);

    res.set({
      "Content-Type": "application/zip",
      "Content-Disposition": "attachment; filename=oasis-projet-export.zip",
      "X-Export-Path": PROJECT_ROOT,
    });

    const archive = spawn("git", ["archive", "HEAD", "--format=zip"], {
      cwd: PROJECT_ROOT,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stderr = "";
    archive.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });

    archive.stdout.pipe(res);

    archive.on("close", (code) => {
      if (code !== 0 && !res.headersSent) {
        res.status(500).json({ error: "Échec de git archive", details: stderr });
      }
    });

    archive.on("error", (err) => {
      if (!res.headersSent) {
        res.status(500).json({ error: "Échec de git archive", details: err.message });
      }
    });
  } catch (error: any) {
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
