import { AppLayout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { useGetAnalysisHistory } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Search, Filter, Cpu, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { Link } from "wouter";

export default function HistoryPage() {
  const { data: history, isLoading } = useGetAnalysisHistory();

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Analysis History</h1>
          <p className="text-muted-foreground mt-1">Review past AI analyses, plans, and code generation tasks.</p>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search by keyword, client, or project..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-lg text-sm font-medium shadow-sm hover:bg-muted/50 transition-colors">
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        <Card className="border-border/60 shadow-sm bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-6 py-4 font-semibold">Analysis Task</th>
                  <th className="px-6 py-4 font-semibold">Context</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
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
                              {item.taskType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </p>
                            <p className="text-xs text-muted-foreground truncate max-w-sm mt-0.5">
                              "{item.prompt}"
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
                      {format(new Date(item.createdAt), 'MMM d, yyyy HH:mm')}
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
  const styles = {
    'Completed': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Pending Review': 'bg-amber-100 text-amber-700 border-amber-200',
    'Failed': 'bg-destructive/10 text-destructive border-destructive/20',
  }[status] || 'bg-slate-100 text-slate-700 border-slate-200';

  const Icon = {
    'Completed': CheckCircle2,
    'Pending Review': Clock,
    'Failed': AlertTriangle,
  }[status] || Clock;

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold border ${styles}`}>
      <Icon className="w-3 h-3 mr-1" />
      {status}
    </span>
  );
}
