import { useState, useEffect } from 'react';
import { File, Loader2, ArrowLeft } from 'lucide-react';

interface FileExplorerSidebarProps {
  projectId: string;
  activeFile: string | null;
  onSelectFile: (path: string) => void;
  onBackToChat: () => void;
}

export function FileExplorerSidebar({ projectId, activeFile, onSelectFile, onBackToChat }: FileExplorerSidebarProps) {
  const [files, setFiles] = useState<string[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [errorFiles, setErrorFiles] = useState<string | null>(null);

  useEffect(() => {
    loadFiles();
  }, [projectId]);

  const loadFiles = async () => {
    setLoadingFiles(true);
    setErrorFiles(null);
    try {
      const res = await fetch(`/api/app-builder/projects/${projectId}/files`);
      const data = await res.json();
      if (res.ok && data.files) {
        setFiles(data.files.sort());
      } else {
        setErrorFiles(data.error || 'Failed to load files');
      }
    } catch (err: any) {
      console.error('Error loading files:', err);
      setErrorFiles(err.message || 'Error loading files');
    } finally {
      setLoadingFiles(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden w-[400px] shrink-0">
      <div className="flex items-center gap-2 p-4 border-b border-gray-200">
        <button 
          onClick={onBackToChat}
          className="p-1.5 hover:bg-slate-100 rounded-md transition-colors text-slate-500 hover:text-slate-700"
          title="Voltar para o Chat"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="font-semibold text-slate-800">Explorador</h2>
        <button 
          onClick={loadFiles} 
          disabled={loadingFiles}
          className="ml-auto text-xs text-blue-600 font-medium hover:underline"
        >
          {loadingFiles ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Atualizar'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {loadingFiles && files.length === 0 ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : errorFiles ? (
          <div className="p-4 text-sm text-red-500 text-center">
            {errorFiles}
          </div>
        ) : files.length > 0 ? (
          <div className="space-y-0.5">
            {files.map(path => {
              const isSelected = activeFile === path;
              const name = path.split('/').pop() || path;
              const depth = path.split('/').length - 1;
              
              return (
                <button
                  key={path}
                  onClick={() => onSelectFile(path)}
                  className={`w-full text-left flex items-center gap-2 py-1.5 px-2 rounded-md text-sm transition-colors ${
                    isSelected 
                      ? 'bg-blue-50 text-blue-700 font-medium' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                  style={{ paddingLeft: `${(depth * 12) + 8}px` }}
                  title={path}
                >
                  <File className={`w-4 h-4 shrink-0 ${isSelected ? 'text-blue-500' : 'text-slate-400'}`} />
                  <span className="truncate">{name}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-4 text-sm text-slate-500 text-center">
            Nenhum arquivo encontrado
          </div>
        )}
      </div>
    </div>
  );
}
