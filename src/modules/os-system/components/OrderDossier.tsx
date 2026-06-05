import React, { useState } from 'react';
import { OSEntity, OSTask, OSActivityLog, OSStatus } from '../types/OSEntity';
import { CheckCircle, Clock, Play, AlertCircle, Plus, Trash2, User, Send, Check, UploadCloud, FileText, Printer, Scissors, Box, Package, Loader2, Image as ImageIcon, X } from 'lucide-react';
import { OSStatusBadge } from './OSStatusBadge';

interface OrderDossierProps {
  os: OSEntity;
  onUpdate: (updates: Partial<OSEntity>) => void;
  onClose?: () => void;
}

import { Equipment } from '../types/Equipment';
import { DeliveryProof } from './DeliveryProof';
import { OSTasksPanel } from './OSTasksPanel';

export const OrderDossier: React.FC<OrderDossierProps> = ({ os, onUpdate, onClose }) => {
  const [activeTab, setActiveTab] = useState<'comercial' | 'design' | 'producao' | 'expedicao' | 'tarefas'>('comercial');
  const [isUploading, setIsUploading] = useState(false);
  const [availableEquipments, setAvailableEquipments] = useState<Equipment[]>([]);

  React.useEffect(() => {
    const stored = localStorage.getItem('os_system_equipments');
    if (stored) {
      setAvailableEquipments(JSON.parse(stored));
    }
  }, []);

  // Tasks state
  const [tasks, setTasks] = useState<OSTask[]>(os.tasks || []);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');

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

  const addLog = (action: string, description: string) => {
    return [
      { id: crypto.randomUUID(), action, description, timestamp: new Date().toISOString() },
      ...(os.activityLog || [])
    ];
  };

  const advanceStatus = (newStatus: OSStatus, action: string, description: string) => {
    onUpdate({ 
      status: newStatus,
      activityLog: addLog(action, description)
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newUrls: string[] = [];

    try {
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const folderPath = `os_system/workspace-x/${year}/${month}/${os.osNumber}`;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        
        const uploadPromise = new Promise<string>((resolve, reject) => {
          reader.onload = async (event) => {
            const base64Data = event.target?.result;
            try {
              const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  fileData: base64Data,
                  folder: folderPath
                })
              });
              
              if (res.ok) {
                const data = await res.json();
                resolve(data.secure_url);
              } else {
                reject(new Error('Upload failed'));
              }
            } catch (err) {
              reject(err);
            }
          };
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(file);
        });

        const url = await uploadPromise;
        newUrls.push(url);
      }

      onUpdate({
        artDetails: {
          ...os.artDetails,
          arquivosUrl: [...(os.artDetails?.arquivosUrl || []), ...newUrls]
        },
        activityLog: addLog('Arte Enviada', `${files.length} arquivo(s) de arte adicionado(s) via Cloudinary.`)
      });

    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      alert('Falha ao fazer upload da imagem.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleApproveArt = async () => {
    // 1. Atualizar a OS
    onUpdate({ 
      artDetails: { ...os.artDetails, aprovacaoCliente: true, dataAprovacao: new Date().toISOString() },
      status: 'arte_aprovada',
      activityLog: addLog('Arte Aprovada', 'Cliente aprovou o arquivo final de arte via painel.')
    });

    // 2. Disparar Notificação Interna
    try {
      await fetch('/api/mentoring/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: 'global', // Modifique se usar workspaces
          recipientId: 'all',
          title: 'Arte Aprovada',
          message: `O cliente aprovou a arte para a ${os.osNumber} (${os.customer?.name}).`,
          icon: 'sparkles'
        })
      });
    } catch (err) {
      console.error("Failed to send notification:", err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6 flex items-start justify-between shrink-0">
        <div>
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-900">{os.title}</h2>
            <div className="flex items-center">
              <OSStatusBadge status={os.status} />
              {onClose && (
                <button 
                  onClick={onClose} 
                  className="p-2 ml-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors"
                  title="Fechar OS"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-500 flex items-center gap-2 mt-2">
            <span className="font-mono text-gray-400">{os.osNumber}</span>
            <span>&bull;</span>
            <User className="w-3 h-3" /> {os.customer?.name || 'Cliente Genérico'}
          </p>
        </div>
        
        {/* Quick Actions baseadas no Status Atual */}
        <div className="flex gap-2">
          {os.status === 'orcamento' && (
            <button onClick={() => advanceStatus('aguardando_aprovacao', 'Orçamento Enviado', 'Enviado para aprovação do cliente.')} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
              Enviar Orçamento
            </button>
          )}
          {os.status === 'aguardando_aprovacao' && (
            <button onClick={() => advanceStatus('aprovado', 'Orçamento Aprovado', 'Cliente aprovou o orçamento.')} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
              Marcar como Aprovado
            </button>
          )}
          {['aprovado', 'entrada_recebida'].includes(os.status) && (
            <button onClick={() => advanceStatus('em_arte', 'Enviado para Arte', 'Pedido entrou na fila de Design.')} className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
              Enviar para Arte
            </button>
          )}
        </div>
      </div>

      {/* Tabs Nav */}
      <div className="flex border-b border-gray-200 px-6 bg-white shrink-0">
        <button onClick={() => setActiveTab('comercial')} className={`py-3 mr-6 border-b-2 text-sm transition-colors flex items-center gap-2 ${activeTab === 'comercial' ? 'border-violet-600 text-violet-700 font-bold' : 'border-transparent text-gray-500'}`}><FileText className="w-4 h-4" /> Comercial & Produto</button>
        <button onClick={() => setActiveTab('design')} className={`py-3 mr-6 border-b-2 text-sm transition-colors flex items-center gap-2 ${activeTab === 'design' ? 'border-violet-600 text-violet-700 font-bold' : 'border-transparent text-gray-500'}`}><Printer className="w-4 h-4" /> Arte & Impressão</button>
        <button onClick={() => setActiveTab('producao')} className={`py-3 mr-6 border-b-2 text-sm transition-colors flex items-center gap-2 ${activeTab === 'producao' ? 'border-violet-600 text-violet-700 font-bold' : 'border-transparent text-gray-500'}`}><Scissors className="w-4 h-4" /> Produção</button>
        <button onClick={() => setActiveTab('expedicao')} className={`py-3 mr-6 border-b-2 text-sm transition-colors flex items-center gap-2 ${activeTab === 'expedicao' ? 'border-violet-600 text-violet-700 font-bold' : 'border-transparent text-gray-500'}`}><Package className="w-4 h-4" /> Expedição</button>
        <button onClick={() => setActiveTab('tarefas')} className={`py-3 mr-6 border-b-2 text-sm transition-colors flex items-center gap-2 ${activeTab === 'tarefas' ? 'border-violet-600 text-violet-700 font-bold' : 'border-transparent text-gray-500'}`}>Tarefas <span className="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">{tasks.length}</span></button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        
        {/* Tab: COMERCIAL & PRODUTO */}
        {activeTab === 'comercial' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b pb-2">Detalhes do Produto</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Modelo / Peça</label>
                    <input 
                      type="text" 
                      value={os.productDetails?.modelo || ''} 
                      onChange={(e) => onUpdate({ productDetails: { ...os.productDetails, modelo: e.target.value } })}
                      className="w-full text-sm border-gray-300 rounded-md bg-gray-50" placeholder="Ex: Calça Cargo"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Personalização</label>
                    <input 
                      type="text" 
                      value={os.productDetails?.personalizacao || ''} 
                      onChange={(e) => onUpdate({ productDetails: { ...os.productDetails, personalizacao: e.target.value } })}
                      className="w-full text-sm border-gray-300 rounded-md bg-gray-50" placeholder="Ex: Silk, DTF"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Malha / Tecido</label>
                    <input 
                      type="text" 
                      value={os.productDetails?.malha || ''} 
                      onChange={(e) => onUpdate({ productDetails: { ...os.productDetails, malha: e.target.value } })}
                      className="w-full text-sm border-gray-300 rounded-md bg-gray-50" placeholder="Ex: Brim, Algodão"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Cor</label>
                    <input 
                      type="text" 
                      value={os.productDetails?.cor || ''} 
                      onChange={(e) => onUpdate({ productDetails: { ...os.productDetails, cor: e.target.value } })}
                      className="w-full text-sm border-gray-300 rounded-md bg-gray-50" placeholder="Ex: Preto"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <label className="block text-xs text-gray-500 mb-2 font-bold">Grade de Tamanhos</label>
                  <div className="flex gap-2">
                    {['P', 'M', 'G', 'GG', 'XGG'].map(size => (
                      <div key={size} className="flex-1 text-center">
                        <span className="block text-xs text-gray-400 mb-1">{size}</span>
                        <input 
                          type="number"
                          value={os.productDetails?.grade?.[size] || 0}
                          onChange={(e) => {
                            const newGrade = { ...os.productDetails?.grade, [size]: parseInt(e.target.value) || 0 };
                            onUpdate({ productDetails: { ...os.productDetails, grade: newGrade } });
                          }}
                          className="w-full text-center text-sm border-gray-300 rounded-md p-1"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
               <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b pb-2">Financeiro</h3>
               <div className="space-y-4">
                 <div>
                    <label className="block text-xs text-gray-500 mb-1">Valor Total (R$)</label>
                    <input 
                      type="number" 
                      value={os.totalRevenue || 0} 
                      onChange={(e) => onUpdate({ totalRevenue: parseFloat(e.target.value) })}
                      className="w-full text-lg font-bold border-gray-300 rounded-md"
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Entrada Recebida (R$)</label>
                    <input 
                      type="number" 
                      value={os.valorEntrada || 0} 
                      onChange={(e) => onUpdate({ valorEntrada: parseFloat(e.target.value) })}
                      className="w-full text-sm border-gray-300 rounded-md text-emerald-600 font-bold bg-emerald-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Saldo Restante (R$)</label>
                    <input 
                      type="number" 
                      value={os.valorRestante || 0} 
                      onChange={(e) => onUpdate({ valorRestante: parseFloat(e.target.value) })}
                      className="w-full text-sm border-gray-300 rounded-md text-red-600 font-bold bg-red-50"
                    />
                  </div>
                 </div>
               </div>
            </div>

            <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b pb-2">Log de Atividades</h3>
              <div className="space-y-4">
                {(os.activityLog || []).map((log, idx) => (
                  <div key={idx} className="flex gap-3 text-sm">
                    <div className="mt-1"><CheckCircle className="w-4 h-4 text-violet-500" /></div>
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
        )}

        {/* Tab: DESIGN & ARTE */}
        {activeTab === 'design' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b pb-2 flex items-center justify-between">
                <span>Controle de Arte</span>
                {os.artDetails?.aprovacaoCliente ? (
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">Aprovada</span>
                ) : (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Pendente Aprovação</span>
                )}
              </h3>
              
              <div className="space-y-4">
                <label className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 cursor-pointer transition-colors relative">
                  {isUploading ? (
                    <>
                       <Loader2 className="w-8 h-8 text-violet-400 mb-2 animate-spin" />
                       <p className="text-sm font-medium text-gray-700">Enviando para o Cloudinary...</p>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-8 h-8 text-violet-400 mb-2" />
                      <p className="text-sm font-medium text-gray-700">Fazer Upload de Arquivo (Cloudinary)</p>
                      <p className="text-xs text-gray-400 mt-1">.ai, .psd, .pdf, .png</p>
                      <input type="file" multiple className="hidden" onChange={handleFileUpload} accept="image/*,.pdf,.ai,.psd" disabled={isUploading} />
                    </>
                  )}
                </label>

                {os.artDetails?.arquivosUrl && os.artDetails.arquivosUrl.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {os.artDetails.arquivosUrl.map((url, idx) => (
                      <a key={idx} href={url} target="_blank" rel="noreferrer" className="block relative group overflow-hidden rounded-md border border-gray-200 aspect-square">
                        {url.endsWith('.pdf') || url.endsWith('.zip') || url.endsWith('.ai') ? (
                           <div className="w-full h-full flex items-center justify-center bg-gray-100">
                             <FileText className="w-8 h-8 text-gray-400" />
                           </div>
                        ) : (
                           <img src={url} alt={`Arte ${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                      </a>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 items-center bg-blue-50 text-blue-800 p-3 rounded-lg text-sm">
                  <User className="w-4 h-4" />
                  <span>Designer: </span>
                  <input 
                    type="text" 
                    value={os.artDetails?.designerName || ''}
                    onChange={(e) => onUpdate({ artDetails: { ...os.artDetails, designerName: e.target.value }})}
                    className="bg-transparent border-b border-blue-200 flex-1 outline-none px-1"
                    placeholder="Nome do Designer"
                  />
                </div>

                {!os.artDetails?.aprovacaoCliente && (
                  <button 
                    onClick={handleApproveArt}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium"
                  >
                    Simular Aprovação do Cliente
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b pb-2">Controle de Impressão</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Equipamento (Máquina)</label>
                  <select 
                    value={os.printDetails?.equipamentoId || ''}
                    onChange={(e) => onUpdate({ printDetails: { ...os.printDetails, equipamentoId: e.target.value, equipamentoNome: e.target.options[e.target.selectedIndex].text }})}
                    className="w-full text-sm border-gray-300 rounded-md"
                  >
                    <option value="">Selecione o equipamento...</option>
                    {availableEquipments.map(eq => (
                      <option key={eq.id} value={eq.id}>{eq.name}</option>
                    ))}
                    {availableEquipments.length === 0 && (
                      <>
                        <option value="EQ001">MyPrinter DTF A3 E1600</option>
                        <option value="EQ002">Epson SureColor F6370 (Sublimação)</option>
                        <option value="EQ003">Plotter E-cut EK-2100</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Tipo de Impressão</label>
                  <select 
                    value={os.printDetails?.tipoImpressao || ''}
                    onChange={(e) => onUpdate({ printDetails: { ...os.printDetails, tipoImpressao: e.target.value }})}
                    className="w-full text-sm border-gray-300 rounded-md"
                  >
                    <option value="dtf">DTF</option>
                    <option value="sublimacao">Sublimação</option>
                    <option value="plotter">Plotter</option>
                    <option value="silk">Fotolito / Silk</option>
                  </select>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={() => advanceStatus('em_producao', 'Impressão Concluída', 'Material impresso e enviado para a confecção.')}
                    className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium"
                  >
                    Finalizar Impressão e Enviar p/ Produção
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: PRODUÇÃO */}
        {activeTab === 'producao' && (
          <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-6 border-b pb-2">Checklist de Produção (Confecção)</h3>
            
            <div className="space-y-3">
              {[
                { key: 'corte', label: 'Corte de Malha/Moldes' },
                { key: 'costura', label: 'Costura e Montagem' },
                { key: 'dtf', label: 'Aplicação DTF' },
                { key: 'silk', label: 'Estampa Silk Screen' },
                { key: 'prensagem', label: 'Prensagem Térmica' },
                { key: 'acabamento', label: 'Acabamento (Linhas, Tags)' },
              ].map((step) => {
                const isChecked = os.productionDetails?.[step.key as keyof typeof os.productionDetails] || false;
                return (
                  <label key={step.key} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${isChecked ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>
                    <input 
                      type="checkbox" 
                      checked={isChecked}
                      onChange={(e) => {
                        const newProd = { ...os.productionDetails, [step.key]: e.target.checked };
                        onUpdate({ productionDetails: newProd });
                      }}
                      className="w-5 h-5 text-emerald-600 rounded border-gray-300"
                    />
                    <span className={`font-medium ${isChecked ? 'text-emerald-800 line-through opacity-70' : 'text-gray-700'}`}>{step.label}</span>
                  </label>
                )
              })}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <button 
                onClick={() => advanceStatus('em_conferencia', 'Produção Concluída', 'Todas as etapas de confecção finalizadas. Enviado para conferência.')}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex justify-center items-center gap-2"
              >
                <Box className="w-4 h-4" /> Concluir Produção e Enviar p/ Expedição
              </button>
            </div>
          </div>
        )}

        {/* Tab: EXPEDIÇÃO */}
        {activeTab === 'expedicao' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <DeliveryProof 
              os={os}
              onCompleteDelivery={(id, updates) => {
                onUpdate({
                  ...updates,
                  activityLog: addLog('OS Entregue', 'Entrega registrada e OS finalizada.')
                });
              }}
              onCancel={() => setActiveTab('comercial')}
            />
          </div>
        )}

        {/* Tab: TAREFAS */}
        {activeTab === 'tarefas' && (
          <div className="h-[calc(100vh-250px)] pb-6">
            <OSTasksPanel 
              tasks={tasks}
              onTasksUpdate={(newTasks) => {
                setTasks(newTasks);
                onUpdate({ tasks: newTasks });
              }}
            />
          </div>
        )}

      </div>
    </div>
  );
};
