"use client";

import React, { useState } from "react";
import { 
  ShoppingBag, 
  Plus, 
  Star, 
  Trash2, 
  TrendingUp, 
  Package,
  Layers,
  Edit,
  Eye,
  Store,
  MapPin
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Tile } from "@/lib/types";
import { cn } from "@/lib/utils";

interface FurnitureStoreBoardProps {
  tiles: Tile[];
  appearance?: any;
  onUpdateTile?: (tileId: string, updates: Partial<Tile>) => Promise<void>;
  onOpenProductModal: (initialData?: any) => void;
  onToggleViewMode: () => void;
  workspaceId?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  isFeatured: boolean;
  imageUrl?: string;
  archived?: boolean;
  location?: string;
  displayStatus?: string;
}

export function FurnitureStoreBoard({ 
    tiles, 
    appearance, 
    onUpdateTile, 
    onOpenProductModal,
    onToggleViewMode,
    workspaceId
}: FurnitureStoreBoardProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Parse products from specialized tile
  let productTile = tiles.find(t => t.category === "products");
  if (!productTile) {
    productTile = tiles.find(t => t.metadata && (Array.isArray(t.metadata.products) || (Array.isArray(t.metadata) && t.metadata.length > 0 && (t.metadata[0] as any).price !== undefined)));
  }
  const metadata = productTile?.metadata || {};
  const products: Product[] = Array.isArray(metadata) 
    ? metadata 
    : (metadata.products || []);
  const activeProducts = products.filter(p => !p.archived);

  const totalValue = activeProducts.reduce((sum, p) => sum + (p.price || 0), 0);
  const featuredCount = activeProducts.filter(p => p.isFeatured).length;

  const handleToggleArchive = async (product: Product) => {
    if (!onUpdateTile || !productTile) return;
    const updated = products.map(p => p.id === product.id ? { ...p, archived: !p.archived } : p);
    await onUpdateTile(productTile.id, { metadata: { ...productTile.metadata, products: updated } });
  };

  const handleDelete = async (product: Product) => {
    if (!onUpdateTile || !productTile || !confirm("Remover este produto da loja permanentemente?")) return;
    const updated = products.filter(p => p.id !== product.id);
    await onUpdateTile(productTile.id, { metadata: { ...productTile.metadata, products: updated } });
  };

  return (
    <div className="space-y-8 p-4 md:p-8">
      {/* Premium Header */}
      <div className="bg-sky-950 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
         <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/20 rounded-full blur-3xl -mr-20 -mt-20" />
         <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
                <h2 className="text-4xl font-black tracking-tight uppercase mb-2">Gestão de Vitrine</h2>
                <div className="flex items-center gap-4 text-sky-300 text-xs font-bold uppercase tracking-widest">
                    <span className="flex items-center gap-1"><Package className="h-4 w-4" /> {activeProducts.length} Produtos Ativos</span>
                    <span className="w-1 h-1 bg-sky-800 rounded-full" />
                    <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-sky-300" /> {featuredCount} Destaques</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/10">
                    <div className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1">Valor em Exposição</div>
                    <div className="text-2xl font-black text-white">R$ {totalValue.toLocaleString()}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/10 flex flex-col justify-center">
                    <button 
                        onClick={() => onOpenProductModal()}
                        className="bg-white text-sky-950 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-sky-50 transition-all flex items-center justify-center gap-2 shadow-xl"
                    >
                        <Plus className="h-4 w-4" /> Novo Item
                    </button>
                </div>
            </div>
         </div>
      </div>

      {/* Mesas-style Category Selector / Stock Navigator */}
      <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
                 <Layers className="h-5 w-5 text-sky-600" /> Categorias & Estoque
              </h3>
              <div className="flex bg-gray-100 p-1 rounded-2xl gap-2">
                  <button 
                    onClick={() => {
                        const url = `${window.location.origin}/v/${workspaceId || 'share'}`;
                        navigator.clipboard.writeText(url);
                        alert("Link da Loja copiado: " + url);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border border-emerald-50 transition-all hover:bg-emerald-50 cursor-pointer"
                  >
                    <ShoppingBag className="h-4 w-4" /> Copiar Link Público
                  </button>
                  <button 
                    onClick={onToggleViewMode}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border border-gray-100 transition-all hover:bg-sky-50 hover:text-sky-600"
                  >
                    <Eye className="h-4 w-4" /> Ver Como Cliente
                  </button>
              </div>
          </div>

          {/* This is the "Mesas" layout adapted for categories/sectors */}
          {/* Categorias Dinâmicas tiradas do Banco de Dados */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {(() => {
                  const dynamicCats = Array.from(new Set(activeProducts.map(p => p.category)));
                  const displayCats = dynamicCats.length > 0 ? dynamicCats : ["Geral"];
                  
                  return displayCats.map((cat, idx) => {
                      const count = activeProducts.filter(p => p.category === cat).length;
                      return (
                        <motion.button
                            key={cat}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className={cn(
                                "relative h-32 rounded-[2rem] p-6 flex flex-col justify-between transition-all duration-300 border-2",
                                "bg-sky-600 border-sky-700 text-white shadow-lg shadow-sky-100"
                            )}
                        >
                            <div className="text-2xl font-black">{idx + 1}</div>
                            <div className="text-right">
                                <div className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">{cat}</div>
                                <div className="text-xs font-bold leading-none">{count} ITENS</div>
                            </div>
                        </motion.button>
                      );
                  });
              })()}
              
              {/* Botão de Destaques separado */}
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                className="relative h-32 rounded-[2rem] p-6 flex flex-col justify-between transition-all duration-300 border-2 bg-amber-500 border-amber-600 text-white shadow-lg shadow-amber-100"
              >
                  <Star className="h-5 w-5 fill-white" />
                  <div className="text-right">
                      <div className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Destaques</div>
                      <div className="text-xs font-bold leading-none">{featuredCount} ITENS</div>
                  </div>
              </motion.button>
          </div>
      </div>

      {/* Main Product Feed */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="text-sm font-black text-gray-400 uppercase tracking-widest">Feed de Produtos Ativos</div>
            <div className="flex items-center gap-2">
                <button 
                  onClick={() => setViewMode("grid")}
                  className={cn("p-2 rounded-xl transition-all", viewMode === 'grid' ? "bg-sky-100 text-sky-600" : "text-gray-300 hover:bg-gray-50")}
                >
                    <TrendingUp className="h-5 w-5" />
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
                {activeProducts.map((product) => (
                    <motion.div
                        key={product.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={cn(
                            "group bg-white rounded-[2.5rem] border-2 border-gray-100 p-6 hover:shadow-xl transition-all duration-500 relative",
                            product.isFeatured && "ring-4 ring-amber-100 border-amber-200"
                        )}
                    >
                        {/* Overlay Actions */}
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            <button onClick={() => onOpenProductModal(product)} className="p-2 bg-sky-50 text-sky-600 rounded-xl hover:bg-sky-600 hover:text-white transition-all shadow-sm cursor-pointer">
                                <Edit className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleToggleArchive(product)} className="p-2 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-600 hover:text-white transition-all shadow-sm cursor-pointer">
                                <ArchiveIcon className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(product)} className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm cursor-pointer">
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="aspect-video bg-gray-100 rounded-[1.5rem] mb-6 overflow-hidden relative">
                            {product.imageUrl ? (
                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                    <ShoppingBag className="h-8 w-8" />
                                </div>
                            )}
                            {product.isFeatured && (
                                <div className="absolute top-3 left-3 bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                                    <Star className="h-3 w-3 fill-white" /> Destaque
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-sky-600 uppercase tracking-widest bg-sky-50 px-3 py-1 rounded-full">{product.category}</span>
                                <span className="text-lg font-black text-gray-900">R$ {product.price.toLocaleString()}</span>
                            </div>
                            <h4 className="text-xl font-black text-gray-900 leading-tight pr-8">{product.name}</h4>
                            <p className="text-sm text-gray-400 line-clamp-2 mb-2">{product.description || 'Nenhuma descrição adicionada.'}</p>
                            
                            {/* Ferramenta Vendedor: Localização & Status */}
                            <div className="flex flex-col gap-1.5 pt-3 border-t border-gray-50">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                    <MapPin className="h-3 w-3 text-sky-500" />
                                    {product.location || "Localização Não Definida"}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                                    <Package className={cn("h-3 w-3", product.displayStatus === "Montado no Showroom" ? "text-amber-500" : "text-emerald-500")} />
                                    <span className={product.displayStatus === "Montado no Showroom" ? "text-amber-600" : "text-emerald-600"}>
                                        {product.displayStatus || "Na Caixa"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function ArchiveIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect width="20" height="5" x="2" y="3" rx="1"/>
            <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/>
            <path d="M10 12h4"/>
        </svg>
    )
}
