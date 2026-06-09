import { useEffect, useState } from "react";
import { apiGet } from "@/api/client";
import { Card, CardTitle } from "@/components/ui/card";
import { PageHero } from "@/components/layout/PageHero";

type Hub = { id: string; label: string; description: string; url: string };

export function AppsPage() {
  const [hubs, setHubs] = useState<Hub[]>([]);

  useEffect(() => {
    apiGet<{ hubs: Hub[] }>("/api/fleet").then((d) => setHubs(d.hubs ?? []));
  }, []);

  return (
    <div className="space-y-6">
      <PageHero eyebrow="Fleet" title="Related apps" />
      <div className="grid gap-3 md:grid-cols-2">
        {hubs.map((h) => (
          <Card key={h.id} className="glass p-4">
            <CardTitle>{h.label}</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">{h.description}</p>
            <a href={h.url} className="text-sm text-primary mt-2 inline-block" target="_blank" rel="noreferrer">
              {h.url}
            </a>
          </Card>
        ))}
      </div>
    </div>
  );
}
