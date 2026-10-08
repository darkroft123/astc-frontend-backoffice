"use client";
import React from 'react';
import { AlertCircle, Trash2 } from "lucide-react";
import { User } from './UsersTable';

interface DeleteConfirmModalProps {
  user: User;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmModal({
  user,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        <div className="p-8">
          <div className="flex items-start gap-5">
            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center flex-shrink-0 border border-red-200">
              <Trash2 className="text-red-600" size={28} />
            </div>

            <div className="flex-1">
              <h3 className="text-2xl font-semibold text-zinc-900 mb-2">
                ¿Eliminar usuario?
              </h3>
              <p className="text-zinc-600 text-[15px]">
                Esta acción es irreversible. El usuario será eliminado permanentemente del sistema.
              </p>

              {/* User Info */}
              <div className="mt-6 bg-muted/50 border border-border rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-200 flex items-center justify-center">
                    <span className="text-lg font-semibold text-muted-foreground">
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="border-t border-border bg-muted/50 px-8 py-5 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-6 py-3 rounded-2xl border border-zinc-300 text-zinc-700 hover:bg-zinc-100 font-medium transition-all active:scale-[0.985]"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-all active:scale-[0.985] flex items-center gap-2"
          >
            <Trash2 size={18} />
            Eliminar Usuario
          </button>
        </div>
      </div>
    </div>
  );
}
