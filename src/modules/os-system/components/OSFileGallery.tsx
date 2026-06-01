import React, { useState } from 'react';
import { OSEntity } from '@/modules/os-system/types/OSEntity';
import { CloudinaryBrowser } from './CloudinaryBrowser';
import { FilesByFolderView } from './FilesByFolderView';

interface OSFileGalleryProps {
  os: OSEntity;
  workspaceId: string;
  onUpdateOS: (osId: string, updates: Partial<OSEntity>) => void;
}

export const OSFileGallery: React.FC<OSFileGalleryProps> = ({ os, workspaceId, onUpdateOS }) => {
  const [activePhase, setActivePhase] = useState<string>('intake');
  
  const files = os.files || [];

  const handleUploadSuccess = (newFile: any) => {
    const updatedFiles = [...files, newFile];
    onUpdateOS(os.id, { files: updatedFiles });
  };

  const handleDeleteFile = (fileId: string) => {
    if (confirm("Tem certeza que deseja excluir este arquivo? (Isso o arquivaria no Cloudinary)")) {
      const updatedFiles = files.filter(f => f.id !== fileId);
      onUpdateOS(os.id, { files: updatedFiles });
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-1">Galeria de Arquivos e Laudos</h3>
        <p className="text-sm text-gray-500">
          Gerencie fotos, PDFs e evidências da Ordem de Serviço <span className="font-semibold text-gray-700">{os.osNumber}</span>
        </p>
      </div>

      <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Uploader Section */}
        <div className="lg:col-span-1 space-y-4 border-b lg:border-b-0 lg:border-r border-gray-100 pb-4 lg:pb-0 lg:pr-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Selecione a Fase / Pasta</label>
            <select
              value={activePhase}
              onChange={(e) => setActivePhase(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
            >
              <option value="intake">Entrada / Balcão</option>
              <option value="diagnosis">Laudo / Evidência de Defeito</option>
              <option value="production">Laboratório / Peças Antigas</option>
              <option value="delivery">Comprovante de Retirada</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">A fase selecionada definirá a pasta no Cloudinary.</p>
          </div>

          <CloudinaryBrowser 
            osId={os.id} 
            workspaceId={workspaceId} 
            phase={activePhase} 
            onUploadSuccess={handleUploadSuccess} 
          />
        </div>

        {/* Gallery Section */}
        <div className="lg:col-span-2">
          <FilesByFolderView files={files} onDeleteFile={handleDeleteFile} />
        </div>
      </div>
    </div>
  );
};
