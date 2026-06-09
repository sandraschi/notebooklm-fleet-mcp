import { useEffect, useState } from "react";
import { apiGet } from "@/api/client";
import { Card, CardTitle } from "@/components/ui/card";
import { PageHero } from "@/components/layout/PageHero";

type Tool = { name: string; description: string };
type Caps = { version?: string; tool_count?: number; upstream?: string; authenticated?: boolean };

export function ToolsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [caps, setCaps] = useState<Caps | null>(null);

  useEffect(() => {
    (async () => {
      const [t, c] = await Promise.all([
        apiGet<{ tools: Tool[] }>("/api/tools"),
        apiGet<Caps>("/api/capabilities"),
      ]);
      setTools(t.tools);
      setCaps(c);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <PageHero eyebrow="MCP" title="Tools & capabilities" />
      {caps && (
        <p className="text-sm text-muted-foreground">
          v{caps.version} · {caps.tool_count} tools · upstream {caps.upstream} · auth {caps.authenticated ? "yes" : "no"}
        </p>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        {tools.map((tool) => (
          <Card key={tool.name} className="glass p-4">
            <CardTitle className="font-mono text-sm">{tool.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">{tool.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
