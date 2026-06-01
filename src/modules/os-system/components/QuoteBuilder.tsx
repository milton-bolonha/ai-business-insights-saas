import React, { useState } from 'react';
import { OSEntity, OSTask, OSActivityLog } from '../types/OSEntity';
import { CheckCircle, Clock, Play, AlertCircle, Plus, Trash2, User, Send, Check } from 'lucide-react';

interface QuoteItem {
  id: string;
  description: string;
  type: 'part' | 'labor' | 'other';
  quantity: number;
  unitCost: number;
  unitPrice: number;
}

interface QuoteBuilderProps {
  os: OSEntity;
  onUpdate: (updates: Partial<OSEntity>) => void;
}

export const QuoteBuilder: React.FC<QuoteBuilderProps> = ({ os, onUpdate }) => {
  // Budgeting state
  const initialItems: QuoteItem[] = os.totalCost ? [{ id: '1', description: 'Item Orçado', type: 'part', quantity: 1, unitCost: os.totalCost, unitPrice: os.totalRevenue || 0 }] : [];
  const [items, setItems] = useState<QuoteItem[]>(initialItems);
  const [newItem, setNewItem] = useState<Partial<QuoteItem>>({ type: 'part', quantity: 1, unitCost: 0, unitPrice: 0, description: '' });

  // Tasks state
  const [tasks, setTasks] = useState<OSTask[]>(os.tasks || []);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');

  // Active sub-tab in details
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'budget'>('overview');

  const addItem = () => {
    if (!newItem.description || !newItem.unitPrice) return;
    const newItems = [...items, {
      id: crypto.randomUUID(),
      description: newItem.description!,
      type: newItem.type as 'part' | 'labor' | 'other',
      quantity: newItem.quantity || 1,
      unitCost: newItem.unitCost || 0,
      unitPrice: newItem.unitPrice || 0,
    }];
    setItems(newItems);
    setNewItem({ type: 'part', quantity: 1, unitCost: 0, unitPrice: 0, description: '' });
    updateFinancials(newItems);
  };

  const removeItem = (id: string) => {
    const newItems = items.filter(i => i.id !== id);
    setItems(newItems);
    updateFinancials(newItems);
  };

  const updateFinancials = (currentItems: QuoteItem[]) => {
    let cost = 0; let price = 0;
    currentItems.forEach(i => { cost += (i.unitCost * i.quantity); price += (i.unitPrice * i.quantity); });
    const margin = price > 0 ? ((price - cost) / price) * 100 : 0;
    onUpdate({ totalCost: cost, totalRevenue: price, profitMargin: margin });
  };

  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    const newTask: OSTask = {
      id: crypto.randomUUID(),
      title: newTaskTitle,
      status: 'todo',
      priority: 'medium',
      assigneeName: newTaskAssignee.trim() || undefined,
      createdAt: new Date().toISOString()
    };
    const newTasks = [...tasks, newTask];
    setTasks(newTasks);
    setNewTaskTitle('');
    setNewTaskAssignee('');
    onUpdate({ tasks: newTasks });
  };

  const updateTaskStatus = (id: string, status: OSTask['status']) => {
    const newTasks = tasks.map(t => t.id === id ? { ...t, status } : t);
    setTasks(newTasks);
    onUpdate({ tasks: newTasks });
  };

  const approveAndSendToProduction = () => {
    onUpdate({ 
      status: 'production_pending',
      activityLog: [
        { id: crypto.randomUUID(), action: 'Enviado para Produção', description: 'Orçamento aprovado e projeto enviado para a fila de produção.', timestamp: new Date().toISOString() },
        ...(os.activityLog || [])
      ]
    });
  };

  const totals = React.useMemo(() => {
    let cost = 0; let price = 0;
    items.forEach(i => { cost += (i.unitCost * i.quantity); price += (i.unitPrice * i.quantity); });
    const margin = price > 0 ? ((price - cost) / price) * 100 : 0;
    return { cost, price, margin };
  }, [items]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full max-h-[800px]">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-bold text-gray-900">{os.title}</h2>
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-violet-100 text-violet-700 uppercase">
              {os.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-sm text-gray-500 flex items-center gap-2">
            <span className="font-mono text-gray-400">{os.osNumber}</span>
            <span>&bull;</span>
            <User className="w-3 h-3" /> {os.customer?.name}
          </p>
        </div>
        
        {/* Actions */}
        <div className="flex gap-2">
          {['intake', 'quote_pending'].includes(os.status) && (
            <button
              onClick={approveAndSendToProduction}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Aprovar & Enviar p/ Produção
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 px-6">
        <button onClick={() => setActiveTab('overview')} className={`py-3 mr-6 border-b-2 text-sm transition-colors ${activeTab === 'overview' ? 'border-violet-600 text-violet-700 font-bold' : 'border-transparent text-gray-500'}`}>Visão Geral</button>
        <button onClick={() => setActiveTab('tasks')} className={`py-3 mr-6 border-b-2 text-sm transition-colors flex items-center gap-2 ${activeTab === 'tasks' ? 'border-violet-600 text-violet-700 font-bold' : 'border-transparent text-gray-500'}`}>Tarefas <span className="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">{tasks.length}</span></button>
        <button onClick={() => setActiveTab('budget')} className={`py-3 mr-6 border-b-2 text-sm transition-colors ${activeTab === 'budget' ? 'border-violet-600 text-violet-700 font-bold' : 'border-transparent text-gray-500'}`}>Orçamento Financeiro</button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-white">
        
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-2">Descrição do Projeto</h3>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-700 whitespace-pre-wrap">
                {os.description || 'Nenhuma descrição fornecida.'}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-2">Detalhes Adicionais</h3>
                <ul className="text-sm space-y-2 text-gray-600">
                  <li><strong>Condição:</strong> {os.itemCondition || '-'}</li>
                  <li><strong>Relato:</strong> {os.reportedDetails || '-'}</li>
                  <li><strong>Acessórios:</strong> {os.additionalItems?.join(', ') || '-'}</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-2">Log de Atividades</h3>
                <div className="space-y-4">
                  {(os.activityLog || []).map((log, idx) => (
                    <div key={idx} className="flex gap-3 text-sm">
                      <div className="mt-1"><CheckCircle className="w-4 h-4 text-emerald-500" /></div>
                      <div>
                        <p className="font-medium text-gray-900">{log.action}</p>
                        <p className="text-gray-500 text-xs">{log.description}</p>
                        <p className="text-gray-400 text-[10px] mt-0.5">{new Date(log.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                  {(!os.activityLog || os.activityLog.length === 0) && <p className="text-sm text-gray-400 italic">Nenhuma atividade registrada.</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div>
            <div className="flex gap-2 mb-6">
              <input 
                type="text" 
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTask()}
                placeholder="Ex: Fazer design da logo..."
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
              />
              <input
                type="text"
                value={newTaskAssignee}
                onChange={(e) => setNewTaskAssignee(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTask()}
                placeholder="Atribuir a..."
                list="assignee-options"
                className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none bg-gray-50"
              />
              <datalist id="assignee-options">
                <option value="Eu Mesmo" />
                <option value="Time de Design" />
                <option value="Time de Dev" />
              </datalist>
              <button onClick={addTask} className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                <Plus className="w-4 h-4" /> Nova Tarefa
              </button>
            </div>

            <div className="space-y-3">
              {tasks.length === 0 && (
                <div className="text-center py-10 bg-gray-50 border border-gray-200 border-dashed rounded-xl">
                  <p className="text-gray-500 text-sm">Nenhuma tarefa criada para este projeto.</p>
                </div>
              )}
              {tasks.map(task => (
                <div key={task.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors shadow-sm">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => updateTaskStatus(task.id, task.status === 'done' ? 'todo' : 'done')}
                      className={`border w-5 h-5 rounded flex items-center justify-center transition-colors ${task.status === 'done' ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-gray-300 text-transparent'}`}
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <div>
                      <p className={`text-sm ${task.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-800 font-medium'}`}>{task.title}</p>
                      <div className="flex gap-2 mt-1">
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md ${task.priority === 'urgent' ? 'bg-red-100 text-red-700' : task.priority === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                          {task.priority}
                        </span>
                        {task.assigneeName && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 flex items-center gap-1">
                            <User className="w-3 h-3" /> {task.assigneeName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select 
                      value={task.status}
                      onChange={(e) => updateTaskStatus(task.id, e.target.value as any)}
                      className="text-xs bg-gray-50 border border-gray-200 rounded-md px-2 py-1 outline-none"
                    >
                      <option value="todo">A Fazer</option>
                      <option value="in_progress">Em Andamento</option>
                      <option value="done">Concluído</option>
                    </select>
                    <button onClick={() => {
                       const newTasks = tasks.filter(t => t.id !== task.id);
                       setTasks(newTasks);
                       onUpdate({ tasks: newTasks });
                    }} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Budget Tab */}
        {activeTab === 'budget' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-6 items-end bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Descrição</label>
                <input type="text" className="w-full rounded-md border-gray-300 shadow-sm text-sm p-2 border focus:ring-2 focus:ring-violet-500 focus:outline-none" value={newItem.description || ''} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} placeholder="Ex: Tela IPS 15.6" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
                <select className="w-full rounded-md border-gray-300 shadow-sm text-sm p-2 border focus:ring-2 focus:ring-violet-500 focus:outline-none" value={newItem.type} onChange={(e) => setNewItem({ ...newItem, type: e.target.value as any })}>
                  <option value="part">Peça/Material</option>
                  <option value="labor">Mão de Obra</option>
                  <option value="other">Outros</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Custo (R$)</label>
                <input type="number" className="w-full rounded-md border-gray-300 shadow-sm text-sm p-2 border focus:ring-2 focus:ring-violet-500 focus:outline-none" value={newItem.unitCost} onChange={(e) => setNewItem({ ...newItem, unitCost: Number(e.target.value) })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Venda (R$)</label>
                <input type="number" className="w-full rounded-md border-gray-300 shadow-sm text-sm p-2 border focus:ring-2 focus:ring-violet-500 focus:outline-none" value={newItem.unitPrice} onChange={(e) => setNewItem({ ...newItem, unitPrice: Number(e.target.value) })} />
              </div>
              <div>
                <button onClick={addItem} className="w-full py-2 bg-gray-900 text-white rounded-md text-sm hover:bg-gray-800 font-medium">Adicionar</button>
              </div>
            </div>

            <table className="min-w-full divide-y divide-gray-200 text-sm mb-6">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="pb-2 font-medium">Item</th>
                  <th className="pb-2 font-medium text-right">Custo Unit.</th>
                  <th className="pb-2 font-medium text-right">Preço Unit.</th>
                  <th className="pb-2 font-medium text-right">Total</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 text-gray-900 font-medium">{item.description} <span className="text-xs font-normal text-gray-400 ml-1">({item.type})</span></td>
                    <td className="py-3 text-right text-gray-500">R$ {item.unitCost.toFixed(2)}</td>
                    <td className="py-3 text-right">R$ {item.unitPrice.toFixed(2)}</td>
                    <td className="py-3 text-right font-medium">R$ {(item.unitPrice * item.quantity).toFixed(2)}</td>
                    <td className="py-3 text-right">
                      <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Remover</button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-gray-500 italic">Nenhum item adicionado ao orçamento.</td></tr>}
              </tbody>
            </table>

            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Custo Total: <span className="font-medium text-gray-900">R$ {totals.cost.toFixed(2)}</span></p>
                <p className="text-sm text-gray-600">Margem Prevista: <span className="font-medium text-emerald-600">{totals.margin.toFixed(1)}%</span></p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 mb-1">Total a cobrar do cliente</p>
                <p className="text-3xl font-bold text-gray-900">R$ {totals.price.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};