"use client";

import { useState } from "react";
import { Users, Shield, User, Search, Settings } from "lucide-react";
import { useAllUsers, useUpdateUserRole } from "@/lib/state/query/user.queries";
import { useToast } from "@/lib/state/toast-context";
import { useUIStore } from "@/lib/stores";

export function GlobalUsersBoard() {
  const { data: usersData, isLoading, error } = useAllUsers();
  const updateRoleMutation = useUpdateUserRole();
  const { push } = useToast();
  const appearance = useUIStore((state) => state.appearance);

  const [searchTerm, setSearchTerm] = useState("");

  const users = usersData?.users || [];
  
  const filteredUsers = users.filter((u: any) => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateRoleMutation.mutateAsync({ userId, role: newRole });
      push({
        title: "Papel Atualizado",
        description: "O papel do usuário foi atualizado com sucesso.",
        variant: "success"
      });
    } catch (err: any) {
      push({
        title: "Erro ao atualizar papel",
        description: err.message || "Tente novamente mais tarde.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-slate-500 gap-4">
        <Shield className="h-12 w-12 text-slate-300" />
        <h3 className="text-lg font-medium">Acesso Negado</h3>
        <p className="text-sm text-center max-w-sm">
          Apenas administradores globais podem acessar o painel de gestão de usuários.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-6 max-w-6xl mx-auto w-full">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: appearance.headingColor }}>
            Gestão de Usuários
          </h1>
          <p className="text-sm mt-1" style={{ color: appearance.mutedTextColor }}>
            Gerencie os papéis e permissões globais de todos os usuários da plataforma.
          </p>
        </div>

        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border focus:outline-none focus:ring-2 transition-all"
            style={{ 
              borderColor: appearance.cardBorderColor,
              backgroundColor: appearance.surfaceColor,
              color: appearance.textColor,
            }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-hidden rounded-2xl border bg-white shadow-sm flex flex-col" style={{ borderColor: appearance.cardBorderColor }}>
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/50 sticky top-0 z-10 backdrop-blur-sm border-b" style={{ borderColor: appearance.cardBorderColor }}>
              <tr>
                <th className="px-6 py-4 font-medium text-slate-500">Usuário</th>
                <th className="px-6 py-4 font-medium text-slate-500">Data de Cadastro</th>
                <th className="px-6 py-4 font-medium text-slate-500">Plano</th>
                <th className="px-6 py-4 font-medium text-slate-500">Global Role</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: appearance.cardBorderColor }}>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user: any) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{user.name}</div>
                          <div className="text-xs text-slate-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize bg-slate-100 text-slate-800">
                        {user.plan || 'Free'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={user.role || 'user'}
                        onChange={(e) => handleRoleChange(user.userId, e.target.value)}
                        disabled={updateRoleMutation.isPending}
                        className="rounded-lg border px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 transition-colors disabled:opacity-50"
                        style={{ 
                          borderColor: appearance.cardBorderColor,
                          backgroundColor: user.role === 'admin' ? '#fef2f2' : user.role === 'special' ? '#f0fdf4' : '#f8fafc',
                          color: user.role === 'admin' ? '#991b1b' : user.role === 'special' ? '#166534' : '#334155'
                        }}
                      >
                        <option value="user">User</option>
                        <option value="special">Special (Mentor)</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
