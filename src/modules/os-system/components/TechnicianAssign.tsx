import React, { useState } from 'react';
import { OSEntity } from '@/modules/os-system/types/OSEntity';

interface TechnicianAssignProps {
  os: OSEntity;
  onAssign: (technicianId: string, technicianName: string) => void;
}

// Em um cenário real, isso viria de uma API ou hook (ex: useStaff())
const mockTechnicians = [
  { id: 'tech-1', name: 'Carlos Silva' },
  { id: 'tech-2', name: 'Ana Oliveira' },
  { id: 'tech-3', name: 'Roberto Santos' },
];

export const TechnicianAssign: React.FC<TechnicianAssignProps> = ({ os, onAssign }) => {
  const [selectedTech, setSelectedTech] = useState(os.technicianId || '');

  const handleAssign = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedTech(id);
    
    if (id) {
      const tech = mockTechnicians.find(t => t.id === id);
      if (tech) {
        onAssign(tech.id, tech.name);
      }
    } else {
      onAssign('', '');
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 text-gray-600 font-medium text-xs">
        {os.technicianName ? os.technicianName.charAt(0).toUpperCase() : '?'}
      </div>
      <div className="flex-1">
        <select
          value={selectedTech}
          onChange={handleAssign}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs p-1 border text-gray-700 bg-white"
        >
          <option value="">-- Atribuir Técnico --</option>
          {mockTechnicians.map((tech) => (
            <option key={tech.id} value={tech.id}>
              {tech.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
