import React from 'react';

type OSFile = { id: string; url: string; phase: string; filename: string; uploadedAt: string };

interface FilesByFolderViewProps {
  files: OSFile[];
  onDeleteFile?: (id: string) => void;
}

export const FilesByFolderView: React.FC<FilesByFolderViewProps> = ({ files, onDeleteFile }) => {
  // Group files by phase
  const groupedFiles = files.reduce((acc, file) => {
    if (!acc[file.phase]) acc[file.phase] = [];
    acc[file.phase].push(file);
    return acc;
  }, {} as Record<string, OSFile[]>);

  const phaseLabels: Record<string, string> = {
    intake: 'Entrada / Triagem',
    diagnosis: 'Laudo Técnico / Orçamento',
    production: 'Produção / Laboratório',
    delivery: 'Entrega / Comprovantes',
    archived: 'Arquivados',
  };

  const getIconForFile = (filename: string) => {
    if (filename.endsWith('.pdf')) return '📄';
    return '🖼️';
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedFiles).length === 0 && (
        <div className="text-center py-8 text-gray-500 text-sm border border-dashed rounded-lg bg-gray-50">
          Nenhum arquivo anexado a esta OS.
        </div>
      )}

      {Object.entries(groupedFiles).map(([phase, phaseFiles]) => (
        <div key={phase} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
            <h4 className="text-sm font-semibold text-gray-700 capitalize flex items-center space-x-2">
              <span className="text-gray-400">📁</span>
              <span>{phaseLabels[phase] || phase}</span>
            </h4>
            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{phaseFiles.length}</span>
          </div>
          
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {phaseFiles.map(file => (
              <div key={file.id} className="relative group border border-gray-200 rounded-lg p-2 hover:border-indigo-300 transition-colors">
                <div className="aspect-square bg-gray-100 rounded mb-2 flex items-center justify-center overflow-hidden">
                  {file.url.startsWith('blob:') || file.url.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                    <img src={file.url} alt={file.filename} className="object-cover w-full h-full" />
                  ) : (
                    <span className="text-4xl">{getIconForFile(file.filename)}</span>
                  )}
                </div>
                <p className="text-xs text-gray-700 truncate font-medium" title={file.filename}>
                  {file.filename}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {new Date(file.uploadedAt).toLocaleDateString()}
                </p>

                {onDeleteFile && (
                  <button 
                    onClick={() => onDeleteFile(file.id)}
                    className="absolute top-1 right-1 bg-red-100 text-red-600 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200"
                    title="Excluir arquivo"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
