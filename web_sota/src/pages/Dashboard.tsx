import {
	ArrowRight,
	BookOpen,
	Notebook,
	Sparkles,
	Workflow,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "@/api/client";
import { PageHero } from "@/components/layout/PageHero";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { useLogger } from "@/context/LoggerContext";

type Health = { status: string; service: string };
type Stats = {
	notebooks: number;
	authenticated: boolean;
	nlm_installed: boolean;
	nlm_version?: string;
};
type Liveness = {
	healthy: boolean;
	alerts: string[];
	checks: { id: string; ok: boolean; detail?: string }[];
};

function useBackendStatus() {
	const [backendOk, setBackendOk] = useState<boolean | null>(null);
	const [restarting, setRestarting] = useState(false);

	const refresh = useCallback(async () => {
		try {
			const h = await apiGet<Health>("/api/health");
			setBackendOk(h.status === "ok");
		} catch {
			setBackendOk(false);
		}
	}, []);

	useEffect(() => {
		let cancelled = false;
		let timeout: ReturnType<typeof setTimeout>;
		const poll = (delay: number) => {
			if (cancelled) return;
			refresh().then(() => {
				if (cancelled) return;
				const next = delay < 16 ? delay * 2 : 16;
				timeout = setTimeout(() => poll(next), next * 1000);
			});
		};
		poll(1);
		return () => {
			cancelled = true;
			clearTimeout(timeout);
		};
	}, [refresh]);

	useEffect(() => {
		let unlisten: (() => void) | undefined;
		(async () => {
			try {
				const { listen } = await import("@tauri-apps/api/event");
				unlisten = await listen<string>("backend-status", (event) => {
					if (event.payload === "ready") {
						refresh();
					} else if (
						typeof event.payload === "string" &&
						event.payload.startsWith("error:")
					) {
						setBackendOk(false);
					}
				});
			} catch {
				/* not in Tauri -- HTTP poll handles it */
			}
		})();
		return () => {
			if (unlisten) unlisten();
		};
	}, [refresh]);

	const restartBackend = useCallback(async () => {
		setRestarting(true);
		try {
			const { invoke } = await import("@tauri-apps/api/core");
			await invoke("start_backend");
		} catch {
			setRestarting(false);
		}
	}, []);

	return { backendOk, restarting, restartBackend };
}

export function Dashboard() {
	const { log } = useLogger();
	const [health, setHealth] = useState<Health | null>(null);
	const [stats, setStats] = useState<Stats | null>(null);
	const [live, setLive] = useState<Liveness | null>(null);
	const [err, setErr] = useState<string | null>(null);
	const { backendOk, restarting, restartBackend } = useBackendStatus();

	const fetchAll = useCallback(async () => {
		try {
			const [h, s, l] = await Promise.all([
				apiGet<Health>("/api/health"),
				apiGet<Stats>("/api/stats"),
				apiGet<Liveness>("/api/pipeline/liveness"),
			]);
			setHealth(h);
			setStats(s);
			setLive(l);
			setErr(null);
			log("info", `Health ${h.status} · notebooks ${s.notebooks} · auth ${s.authenticated}`);
		} catch (e) {
			const m = e instanceof Error ? e.message : String(e);
			setErr(m);
			log("error", m);
		}
	}, [log]);

	useEffect(() => {
		fetchAll();
	}, [fetchAll]);

	const tiles = [
		{
			to: "/notebooks",
			label: "Notebooks",
			desc: "List, create, add sources, grounded Q&A.",
			icon: Notebook,
		},
		{
			to: "/studio",
			label: "Studio",
			desc: "Audio, slides, artifact status.",
			icon: Sparkles,
		},
		{
			to: "/pipeline",
			label: "Fleet pipelines",
			desc: "Research → slides, arXiv ingest, repo tags.",
			icon: Workflow,
		},
		{
			to: "/settings",
			label: "Auth & nlm",
			desc: "Doctor output, upstream CLI version.",
			icon: BookOpen,
		},
	];

	return (
		<div data-testid="dashboard" className="space-y-8">
			<PageHero
				eyebrow="notebooklm-fleet-mcp"
				title="NotebookLM with fleet orchestration"
				size="large"
			>
				<div className="flex items-center gap-3 mb-2">
					<div
						data-testid="backend-dot"
						className={`w-2 h-2 rounded-full ${backendOk === null ? "bg-gray-500" : backendOk ? "bg-green-500" : "bg-red-500"} animate-pulse`}
					/>
					<span className="text-sm">
						{backendOk === null
							? "Connecting..."
							: backendOk
								? "Connected"
								: "Offline"}
					</span>
					{backendOk === false && (
						<Button
							variant="secondary"
							size="sm"
							onClick={restartBackend}
							disabled={restarting}
						>
							{restarting ? "Restarting..." : "Restart Backend"}
						</Button>
					)}
				</div>
				<p className="text-muted-foreground text-base leading-relaxed">
					Create Notebooks, add sources (URLs, PDFs, arXiv papers), ask
					grounded questions, and generate AI podcasts or slide decks.
				</p>
				{!stats?.authenticated && (
					<p className="text-amber-300/90 text-sm flex items-center gap-2 flex-wrap">
						Not authenticated with Google. Run{" "}
						<code className="bg-amber-900/30 px-1.5 py-0.5 rounded text-amber-200">
							nlm login
						</code>{" "}
						in a terminal, then click{" "}
						<button
							type="button"
							onClick={fetchAll}
							className="underline text-amber-200 hover:text-amber-100"
						>
							Refresh
						</button>
						.
					</p>
				)}
			</PageHero>

			{err && <p className="text-destructive text-sm">{err}</p>}

			<div
				className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
				data-testid="kpi-cards"
			>
				<Card className="glass p-4" data-testid="kpi-server">
					<CardTitle className="text-sm text-muted-foreground">
						Backend
					</CardTitle>
					<p className="text-2xl font-semibold">{health?.status ?? "…"}</p>
				</Card>
				<Card className="glass p-4" data-testid="kpi-tools">
					<CardTitle className="text-sm text-muted-foreground">
						Notebooks
					</CardTitle>
					<p className="text-2xl font-semibold">{stats?.notebooks ?? "—"}</p>
				</Card>
				<Card className="glass p-4" data-testid="kpi-auth">
					<CardTitle className="text-sm text-muted-foreground">Auth</CardTitle>
					<p className="text-2xl font-semibold">
						{stats?.authenticated ? "OK" : "Login"}
					</p>
				</Card>
				<Card className="glass p-4" data-testid="kpi-nlm">
					<CardTitle className="text-sm text-muted-foreground">nlm</CardTitle>
					<p className="text-sm font-mono truncate">
						{stats?.nlm_version ?? "not detected"}
					</p>
				</Card>
			</div>

			{live && (
				<Card className="glass p-4 space-y-2" data-testid="pipeline-liveness">
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
