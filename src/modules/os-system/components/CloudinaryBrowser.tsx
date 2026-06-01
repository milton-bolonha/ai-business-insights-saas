import React, { useRef, useState } from 'react';

interface CloudinaryBrowserProps {
  osId: string;
  workspaceId: string;
  phase: string;
  onUploadSuccess: (fileData: { id: string; url: string; phase: string; filename: string; uploadedAt: string }) => void;
}

export const CloudinaryBrowser: React.FC<CloudinaryBrowserProps> = ({ osId, workspaceId, phase, onUploadSuccess }) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // O caminho estruturado no Cloudinary: workspaces/{id}/os/{os_id}/{fase}/
  const folderPath = `workspaces/${workspaceId}/os/${osId}/${phase}/`;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    simulateUpload(file);
  };

  const simulateUpload = (file: File) => {
    setIsUploading(true);

    // Simulando o delay de upload para o Cloudinary
    setTimeout(() => {
      const mockUrl = URL.createObjectURL(file); // Apenas mock visual local
      
      const fileData = {
        id: crypto.randomUUID(),
        url: mockUrl,
        phase: phase,
        filename: file.name,
        uploadedAt: new Date().toISOString()
      };
      
      onUploadSuccess(fileData);
      setIsUploading(false);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }, 1500);
  };

  return (
    <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,application/pdf"
      />
      <div className="flex flex-col items-center justify-center space-y-2">
        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
        <p className="text-sm text-gray-600">
          Upload para <span className="font-mono text-xs text-indigo-600">{folderPath}</span>
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="mt-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm disabled:opacity-50"
        >
          {isUploading ? 'Enviando...' : 'Selecionar Arquivo'}
        </button>
      </div>
    </div>
  );
};
