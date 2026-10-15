"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import UsersList from "@/components/features/users/UsersList";

export default function UsersPage() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen bg-background pb-12">
      <div className="relative max-w-6xl mx-auto px-4 sm:px-8 py-6 space-y-6 z-10">
        {/* HEADER */}
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.05em] bg-primary/10 text-primary border border-primary/20 dark:bg-[#181a2e] dark:text-[#7d97ff] dark:border-[#2b3054] px-2.5 py-0.5 rounded-full">
              CONTROL GLOBAL
            </span>
            <span className="font-sans text-xs text-muted-foreground">
              · Panel administrativo
            </span>
          </div>

          <h1 className="text-[28px] font-bold text-foreground tracking-tight leading-tight">
            Usuarios
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Administración de cuentas, roles y permisos de los usuarios registrados en el sistema.
          </p>
        </div>

        {/* USERS LIST (FILTERS + TABLE + PAGINATION) */}
        <UsersList />
      </div>
    </div>
  );
}
