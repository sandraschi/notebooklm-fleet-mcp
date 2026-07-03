import { useCallback, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { apiGet } from "@/api/client";
import { PageHero } from "@/components/layout/PageHero";

type Topic = { id: string; file: string };

const GROUPS: Record<string, { label: string; ids: string[] }> = {
	start: { label: "Getting Started", ids: ["index", "configuration", "development", "cursor"] },
	reference: { label: "Reference", ids: ["tools", "architecture"] },
	operations: { label: "Operations", ids: ["troubleshooting", "webapp"] },
	integration: { label: "Integration", ids: ["fleet"] },
};

const TAB_ORDER = ["start", "reference", "operations", "integration"];

export function HelpPage() {
	const [topics, setTopics] = useState<Topic[]>([]);
	const [activeTab, setActiveTab] = useState("start");
	const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
	const [content, setContent] = useState("");
	const [loading, setLoading] = useState(false);

	const fetchContent = useCallback(async (topicId: string) => {
		setLoading(true);
		setSelectedTopic(topicId);
		try {
			const d = await apiGet<{ markdown: string }>(`/api/help/${topicId}`);
			setContent(d.markdown);
		} catch {
			setContent("Failed to load help content.");
		}
		setLoading(false);
	}, []);

	const tabTopicIds = GROUPS[activeTab]?.ids ?? [];

	useEffect(() => {
		apiGet<{ topics: Topic[] }>("/api/help").then((d) => {
			setTopics(d.topics);
		});
	}, []);

	// auto-select first topic when tab or topics change
	useEffect(() => {
		const first = tabTopicIds[0];
		if (first && selectedTopic !== first) fetchContent(first);
	}, [activeTab, topics.length, fetchContent]);

	const tabTopics = topics.filter((t) => tabTopicIds.includes(t.id));

	return (
		<div className="space-y-6">
			<PageHero eyebrow="Help" title="Documentation" />

			{/* horizontal tabs */}
			<div className="flex gap-1 border-b border-border">
				{TAB_ORDER.map((key) => {
					const g = GROUPS[key];
					return (
						<button
							key={key}
							type="button"
							onClick={() => setActiveTab(key)}
							className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
								activeTab === key
									? "bg-card border border-border border-b-transparent text-foreground"
									: "text-muted-foreground hover:text-foreground hover:bg-muted/30"
							}`}
						>
							{g.label}
						</button>
					);
				})}
			</div>

			{/* topic sub-nav */}
			<div className="flex flex-wrap gap-2">
				{tabTopics.map((t) => (
					<button
						key={t.id}
						type="button"
						onClick={() => fetchContent(t.id)}
						className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
							selectedTopic === t.id
								? "bg-primary/20 border-primary/50 text-primary"
								: "bg-card border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
						}`}
					>
						{t.id}
					</button>
				))}
			</div>

			{/* rendered markdown content */}
			<div className="glass rounded-xl p-6 min-h-[300px]">
				{loading ? (
					<p className="text-muted-foreground text-sm animate-pulse">
						Loading...
					</p>
				) : (
					<div className="prose prose-invert max-w-none prose-headings:text-foreground prose-a:text-primary prose-code:text-sm prose-code:bg-muted/50 prose-code:px-1 prose-code:rounded prose-pre:bg-muted/80 prose-pre:border prose-pre:border-border prose-strong:text-foreground prose-ul:list-disc prose-ol:list-decimal prose-li:marker:text-muted-foreground">
						<ReactMarkdown remarkPlugins={[remarkGfm]}>
							{content}
						</ReactMarkdown>
					</div>
				)}
			</div>
		</div>
	);
}
