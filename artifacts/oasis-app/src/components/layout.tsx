import { ReactNode, useState, useEffect, useRef, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { useService } from "@/hooks/use-service";
import { SERVICE_ORDER, SERVICES } from "@/lib/service-config";
import type { ServiceId } from "@/lib/service-config";
import { loadNavConfig, isNavItemVisible, resolveUserRoleId } from "@/lib/nav-config";
import { Logo } from "./logo";
import {
  Settings,
  LogOut,
  Bell,
  Search,
  Menu,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  ChevronDown,
  Check,
  Layers,
} from "lucide-react";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

export function AppLayout({ children }: { children: ReactNode }) {
  const [location, navigate] = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { activeService, setService, canSwitch } = useService();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sidebar-collapsed") === "true";
    } catch {
      return false;
    }
  });
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem("sidebar-collapsed", String(collapsed));
    } catch {}
  }, [collapsed]);

  useEffect(() => {
    if (!switcherOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setSwitcherOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [switcherOpen]);

  const navConfig = useMemo(() => loadNavConfig(), []);
  const userRoleId = resolveUserRoleId(user?.role);
  const navItems = useMemo(
    () =>
      activeService.nav.filter((item) =>
        isNavItemVisible(navConfig, activeService.id as ServiceId, userRoleId, item.href)
      ),
    [activeService, navConfig, userRoleId]
  );

  function handleServiceSwitch(id: ServiceId) {
    setSwitcherOpen(false);
    setService(id);
    navigate("/");
  }

  const ServiceIcon = activeService.icon;

  return (
    <TooltipProvider delayDuration={100}>
      <div className="min-h-screen bg-background flex flex-col md:flex-row">
        <aside
          className={`hidden md:flex flex-col border-r border-border bg-sidebar shrink-0 transition-all duration-200 ${collapsed ? "w-16" : "w-64"}`}
        >
          <div className={`h-16 flex items-center border-b border-border shrink-0 ${collapsed ? "justify-center px-0" : "px-4 gap-2"}`}>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <Logo />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCollapsed(true)}
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                  title="Réduire le menu"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </>
            )}
            {collapsed && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCollapsed(false)}
                    className="text-muted-foreground hover:text-foreground"
                    title="Agrandir le menu"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Agrandir le menu</TooltipContent>
              </Tooltip>
            )}
          </div>

          <div className={`flex-1 ${collapsed ? "px-2 py-3" : "p-4"}`}>
            {!collapsed && (
              <p className="text-xs font-medium text-muted-foreground px-2 mb-3 uppercase tracking-wider">
                {activeService.shortLabel}
              </p>
            )}

            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = item.startsWith
                  ? location.startsWith(item.href) && (item.href !== "/" || location === "/")
                  : location === item.href;

                const btn = (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={`w-full ${collapsed ? "justify-center px-0" : "justify-start"} ${isActive ? "bg-accent/50 text-primary font-medium" : "text-foreground"}`}
                    >
                      <item.icon className={`h-5 w-5 shrink-0 ${collapsed ? "" : "mr-3"}`} />
                      {!collapsed && item.label}
                    </Button>
                  </Link>
                );

                return collapsed ? (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{btn}</TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                ) : btn;
              })}
            </nav>
          </div>

          <div className={`mt-auto border-t border-border ${collapsed ? "p-2 space-y-1" : "p-4"}`}>
            {canSwitch && (
              <div ref={switcherRef} className="relative mb-3">
                {collapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-full text-muted-foreground hover:text-foreground"
                        onClick={() => setSwitcherOpen((v) => !v)}
                      >
                        <Layers className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">{activeService.label}</TooltipContent>
                  </Tooltip>
                ) : (
                  <button
                    onClick={() => setSwitcherOpen((v) => !v)}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg border border-border bg-muted/40 hover:bg-muted/70 transition-colors text-left"
                  >
                    <ServiceIcon className={`h-4 w-4 shrink-0 ${activeService.accentColor}`} />
                    <span className="flex-1 text-xs font-semibold text-foreground truncate">{activeService.label}</span>
                    <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform ${switcherOpen ? "rotate-180" : ""}`} />
                  </button>
                )}

                {switcherOpen && (
                  <div className={`absolute z-50 bg-popover border border-border rounded-xl shadow-lg py-1 overflow-hidden ${collapsed ? "left-full ml-2 bottom-0 w-52" : "bottom-full mb-1.5 w-full"}`}>
                    {SERVICE_ORDER.map((id) => {
                      const svc = SERVICES[id];
                      const Icon = svc.icon;
                      const isActive = activeService.id === id;
                      return (
                        <button
                          key={id}
                          onClick={() => handleServiceSwitch(id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors hover:bg-muted/60 ${isActive ? "bg-primary/5" : ""}`}
                        >
                          <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                          <div className="flex-1 min-w-0 text-left">
                            <p className={`text-xs font-semibold truncate ${isActive ? "text-primary" : "text-foreground"}`}>{svc.label}</p>
                          </div>
                          {isActive && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {!collapsed ? (
              <>
                <div className="flex items-center gap-3 px-2 py-2">
                  <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                    {user?.name?.charAt(0) || "U"}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium truncate">{user?.name || "Utilisateur"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.role || "Développeur"}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-muted-foreground hover:text-destructive mt-2"
                  onClick={logout}
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  Se déconnecter
                </Button>
              </>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-full text-muted-foreground hover:text-destructive"
                    onClick={logout}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Se déconnecter</TooltipContent>
              </Tooltip>
            )}
          </div>
        </aside>

        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <header className="md:hidden h-16 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
            <Logo />
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </header>

          <header className="hidden md:flex h-16 border-b border-border bg-card items-center justify-between px-8 shrink-0 glass-panel z-10 sticky top-0">
            <div className="flex items-center w-full max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher dans OASIS..."
                  className="w-full pl-10 pr-4 py-2 bg-muted/50 border-transparent rounded-md text-sm focus:bg-card dark:focus:bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
                  >
                    {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {theme === "dark" ? "Mode clair" : "Mode sombre"}
                </TooltipContent>
              </Tooltip>
              <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-destructive border-2 border-white dark:border-card"></span>
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto bg-background p-4 md:p-8 animate-fade-in">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
