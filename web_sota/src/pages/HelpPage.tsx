import { useEffect, useState } from "react";
import { apiGet } from "@/api/client";
import { Card, CardTitle } from "@/components/ui/card";
import { PageHero } from "@/components/layout/PageHero";

export function HelpPage() {
  const [topics, setTopics] = useState<{ id: string; file: string }[]>([]);

  useEffect(() => {
    apiGet<{ topics: { id: string; file: string }[] }>("/api/help").then((d) => setTopics(d.topics));
  }, []);

  return (
    <div className="space-y-6">
      <PageHero eyebrow="Help" title="Documentation topics" />
      <div className="grid gap-3 md:grid-cols-2">
        {topics.map((t) => (
          <Card key={t.id} className="glass p-4">
            <CardTitle>{t.id}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{t.file}</p>
            <a className="text-sm text-primary" href={`/api/help/${t.id}`} target="_blank" rel="noreferrer">
              Open markdown API
            </a>
          </Card>
        ))}
      </div>
    </div>
  );
}
