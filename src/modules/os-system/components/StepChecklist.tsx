import React, { useState } from 'react';
import { OSEntity } from '@/modules/os-system/types/OSEntity';

interface StepChecklistProps {
  os: OSEntity;
  onUpdateChecklist: (checklist: NonNullable<OSEntity['checklist']>) => void;
}

export const StepChecklist: React.FC<StepChecklistProps> = ({ os, onUpdateChecklist }) => {
  const [items, setItems] = useState(os.checklist || []);
  const [newTask, setNewTask] = useState('');

  const toggleTask = (id: string) => {
    const updated = items.map(item => 
      item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
    );
    setItems(updated);
    onUpdateChecklist(updated);
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    const updated = [
      ...items,
      { id: crypto.randomUUID(), label: newTask.trim(), isCompleted: false }
    ];
    setItems(updated);
    onUpdateChecklist(updated);
    setNewTask('');
  };

  const removeTask = (id: string) => {
    const updated = items.filter(item => item.id !== id);
    setItems(updated);
    onUpdateChecklist(updated);
  };

  const progress = items.length === 0 ? 0 : Math.round((items.filter(i => i.isCompleted).length / items.length) * 100);

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-md font-medium text-gray-800">Checklist de Produção</h4>
        <span className="text-sm font-semibold text-gray-500">{progress}% Concluído</span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div 
          className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="space-y-2 mb-4 max-h-60 overflow-y-auto pr-1">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between group p-2 hover:bg-gray-50 rounded">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={item.isCompleted}
                onChange={() => toggleTask(item.id)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
              />
              <span className={`text-sm ${item.isCompleted ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                {item.label}
              </span>
            </div>
            <button 
              onClick={() => removeTask(item.id)}
              className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Excluir
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-gray-500 italic py-2 text-center">Nenhum passo definido.</p>
        )}
      </div>

      <div className="flex space-x-2">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTask()}
          placeholder="Ex: Trocar display..."
          className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
        />
        <button
          onClick={addTask}
          disabled={!newTask.trim()}
          className="px-3 py-2 bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 text-sm font-medium disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </div>
  );
};
