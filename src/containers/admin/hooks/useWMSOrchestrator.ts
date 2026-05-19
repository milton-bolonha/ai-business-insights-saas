import { useState, useCallback } from "react";
import { useToast } from "@/lib/state/toast-context";
import { useAuthStore, useUIStore } from "@/lib/stores";

export interface WMSCommand {
  action: 'CREATE_SECTOR' | 'DELETE_SECTOR' | 'PUTAWAY' | 'AUTO_PUTAWAY' | 'PICKING' | 'CHANGE_COLOR' | 'NAVIGATE' | 'CREATE_CLIENT' | 'CREATE_MENTORING_TASK' | 'SCHEDULE_MENTORING_SESSION';
  id?: string;
  targetId?: string;
  rows?: number;
  cols?: number;
  orientation?: 'horizontal' | 'vertical';
  type?: 'Wall' | 'Showcase' | 'Rack';
  layoutMode?: 'boxed' | 'full';
  item?: {
    id?: string;
    name?: string;
    sku?: string;
    price?: string;
    condition?: string;
    description?: string;
    category?: string;
    title?: string;
    status?: string;
    dueDate?: string;
    startAt?: string;
    meetingUrl?: string;
  };
  reason?: string;
  sku?: string;
  color?: string;
  destination?: string;
  name?: string;
}

export interface Spot {
  id: string;
  code: string;
  row: number;
  col: number;
  status: "available" | "occupied" | "reserved" | "blocked";
  products: any[];
  updatedAt?: string;
}

export interface ActionLog {
  id: string;
  msg: string;
  type: 'success' | 'warning' | 'info';
  time: string;
}

export function useWMSOrchestrator(
  sections: any[], 
  onUpdateSections: (newSections: any[]) => void,
  catalogProducts: any[] = []
) {
  const { push } = useToast();
  const auth = useAuthStore();
   const [isProcessingAI, setIsProcessingAI] = useState(false);
   const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
   const [detectedItems, setDetectedItems] = useState<any[]>([]);

  const logActivity = useCallback((msg: string, type: 'success' | 'warning' | 'info' = 'info') => {
    const newLog: ActionLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      msg,
      type,
      time: new Date().toLocaleTimeString()
    };
    setActionLogs(prev => [newLog, ...prev].slice(0, 50));
    return newLog;
  }, []);

  const generateSpots = (sectorId: string, rows: number, cols: number) => {
    const spots: Spot[] = [];
    const sectorPrefix = sectorId.replace('SEC-', '').charAt(0);
    for (let r = 1; r <= rows; r++) {
      for (let c = 1; c <= cols; c++) {
        spots.push({
          id: `${sectorId}-${r}-${c}`,
          code: `${sectorPrefix}${r}${c}`,
          row: r,
          col: c,
          status: "available",
          products: [],
          updatedAt: new Date().toISOString()
        });
      }
    }
    return spots;
  };

  const executeCommands = useCallback((commands: WMSCommand[]) => {
    let currentSections = [...sections];
    const logs: string[] = [];

    commands.forEach(cmd => {
      try {
        if (cmd.action === 'CREATE_SECTOR') {
          const id = cmd.id?.toUpperCase() || `S${currentSections.length + 1}`;
          if (!currentSections.find(s => s.id === id)) {
            const newSec = {
              id,
              type: cmd.type || "Showcase",
              layoutMode: cmd.layoutMode || "boxed",
              label: `Setor ${id}`,
              rows: cmd.rows || 4,
              cols: cmd.cols || 6,
              orientation: cmd.orientation || "horizontal",
              spots: generateSpots(id, cmd.rows || 4, cmd.cols || 6)
            };
            currentSections.push(newSec);
            logActivity(`Setor ${id} criado com sucesso.`, 'success');
            logs.push(`Setor ${id} criado (${newSec.rows}x${newSec.cols}).`);
          }
        } 
        else if (cmd.action === 'DELETE_SECTOR') {
          const id = cmd.id?.toUpperCase();
          currentSections = currentSections.filter(s => s.id !== id);
          logActivity(`Setor ${id} removido.`, 'warning');
          logs.push(`Setor ${id} foi removido do mapa.`);
        }
        else if (cmd.action === 'AUTO_PUTAWAY') {
          // Find first spot with space (max 5 products for now)
          let found = false;
          for (let sec of currentSections) {
            for (let spot of sec.spots) {
              if (spot.products.length < 5) {
                const item = cmd.item || {};
                spot.products.push({
                  id: item.id || `prod_${Date.now()}`,
                  name: item.name || "Produto sem nome",
                  quantity: 1,
                  sku: item.sku,
                  price: item.price,
                  category: item.category
                });
                logActivity(`Item "${item.name}" alocado automaticamente em ${spot.code}.`, 'success');
                logs.push(`Alocado "${item.name}" em ${spot.code}.`);
                found = true;
                break;
              }
            }
            if (found) break;
          }
          if (!found) logs.push(`Erro: Sem espaço disponível para alocação automática.`);
        }
        else if (cmd.action === 'PUTAWAY') {
          const targetId = cmd.targetId?.toUpperCase();
          let found = false;
          currentSections = currentSections.map(sec => ({
            ...sec,
            spots: sec.spots.map((spot: Spot) => {
              if (spot.code === targetId || spot.id === targetId) {
                const item = cmd.item || {};
                found = true;
                return {
                  ...spot,
                  products: [...spot.products, {
                    id: item.id || `prod_${Date.now()}`,
                    name: item.name || "Produto",
                    quantity: 1,
                    sku: item.sku,
                    price: item.price
                  }]
                };
              }
              return spot;
            })
          }));
          if (found) {
            logActivity(`Item guardado em ${targetId}.`, 'success');
            logs.push(`Item guardado na posição ${targetId}.`);
          } else {
            logs.push(`Erro: Posição ${targetId} não encontrada.`);
          }
        }
        else if (cmd.action === 'PICKING') {
          const targetId = cmd.targetId?.toUpperCase();
          const sku = cmd.sku?.toLowerCase();
          let found = false;

          currentSections = currentSections.map(sec => ({
            ...sec,
            spots: sec.spots.map((spot: Spot) => {
              if (targetId && (spot.code === targetId || spot.id === targetId)) {
                if (spot.products.length > 0) {
                  const removed = spot.products.pop();
                  found = true;
                  logActivity(`Item "${removed.name}" retirado de ${spot.code}.`, 'success');
                  logs.push(`Retirado "${removed.name}" de ${spot.code}.`);
                }
              } else if (sku) {
                const idx = spot.products.findIndex((p: any) => p.sku?.toLowerCase() === sku || p.name?.toLowerCase().includes(sku));
                if (idx !== -1) {
                  const [removed] = spot.products.splice(idx, 1);
                  found = true;
                  logActivity(`Item "${removed.name}" retirado de ${spot.code}.`, 'success');
                  logs.push(`Retirado "${removed.name}" de ${spot.code}.`);
                }
              }
              return spot;
            })
          }));
          if (!found) logs.push(`Erro: Item ou posição não localizados para Picking.`);
        }
        else if (cmd.action === 'CHANGE_COLOR') {
          const { setBaseColor } = useUIStore.getState();
          if (cmd.color) {
            setBaseColor(cmd.color);
            logActivity(`Cor da interface alterada para ${cmd.color}.`, 'info');
            logs.push(`Alterou a cor para ${cmd.color}`);
          }
        }
        else if (cmd.action === 'NAVIGATE') {
          if (cmd.destination) {
             const dest = cmd.destination.toLowerCase();
             window.dispatchEvent(new CustomEvent('ai-navigate', { detail: { destination: dest } }));
             logActivity(`Navegando para ${dest}.`, 'info');
             logs.push(`Abriu a tela/painel ${dest}`);
          }
        }
        else if (cmd.action === 'CREATE_CLIENT') {
          if (cmd.name) {
             window.dispatchEvent(new CustomEvent('ai-create-client', { detail: { name: cmd.name } }));
             logActivity(`Cliente ${cmd.name} registrado.`, 'success');
             logs.push(`Registrou cliente: ${cmd.name}`);
          }
        }
        else if (cmd.action === 'CREATE_MENTORING_TASK') {
          if (cmd.item?.title) {
            window.dispatchEvent(new CustomEvent('ai-create-task', { detail: cmd.item }));
            logActivity(`Tarefa "${cmd.item.title}" agendada para o aluno.`, 'success');
            logs.push(`Tarefa criada: ${cmd.item.title}`);
          }
        }
        else if (cmd.action === 'SCHEDULE_MENTORING_SESSION') {
          if (cmd.item?.title && cmd.item?.startAt) {
            window.dispatchEvent(new CustomEvent('ai-schedule-session', { detail: cmd.item }));
            logActivity(`Sessão "${cmd.item.title}" marcada para ${cmd.item.startAt}.`, 'success');
            logs.push(`Sessão agendada: ${cmd.item.title}`);
          }
        }
      } catch (e) {
        console.error("Error executing WMS command:", e);
        logs.push(`Erro ao processar comando: ${cmd.action}`);
      }
    });

    onUpdateSections(currentSections);
    return logs;
  }, [sections, onUpdateSections, logActivity]);

  const callGeminiAI = async (input: string, images: any[] = []) => {
    setIsProcessingAI(true);
    try {
      // Proactive credit check
      if (!auth.canPerformAction("wmsAiAssistant")) {
        push({ 
          title: "Limite de Créditos", 
          description: "Você não possui créditos suficientes para usar o Assistente AI.", 
          variant: "destructive" 
        });
        return { reply: "Desculpe, você atingiu seu limite de créditos.", logs: [] };
      }
      // Prompt construction from prototype
      const prompt = `Você é uma IA de Gestão Multidisciplinar (WMS, ERP e agora Mentoria I/O). Você deve interpretar o pedido do usuário e retornar EXATAMENTE UM JSON com duas chaves: "reply" (texto Markdown amigável) e "commands" (array de objetos de ação).
        
      Ações suportadas em 'commands':
      1. { "action": "CREATE_SECTOR", "id": "A1", "rows": 4, "cols": 5, "type": "Showcase" }
      2. { "action": "AUTO_PUTAWAY", "item": { "name": "...", "sku": "...", "price": "..." } }
      3. { "action": "CREATE_PRODUCT", "item": { "name": "...", "price": 100, "category": "..." } }
      4. { "action": "CHANGE_COLOR", "color": "#HEX" } (Use tons pastel claros!)
      5. { "action": "CREATE_CLIENT", "name": "Nome" }
      6. { "action": "NAVIGATE", "destination": "DESTINO" } (Destinos: 'chat', 'layout', 'store', 'clients', 'members', 'mentoring_tasks', 'mentoring_schedule')
      
      NOVAS AÇÕES DE MENTORIA:
      7. { "action": "CREATE_MENTORING_TASK", "item": { "title": "Título", "description": "...", "status": "todo", "dueDate": "YYYY-MM-DD" } }
      8. { "action": "SCHEDULE_MENTORING_SESSION", "item": { "title": "Título", "description": "...", "startAt": "YYYY-MM-DDTHH:mm:ss", "meetingUrl": "..." } }
      
      Aja naturalmente na chave "reply". Se o usuário pedir para marcar uma mentoria ou criar uma tarefa de estudo, use as ações de Mentoria.`;

      // Simulating API call for now or using fetch if key is known
      // Note: In a real app, this would call a serverless function or proxy
      const response = await fetch('/api/ai/wms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, input, images })
      });

      if (!response.ok) throw new Error("AI Service Unavailable");
      
      const data = await response.json();
      const commands = data.commands || [];
      const logs = executeCommands(commands);
      
      // Consume credits locally for UI sync
      auth.consumeUsage("wmsAiAssistant");

      return {
        reply: data.reply,
        commands,
        logs
      };
    } catch (error) {
      console.error("AI Error:", error);
      push({ title: "AI Error", description: "Failed to process command.", variant: "destructive" });
      return { reply: "Desculpe, tive um problema ao processar isso.", logs: [] };
    } finally {
      setIsProcessingAI(false);
    }
  };

  return {
    isProcessingAI,
    setIsProcessingAI,
    actionLogs,
    detectedItems,
    setDetectedItems,
    executeCommands,
    callGeminiAI,
    logActivity
  };
}
