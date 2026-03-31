import { Router, type IRouter } from "express";
import { mockUser } from "../mocks/users";
import { mockActivities } from "../mocks/activities";
import { requireAdmin } from "../lib/session";
import archiver from "archiver";
import { simpleGit } from "simple-git";
import path from "path";
import os from "os";
import fs from "fs";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const router: IRouter = Router();

// ── Répertoire racine du projet ───────────────────────────────────────────
// En développement Replit : résolution relative depuis api-server.
// En production Docker/Kubernetes : définir OASIS_PROJECT_ROOT dans l'env
// (ex: /app/workspace ou un volume monté via docker-compose / K8s PVC).
const PROJECT_ROOT = process.env.OASIS_PROJECT_ROOT
  ?? path.resolve(process.cwd(), "../..");

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

// ── Vérifie si git est disponible dans le PATH du container ──────────────
async function isGitAvailable(): Promise<boolean> {
  try {
    await execFileAsync("git", ["--version"]);
    return true;
  } catch {
    return false;
  }
}

// ── Vérifie si PROJECT_ROOT est un dépôt git ; l'initialise si besoin ───
async function ensureGitRepo(git: ReturnType<typeof simpleGit>): Promise<void> {
  try {
    await git.status();
  } catch {
    // Pas de dépôt git → on l'initialise et on crée un commit initial
    await git.init();
    await git.addConfig("user.email", "oasis@local");
    await git.addConfig("user.name", "OASIS Export");
    await git.add(".");
    try {
      await git.commit("chore: export initial OASIS");
    } catch {
      // Commit peut échouer si rien à committer, on continue
    }
  }
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
// Génère un ZIP du code source et le streame en réponse.
// Compatible Docker/K8s : utilise OASIS_PROJECT_ROOT si défini.
router.get("/admin/export", requireAdmin, async (_req, res) => {
  if (!fs.existsSync(PROJECT_ROOT)) {
    res.status(500).json({
      error: `Répertoire source introuvable : ${PROJECT_ROOT}. Définissez OASIS_PROJECT_ROOT dans les variables d'environnement.`,
    });
    return;
  }

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
      "X-Export-Path": PROJECT_ROOT,
    });

    const readStream = fs.createReadStream(tmpFile);
    const cleanup = () => fs.unlink(tmpFile, () => {});
    readStream.on("end", cleanup);
    readStream.on("error", cleanup);
    res.on("close", cleanup);
    readStream.pipe(res);
  } catch (error: any) {
    fs.unlink(tmpFile, () => {});
    res.status(500).json({ error: "Échec de l'export", details: error.message });
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

  // 1. Vérifier que git est disponible dans le container
  const gitOk = await isGitAvailable();
  if (!gitOk) {
    res.status(500).json({
      error: "Git n'est pas installé dans cet environnement.",
      details: "Ajoutez `git` à l'image Docker (ex: RUN apt-get install -y git) ou montez un volume avec git disponible.",
    });
    return;
  }

  // 2. Vérifier que le répertoire source existe
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

    // 3. S'assurer qu'un repo git existe (sinon l'initialiser)
    await ensureGitRepo(git);

    // 4. S'assurer que les modifications non committées sont commitées
    // (nécessaire dans les containers où le code a été copié sans .git)
    const status = await git.status();
    if (status.files.length > 0) {
      await git.addConfig("user.email", "oasis@local");
      await git.addConfig("user.name", "OASIS Export");
      await git.add(".");
      try {
        await git.commit(`chore: export OASIS — ${new Date().toISOString()}`);
      } catch {
        // Ignore si rien à committer
      }
    }

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
      exportPath: PROJECT_ROOT,
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
