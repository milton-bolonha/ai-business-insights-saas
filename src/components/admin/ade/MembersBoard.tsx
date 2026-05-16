"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Mail, UserPlus, Shield, User, Trash2, Search, Loader2, Globe, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/lib/state/toast-context";
import { 
  useWorkspaceMembers, 
  useAddWorkspaceMember, 
  useUpdateWorkspaceMember, 
  useRemoveWorkspaceMember 
} from "@/lib/state/query/workspace.queries";
import { GlobalUsersBoard } from "./GlobalUsersBoard";

interface MembersBoardProps {
  workspaceId: string;
  userRole?: string;
}

export function MembersBoard({ workspaceId, userRole }: MembersBoardProps) {
  const { push } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<"workspace" | "global">("workspace");
  const [email, setEmail] = useState("");
  const [accessLevel, setAccessLevel] = useState("member");
  const [searchQuery, setSearchQuery] = useState("");
  
  const isAdmin = userRole === "admin";

  // Queries
  const { data: membersData, isLoading } = useWorkspaceMembers(workspaceId);
  const addMemberMutation = useAddWorkspaceMember();
  const updateMemberMutation = useUpdateWorkspaceMember();
  const removeMemberMutation = useRemoveWorkspaceMember();

  const members = membersData?.members || [];
  
  const filteredMembers = members.filter((m: any) => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      await addMemberMutation.mutateAsync({
        workspaceId,
        email: email.trim(),
        accessLevel
      });
      setEmail("");
      push({
        title: "Membro adicionado",
        description: "O usuário foi adicionado ao workspace com sucesso.",
        variant: "success"
      });
    } catch (error: any) {
      push({
        title: "Erro ao adicionar",
        description: error.message || "Verifique se o e-mail está correto e já cadastrado na plataforma.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateLevel = async (memberId: string, newLevel: string) => {
    try {
      await updateMemberMutation.mutateAsync({
        workspaceId,
        memberId,
        accessLevel: newLevel
      });
      push({
        title: "Permissão atualizada",
        description: "O nível de acesso foi alterado com sucesso.",
        variant: "success"
      });
    } catch (error: any) {
      push({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!window.confirm("Tem certeza que deseja remover este membro?")) return;
    
    try {
      await removeMemberMutation.mutateAsync({
        workspaceId,
        memberId
      });
      push({
        title: "Membro removido",
        description: "O usuário não tem mais acesso a este workspace.",
        variant: "success"
      });
    } catch (error: any) {
      push({
        title: "Erro ao remover",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getAccessIcon = (level: string) => {
    switch (level) {
      case 'owner': return <Shield className="w-4 h-4 text-amber-500" />;
      case 'manager': return <Shield className="w-4 h-4 text-emerald-500" />;
      case 'member': return <User className="w-4 h-4 text-blue-500" />;
      case 'viewer': return <User className="w-4 h-4 text-slate-400" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto py-8 px-4 min-h-[calc(100vh-100px)]">
      {/* Dynamic Header with Sub-Tabs for Admins */}
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-indigo-600 text-white rounded-[2rem] shadow-xl shadow-indigo-100">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
                {isAdmin ? "Gestão de Usuários" : "Colaboradores"}
              </h2>
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest">
                {activeSubTab === "workspace" ? "Acessos deste Workspace" : "Todos os usuários do SaaS"}
              </p>
            </div>
          </div>

          {/* Sub-Tab Selector (Admin Only) */}
          {isAdmin && (
            <div className="flex p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
              <button
                onClick={() => setActiveSubTab("workspace")}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                  activeSubTab === "workspace" 
                    ? "bg-white text-indigo-600 shadow-sm" 
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                <LayoutGrid className="w-4 h-4" />
                Workspace
              </button>
              <button
                onClick={() => setActiveSubTab("global")}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                  activeSubTab === "global" 
                    ? "bg-white text-indigo-600 shadow-sm" 
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                <Globe className="w-4 h-4" />
                Global
              </button>
            </div>
          )}
        </div>

        {/* Workspace View - Invitation Form (Only in Workspace mode) */}
        {activeSubTab === "workspace" && (
           <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-3 bg-white p-2 rounded-[2rem] shadow-xl border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="flex-1 relative min-w-[240px]">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Convidar por e-mail..."
                className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-semibold"
              />
            </div>
            <select
              value={accessLevel}
              onChange={(e) => setAccessLevel(e.target.value)}
              className="px-4 py-3 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-bold uppercase tracking-wider appearance-none cursor-pointer text-slate-600"
            >
              <option value="manager">Manager</option>
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
            </select>
            <button
              type="submit"
              disabled={addMemberMutation.isPending}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
            >
              {addMemberMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              <span>Convidar</span>
            </button>
          </form>
        )}
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden min-h-[400px]">
        {activeSubTab === "workspace" ? (
          <div className="animate-in fade-in duration-500">
            {/* Search & Filter Bar */}
            <div className="p-6 border-b border-slate-50 flex items-center gap-4 bg-slate-50/30">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar membros..."
                  className="w-full pl-12 pr-4 py-3 bg-white rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 text-sm font-medium"
                />
              </div>
              <div className="px-4 py-2 bg-white rounded-xl border border-slate-200 text-xs font-black uppercase tracking-widest text-slate-400">
                {filteredMembers.length} Membros
              </div>
            </div>

            {/* Members List */}
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Carregando equipe...</p>
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-40">
                  <Users className="w-16 h-16 text-slate-200" />
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Nenhum membro encontrado</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Usuário</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">E-mail</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Permissão</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredMembers.map((member: any) => (
                      <motion.tr 
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        key={member.id} 
                        className="group hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black shadow-inner",
                              member.isOwner ? "bg-amber-100 text-amber-700" : "bg-indigo-100 text-indigo-700"
                            )}>
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{member.name}</p>
                              {member.isOwner && (
                                <span className="text-[9px] uppercase font-black tracking-[0.15em] px-2 py-0.5 bg-amber-100 text-amber-600 rounded-md">
                                  Founder / Owner
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-sm font-semibold text-slate-500">{member.email}</p>
                        </td>
                        <td className="px-8 py-5">
                          {member.isOwner ? (
                            <div className="flex items-center gap-2 text-amber-600 font-bold text-xs uppercase tracking-widest">
                              <Shield className="w-4 h-4" />
                              <span>Acesso Total</span>
                            </div>
                          ) : (
                            <div className="relative inline-block">
                              <select
                                value={member.accessLevel}
                                onChange={(e) => handleUpdateLevel(member.id, e.target.value)}
                                className="pl-3 pr-8 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl border-none text-[10px] font-black uppercase tracking-widest text-slate-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all appearance-none cursor-pointer"
                              >
                                <option value="manager">Manager</option>
                                <option value="member">Member</option>
                                <option value="viewer">Viewer</option>
                              </select>
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                                {getAccessIcon(member.accessLevel)}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-8 py-5 text-right">
                          {!member.isOwner && (
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              className="p-3 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                              title="Remover acesso"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
             <GlobalUsersBoard />
          </div>
        )}
      </div>
    </div>
  );
}
