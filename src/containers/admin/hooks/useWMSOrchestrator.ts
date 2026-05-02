import { useState, useCallback } from "react";
import { useToast } from "@/lib/state/toast-context";

export interface WMSCommand {
  action: 'CREATE_SECTOR' | 'DELETE_SECTOR' | 'PUTAWAY' | 'AUTO_PUTAWAY' | 'PICKING';
  id?: string;
  targetId?: string;
  rows?: number;
  cols?: number;
  orientation?: 'horizontal' | 'vertical';
  item?: {
    id?: string;
    name?: string;
    sku?: string;
    price?: string;
    condition?: string;
    description?: string;
    category?: string;
  };
  reason?: string;
  sku?: string;
}

export interface Spot {
  id: string;
  code: string;
  span: "short" | "long";
  products: any[];
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
    const spots = [];
    for (let r = 1; r <= rows; r++) {
      for (let c = 1; c <= cols; c++) {
        spots.push({
          id: `${sectorId}-${r}-${c}`,
          code: `${sectorId}-${r}-${c}`,
          span: "short",
          products: []
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
              type: "Showcase",
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
      // Prompt construction from prototype
      const prompt = `Você é uma IA de Sistema de Armazém (WMS MCP). Você deve interpretar o pedido do usuário e retornar EXATAMENTE UM JSON com duas chaves: "reply" (texto Markdown amigável respondendo o usuário) e "commands" (array de objetos de ação, vazio se for só conversa).
        
      Ações suportadas em 'commands':
      1. { "action": "CREATE_SECTOR", "id": "A1", "rows": 4, "cols": 5, "orientation": "horizontal" }
      2. { "action": "AUTO_PUTAWAY", "item": { "name": "...", "sku": "...", "price": "...", "condition": "...", "description": "..." } }
      3. { "action": "PUTAWAY", "targetId": "A1-1-1", "item": { ... } }
      4. { "action": "PICKING", "targetId": "A1-1-1", "sku": "...", "reason": "..." }
      
      Aja naturalmente na chave "reply" e extraia os dados ricamente.`;

      // Simulating API call for now or using fetch if key is known
      // Note: In a real app, this would call a serverless function or proxy
      const response = await fetch('/api/ai/wms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, input, images })
      });

      if (!response.ok) throw new Error("AI Service Unavailable");
      
      const data = await response.json();
      const logs = executeCommands(data.commands || []);
      
      return {
        reply: data.reply,
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
