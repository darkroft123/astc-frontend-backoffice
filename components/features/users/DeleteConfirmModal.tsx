"use client";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Trash2 } from "lucide-react";

interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
}

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const modalNode = (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4">
      <div className="bg-card border border-border rounded-[var(--radius-modal)] shadow-2xl max-w-md w-full mx-4 overflow-hidden relative z-[101]">
        <div className="p-8">
          <div className="flex items-start gap-5">
            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl bg-red/10 flex items-center justify-center flex-shrink-0 border border-red/20">
              <Trash2 className="text-red-ink" size={28} />
            </div>

            <div className="flex-1">
              <h3 className="text-2xl font-semibold text-foreground mb-2">
                ¿Eliminar usuario?
              </h3>
              <p className="text-text-2 text-[15px]">
                Esta acción es irreversible. El usuario será eliminado permanentemente del sistema.
              </p>

              {/* User Info */}
              <div className="mt-6 bg-muted/50 border border-border rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-raised flex items-center justify-center">
                    <span className="text-lg font-semibold text-muted-foreground">
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-sm text-text-4">{user.email}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-border bg-raised/50 px-8 py-4 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-6 py-2.5 rounded-[var(--radius-control)] border border-border text-foreground hover:bg-muted font-medium transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2.5 rounded-[var(--radius-control)] bg-red hover:bg-red-ink text-destructive-foreground font-medium transition-colors cursor-pointer"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalNode, document.body) : null;
}
