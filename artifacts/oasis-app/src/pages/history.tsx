import { AppLayout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { useGetAnalysisHistory } from "@workspace/api-client-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Search, Filter, Cpu, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { Link } from "wouter";

const TASK_TYPE_LABELS: Record<string, string> = {
  "analyze-need": "Analyse de besoin",
  "propose-implementation": "Proposition d'implémentation",
  "analyze-impact": "Analyse d'impact",
  "generate-plan": "Plan technique",
  "generate-docs": "Documentation",
  "prepare-response": "Réponse technique",
  "propose-fix": "Proposition de correctif",
  "produce-diff": "Diff de code",
};

export default function HistoryPage() {
  const { data: history, isLoading } = useGetAnalysisHistory();

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Historique des analyses</h1>
          <p className="text-muted-foreground mt-1">Consultez les analyses IA passées, les plans techniques et les générations de code.</p>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Rechercher par mot-clé, client ou projet..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-lg text-sm font-medium shadow-sm hover:bg-muted/50 transition-colors">
            <Filter className="w-4 h-4" />
            Filtres
          </button>
        </div>

        <Card className="border-border/60 shadow-sm bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-6 py-4 font-semibold">Tâche d'analyse</th>
                  <th className="px-6 py-4 font-semibold">Contexte</th>
                  <th className="px-6 py-4 font-semibold">Statut</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-4 w-48 bg-muted rounded"></div></td>
                      <td className="px-6 py-4"><div className="h-4 w-32 bg-muted rounded"></div></td>
                      <td className="px-6 py-4"><div className="h-6 w-20 bg-muted rounded-full"></div></td>
                      <td className="px-6 py-4"><div className="h-4 w-24 bg-muted rounded"></div></td>
                    </tr>
                  ))
                ) : history?.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/20 transition-colors group">
                    <td className="px-6 py-4">
                      <Link href={`/workspace/${item.projectId}?analysis=${item.id}`}>
                        <div className="flex items-start gap-3 cursor-pointer">
                          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                            <Cpu className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                              {TASK_TYPE_LABELS[item.taskType] || item.taskType}
                            </p>
                            <p className="text-xs text-muted-foreground truncate max-w-sm mt-0.5">
                              « {item.prompt} »
                            </p>
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-foreground text-xs">{item.clientId}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.projectId}</p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap text-xs">
                      {format(new Date(item.createdAt), 'd MMM yyyy HH:mm', { locale: fr })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; style: string; Icon: any }> = {
    completed: { label: "Terminé", style: "bg-emerald-100 text-emerald-700 border-emerald-200", Icon: CheckCircle2 },
    ready: { label: "Prêt", style: "bg-emerald-100 text-emerald-700 border-emerald-200", Icon: CheckCircle2 },
    critical: { label: "Critique", style: "bg-red-100 text-red-700 border-red-200", Icon: AlertTriangle },
    pending: { label: "En attente", style: "bg-amber-100 text-amber-700 border-amber-200", Icon: Clock },
  };

  const { label, style, Icon } = config[status] || { label: status, style: "bg-slate-100 text-slate-700 border-slate-200", Icon: Clock };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold border ${style}`}>
      <Icon className="w-3 h-3 mr-1" />
      {label}
    </span>
  );
}
