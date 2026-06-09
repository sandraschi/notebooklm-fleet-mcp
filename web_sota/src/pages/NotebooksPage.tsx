import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPost } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHero } from "@/components/layout/PageHero";
import { useLogger } from "@/context/LoggerContext";

type NotebookRow = Record<string, unknown>;

export function NotebooksPage() {
  const { log } = useLogger();
  const [notebooks, setNotebooks] = useState<NotebookRow[]>([]);
  const [selected, setSelected] = useState("");
  const [sources, setSources] = useState<unknown>(null);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<unknown>(null);
  const [err, setErr] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await apiGet<{ notebooks: NotebookRow[] }>("/api/notebooks");
      setNotebooks(data.notebooks ?? []);
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createNotebook = async () => {
    if (!title.trim()) return;
    try {
      await apiPost("/api/notebooks", { title: title.trim() });
      log("info", `Created notebook: ${title}`);
      setTitle("");
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };

  const loadSources = async (id: string) => {
    setSelected(id);
    try {
      const data = await apiGet(`/api/notebooks/${id}/sources`);
      setSources(data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };

  const addUrl = async () => {
    if (!selected || !url.trim()) return;
    try {
      await apiPost(`/api/notebooks/${selected}/sources`, { url: url.trim(), wait: false });
      log("info", `Added source to ${selected}`);
      setUrl("");
      await loadSources(selected);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };

  const ask = async () => {
    if (!selected || !question.trim()) return;
    try {
      const data = await apiPost(`/api/notebooks/${selected}/query`, { question: question.trim() });
      setAnswer(data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="space-y-6">
      <PageHero eyebrow="Notebooks" title="Catalog & grounded Q&A" />
      {err && <p className="text-destructive text-sm">{err}</p>}

      <Card className="glass p-4 flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs text-muted-foreground">New notebook title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Fleet research topic" />
        </div>
        <Button onClick={createNotebook}>Create</Button>
        <Button variant="secondary" onClick={refresh}>
          Refresh
        </Button>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass p-4">
          <CardTitle className="mb-3">Notebooks ({notebooks.length})</CardTitle>
          <ul className="space-y-2 text-sm max-h-80 overflow-auto">
            {notebooks.map((nb, i) => {
              const id = String(nb.id ?? nb.notebook_id ?? nb.uuid ?? i);
              const name = String(nb.title ?? nb.name ?? id);
              return (
                <li key={id}>
                  <button
                    type="button"
                    className="text-left hover:text-primary w-full"
                    onClick={() => loadSources(id)}
                  >
                    {name} <span className="text-muted-foreground font-mono text-xs">{id}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card className="glass p-4 space-y-3">
          <CardTitle>Selected: {selected || "none"}</CardTitle>
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://arxiv.org/abs/..." />
          <Button onClick={addUrl} disabled={!selected}>
            Add URL source
          </Button>
          <Input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask notebook..." />
          <Button onClick={ask} disabled={!selected}>
            Query
          </Button>
          {sources && (
            <pre className="text-xs bg-muted/40 p-2 rounded overflow-auto max-h-40">{JSON.stringify(sources, null, 2)}</pre>
          )}
          {answer && (
            <pre className="text-xs bg-muted/40 p-2 rounded overflow-auto max-h-48">{JSON.stringify(answer, null, 2)}</pre>
          )}
        </Card>
      </div>
    </div>
  );
}
