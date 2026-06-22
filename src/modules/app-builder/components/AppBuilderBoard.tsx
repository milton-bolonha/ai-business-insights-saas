"use client";

import { useState, useEffect } from "react";
import { Loader2, Settings, LayoutTemplate } from "lucide-react";
import { BuilderChat } from "./BuilderChat";
import { PreviewFrame } from "./PreviewFrame";
import { ProjectSettingsModal } from "./ProjectSettingsModal";
import { FileExplorerSidebar } from "./FileExplorerSidebar";
import { CodeEditorPane } from "./CodeEditorPane";
import { useTranslation } from "@/lib/hooks/useTranslation";

interface AppBuilderBoardProps {
  workspaceId: string;
}

export function AppBuilderBoard({ workspaceId }: AppBuilderBoardProps) {
  const { t } = useTranslation();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'builder' | 'editor'>('builder');
  const [activeFile, setActiveFile] = useState<string | null>(null);

  useEffect(() => {
    const initProject = async () => {
      setLoading(true);
      setError(null);
      try {
        let res = await fetch(`/api/app-builder/projects?workspaceId=${workspaceId}`);
        let data = await res.json();
        
        // If there are existing projects, check if the sandbox is alive
        if (data.projects && data.projects.length > 0) {
          const existing = data.projects[0];
          const previewRes = await fetch(`/api/app-builder/projects/${existing._id}/preview`);
          const previewData = await previewRes.json();
          
          if (previewData.status === 'dead') {
            // Sandbox is gone (410) — delete old project and create fresh one
            console.log('[AppBuilder] Sandbox is dead, deleting old project and creating fresh...');
            await fetch(`/api/app-builder/projects/${existing._id}`, { method: 'DELETE' });
          } else {
            setProject(existing);
            return;
          }
        }

        res = await fetch(`/api/app-builder/projects`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workspaceId, name: 'Meu Novo App' })
        });
        data = await res.json();
        
        if (!res.ok) throw new Error(data.error || "Erro ao criar projeto");
        
        setProject(data.project);
        setIsSettingsOpen(true);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (workspaceId) {
      initProject();
    }
  }, [workspaceId]);

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
        <p className="font-medium">{t('admin.appBuilder.loadingEnv') || "Preparando seu ambiente de desenvolvimento..."}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center p-6">
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl max-w-md w-full text-center shadow-sm">
          <p className="font-bold mb-2">Ops! Algo deu errado.</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="relative flex w-full h-full p-4 gap-4 bg-gray-50/50">
      {/* Modo Builder */}
      <div 
        className="w-full h-full flex gap-4"
        style={{ display: viewMode === 'builder' ? 'flex' : 'none' }}
      >
        <div className="w-[35%] min-w-[320px] max-w-[450px] flex flex-col h-full relative">
          <BuilderChat 
            projectId={project._id} 
            onOpenSettings={() => setIsSettingsOpen(true)} 
            onOpenEditor={() => setViewMode('editor')}
          />
        </div>
        <div className="flex-1 min-w-0 h-full flex flex-col">
          <PreviewFrame projectId={project._id} />
        </div>
      </div>

      {/* Modo Editor */}
      <div 
        className="w-full h-full flex gap-4"
        style={{ display: viewMode === 'editor' ? 'flex' : 'none' }}
      >
        <FileExplorerSidebar 
          projectId={project._id}
          activeFile={activeFile}
          onSelectFile={setActiveFile}
          onBackToChat={() => setViewMode('builder')}
        />
        <CodeEditorPane 
          projectId={project._id}
          activeFile={activeFile}
        />
      </div>

      <ProjectSettingsModal 
        projectId={project._id}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        initialData={{
          name: project.name,
          description: project.description,
          businessRules: project.businessRules,
          designGuidelines: project.designGuidelines
        }}
        onSave={(data) => setProject({ ...project, ...data })}
      />
    </div>
  );
}
