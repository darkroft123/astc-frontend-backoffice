"use client";
import React, { useEffect, useRef } from 'react';
import { Edit2, Trash2, Lock, Unlock } from "lucide-react";
import type { User } from './UsersTable';

interface UserActionsMenuProps {
  user: User;
  onEdit: () => void;
  onDelete: () => void;
  onBlock: () => void;
  onClose: () => void;
}

export default function UserActionsMenu({
  user,
  onEdit,
  onDelete,
  onBlock,
  onClose,
}: UserActionsMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-3xl shadow-xl shadow-black/10 z-50 py-2 overflow-hidden"
    >
      <button
        onClick={() => {
          onEdit();
          onClose();
        }}
        className="w-full px-5 py-3 text-left text-sm text-zinc-700 hover:bg-zinc-100 flex items-center gap-3 transition-colors group"
      >
        <div className="w-8 h-8 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-blue-100 transition-colors">
          <Edit2 size={18} className="text-zinc-500 group-hover:text-blue-600" />
        </div>
        Editar Usuario
      </button>

      <button
        onClick={() => {
          onBlock();
          onClose();
        }}
        className="w-full px-5 py-3 text-left text-sm text-zinc-700 hover:bg-zinc-100 flex items-center gap-3 transition-colors group"
      >
        <div className="w-8 h-8 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-amber-100 transition-colors">
          {user.isBlocked ? (
            <Unlock size={18} className="text-zinc-500 group-hover:text-amber-600" />
          ) : (
            <Lock size={18} className="text-zinc-500 group-hover:text-amber-600" />
          )}
        </div>
        {user.isBlocked ? 'Desbloquear Usuario' : 'Bloquear Usuario'}
      </button>

      <div className="h-px bg-zinc-200 my-1 mx-2" />

      <button
        onClick={() => {
          onDelete();
          onClose();
        }}
        className="w-full px-5 py-3 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors group"
      >
        <div className="w-8 h-8 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-red-100 transition-colors">
          <Trash2 size={18} className="text-red-500" />
        </div>
        Eliminar Usuario
      </button>
    </div>
  );
}
