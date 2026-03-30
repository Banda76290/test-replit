import { AppLayout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGetClientProjects, useGetClients } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Activity, Server, AlertCircle, Calendar, FolderKanban } from "lucide-react";
import { format } from "date-fns";

export default function ClientProjectsPage() {
  const [, params] = useRoute("/clients/:id/projects");
  const clientId = params?.id || "";
  
  const { data: clients } = useGetClients();
  const client = clients?.find(c => c.id === clientId);
  const { data: projects, isLoading } = useGetClientProjects(clientId);

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <Link href="/clients" className="hover:text-primary flex items-center transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Portfolio
          </Link>
          <span>/</span>
          <span className="font-medium text-foreground">{client?.name || 'Loading...'}</span>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-border/50">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              {client?.name} Projects
            </h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Select a project to enter the OASIS Workspace and perform AI-driven technical analysis, architecture planning, or code generation.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted rounded-xl"></div>)}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {projects?.map((project) => (
              <Card key={project.id} className="border-border/60 hover:border-primary/30 hover:shadow-md transition-all group bg-white">
                <CardContent className="p-0">
                  <div className="flex flex-col lg:flex-row">
                    <div className="p-6 flex-1 border-b lg:border-b-0 lg:border-r border-border/50">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">{project.name}</h3>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          project.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {project.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4 max-w-3xl">
                        {project.description}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-4 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                          <Server className="w-3.5 h-3.5" />
                          <div className="flex gap-1">
                            {project.techStack.slice(0, 4).map(tech => (
                              <span key={tech} className="font-medium">{tech}{project.techStack.indexOf(tech) !== Math.min(3, project.techStack.length-1) ? ',' : ''}</span>
                            ))}
                            {project.techStack.length > 4 && <span>+{project.techStack.length - 4} more</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Updated {format(new Date(project.lastUpdated), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6 lg:w-72 bg-muted/10 flex flex-col justify-between">
                      <div className="space-y-3 mb-6">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground flex items-center"><Activity className="w-4 h-4 mr-2" /> Health</span>
                          <span className="font-medium text-emerald-600">{project.health}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground flex items-center"><AlertCircle className="w-4 h-4 mr-2" /> Incidents</span>
                          <span className="font-medium">{project.recentIncidents} recent</span>
                        </div>
                      </div>
                      <Link href={`/workspace/${project.id}`}>
                        <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground shadow-sm">
                          Open Workspace
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {projects?.length === 0 && (
              <div className="text-center py-20 border-2 border-dashed border-border rounded-xl">
                <FolderKanban className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-foreground">No projects found</h3>
                <p className="text-muted-foreground mt-1">This client doesn't have any active projects yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
