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
import { useTranslation } from "@/lib/hooks/useTranslation";

interface MembersBoardProps {
  workspaceId: string;
  userRole?: string;
}

export function MembersBoard({ workspaceId, userRole }: MembersBoardProps) {
  const { t, locale } = useTranslation();
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
        title: t("admin.members.memberAdded"),
        description: t("admin.members.memberAddedDesc"),
        variant: "success"
      });
    } catch (error: any) {
      push({
        title: t("admin.members.errorAdding"),
        description: error.message || t("admin.members.errorAddingDesc"),
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
        title: t("admin.members.permissionUpdated"),
        description: t("admin.members.permissionUpdatedDesc"),
        variant: "success"
      });
    } catch (error: any) {
      push({
        title: t("admin.members.errorUpdating"),
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!window.confirm(t("admin.members.removeConfirm"))) return;
    
    try {
      await removeMemberMutation.mutateAsync({
        workspaceId,
        memberId
      });
      push({
        title: t("admin.members.memberRemoved"),
        description: t("admin.members.memberRemovedDesc"),
        variant: "success"
      });
    } catch (error: any) {
      push({
        title: t("admin.members.errorRemoving"),
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
    <div className="flex flex-col gap-5 max-w-5xl mx-auto py-4 px-4 min-h-[calc(100vh-100px)]">
      {/* Dynamic Header with Sub-Tabs for Admins */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-100/50">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                {t("admin.members.title")}
              </h2>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                {activeSubTab === "workspace" ? t("admin.members.subtitleWorkspace") : t("admin.members.subtitleGlobal")}
              </p>
            </div>
          </div>

          {/* Sub-Tab Selector (Admin Only) */}
          {isAdmin && (
            <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                onClick={() => setActiveSubTab("workspace")}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                  activeSubTab === "workspace" 
                    ? "bg-white text-indigo-600 shadow-xs" 
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                {t("admin.members.tabWorkspace")}
              </button>
              <button
                onClick={() => setActiveSubTab("global")}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                  activeSubTab === "global" 
                    ? "bg-white text-indigo-600 shadow-xs" 
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                <Globe className="w-3.5 h-3.5" />
                {t("admin.members.tabGlobal")}
              </button>
            </div>
          )}
        </div>

        {/* Workspace View - Invitation Form (Only in Workspace mode) */}
        {activeSubTab === "workspace" && (
           <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-2.5 bg-white p-2 rounded-xl shadow-xs border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="flex-1 relative min-w-[240px]">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("admin.members.invitePlaceholder")}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 rounded-lg border-none focus:ring-2 focus:ring-indigo-100 outline-none text-xs font-semibold"
              />
            </div>
            <select
              value={accessLevel}
              onChange={(e) => setAccessLevel(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 rounded-lg border-none focus:ring-2 focus:ring-indigo-100 outline-none text-xs font-bold uppercase tracking-wider appearance-none cursor-pointer text-slate-600"
            >
              <option value="manager">Manager</option>
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
            </select>
            <button
              type="submit"
              disabled={addMemberMutation.isPending}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-black uppercase tracking-widest text-[10px] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-xs"
            >
              {addMemberMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
              <span>{t("admin.members.inviteBtn")}</span>
            </button>
          </form>
        )}
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-100 overflow-hidden min-h-[400px]">
        {activeSubTab === "workspace" ? (
          <div className="animate-in fade-in duration-500">
            {/* Search & Filter Bar */}
            <div className="p-4 border-b border-slate-50 flex items-center gap-3 bg-slate-50/30">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("admin.members.searchPlaceholder")}
                  className="w-full pl-11 pr-4 py-2.5 bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 text-xs font-medium"
                />
              </div>
              <div className="px-3 py-1.5 bg-white rounded-lg border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400">
                {t("admin.members.countLabel").replace("{count}", String(filteredMembers.length))}
              </div>
            </div>

            {/* Members List */}
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">{t("admin.members.loading")}</p>
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-40">
                  <Users className="w-12 h-12 text-slate-200" />
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">{t("admin.members.noMembers")}</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{t("admin.members.colName")}</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{t("admin.members.colEmail")}</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{t("admin.members.colPermission")}</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">{t("admin.members.colStatus")}</th>
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
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center text-sm font-black shadow-inner",
                              member.isOwner ? "bg-amber-100 text-amber-700" : "bg-indigo-100 text-indigo-700"
                            )}>
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-xs">{member.name}</p>
                              {member.isOwner && (
                                <span className="text-[8px] uppercase font-black tracking-wider px-1.5 py-0.5 bg-amber-105 text-amber-700 rounded-sm">
                                  Owner
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-semibold text-slate-500">{member.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          {member.isOwner ? (
                            <div className="flex items-center gap-1.5 text-amber-600 font-bold text-[10px] uppercase tracking-wider">
                              <Shield className="w-3.5 h-3.5" />
                              <span>{t("admin.members.accessTotal")}</span>
                            </div>
                          ) : (
                            <div className="relative inline-block">
                              <select
                                value={member.accessLevel}
                                onChange={(e) => handleUpdateLevel(member.id, e.target.value)}
                                className="pl-2 pr-6 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg border-none text-[9px] font-black uppercase tracking-widest text-slate-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all appearance-none cursor-pointer"
                              >
                                <option value="manager">Manager</option>
                                <option value="member">Member</option>
                                <option value="viewer">Viewer</option>
                              </select>
                              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                                {getAccessIcon(member.accessLevel)}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2.5">
                            {/* Account Status Badge */}
                            {member.isOwner || member.status === 'active' ? (
                              <span className="text-[9px] uppercase font-black tracking-wider px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md border border-emerald-100">
                                {t("admin.members.statusVerified")}
                              </span>
                            ) : member.status === 'expired' ? (
                              <span className="text-[9px] uppercase font-black tracking-wider px-2 py-0.5 bg-slate-50 text-slate-500 rounded-md border border-slate-100">
                                {t("admin.members.statusExpired")}
                              </span>
                            ) : (
                              <span className="text-[9px] uppercase font-black tracking-wider px-2 py-0.5 bg-amber-50 text-amber-600 rounded-md border border-amber-100 animate-pulse">
                                {t("admin.members.statusPending")}
                              </span>
                            )}

                            {/* Delete action button */}
                            {!member.isOwner && (
                              <button
                                onClick={() => handleRemoveMember(member.id)}
                                className="p-2 text-slate-300 hover:text-red-650 hover:bg-red-50 rounded-lg transition-all"
                                title={t("admin.members.removeAccessTitle")}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
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
