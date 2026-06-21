import { useState, useEffect } from 'react';
import { Save, Loader2, Code2 } from 'lucide-react';
import Editor from '@monaco-editor/react';

interface CodeEditorPaneProps {
  projectId: string;
  activeFile: string | null;
}

export function CodeEditorPane({ projectId, activeFile }: CodeEditorPaneProps) {
  const [content, setContent] = useState<string>('');
  const [loadingContent, setLoadingContent] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (activeFile) {
      loadFileContent(activeFile);
    } else {
      setContent('');
    }
  }, [activeFile]);

  const loadFileContent = async (path: string) => {
    setLoadingContent(true);
    setContent('');
    try {
      const res = await fetch(`/api/app-builder/projects/${projectId}/files/content?path=${encodeURIComponent(path)}`);
      const data = await res.json();
      setContent(data.content || '');
    } catch (err) {
      console.error('Error loading content:', err);
    } finally {
      setLoadingContent(false);
    }
  };

  const saveFile = async () => {
    if (!activeFile) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/app-builder/projects/${projectId}/files/content`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: activeFile, content })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Erro HTTP: ${res.status}`);
      }
    } catch (err: any) {
      console.error('Error saving file:', err);
      alert(`Erro ao salvar arquivo: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Determine Monaco language
  const getLanguage = (path: string) => {
    if (path.endsWith('.ts') || path.endsWith('.tsx')) return 'typescript';
    if (path.endsWith('.js') || path.endsWith('.jsx')) return 'javascript';
    if (path.endsWith('.css')) return 'css';
    if (path.endsWith('.html')) return 'html';
    if (path.endsWith('.json')) return 'json';
    return 'plaintext';
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-[#1e1e1e] rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="h-14 border-b border-slate-800 flex items-center justify-between px-4 bg-[#252526] shrink-0">
        <div className="flex items-center gap-2 text-slate-300 font-medium">
          <Code2 className="w-5 h-5 text-blue-500" />
          <span>{activeFile ? activeFile.split('/').pop() : 'Nenhum arquivo selecionado'}</span>
          {activeFile && (
            <span className="text-xs text-slate-500 ml-2 hidden sm:inline-block">
              {activeFile}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={saveFile}
            disabled={!activeFile || saving || loadingContent}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 relative flex flex-col">
        {loadingContent ? (
          <div className="absolute inset-0 z-10 bg-[#1e1e1e]/80 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
            <p className="text-slate-400">Carregando arquivo...</p>
          </div>
        ) : null}

        {activeFile ? (
          <Editor
            height="100%"
            language={getLanguage(activeFile)}
            theme="vs-dark"
            value={content}
            onChange={(val) => setContent(val || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: 'on',
              padding: { top: 16 },
              formatOnPaste: true,
            }}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
            <Code2 className="w-12 h-12 mb-4 opacity-20" />
            <p>Selecione um arquivo na barra lateral para começar a editar.</p>
          </div>
        )}
      </div>
    </div>
  );
}
