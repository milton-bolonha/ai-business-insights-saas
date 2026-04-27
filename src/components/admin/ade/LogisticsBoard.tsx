import { useState, useCallback } from "react";
import { 
  ClipboardList, 
  Truck, 
  Wrench, 
  Clock, 
  AlertCircle,
  MoreVertical,
  CheckCircle2,
  Plus,
  Trash2,
  Archive,
  Wallet,
  ArrowRightLeft,
  Filter,
  CreditCard
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Tile } from "@/lib/types";
import { cn } from "@/lib/utils";


interface LogisticsBoardProps {
  tiles: Tile[];
  appearance?: any;
  onUpdateTile?: (tileId: string, updates: Partial<Tile>) => Promise<void>;
  onAddNote?: (note: { title: string; content: string }) => Promise<void>;
  onOpenOrderModal: (initialData?: any) => void;
}

interface Order {
  id: string;
  tileId?: string;
  orderNumber: string;
  clientName: string;
  product: string;
  assignedStaffName?: string;
  status: "To Assemble" | "Assembling" | "Ready for Delivery" | "Delivered";
  priority: "High" | "Medium" | "Low";
  paymentMethod?: "Transfer" | "Cash" | "Card" | "To Define";
  value?: number;
  archived?: boolean;
}

export function LogisticsBoard({ tiles, appearance, onUpdateTile, onAddNote, onOpenOrderModal }: LogisticsBoardProps) {
  const [showArchived, setShowArchived] = useState(false);
  const [activeRole, setActiveRole] = useState<"admin" | "vendedor" | "montador" | "entregador">("admin");

  // Parse tiles into structured orders
  const orders = tiles
    .filter(t => t.category === "orders")
    .flatMap(t => {
      const data = t.metadata;
      if (Array.isArray(data)) return data.map(o => ({ ...o, tileId: t.id }));
      if (data?.orders) return data.orders.map((o: any) => ({ ...o, tileId: t.id }));
      return []; 
    });

  const displayOrders: Order[] = orders
    .filter(o => showArchived ? o.archived : !o.archived)
    .filter(o => {
      if (activeRole === "admin" || activeRole === "vendedor") return true;
      if (activeRole === "montador") return o.status === "To Assemble" || o.status === "Assembling";
      if (activeRole === "entregador") return o.status === "Ready for Delivery" || o.status === "Delivered";
      return true;
    });

  // Financial calculation
  const cashier = orders.filter(o => !o.archived).reduce((acc, o) => {
    const val = Number(o.value) || 0;
    if (o.paymentMethod === "Transfer" || o.paymentMethod === "Pix") acc.pix += val;
    if (o.paymentMethod === "Cash" || o.paymentMethod === "Dinheiro") acc.cash += val;
    if (o.paymentMethod === "Card" || o.paymentMethod === "Maquininha") acc.card += val;
    acc.total += val;
    return acc;
  }, { pix: 0, cash: 0, card: 0, total: 0 });

  const handleStatusChange = useCallback(async (order: Order, newStatus: Order["status"]) => {
    if (!onUpdateTile || !order.tileId) return;

    const tile = tiles.find(t => t.id === order.tileId);
    if (!tile) return;

    const currentMetadata = tile.metadata || {};
    let newMetadata: any;

    const updateMap = (o: any) => o.id === order.id ? { ...o, status: newStatus } : o;

    if (Array.isArray(currentMetadata)) {
      newMetadata = currentMetadata.map(updateMap);
    } else if (currentMetadata.orders) {
      newMetadata = { ...currentMetadata, orders: currentMetadata.orders.map(updateMap) };
    }

    await onUpdateTile(order.tileId, { metadata: newMetadata });

    if (newStatus === "Delivered" && onAddNote) {
      await onAddNote({
        title: `Protocol: Order #${order.orderNumber} - ${order.clientName}`,
        content: `ORDER DELIVERED AND FINISHED\n\nProduct: ${order.product}\nValue: R$ ${order.value || 0}\nPayment: ${order.paymentMethod || 'To Define'}\nDate: ${new Date().toLocaleString()}`
      });
    }
  }, [tiles, onUpdateTile, onAddNote]);

  const handleArchive = useCallback(async (order: Order) => {
    if (!onUpdateTile || !order.tileId) return;
    const tile = tiles.find(t => t.id === order.tileId);
    if (!tile) return;

    const updateMap = (o: any) => o.id === order.id ? { ...o, archived: !o.archived } : o;
    const currentMetadata = tile.metadata || {};
    const newMetadata = Array.isArray(currentMetadata) 
        ? currentMetadata.map(updateMap) 
        : { ...currentMetadata, orders: currentMetadata.orders.map(updateMap) };

    await onUpdateTile(order.tileId, { metadata: newMetadata });
  }, [tiles, onUpdateTile]);

  const handleDelete = useCallback(async (order: Order) => {
    if (!onUpdateTile || !order.tileId || !confirm("Are you sure you want to delete this order?")) return;
    const tile = tiles.find(t => t.id === order.tileId);
    if (!tile) return;

    const deleteFilter = (o: any) => o.id !== order.id;
    const currentMetadata = tile.metadata || {};
    const newMetadata = Array.isArray(currentMetadata) 
        ? currentMetadata.filter(deleteFilter) 
        : { ...currentMetadata, orders: currentMetadata.orders.filter(deleteFilter) };

    await onUpdateTile(order.tileId, { metadata: newMetadata });
  }, [tiles, onUpdateTile]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": case "Alta": return "text-rose-600 bg-rose-50 border-rose-100";
      case "Medium": case "Média": return "text-amber-600 bg-amber-50 border-amber-100";
      default: return "text-emerald-600 bg-emerald-50 border-emerald-100";
    }
  };

  return (
    <div className="space-y-8 p-4 md:p-8">
      {/* Cashier Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
              { label: "Faturamento Total", val: cashier.total, icon: Wallet, color: "indigo" },
              { label: "Pix/Transferência", val: cashier.pix, icon: ArrowRightLeft, color: "blue" },
              { label: "Dinheiro Físico", val: cashier.cash, icon: Wallet, color: "emerald" },
              { label: "Maquininha", val: cashier.card, icon: CreditCard, color: "amber" },
          ].map((item, i) => (
             <div key={i} className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm flex items-center gap-4">
                 <div className={`p-3 bg-${item.color}-50 rounded-2xl`}>
                    <item.icon className={`h-6 w-6 text-${item.color}-600`} />
                 </div>
                 <div>
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{item.label}</div>
                    <div className="text-xl font-black text-gray-900 leading-none">R$ {item.val.toLocaleString()}</div>
                 </div>
             </div>
          ))}
      </div>

      {/* Role Switcher */}
      <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-3xl border border-gray-100 max-w-3xl">
          {[
              { id: "admin", label: "Geral (Admin)" },
              { id: "vendedor", label: "Vendedor" },
              { id: "montador", label: "Montador" },
              { id: "entregador", label: "Entregador" }
          ].map((role) => (
              <button
                  key={role.id}
                  onClick={() => setActiveRole(role.id as any)}
                  className={cn(
                      "flex-1 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer",
                      activeRole === role.id 
                          ? "bg-gray-900 text-white shadow-xl" 
                          : "text-gray-400 hover:text-gray-900"
                  )}
              >
                  {role.label}
              </button>
          ))}
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
                onClick={() => onOpenOrderModal()}
                className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl cursor-pointer"
            >
                <Plus className="h-5 w-5" />
                Novo Pedido
            </button>
            <button 
                onClick={() => setShowArchived(!showArchived)}
                className={cn(
                    "flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all border-2 cursor-pointer",
                    showArchived ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-white border-gray-100 text-gray-400 hover:border-gray-200"
                )}
            >
                <Archive className="h-5 w-5" />
                {showArchived ? "Ver Ativos" : "Ver Arquivados"}
            </button>
          </div>
          <div className="text-right">
             <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Gestão de Pedidos</div>
             <div className="text-2xl font-black text-gray-900">{displayOrders.length} {showArchived ? 'Arquivados' : 'Ativos'}</div>
          </div>
      </div>

      {/* Kanban Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
        {[
            { title: "Novos Pedidos", statuses: ["Nova Solicitação"], color: "gray" },
            { title: "Montagem", statuses: ["To Assemble", "Assembling", "A Montar", "Em Montagem"], color: "blue" },
            { title: "Logística", statuses: ["Ready for Delivery", "In Transit", "Pronto Entrega", "Em Rota"], color: "indigo" },
            { title: "Entregues", statuses: ["Delivered", "Entregue"], color: "emerald" }
        ].map((col, colIdx) => {
            const colOrders = displayOrders.filter(o => col.statuses.includes(o.status));
            
            // Role-based column filtering
            if (activeRole === "montador" && !["Novos Pedidos", "Montagem"].includes(col.title)) return null;
            if (activeRole === "entregador" && !["Logística", "Entregues"].includes(col.title)) return null;

            return (
                <div key={colIdx} className="bg-gray-50/50 border border-gray-100 rounded-[2rem] p-4 flex flex-col gap-4 min-h-[400px]">
                    <div className="flex items-center justify-between px-2 py-1">
                        <div className="flex items-center gap-2">
                            <div className={cn("w-2 h-2 rounded-full", `bg-${col.color}-500`)} />
                            <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">{col.title}</h3>
                        </div>
                        <div className="bg-white border border-gray-100 text-[9px] font-black text-gray-500 px-2 py-1 rounded-lg">
                            {colOrders.length}
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <AnimatePresence>
                            {colOrders.map((order) => (
                            <motion.div
                                key={order.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className={cn(
                                "group relative bg-white border-2 rounded-[2.5rem] p-5 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden",
                                ((order.priority as string) === "High" || (order.priority as string) === "Alta") ? "border-rose-100" : "border-gray-50",
                                ((order.status as string) === "Delivered" || (order.status as string) === "Entregue") && "opacity-80 border-emerald-100 bg-emerald-50/20"
                                )}
                            >
                                {/* Header Section */}
                                <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={cn("p-2.5 rounded-2xl border", getPriorityColor(order.priority))}>
                                    <ClipboardList className="h-4 w-4" />
                                    </div>
                                    <div>
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">#{order.orderNumber}</div>
                                    <div className="text-sm font-black text-gray-900 truncate max-w-[120px]">{order.clientName}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => onOpenOrderModal(order)} className="p-2 text-gray-300 hover:text-blue-500 transition-colors">
                                        <MoreVertical className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => handleDelete(order)} className="p-2 text-gray-300 hover:text-rose-500 transition-colors">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                                </div>

                {/* Product Detail */}
                <div className="bg-gray-50 rounded-3xl p-4 mb-4">
                    <div className="flex justify-between items-start mb-1">
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Produto</div>
                        <div className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 rounded-full">R$ {order.value || 0}</div>
                    </div>
                    <div className="text-sm font-bold text-gray-800 leading-snug">{order.product}</div>
                </div>

                {/* Status and Action Section */}
                <div className="space-y-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {["Nova Solicitação", "A Montar", "Em Montagem", "Pronto Entrega", "Em Rota", "Entregue"].map((st) => {
                            const internalStMap: Record<string, string> = {
                                "Nova Solicitação": "Nova Solicitação",
                                "A Montar": "To Assemble",
                                "Em Montagem": "Assembling",
                                "Pronto Entrega": "Ready for Delivery",
                                "Em Rota": "In Transit",
                                "Entregue": "Delivered"
                            };
                            const internalSt = internalStMap[st];
                            const isActive = (order.status as string) === internalSt || (order.status as string) === st;

                            return (
                                <button
                                    key={st}
                                    onClick={() => handleStatusChange(order, internalSt as any)}
                                    className={cn(
                                        "px-3 py-2 rounded-full text-[9px] font-black uppercase tracking-tight transition-all cursor-pointer",
                                        isActive 
                                        ? internalSt === "Delivered" ? "bg-emerald-500 text-white shadow-md scale-105" : internalSt === "In Transit" ? "bg-indigo-500 text-white shadow-md" : internalSt === "Ready for Delivery" ? "bg-amber-500 text-white" : internalSt === "Assembling" ? "bg-blue-500 text-white" : "bg-gray-600 text-white"
                                        : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                                    )}
                                >
                                    {st}
                                </button>
                            );
                        })}
                    </div>
                    
                    <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                        <div className="flex flex-col gap-1">
                             <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                <span className="text-[10px] font-bold text-gray-400 capitalize">{order.paymentMethod}</span>
                             </div>
                             {order.assignedStaffName && (
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                    <span className="text-[9px] font-black text-indigo-600 uppercase tracking-tight">{order.assignedStaffName}</span>
                                </div>
                             )}
                        </div>
                        
                        <button 
                            onClick={() => handleArchive(order)}
                            className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-amber-600 hover:text-amber-700 transition-colors cursor-pointer"
                        >
                            <Archive className="h-3 w-3" />
                            {order.archived ? "Desarquivar" : "Arquivar"}
                        </button>
                    </div>
                </div>

                {/* Status Pulse for priority */}
                {((order.status as string) === "To Assemble" || (order.status as string) === "A Montar" || (order.status as string) === "Nova Solicitação") && ((order.priority as string) === "High" || (order.priority as string) === "Alta") && (
                <div className="absolute top-4 right-4 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                </div>
                )}
            </motion.div>
            ))}
                        </AnimatePresence>
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
}
