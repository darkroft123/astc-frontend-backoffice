"use client";

import { Search, RefreshCw, Download } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface AttendanceFilterBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedRole: "ALL" | "ADMIN" | "PROJECT_MANAGER" | "TEAM_MEMBER";
  setSelectedRole: (role: "ALL" | "ADMIN" | "PROJECT_MANAGER" | "TEAM_MEMBER") => void;
  selectedProject: string;
  setSelectedProject: (proj: string) => void;
  projects: any[];
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  isLoading: boolean;
  onRefresh: () => void;
  onExportCSV: () => void;
  canExport?: boolean;
}

export function AttendanceFilterBar({
  searchTerm,
  setSearchTerm,
  selectedRole,
  setSelectedRole,
  selectedProject,
  setSelectedProject,
  projects,
  statusFilter,
  setStatusFilter,
  isLoading,
  onRefresh,
  onExportCSV,
  canExport = true,
}: AttendanceFilterBarProps) {
  return (
    <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-3">
      {/* Search Bar */}
      <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          placeholder="Colaborador o proyecto..."
          className="w-full pl-9 pr-4 h-10 rounded-xl border border-slate-200 dark:border-raised bg-white dark:bg-sidebar text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-violet"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Role & Project Selects */}
      <div className="grid grid-cols-2 sm:flex items-center gap-3">
        <div className="flex-1 sm:min-w-[140px]">
          <Select
            value={selectedRole}
            onValueChange={(val) =>
              setSelectedRole(val as "ALL" | "ADMIN" | "PROJECT_MANAGER" | "TEAM_MEMBER")
            }
          >
            <SelectTrigger className="w-full h-10 rounded-xl border border-slate-200 dark:border-raised bg-white dark:bg-sidebar text-xs text-foreground">
              <SelectValue placeholder="Todos los roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los roles</SelectItem>
              <SelectItem value="ADMIN">Administrador</SelectItem>
              <SelectItem value="PROJECT_MANAGER">Jefes de proyecto</SelectItem>
              <SelectItem value="TEAM_MEMBER">Colaboradores</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 sm:min-w-[170px]">
          <Select
            value={selectedProject}
            onValueChange={(val) => setSelectedProject(val)}
          >
            <SelectTrigger className="w-full h-10 rounded-xl border border-slate-200 dark:border-raised bg-white dark:bg-sidebar text-xs text-foreground">
              <SelectValue placeholder="Todos los proyectos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los proyectos</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Status Filter */}
      <div className="w-full sm:w-auto sm:min-w-[150px]">
        <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val)}>
          <SelectTrigger className="w-full h-10 rounded-xl border border-slate-200 dark:border-raised bg-white dark:bg-sidebar text-xs text-foreground">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="ASISTENCIA">Asistencia</SelectItem>
            <SelectItem value="TARDE">Tarde</SelectItem>
            <SelectItem value="FALTA">Falta</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-2 sm:flex items-center gap-3 w-full sm:w-auto">
        <button
          onClick={onRefresh}
          className="flex items-center justify-center gap-2 px-4 h-10 rounded-xl border border-slate-200 dark:border-raised bg-white dark:bg-sidebar text-sm font-medium text-foreground hover:bg-slate-50 dark:hover:bg-surface transition-colors cursor-pointer"
        >
          <RefreshCw
            className={`w-4 h-4 text-muted-foreground ${
              isLoading ? "animate-spin" : ""
            }`}
          />
          Actualizar
        </button>

        <button
          onClick={onExportCSV}
          disabled={!canExport || isLoading}
          title={
            !canExport
              ? "No hay asistencias registradas para exportar"
              : "Exportar asistencias a CSV"
          }
          className="flex items-center justify-center gap-2 px-4 h-10 rounded-xl text-sm font-medium border border-green/30 text-green-ink dark:text-green bg-green/10 hover:bg-green/20 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>
    </div>
  );
}
