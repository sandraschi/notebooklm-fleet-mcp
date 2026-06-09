import { useState } from "react";
import { apiPost } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHero } from "@/components/layout/PageHero";
import { useLogger } from "@/context/LoggerContext";

export function PipelinePage() {
  const { log } = useLogger();
  const [title, setTitle] = useState("");
  const [query, setQuery] = useState("");
  const [repoId, setRepoId] = useState("");
  const [slides, setSlides] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [err, setErr] = useState<string | null>(null);

  const runPipeline = async () => {
    try {
      const data = await apiPost("/api/fleet/pipeline/research", {
        title: title.trim(),
        query: query.trim(),
        mode: "fast",
        create_slides: slides,
        repo_id: repoId.trim(),
      });
      setResult(data);
      log("info", "Fleet research pipeline started");
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="space-y-6">
      <PageHero eyebrow="Fleet" title="Research pipeline" />
      <Card className="glass p-4 space-y-3 max-w-xl">
        <div>
          <label className="text-xs text-muted-foreground">Notebook title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Research query</label>
          <Input value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Fleet repo id (optional tag)</label>
          <Input value={repoId} onChange={(e) => setRepoId(e.target.value)} placeholder="arxiv-mcp" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={slides} onChange={(e) => setSlides(e.target.checked)} />
          Generate slides after research
        </label>
        <Button onClick={runPipeline} disabled={!title.trim() || !query.trim()}>
          Run pipeline
        </Button>
      </Card>
      {err && <p className="text-destructive text-sm">{err}</p>}
      {result && (
        <pre className="text-xs glass p-4 rounded overflow-auto max-h-[480px]">{JSON.stringify(result, null, 2)}</pre>
      )}
    </div>
  );
}
