import { useEffect, useState } from "react";
import { apiGet } from "@/api/client";
import { Card, CardTitle } from "@/components/ui/card";
import { PageHero } from "@/components/layout/PageHero";

type AuthStatus = {
  doctor: { ok: boolean; text: string; authenticated: boolean };
  nlm: { installed: boolean; path?: string; version?: string };
};

export function SettingsPage() {
  const [auth, setAuth] = useState<AuthStatus | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    apiGet<AuthStatus>("/api/auth/status")
      .then(setAuth)
      .catch((e) => setErr(e instanceof Error ? e.message : String(e)));
  }, []);

  return (
    <div className="space-y-6">
      <PageHero eyebrow="Settings" title="nlm & authentication" />
      <Card className="glass p-4">
        <CardTitle>Prerequisites</CardTitle>
        <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc pl-5">
          <li>
            <code>uv tool install notebooklm-mcp-cli</code>
          </li>
          <li>
            <code>nlm login</code> — one-time Google auth
          </li>
          <li>
            <code>nlm doctor</code> — verify install
          </li>
        </ul>
      </Card>
      {err && <p className="text-destructive text-sm">{err}</p>}
      {auth && (
        <pre className="text-xs glass p-4 rounded overflow-auto max-h-[520px] whitespace-pre-wrap">
          {auth.doctor.text}
        </pre>
      )}
    </div>
  );
}
