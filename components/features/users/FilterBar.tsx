"use client";
import React from "react";
import { Search, UserPlus, Shield, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

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
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground dark:text-[#5a607f] pointer-events-none" />
        <input
          className="w-full h-11 pl-10 pr-4 rounded-xl text-sm border border-border bg-card dark:bg-sidebar dark:border-raised text-foreground placeholder:text-muted-foreground dark:placeholder-[#5a607f] focus:border-primary/60 dark:focus:border-primary/60 outline-none transition-all shadow-xs"
          placeholder="Buscar por nombre, usuario o correo..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* ROLE FILTER */}
      <div className="shrink-0 min-w-[160px]">
        <Select value={roleFilter} onValueChange={onRoleChange}>
          <SelectTrigger className="h-11 rounded-xl border border-border bg-card dark:bg-sidebar dark:border-raised text-foreground text-xs font-normal">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-muted-foreground dark:text-[#5a607f]" />
              <SelectValue placeholder="Todos los roles" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los roles</SelectItem>
            <SelectItem value="ADMIN">Administrador</SelectItem>
            <SelectItem value="PROJECT_MANAGER">Project manager</SelectItem>
            <SelectItem value="TEAM_MEMBER">Team member</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* CREATE USER BUTTON */}
      <button
        type="button"
        onClick={() => router.push("/users/create")}
        className="h-11 px-5 rounded-xl flex items-center justify-center gap-2 bg-brand-gradient hover:brightness-110 active:scale-[0.98] text-white font-medium text-sm transition-all shadow-md shadow-purple-500/25 whitespace-nowrap shrink-0 cursor-pointer"
      >
        <UserPlus size={16} strokeWidth={2.2} />
        <span>Crear usuario</span>
      </button>
    </div>
  );
}
