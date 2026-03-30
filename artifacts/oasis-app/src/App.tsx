import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ThemeProvider } from "@/hooks/use-theme";
import { ServiceProvider } from "@/hooks/use-service";
import { ProtectedRoute } from "@/components/protected-route";

import { useEffect } from "react";
import { useLocation } from "wouter";

import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import ClientsPage from "@/pages/clients";
import ClientProjectsPage from "@/pages/client-projects";
import WorkspacePage from "@/pages/workspace";
import HistoryPage from "@/pages/history";
import AdminPage from "@/pages/admin";
import ServicePlaceholderPage from "@/pages/service-placeholder";

const queryClient = new QueryClient();

function WorkspaceRedirect() {
  const [, navigate] = useLocation();
  useEffect(() => { navigate("/clients"); }, [navigate]);
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/">
        <ProtectedRoute><DashboardPage /></ProtectedRoute>
      </Route>
      <Route path="/clients">
        <ProtectedRoute><ClientsPage /></ProtectedRoute>
      </Route>
      <Route path="/clients/:id/projects">
        <ProtectedRoute><ClientProjectsPage /></ProtectedRoute>
      </Route>
      <Route path="/workspace">
        <ProtectedRoute><WorkspaceRedirect /></ProtectedRoute>
      </Route>
      <Route path="/workspace/:projectId">
        <ProtectedRoute><WorkspacePage /></ProtectedRoute>
      </Route>
      <Route path="/history">
        <ProtectedRoute><HistoryPage /></ProtectedRoute>
      </Route>
      <Route path="/admin">
        <ProtectedRoute><AdminPage /></ProtectedRoute>
      </Route>

      <Route path="/commercial/:module">
        <ProtectedRoute><ServicePlaceholderPage /></ProtectedRoute>
      </Route>
      <Route path="/client/:module">
        <ProtectedRoute><ServicePlaceholderPage /></ProtectedRoute>
      </Route>
      <Route path="/projet/:module">
        <ProtectedRoute><ServicePlaceholderPage /></ProtectedRoute>
      </Route>
      <Route path="/direction/:module">
        <ProtectedRoute><ServicePlaceholderPage /></ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function ServicedApp() {
  const { user } = useAuth();
  return (
    <ServiceProvider
      userId={user?.id}
      userService={user?.service}
      canAccessAllServices={user?.canAccessAllServices}
    >
      <Router />
      <Toaster />
    </ServiceProvider>
  );
}

function ThemedApp() {
  const { user } = useAuth();
  return (
    <ThemeProvider userId={user?.id}>
      <ServicedApp />
    </ThemeProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <ThemedApp />
          </AuthProvider>
        </WouterRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
