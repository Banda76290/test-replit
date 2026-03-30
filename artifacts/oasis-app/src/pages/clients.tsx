import { useState } from "react";
import { AppLayout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { useGetClients } from "@workspace/api-client-react";
import { Search, Filter, ChevronRight, Briefcase } from "lucide-react";
import { Link } from "wouter";

const PRIORITY_LABELS: Record<string, string> = {
  high: "Haute",
  medium: "Moyenne",
  low: "Basse",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Actif",
  pending: "En attente",
  inactive: "Inactif",
};

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const { data: clients, isLoading } = useGetClients({ search });

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Portefeuille Clients</h1>
            <p className="text-muted-foreground mt-1">Sélectionnez un client pour accéder à ses projets et lancer une analyse.</p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Rechercher par nom ou secteur..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-lg text-sm font-medium hover:bg-muted/50 transition-colors shadow-sm">
            <Filter className="w-4 h-4" />
            Filtres
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-48 bg-muted rounded-xl"></div>)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients?.map((client) => (
              <Link key={client.id} href={`/clients/${client.id}/projects`}>
                <Card className="h-full border-border/60 hover:border-primary/40 hover:shadow-lg transition-all cursor-pointer group bg-card">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-primary/5 text-primary flex items-center justify-center font-bold text-lg border border-primary/10">
                          {client.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground text-lg leading-tight group-hover:text-primary transition-colors">{client.name}</h3>
                          <p className="text-xs text-muted-foreground">{client.sector}</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        client.priority === 'high' ? 'bg-destructive/10 text-destructive' : 
                        client.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 
                        'bg-muted text-foreground/90'
                      }`}>
                        {PRIORITY_LABELS[client.priority] || client.priority}
                      </span>
                    </div>

                    <div className="mt-auto space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-muted/30 rounded-lg p-3 border border-border/40">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1 flex items-center">
                            <Briefcase className="w-3 h-3 mr-1" /> Projets
                          </p>
                          <p className="text-xl font-bold text-foreground">{client.projectCount}</p>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-3 border border-border/40">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Statut</p>
                          <p className="text-sm font-medium text-foreground mt-1.5">{STATUS_LABELS[client.contractStatus] || client.contractStatus}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs border-t border-border/50 pt-4">
                        <span className="text-muted-foreground">Équipe : <span className="font-medium text-foreground">{client.assignedTeam}</span></span>
                        <span className="text-primary font-medium flex items-center opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">
                          Voir les projets <ChevronRight className="w-4 h-4 ml-0.5" />
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
