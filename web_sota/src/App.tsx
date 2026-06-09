import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoggerProvider } from "@/context/LoggerContext";
import { Dashboard } from "@/pages/Dashboard";
import { NotebooksPage } from "@/pages/NotebooksPage";
import { StudioPage } from "@/pages/StudioPage";
import { PipelinePage } from "@/pages/PipelinePage";
import { ToolsPage } from "@/pages/ToolsPage";
import { AppsPage } from "@/pages/AppsPage";
import { HelpPage } from "@/pages/HelpPage";
import { ApiDocsPage } from "@/pages/ApiDocsPage";
import { LogsPage } from "@/pages/LogsPage";
import { SettingsPage } from "@/pages/SettingsPage";

export default function App() {
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
    </LoggerProvider>
  );
}
