import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Map as MapIcon, Package, AlertTriangle, Clock, Search, TrendingUp, Layers, 
  ArrowRightLeft, Bell, X, ChevronRight, ChevronLeft, Mic, Settings, Trash2, 
  Plus, Loader2, Send, Wand2, FileJson, FileSpreadsheet, LayoutGrid, SlidersHorizontal, 
  Bot, Info, GripHorizontal, GripVertical, Maximize2, Minimize2, Tag, DollarSign, Image as ImageIcon, Menu, CheckCircle2, Edit, Save
} from 'lucide-react';

// --- Global Setup ---
const STATUS_MAP = {
  EMPTY: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-400', label: 'Vazio' },
  OCCUPIED: { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-600', label: 'Ocupado' },
  RESERVED: { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-600', label: 'Reservado' },
  BLOCKED: { bg: 'bg-rose-50', border: 'border-rose-300', text: 'text-rose-600', label: 'Bloqueado' },
};

// --- Helpers ---
const generateGridForSector = (sectorDef) => {
  const newCells = [];
  for (let r = 1; r <= sectorDef.rows; r++) {
    for (let c = 1; c <= sectorDef.cols; c++) {
      newCells.push({ id: `${sectorDef.id}-${r}-${c}`, section: sectorDef.id, row: r, col: c, status: 'EMPTY', skus: [], updatedAt: new Date().toISOString() });
    }
  }
  return newCells;
};

const updateSectorGrid = (prevGrid, sectorId, newRows, newCols) => {
  const filteredGrid = prevGrid.filter(c => c.section !== sectorId);
  const oldSectorCells = prevGrid.filter(c => c.section === sectorId);
  const newCells = [];
  for (let r = 1; r <= newRows; r++) {
    for (let c = 1; c <= newCols; c++) {
      const existingCell = oldSectorCells.find(cell => cell.row === r && cell.col === c);
      if (existingCell) newCells.push(existingCell);
      else newCells.push({ id: `${sectorId}-${r}-${c}`, section: sectorId, row: r, col: c, status: 'EMPTY', skus: [], updatedAt: new Date().toISOString() });
    }
  }
  return [...filteredGrid, ...newCells];
};

const fetchWithRetry = async (url, options, retries = 5, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, delay * Math.pow(2, i)));
    }
  }
};

// --- Main App Component ---
export default function NexusWMSLight() {
  const apiKey = ""; 
  
  // Navigation & Core State
  const [isConfigured, setIsConfigured] = useState(false);
  const [activeTab, setActiveTab] = useState('CHAT'); // 'CHAT', 'MAPA', 'ESTOQUE', 'AVISOS'
  
  // WMS State
  const [sectors, setSectors] = useState([]);
  const [grid, setGrid] = useState([]);
  const [activeSectionId, setActiveSectionId] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [stats, setStats] = useState({ received: 0, shipped: 0, efficiency: 100 });
  const [activities, setActivities] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Modals & Sub-views
  const [showConfig, setShowConfig] = useState(false); 
  const [showSkuDetails, setShowSkuDetails] = useState(null); 
  const [showAddSku, setShowAddSku] = useState(false);
  const [newSector, setNewSector] = useState({ name: '', rows: 4, cols: 6, orientation: 'horizontal' });
  const [editingSectorId, setEditingSectorId] = useState(null);
  const [newProduct, setNewProduct] = useState({ name: '', sku: '', description: '', price: '', condition: '', targetCell: '' });
  const [showDropdown, setShowDropdown] = useState(false);

  // Chat & AI State
  const [chatHistory, setChatHistory] = useState([
    { 
      id: 1, role: 'ai', 
      content: "Olá! Sou a IA do Nexus WMS. 👋\n\nPara começar, precisamos montar a arquitetura do seu armazém. Você pode usar as opções rápidas abaixo ou me pedir por texto/áudio o que deseja! (Ex: 'Crie um setor A1 de 4x6 horizontal')"
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [pendingImages, setPendingImages] = useState([]);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchItems, setBatchItems] = useState([]);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  
  // Map View Mode
  const [isCompactView, setIsCompactView] = useState(true);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // --- Initializer / Logger ---
  const logActivity = (msg, type = 'info') => {
    setActivities(prev => [{ id: Date.now() + Math.random(), type, msg, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 50));
    if (activeTab !== 'AVISOS') setUnreadCount(prev => prev + 1);
  };

  useEffect(() => { if (activeTab === 'AVISOS') setUnreadCount(0); }, [activeTab]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatHistory, isProcessingAI]);

  // --- Carousel & Swipe Handlers ---
  const currentSectorIndex = sectors.findIndex(s => s.id === activeSectionId);
  const hasNextSector = currentSectorIndex >= 0 && currentSectorIndex < sectors.length - 1;
  const hasPrevSector = currentSectorIndex > 0;

  const handleNextSector = () => {
    if (hasNextSector) {
      setActiveSectionId(sectors[currentSectorIndex + 1].id);
      setSelectedCell(null);
    }
  };

  const handlePrevSector = () => {
    if (hasPrevSector) {
      setActiveSectionId(sectors[currentSectorIndex - 1].id);
      setSelectedCell(null);
    }
  };

  const minSwipeDistance = 50;
  const onTouchStart = (e) => { 
    setTouchEnd(null); 
    setTouchStart(e.targetTouches[0].clientX); 
  };
  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);
  const onTouchEndAction = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance && hasNextSector) handleNextSector();
    if (distance < -minSwipeDistance && hasPrevSector) handlePrevSector();
  };

  // --- Actions ---
  const finishOnboarding = (initialSectors) => {
    let newGrid = [];
    initialSectors.forEach(sec => { newGrid = [...newGrid, ...generateGridForSector(sec)]; });
    setSectors(initialSectors);
    setGrid(newGrid);
    setActiveSectionId(initialSectors[0]?.id || null);
    setIsConfigured(true);
    logActivity('Arquitetura do armazém inicializada.', 'success');
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ sectors, grid, stats, timestamp: new Date().toISOString() }, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr); downloadAnchorNode.setAttribute("download", `nexus_wms_${Date.now()}.json`);
    document.body.appendChild(downloadAnchorNode); downloadAnchorNode.click(); downloadAnchorNode.remove();
    setShowDropdown(false);
  };

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,ID,Setor,Linha,Coluna,Status,Produtos\n";
    grid.forEach(cell => {
      const skusJoined = cell.skus.map(s => s.name || s.sku).join('; ');
      csvContent += `${cell.id},${cell.section},${cell.row},${cell.col},${cell.status},"${skusJoined}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", encodedUri);
    downloadAnchorNode.setAttribute("download", `nexus_wms_export_${Date.now()}.csv`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    setShowDropdown(false);
  };

  // --- Config Modal Engine ---
  const handleSaveSectorConfig = () => {
    const name = newSector.name.trim().toUpperCase();
    if (!name) return;
    if (editingSectorId) {
      setSectors(prev => prev.map(s => s.id === editingSectorId ? { ...s, rows: Number(newSector.rows), cols: Number(newSector.cols), orientation: newSector.orientation } : s));
      setGrid(prev => updateSectorGrid(prev, editingSectorId, Number(newSector.rows), Number(newSector.cols)));
      setEditingSectorId(null);
    } else {
      if (!sectors.find(s => s.id === name)) {
        const newSecObj = { id: name, rows: Number(newSector.rows), cols: Number(newSector.cols), orientation: newSector.orientation };
        setSectors([...sectors, newSecObj]);
        setGrid(prev => [...prev, ...generateGridForSector(newSecObj)]);
        if(!isConfigured) { setIsConfigured(true); setActiveSectionId(name); setActiveTab('MAPA'); }
      }
    }
    setNewSector({ name: '', rows: 4, cols: 6, orientation: 'horizontal' });
  };

  // --- AI Chat Engine (MCP) ---
  const executeAICommands = (commands) => {
    let currentSectors = [...sectors];
    let currentGrid = [...grid];
    let rec = 0, ship = 0;
    let newlyConfigured = false;
    let actionLogs = [];

    commands.forEach(cmd => {
      try {
        if (cmd.action === 'CREATE_SECTOR') {
          const name = cmd.id.toUpperCase();
          if (!currentSectors.find(s => s.id === name)) {
            const secObj = { id: name, rows: Number(cmd.rows), cols: Number(cmd.cols), orientation: cmd.orientation || 'horizontal' };
            currentSectors.push(secObj);
            currentGrid = [...currentGrid, ...generateGridForSector(secObj)];
            logActivity(`Setor ${name} criado.`, 'success');
            actionLogs.push(`Setor ${name} criado (${cmd.rows}x${cmd.cols} - ${secObj.orientation}).`);
            newlyConfigured = true;
          }
        } 
        else if (cmd.action === 'DELETE_SECTOR') {
          const name = cmd.id.toUpperCase();
          currentSectors = currentSectors.filter(s => s.id !== name);
          currentGrid = currentGrid.filter(c => c.section !== name);
          logActivity(`Setor ${name} deletado.`, 'warning');
          actionLogs.push(`Setor ${name} foi completamente deletado.`);
        }
        else if (cmd.action === 'AUTO_PUTAWAY' || (cmd.action === 'PUTAWAY' && !cmd.targetId)) {
          const cellIndex = currentGrid.findIndex(c => c.status === 'EMPTY' || c.skus.length < 3);
          if (cellIndex !== -1) {
            const cell = { ...currentGrid[cellIndex] };
            const itemToStore = cmd.item || {};
            if(!itemToStore.sku) itemToStore.sku = `SKU-${Math.floor(Math.random() * 9000)}`;
            if(!itemToStore.name) itemToStore.name = 'Produto Não Identificado';
            
            cell.skus.push(itemToStore);
            cell.status = 'OCCUPIED';
            cell.updatedAt = new Date().toISOString();
            currentGrid[cellIndex] = cell;
            rec++;
            logActivity(`Auto-slotting: "${itemToStore.name}" guardado em ${cell.id}.`, 'success');
            actionLogs.push(`Alocado automaticamente "${itemToStore.name}" na vaga ${cell.id}.`);
          } else {
             actionLogs.push(`Falha: Sem espaço no armazém para alocar "${cmd.item?.name || 'Item'}".`);
          }
        }
        else if (cmd.action === 'PUTAWAY') {
          const targetId = cmd.targetId.toUpperCase();
          const cellIndex = currentGrid.findIndex(c => c.id === targetId);
          if (cellIndex !== -1) {
            const cell = { ...currentGrid[cellIndex] };
            if (cell.status !== 'BLOCKED') {
              const itemToStore = cmd.item || {};
              if(!itemToStore.sku) itemToStore.sku = `SKU-${Math.floor(Math.random() * 9000)}`;
              if(!itemToStore.name) itemToStore.name = 'Produto';

              cell.skus.push(itemToStore);
              cell.status = 'OCCUPIED';
              cell.updatedAt = new Date().toISOString();
              currentGrid[cellIndex] = cell;
              rec++;
              logActivity(`Armazenado "${itemToStore.name}" em ${targetId}.`, 'success');
              actionLogs.push(`Guardado "${itemToStore.name}" exatamente na posição ${targetId}.`);
            }
          }
        }
        else if (cmd.action === 'PICKING') {
          let cellIndex = -1;
          if (cmd.targetId) cellIndex = currentGrid.findIndex(c => c.id === cmd.targetId.toUpperCase());
          else if (cmd.sku) cellIndex = currentGrid.findIndex(c => c.skus.some(s => s.sku === cmd.sku || s.name.toLowerCase().includes(cmd.sku.toLowerCase())));

          if (cellIndex !== -1) {
            const cell = { ...currentGrid[cellIndex] };
            if (cell.skus.length > 0) {
              const targetSkuIndex = cmd.sku ? cell.skus.findIndex(s => s.sku === cmd.sku || s.name.toLowerCase().includes(cmd.sku.toLowerCase())) : cell.skus.length - 1;
              const removedIdx = targetSkuIndex >= 0 ? targetSkuIndex : cell.skus.length - 1;
              const removedItem = cell.skus.splice(removedIdx, 1)[0];
              if (cell.skus.length === 0) cell.status = 'EMPTY';
              cell.updatedAt = new Date().toISOString();
              currentGrid[cellIndex] = cell;
              ship++;
              logActivity(`Retirado "${removedItem.name}" de ${cell.id}. Motivo: ${cmd.reason || 'S/N'}`, 'success');
              actionLogs.push(`Retirado "${removedItem.name}" de ${cell.id}. (Motivo: ${cmd.reason || 'Padrão'})`);
            }
          } else {
             actionLogs.push(`Falha: Não foi possível localizar o item solicitado para retirada.`);
          }
        }
      } catch(e) { console.error('Erro cmd', e); }
    });

    if (newlyConfigured && !isConfigured) {
      setIsConfigured(true);
      if(!activeSectionId) setActiveSectionId(currentSectors[0]?.id || null);
    }
    
    setSectors(currentSectors);
    setGrid(currentGrid);
    if(selectedCell) {
       const updatedCell = currentGrid.find(c => c.id === selectedCell.id);
       if(updatedCell) setSelectedCell(updatedCell);
    }
    setStats(s => ({ ...s, received: s.received + rec, shipped: s.shipped + ship }));
    
    return actionLogs;
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() && pendingImages.length === 0) return;
    
    const userMessage = { id: Date.now(), role: 'user', content: chatInput, images: [...pendingImages] };
    setChatHistory(prev => [...prev, userMessage]);
    const currentInput = chatInput;
    const currentImages = [...pendingImages];
    
    setChatInput('');
    setPendingImages([]);
    setIsProcessingAI(true);

    try {
      const parts = [
        { text: `Você é uma IA de Sistema de Armazém (WMS MCP). Você deve interpretar o pedido do usuário e retornar EXATAMENTE UM JSON com duas chaves: "reply" (texto Markdown amigável respondendo o usuário) e "commands" (array de objetos de ação, vazio se for só conversa).
        
        Ações suportadas em 'commands':
        1. { "action": "CREATE_SECTOR", "id": "A1", "rows": 4, "cols": 5, "orientation": "horizontal" }
        2. { "action": "AUTO_PUTAWAY", "item": { "name": "...", "sku": "...", "price": "...", "condition": "...", "description": "..." } } (Usa auto-slotting se não informar local)
        3. { "action": "PUTAWAY", "targetId": "A1-1-1", "item": { ... } }
        4. { "action": "PICKING", "targetId": "A1-1-1", "sku": "...", "reason": "..." }
        
        Aja naturalmente na chave "reply" e extraia os dados ricamente (preços, tags, avarias) para gerar os comandos.` }
      ];

      parts.push({ text: `\nInput do usuário: "${currentInput}"` });
      currentImages.forEach((img, i) => {
        parts.push({ text: `\nImagem ${i+1}:` });
        parts.push({ inlineData: { mimeType: img.mimeType, data: img.base64 } });
      });

      const payload = { contents: [{ parts }], generationConfig: { responseMimeType: "application/json" } };
      const result = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const aiResponse = JSON.parse(result.candidates[0].content.parts[0].text);
      
      let actionLogs = [];
      if (aiResponse.commands && Array.isArray(aiResponse.commands)) {
        actionLogs = executeAICommands(aiResponse.commands);
      }
      
      setChatHistory(prev => {
        const newHistory = [...prev, { id: Date.now(), role: 'ai', content: aiResponse.reply }];
        if (actionLogs.length > 0) {
           newHistory.push({ id: Date.now() + 1, role: 'system-action', logs: actionLogs });
        }
        return newHistory;
      });

      if (!isConfigured && aiResponse.commands?.some(c => c.action === 'CREATE_SECTOR')) {
         setIsConfigured(true);
      }

    } catch (err) {
      console.error(err);
      setChatHistory(prev => [...prev, { id: Date.now(), role: 'ai', content: "Desculpe, encontrei um erro ao processar seu comando. Tente novamente." }]);
    } finally {
      setIsProcessingAI(false);
    }
  };

  const processBatchLote = async () => {
    if(batchItems.length === 0) return;
    setIsProcessingBatch(true);
    
    // Add temporary message to chat
    setChatHistory(prev => [...prev, { id: Date.now(), role: 'user', content: `Processar lote com ${batchItems.length} entradas pendentes...` }]);
    
    try {
      const parts = [
        { text: `Você é um WMS Inteligente operando via MCP. Analise o lote de entradas a seguir (texto, imagem, voz). Extraia informações ricamente e gere UMA LISTA DE AÇÕES consolidada. Retorne APENAS um Array JSON puro. 
        Ações suportadas: 
        1. { action: 'CREATE_SECTOR', id: 'A1', rows: 4, cols: 5, orientation: 'horizontal' ou 'vertical' }
        2. { action: 'AUTO_PUTAWAY', item: { name: '...', sku: '...', price: '...', condition: '...', description: '...' } } 
        3. { action: 'PUTAWAY', targetId: 'A1-1-1', item: { ... } } 
        4. { action: 'PICKING', targetId: 'A1-1-1', sku: '...', reason: '...' }` }
      ];

      batchItems.forEach((item, index) => {
        if (item.type === 'text' || item.type === 'voice') parts.push({ text: `\nEntrada ${index + 1} (${item.type}): "${item.content}"` });
        else if (item.type === 'image') {
          parts.push({ text: `\nEntrada ${index + 1} (Imagem):` });
          parts.push({ inlineData: { mimeType: item.mimeType, data: item.base64 } });
        }
      });

      const payload = { contents: [{ parts }], generationConfig: { responseMimeType: "application/json" } };
      const result = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const aiText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      
      let actionLogs = [];
      if (aiText) {
        const commands = JSON.parse(aiText);
        if (Array.isArray(commands)) actionLogs = executeAICommands(commands);
        else if (commands.action) actionLogs = executeAICommands([commands]);
      }
      
      setChatHistory(prev => {
        const newHistory = [...prev, { id: Date.now(), role: 'ai', content: "Análise de lote concluída! Aqui está o resumo das ações realizadas no armazém:" }];
        if (actionLogs.length > 0) newHistory.push({ id: Date.now() + 1, role: 'system-action', logs: actionLogs });
        return newHistory;
      });

      setBatchItems([]);
      setShowBatchModal(false);
      logActivity('Lote multi-modal processado com sucesso.', 'success');
      setActiveTab('CHAT');
    } catch (err) {
      console.error(err);
      logActivity('Erro ao processar lote com a IA.', 'warning');
    } finally {
      setIsProcessingBatch(false);
    }
  };

  const toggleVoice = () => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert('Voz não suportada');
    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = 'pt-BR';
      recognition.interimResults = true;
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (e) => {
        const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
        setChatInput(transcript);
        if (e.results[0].isFinal) setTimeout(() => document.getElementById('btn-send-chat')?.click(), 500);
      };
      recognition.start();
    } catch (err) { setIsListening(false); }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPendingImages(prev => [...prev, { id: Date.now(), mimeType: file.type, base64: reader.result.split(',')[1], preview: reader.result }]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // --- Views Renders ---
  const renderChatView = () => (
    <div className="flex-1 flex flex-col overflow-hidden bg-white relative animate-fade-in">
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar bg-slate-50">
        {chatHistory.map((msg) => {
          if (msg.role === 'system-action') {
            return (
              <div key={msg.id} className="flex justify-center my-4 animate-fade-in">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 w-full sm:max-w-[85%] shadow-sm">
                  <div className="flex items-center gap-2 mb-3 text-emerald-700 font-bold text-xs uppercase tracking-wider">
                    <CheckCircle2 size={16} /> Ações Executadas no Sistema
                  </div>
                  <ul className="space-y-2">
                    {msg.logs.map((log, i) => (
                      <li key={i} className="text-sm text-emerald-800 flex items-start gap-2 font-medium">
                        <div className="mt-1.5 w-1.5 h-1.5 bg-emerald-400 rounded-full shrink-0" />
                        {log}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          }

          return (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              <div className={`max-w-[85%] rounded-3xl p-4 shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'}`}>
                <div className="flex items-center gap-2 mb-2 opacity-70 text-xs font-bold uppercase tracking-wider">
                  {msg.role === 'ai' ? <><Bot size={14}/> IA Nexus</> : <><Search size={14}/> Você</>}
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                {msg.images && msg.images.length > 0 && (
                  <div className="flex gap-2 mt-3 overflow-x-auto">
                    {msg.images.map(img => <img key={img.id} src={img.preview} className="h-24 w-auto rounded-lg border border-white/20 object-cover shadow-sm" alt="anexo" />)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {isProcessingAI && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 text-slate-800 rounded-3xl rounded-bl-sm p-4 flex items-center gap-3 shadow-sm">
               <Loader2 className="animate-spin text-blue-600" size={18} />
               <span className="text-sm text-slate-500 font-medium">Analisando contexto...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {!isConfigured && chatHistory.length < 3 && (
        <div className="bg-slate-50 px-4 pb-4 pt-2 flex flex-wrap gap-2 justify-center border-t border-slate-100">
          <button onClick={() => finishOnboarding([{id: 'A1', rows: 4, cols: 6, orientation: 'horizontal'}, {id: 'B1', rows: 6, cols: 3, orientation: 'vertical'}])} className="bg-white text-slate-700 border border-slate-200 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors shadow-sm">
            <CheckCircle2 size={16} className="text-emerald-500" /> Usar Layout Padrão
          </button>
          <button onClick={() => setShowConfig(true)} className="bg-white text-slate-700 border border-slate-200 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors shadow-sm">
            <SlidersHorizontal size={16} className="text-blue-500" /> Configuração Manual
          </button>
        </div>
      )}
    </div>
  );

  const renderMapView = () => {
    if (!isConfigured) return <div className="flex-1 flex items-center justify-center text-slate-400 italic bg-slate-50">Configure o armazém no chat primeiro.</div>;
    const activeSectorObj = sectors.find(s => s.id === activeSectionId);
    
    return (
      <div className="flex flex-col flex-1 animate-fade-in bg-slate-50 p-4">
        <div className="flex flex-col gap-3 shrink-0 mb-4 bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center px-2 pt-1">
             <div className="flex items-center gap-2"><MapIcon size={18} className="text-blue-600"/> <h2 className="font-bold text-slate-800 text-sm">Visão do Armazém</h2></div>
             <button onClick={() => setIsCompactView(!isCompactView)} className="p-1.5 bg-slate-50 border border-slate-200 text-slate-500 hover:text-blue-600 rounded-lg shadow-sm">
                {isCompactView ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
             </button>
          </div>
          <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-1">
            {sectors.map((sec) => (
              <button key={sec.id} onClick={() => { setActiveSectionId(sec.id); setSelectedCell(null); }} className={`px-4 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 border ${activeSectionId === sec.id ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
                {sec.orientation === 'vertical' ? <GripVertical size={12}/> : <GripHorizontal size={12}/>} {sec.id}
              </button>
            ))}
          </div>
        </div>

        {activeSectorObj && (
          <div className="w-full flex justify-center flex-1 min-h-0 relative">
            <div className={`relative flex items-stretch group transition-all duration-300 w-full`} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEndAction}>
              {sectors.length > 1 && <button onClick={handlePrevSector} disabled={!hasPrevSector} className="hidden sm:flex absolute top-1/2 -translate-y-1/2 -left-4 md:-left-6 z-40 p-2 bg-white shadow-xl rounded-full text-slate-600 hover:text-blue-600 opacity-0 group-hover:opacity-100"><ChevronLeft size={24} /></button>}
              <div className={`bg-white border border-slate-200 rounded-2xl p-4 shadow-sm w-full max-w-full flex flex-col ${isCompactView ? 'overflow-hidden' : 'overflow-auto custom-scrollbar'}`}>
                <div className={`grid ${isCompactView ? 'gap-1 flex-1 min-h-0 w-full h-full' : 'gap-3 min-w-max min-h-max w-full'} ${activeSectorObj.orientation === 'vertical' ? 'grid-flow-col' : 'grid-flow-row'}`} style={{ gridTemplateColumns: activeSectorObj.orientation === 'vertical' ? `repeat(${activeSectorObj.cols}, ${isCompactView ? 'minmax(0, 1fr)' : 'minmax(80px, 1fr)'})` : `repeat(${activeSectorObj.cols}, ${isCompactView ? 'minmax(0, 1fr)' : 'minmax(80px, 1fr)'})`, gridTemplateRows: activeSectorObj.orientation === 'vertical' ? `repeat(${activeSectorObj.rows}, ${isCompactView ? 'minmax(0, 1fr)' : 'minmax(80px, 1fr)'})` : `repeat(${activeSectorObj.rows}, ${isCompactView ? 'minmax(0, 1fr)' : 'minmax(80px, 1fr)'})` }}>
                  {grid.filter(c => c.section === activeSectionId).map(cell => {
                    const isSelected = selectedCell?.id === cell.id;
                    return (
                      <button key={cell.id} onClick={() => setSelectedCell(cell)} className={`relative flex flex-col items-center justify-center transition-all duration-200 w-full h-full ${isCompactView ? 'rounded-md border gap-0.5' : 'rounded-xl border-2 gap-1 p-2'} ${STATUS_MAP[cell.status].bg} ${STATUS_MAP[cell.status].border} ${STATUS_MAP[cell.status].text} ${isSelected ? 'ring-4 ring-blue-500/30 z-10 border-blue-500' : ''} hover:scale-105`}>
                        <span className={`${isCompactView ? 'text-[9px] sm:text-[10px] leading-none' : 'text-xs sm:text-sm'} font-bold opacity-70`}>{cell.row}-{cell.col}</span>
                        {cell.status === 'OCCUPIED' && <Box size={isCompactView ? 16 : 24} strokeWidth={isCompactView ? 2 : 2.5} />}
                        {cell.status === 'BLOCKED' && <AlertTriangle size={isCompactView ? 16 : 24} strokeWidth={isCompactView ? 2 : 2.5} />}
                        {cell.skus.length > 1 && <span className={`absolute ${isCompactView ? '-top-1 -right-1 w-4 h-4 text-[9px]' : '-top-2 -right-2 w-6 h-6 text-xs'} bg-blue-600 text-white font-bold flex items-center justify-center rounded-full shadow-sm`}>{cell.skus.length}</span>}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 flex flex-wrap gap-4 justify-center text-[10px] font-semibold shrink-0">
                  {Object.entries(STATUS_MAP).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-1"><span className={`w-2.5 h-2.5 rounded-full border ${val.bg} ${val.border}`} /><span className="text-slate-500 uppercase">{val.label}</span></div>
                  ))}
                </div>
              </div>
              {sectors.length > 1 && <button onClick={handleNextSector} disabled={!hasNextSector} className="hidden sm:flex absolute top-1/2 -translate-y-1/2 -right-4 md:-right-6 z-40 p-2 bg-white shadow-xl rounded-full text-slate-600 hover:text-blue-600 opacity-0 group-hover:opacity-100"><ChevronRight size={24} /></button>}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderStockView = () => {
    const allSkus = grid.flatMap(cell => cell.skus.map(item => ({ ...item, cellId: cell.id, section: cell.section })));
    return (
      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-4 animate-fade-in custom-scrollbar space-y-3 bg-slate-50">
         
         {/* Cabeçalho da Visão de Estoque */}
         <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-4">
           <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
             <Package size={18} className="text-blue-600"/> Catálogo do Armazém
           </h2>
           <button onClick={() => { setSelectedCell(null); setShowAddSku(true); }} className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors">
             <Plus size={14} /> Novo Produto
           </button>
         </div>

         {allSkus.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm mt-4 flex flex-col items-center justify-center gap-4">
               <Package size={48} className="text-slate-300" />
               <p className="text-slate-500 font-medium">Estoque totalmente vazio.</p>
               <button onClick={() => { setSelectedCell(null); setShowAddSku(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors">
                  <Plus size={18} /> Adicionar Produto
               </button>
            </div>
         ) : (
            allSkus.map((item, i) => (
              <div key={i} onClick={() => setShowSkuDetails(item)} className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center shadow-sm hover:border-blue-300 hover:shadow-md cursor-pointer transition-all group">
                 <div className="flex items-center gap-4">
                    <div className="bg-blue-50 text-blue-600 p-3 rounded-xl"><Package size={22}/></div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm mb-0.5 group-hover:text-blue-600 transition-colors">{item.name}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded">{item.sku}</span>
                        {item.price && <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-0.5"><DollarSign size={10}/> {item.price}</span>}
                      </div>
                    </div>
                 </div>
                 <div className="text-right flex items-center gap-4">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">Local</span>
                      <span className="font-black text-slate-700 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg text-xs mt-1 inline-block">{item.cellId}</span>
                    </div>
                    <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                 </div>
              </div>
            ))
         )}
      </div>
    );
  }

  const renderLogsView = () => (
    <div className="flex-1 overflow-y-auto px-4 pb-4 pt-4 animate-fade-in custom-scrollbar bg-slate-50">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {activities.length === 0 && <p className="text-center text-xs text-slate-400 py-8">Sem atividades registradas.</p>}
        {activities.map((act, i) => (
          <div key={act.id} className={`p-4 text-sm flex gap-4 hover:bg-slate-50 border-b border-slate-100 last:border-0 ${i === 0 ? 'bg-blue-50/30' : ''}`}>
            <div className={`mt-1 shrink-0 w-3 h-3 rounded-full ${act.type === 'success' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : act.type === 'warning' ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]'}`} />
            <div className="flex-1">
              <p className="font-semibold text-slate-800 leading-snug mb-1.5">{act.msg}</p>
              <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><Clock size={12}/> {act.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // -------------------------------------------------------------
  // RENDER: MAIN APP SHELL
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col overflow-hidden relative">
      
      {/* HEADER MINIMALISTA */}
      <header className="h-14 bg-white flex items-center justify-between px-4 sm:px-6 shrink-0 z-10 border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <Layers className="text-blue-600" size={20} />
          <h1 className="text-lg font-black tracking-wide text-slate-800">NEXUS<span className="font-light text-slate-400">WMS</span></h1>
        </div>
        <div className="flex items-center gap-2">
          {stats.received > 0 && <span className="text-[10px] font-bold text-slate-400 uppercase hidden sm:block mr-2">In: {stats.received} | Out: {stats.shipped}</span>}
          <div className="flex items-center gap-1.5 bg-emerald-50 rounded-full px-2.5 py-1 border border-emerald-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Live AI</span>
          </div>
        </div>
      </header>

      {/* DYNAMIC CONTENT AREA */}
      <div className="flex-1 flex flex-col min-h-0 relative">
         {activeTab === 'CHAT' && renderChatView()}
         {activeTab === 'MAPA' && renderMapView()}
         {activeTab === 'ESTOQUE' && renderStockView()}
         {activeTab === 'AVISOS' && renderLogsView()}
      </div>

      {/* DOCK UNIFICADO (APP TAGS + CHAT INPUT) - Fixo no bottom */}
      <div className="bg-white border-t border-slate-200 shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-[60] pb-safe relative">
        
        {/* Dropdown Menu - Elevado no z-index e posicionado para cima */}
        {showDropdown && (
          <div className="absolute bottom-[100%] left-4 mb-2 w-56 bg-white border border-slate-200 shadow-2xl rounded-2xl z-[70] p-2 animate-fade-in origin-bottom-left">
            <button onClick={() => {setShowConfig(true); setShowDropdown(false);}} className="w-full flex items-center gap-3 px-3 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors text-left"><Settings size={18}/> Configurar Layout</button>
            <div className="h-px bg-slate-100 my-1 mx-2"></div>
            <button onClick={handleExportJSON} className="w-full flex items-center gap-3 px-3 py-3 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-xl transition-colors text-left"><FileJson size={18}/> Exportar em JSON</button>
            <button onClick={handleExportCSV} className="w-full flex items-center gap-3 px-3 py-3 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-xl transition-colors text-left"><FileSpreadsheet size={18}/> Exportar em CSV</button>
          </div>
        )}

        {/* APP TAGS (Navigation) */}
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar px-3 pt-3 pb-2">
          <button onClick={() => setShowDropdown(!showDropdown)} className="shrink-0 bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-md hover:bg-slate-700 transition-colors">
            <Menu size={16} /> Opções
          </button>

          <button onClick={() => setActiveTab('CHAT')} className={`shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${activeTab === 'CHAT' ? 'bg-blue-100 border-blue-400 text-blue-800 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
            <div className="flex items-center gap-2"><Bot size={16}/> Assistente IA</div>
          </button>
          
          {isConfigured && (
            <>
              <button onClick={() => setActiveTab('MAPA')} className={`shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${activeTab === 'MAPA' ? 'bg-blue-100 border-blue-400 text-blue-800 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                <div className="flex items-center gap-2"><MapIcon size={16}/> Mapa</div>
              </button>
              <button onClick={() => setActiveTab('ESTOQUE')} className={`shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${activeTab === 'ESTOQUE' ? 'bg-blue-100 border-blue-400 text-blue-800 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                <div className="flex items-center gap-2"><Package size={16}/> Produtos</div>
              </button>
              <button onClick={() => setActiveTab('AVISOS')} className={`shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${activeTab === 'AVISOS' ? 'bg-blue-100 border-blue-400 text-blue-800 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                <div className="flex items-center gap-2">
                   <Bell size={16}/> Avisos
                   {unreadCount > 0 && <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
                </div>
              </button>
            </>
          )}
        </div>

        {/* CHAT INPUT AREA */}
        <div className="px-3 pb-3">
          {pendingImages.length > 0 && (
            <div className="flex gap-2 mb-3 pb-2 overflow-x-auto">
               {pendingImages.map(img => (
                  <div key={img.id} className="relative group shrink-0">
                    <img src={img.preview} className="h-14 w-14 object-cover rounded-xl border-2 border-blue-500 shadow-sm" alt="upload" />
                    <button onClick={() => setPendingImages(p => p.filter(i => i.id !== img.id))} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-sm"><X size={10}/></button>
                  </div>
               ))}
            </div>
          )}

          <div className="flex items-end gap-2 bg-slate-50 p-1.5 sm:p-2 rounded-2xl border border-slate-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 shadow-inner transition-all">
            <textarea 
              rows="1"
              value={chatInput}
              onChange={(e) => {
                setChatInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
              placeholder={isListening ? "Ouvindo..." : "Escreva um comando ou converse..."}
              className="flex-1 max-h-32 bg-transparent resize-none py-2.5 pl-3 pr-2 text-sm text-slate-800 focus:outline-none custom-scrollbar"
              style={{ minHeight: '40px' }}
              onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
            />
            
            <div className="flex items-center gap-1 shrink-0 pb-0.5 pr-1">
              <button onClick={toggleVoice} className={`p-2 rounded-xl transition-colors ${isListening ? 'bg-rose-100 text-rose-600 animate-pulse' : 'text-slate-400 hover:bg-slate-200 hover:text-blue-600'}`} title="Ditado de Voz">
                <Mic size={20} />
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-blue-600 rounded-xl transition-colors" title="Anexar Imagem / NF">
                <ImageIcon size={20} />
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
              </button>
              
              <button onClick={() => setShowBatchModal(true)} className="p-2 text-slate-400 hover:bg-purple-100 hover:text-purple-600 rounded-xl transition-colors hidden sm:block" title="Processar Lote (Wand)">
                <Wand2 size={20} />
              </button>
              
              <button 
                id="btn-send-chat"
                onClick={handleSendMessage}
                disabled={(!chatInput.trim() && pendingImages.length === 0) || isProcessingAI}
                className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl font-bold transition-all shadow-sm ml-1"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- GAVETAS LATERAIS (SIDE DRAWERS) --- */}
      
      {/* OVERLAY GAVETA 1 (Célula) */}
      {selectedCell && activeTab === 'MAPA' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90] animate-fade-in" onClick={() => setSelectedCell(null)} />
      )}

      {/* GAVETA LATERAL 1 (Detalhes da Posição no Mapa) */}
      <div className={`fixed top-0 right-0 bottom-0 w-full sm:w-[480px] bg-slate-50 border-l border-slate-200 transition-all duration-300 ease-in-out z-[91] flex flex-col sm:rounded-l-3xl ${selectedCell && activeTab === 'MAPA' ? 'translate-x-0 shadow-[-20px_0_50px_rgba(0,0,0,0.2)]' : 'translate-x-full shadow-none'}`}>
        {selectedCell && (
          <div className="flex flex-col h-full">
            
            <div className="p-6 bg-white border-b border-slate-200 shrink-0 sm:rounded-tl-3xl flex justify-between items-start z-10 shadow-sm">
              <div className="flex gap-4 items-center">
                <div className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center ${STATUS_MAP[selectedCell.status].bg} ${STATUS_MAP[selectedCell.status].text} ${STATUS_MAP[selectedCell.status].border}`}><Search size={24} /></div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800">{selectedCell.id}</h3>
                  <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">Status: {STATUS_MAP[selectedCell.status].label}</p>
                </div>
              </div>
              <button onClick={() => setSelectedCell(null)} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200 transition-colors"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                <div className="flex justify-between mb-4 items-center">
                   <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Itens na Célula ({selectedCell.skus.length})</h4>
                   <button onClick={() => setShowAddSku(true)} className="text-blue-600 text-xs font-bold flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"><Plus size={14}/> Add Manual</button>
                </div>
                <div className="space-y-3">
                  {selectedCell.skus.map((item, index) => (
                    <div key={index} onClick={() => setShowSkuDetails({ ...item, cellId: selectedCell.id })} className="cursor-pointer flex justify-between items-center bg-white p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group">
                       <span className="font-bold text-slate-700 flex items-center gap-3"><div className="bg-blue-50 text-blue-600 p-2 rounded-lg"><Package size={18}/></div> <span className="line-clamp-1">{item.name || item.sku}</span></span>
                       <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-600 shrink-0" />
                    </div>
                  ))}
                  {selectedCell.skus.length === 0 && <div className="text-center text-slate-400 text-xs py-8 border-2 border-dashed border-slate-200 rounded-2xl">Esta posição está vazia.</div>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* OVERLAY GAVETA 2 (Produto) */}
      {showSkuDetails && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] animate-fade-in" onClick={() => setShowSkuDetails(null)} />
      )}

      {/* GAVETA LATERAL 2 (Detalhes do Produto - UI Rica) */}
      <div className={`fixed top-0 right-0 bottom-0 w-[90%] sm:w-[400px] bg-slate-50 border-l border-slate-200 transition-all duration-300 ease-in-out z-[101] flex flex-col sm:rounded-l-3xl ${showSkuDetails ? 'translate-x-0 shadow-[-30px_0_60px_rgba(0,0,0,0.3)]' : 'translate-x-full shadow-none'}`}>
        {showSkuDetails && (
          <div className="flex flex-col h-full">
            
            <div className="bg-blue-600 p-6 sm:p-8 shrink-0 relative sm:rounded-tl-3xl shadow-md z-10">
              <button onClick={() => setShowSkuDetails(null)} className="absolute top-4 right-4 text-blue-200 hover:text-white bg-white/10 p-1.5 rounded-full backdrop-blur-sm transition-colors"><X size={18}/></button>
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-white/20">
                <Package size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-black text-white leading-tight mb-2 pr-8">{showSkuDetails.name}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="font-mono bg-blue-800 text-blue-100 text-xs px-2.5 py-1.5 rounded-lg font-bold shadow-inner">{showSkuDetails.sku}</span>
                {showSkuDetails.cellId && <span className="text-blue-200 text-xs font-bold border border-blue-400/50 px-2.5 py-1.5 rounded-lg bg-blue-500/30">Loc: {showSkuDetails.cellId}</span>}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
              {showSkuDetails.price && (
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-emerald-200 text-emerald-700 shadow-sm relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-50 rounded-full blur-xl opacity-80"></div>
                  <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"><DollarSign size={16}/> Preço</span>
                  <span className="text-2xl font-black relative z-10">{showSkuDetails.price}</span>
                </div>
              )}

              {showSkuDetails.condition && (
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 text-slate-700 shadow-sm">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5"><Tag size={16}/> Condição</span>
                  <span className="text-sm font-bold bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">{showSkuDetails.condition}</span>
                </div>
              )}

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5"><Info size={14}/> Detalhes Extras</p>
                <p className="text-sm text-slate-700 leading-relaxed font-medium">{showSkuDetails.description || showSkuDetails.details || 'Nenhuma informação adicional fornecida para este item.'}</p>
              </div>

              <div className="pt-4">
                <button onClick={() => {
                    setGrid(prev => {
                       const next = [...prev];
                       const cId = showSkuDetails.cellId || selectedCell?.id;
                       if(!cId) return next;
                       const idx = next.findIndex(c => c.id === cId);
                       if(idx === -1) return next;
                       const cell = { ...next[idx] };
                       cell.skus = cell.skus.filter(s => s.sku !== showSkuDetails.sku);
                       if(cell.skus.length === 0) cell.status = 'EMPTY';
                       next[idx] = cell;
                       if(selectedCell?.id === cell.id) setSelectedCell(cell);
                       return next;
                    });
                    logActivity(`Baixa efetuada: ${showSkuDetails.name}`, 'success');
                    setShowSkuDetails(null);
                    setStats(s => ({ ...s, shipped: s.shipped + 1 }));
                }} className="w-full text-rose-600 bg-white hover:bg-rose-50 py-4 rounded-2xl font-bold flex justify-center items-center gap-2 transition-colors border border-rose-200 shadow-sm">
                  <Trash2 size={18} /> Efetuar Baixa do Item
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL MULTIMODAL DA IA (PROCESSAMENTO EM LOTE) */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 bg-purple-600 flex justify-between items-center">
              <h3 className="font-bold text-white flex items-center gap-2"><Wand2 size={20} /> Entradas em Lote (IA)</h3>
              <button onClick={() => setShowBatchModal(false)} className="text-purple-200 hover:text-white transition-colors"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 bg-slate-50 space-y-3">
              {batchItems.length === 0 && (
                 <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center space-y-4 py-8">
                   <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center"><Layers size={32} className="text-slate-300" /></div>
                   <p className="text-sm">Nenhuma entrada acumulada.<br/>Grave voz, adicione fotos ou texto e processe tudo de uma vez.</p>
                 </div>
              )}
              {batchItems.map((item, idx) => (
                <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-3 flex gap-3 shadow-sm relative group">
                  <button onClick={() => setBatchItems(prev => prev.filter(i => i.id !== item.id))} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button>
                  <div className="bg-purple-50 p-2 rounded-lg text-purple-600 h-fit">{item.type === 'voice' ? <Mic size={20}/> : item.type === 'image' ? <ImageIcon size={20}/> : <Type size={20}/>}</div>
                  <div className="flex-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Entrada #{idx + 1}</span>
                    {item.type === 'image' ? <img src={item.preview} className="h-16 w-auto rounded border border-slate-200 object-cover" alt="upload" /> : <p className="text-sm text-slate-700 italic">"{item.content}"</p>}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-white border-t border-slate-100">
              <div className="flex gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 focus-within:border-purple-500">
                <input type="text" value={tempText} onChange={(e) => setTempText(e.target.value)} placeholder="Digitar entrada..." className="flex-1 bg-transparent px-3 text-sm focus:outline-none" onKeyDown={(e) => { if (e.key === 'Enter' && tempText.trim()) { setBatchItems(p => [...p, { id: Date.now(), type: 'text', content: tempText }]); setTempText(''); } }} />
                <button onClick={() => { if(tempText.trim()) { setBatchItems(p => [...p, { id: Date.now(), type: 'text', content: tempText }]); setTempText(''); } }} className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700"><Plus size={18} /></button>
              </div>
              <button onClick={processBatchLote} disabled={batchItems.length === 0 || isProcessingBatch} className="w-full mt-4 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white py-3.5 rounded-xl font-bold flex justify-center gap-2 transition-all">
                {isProcessingBatch ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />} Processar Lote com IA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIGURAÇÃO MANUAL DE SETORES */}
      {showConfig && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[80] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
               <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><Settings size={20} className="text-slate-500" /> Configurar Layout</h3>
              <button onClick={() => {setShowConfig(false); setEditingSectorId(null);}} className="p-1.5 bg-slate-200 rounded-full text-slate-500 hover:bg-slate-300"><X size={18} /></button>
            </div>
            
            <div className="p-5 flex-1 overflow-y-auto custom-scrollbar">
              <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl mb-6 space-y-4">
                <h4 className="text-xs font-black text-blue-800 uppercase tracking-wider flex items-center gap-1"><Plus size={14}/> {editingSectorId ? 'Editar Setor' : 'Novo Setor'}</h4>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">ID do Setor</label>
                  <input type="text" value={newSector.name} disabled={!!editingSectorId} onChange={(e) => setNewSector({ ...newSector, name: e.target.value.toUpperCase() })} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-800 font-bold uppercase outline-none focus:border-blue-500" maxLength={4} />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1"><label className="block text-xs font-bold text-slate-600 mb-1.5">Linhas</label><input type="number" min="1" max="20" value={newSector.rows} onChange={(e) => setNewSector({ ...newSector, rows: e.target.value })} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-800 font-bold outline-none focus:border-blue-500" /></div>
                  <div className="flex-1"><label className="block text-xs font-bold text-slate-600 mb-1.5">Colunas</label><input type="number" min="1" max="20" value={newSector.cols} onChange={(e) => setNewSector({ ...newSector, cols: e.target.value })} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-800 font-bold outline-none focus:border-blue-500" /></div>
                </div>

                <label className="block text-xs font-bold text-slate-600 mb-1 mt-2">Orientação</label>
                <div className="flex gap-2">
                  <button onClick={() => setNewSector({...newSector, orientation: 'horizontal'})} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 font-bold text-sm transition-colors ${newSector.orientation === 'horizontal' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-500'}`}><GripHorizontal size={16} /> Horiz</button>
                  <button onClick={() => setNewSector({...newSector, orientation: 'vertical'})} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 font-bold text-sm transition-colors ${newSector.orientation === 'vertical' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-500'}`}><GripVertical size={16} /> Vert</button>
                </div>

                <div className="flex gap-2 mt-2 pt-2">
                  {editingSectorId && <button onClick={() => setEditingSectorId(null)} className="flex-1 bg-white border border-slate-300 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-50">Cancelar</button>}
                  <button onClick={handleSaveSectorConfig} disabled={!newSector.name.trim()} className="flex-1 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                    {editingSectorId ? <Save size={16} /> : <Plus size={16} />}
                    {editingSectorId ? 'Salvar' : 'Adicionar'}
                  </button>
                </div>
              </div>

              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Setores Ativos ({sectors.length})</h4>
              <div className="space-y-2">
                {sectors.length === 0 && <p className="text-sm text-slate-400 italic">Vazio.</p>}
                {sectors.map(sec => (
                  <div key={sec.id} className={`flex justify-between items-center bg-white border ${editingSectorId === sec.id ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md' : 'border-slate-200'} p-3 rounded-2xl shadow-sm transition-all`}>
                    <div>
                      <span className="font-black text-slate-800 block text-lg">Setor {sec.id}</span>
                      <span className="text-xs text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded uppercase mt-1 inline-block">{sec.rows}x{sec.cols} • {sec.orientation}</span>
                    </div>
                    <div className="flex gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
                      <button onClick={() => { setEditingSectorId(sec.id); setNewSector({ name: sec.id, rows: sec.rows, cols: sec.cols, orientation: sec.orientation || 'horizontal' }); }} className="text-slate-400 hover:text-blue-600 bg-white p-2 rounded-lg shadow-sm"><Edit size={16} /></button>
                      <button onClick={() => {
                        const newSectors = sectors.filter(s => s.id !== sec.id);
                        setSectors(newSectors); setGrid(prev => prev.filter(c => c.section !== sec.id));
                        if (activeSectionId === sec.id) setActiveSectionId(newSectors[0]?.id || null);
                      }} className="text-slate-400 hover:text-rose-600 bg-white p-2 rounded-lg shadow-sm"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ADICIONAR ITEM MANUALMENTE */}
      {showAddSku && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-slate-800 text-xl">Adicionar Produto</h3>
              <button onClick={() => setShowAddSku(false)} className="text-slate-400 bg-slate-100 p-2 rounded-full hover:bg-slate-200"><X size={18}/></button>
            </div>
            
            <div className="space-y-4">
              <input type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} placeholder="Nome do Produto" className="w-full border border-slate-200 p-3.5 rounded-xl bg-slate-50 focus:bg-white focus:border-blue-500 outline-none" />
              <div className="flex gap-3">
                 <input type="text" value={newProduct.sku} onChange={e => setNewProduct({...newProduct, sku: e.target.value})} placeholder="SKU (Opcional)" className="w-full border border-slate-200 p-3.5 rounded-xl bg-slate-50 focus:bg-white focus:border-blue-500 outline-none" />
                 <input type="text" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} placeholder="Preço (Opc.)" className="w-full border border-slate-200 p-3.5 rounded-xl bg-slate-50 focus:bg-white focus:border-blue-500 outline-none" />
              </div>
              <input type="text" value={newProduct.condition} onChange={e => setNewProduct({...newProduct, condition: e.target.value})} placeholder="Condição (Ex: A Vista, Usado...)" className="w-full border border-slate-200 p-3.5 rounded-xl bg-slate-50 focus:bg-white focus:border-blue-500 outline-none" />
              <textarea value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} placeholder="Detalhes adicionais..." className="w-full border border-slate-200 p-3.5 rounded-xl h-24 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none resize-none"></textarea>

              {!selectedCell && (
                <select
                  value={newProduct.targetCell || ''}
                  onChange={(e) => setNewProduct({ ...newProduct, targetCell: e.target.value })}
                  className="w-full border border-slate-200 p-3.5 rounded-xl bg-slate-50 focus:bg-white focus:border-blue-500 outline-none"
                >
                  <option value="">Selecione o local de destino...</option>
                  {sectors.map(sec => (
                     <optgroup key={sec.id} label={`Setor ${sec.id}`}>
                       {grid.filter(c => c.section === sec.id).map(c => (
                          <option key={c.id} value={c.id}>{c.id} ({STATUS_MAP[c.status].label})</option>
                       ))}
                     </optgroup>
                  ))}
                </select>
              )}

              <button onClick={() => {
                  if(!newProduct.name) return;
                  const finalTargetId = selectedCell ? selectedCell.id : newProduct.targetCell;
                  if (!finalTargetId) {
                      logActivity('Nenhum local selecionado para salvar o produto.', 'warning');
                      return;
                  }

                  setGrid(prev => {
                     const next = [...prev];
                     const targetIdx = next.findIndex(c => c.id === finalTargetId);

                     if (targetIdx !== -1) {
                         const cell = { ...next[targetIdx] };
                         cell.skus.push({ name: newProduct.name, sku: newProduct.sku || `SKU-${Date.now().toString().slice(-4)}`, description: newProduct.description, price: newProduct.price, condition: newProduct.condition });
                         cell.status = 'OCCUPIED';
                         next[targetIdx] = cell;
                         if (selectedCell && selectedCell.id === cell.id) setSelectedCell(cell);
                         logActivity(`Entrada manual: ${newProduct.name} em ${cell.id}`, 'success');
                     } else {
                         logActivity(`Local de destino não encontrado.`, 'warning');
                     }
                     return next;
                  });
                  setShowAddSku(false);
                  setNewProduct({name: '', sku: '', description: '', price: '', condition: '', targetCell: ''});
              }} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold transition-colors shadow-md">
                Salvar no Local
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS Global */}
      <style dangerouslySetInnerHTML={{__html: `
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 0px); }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; border: 2px solid transparent; background-clip: content-box; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}} />
    </div>
  );
}