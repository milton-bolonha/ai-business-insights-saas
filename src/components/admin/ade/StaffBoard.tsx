"use client";

import { useState, FormEvent, useCallback } from "react";
import { 
  Shield, 
  UserPlus, 
  Search, 
  Briefcase, 
  Wrench, 
  Truck,
  Edit,
  Circle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Tile } from "@/lib/types";
import { useTranslation } from "@/lib/hooks/useTranslation";

interface StaffMember {
    id: string;
    name: string;
    role: string;
    sector: "Assembly" | "Sales" | "Delivery" | "Logistics" | "Finance";
    status: "Active" | "Off Duty" | "On Tour";
    createdAt: string;
}

interface StaffBoardProps {
    tiles: Tile[];
    onStaffSubmit: (data: any) => Promise<void>;
}

export function StaffBoard({ tiles, onStaffSubmit }: StaffBoardProps) {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<any>(null);

    // Parse staff from tile
    const staffTile = tiles.find(t => t.category === "staff");
    const staff: StaffMember[] = Array.isArray(staffTile?.metadata) ? staffTile?.metadata : (staffTile?.metadata?.staff || []);

    const filteredStaff = staff.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.sector.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = useCallback(async (e: FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const data = {
            id: editingStaff?.id,
            name: formData.get("name"),
            role: formData.get("role"),
            sector: formData.get("sector"),
            status: formData.get("status") || "Active",
        };
        await onStaffSubmit(data);
        setIsModalOpen(false);
        setEditingStaff(null);
    }, [editingStaff, onStaffSubmit]);

    const getSectorIcon = (sector: string) => {
        switch (sector) {
            case "Assembly": case "Montagem": return Wrench;
            case "Delivery": case "Entrega": return Truck;
            default: return Briefcase;
        }
    };

    const getStatusLabel = (status: string) => {
        const lower = status.toLowerCase();
        if (lower === 'active' || lower === 'ativo') return t("admin.staff.statusActive");
        if (lower === 'off duty' || lower === 'folga' || lower === 'offduty') return t("admin.staff.statusOffDuty");
        if (lower === 'on tour' || lower === 'em rota' || lower === 'ontour') return t("admin.staff.statusOnTour");
        return status;
    };

    const getSectorLabel = (sector: string) => {
        const lower = sector.toLowerCase();
        if (lower === 'assembly' || lower === 'montagem') return t("admin.staff.sectorAssembly");
        if (lower === 'delivery' || lower === 'entrega') return t("admin.staff.sectorDelivery");
        if (lower === 'sales' || lower === 'vendas') return t("admin.staff.sectorSales");
        if (lower === 'logistics' || lower === 'logística' || lower === 'logistica') return t("admin.staff.sectorLogistics");
        if (lower === 'finance' || lower === 'finanças' || lower === 'financas') return t("admin.staff.sectorFinance");
        return sector;
    };

    return (
        <div className="space-y-8 p-4 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">{t("admin.staff.title")}</h2>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">{t("admin.staff.subtitle")}</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                        <input 
                            type="text" 
                            placeholder={t("admin.staff.searchPlaceholder")}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-11 pr-4 py-3 bg-white border-2 border-gray-100 rounded-2xl text-sm font-semibold w-full md:w-64 focus:border-indigo-500 transition-all outline-none"
                        />
                    </div>
                    <button 
                        onClick={() => { setEditingStaff(null); setIsModalOpen(true); }}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-xl cursor-pointer"
                    >
                        <UserPlus className="h-4 w-4" /> {t("admin.staff.newMember")}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <AnimatePresence>
                    {filteredStaff.map((member) => {
                        const Icon = getSectorIcon(member.sector);
                        const isActive = (member.status as string) === 'Active' || (member.status as string) === 'Ativo';
                        return (
                            <motion.div
                                key={member.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white border-2 border-gray-100 rounded-[2.5rem] p-6 hover:shadow-lg transition-all group"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-3 bg-indigo-50 rounded-2xl">
                                        <Icon className="h-6 w-6 text-indigo-600" />
                                    </div>
                                    <div className={cn(
                                        "px-3 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-1.5",
                                        isActive ? "bg-emerald-50 text-emerald-600" : "bg-gray-50 text-gray-400"
                                    )}>
                                        <Circle className={cn("h-2 w-2 fill-current", isActive && "animate-pulse")} />
                                        {getStatusLabel(member.status)}
                                    </div>
                                </div>

                                <h3 className="text-lg font-black text-gray-900 mb-1">{member.name}</h3>
                                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-4">{member.role}</p>

                                <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-lg">{getSectorLabel(member.sector)}</span>
                                    <button onClick={() => { setEditingStaff(member); setIsModalOpen(true); }} className="p-2 text-gray-300 hover:text-indigo-600 transition-colors cursor-pointer">
                                        <Edit className="h-4 w-4" />
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Registration Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative max-w-lg w-full bg-white rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 shadow-2xl overflow-hidden"
                    >
                        <div className="mb-8 flex items-center gap-4">
                            <div className="p-3 bg-indigo-100 rounded-2xl">
                                <Shield className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{t("admin.staff.modalTitle")}</h2>
                                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">{t("admin.staff.modalSubtitle")}</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">{t("admin.staff.staffName")}</label>
                                <input name="name" defaultValue={editingStaff?.name} required className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-sm font-semibold border-none focus:ring-2 focus:ring-indigo-100 outline-none shadow-inner" />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">{t("admin.staff.role")}</label>
                                    <input name="role" defaultValue={editingStaff?.role} required placeholder={t("admin.staff.rolePlaceholder")} className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-sm font-semibold border-none focus:ring-2 focus:ring-indigo-100 outline-none shadow-inner" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">{t("admin.staff.sector")}</label>
                                    <select name="sector" defaultValue={editingStaff?.sector || "Assembly"} className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-sm font-semibold border-none focus:ring-2 focus:ring-indigo-100 outline-none shadow-inner appearance-none">
                                        <option value="Assembly">{t("admin.staff.sectorAssembly")}</option>
                                        <option value="Delivery">{t("admin.staff.sectorDelivery")}</option>
                                        <option value="Sales">{t("admin.staff.sectorSales")}</option>
                                        <option value="Logistics">{t("admin.staff.sectorLogistics")}</option>
                                        <option value="Finance">{t("admin.staff.sectorFinance")}</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">{t("admin.staff.status")}</label>
                                <div className="flex gap-4">
                                    {[
                                        { id: "Active", label: t("admin.staff.statusActive") },
                                        { id: "Off Duty", label: t("admin.staff.statusOffDuty") },
                                        { id: "On Tour", label: t("admin.staff.statusOnTour") }
                                    ].map(st => (
                                        <label key={st.id} className="flex-1">
                                            <input type="radio" name="status" value={st.id} defaultChecked={editingStaff?.status === st.id || (!editingStaff && st.id === 'Active')} className="sr-only peer" />
                                            <div className="text-center py-3 rounded-2xl bg-gray-50 text-gray-400 font-bold text-[10px] uppercase cursor-pointer peer-checked:bg-indigo-600 peer-checked:text-white transition-all">
                                                {st.label}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-4 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-4 text-xs font-black uppercase text-gray-400 hover:text-gray-900 transition-colors cursor-pointer">{t("common.cancel")}</button>
                                <button type="submit" className="bg-indigo-600 text-white px-10 py-4 rounded-3xl text-sm font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all cursor-pointer">{t("admin.staff.saveMember")}</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
