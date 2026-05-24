"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, Mail, UserPlus, Shield, User, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/lib/state/toast-context";
import { 
  useWorkspaceMembers, 
  useAddWorkspaceMember, 
  useUpdateWorkspaceMember, 
  useRemoveWorkspaceMember 
} from "@/lib/state/query/workspace.queries";
import { useTranslation } from "@/lib/hooks/useTranslation";

interface ManageMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
}

export function ManageMembersModal({ isOpen, onClose, workspaceId }: ManageMembersModalProps) {
  const { t, locale } = useTranslation();
  const { push } = useToast();
  const [email, setEmail] = useState("");
  const [accessLevel, setAccessLevel] = useState("member");
  
  // Queries
  const { data: membersData, isLoading } = useWorkspaceMembers(isOpen ? workspaceId : undefined);
  const addMemberMutation = useAddWorkspaceMember();
  const updateMemberMutation = useUpdateWorkspaceMember();
  const removeMemberMutation = useRemoveWorkspaceMember();

  const members = membersData?.members || [];

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
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-800">{t("admin.members.title")}</h2>
                  <p className="text-sm text-slate-500">{t("admin.members.subtitleWorkspace")}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {/* Add Member Form */}
              <form onSubmit={handleAddMember} className="flex gap-3 mb-8">
                <div className="flex-1 relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("admin.members.invitePlaceholder")}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <select
                  value={accessLevel}
                  onChange={(e) => setAccessLevel(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                >
                  <option value="manager">Manager</option>
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </select>
                <button
                  type="submit"
                  disabled={addMemberMutation.isPending}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>{t("admin.members.inviteBtn")}</span>
                </button>
              </form>

              {/* Members List */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <span>{t("admin.members.title")}</span>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">
                    {members.length}
                  </span>
                </h3>

                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
                  </div>
                ) : members.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    {t("admin.members.noMembers")}
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl divide-y divide-slate-100">
                    {members.map((member: any) => (
                      <div key={member.id} className="flex items-center justify-between p-4 bg-white hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold",
                            member.isOwner ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                          )}>
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-slate-800">{member.name}</p>
                              {member.isOwner && (
                                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                                  Owner
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-500">{member.email}</p>
                          </div>
                        </div>

                        {!member.isOwner && (
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-lg">
                              {getAccessIcon(member.accessLevel)}
                              <select
                                value={member.accessLevel}
                                onChange={(e) => handleUpdateLevel(member.id, e.target.value)}
                                className="bg-transparent border-none text-sm font-medium text-slate-700 focus:outline-none cursor-pointer"
                              >
                                <option value="manager">Manager</option>
                                <option value="member">Member</option>
                                <option value="viewer">Viewer</option>
                              </select>
                            </div>
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title={t("admin.members.removeAccessTitle")}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
