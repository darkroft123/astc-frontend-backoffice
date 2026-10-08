"use client";
import React, { useState } from 'react';
import { MoreVertical } from "lucide-react";
import UserActionsMenu from './UserActionsMenu';
import DeleteConfirmModal from './DeleteConfirmModal';

export interface User {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  roleId: string;
  projectAssigned?: string;
  isBlocked: boolean;
}

interface UsersTableProps {
  users: User[];
  compact?: boolean;
}

export default function UsersTable({
  users,
  compact = true,
}: UsersTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
    setOpenMenuId(null);
  };

  const getRoleLabel = (roleId: string) => {
    const roles: Record<string, string> = {
      ADMIN: 'ADMINISTRADOR',
      PROJECT_MANAGER: 'GERENTE',
      TEAM_MEMBER: 'USUARIO',
    };

    return roles[roleId] || roleId.toUpperCase();
  };

  const getStatusBadge = (isBlocked: boolean) => {
    return isBlocked ? (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 border border-red-200 rounded-full text-xs font-medium">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        Bloqueado
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full text-xs font-medium">
        <div className="w-2 h-2 bg-emerald-500 rounded-full" />
        Activo
      </span>
    );
  };

  const rowPadding = compact ? 'py-3.5 px-6' : 'py-5 px-8';
  const headerPadding = compact ? 'py-4 px-6' : 'py-5 px-8';
  const avatarSize = compact ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full min-w-full">
          <thead className="bg-gradient-to-r from-[#1E3A8A] to-[#1E40AF] text-white">
            <tr className="border-b border-blue-900/40">
              <th
                className={`text-left text-xs font-extrabold text-white uppercase tracking-widest ${headerPadding}`}
              >
                Usuario
              </th>

              <th
                className={`text-left text-xs font-extrabold text-white uppercase tracking-widest ${headerPadding}`}
              >
                Rol
              </th>

              <th
                className={`text-left text-xs font-extrabold text-white uppercase tracking-widest ${headerPadding}`}
              >
                Proyecto
              </th>

              <th
                className={`text-left text-xs font-extrabold text-white uppercase tracking-widest ${headerPadding}`}
              >
                Estado
              </th>

              <th
                className={`text-right text-xs font-extrabold text-white uppercase tracking-widest ${headerPadding}`}
              >
                Acciones
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border/60">
            {users.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors group"
              >
                <td className={rowPadding}>
                  <div className="flex items-center gap-3">
                    <div
                      className={`bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white font-semibold flex-shrink-0 ${avatarSize}`}
                    >
                      {(user.firstName?.[0] || '') +
                        ((user.lastName?.[0] || '') ||
                          user.username?.[0] ||
                          '?')}
                    </div>

                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate text-sm">
                        {user.username}
                      </p>

                      <p className="text-muted-foreground truncate text-xs">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </td>

                <td className={rowPadding}>
                  <span className="inline-block px-3.5 py-1 bg-muted text-foreground text-xs font-medium rounded-2xl">
                    {getRoleLabel(user.roleId)}
                  </span>
                </td>

                <td className={`${rowPadding} text-sm text-muted-foreground`}>
                  {user.projectAssigned || 'Sin proyecto'}
                </td>

                <td className={rowPadding}>
                  {getStatusBadge(user.isBlocked)}
                </td>

                <td className={`${rowPadding} text-right`}>
                  <div className="relative inline-block">
                    <button
                      onClick={() =>
                        setOpenMenuId(
                          openMenuId === user.id ? null : user.id
                        )
                      }
                      className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {openMenuId === user.id && (
                      <UserActionsMenu
                        user={user}
                        onClose={() => setOpenMenuId(null)}
                        onDeleteClick={() => handleDeleteClick(user)}
                      />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {deleteModalOpen && selectedUser && (
        <DeleteConfirmModal
          user={selectedUser}
          onClose={() => setDeleteModalOpen(false)}
        />
      )}
    </>
  );
}
