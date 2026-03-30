import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetDashboardSummary, useGetMe } from "@workspace/api-client-react";
import { Activity as ActivityIcon, Users, FolderKanban, Sparkles, ArrowRight, Clock } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { data: user } = useGetMe();
  const { data: summary, isLoading } = useGetDashboardSummary();

  if (isLoading || !summary) {
    return (
      <AppLayout>
        <div className="space-y-6 animate-pulse">
          <div className="h-8 w-64 bg-muted rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted rounded-xl"></div>)}
          </div>
          <div className="h-96 bg-muted rounded-xl"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {summary.welcomeMessage.replace('{name}', user?.name || 'Developer')}
            </h1>
            <p className="text-muted-foreground mt-1 text-lg">
              Here's an overview of your current context.
            </p>
          </div>
          <Link href="/clients">
            <Button className="shadow-sm shadow-primary/20">
              <Sparkles className="mr-2 h-4 w-4" />
              New Analysis
            </Button>
          </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="Active Clients" 
            value={summary.totalClients} 
            icon={Users} 
            color="bg-blue-50 text-blue-600" 
          />
          <StatCard 
            title="Projects" 
            value={summary.totalProjects} 
            icon={FolderKanban} 
            color="bg-emerald-50 text-emerald-600" 
          />
          <StatCard 
            title="Analyses Run" 
            value={summary.totalAnalyses} 
            icon={ActivityIcon} 
            color="bg-purple-50 text-purple-600" 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area - Left 2 cols */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="shadow-sm border-border/50 overflow-hidden">
              <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-lg">
                    <Clock className="w-5 h-5 mr-2 text-primary" />
                    Recent Activity
                  </CardTitle>
                  <Link href="/history">
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                      View all <ArrowRight className="ml-1 w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {summary.recentActivities.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="p-4 hover:bg-muted/20 transition-colors flex items-start gap-4">
                      <div className="w-2 h-2 mt-2 rounded-full bg-primary shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{activity.description}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span className="font-semibold text-primary/80">{activity.clientName}</span>
                          <span>•</span>
                          <span>{activity.projectName}</span>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
                        {format(new Date(activity.timestamp), 'MMM d, HH:mm')}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Recent Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {summary.recentProjects.slice(0, 4).map(project => (
                    <Link key={project.id} href={`/workspace/${project.id}`}>
                      <div className="p-4 rounded-lg border border-border/50 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group bg-white">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">{project.name}</h4>
                          <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${
                            project.health === 'Healthy' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {project.health}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{project.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {project.techStack.slice(0, 3).map(tech => (
                            <span key={tech} className="px-1.5 py-0.5 bg-muted rounded text-[10px] text-muted-foreground">
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Area - Right 1 col */}
          <div className="space-y-8">
            <Card className="shadow-sm border-border/50 bg-primary/5 border-primary/10">
              <CardHeader>
                <CardTitle className="text-lg text-primary flex items-center">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Suggested Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {summary.suggestedActions.map((action, i) => (
                  <Link key={i} href={action.link}>
                    <div className="group block p-3 rounded-lg bg-white border border-primary/10 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer">
                      <h4 className="font-medium text-sm text-foreground group-hover:text-primary">{action.label}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function StatCard({ title, value, icon: Icon, color }: { title: string, value: number, icon: any, color: string }) {
  return (
    <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <h3 className="text-3xl font-bold tracking-tight text-foreground">{value}</h3>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </CardContent>
    </Card>
  );
}
