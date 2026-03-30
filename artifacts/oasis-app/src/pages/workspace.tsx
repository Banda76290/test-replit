import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGetProject, useRunAnalysis, useSubmitFeedback, type AnalysisResult } from "@workspace/api-client-react";
import { useRoute, useLocation } from "wouter";
import { 
  Cpu, FileText, Send, Sparkles, AlertTriangle, CheckCircle2, 
  GitMerge, Server, ThumbsUp, ThumbsDown, Loader2, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const TASK_TYPES = [
  { id: "analyze-need", label: "Analyser un besoin" },
  { id: "propose-implementation", label: "Proposer une implémentation" },
  { id: "analyze-impact", label: "Analyse d'impact" },
  { id: "generate-plan", label: "Générer un plan technique" },
  { id: "generate-docs", label: "Générer la documentation" },
  { id: "prepare-response", label: "Préparer une réponse technique" },
  { id: "propose-fix", label: "Proposer un correctif" },
  { id: "produce-diff", label: "Produire un diff de code" },
];

export default function WorkspacePage() {
  const [, params] = useRoute("/workspace/:projectId");
  const projectId = params?.projectId || "";
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!projectId) {
      navigate("/clients");
    }
  }, [projectId, navigate]);

  const { data: project } = useGetProject(projectId);
  const runAnalysis = useRunAnalysis();
  
  const [taskType, setTaskType] = useState(TASK_TYPES[0].id);
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "plan" | "sources">("summary");

  const handleRunAnalysis = async () => {
    if (!prompt.trim()) return;
    try {
      const res = await runAnalysis.mutateAsync({
        data: {
          projectId,
          clientId: project?.clientId || "",
          taskType,
          prompt
        }
      });
      setResult(res);
      setActiveTab("summary");
    } catch (e) {
      console.error("Échec de l'analyse", e);
    }
  };

  return (
    <AppLayout>
      <div className="h-full flex flex-col max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center">
              Espace de travail OASIS
            </h1>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
              Contexte : <span className="font-semibold text-primary">{project?.name || "Chargement..."}</span>
              <span className="px-2 py-0.5 rounded bg-muted text-[10px] uppercase font-bold tracking-wider">Env. sécurisé</span>
            </p>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
          <div className="lg:col-span-4 flex flex-col gap-6 overflow-y-auto pr-2 pb-6">
            <Card className="border-border/60 shadow-sm shrink-0">
              <CardHeader className="bg-muted/30 pb-4 border-b border-border/50">
                <CardTitle className="text-base flex items-center">
                  <Cpu className="w-4 h-4 mr-2 text-primary" />
                  Configurer l'analyse
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-5">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">Type de tâche</label>
                  <div className="grid grid-cols-1 gap-2">
                    {TASK_TYPES.map(type => (
                      <button
                        key={type.id}
                        onClick={() => setTaskType(type.id)}
                        className={cn(
                          "text-left px-3 py-2 rounded-md text-sm transition-all border",
                          taskType === type.id 
                            ? "bg-primary/5 border-primary text-primary font-medium" 
                            : "bg-card border-border text-muted-foreground hover:border-border/80"
                        )}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">Requête / Demande</label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Décrivez ce que vous souhaitez que l'IA analyse ou construise..."
                    className="w-full h-32 p-3 bg-muted/20 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition-all"
                  />
                </div>

                <div className="border-2 border-dashed border-border/60 rounded-md p-4 text-center bg-muted/10">
                  <FileText className="w-6 h-6 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-muted-foreground">Glissez-déposez vos documents ici ou cliquez pour parcourir</p>
                </div>

                <Button 
                  onClick={handleRunAnalysis} 
                  disabled={runAnalysis.isPending || !prompt.trim()}
                  className="w-full h-11 text-base shadow-md"
                >
                  {runAnalysis.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Traitement en cours...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" /> Lancer l'analyse IA</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-8 flex flex-col h-full bg-card rounded-xl border border-border/60 shadow-sm overflow-hidden">
            {runAnalysis.isPending ? (
              <div className="flex-1 flex flex-col items-center justify-center bg-muted/10">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                  <Sparkles className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
                <h3 className="text-lg font-medium text-foreground mt-6">Analyse du contexte en cours...</h3>
                <p className="text-sm text-muted-foreground mt-2">Récupération du code source, de l'historique et des spécifications client.</p>
              </div>
            ) : result ? (
              <div className="flex flex-col h-full overflow-hidden animate-fade-in">
                <div className="bg-slate-900 text-white p-6 shrink-0">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-2.5 py-1 bg-primary/20 text-primary-foreground rounded-full text-xs font-semibold border border-primary/30 uppercase tracking-wider">
                          {TASK_TYPES.find(t => t.id === result.taskType)?.label}
                        </span>
                        <span className="flex items-center text-xs text-slate-400">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 mr-1" />
                          Confiance : {Math.round((result.confidenceScore || 0) * 100)}%
                        </span>
                      </div>
                      <h2 className="text-xl font-semibold leading-tight">{result.executiveSummary}</h2>
                    </div>
                  </div>

                  <div className="flex gap-6 border-b border-slate-700/50">
                    <TabButton active={activeTab === 'summary'} onClick={() => setActiveTab('summary')}>Synthèse</TabButton>
                    {result.technicalPlan && <TabButton active={activeTab === 'plan'} onClick={() => setActiveTab('plan')}>Plan technique</TabButton>}
                    <TabButton active={activeTab === 'sources'} onClick={() => setActiveTab('sources')}>Sources contextuelles</TabButton>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-muted/20">
                  {activeTab === 'summary' && <SummaryView result={result} />}
                  {activeTab === 'plan' && result.technicalPlan && <PlanView plan={result.technicalPlan} />}
                  {activeTab === 'sources' && <SourcesView analysisId={result.id} />}
                </div>

                <FeedbackPanel analysisId={result.id} />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center bg-muted/10 text-center p-8">
                <div className="w-16 h-16 rounded-2xl bg-card shadow-sm flex items-center justify-center mb-6">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Prêt pour l'analyse</h2>
                <p className="text-muted-foreground mt-2 max-w-md">
                  Configurez votre requête sur la gauche. L'IA OASIS analysera le contexte client, le code source existant et proposera des solutions.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function TabButton({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "pb-3 text-sm font-medium transition-colors relative",
        active ? "text-white" : "text-slate-400 hover:text-slate-200"
      )}
    >
      {children}
      {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
    </button>
  );
}

function SummaryView({ result }: { result: AnalysisResult }) {
  return (
    <div className="space-y-8 animate-fade-in">
      {result.requestUnderstanding && (
        <section>
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">Compréhension de la demande</h3>
          <p className="text-foreground/90 leading-relaxed bg-card p-4 rounded-lg border border-border shadow-sm">
            {result.requestUnderstanding}
          </p>
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {result.impactedComponents && (
          <section>
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3 flex items-center">
              <Server className="w-4 h-4 mr-2 text-primary" />
              Composants impactés
            </h3>
            <ul className="space-y-2">
              {result.impactedComponents.map((comp, i) => (
                <li key={i} className="bg-card p-3 rounded border border-border shadow-sm text-sm text-foreground/90 flex items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 mr-3 shrink-0"></div>
                  {comp}
                </li>
              ))}
            </ul>
          </section>
        )}

        {result.identifiedRisks && (
          <section>
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 text-amber-500" />
              Risques identifiés
            </h3>
            <ul className="space-y-2">
              {result.identifiedRisks.map((risk, i) => (
                <li key={i} className="bg-amber-500/10 p-3 rounded border border-amber-500/20 text-sm text-amber-600 dark:text-amber-400 flex items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 mr-3 shrink-0"></div>
                  {risk}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {result.recommendedApproach && (
        <section>
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">Approche recommandée</h3>
          <div className="bg-primary/5 p-5 rounded-lg border border-primary/20 text-foreground leading-relaxed">
            {result.recommendedApproach}
          </div>
        </section>
      )}
    </div>
  );
}

function PlanView({ plan }: { plan: any }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex gap-4 mb-6">
        <div className="bg-card px-4 py-2 rounded-lg border border-border shadow-sm flex-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Complexité</p>
          <p className="font-semibold text-foreground">{plan.complexityEstimate}</p>
        </div>
        <div className="bg-card px-4 py-2 rounded-lg border border-border shadow-sm flex-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Effort estimé</p>
          <p className="font-semibold text-foreground">{plan.effortEstimate}</p>
        </div>
      </div>

      <section>
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">Séquence d'actions</h3>
        <div className="space-y-3 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
          {plan.actionSequence.map((step: string, i: number) => (
            <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-card bg-muted text-muted-foreground font-bold shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                {i + 1}
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-card p-4 rounded-lg border border-border shadow-sm text-sm text-foreground/90">
                {step}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SourcesView({ analysisId }: { analysisId: string }) {
  return (
    <div className="animate-fade-in space-y-4">
      <div className="p-4 bg-card rounded-lg border border-border shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase text-primary bg-primary/10 px-2 py-1 rounded">Code source</span>
          <span className="text-xs text-muted-foreground">Pertinence : 95%</span>
        </div>
        <h4 className="font-semibold text-foreground mb-2">api/src/services/billing.ts</h4>
        <p className="text-sm text-foreground/80 font-mono bg-muted/50 p-2 rounded">
          Contexte extrait concernant l'implémentation actuelle du webhook de paiement.
        </p>
      </div>
      <div className="p-4 bg-card rounded-lg border border-border shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase text-purple-600 bg-purple-100 px-2 py-1 rounded">Ticket Jira</span>
          <span className="text-xs text-muted-foreground">Pertinence : 88%</span>
        </div>
        <h4 className="font-semibold text-foreground mb-2">PROJ-482 : Mise à jour de la version API Stripe</h4>
        <p className="text-sm text-foreground/80 bg-muted/50 p-2 rounded">
          La tentative précédente de mise à jour de l'API a échoué en raison d'une incompatibilité de signature webhook.
        </p>
      </div>
    </div>
  );
}

function FeedbackPanel({ analysisId }: { analysisId: string }) {
  const submitFeedback = useSubmitFeedback();
  const [comment, setComment] = useState("");

  const handleAction = async (action: string) => {
    await submitFeedback.mutateAsync({
      id: analysisId,
      data: { action, comment }
    });
    setComment("");
  };

  return (
    <div className="bg-card border-t border-border/60 p-4 shrink-0 flex flex-col md:flex-row gap-4 items-center justify-between">
      <div className="flex-1 w-full relative">
        <input 
          type="text" 
          placeholder="Ajouter un commentaire ou une demande d'ajustement..." 
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full bg-muted/30 border border-border rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      <div className="flex items-center gap-2 w-full md:w-auto">
        <Button variant="outline" onClick={() => handleAction('reject')} className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 flex-1 md:flex-none">
          <ThumbsDown className="w-4 h-4 mr-2" /> Rejeter
        </Button>
        <Button variant="outline" onClick={() => handleAction('adjust')} className="flex-1 md:flex-none">
          Ajuster
        </Button>
        <Button onClick={() => handleAction('accept')} className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1 md:flex-none">
          <ThumbsUp className="w-4 h-4 mr-2" /> Accepter
        </Button>
      </div>
    </div>
  );
}
