"use client";
import React from 'react';
import { Search, UserPlus, Filter, Users, Shield } from "lucide-react";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";

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
    <div className="flex flex-wrap items-center gap-3">

      {/* SEARCH */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          className="w-full h-9 pl-9 pr-3 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
          placeholder="Buscar usuarios..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* ROLE FILTER */}
      <div className="relative">
        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <select
          value={roleFilter}
          onChange={(e) => onRoleChange(e.target.value)}
          className="h-9 pl-8 pr-8 rounded-lg border border-border bg-background text-foreground text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 cursor-pointer appearance-none outline-none transition-all min-w-[140px]"
        >
          <option value="all">Todos los roles</option>
          <option value="ADMIN">Administrador</option>
          <option value="PROJECT_MANAGER">Jefe de Proyecto</option>
          <option value="TEAM_MEMBER">Miembro</option>
        </select>
      </div>

      {/* CREATE USER BUTTON */}
      <Button
        onClick={() => router.push('/users/create')}
        className="h-9 px-4 rounded-lg flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-medium text-sm transition-all shadow-sm whitespace-nowrap"
      >
        <UserPlus size={16} />
        Crear Usuario
      </Button>

    </div>
  );
}
