import { AppLayout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGetProjectPrestations, useGetProject, useGetClients } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import {
  ArrowLeft, Activity, Server, AlertCircle, Calendar,
  FolderOpen, Globe, Link2, ChevronRight
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const STATUS_LABELS: Record<string, string> = {
  "in-progress": "En cours",
  "planned": "Planifié",
  "completed": "Terminé",
  "critical": "Critique",
};

const HEALTH_LABELS: Record<string, { label: string; color: string }> = {
  good: { label: "Bon", color: "text-emerald-600" },
  neutral: { label: "Neutre", color: "text-amber-600" },
  warning: { label: "Attention", color: "text-orange-600" },
  critical: { label: "Critique", color: "text-red-600" },
};

export default function ProjectPrestationsPage() {
  const [, params] = useRoute("/projects/:id/prestations");
  const projectId = params?.id || "";

  const { data: projet } = useGetProject(projectId);
  const { data: clients } = useGetClients();
  const client = clients?.find(c => c.id === projet?.clientId);
  const { data: prestations, isLoading } = useGetProjectPrestations(projectId);

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 flex-wrap">
          <Link href="/clients" className="hover:text-primary flex items-center transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Portefeuille clients
          </Link>
          <span>/</span>
          {client && (
            <>
              <Link href={`/clients/${client.id}/projects`} className="hover:text-primary transition-colors flex items-center gap-1.5">
                {client.name}
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted border border-border text-muted-foreground">{client.ref}</span>
              </Link>
              <span>/</span>
            </>
          )}
          {projet && (
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-foreground">{projet.name}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted border border-border text-muted-foreground">{projet.ref}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-border/50">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Prestations — {projet?.name}
            </h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Sélectionnez une prestation pour accéder à l'espace de travail OASIS, lancer une analyse ou accéder aux fichiers du site.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map(i => <div key={i} className="h-36 bg-muted rounded-xl"></div>)}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {prestations?.map((prestation) => {
              const healthInfo = HEALTH_LABELS[prestation.health] || { label: prestation.health, color: "text-foreground/80" };
              return (
                <Card key={prestation.id} className="border-border/60 hover:border-primary/30 hover:shadow-md transition-all group bg-card">
                  <CardContent className="p-0">
                    <div className="flex flex-col lg:flex-row">
                      <div className="p-6 flex-1 border-b lg:border-b-0 lg:border-r border-border/50">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">{prestation.ref}</span>
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                prestation.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                                prestation.status === 'critical' ? 'bg-red-100 text-red-700' :
                                prestation.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                'bg-muted text-foreground/90'
                              }`}>
                                {STATUS_LABELS[prestation.status] || prestation.status}
                              </span>
                            </div>
                            <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">{prestation.name}</h3>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground mb-4 max-w-3xl">{prestation.description}</p>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Globe className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="text-muted-foreground mr-1">Production :</span>
                            <a
                              href={prestation.productionUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary font-medium hover:underline truncate"
                              onClick={e => e.stopPropagation()}
                            >
                              {prestation.productionUrl}
                            </a>
                          </div>
                          {prestation.saveUrls && prestation.saveUrls.length > 0 && (
                            <div className="flex items-start gap-2 text-sm">
                              <Link2 className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                              <div>
                                <span className="text-muted-foreground mr-1">URLs de travail :</span>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {prestation.saveUrls.map((url) => (
                                    <a
                                      key={url}
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-muted-foreground hover:text-primary border border-border rounded px-2 py-0.5 hover:border-primary/40 transition-colors"
                                      onClick={e => e.stopPropagation()}
                                    >
                                      {url}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs">
                          <div className="flex items-center gap-1.5 text-foreground/80 bg-muted/50 px-2 py-1 rounded-md border border-border">
                            <Server className="w-3.5 h-3.5" />
                            <div className="flex gap-1">
                              {prestation.techStack.slice(0, 4).map((tech, idx) => (
                                <span key={tech} className="font-medium">{tech}{idx !== Math.min(3, prestation.techStack.length - 1) ? ',' : ''}</span>
                              ))}
                              {prestation.techStack.length > 4 && <span>+{prestation.techStack.length - 4}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-foreground/80">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Mis à jour le {format(new Date(prestation.lastUpdated), 'd MMM yyyy', { locale: fr })}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 lg:w-72 bg-muted/10 flex flex-col justify-between">
                        <div className="space-y-3 mb-6">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground flex items-center"><Activity className="w-4 h-4 mr-2" /> Santé</span>
                            <span className={`font-medium ${healthInfo.color}`}>{healthInfo.label}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground flex items-center"><AlertCircle className="w-4 h-4 mr-2" /> Incidents</span>
                            <span className="font-medium">{prestation.recentIncidents} récent{prestation.recentIncidents > 1 ? 's' : ''}</span>
                          </div>
                          {prestation.nextMilestone && (
                            <div className="text-xs text-muted-foreground border-t border-border/50 pt-3">
                              <span className="font-semibold block mb-0.5">Prochain jalon</span>
                              <span>{prestation.nextMilestone}</span>
                            </div>
                          )}
                        </div>
                        <Link href={`/workspace/${prestation.id}`}>
                          <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground shadow-sm">
                            Ouvrir l'espace de travail
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {prestations?.length === 0 && (
              <div className="text-center py-20 border-2 border-dashed border-border rounded-xl">
                <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-foreground">Aucune prestation trouvée</h3>
                <p className="text-muted-foreground mt-1">Ce projet n'a pas encore de prestation active.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
