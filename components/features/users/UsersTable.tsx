"use client";
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatAvatarUrl } from '@/lib/avatar-url';
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
      ADMIN: 'Admin',
      PROJECT_MANAGER: 'Jefe de Proyecto',
      TEAM_MEMBER: 'Trabajador',
    };

    return roles[roleId] || roleId.toUpperCase();
  };

  const getStatusBadge = (isBlocked: boolean) => {
    return isBlocked ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red/10 text-red-ink border border-red/20 rounded-full text-xs font-medium">
          <div className="w-2 h-2 bg-red rounded-full animate-pulse" />
          Bloqueado
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green/10 text-green-ink border border-green/20 rounded-full text-xs font-medium">
          <div className="w-2 h-2 bg-green rounded-full" />
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
          <thead className="bg-inset text-text-2">
            <tr className="border-b border-line-2">
              <th
                className={`text-left text-[10.5px] font-mono font-semibold text-text-3 uppercase tracking-[0.05em] ${headerPadding}`}
              >
                Usuario
              </th>

              <th
                className={`text-left text-[10.5px] font-mono font-semibold text-text-3 uppercase tracking-[0.05em] ${headerPadding}`}
              >
                Rol
              </th>

              <th
                className={`text-left text-[10.5px] font-mono font-semibold text-text-3 uppercase tracking-[0.05em] ${headerPadding}`}
              >
                Proyecto
              </th>

              <th
                className={`text-left text-[10.5px] font-mono font-semibold text-text-3 uppercase tracking-[0.05em] ${headerPadding}`}
              >
                Estado
              </th>

              <th
                className={`text-right text-[10.5px] font-mono font-semibold text-text-3 uppercase tracking-[0.05em] ${headerPadding}`}
              >
                Acciones
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border/60">
            {users.map((user) => (
              <tr
                key={user.id}
                  className="hover:bg-raised transition-colors group"
                >
                  <td className={rowPadding}>
                    <div className="flex items-center gap-3">
                      <Avatar className={`rounded-2xl shrink-0 ${avatarSize}`}>
                        {formatAvatarUrl(user.avatarUrl) && (
                          <AvatarImage
                            src={formatAvatarUrl(user.avatarUrl)!}
                            alt={user.firstName || user.username}
                            className="object-cover rounded-2xl"
                          />
                        )}
                        <AvatarFallback className="bg-brand-gradient rounded-2xl text-primary-foreground font-semibold">
                          {(user.firstName?.[0] || '') +
                            ((user.lastName?.[0] || '') ||
                              user.username?.[0] ||
                              '?')}
                        </AvatarFallback>
                      </Avatar>

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
