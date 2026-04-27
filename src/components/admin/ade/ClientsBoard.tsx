"use client";

import { useState, FormEvent } from "react";
import { 
  Users, 
  UserPlus, 
  Search, 
  MessageCircle, 
  MapPin, 
  History,
  Edit,
  ShoppingBag
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Client {
    id: string;
    name: string;
    whatsapp: string;
    address: string;
    email?: string;
    notes?: string;
    createdAt: string;
}

interface ClientsBoardProps {
    tiles: any[];
    onClientSubmit: (data: any) => Promise<void>;
}

export function ClientsBoard({ tiles, onClientSubmit }: ClientsBoardProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<any>(null);

    // Parse clients from tile
    const clientTile = tiles.find(t => t.category === "clients");
    const clients: Client[] = Array.isArray(clientTile?.metadata) ? clientTile?.metadata : (clientTile?.metadata?.clients || []);

    const filteredClients = clients.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.whatsapp.includes(searchTerm)
    );

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const data = {
            id: editingClient?.id,
            name: formData.get("name"),
            whatsapp: formData.get("whatsapp"),
            address: formData.get("address"),
            email: formData.get("email"),
            notes: formData.get("notes"),
        };
        await onClientSubmit(data);
        setIsModalOpen(false);
        setEditingClient(null);
    };

    return (
        <div className="space-y-8 p-4 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Client Database</h2>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Robust portfolio and protocol management</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-sky-600 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Search by name or WhatsApp..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-11 pr-4 py-3 bg-white border-2 border-gray-100 rounded-2xl text-sm font-semibold w-full md:w-64 focus:border-sky-500 transition-all outline-none"
                        />
                    </div>
                    <button 
                        onClick={() => { setEditingClient(null); setIsModalOpen(true); }}
                        className="bg-gray-900 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 shadow-xl cursor-pointer"
                    >
                        <UserPlus className="h-4 w-4" /> New Client
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {filteredClients.map((client) => (
                        <motion.div
                            key={client.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white border-2 border-gray-100 rounded-[2.5rem] p-6 hover:border-sky-200 transition-all group shadow-sm"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-sky-50 rounded-2xl">
                                    <Users className="h-6 w-6 text-sky-600" />
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => { setEditingClient(client); setIsModalOpen(true); }} className="p-2 text-gray-300 hover:text-sky-600 transition-colors cursor-pointer">
                                        <Edit className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-xl font-black text-gray-900 mb-1">{client.name}</h3>
                            <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs mb-4">
                                <MessageCircle className="h-4 w-4" /> {client.whatsapp}
                            </div>

                            <div className="space-y-3 pt-4 border-t border-gray-50 text-sm font-medium text-gray-500">
                                <div className="flex gap-2">
                                    <MapPin className="h-4 w-4 shrink-0 text-gray-400" />
                                    <span className="line-clamp-2">{client.address || "No address registered"}</span>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <History className="h-4 w-4 shrink-0 text-gray-400" />
                                    <span>Since {new Date(client.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {filteredClients.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
                        <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-black text-gray-400 uppercase tracking-tight">No clients found</h3>
                    </div>
                )}
            </div>

            {/* Registration Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative max-w-lg w-full bg-white rounded-[3rem] p-10 shadow-2xl overflow-hidden"
                    >
                        <div className="mb-8">
                            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                                {editingClient ? "Edit Client" : "Client Registration"}
                            </h2>
                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1">Enter data for billing and delivery</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
                                    <input name="name" defaultValue={editingClient?.name} required className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-sm font-semibold border-none focus:ring-2 focus:ring-sky-100 outline-none shadow-inner" />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">WhatsApp</label>
                                    <input name="whatsapp" defaultValue={editingClient?.whatsapp} required placeholder="ex: 11988887777" className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-sm font-semibold border-none focus:ring-2 focus:ring-sky-100 outline-none shadow-inner" />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Email</label>
                                    <input name="email" defaultValue={editingClient?.email} type="email" className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-sm font-semibold border-none focus:ring-2 focus:ring-sky-100 outline-none shadow-inner" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Delivery Address</label>
                                <textarea name="address" defaultValue={editingClient?.address} rows={2} required className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-sm font-semibold border-none focus:ring-2 focus:ring-sky-100 outline-none resize-none shadow-inner" />
                            </div>

                            <div className="flex justify-end gap-4 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-4 text-xs font-black uppercase text-gray-400 hover:text-gray-900 transition-colors cursor-pointer">Cancel</button>
                                <button type="submit" className="bg-sky-600 text-white px-10 py-4 rounded-3xl text-sm font-black uppercase tracking-widest hover:bg-sky-700 shadow-xl shadow-sky-100 transition-all cursor-pointer">Save Client</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
