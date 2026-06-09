import { NavLink, Outlet } from "react-router-dom";
import {
  BookOpen,
  FileCode,
  HelpCircle,
  Home,
  LayoutGrid,
  Layers,
  Notebook,
  ScrollText,
  Settings,
  Sparkles,
  Terminal,
  Workflow,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { LoggerPanel } from "@/components/layout/LoggerPanel";

const nav = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/notebooks", label: "Notebooks", icon: Notebook },
  { to: "/studio", label: "Studio", icon: Sparkles },
  { to: "/pipeline", label: "Fleet pipelines", icon: Workflow },
  { to: "/tools", label: "Tools", icon: Terminal },
  { to: "/swagger", label: "API docs", icon: FileCode },
  { to: "/logs", label: "Logs", icon: ScrollText },
  { to: "/apps", label: "Fleet apps", icon: LayoutGrid },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/help", label: "Help", icon: HelpCircle },
] as const;

export function AppLayout() {
  const [open, setOpen] = useState(true);

  return (
    <div className="min-h-screen flex text-foreground">
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-border bg-card/40 backdrop-blur-xl h-screen sticky top-0 z-30 transition-all duration-300",
          open ? "w-64" : "w-[4.5rem]",
        )}
      >
        <div className="h-14 flex items-center gap-2 px-4 border-b border-border/60">
          <BookOpen className="h-8 w-8 text-primary shrink-0" />
          {open && (
            <div>
              <div className="font-bold leading-tight">notebooklm-fleet</div>
              <div className="text-[10px] text-muted-foreground">Vite · 10784</div>
            </div>
          )}
        </div>
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive ? "bg-secondary text-secondary-foreground" : "hover:bg-muted/50",
                  !open && "justify-center px-2",
                )
              }
              title={!open ? label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {open && label}
            </NavLink>
          ))}
        </nav>
        <button
          type="button"
          className="m-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Collapse" : "Expand"}
        </button>
      </aside>
      <main className="flex-1 flex flex-col min-h-screen">
        <div className="flex-1 p-6 md:p-8 max-w-6xl mx-auto w-full">
          <Outlet />
        </div>
        <LoggerPanel />
      </main>
    </div>
  );
}
