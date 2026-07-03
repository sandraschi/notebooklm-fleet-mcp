import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import FloatingChat from "@/components/FloatingChat";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoggerProvider } from "@/context/LoggerContext";
import { useZoom } from "@/lib/use-zoom";
import { ApiDocsPage } from "@/pages/ApiDocsPage";
import { AppsPage } from "@/pages/AppsPage";
import { Dashboard } from "@/pages/Dashboard";
import { HelpPage } from "@/pages/HelpPage";
import { LogsPage } from "@/pages/LogsPage";
import { NotebooksPage } from "@/pages/NotebooksPage";
import { PipelinePage } from "@/pages/PipelinePage";
import { SettingsPage } from "@/pages/SettingsPage";
import { StudioPage } from "@/pages/StudioPage";
import { ToolsPage } from "@/pages/ToolsPage";

export default function App() {
	useZoom();
	return (
		<LoggerProvider>
			<BrowserRouter>
				<Routes>
					<Route path="/" element={<AppLayout />}>
						<Route index element={<Navigate to="/dashboard" replace />} />
						<Route path="dashboard" element={<Dashboard />} />
						<Route path="notebooks" element={<NotebooksPage />} />
						<Route path="studio" element={<StudioPage />} />
						<Route path="pipeline" element={<PipelinePage />} />
						<Route path="tools" element={<ToolsPage />} />
						<Route path="logs" element={<LogsPage />} />
						<Route path="swagger" element={<ApiDocsPage />} />
						<Route path="apps" element={<AppsPage />} />
						<Route path="help" element={<HelpPage />} />
						<Route path="settings" element={<SettingsPage />} />
						<Route path="*" element={<Navigate to="/dashboard" replace />} />
					</Route>
				</Routes>
			</BrowserRouter>
			<FloatingChat />
		</LoggerProvider>
	);
}
