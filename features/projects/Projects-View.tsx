"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import {
  Folder,
  Check,
  Ban,
  Search,
  Filter,
  RefreshCw,
  PlusSquare,
  Users,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { getAllProjects, deleteProject } from "@/app/services/project.assistance.service";
import type { Project } from "@/components/types/dashboard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DeleteProjectModal from "@/components/features/projects/DeleteProjectModal";

export function ProjectsManagementView({ context = "ADMIN" }: { context?: "ADMIN" | "PM" }) {
  const router = useRouter();
  const { token, hydrated } = useAuth();
  const isAdmin = context === "ADMIN";
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [page, setPage] = useState(1);
  const [selectedProjectForMembers, setSelectedProjectForMembers] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("all");

  async function fetchProjects() {
    if (!hydrated || !token) return;
    setIsLoading(true);
    try {
      const data = await getAllProjects(token);
      const sorted = [...(data ?? [])].sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      setProjects(sorted);
    } catch (err) {
      console.error("Error fetching projects:", err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeleteConfirm() {
    try {
      if (!token || !projectToDelete) return;
      await deleteProject(token, projectToDelete.id);
      setProjectToDelete(null);
      await fetchProjects();
    } catch (err) {
      console.error("Delete error:", err);
    }
  }

  useEffect(() => {
    fetchProjects();
  }, [hydrated, token]);

  useEffect(() => {
    setPage(1);
  }, [search, estadoFilter]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.id.toLowerCase().includes(search.toLowerCase());
      const matchesEstado = estadoFilter === "all" || p.status === estadoFilter;
      return matchesSearch && matchesEstado;
    });
  }, [projects, search, estadoFilter]);

  const totalProjects = filteredProjects.length;
  const activeProjects = filteredProjects.filter((p) => p.status === "ACTIVE").length;
  const inactiveProjects = filteredProjects.filter((p) => p.status === "INACTIVE").length;

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / pageSize));

  const paginatedProjects = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredProjects.slice(start, start + pageSize);
  }, [filteredProjects, page, pageSize]);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = String(d.getFullYear()).slice(-2);
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-7xl mx-auto px-4 py-6 md:px-8 space-y-6">
        {/* HEADER */}
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.05em] bg-primary/10 text-primary border border-primary/20 dark:bg-[#1a2238]/80 dark:text-[#7c9aff] dark:border-[#2b3758] px-2.5 py-0.5 rounded-full">
              CONTROL GLOBAL
            </span>
            <span className="font-sans text-xs text-muted-foreground">
              · Panel administrativo
            </span>
          </div>
          <h1 className="text-[26px] font-bold text-foreground tracking-tight leading-tight">
            Gestión de proyectos
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Administración de proyectos, configuración y asignación de recursos del sistema.
          </p>
        </div>

        {/* 3 METRIC CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Total */}
          <div className="rounded-xl p-4 flex flex-col justify-between h-[100px] border bg-white dark:bg-[#0c0d16]/90 border-slate-200/80 dark:border-[#1e2030] shadow-xs">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-[#161726] border border-slate-200 dark:border-[#222438] text-muted-foreground">
                <Folder className="w-4 h-4" />
              </div>
              <span className="text-xs text-muted-foreground">Total</span>
            </div>
            <span className="text-2xl font-bold text-foreground">{totalProjects}</span>
          </div>

          {/* Card 2: Activos */}
          <div className="rounded-xl p-4 flex flex-col justify-between h-[100px] border bg-[#ecfdf5] dark:bg-[#0b1614]/90 border-emerald-200/70 dark:border-[#14382c] shadow-xs">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500/15 border border-emerald-500/25 text-emerald-500 dark:text-emerald-400">
                <Check className="w-4 h-4" />
              </div>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Activos</span>
            </div>
            <span className="text-2xl font-bold text-foreground">{activeProjects}</span>
          </div>

          {/* Card 3: Inactivos */}
          <div className="rounded-xl p-4 flex flex-col justify-between h-[100px] border bg-[#fef2f2] dark:bg-[#180e14]/90 border-rose-200/70 dark:border-[#381622] shadow-xs">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-rose-500/15 border border-rose-500/25 text-rose-500 dark:text-rose-400">
                <Ban className="w-4 h-4" />
              </div>
              <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">Inactivos</span>
            </div>
            <span className="text-2xl font-bold text-foreground">{inactiveProjects}</span>
          </div>
        </div>

        {/* FILTER & ACTIONS BAR */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              placeholder="Buscar por nombre o ID..."
              className="w-full pl-9 pr-4 h-10 rounded-xl border border-slate-200 dark:border-[#1e2030] bg-white dark:bg-[#0c0d16] text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <select
              className="appearance-none pl-9 pr-8 h-10 rounded-xl border border-slate-200 dark:border-[#1e2030] bg-white dark:bg-[#0c0d16] text-sm text-foreground focus:outline-none cursor-pointer"
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
            >
              <option value="all">Todos los estados</option>
              <option value="ACTIVE">Activos</option>
              <option value="INACTIVE">Inactivos</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>

          <button
            onClick={fetchProjects}
            className="flex items-center gap-2 px-4 h-10 rounded-xl border border-slate-200 dark:border-[#1e2030] bg-white dark:bg-[#0c0d16] text-sm font-medium text-foreground hover:bg-slate-50 dark:hover:bg-[#141524] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-muted-foreground ${isLoading ? "animate-spin" : ""}`} />
            Actualizar
          </button>

          {isAdmin && (
            <button
              onClick={() => router.push("/projects/create")}
              className="flex items-center gap-2 px-5 h-10 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 shadow-md shadow-purple-500/20 transition-all cursor-pointer"
            >
              <PlusSquare className="w-4 h-4" />
              Crear proyecto
            </button>
          )}
        </div>

        {/* PROJECTS TABLE */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-[#171825] bg-white dark:bg-[#0b0c14] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/80 dark:border-[#171825] bg-muted/30 dark:bg-transparent">
                  <th className="py-3.5 px-5 font-mono text-[10.5px] uppercase tracking-wider font-semibold text-muted-foreground dark:text-[#6e7494]">
                    PROYECTO
                  </th>
                  <th className="py-3.5 px-5 font-mono text-[10.5px] uppercase tracking-wider font-semibold text-muted-foreground dark:text-[#6e7494]">
                    INICIO
                  </th>
                  <th className="py-3.5 px-5 font-mono text-[10.5px] uppercase tracking-wider font-semibold text-muted-foreground dark:text-[#6e7494]">
                    FIN
                  </th>
                  <th className="py-3.5 px-5 font-mono text-[10.5px] uppercase tracking-wider font-semibold text-muted-foreground dark:text-[#6e7494]">
                    ESTADO
                  </th>
                  <th className="py-3.5 px-5 font-mono text-[10.5px] uppercase tracking-wider font-semibold text-muted-foreground dark:text-[#6e7494]">
                    RESPONSABLE
                  </th>
                  <th className="py-3.5 px-5 font-mono text-[10.5px] uppercase tracking-wider font-semibold text-muted-foreground dark:text-[#6e7494] text-right">
                    ACCIONES
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 dark:divide-[#171825]/60">
                {paginatedProjects.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                      No hay proyectos para mostrar
                    </td>
                  </tr>
                ) : (
                  paginatedProjects.map((p) => {
                    const responsibleMember =
                      p.members?.find((m: any) => m.role === "PROJECT_MANAGER") || p.members?.[0];
                    const u = (p as any).responsible || responsibleMember?.user || {
                      username: "jefeproyecto-x",
                      firstName: "jefeproyecto-x",
                      lastName: "",
                    };

                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-[#121320]/50 transition-colors"
                      >
                        <td className="py-3.5 px-5">
                          <p className="font-semibold text-sm text-foreground">{p.name}</p>
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">{p.id}</p>
                        </td>
                        <td className="py-3.5 px-5 text-sm font-mono text-foreground">
                          {formatDate(p.startDate)}
                        </td>
                        <td className="py-3.5 px-5 text-sm font-mono text-foreground">
                          {formatDate(p.endDate)}
                        </td>
                        <td className="py-3.5 px-5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {p.status === "ACTIVE"
                              ? "Activo"
                              : p.status === "INACTIVE"
                              ? "Inactivo"
                              : p.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#38bdf8] via-[#818cf8] to-[#c084fc] flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
                              {((u.firstName?.[0] || u.username?.[0] || "J") as string).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-foreground">
                                {u.firstName ? `${u.firstName} ${u.lastName || ""}`.trim() : u.username}
                              </p>
                              <p className="text-[11px] text-muted-foreground">@{u.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => setSelectedProjectForMembers(p)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#1e2030] bg-white dark:bg-[#121320] text-xs font-medium text-foreground hover:bg-slate-50 dark:hover:bg-[#1a1b2d] transition-colors"
                            >
                              <Users className="w-3.5 h-3.5 text-muted-foreground" />
                              Miembros
                            </button>
                            {isAdmin && (
                              <>
                                <button
                                  onClick={() => router.push(`/projects/edit/${p.id}`)}
                                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-[#1a1b2d] transition-colors"
                                  title="Editar proyecto"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setProjectToDelete(p)}
                                  className="p-1.5 rounded-lg text-rose-500 hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                                  title="Eliminar proyecto"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION / FOOTER */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-100 dark:border-[#171825] bg-slate-50/30 dark:bg-transparent">
            <span className="text-xs text-muted-foreground">
              {totalProjects} {totalProjects === 1 ? "proyecto" : "proyectos"}
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-[#1e2030] text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-muted-foreground">
                Página {page} de {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-[#1e2030] text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* MODAL MIEMBROS */}
        <Dialog
          open={!!selectedProjectForMembers}
          onOpenChange={(open) => !open && setSelectedProjectForMembers(null)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Miembros de {selectedProjectForMembers?.name}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {selectedProjectForMembers?.members && selectedProjectForMembers.members.length > 0 ? (
                <div className="space-y-3">
                  {selectedProjectForMembers.members.map((m: any, idx: number) => {
                    const u = m.user;
                    return (
                      <div
                        key={idx}
                        className="flex justify-between items-center p-2.5 bg-muted/50 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#38bdf8] via-[#818cf8] to-[#c084fc] flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
                            {((u?.firstName?.[0] || u?.username?.[0] || "C") as string).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground text-sm">
                              {u ? `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username : "Colaborador"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              @{u?.username || m.userId}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-medium">
                          {m.role || "TEAM_MEMBER"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay miembros asignados a este proyecto.
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* DELETE MODAL */}
        {projectToDelete && (
          <DeleteProjectModal
            projectName={projectToDelete.name}
            projectId={projectToDelete.id}
            onConfirm={handleDeleteConfirm}
            onCancel={() => setProjectToDelete(null)}
          />
        )}
      </div>
    </div>
  );
}
