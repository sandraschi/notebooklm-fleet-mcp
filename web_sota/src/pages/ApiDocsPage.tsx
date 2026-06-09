import { PageHero } from "@/components/layout/PageHero";

export function ApiDocsPage() {
  return (
    <div className="space-y-4 h-[calc(100vh-8rem)]">
      <PageHero eyebrow="API" title="OpenAPI / Swagger" />
      <iframe title="swagger" src="/docs" className="w-full flex-1 min-h-[70vh] rounded-lg border border-border glass" />
    </div>
  );
}
