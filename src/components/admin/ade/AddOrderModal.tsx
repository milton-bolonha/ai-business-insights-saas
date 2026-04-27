"use client";

import { useState, useEffect, FormEvent } from "react";
import { X, ClipboardList, Briefcase, User, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddOrderModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  clients: any[];
  staff: any[];
  products: any[];
}

export function AddOrderModal({ open, onClose, onSubmit, initialData, clients, staff, products }: AddOrderModalProps) {
  const [clientId, setClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [assignedStaffId, setAssignedStaffId] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [product, setProduct] = useState("");
  const [priority, setPriority] = useState<"High" | "Medium" | "Low">("Low");
  const [paymentMethod, setPaymentMethod] = useState<"Transfer" | "Cash" | "Card">("Transfer");
  const [value, setValue] = useState<number>(0);
  const [status, setStatus] = useState<"To Assemble" | "Assembling" | "Ready for Delivery" | "Delivered">("To Assemble");

  useEffect(() => {
    if (initialData) {
      setClientId(initialData.clientId || "");
      setClientName(initialData.clientName || "");
      setAssignedStaffId(initialData.assignedStaffId || "");
      setOrderNumber(initialData.orderNumber || "");
      setProduct(initialData.product || "");
      setPriority(initialData.priority || "Low");
      setPaymentMethod(initialData.paymentMethod || "Transfer");
      setValue(initialData.value || 0);
      setStatus(initialData.status || "To Assemble");
    } else {
        setOrderNumber(Math.floor(100000 + Math.random() * 900000).toString());
        setClientId("");
        setClientName("");
        setAssignedStaffId("");
        setProduct("");
        setPriority("Low");
        setPaymentMethod("Transfer");
        setValue(0);
        setStatus("To Assemble");
    }
  }, [initialData, open]);

  // Auto-fill value when selecting an existing product
  useEffect(() => {
      if (product && !initialData) {
          const foundProduct = products.find(p => p.name.toLowerCase() === product.toLowerCase() || p.id === product);
          if (foundProduct && foundProduct.price) {
              setValue(foundProduct.price);
          }
      }
  }, [product, products, initialData]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if ((clientId || clientName) && product.trim()) {
      onSubmit({
        id: initialData?.id,
        clientId,
        clientName: clients.find(c => c.id === clientId)?.name || clientName,
        assignedStaffId,
        assignedStaffName: staff.find(s => s.id === assignedStaffId)?.name || "",
        orderNumber: orderNumber.trim() || '######',
        product: product.trim(),
        priority,
        paymentMethod,
        value,
        status
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setClientName("");
    setOrderNumber("");
    setProduct("");
    setPriority("Low");
    setPaymentMethod("Transfer");
    setValue(0);
    setStatus("To Assemble");
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative max-w-xl w-full rounded-[2.5rem] bg-white p-8 shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-300">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-50 rounded-2xl">
                <ClipboardList className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                {initialData ? "Editar Pedido" : "Novo Pedido de Venda/Montagem"}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="cursor-pointer rounded-full p-2 hover:bg-gray-100 transition-colors"
          >
            <X className="h-6 w-6 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                    Selecionar Cliente *
                </label>
                <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        className="w-full rounded-2xl bg-gray-50 border-none pl-11 pr-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-blue-100 transition-all appearance-none cursor-pointer"
                        required
                    >
                        <option value="">Selecione um cliente...</option>
                        {clients.map(c => (
                            <option key={c.id} value={c.id}>{c.name} ({c.whatsapp || 'S/ Whats'})</option>
                        ))}
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                    Número do Pedido
                </label>
                <input
                    type="text"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    placeholder="123456"
                    className="w-full rounded-2xl bg-gray-50 border-none px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-blue-100 transition-all"
                />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                    Produto / Móvel *
                </label>
                <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <datalist id="products-list">
                        {products.map(p => (
                            <option key={p.id} value={p.name} />
                        ))}
                    </datalist>
                    <input
                        list="products-list"
                        type="text"
                        value={product}
                        onChange={(e) => setProduct(e.target.value)}
                        placeholder="Ex: Cozinha Completa Modulada"
                        className="w-full rounded-2xl bg-gray-50 border-none pl-11 pr-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-blue-100 transition-all"
                        required
                    />
                </div>
            </div>

            <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                    Atribuir Montador/Equipe
                </label>
                <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                        value={assignedStaffId}
                        onChange={(e) => setAssignedStaffId(e.target.value)}
                        className="w-full rounded-2xl bg-gray-50 border-none pl-11 pr-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-blue-100 transition-all appearance-none cursor-pointer"
                    >
                        <option value="">A Definir</option>
                        {staff.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.sector})</option>
                        ))}
                    </select>
                </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                    Valor do Pedido (R$)
                </label>
                <input
                    type="number"
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    className="w-full rounded-2xl bg-gray-50 border-none px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-blue-100 transition-all"
                />
             </div>

             <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                    Prioridade
                </label>
                <div className="flex gap-2">
                    {["Low", "Medium", "High"].map(p => {
                        const ptLabel = p === "High" ? "Alta" : p === "Medium" ? "Média" : "Baixa";
                        return (
                            <button
                                key={p}
                                type="button"
                                onClick={() => setPriority(p as any)}
                                className={cn(
                                    "flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2",
                                    priority === p 
                                        ? p === 'High' ? "bg-rose-500 border-rose-500 text-white shadow-lg" : p === 'Medium' ? "bg-amber-500 border-amber-500 text-white shadow-lg" : "bg-emerald-500 border-emerald-500 text-white shadow-lg"
                                        : "bg-white border-gray-100 text-gray-400 hover:border-gray-200"
                                )}
                            >
                                {ptLabel}
                            </button>
                        );
                    })}
                </div>
             </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                Status Inicial
            </label>
            <div className="flex gap-2 mb-4">
                {["Nova Solicitação", "A Montar", "Pronto Entrega"].map(st => {
                    const mappedSt = st === "A Montar" ? "To Assemble" : st === "Pronto Entrega" ? "Ready for Delivery" : "Nova Solicitação";
                    return (
                        <button
                            key={st}
                            type="button"
                            onClick={() => setStatus(mappedSt as any)}
                            className={cn(
                                "flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2",
                                status === mappedSt 
                                    ? "bg-indigo-600 border-indigo-600 text-white shadow-lg"
                                    : "bg-white border-gray-100 text-gray-400 hover:border-gray-200"
                            )}
                        >
                            {st}
                        </button>
                    )
                })}
            </div>
            
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                Forma de Pagamento
            </label>
            <div className="flex gap-2">
                {["Pix", "Dinheiro", "Maquininha"].map(m => {
                    const mappedM = m === "Pix" ? "Transfer" : m === "Dinheiro" ? "Cash" : "Card";
                    return (
                        <button
                            key={m}
                            type="button"
                            onClick={() => setPaymentMethod(mappedM as any)}
                            className={cn(
                                "flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2",
                                paymentMethod === mappedM 
                                    ? "bg-blue-600 border-blue-600 text-white shadow-lg"
                                    : "bg-white border-gray-100 text-gray-400 hover:border-gray-200"
                            )}
                        >
                            {m}
                        </button>
                    )
                })}
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={handleClose}
              className="px-8 py-4 text-sm font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={(!clientId && !clientName.trim()) || !product.trim()}
              className="px-10 py-4 bg-gray-900 text-white rounded-[1.5rem] text-sm font-black uppercase tracking-widest hover:bg-black shadow-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {initialData ? "Salvar Alterações" : "Criar Pedido"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
