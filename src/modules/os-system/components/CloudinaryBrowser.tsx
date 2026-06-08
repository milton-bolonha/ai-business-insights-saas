import React, { useRef, useState } from 'react';

import { uploadToCloudinary } from '@/lib/services/cloudinary';
import { OSEntity } from '../types/OSEntity';

interface CloudinaryBrowserProps {
  os: OSEntity;
  workspaceId: string;
  phase: string;
  onUploadSuccess: (fileData: { id: string; url: string; phase: string; filename: string; uploadedAt: string }) => void;
}

export const CloudinaryBrowser: React.FC<CloudinaryBrowserProps> = ({ os, workspaceId, phase, onUploadSuccess }) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  const customerName = os.customer?.name ? os.customer.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() : 'cliente';
  const projectName = os.title ? os.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() : 'projeto';

  const baseName = `${customerName}-${projectName}-${day}-${month}-${year}`;
  const folderPath = `${year}/${month}/${baseName}/${phase}`;

  const handleUpload = async (file: File) => {
    setIsUploading(true);

    try {
      const url = await uploadToCloudinary(file, folderPath, workspaceId);
      
      const fileData = {
        id: crypto.randomUUID(),
        url: url,
        phase: phase,
        filename: file.name,
        uploadedAt: new Date().toISOString()
      };
      
      onUploadSuccess(fileData);
    } catch (error) {
      console.error("Upload failed", error);
      alert("Falha ao fazer upload da imagem.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    handleUpload(file);
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
