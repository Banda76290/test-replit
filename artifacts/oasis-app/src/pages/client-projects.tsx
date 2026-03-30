import { AppLayout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGetClientProjects, useGetClients } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Calendar, FolderOpen, Layers, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  "active": { label: "Actif", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  "planned": { label: "Planifié", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  "critical": { label: "Critique", color: "text-red-700", bg: "bg-red-50 border-red-200" },
  "inactive": { label: "Inactif", color: "text-foreground/60", bg: "bg-muted border-border" },
};

export default function ClientProjectsPage() {
  const [, params] = useRoute("/clients/:id/projects");
  const clientId = params?.id || "";

  const { data: clients } = useGetClients();
  const client = clients?.find(c => c.id === clientId);
  const { data: projets, isLoading } = useGetClientProjects(clientId);

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Link href="/clients" className="hover:text-primary flex items-center transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Portefeuille clients
          </Link>
          <span>/</span>
          {client && (
            <>
              <span className="text-muted-foreground">{client.name}</span>
              <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted border border-border text-muted-foreground">{client.ref}</span>
            </>
          )}
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-border/50">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Projets de {client?.name}
            </h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Sélectionnez un projet pour accéder à ses prestations et lancer une analyse technique dans OASIS.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2].map(i => <div key={i} className="h-36 bg-muted rounded-xl"></div>)}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {projets?.map((projet) => {
              const statusInfo = STATUS_LABELS[projet.status] || { label: projet.status, color: "text-foreground/80", bg: "bg-muted border-border" };
              return (
                <Card key={projet.id} className="border-border/60 hover:border-primary/30 hover:shadow-md transition-all group bg-card">
                  <CardContent className="p-0">
                    <div className="flex flex-col lg:flex-row">
                      <div className="p-6 flex-1 border-b lg:border-b-0 lg:border-r border-border/50">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">{projet.ref}</span>
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusInfo.bg} ${statusInfo.color}`}>
                                {statusInfo.label}
                              </span>
                            </div>
                            <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">{projet.name}</h3>
                          </div>
                        </div>
                        {projet.description && (
                          <p className="text-sm text-muted-foreground mb-4 max-w-3xl">{projet.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Mis à jour le {format(new Date(projet.lastUpdated), 'd MMM yyyy', { locale: fr })}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 lg:w-72 bg-muted/10 flex flex-col justify-between">
                        <div className="mb-6">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <Layers className="w-4 h-4" />
                            <span>Prestations actives</span>
                          </div>
                          <p className="text-3xl font-bold text-foreground">{projet.prestationCount}</p>
                        </div>
                        <Link href={`/projects/${projet.id}/prestations`}>
                          <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground shadow-sm">
                            Voir les prestations
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {projets?.length === 0 && (
              <div className="text-center py-20 border-2 border-dashed border-border rounded-xl">
                <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-foreground">Aucun projet trouvé</h3>
                <p className="text-muted-foreground mt-1">Ce client n'a pas encore de projet actif.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
