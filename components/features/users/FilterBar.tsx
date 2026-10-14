"use client";
import React from "react";
import { Search, UserPlus, Shield, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";

export default function FilterBar({
  roleFilter,
  onRoleChange,
  searchTerm,
  onSearchChange,
}: {
  roleFilter: string;
  onRoleChange: (role: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}) {
  const router = useRouter();

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
      {/* SEARCH */}
      <div className="relative flex-1 min-w-[240px]">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          className="w-full h-11 pl-10 pr-4 border border-border rounded-xl text-sm bg-card text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all shadow-xs"
          placeholder="Buscar por nombre, usuario o correo..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* ROLE FILTER */}
      <div className="relative shrink-0">
        <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <select
          value={roleFilter}
          onChange={(e) => onRoleChange(e.target.value)}
          className="h-11 pl-9 pr-9 rounded-xl border border-border bg-card text-foreground text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 cursor-pointer appearance-none outline-none transition-all min-w-[160px] shadow-xs font-normal"
        >
          <option value="all">Todos los roles</option>
          <option value="ADMIN">Administrador</option>
          <option value="PROJECT_MANAGER">Project manager</option>
          <option value="TEAM_MEMBER">Team member</option>
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      </div>

      {/* CREATE USER BUTTON */}
      <button
        type="button"
        onClick={() => router.push("/users/create")}
        className="h-11 px-5 rounded-xl flex items-center justify-center gap-2 bg-gradient-to-r from-[#7c3aed] to-[#9333ea] hover:brightness-110 active:scale-[0.98] text-white font-medium text-sm transition-all shadow-md shadow-primary/25 whitespace-nowrap shrink-0 cursor-pointer"
      >
        <UserPlus size={16} strokeWidth={2.2} />
        <span>Crear usuario</span>
      </button>
    </div>
  );
}
