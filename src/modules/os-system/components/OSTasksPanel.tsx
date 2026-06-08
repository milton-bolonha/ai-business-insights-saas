import React, { useState } from 'react';
import { OSTask } from '../types/OSEntity';
import { Check, Plus, Trash2, User, ChevronDown, ChevronRight, MessageSquare, Paperclip, Clock, Calendar, Loader2, Image as ImageIcon, Send } from 'lucide-react';
import { uploadToCloudinary } from '@/lib/services/cloudinary';

interface OSTasksPanelProps {
  tasks: OSTask[];
  onTasksUpdate: (tasks: OSTask[]) => void;
}

export const OSTasksPanel: React.FC<OSTasksPanelProps> = ({ tasks, onTasksUpdate }) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<string | null>(null);

  const handleAddComment = (taskId: string, photoUrl?: string) => {
    const text = commentTexts[taskId] || '';
    if (!text.trim() && !photoUrl) return;

    const newComment = {
      id: crypto.randomUUID(),
      text: text.trim(),
      author: 'Milton Bolonha',
      createdAt: new Date().toISOString(),
      photoUrl
    };

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedComments = [...(task.comments || []), newComment];
    updateTask(taskId, { comments: updatedComments });
    
    setCommentTexts(prev => ({ ...prev, [taskId]: '' }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, taskId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(taskId);
    try {
      const url = await uploadToCloudinary(file, "os-system/tasks/comments", "global");
      handleAddComment(taskId, url);
    } catch (err) {
      console.error(err);
      alert("Falha ao enviar foto.");
    } finally {
      setIsUploadingPhoto(null);
    }
  };

  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    const newTask: OSTask = {
      id: crypto.randomUUID(),
      title: newTaskTitle,
      status: 'todo',
      priority: 'medium',
      assigneeName: newTaskAssignee || undefined,
      createdAt: new Date().toISOString()
    };
    onTasksUpdate([newTask, ...tasks]);
    setNewTaskTitle('');
    setNewTaskAssignee('');
  };

  const updateTask = (id: string, updates: Partial<OSTask>) => {
    const newTasks = tasks.map(t => t.id === id ? { ...t, ...updates } : t);
    onTasksUpdate(newTasks);
  };

  const deleteTask = (id: string) => {
    if (confirm("Remover esta tarefa permanentemente?")) {
      onTasksUpdate(tasks.filter(t => t.id !== id));
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-full bg-gray-50/50 rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="p-4 bg-white border-b border-gray-200">
        <h3 className="font-bold text-gray-900 mb-4">Gerenciamento de Tarefas</h3>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
            placeholder="O que precisa ser feito? (Ex: Aprovar arte com cliente)"
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
          />
          <input
            type="text"
            value={newTaskAssignee}
            onChange={(e) => setNewTaskAssignee(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
            placeholder="Atribuir a..."
            list="assignee-options"
            className="w-48 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none bg-white"
          />
          <datalist id="assignee-options">
            <option value="Setor Comercial" />
            <option value="Setor Design" />
            <option value="Setor Produção" />
            <option value="Expedição" />
          </datalist>
          <button onClick={addTask} className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shrink-0 transition-colors">
            <Plus className="w-4 h-4" /> Criar
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {tasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">Nenhuma tarefa no backlog.</p>
            <p className="text-sm text-gray-400 mt-1">Crie a primeira tarefa acima para começar.</p>
          </div>
        ) : (
          tasks.map(task => {
            const isExpanded = expandedTaskId === task.id;
            return (
              <div key={task.id} className={`bg-white border rounded-xl transition-all duration-200 ${isExpanded ? 'border-violet-300 shadow-md' : 'border-gray-200 hover:border-gray-300 shadow-sm'}`}>
                {/* Header da Tarefa (Sempre Visível) */}
                <div 
                  className="flex items-center p-3 cursor-pointer select-none"
                  onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                >
                  <div className="mr-3 text-gray-400 hover:text-gray-600 transition-colors">
                    {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </div>
                  
                  <div className="flex-1 flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                      {task.id.split('-')[0].toUpperCase()}
                    </span>
                    <p className={`text-sm font-semibold truncate ${task.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                      {task.title}
                    </p>
                    
                    {task.comments && task.comments.length > 0 && (
                      <span className="flex items-center gap-1 text-xs text-gray-400"><MessageSquare className="w-3 h-3" /> {task.comments.length}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    {task.assigneeName && (
                      <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium border border-blue-100" title="Responsável">
                        <User className="w-3 h-3" /> <span className="truncate max-w-[100px]">{task.assigneeName}</span>
                      </div>
                    )}
                    
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${task.priority === 'urgent' ? 'bg-red-50 text-red-700 border-red-200' : task.priority === 'high' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                      {task.priority}
                    </span>

                    <select 
                      value={task.status}
                      onClick={e => e.stopPropagation()}
                      onChange={(e) => updateTask(task.id, { status: e.target.value as any })}
                      className={`text-xs font-semibold rounded-md px-2 py-1 outline-none border cursor-pointer
                        ${task.status === 'done' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                          task.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                          'bg-gray-100 text-gray-600 border-gray-200'}`}
                    >
                      <option value="todo">A Fazer</option>
                      <option value="in_progress">Em Andamento</option>
                      <option value="done">Concluído</option>
                    </select>
                  </div>
                </div>

                {/* Detalhes da Tarefa (Expandível) */}
                {isExpanded && (
                  <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                    <div className="grid grid-cols-3 gap-6">
                      <div className="col-span-2 space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Descrição Detalhada</label>
                          <textarea 
                            value={task.description || ''}
                            onChange={(e) => updateTask(task.id, { description: e.target.value })}
                            placeholder="Adicione instruções, links ou contexto para esta tarefa..."
                            className="w-full text-sm border border-gray-200 rounded-lg p-3 min-h-[100px] focus:ring-2 focus:ring-violet-500 outline-none resize-y bg-white"
                          />
                        </div>

                        {/* Comments Section */}
                        <div className="mt-6 pt-4 border-t border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" /> Comentários e Fotos
                          </h4>
                          
                          <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-2">
                            {(!task.comments || task.comments.length === 0) && (
                              <p className="text-xs text-gray-400 italic">Nenhum comentário ainda.</p>
                            )}
                            {task.comments?.map(comment => (
                              <div key={comment.id} className="bg-white border border-gray-100 p-3 rounded-lg shadow-sm">
                                <div className="flex justify-between items-start mb-1">
                                  <span className="text-xs font-bold text-gray-800">{comment.author}</span>
                                  <span className="text-[10px] text-gray-400">{new Date(comment.createdAt).toLocaleString()}</span>
                                </div>
                                {comment.text && <p className="text-sm text-gray-600 mb-2">{comment.text}</p>}
                                {comment.photoUrl && (
                                  <a href={comment.photoUrl} target="_blank" rel="noreferrer" className="block w-32 h-32 rounded-md overflow-hidden border border-gray-200 hover:opacity-90 transition-opacity">
                                    <img src={comment.photoUrl} alt="Anexo" className="w-full h-full object-cover" />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>

                          <div className="flex gap-2 items-end">
                            <div className="flex-1 relative">
                              <textarea
                                value={commentTexts[task.id] || ''}
                                onChange={e => setCommentTexts(prev => ({ ...prev, [task.id]: e.target.value }))}
                                placeholder="Escreva um comentário..."
                                className="w-full text-sm border border-gray-200 rounded-lg p-3 pr-12 focus:ring-2 focus:ring-violet-500 outline-none resize-none bg-white min-h-[44px]"
                                rows={1}
                              />
                            </div>
                            
                            <label className={`w-11 h-11 flex items-center justify-center rounded-lg border transition-colors cursor-pointer ${isUploadingPhoto === task.id ? 'bg-gray-100 border-gray-200 text-gray-400' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-violet-600'}`}>
                              {isUploadingPhoto === task.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => handlePhotoUpload(e, task.id)}
                                disabled={isUploadingPhoto === task.id}
                              />
                            </label>

                            <button 
                              onClick={() => handleAddComment(task.id)}
                              disabled={!(commentTexts[task.id]?.trim())}
                              className="w-11 h-11 flex items-center justify-center rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4 border-l border-gray-200 pl-6">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Prioridade</label>
                          <select 
                            value={task.priority}
                            onChange={(e) => updateTask(task.id, { priority: e.target.value as any })}
                            className="w-full text-sm border border-gray-200 rounded-md p-2 bg-white"
                          >
                            <option value="low">Baixa</option>
                            <option value="medium">Média</option>
                            <option value="high">Alta</option>
                            <option value="urgent">Urgente</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Responsável</label>
                          <input 
                            type="text" 
                            value={task.assigneeName || ''}
                            onChange={(e) => updateTask(task.id, { assigneeName: e.target.value })}
                            placeholder="Atribuído a..."
                            className="w-full text-sm border border-gray-200 rounded-md p-2 bg-white"
                          />
                        </div>
                        <div className="pt-4 flex justify-end">
                          <button 
                            onClick={() => deleteTask(task.id)}
                            className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 p-2 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" /> Excluir Tarefa
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
