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
type Project = any;
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
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
      <div className="max-w-7xl mx-auto px-0 md:px-8 py-2 md:py-6 space-y-6">
        {/* HEADER */}
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.05em] bg-primary/10 text-primary border border-primary/20 dark:bg-violet/10 dark:text-[#7c9aff] dark:border-violet/20 px-2.5 py-0.5 rounded-full">
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

        {/* 3 METRIC CARDS (MATCHING SVG: 3 cols side by side) */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
          {/* Card 1: Total */}
          <div className="rounded-2xl p-3 sm:p-4 flex flex-col justify-between min-h-[96px] border bg-white dark:bg-[#101322] border-border dark:border-[#1E2335] shadow-xs transition-colors">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center bg-muted/60 dark:bg-surface border border-border dark:border-field text-muted-foreground">
              <Folder className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="mt-2.5">
              <span className="text-[10px] sm:text-[11px] text-muted-foreground font-medium block truncate">Total</span>
              <span className="text-2xl sm:text-3xl font-bold text-foreground dark:text-white block mt-0.5 leading-none">{totalProjects}</span>
            </div>
          </div>

          {/* Card 2: Activos */}
          <div className="rounded-2xl p-3 sm:p-4 flex flex-col justify-between min-h-[96px] border bg-[#ECFDF5] dark:bg-[#0C1F1F] border-[#A7F3D0] dark:border-[#164745] shadow-xs transition-colors">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center bg-[#D1FAE5] dark:bg-[#112F2E] border border-[#A7F3D0] dark:border-[#1E5752] text-[#059669] dark:text-[#10B981]">
              <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="mt-2.5">
              <span className="text-[10px] sm:text-[11px] text-[#059669] dark:text-[#10B981] font-medium block truncate">Activos</span>
              <span className="text-2xl sm:text-3xl font-bold text-foreground dark:text-white block mt-0.5 leading-none">{activeProjects}</span>
            </div>
          </div>

          {/* Card 3: Inactivos */}
          <div className="rounded-2xl p-3 sm:p-4 flex flex-col justify-between min-h-[96px] border bg-[#FEF2F2] dark:bg-[#1F1218] border-[#FECACA] dark:border-[#441C25] shadow-xs transition-colors">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center bg-[#FEE2E2] dark:bg-[#2D161F] border border-[#FECACA] dark:border-[#521C27] text-[#DC2626] dark:text-[#EF4444]">
              <Ban className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="mt-2.5">
              <span className="text-[10px] sm:text-[11px] text-[#DC2626] dark:text-[#EF4444] font-medium block truncate">Inactivos</span>
              <span className="text-2xl sm:text-3xl font-bold text-foreground dark:text-white block mt-0.5 leading-none">{inactiveProjects}</span>
            </div>
          </div>
        </div>

        {/* FILTER & ACTIONS BAR (MATCHING SVG: search, filter+refresh, button wrapped in container card on mobile) */}
        <div className="bg-card dark:bg-[#101322] border border-border dark:border-[#1E2335] rounded-2xl p-3.5 space-y-3 shadow-xs md:bg-transparent md:border-0 md:p-0 md:space-y-0 md:shadow-none md:flex md:flex-row md:items-center md:gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              placeholder="Buscar por nombre o ID..."
              className="w-full pl-9 pr-4 h-11 md:h-10 rounded-xl border border-border dark:border-[#1E2335] bg-white dark:bg-[#141829] text-xs md:text-sm text-foreground dark:text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-violet transition-colors"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 md:flex-initial min-w-[150px]">
              <Select value={estadoFilter} onValueChange={(val) => setEstadoFilter(val)}>
                <SelectTrigger className="w-full h-11 md:h-10 rounded-xl border border-border dark:border-[#1E2335] bg-white dark:bg-[#141829] text-xs md:text-sm text-foreground dark:text-white font-normal">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <SelectValue placeholder="Todos los estados" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="ACTIVE">Activos</SelectItem>
                  <SelectItem value="INACTIVE">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <button
              onClick={fetchProjects}
              title="Actualizar"
              className="w-11 md:w-auto h-11 md:h-10 px-3 md:px-4 rounded-xl border border-border dark:border-[#1E2335] bg-white dark:bg-[#141829] text-xs md:text-sm font-medium text-muted-foreground dark:text-[#8F96AE] hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-surface transition-colors flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              <span className="hidden md:inline">Actualizar</span>
            </button>
          </div>

          {isAdmin && (
            <button
              onClick={() => router.push("/projects/create")}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-5 h-11 md:h-10 rounded-xl text-xs md:text-sm font-semibold text-white bg-gradient-to-r from-[#5B8CFF] to-[#A855F7] hover:opacity-95 shadow-md shadow-purple-500/20 transition-all cursor-pointer"
            >
              <PlusSquare className="w-4 h-4" />
              <span>Crear proyecto</span>
            </button>
          )}
        </div>

        {/* MOBILE CARDS (Matches dark-gestion proyectos.svg & light-gestion proyectos.svg) */}
        <div className="md:hidden space-y-3">
          {paginatedProjects.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground bg-card dark:bg-[#101322] border border-dashed border-border dark:border-[#1E2335] rounded-2xl">
              No hay proyectos para mostrar
            </div>
          ) : (
            paginatedProjects.map((p) => {
              const responsibleMember =
                p.members?.find((m: any) => m.role === "PROJECT_MANAGER") || p.members?.[0];
              const u = (p as any).responsible || responsibleMember?.user || {
                username: "jefeproyecto-x",
                firstName: "jefeproyecto-x",
                lastName: "",
              };
              const initialLetter = ((u.firstName?.[0] || u.username?.[0] || "J") as string).toUpperCase();
              const displayName = u.firstName ? `${u.firstName} ${u.lastName || ""}`.trim() : u.username;

              return (
                <div
                  key={p.id}
                  className="bg-card dark:bg-[#101322] border border-border dark:border-[#1E2335] rounded-2xl p-4 space-y-3 shadow-xs dark:shadow-sm hover:border-[#2A314A] transition-colors"
                >
                  {/* Top Row: Name, ID + Status Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm text-foreground dark:text-white truncate">
                        {p.name}
                      </h3>
                      <p className="text-xs text-muted-foreground dark:text-[#8F96AE] font-mono truncate mt-0.5">
                        {p.id}
                      </p>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 ${
                        p.status === "ACTIVE"
                          ? "bg-[#10B981]/10 text-[#047857] border border-[#10B981]/20 dark:bg-[#10B981]/15 dark:text-[#10B981] dark:border-[#164D3F]"
                          : "bg-[#EF4444]/10 text-[#DC2626] border border-[#EF4444]/20 dark:bg-[#EF4444]/15 dark:text-[#EF4444] dark:border-[#4A1D27]"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          p.status === "ACTIVE" ? "bg-[#10B981]" : "bg-[#EF4444]"
                        }`}
                      />
                      {p.status === "ACTIVE" ? "Activo" : "Inactivo"}
                    </span>
                  </div>

                  {/* Description row if available */}
                  {p.description && (
                    <p className="text-xs text-muted-foreground dark:text-[#8F96AE] truncate -mt-1">
                      {p.description}
                    </p>
                  )}

                  {/* Dates Box Row: INICIO & FIN */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-[#F6F7FB] dark:bg-[#141829] border border-border/80 dark:border-[#1E2335] rounded-xl p-2.5">
                      <span className="text-[10px] font-mono uppercase text-[#6D4FD6] dark:text-[#A855F7] tracking-wider block font-semibold">
                        INICIO
                      </span>
                      <span className="font-mono text-xs font-bold text-foreground dark:text-white mt-0.5 block">
                        {formatDate(p.startDate)}
                      </span>
                    </div>

                    <div className="bg-[#F6F7FB] dark:bg-[#141829] border border-border/80 dark:border-[#1E2335] rounded-xl p-2.5">
                      <span className="text-[10px] font-mono uppercase text-[#6D4FD6] dark:text-[#A855F7] tracking-wider block font-semibold">
                        FIN
                      </span>
                      <span className="font-mono text-xs font-bold text-foreground dark:text-white mt-0.5 block">
                        {formatDate(p.endDate)}
                      </span>
                    </div>
                  </div>

                  {/* Responsable Row */}
                  <div className="flex items-center gap-2.5 pt-1">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0"
                      style={{
                        background: "linear-gradient(135deg, #5B8CFF 0%, #A855F7 55%, #22C3E6 100%)",
                      }}
                    >
                      {initialLetter}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-foreground dark:text-white truncate">
                        {displayName}
                      </p>
                      <p className="text-[11px] text-muted-foreground dark:text-[#8F96AE] truncate">
                        Responsable
                      </p>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center gap-2 pt-2 border-t border-border/80 dark:border-[#1E2335]">
                    <button
                      onClick={() => setSelectedProjectForMembers(p)}
                      className="flex-1 h-9 px-3 rounded-xl border border-border dark:border-[#1E2335] bg-[#F6F7FB] dark:bg-[#141829] hover:bg-muted dark:hover:bg-[#1C2238] text-xs font-semibold text-foreground dark:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5 text-muted-foreground dark:text-[#8F96AE]" />
                      <span>Miembros ({p.members?.length || 0})</span>
                    </button>

                    {isAdmin && (
                      <>
                        <button
                          onClick={() => router.push(`/projects/edit/${p.id}`)}
                          className="w-9 h-9 rounded-xl border border-border dark:border-[#1E2335] bg-[#F6F7FB] dark:bg-[#141829] hover:bg-muted dark:hover:bg-[#1C2238] flex items-center justify-center text-muted-foreground dark:text-[#8F96AE] hover:text-foreground dark:hover:text-white transition-colors cursor-pointer shrink-0"
                          title="Editar proyecto"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setProjectToDelete(p)}
                          className="w-9 h-9 rounded-xl border border-[#EF4444]/20 dark:border-[#4D1C27] bg-[#EF4444]/[0.06] dark:bg-[#24131A] hover:bg-[#EF4444]/15 dark:hover:bg-[#321721] flex items-center justify-center text-[#DC2626] dark:text-[#EF4444] transition-colors cursor-pointer shrink-0"
                          title="Eliminar proyecto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* MOBILE PAGINATION (MATCHING SVG) */}
        <div className="md:hidden flex items-center justify-between px-1 pt-1">
          <span className="text-xs text-muted-foreground font-medium">
            {totalProjects} {totalProjects === 1 ? "proyecto" : "proyectos"}
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="h-9 w-9 rounded-xl border border-border bg-card dark:bg-[#141829] dark:border-[#1E2335] text-muted-foreground dark:text-[#8F96AE] hover:text-foreground dark:hover:text-white flex items-center justify-center disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-muted-foreground dark:text-[#8F96AE] font-medium px-1">
              Página {page} de {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="h-9 w-9 rounded-xl border border-border bg-card dark:bg-[#141829] dark:border-[#1E2335] text-muted-foreground dark:text-[#8F96AE] hover:text-foreground dark:hover:text-white flex items-center justify-center disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PROJECTS TABLE (DESKTOP) */}
        <div className="hidden md:block rounded-2xl border border-slate-200/80 dark:border-surface bg-white dark:bg-background overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/80 dark:border-surface bg-muted/30 dark:bg-transparent">
                  <th className="py-3.5 px-5 font-mono text-[10.5px] uppercase tracking-wider font-semibold text-muted-foreground dark:text-text-5">
                    PROYECTO
                  </th>
                  <th className="py-3.5 px-5 font-mono text-[10.5px] uppercase tracking-wider font-semibold text-muted-foreground dark:text-text-5">
                    INICIO
                  </th>
                  <th className="py-3.5 px-5 font-mono text-[10.5px] uppercase tracking-wider font-semibold text-muted-foreground dark:text-text-5">
                    FIN
                  </th>
                  <th className="py-3.5 px-5 font-mono text-[10.5px] uppercase tracking-wider font-semibold text-muted-foreground dark:text-text-5">
                    ESTADO
                  </th>
                  <th className="py-3.5 px-5 font-mono text-[10.5px] uppercase tracking-wider font-semibold text-muted-foreground dark:text-text-5">
                    RESPONSABLE
                  </th>
                  <th className="py-3.5 px-5 font-mono text-[10.5px] uppercase tracking-wider font-semibold text-muted-foreground dark:text-text-5 text-right">
                    ACCIONES
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 dark:divide-surface/60">
                {paginatedProjects.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                      No hay proyectos para mostrar
                    </td>
                  </tr>
                ) : (
                  paginatedProjects.map((p, index) => {
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
                        className={`border-b border-border/40 dark:border-raised transition-colors ${
                          index % 2 === 0
                            ? "bg-muted/30 dark:bg-surface/50 hover:bg-muted/50 dark:hover:bg-raised/60"
                            : "bg-transparent hover:bg-muted/20 dark:hover:bg-surface/40"
                        }`}
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
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green/10 text-green-ink dark:text-green border border-green/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-green" />
                            {p.status === "ACTIVE"
                              ? "Activo"
                              : p.status === "INACTIVE"
                              ? "Inactivo"
                              : p.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-avatar-gradient flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
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
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-raised bg-white dark:bg-surface text-xs font-medium text-foreground hover:bg-slate-50 dark:hover:bg-raised transition-colors"
                            >
                              <Users className="w-3.5 h-3.5 text-muted-foreground" />
                              Miembros
                            </button>
                            {isAdmin && (
                              <>
                                <button
                                  onClick={() => router.push(`/projects/edit/${p.id}`)}
                                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-raised transition-colors"
                                  title="Editar proyecto"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setProjectToDelete(p)}
                                  className="p-1.5 rounded-lg text-red hover:text-red-ink hover:bg-red/10 dark:hover:bg-red/15 transition-colors"
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-100 dark:border-surface bg-slate-50/30 dark:bg-transparent">
            <span className="text-xs text-muted-foreground">
              {totalProjects} {totalProjects === 1 ? "proyecto" : "proyectos"}
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-raised text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-muted-foreground">
                Página {page} de {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-raised text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
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
          <DialogContent className="sm:max-w-md bg-white dark:bg-[#12141F] border border-border dark:border-[#1E2335] text-foreground dark:text-white rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-foreground dark:text-white font-bold">Miembros de {selectedProjectForMembers?.name}</DialogTitle>
              <DialogDescription className="sr-only">Miembros asignados al proyecto</DialogDescription>
            </DialogHeader>
            <div className="py-2">
              {selectedProjectForMembers?.members && selectedProjectForMembers.members.length > 0 ? (
                <div className="space-y-2.5">
                  {selectedProjectForMembers.members.map((m: any, idx: number) => {
                    const u = m.user;
                    return (
                      <div
                        key={idx}
                        className="flex justify-between items-center p-3 bg-[#F8FAFC] dark:bg-[#181B2A] border border-border/80 dark:border-[#1E2335] rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-avatar-gradient flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
                            {((u?.firstName?.[0] || u?.username?.[0] || "C") as string).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground dark:text-white text-sm">
                              {u ? `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username : "Colaborador"}
                            </p>
                            <p className="text-xs text-muted-foreground dark:text-[#8F96AE]">
                              @{u?.username || m.userId}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs bg-primary/10 text-primary dark:bg-violet/15 dark:text-[#C084FC] px-2.5 py-0.5 rounded-full font-medium">
                          {m.role || "TEAM_MEMBER"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground dark:text-[#8F96AE] text-center py-4">
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
