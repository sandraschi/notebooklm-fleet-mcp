import { useState } from "react";
import { apiGet } from "@/api/client";
import { PageHero } from "@/components/layout/PageHero";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function StudioPage() {
	const [notebookId, setNotebookId] = useState("");
	const [artifacts, setArtifacts] = useState<any>(null);
	const [err, setErr] = useState<string | null>(null);

	const loadStudio = async () => {
		if (!notebookId.trim()) return;
		try {
			const data = await apiGet(`/api/notebooks/${notebookId.trim()}/studio`);
			setArtifacts(data);
			setErr(null);
		} catch (e) {
			setErr(e instanceof Error ? e.message : String(e));
		}
	};

	return (
		<div className="space-y-6">
			<PageHero eyebrow="Studio" title="Audio, slides, mind maps" />
			<p className="text-sm text-muted-foreground">
				Create audio/slides via MCP tools or <code>nlm audio create</code> /{" "}
				<code>nlm slides create</code>. This page polls artifact status.
			</p>
			<Card className="glass p-4 flex gap-2 flex-wrap items-end">
				<div className="flex-1 min-w-[240px]">
					<label className="text-xs text-muted-foreground">Notebook ID</label>
					<Input
						value={notebookId}
						onChange={(e) => setNotebookId(e.target.value)}
					/>
				</div>
				<Button onClick={loadStudio}>Load studio status</Button>
			</Card>
			{err && <p className="text-destructive text-sm">{err}</p>}
			{artifacts && (
				<pre className="text-xs glass p-4 rounded overflow-auto max-h-[480px]">
					{JSON.stringify(artifacts, null, 2)}
				</pre>
			)}
		</div>
	);
}
