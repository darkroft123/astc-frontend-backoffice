"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import { StatusBadge } from "@/components/atoms/status-badge";
import {
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Search,
  Folder,
  RefreshCw,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  getAllProjects,
  getAllUsers,
  listTeamAttendance,
  exportAttendance,
  User,
} from "@/app/services/project.assistance.service";
import { LocationCell } from "@/components/atoms/LocationCell";

type Period =
  | "today"
  | "thisweek"
  | "month"
  | "3months"
  | "6months"
  | "9months"
  | "total"
  | "custom";

const PERIOD_TABS: { id: Period; label: string; icon?: boolean }[] = [
  { id: "today", label: "Hoy" },
  { id: "thisweek", label: "Esta semana" },
  { id: "month", label: "Este mes" },
  { id: "3months", label: "3 meses" },
  { id: "6months", label: "6 meses" },
  { id: "9months", label: "9 meses" },
  { id: "total", label: "Total" },
  { id: "custom", label: "Personalizado", icon: true },
];

export function PMAttendanceView() {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [rawAttendances, setRawAttendances] = useState<any[]>([]);

  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userMap, setUserMap] = useState<Record<string, User>>({});

  const [activePeriod, setActivePeriod] = useState<Period>("month");
  const [selectedProject, setSelectedProject] = useState("all");
  const [selectedRole, setSelectedRole] = useState<"ALL" | "PROJECT_MANAGER" | "TEAM_MEMBER">("ALL");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (!token) return;
    Promise.all([
      getAllProjects(token).catch(() => []),
      getAllUsers(token).catch(() => []),
    ]).then(([projs, userList]) => {
      setProjects(projs || []);
      setUsers(userList || []);
      const map: Record<string, User> = {};
      for (const u of userList || []) {
        map[u.id] = u;
      }
      setUserMap(map);
    });
  }, [token]);

  const fetchAttendance = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const data = await listTeamAttendance(
        token,
        selectedProject === "all" ? undefined : selectedProject,
        undefined,
        statusFilter === "all" ? undefined : statusFilter
      );

      let list = Array.isArray(data) ? data : [];
      if (selectedRole !== "ALL") {
        list = list.filter((item: any) => {
          const u = userMap[item.userId] || item.user;
          const roleCode = u?.roleCode || (u as any)?.role;
          return roleCode === selectedRole;
        });
      }

      setRawAttendances(list);
    } catch (err) {
      console.error("Error fetching attendance in PMAttendanceView:", err);
      setRawAttendances([]);
    } finally {
      setIsLoading(false);
    }
  }, [token, selectedProject, selectedRole, statusFilter, userMap]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const projectMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of projects) {
      map[p.id] = p.name;
    }
    return map;
  }, [projects]);

  const rows = useMemo(() => {
    return rawAttendances.map((item) => {
      const u = userMap[item.userId] || item.user;
      const userName = u
        ? `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username || u.email
        : `Usuario (${item.userId?.slice(0, 8) || "—"})`;
      const projectName = item.projectName || (item.projectId ? projectMap[item.projectId] || item.projectId : "Gestión General");

      return {
        id: item.id,
        userId: item.userId,
        user: u,
        userName,
        userRole: u?.roleCode || (u as any)?.role || "TEAM_MEMBER",
        projectName,
        date: item.date,
        checkIn: item.checkIn ? item.checkIn.substring(0, 5) : "—",
        checkOut: item.checkOut ? item.checkOut.substring(0, 5) : null,
        status: item.status || "ASISTENCIA",
        locationName: item.locationName || "Condevilla Señor",
        latitude: item.latitude || -12.0123,
        longitude: item.longitude || -77.0543,
      };
    });
  }, [rawAttendances, userMap, projectMap]);

  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return rows;
    const lower = searchTerm.toLowerCase();
    return rows.filter(
      (r) =>
        r.userName.toLowerCase().includes(lower) ||
        r.projectName.toLowerCase().includes(lower) ||
        r.date.includes(lower)
    );
  }, [rows, searchTerm]);

  const metrics = useMemo(() => {
    const total = filteredRows.length;
    const onTime = filteredRows.filter(
      (r) =>
        r.status.includes("ON_TIME") ||
        r.status === "ASISTENCIA" ||
        r.status === "PRESENTE"
    ).length;
    const late = filteredRows.filter((r) => r.status.includes("LATE") || r.status === "TARDE").length;
    const absences = filteredRows.filter((r) => r.status === "FALTA" || r.status === "EARLY_DEPARTURE").length;
    const rate = total > 0 ? Math.round((onTime / total) * 100) : 100;
    return { total, onTime, late, absences, rate };
  }, [filteredRows]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize]);

  const handleExportCSV = async () => {
    if (!token) return;
    try {
      const result = await exportAttendance(token, {
        projectId: selectedProject === "all" ? undefined : selectedProject,
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      if (result?.content) {
        const blob = new Blob([result.content], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.fileName || "asistencias.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Error exporting CSV:", err);
    }
  };

  const formatDateDisplay = (dStr: string) => {
    if (!dStr) return "—";
    try {
      const parts = dStr.split("-");
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      const d = new Date(dStr);
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dStr;
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
            Historial de asistencias
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Auditoría y control de asistencias de jefes de proyecto y colaboradores en todos los proyectos.
          </p>
        </div>

        {/* PERIOD / DATE SELECTOR BAR */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#121320] border border-slate-200/60 dark:border-[#1e2030] overflow-x-auto">
            {PERIOD_TABS.map((tab) => {
              const isActive = activePeriod === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActivePeriod(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-white dark:bg-[#1a1b2d] text-foreground dark:text-white shadow-xs border border-slate-200/80 dark:border-[#2e3048] font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.icon && <Calendar className="w-3.5 h-3.5" />}
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#1e2030] bg-white dark:bg-[#0c0d16] text-xs font-mono text-blue-500 dark:text-blue-400 shadow-xs">
            <Calendar className="w-3.5 h-3.5" />
            <span>01/09/2026 → 03/09/2026</span>
          </div>
        </div>

        {/* 4 METRIC CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total registros */}
          <div className="rounded-xl p-4 flex flex-col justify-between h-[100px] border bg-white dark:bg-[#0c0d16]/90 border-slate-200/80 dark:border-[#1e2030] shadow-xs">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-[#161726] border border-slate-200 dark:border-[#222438] text-muted-foreground">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-xs text-muted-foreground">Total registros</span>
            </div>
            <span className="text-2xl font-bold text-foreground">{metrics.total}</span>
          </div>

          {/* Card 2: Presentes */}
          <div className="rounded-xl p-4 flex flex-col justify-between h-[100px] border bg-[#ecfdf5] dark:bg-[#0b1614]/90 border-emerald-200/70 dark:border-[#14382c] shadow-xs">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500/15 border border-emerald-500/25 text-emerald-500 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Presentes</span>
            </div>
            <span className="text-2xl font-bold text-foreground">{metrics.onTime}</span>
          </div>

          {/* Card 3: Faltas / tardanzas */}
          <div className="rounded-xl p-4 flex flex-col justify-between h-[100px] border bg-[#fef2f2] dark:bg-[#180e14]/90 border-rose-200/70 dark:border-[#381622] shadow-xs">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-rose-500/15 border border-rose-500/25 text-rose-500 dark:text-rose-400">
                <XCircle className="w-4 h-4" />
              </div>
              <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">Faltas / tardanzas</span>
            </div>
            <span className="text-2xl font-bold text-foreground">{metrics.late + metrics.absences}</span>
          </div>

          {/* Card 4: % asistencia */}
          <div className="rounded-xl p-4 flex flex-col justify-between h-[100px] border bg-white dark:bg-[#0c0d16]/90 border-slate-200/80 dark:border-[#1e2030] shadow-xs">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-500/10 border border-blue-500/20 text-blue-500">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-xs text-muted-foreground">% asistencia</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-foreground">{metrics.rate}%</span>
              <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-[#1a1b2d] mt-2 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-400"
                  style={{ width: `${Math.min(100, Math.max(0, metrics.rate))}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              placeholder="Colaborador o proyecto..."
              className="w-full pl-9 pr-4 h-10 rounded-xl border border-slate-200 dark:border-[#1e2030] bg-white dark:bg-[#0c0d16] text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative min-w-[140px]">
            <select
              className="w-full appearance-none pl-3 pr-8 h-10 rounded-xl border border-slate-200 dark:border-[#1e2030] bg-white dark:bg-[#0c0d16] text-sm text-foreground focus:outline-none cursor-pointer"
              value={selectedRole}
              onChange={(e: any) => setSelectedRole(e.target.value)}
            >
              <option value="ALL">Todos los roles</option>
              <option value="ADMIN">Administrador</option>
              <option value="PROJECT_MANAGER">Jefes de proyecto</option>
              <option value="TEAM_MEMBER">Colaboradores</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>

          <div className="relative min-w-[170px]">
            <select
              className="w-full appearance-none pl-3 pr-8 h-10 rounded-xl border border-slate-200 dark:border-[#1e2030] bg-white dark:bg-[#0c0d16] text-sm text-foreground focus:outline-none cursor-pointer"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
            >
              <option value="all">Todos los proyectos</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>

          <div className="relative min-w-[150px]">
            <select
              className="w-full appearance-none pl-3 pr-8 h-10 rounded-xl border border-slate-200 dark:border-[#1e2030] bg-white dark:bg-[#0c0d16] text-sm text-foreground focus:outline-none cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Todos los estados</option>
              <option value="ASISTENCIA">Asistencia</option>
              <option value="TARDE">Tarde</option>
              <option value="FALTA">Falta</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>

          <button
            onClick={fetchAttendance}
            className="flex items-center gap-2 px-4 h-10 rounded-xl border border-slate-200 dark:border-[#1e2030] bg-white dark:bg-[#0c0d16] text-sm font-medium text-foreground hover:bg-slate-50 dark:hover:bg-[#141524] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-muted-foreground ${isLoading ? "animate-spin" : ""}`} />
            Actualizar
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 h-10 rounded-xl text-sm font-medium border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>

        {/* ATTENDANCE TABLE */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-[#171825] bg-white dark:bg-[#0b0c14] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/80 dark:border-[#171825] bg-muted/30 dark:bg-transparent">
                  <th className="py-3.5 px-5 font-mono text-[10.5px] uppercase tracking-wider font-semibold text-muted-foreground dark:text-[#6e7494]">
                    COLABORADOR
                  </th>
                  <th className="py-3.5 px-5 font-mono text-[10.5px] uppercase tracking-wider font-semibold text-muted-foreground dark:text-[#6e7494]">
                    PROYECTO
                  </th>
                  <th className="py-3.5 px-5 font-mono text-[10.5px] uppercase tracking-wider font-semibold text-muted-foreground dark:text-[#6e7494]">
                    FECHA
                  </th>
                  <th className="py-3.5 px-5 font-mono text-[10.5px] uppercase tracking-wider font-semibold text-muted-foreground dark:text-[#6e7494]">
                    ENTRADA
                  </th>
                  <th className="py-3.5 px-5 font-mono text-[10.5px] uppercase tracking-wider font-semibold text-muted-foreground dark:text-[#6e7494]">
                    SALIDA
                  </th>
                  <th className="py-3.5 px-5 font-mono text-[10.5px] uppercase tracking-wider font-semibold text-muted-foreground dark:text-[#6e7494]">
                    ESTADO
                  </th>
                  <th className="py-3.5 px-5 font-mono text-[10.5px] uppercase tracking-wider font-semibold text-muted-foreground dark:text-[#6e7494]">
                    UBICACIÓN GPS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 dark:divide-[#171825]/60">
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                      No hay registros de asistencias para los filtros seleccionados
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((r, index) => {
                    const initials =
                      ((r.user?.firstName?.[0] || "") + (r.user?.lastName?.[0] || "") ||
                        r.userName?.[0] ||
                        "C").toUpperCase();
                    const isAdmin =
                      r.userRole === "ADMIN" ||
                      r.user?.roleCode === "ADMIN" ||
                      r.user?.role === "ADMIN" ||
                      r.userName?.toLowerCase().includes("admin");
                    const isPm = !isAdmin && (r.userRole === "PROJECT_MANAGER" || r.user?.roleCode === "PROJECT_MANAGER");

                    return (
                      <tr
                        key={r.id}
                        className={`border-b border-border/40 dark:border-[#1a1e30] transition-colors ${
                          index % 2 === 0
                            ? "bg-muted/30 dark:bg-[#121626]/50 hover:bg-muted/50 dark:hover:bg-[#181d33]/60"
                            : "bg-transparent hover:bg-muted/20 dark:hover:bg-[#121626]/40"
                        }`}
                      >
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#38bdf8] via-[#818cf8] to-[#c084fc] flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
                              {initials}
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-foreground">{r.userName}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${
                                    isAdmin
                                      ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                                      : isPm
                                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                      : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                                  }`}
                                >
                                  {isAdmin ? "Administrador" : isPm ? "Jefe de proyecto" : "Colaborador"}
                                </span>
                                {r.user?.email && (
                                  <span className="text-[11px] text-muted-foreground truncate max-w-[150px]">
                                    {r.user.email}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                            <Folder className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span>{r.projectName}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-5 text-xs font-mono text-foreground">
                          {formatDateDisplay(r.date)}
                        </td>

                        <td className="py-3.5 px-5 text-xs font-mono text-foreground">
                          {r.checkIn}
                        </td>

                        <td className="py-3.5 px-5 text-xs font-mono text-foreground">
                          {r.checkOut ? (
                            r.checkOut
                          ) : (
                            <span className="text-muted-foreground italic">Sin salida</span>
                          )}
                        </td>

                        <td className="py-3.5 px-5">
                          <StatusBadge status={r.status} />
                        </td>

                        <td className="py-3.5 px-5">
                          <LocationCell
                            locationName={r.locationName}
                            latitude={r.latitude}
                            longitude={r.longitude}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* FOOTER */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-100 dark:border-[#171825] bg-slate-50/30 dark:bg-transparent">
            <span className="text-xs text-muted-foreground">
              {filteredRows.length} {filteredRows.length === 1 ? "registro" : "registros"}
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
      </div>
    </div>
  );
}
