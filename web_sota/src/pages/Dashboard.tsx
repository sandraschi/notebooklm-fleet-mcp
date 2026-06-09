import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Notebook, Sparkles, Workflow } from "lucide-react";
import { apiGet } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { PageHero } from "@/components/layout/PageHero";
import { useLogger } from "@/context/LoggerContext";

type Health = { status: string; service: string };
type Stats = { notebooks: number; authenticated: boolean; nlm_installed: boolean; nlm_version?: string };
type Liveness = { healthy: boolean; alerts: string[]; checks: { id: string; ok: boolean; detail?: string }[] };

export function Dashboard() {
  const { log } = useLogger();
  const [health, setHealth] = useState<Health | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [live, setLive] = useState<Liveness | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [h, s, l] = await Promise.all([
          apiGet<Health>("/api/health"),
          apiGet<Stats>("/api/stats"),
          apiGet<Liveness>("/api/pipeline/liveness"),
        ]);
        if (!cancelled) {
          setHealth(h);
          setStats(s);
          setLive(l);
          log("info", `Health ${h.status} · notebooks ${s.notebooks} · auth ${s.authenticated}`);
        }
      } catch (e) {
        const m = e instanceof Error ? e.message : String(e);
        if (!cancelled) {
          setErr(m);
          log("error", m);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [log]);

  const tiles = [
    { to: "/notebooks", label: "Notebooks", desc: "List, create, add sources, grounded Q&A.", icon: Notebook },
    { to: "/studio", label: "Studio", desc: "Audio, slides, artifact status.", icon: Sparkles },
    { to: "/pipeline", label: "Fleet pipelines", desc: "Research → slides, arXiv ingest, repo tags.", icon: Workflow },
    { to: "/settings", label: "Auth & nlm", desc: "Doctor output, upstream CLI version.", icon: BookOpen },
  ];

  return (
    <div className="space-y-8">
      <PageHero eyebrow="notebooklm-fleet-mcp" title="NotebookLM with fleet orchestration" size="large">
        <p className="text-muted-foreground text-base leading-relaxed">
          This app wraps <strong className="text-foreground">notebooklm-mcp-cli</strong> (`nlm`) — we do not reimplement
          Google&apos;s API. Fleet tools add arXiv ingest, repo tags, and glass dashboards on ports{" "}
          <strong className="text-foreground">10783/10784</strong>.
        </p>
        {!stats?.authenticated && (
          <p className="text-amber-300/90 text-sm">Run <code>nlm login</code> in a terminal to enable notebook operations.</p>
        )}
      </PageHero>

      {err && <p className="text-destructive text-sm">{err}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="glass p-4">
          <CardTitle className="text-sm text-muted-foreground">Backend</CardTitle>
          <p className="text-2xl font-semibold">{health?.status ?? "…"}</p>
        </Card>
        <Card className="glass p-4">
          <CardTitle className="text-sm text-muted-foreground">Notebooks</CardTitle>
          <p className="text-2xl font-semibold">{stats?.notebooks ?? "—"}</p>
        </Card>
        <Card className="glass p-4">
          <CardTitle className="text-sm text-muted-foreground">Auth</CardTitle>
          <p className="text-2xl font-semibold">{stats?.authenticated ? "OK" : "Login"}</p>
        </Card>
        <Card className="glass p-4">
          <CardTitle className="text-sm text-muted-foreground">nlm</CardTitle>
          <p className="text-sm font-mono truncate">{stats?.nlm_version ?? "not detected"}</p>
        </Card>
      </div>

      {live && (
        <Card className="glass p-4 space-y-2">
          <CardTitle>Pipeline liveness</CardTitle>
          <p className={live.healthy ? "text-emerald-400" : "text-amber-300"}>
            {live.healthy ? "Healthy" : `Alerts: ${live.alerts.join(", ")}`}
          </p>
          <ul className="text-sm text-muted-foreground space-y-1">
            {live.checks.map((c) => (
              <li key={c.id}>
                {c.ok ? "✓" : "✗"} {c.id}: {c.detail ?? ""}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {tiles.map(({ to, label, desc, icon: Icon }) => (
          <Card key={to} className="glass p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-primary" />
              <CardTitle>{label}</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground flex-1">{desc}</p>
            <Button asChild variant="secondary" size="sm" className="w-fit">
              <Link to={to}>
                Open <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
