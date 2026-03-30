import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  collapsed?: boolean;
}

export function Logo({ className, collapsed = false }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2 select-none", className)}>
      <div className="flex items-center text-foreground">
        <span className="font-bold tracking-tight text-xl">OASIS</span>
        <span className="w-1.5 h-1.5 rounded-full bg-primary mx-1 mt-1"></span>
        {!collapsed && <span className="font-light tracking-wide text-xl text-muted-foreground">Projet</span>}
      </div>
    </div>
  );
}
