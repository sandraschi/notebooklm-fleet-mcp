import { PageHero } from "@/components/layout/PageHero";
import { useLogger } from "@/context/LoggerContext";

export function LogsPage() {
  const { entries } = useLogger();
  return (
    <div className="space-y-4">
      <PageHero eyebrow="Logs" title="Session log" />
      <pre className="text-xs glass p-4 rounded max-h-[70vh] overflow-auto">
        {entries.map((e) => `[${e.level}] ${e.message}\n`).join("")}
      </pre>
    </div>
  );
}
