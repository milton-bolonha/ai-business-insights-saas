import React, { useMemo } from "react";
import { 
    TrendingUp, 
    ShoppingBag, 
    Truck, 
    CheckCircle2, 
    ArrowUpRight,
    ArrowDownRight,
    BarChart3,
    Package
} from "lucide-react";
import { motion } from "framer-motion";
import type { Tile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/hooks/useTranslation";

interface FurnitureAnalyticsBoardProps {
    tiles: Tile[];
}

export function FurnitureAnalyticsBoard({ tiles }: FurnitureAnalyticsBoardProps) {
    const { t, locale } = useTranslation();
    // Extraindo dados
    const products = tiles.find(t => t.category === "products")?.metadata?.products || [];
    const orders = tiles.find(t => t.category === "orders")?.metadata?.orders || [];
    const leads = tiles.find(t => t.category === "notes")?.metadata?.notes?.filter((n: any) => n.category === "lead") || [];

    // --- Cálculos de BI ---

    // 1. Receita e Crescimento Simulados
    const totalRevenue = orders
        .filter((o: any) => !o.archived && (o.status === "Delivered" || o.status === "Ready for Delivery"))
        .reduce((sum: number, o: any) => sum + (Number(o.value) || 0), 0);
    
    const pendingRevenue = orders
        .filter((o: any) => !o.archived && o.status !== "Delivered" && o.status !== "Ready for Delivery")
        .reduce((sum: number, o: any) => sum + (Number(o.value) || 0), 0);

    // 2. Status dos Pedidos (Funil)
    const funil = {
        solicitacoes: orders.filter((o: any) => o.status === "Nova Solicitação").length,
        montagem: orders.filter((o: any) => o.status === "To Assemble" || o.status === "Assembling").length,
        pronto: orders.filter((o: any) => o.status === "Ready for Delivery").length,
        rota: orders.filter((o: any) => o.status === "In Transit").length,
        entregue: orders.filter((o: any) => o.status === "Delivered").length
    };

    // 3. Produtos mais procurados (simples contagem de menções em pedidos)
    const productPopularity = orders.reduce((acc: any, order: any) => {
        if (order.product) {
            acc[order.product] = (acc[order.product] || 0) + 1;
        }
        return acc;
    }, {});
    
    const topProducts = Object.entries(productPopularity)
        .sort(([,a]: any, [,b]: any) => b - a)
        .slice(0, 4)
        .map(([name, count]) => ({ name, count: count as number }));

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl">
                    <BarChart3 className="h-6 w-6" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">{t("admin.furnitureAnalytics.title")}</h2>
                    <p className="text-sm text-gray-500 font-medium">{t("admin.furnitureAnalytics.subtitle")}</p>
                </div>
            </div>

            {/* Top KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col justify-between"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                            <ArrowUpRight className="h-3 w-3" /> +12.5%
                        </span>
                    </div>
                    <div>
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t("admin.furnitureAnalytics.kpi.totalRevenue")}</div>
                        <div className="text-3xl sm:text-4xl font-black text-gray-900">
                            {locale === 'pt' ? 'R$ ' + totalRevenue.toLocaleString('pt-BR') : '$ ' + totalRevenue.toLocaleString('en-US')}
                        </div>
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col justify-between"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                            <ShoppingBag className="h-6 w-6" />
                        </div>
                        <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                            {t("admin.furnitureAnalytics.kpi.inPipeline")}
                        </span>
                    </div>
                    <div>
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t("admin.furnitureAnalytics.kpi.pendingRevenue")}</div>
                        <div className="text-3xl sm:text-4xl font-black text-gray-900">
                            {locale === 'pt' ? 'R$ ' + pendingRevenue.toLocaleString('pt-BR') : '$ ' + pendingRevenue.toLocaleString('en-US')}
                        </div>
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col justify-between"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                            <Package className="h-6 w-6" />
                        </div>
                    </div>
                    <div>
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t("admin.furnitureAnalytics.kpi.activeItems")}</div>
                        <div className="text-3xl sm:text-4xl font-black text-gray-900">{products.filter((p: any) => !p.archived).length}</div>
                    </div>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Funil de Logística */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">{t("admin.furnitureAnalytics.funnel.title")}</h3>
                    
                    <div className="space-y-4">
                        {[
                            { label: t("admin.furnitureAnalytics.funnel.newRequests"), count: funil.solicitacoes, color: "bg-indigo-500", w: "w-full" },
                            { label: t("admin.furnitureAnalytics.funnel.assembling"), count: funil.montagem, color: "bg-blue-500", w: "w-[80%]" },
                            { label: t("admin.furnitureAnalytics.funnel.ready"), count: funil.pronto, color: "bg-amber-500", w: "w-[60%]" },
                            { label: t("admin.furnitureAnalytics.funnel.inTransit"), count: funil.rota, color: "bg-sky-500", w: "w-[40%]" },
                            { label: t("admin.furnitureAnalytics.funnel.delivered"), count: funil.entregue, color: "bg-emerald-500", w: "w-[20%]" },
                        ].map((step, idx) => (
                            <div key={idx} className="relative h-12 rounded-2xl bg-gray-50 flex items-center overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: step.count > 0 ? "100%" : 0 }}
                                    className={cn("absolute left-0 top-0 bottom-0 opacity-20", step.color, step.w)} 
                                />
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-200" />
                                <div className="z-10 flex justify-between w-full px-6">
                                    <span className="text-xs font-bold text-gray-600">{step.label}</span>
                                    <span className="text-sm font-black text-gray-900">{step.count}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Produtos */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">{t("admin.furnitureAnalytics.topProducts.title")}</h3>
                    
                    {topProducts.length > 0 ? (
                        <div className="space-y-4">
                            {topProducts.map((p, idx) => (
                                <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-transparent hover:border-gray-100 transition-colors">
                                    <div className="h-10 w-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-lg font-black text-sky-600">
                                        #{idx + 1}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-black text-gray-900">{p.name}</div>
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t("admin.furnitureAnalytics.topProducts.orderCount", { count: p.count })}</div>
                                    </div>
                                    <div className="h-8 w-8 rounded-full bg-sky-100 flex items-center justify-center">
                                        <TrendingUp className="h-4 w-4 text-sky-600" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-40 flex flex-col items-center justify-center text-gray-400 gap-2">
                            <ShoppingBag className="h-8 w-8 opacity-20" />
                            <span className="text-xs font-bold uppercase tracking-widest">{t("admin.furnitureAnalytics.topProducts.noData")}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
