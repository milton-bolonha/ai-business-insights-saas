"use client";

import React, { useState } from "react";
import { 
  ShoppingBag, 
  Star, 
  ArrowRight, 
  Heart, 
  Filter,
  CheckCircle2,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Tile } from "@/lib/types";
import { cn } from "@/lib/utils";

interface FurniturePublicStoreProps {
  tiles: Tile[];
  onPurchaseRequest: (product: any) => Promise<void>;
}

export function FurniturePublicStore({ tiles, onPurchaseRequest }: FurniturePublicStoreProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [requestedId, setRequestedId] = useState<string | null>(null);

  console.log(`[FurniturePublicStore] Received tiles:`, tiles);
  let productTile = tiles.find(t => t.category === "products");
  
  // Resilient fallback: Find any tile that has a products array in its metadata
  if (!productTile) {
    productTile = tiles.find(t => t.metadata && (Array.isArray(t.metadata.products) || (Array.isArray(t.metadata) && t.metadata.length > 0 && t.metadata[0].price !== undefined)));
  }
  
  console.log(`[FurniturePublicStore] Found productTile:`, productTile);
  const metadata = productTile?.metadata || {};
  const products: any[] = Array.isArray(metadata) 
    ? metadata 
    : (metadata.products || []);
  console.log(`[FurniturePublicStore] Parsed products list:`, products);
  const activeProducts = products.filter(p => !p.archived);
  console.log(`[FurniturePublicStore] Active products count:`, activeProducts.length);

  const categories = ["All", ...Array.from(new Set(activeProducts.map(p => p.category)))];
  
  const filteredProducts = selectedCategory === "All" 
    ? activeProducts 
    : activeProducts.filter(p => p.category === selectedCategory);

  const featuredProducts = activeProducts.filter(p => p.isFeatured);

  const handleRequest = async (p: any) => {
    setRequestedId(p.id);
    await onPurchaseRequest(p);
    // Animation/Notification logic handled by parent (AdminContainer)
    setTimeout(() => setRequestedId(null), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Hero / Brand Banner */}
      <div className="bg-white border-b border-gray-100 pt-12 pb-20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-full opacity-5 pointer-events-none">
              <div className="grid grid-cols-6 h-full w-full">
                  {Array.from({length: 24}).map((_, i) => (
                      <div key={i} className="border border-gray-900 h-32 w-full" />
                  ))}
              </div>
          </div>

          <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
               <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 bg-sky-50 text-sky-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest mb-6"
              >
                  <ShoppingBag className="h-4 w-4" /> Loja Virtual Ativa
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-5xl md:text-7xl font-black text-gray-900 tracking-tighter mb-6"
              >
                  Design que <span className="text-sky-600">Transforma.</span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-lg text-gray-500 max-w-2xl mx-auto font-medium"
              >
                  Explore nossa coleção exclusiva de móveis com montagem profissional incluída. 
                  Direto da fábrica para sua casa.
              </motion.p>
          </div>
      </div>

      {/* Featured Section */}
      {featuredProducts.length > 0 && (
          <div className="max-w-7xl mx-auto px-6 -mt-10 mb-20">
              <div className="flex items-center gap-3 mb-8">
                  <Star className="h-6 w-6 text-amber-500 fill-amber-500" />
                  <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Destaques da Temporada</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {featuredProducts.map((p) => (
                      <motion.div 
                        key={p.id}
                        whileHover={{ y: -8 }}
                        className="bg-white rounded-[3rem] p-8 shadow-xl border border-gray-100 flex flex-col md:flex-row gap-8 relative group overflow-hidden"
                      >
                         <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors" />
                         
                         <div className="w-full md:w-56 h-56 bg-gray-100 rounded-[2.5rem] overflow-hidden shrink-0">
                            {p.imageUrl ? (
                                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-200">
                                    <ShoppingBag className="h-12 w-12" />
                                </div>
                            )}
                         </div>

                         <div className="flex flex-col justify-center flex-1">
                             <div className="flex items-center gap-2 mb-3">
                                 <span className="bg-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">Oferta Especial</span>
                                 <span className="text-gray-300 text-xs font-bold">•</span>
                                 <span className="text-gray-400 text-xs font-bold uppercase">{p.category}</span>
                             </div>
                             <h3 className="text-3xl font-black text-gray-900 mb-3">{p.name}</h3>
                             <p className="text-gray-500 text-sm mb-6 line-clamp-2 font-medium">{p.description}</p>
                             <div className="flex items-center justify-between mt-auto">
                                <div className="text-3xl font-black text-gray-900">R$ {p.price?.toLocaleString()}</div>
                                <button 
                                    onClick={() => handleRequest(p)}
                                    className="bg-sky-600 hover:bg-sky-700 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-sky-200 transition-all active:scale-95 flex items-center gap-2"
                                >
                                    Solicitar Orçamento <ArrowRight className="h-4 w-4" />
                                </button>
                             </div>
                         </div>
                      </motion.div>
                  ))}
              </div>
          </div>
      )}

      {/* Main Catalog */}
      <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
              <div className="flex items-center gap-4 overflow-x-auto pb-4 md:pb-0 scrollbar-hide">
                  {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={cn(
                            "px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
                            selectedCategory === cat 
                                ? "bg-gray-900 text-white shadow-xl scale-105" 
                                : "bg-white text-gray-400 border border-gray-100 hover:bg-gray-50"
                        )}
                      >
                          {cat === "All" ? "Todos" : cat}
                      </button>
                  ))}
              </div>
              <div className="flex items-center gap-2 text-gray-400 text-xs font-black uppercase tracking-widest bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
                  <Filter className="h-4 w-4" /> {filteredProducts.length} itens encontrados
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
              <AnimatePresence>
                {filteredProducts.map((p) => (
                    <motion.div
                        key={p.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-white rounded-[2.5rem] border border-gray-100 p-6 hover:shadow-2xl transition-all duration-500 group"
                    >
                        <div className="relative aspect-square bg-gray-100 rounded-[2rem] mb-6 overflow-hidden">
                             {p.imageUrl ? (
                                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-200">
                                    <ShoppingBag className="h-10 w-10" />
                                </div>
                            )}
                             <button className="absolute top-4 right-4 p-3 bg-white/80 backdrop-blur rounded-full text-gray-400 hover:text-rose-500 hover:bg-white transition-all shadow-sm z-10 cursor-pointer">
                                 <Heart className="h-4 w-4" />
                             </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <span className="text-[9px] font-black text-sky-600 uppercase tracking-widest mb-1 block">{p.category}</span>
                                <h4 className="text-xl font-black text-gray-900 group-hover:text-sky-600 transition-colors uppercase truncate">{p.name}</h4>
                            </div>
                            
                            <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                                <div className="text-xl font-black text-gray-900">R$ {p.price.toLocaleString()}</div>
                                <button 
                                    onClick={() => handleRequest(p)}
                                    disabled={requestedId === p.id}
                                    className={cn(
                                        "p-3 rounded-2xl transition-all active:scale-90",
                                        requestedId === p.id 
                                            ? "bg-emerald-500 text-white" 
                                            : "bg-gray-100 text-gray-900 hover:bg-gray-900 hover:text-white"
                                    )}
                                >
                                    {requestedId === p.id ? <CheckCircle2 className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
              </AnimatePresence>
          </div>
      </div>

      {requestedId && (
        <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] bg-emerald-600 text-white px-8 py-4 rounded-3xl shadow-2xl font-black text-xs uppercase tracking-widest flex items-center gap-4"
        >
            <CheckCircle2 className="h-5 w-5" /> Interesse enviado! Nossa equipe entrará em contato.
        </motion.div>
      )}
    </div>
  );
}
