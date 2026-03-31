import { useState } from "react";
import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGetAdminProfile, useUpdatePreferences } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { 
  User, Shield, Bell, Settings as SettingsIcon, Monitor, Save, Loader2,
  Download, GitBranch, CheckCircle, XCircle, Package, Lock
} from "lucide-react";

export default function AdminPage() {
  const { data: profile, isLoading } = useGetAdminProfile();
  const { user } = useAuth();
  const updatePrefs = useUpdatePreferences();
  
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setIsSaving(false);
  };

  if (isLoading || !profile) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const isAdmin = user?.isAdmin === true;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Administration & Profil</h1>
          <p className="text-muted-foreground mt-1">Gérez votre compte OASIS, vos paramètres et vos préférences.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-6">
            <Card className="border-border/60 shadow-sm bg-card overflow-hidden text-center">
              <div className="h-24 bg-gradient-to-r from-primary/80 to-primary"></div>
              <CardContent className="px-6 pb-6 pt-0 relative">
                <div className="w-20 h-20 rounded-full border-4 border-background bg-card mx-auto -mt-10 mb-4 shadow-sm flex items-center justify-center overflow-hidden">
                  <div className="w-full h-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold">
                    {profile.user.name.charAt(0)}
                  </div>
                </div>
                <h2 className="text-xl font-bold text-foreground">{profile.user.name}</h2>
                <p className="text-sm text-muted-foreground">{profile.user.email}</p>
                
                <div className="mt-6 flex flex-col gap-2">
                  <div className="flex justify-between items-center px-3 py-2 bg-muted/30 rounded-md text-sm border border-border/50">
                    <span className="text-muted-foreground flex items-center"><User className="w-4 h-4 mr-2" /> Rôle</span>
                    <span className="font-medium text-foreground">{profile.user.role}</span>
                  </div>
                  <div className="flex justify-between items-center px-3 py-2 bg-muted/30 rounded-md text-sm border border-border/50">
                    <span className="text-muted-foreground flex items-center"><Shield className="w-4 h-4 mr-2" /> Équipe</span>
                    <span className="font-medium text-foreground">{profile.user.team}</span>
                  </div>
                  {isAdmin && (
                    <div className="flex justify-between items-center px-3 py-2 bg-primary/5 rounded-md text-sm border border-primary/20">
                      <span className="text-primary flex items-center"><Lock className="w-4 h-4 mr-2" /> Accès</span>
                      <span className="font-semibold text-primary">Administrateur</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2 space-y-6">
            <Card className="border-border/60 shadow-sm bg-card">
              <CardHeader className="border-b border-border/50 bg-muted/10">
                <CardTitle className="text-lg flex items-center">
                  <SettingsIcon className="w-5 h-5 mr-2 text-primary" />
                  Préférences de l'espace de travail
                </CardTitle>
                <CardDescription>Personnalisez le comportement et les réponses d'OASIS</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground block">Niveau de détail des réponses</label>
                    <select className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                      <option>Concis</option>
                      <option>Standard</option>
                      <option>Détaillé</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground block">Langue de sortie par défaut</label>
                    <select className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                      <option>Français</option>
                      <option>Anglais</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-foreground">Notifications par e-mail</h4>
                    <p className="text-xs text-muted-foreground">Recevoir des alertes lorsque les analyses longues sont terminées</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleSave} disabled={isSaving} className="shadow-sm">
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Enregistrer les modifications
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-sm bg-card">
              <CardHeader className="border-b border-border/50 bg-muted/10">
                <CardTitle className="text-lg flex items-center">
                  <Monitor className="w-5 h-5 mr-2 text-muted-foreground" />
                  Connexions récentes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {profile.recentLogins.map((login, i) => (
                    <div key={i} className="flex justify-between items-center p-4 text-sm hover:bg-muted/10 transition-colors">
                      <div>
                        <p className="font-medium text-foreground">{login.device}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">IP : {login.ip}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(login.date).toLocaleDateString('fr-FR')} {new Date(login.date).toLocaleTimeString('fr-FR')}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {isAdmin && (
              <>
                <ExportCard />
                <GitPushCard />
              </>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function ExportCard() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<{ type: "success" | "error"; message: string; details?: string } | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setExportStatus(null);
    try {
      const baseUrl = import.meta.env.BASE_URL || '/';
      const response = await fetch(`${baseUrl}api/admin/export`, {
        credentials: "include",
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Erreur inconnue" }));
        throw new Error(err.error || `Erreur ${response.status}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "oasis-projet-export.zip";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setExportStatus({ type: "success", message: "Archive ZIP téléchargée avec succès" });
    } catch (error: any) {
      setExportStatus({ type: "error", message: error.message || "Échec de l'export" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className="border-border/60 shadow-sm bg-card">
      <CardHeader className="border-b border-border/50 bg-muted/10">
        <CardTitle className="text-lg flex items-center">
          <Package className="w-5 h-5 mr-2 text-primary" />
          Exporter le code source
        </CardTitle>
        <CardDescription>
          Téléchargez une archive ZIP du projet complet pour le déployer via Docker Compose, Kubernetes ou un pipeline CI/CD (Codify).
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="bg-muted/20 rounded-lg p-4 border border-border/40 space-y-3">
          <div>
            <p className="text-sm text-muted-foreground mb-2 font-medium">Fichiers exclus de l'archive :</p>
            <div className="flex flex-wrap gap-2">
              {["node_modules", ".git", "dist", ".local", ".env", ".cache"].map(item => (
                <span key={item} className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs font-mono border border-border">
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="pt-2 border-t border-border/40">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Docker / Kubernetes :</span>{" "}
              Définissez la variable d'environnement{" "}
              <code className="bg-muted px-1 rounded text-[11px]">OASIS_PROJECT_ROOT</code>{" "}
              dans votre <code className="bg-muted px-1 rounded text-[11px]">docker-compose.yml</code> ou manifest K8s
              pour pointer vers le volume monté contenant le code source.
            </p>
          </div>
        </div>

        {exportStatus && (
          <div className={`flex items-start gap-2 p-3 rounded-md text-sm border ${
            exportStatus.type === "success"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-destructive/10 text-destructive border-destructive/20"
          }`}>
            {exportStatus.type === "success" ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 shrink-0 mt-0.5" />}
            <div>
              <p>{exportStatus.message}</p>
              {exportStatus.details && <p className="text-xs mt-1 opacity-80 font-mono">{exportStatus.details}</p>}
            </div>
          </div>
        )}

        <Button onClick={handleExport} disabled={isExporting} className="shadow-sm">
          {isExporting ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Génération de l'archive...</>
          ) : (
            <><Download className="w-4 h-4 mr-2" /> Télécharger le ZIP</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

function GitPushCard() {
  const [remoteUrl, setRemoteUrl] = useState("");
  const [branch, setBranch] = useState("main");
  const [token, setToken] = useState("");
  const [isPushing, setIsPushing] = useState(false);
  const [pushStatus, setPushStatus] = useState<{ type: "success" | "error"; message: string; details?: string } | null>(null);

  const handlePush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remoteUrl.trim()) return;

    setIsPushing(true);
    setPushStatus(null);
    try {
      const baseUrl = import.meta.env.BASE_URL || '/';
      const response = await fetch(`${baseUrl}api/admin/git-push`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remoteUrl, branch, token: token || undefined }),
      });
      const data = await response.json();
      if (!response.ok) {
        const err = new Error(data.error || `Erreur ${response.status}`) as any;
        err.details = data.details;
        throw err;
      }
      setPushStatus({ type: "success", message: data.message });
    } catch (error: any) {
      setPushStatus({ type: "error", message: error.message || "Échec du push", details: error.details });
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <Card className="border-border/60 shadow-sm bg-card">
      <CardHeader className="border-b border-border/50 bg-muted/10">
        <CardTitle className="text-lg flex items-center">
          <GitBranch className="w-5 h-5 mr-2 text-primary" />
          Pousser vers Git
        </CardTitle>
        <CardDescription>
          Envoyez le code source vers un dépôt GitHub ou GitLab. Compatible Docker / Kubernetes via Codify — le repo est initialisé automatiquement si absent. Le push utilise{" "}
          <code className="text-xs bg-muted px-1 rounded">--force</code> pour synchroniser l'historique.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handlePush} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">URL du dépôt distant *</label>
            <input
              type="url"
              value={remoteUrl}
              onChange={(e) => setRemoteUrl(e.target.value)}
              placeholder="https://github.com/organisation/oasis-projet.git"
              required
              className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">Branche</label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="main"
                className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">Token d'accès</label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_xxxx... (optionnel)"
                className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              <p className="text-[11px] text-muted-foreground">
                Personal Access Token avec les scopes <code className="bg-muted px-1 rounded text-[10px]">repo</code> + <code className="bg-muted px-1 rounded text-[10px]">workflow</code>
              </p>
            </div>
          </div>

          <div className="bg-muted/20 rounded-lg px-4 py-3 border border-border/40">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Docker / Kubernetes :</span>{" "}
              Assurez-vous que <code className="bg-muted px-1 rounded text-[11px]">git</code> est installé dans l'image
              (ex&nbsp;: <code className="bg-muted px-1 rounded text-[11px]">RUN apt-get install -y git</code>) et définissez{" "}
              <code className="bg-muted px-1 rounded text-[11px]">OASIS_PROJECT_ROOT</code> vers le volume contenant le code source.
              Le repo Git est initialisé automatiquement si le répertoire n'en possède pas.
            </p>
          </div>

          {pushStatus && (
            <div className={`flex items-start gap-2 p-3 rounded-md text-sm border ${
              pushStatus.type === "success"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-destructive/10 text-destructive border-destructive/20"
            }`}>
              {pushStatus.type === "success" ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 shrink-0 mt-0.5" />}
              <div>
                <p>{pushStatus.message}</p>
                {pushStatus.details && (
                  <p className="text-xs mt-1 opacity-80 font-mono whitespace-pre-wrap">{pushStatus.details}</p>
                )}
              </div>
            </div>
          )}

          <Button type="submit" disabled={isPushing || !remoteUrl.trim()} className="shadow-sm">
            {isPushing ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Push en cours...</>
            ) : (
              <><GitBranch className="w-4 h-4 mr-2" /> Pousser le code</>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
