import { useState } from "react";
import { AppLayout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGetAllProjects } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Search, Layers, Calendar, ChevronRight, FolderOpen } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  "active": { label: "Actif", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  "planned": { label: "Planifié", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  "critical": { label: "Critique", color: "text-red-700", bg: "bg-red-50 border-red-200" },
  "inactive": { label: "Inactif", color: "text-foreground/60", bg: "bg-muted border-border" },
};

export default function ProjetsPage() {
  const [search, setSearch] = useState("");
  const { data: projets, isLoading } = useGetAllProjects();

  const filtered = projets?.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.ref.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Projets</h1>
            <p className="text-muted-foreground mt-1">
              Accédez directement aux prestations techniques de vos projets.
            </p>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher par nom ou référence..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all"
          />
        </div>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted rounded-xl"></div>)}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filtered?.map((projet) => {
              const statusInfo = STATUS_LABELS[projet.status] || { label: projet.status, color: "text-foreground/80", bg: "bg-muted border-border" };
              return (
                <Link key={projet.id} href={`/projects/${projet.id}/prestations`}>
                  <Card className="border-border/60 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group bg-card">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-primary/5 text-primary flex items-center justify-center border border-primary/10 shrink-0">
                            <FolderOpen className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border shrink-0">{projet.ref}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border shrink-0 ${statusInfo.bg} ${statusInfo.color}`}>
                                {statusInfo.label}
                              </span>
                            </div>
                            <h3 className="font-bold text-foreground group-hover:text-primary transition-colors truncate">{projet.name}</h3>
                            {projet.description && (
                              <p className="text-xs text-muted-foreground truncate mt-0.5">{projet.description}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-6 shrink-0">
                          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Layers className="w-3.5 h-3.5" />
                            <span>{projet.prestationCount} prestation{projet.prestationCount > 1 ? 's' : ''}</span>
                          </div>
                          <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{format(new Date(projet.lastUpdated), 'd MMM yyyy', { locale: fr })}</span>
                          </div>
                          <Button size="sm" variant="ghost" className="text-primary group-hover:bg-primary/5 shrink-0">
                            Voir
                            <ChevronRight className="w-4 h-4 ml-0.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}

            {filtered?.length === 0 && (
              <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
                <FolderOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                <h3 className="text-base font-medium text-foreground">Aucun projet trouvé</h3>
                <p className="text-sm text-muted-foreground mt-1">Essayez avec un autre terme de recherche.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
