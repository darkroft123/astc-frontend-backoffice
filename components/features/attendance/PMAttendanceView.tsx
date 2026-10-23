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
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  getAllProjects,
  getAllUsers,
  listTeamAttendance,
  exportAttendance,
} from "@/app/services/project.assistance.service";
type User = any;
import { LocationCell } from "@/components/atoms/LocationCell";

type Period =
  | "today"
  | "thisweek"
  | "month"
  | "3months"
  | "6months"
  | "9months"
  | "total";

const PERIOD_TABS: { id: Period; label: string }[] = [
  { id: "today", label: "Hoy" },
  { id: "thisweek", label: "Esta semana" },
  { id: "month", label: "Este mes" },
  { id: "3months", label: "3 meses" },
  { id: "6months", label: "6 meses" },
  { id: "9months", label: "9 meses" },
  { id: "total", label: "Total" },
];

export function PMAttendanceView() {
  const { user, role, token } = useAuth();
  const userRoleStr = (typeof role === "string" ? role : (user?.role as any)?.code || (user?.role as any) || "").toUpperCase();
  const isViewerAdmin = userRoleStr !== "PROJECT_MANAGER" && userRoleStr !== "TEAM_MEMBER";

  const [isLoading, setIsLoading] = useState(false);
  const [rawAttendances, setRawAttendances] = useState<any[]>([]);

  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userMap, setUserMap] = useState<Record<string, User>>({});

  const [activePeriod, setActivePeriod] = useState<Period>("month");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [customRange, setCustomRange] = useState({
    start: "2026-09-01",
    end: "2026-09-03",
  });
  const [tempStartDate, setTempStartDate] = useState("2026-09-01");
  const [tempEndDate, setTempEndDate] = useState("2026-09-03");

  const handleOpenCalendar = () => {
    setTempStartDate(customRange.start);
    setTempEndDate(customRange.end);
    setIsCalendarOpen(true);
  };

  const handlePreset = (daysOrType: number | "month") => {
    const today = new Date();
    const formatIso = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    if (daysOrType === "month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setTempStartDate(formatIso(firstDay));
      setTempEndDate(formatIso(today));
    } else {
      const past = new Date(today);
      past.setDate(today.getDate() - daysOrType);
      setTempStartDate(formatIso(past));
      setTempEndDate(formatIso(today));
    }
  };

  const handleApplyCustomRange = () => {
    if (tempStartDate && tempEndDate) {
      setCustomRange({ start: tempStartDate, end: tempEndDate });
      setIsCalendarOpen(false);
    }
  };

  const dateRangeDisplay = useMemo(() => {
    const formatIso = (iso: string) => {
      try {
        const parts = iso.split("-");
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      } catch {}
      return iso;
    };
    return `${formatIso(customRange.start)} → ${formatIso(customRange.end)}`;
  }, [customRange]);

  const [selectedProject, setSelectedProject] = useState("all");
  const [selectedRole, setSelectedRole] = useState<"ALL" | "ADMIN" | "PROJECT_MANAGER" | "TEAM_MEMBER">("ALL");
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
      <div className="w-full max-w-7xl mx-auto space-y-6">
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
            Historial de asistencias
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Auditoría y control de asistencias de jefes de proyecto y colaboradores en todos los proyectos.
          </p>
        </div>

        {/* PERIOD / DATE SELECTOR BAR */}
        {/* MOBILE VIEW (MATCHING Figma dark-historial de asistencia.svg & light-historial de asistencia.svg) */}
        <div className="md:hidden space-y-2.5">
          {/* 2-row Period tabs container */}
          <div className="p-2 sm:p-2.5 rounded-2xl bg-slate-100 dark:bg-[#0D101D] border border-slate-200/60 dark:border-[#1E2338]">
            {/* Row 1: 4 tabs */}
            <div className="grid grid-cols-4 gap-1 text-center">
              {PERIOD_TABS.slice(0, 4).map((tab) => {
                const isActive = activePeriod === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActivePeriod(tab.id)}
                    className={`py-1.5 px-1 rounded-xl text-xs transition-all cursor-pointer ${
                      isActive
                        ? "bg-white dark:bg-[#1E243A] text-foreground dark:text-white font-semibold shadow-xs border border-slate-200/80 dark:border-[#2e3048]"
                        : "text-muted-foreground hover:text-foreground dark:text-[#7C849E] dark:hover:text-white font-medium"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Row 2: 3 tabs */}
            <div className="grid grid-cols-3 gap-1 text-center mt-1.5 max-w-[280px]">
              {PERIOD_TABS.slice(4).map((tab) => {
                const isActive = activePeriod === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActivePeriod(tab.id)}
                    className={`py-1.5 px-1 rounded-xl text-xs transition-all cursor-pointer ${
                      isActive
                        ? "bg-white dark:bg-[#1E243A] text-foreground dark:text-white font-semibold shadow-xs border border-slate-200/80 dark:border-[#2e3048]"
                        : "text-muted-foreground hover:text-foreground dark:text-[#7C849E] dark:hover:text-white font-medium"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date range & Calendar button row */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-11 px-3 rounded-2xl bg-[#EEF2FC]/70 dark:bg-[#101322] border border-[#D5DEF7] dark:border-[#1E243A] flex items-center justify-center gap-2 text-xs font-mono text-blue dark:text-[#5B82F6]">
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>{dateRangeDisplay}</span>
            </div>
            <button
              type="button"
              onClick={handleOpenCalendar}
              className="w-11 h-11 rounded-2xl bg-white dark:bg-[#151928] border border-slate-200 dark:border-[#232A40] flex items-center justify-center text-muted-foreground dark:text-[#8F98B2] hover:text-foreground dark:hover:text-white shadow-xs transition-colors cursor-pointer shrink-0"
              aria-label="Abrir selector de fecha"
            >
              <CalendarIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* DESKTOP VIEW (hidden md:flex) */}
        <div className="hidden md:flex items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#0D101D] border border-slate-200/60 dark:border-[#1E2338]">
            {PERIOD_TABS.map((tab) => {
              const isActive = activePeriod === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActivePeriod(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-white dark:bg-[#1E243A] text-foreground dark:text-white shadow-xs border border-slate-200/80 dark:border-[#2e3048] font-semibold"
                      : "text-muted-foreground hover:text-foreground dark:text-[#7C849E] dark:hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#1E243A] bg-white dark:bg-[#101322] text-xs font-mono text-blue dark:text-[#5B82F6] shadow-xs">
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>{dateRangeDisplay}</span>
            </div>
            <button
              type="button"
              onClick={handleOpenCalendar}
              className="w-9 h-9 rounded-xl bg-white dark:bg-[#151928] border border-slate-200 dark:border-[#232A40] flex items-center justify-center text-muted-foreground dark:text-[#8F98B2] hover:text-foreground dark:hover:text-white shadow-xs transition-colors cursor-pointer"
              aria-label="Abrir selector de fecha"
            >
              <CalendarIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4 METRIC CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Total registros */}
          <div className="rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between min-h-[104px] border bg-white dark:bg-[#101322] border-slate-200/80 dark:border-[#1E2335] shadow-xs">
            <div className="flex items-center justify-between gap-1.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-[#171B2D] border border-slate-200/60 dark:border-[#232942] text-muted-foreground shrink-0">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <span className="text-[11px] sm:text-xs text-muted-foreground dark:text-[#8F96AE] font-medium text-right leading-tight">
                Total registros
              </span>
            </div>
            <span className="text-2xl sm:text-3xl font-bold text-foreground dark:text-white mt-2">
              {metrics.total}
            </span>
          </div>

          {/* Card 2: Presentes */}
          <div className="rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between min-h-[104px] border bg-emerald-50/60 dark:bg-[#0B1E1B] border-emerald-200/80 dark:border-[#124336] shadow-xs">
            <div className="flex items-center justify-between gap-1.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center bg-emerald-100 dark:bg-[#103328] border border-emerald-300/60 dark:border-[#1B5241] text-emerald-600 dark:text-[#34D399] shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <span className="text-[11px] sm:text-xs text-[#059669] dark:text-[#34D399] font-medium text-right leading-tight">
                Presentes
              </span>
            </div>
            <span className="text-2xl sm:text-3xl font-bold text-foreground dark:text-white mt-2">
              {metrics.onTime}
            </span>
          </div>

          {/* Card 3: Faltas / tardanzas */}
          <div className="rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between min-h-[104px] border bg-rose-50/60 dark:bg-[#211015] border-rose-200/80 dark:border-[#4A1D24] shadow-xs">
            <div className="flex items-center justify-between gap-1.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center bg-rose-100 dark:bg-[#3D141C] border border-rose-300/60 dark:border-[#5E1E2B] text-rose-600 dark:text-[#FB7185] shrink-0">
                <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <span className="text-[11px] sm:text-xs text-[#E11D48] dark:text-[#FB7185] font-medium text-right leading-tight">
                Faltas / tardanzas
              </span>
            </div>
            <span className="text-2xl sm:text-3xl font-bold text-foreground dark:text-white mt-2">
              {metrics.late + metrics.absences}
            </span>
          </div>

          {/* Card 4: % asistencia */}
          <div className="rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between min-h-[104px] border bg-sky-50/60 dark:bg-[#10162A] border-sky-200/80 dark:border-[#1E2B45] shadow-xs">
            <div className="flex items-center justify-between gap-1.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center bg-sky-100 dark:bg-[#15233D] border border-sky-300/60 dark:border-[#1E3760] text-sky-600 dark:text-[#38BDF8] shrink-0">
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <span className="text-[11px] sm:text-xs text-[#0284C7] dark:text-[#38BDF8] font-medium text-right leading-tight">
                % asistencia
              </span>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-bold text-foreground dark:text-white">
                {metrics.rate}%
              </span>
              <div className="w-full h-1.5 rounded-full bg-slate-200/80 dark:bg-[#1E2742] mt-2 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#6366F1] to-[#38BDF8]"
                  style={{ width: `${Math.min(100, Math.max(0, metrics.rate))}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-3">
          <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              placeholder="Colaborador o proyecto..."
              className="w-full pl-9 pr-4 h-10 rounded-xl border border-slate-200 dark:border-raised bg-white dark:bg-sidebar text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-violet"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 sm:flex items-center gap-3">
            <div className="flex-1 sm:min-w-[140px]">
              <Select value={selectedRole} onValueChange={(val) => setSelectedRole(val as "ALL" | "ADMIN" | "PROJECT_MANAGER" | "TEAM_MEMBER")}>
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
              <Select value={selectedProject} onValueChange={(val) => setSelectedProject(val)}>
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

          <div className="grid grid-cols-2 sm:flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={fetchAttendance}
              className="flex items-center justify-center gap-2 px-4 h-10 rounded-xl border border-slate-200 dark:border-raised bg-white dark:bg-sidebar text-sm font-medium text-foreground hover:bg-slate-50 dark:hover:bg-surface transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 text-muted-foreground ${isLoading ? "animate-spin" : ""}`} />
              Actualizar
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center justify-center gap-2 px-4 h-10 rounded-xl text-sm font-medium border border-green/30 text-green-ink dark:text-green bg-green/10 hover:bg-green/20 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Exportar CSV
            </button>
          </div>
        </div>

        {/* DESKTOP ATTENDANCE TABLE */}
        <div className="hidden md:block rounded-2xl border border-slate-200/80 dark:border-surface bg-white dark:bg-background overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/80 dark:border-surface bg-muted/30 dark:bg-transparent">
                  <th className="py-3.5 px-5 font-mono text-[10.5px] uppercase tracking-wider font-semibold text-muted-foreground dark:text-text-5">
                    COLABORADOR
                  </th>
                  <th className="py-3.5 px-5 font-mono text-[10.5px] uppercase tracking-wider font-semibold text-muted-foreground dark:text-text-5">
                    PROYECTO
                  </th>
                  <th className="py-3.5 px-5 font-mono text-[10.5px] uppercase tracking-wider font-semibold text-muted-foreground dark:text-text-5">
                    FECHA
                  </th>
                  <th className="py-3.5 px-5 font-mono text-[10.5px] uppercase tracking-wider font-semibold text-muted-foreground dark:text-text-5">
                    ENTRADA
                  </th>
                  <th className="py-3.5 px-5 font-mono text-[10.5px] uppercase tracking-wider font-semibold text-muted-foreground dark:text-text-5">
                    SALIDA
                  </th>
                  <th className="py-3.5 px-5 font-mono text-[10.5px] uppercase tracking-wider font-semibold text-muted-foreground dark:text-text-5">
                    ESTADO
                  </th>
                  <th className="py-3.5 px-5 font-mono text-[10.5px] uppercase tracking-wider font-semibold text-muted-foreground dark:text-text-5">
                    UBICACIÓN GPS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 dark:divide-surface/60">
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
                        className={`border-b border-border/40 dark:border-raised transition-colors ${
                          index % 2 === 0
                            ? "bg-muted/30 dark:bg-surface/50 hover:bg-muted/50 dark:hover:bg-raised/60"
                            : "bg-transparent hover:bg-muted/20 dark:hover:bg-surface/40"
                        }`}
                      >
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-avatar-gradient flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
                              {initials}
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-foreground">{r.userName}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${
                                    isAdmin
                                      ? "bg-violet/10 text-violet-ink dark:text-violet border-violet/20"
                                      : isPm
                                      ? "bg-amber/10 text-amber-ink dark:text-amber border-amber/20"
                                      : "bg-blue/10 text-blue dark:text-blue border-blue/20"
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
        </div>

        {/* MOBILE ATTENDANCE CARDS (MATCHING dark-historial de asistencia.svg) */}
        <div className="md:hidden space-y-3">
          {paginatedRows.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground bg-card dark:bg-[#101322] border border-border dark:border-[#1E2335] rounded-2xl">
              No hay registros de asistencias para los filtros seleccionados
            </div>
          ) : (
            paginatedRows.map((r) => {
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
                <div
                  key={r.id}
                  className="bg-card dark:bg-[#101322] border border-border dark:border-[#1E2335] rounded-2xl p-4 space-y-3 shadow-sm"
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-avatar-gradient flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-foreground dark:text-white text-sm leading-tight truncate">
                          {r.userName}
                        </h3>
                        <div className="mt-1">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                              isAdmin
                                ? "bg-violet/10 text-violet-ink border-violet/20 dark:bg-[#241738] dark:text-[#C084FC] dark:border-[#401E68]"
                                : isPm
                                ? "bg-amber/10 text-amber-ink border-amber/20 dark:bg-[#2C2112] dark:text-[#FBBF24] dark:border-[#4E3815]"
                                : "bg-blue/10 text-blue border-blue/20 dark:bg-[#132238] dark:text-[#38BDF8] dark:border-[#1E3A5F]"
                            }`}
                          >
                            {isAdmin ? "Administrador" : isPm ? "Jefe de proyecto" : "Colaborador"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status badge */}
                    <div className="shrink-0">
                      <StatusBadge status={r.status} />
                    </div>
                  </div>

                  {/* Email */}
                  {r.user?.email && (
                    <p className="text-xs text-muted-foreground dark:text-[#8F96AE] truncate">
                      {r.user.email}
                    </p>
                  )}

                  {/* Project and Date row */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground dark:text-[#8F96AE] pt-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Folder className="w-3.5 h-3.5 text-muted-foreground dark:text-[#8F96AE] shrink-0" />
                      <span className="truncate text-foreground dark:text-white font-medium">
                        {r.projectName}
                      </span>
                    </div>
                    <span className="font-mono shrink-0">
                      {formatDateDisplay(r.date)}
                    </span>
                  </div>

                  {/* ENTRADA & SALIDA boxes */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-muted/40 dark:bg-[#141829] border border-border/70 dark:border-[#1E2335] rounded-xl p-2.5">
                      <span className="font-mono text-[10px] font-semibold text-muted-foreground dark:text-[#8F96AE] tracking-wider uppercase block">
                        ENTRADA
                      </span>
                      <span className="font-mono text-sm font-bold text-foreground dark:text-white mt-1 block">
                        {r.checkIn}
                      </span>
                    </div>
                    <div className="bg-muted/40 dark:bg-[#141829] border border-border/70 dark:border-[#1E2335] rounded-xl p-2.5">
                      <span className="font-mono text-[10px] font-semibold text-muted-foreground dark:text-[#8F96AE] tracking-wider uppercase block">
                        SALIDA
                      </span>
                      <span className="font-mono text-sm font-bold text-foreground dark:text-white mt-1 block">
                        {r.checkOut || (
                          <span className="text-muted-foreground dark:text-[#8F96AE] font-normal text-xs">
                            Sin salida
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Location Box */}
                  <div className="bg-muted/30 dark:bg-[#141829] border border-border/70 dark:border-[#1E2335] rounded-xl px-3 py-2.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <LocationCell
                        locationName={r.locationName}
                        latitude={r.latitude}
                        longitude={r.longitude}
                      />
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#8F96AE] shrink-0" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-100 dark:border-surface bg-slate-50/30 dark:bg-transparent">
          <span className="text-xs text-muted-foreground">
            {filteredRows.length} {filteredRows.length === 1 ? "registro" : "registros"}
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

        {/* CALENDAR DATE RANGE PICKER DIALOG (EXACT FIGMA / MEDIA_1792521842662 DESIGN) */}
        <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <DialogContent className="sm:max-w-md rounded-3xl border border-slate-200 dark:border-[#22283A] bg-white dark:bg-[#131622] p-5 sm:p-6 shadow-2xl [&>button]:hidden">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#201A36] dark:bg-[#201A36] border border-[#3E2D68] flex items-center justify-center shrink-0 shadow-sm">
                  <CalendarIcon className="w-5 h-5 text-[#C084FC]" />
                </div>
                <div>
                  <DialogTitle className="text-base sm:text-lg font-bold text-foreground dark:text-white tracking-tight">
                    Rango personalizado
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground dark:text-[#8F98B2] mt-0.5">
                    Selecciona fechas para filtrar
                  </DialogDescription>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCalendarOpen(false)}
                className="text-muted-foreground dark:text-[#8F98B2] hover:text-foreground dark:hover:text-white transition-colors cursor-pointer p-1 rounded-lg"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Inputs */}
            <div className="mt-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-foreground dark:text-white mb-1.5">
                  Desde
                </label>
                <input
                  type="date"
                  value={tempStartDate}
                  onChange={(e) => setTempStartDate(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-[#0D0F1A] border border-slate-200 dark:border-[#22283A] text-sm text-foreground dark:text-white font-mono focus:outline-none focus:border-purple-500/50 [color-scheme:dark]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground dark:text-white mb-1.5">
                  Hasta
                </label>
                <input
                  type="date"
                  value={tempEndDate}
                  onChange={(e) => setTempEndDate(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-[#0D0F1A] border border-slate-200 dark:border-[#22283A] text-sm text-foreground dark:text-white font-mono focus:outline-none focus:border-purple-500/50 [color-scheme:dark]"
                />
              </div>

              {/* Accesos rápidos */}
              <div>
                <p className="text-[10.5px] font-mono uppercase tracking-[0.05em] text-muted-foreground dark:text-[#8F98B2] font-semibold mt-4 mb-2">
                  ACCESOS RÁPIDOS
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handlePreset(7)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-[#141828] border border-slate-200 dark:border-[#232A40] text-foreground dark:text-[#C8D1E6] hover:bg-slate-200 dark:hover:bg-[#1E243A] hover:text-foreground dark:hover:text-white transition-colors cursor-pointer"
                  >
                    7 días
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePreset(15)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-[#141828] border border-slate-200 dark:border-[#232A40] text-foreground dark:text-[#C8D1E6] hover:bg-slate-200 dark:hover:bg-[#1E243A] hover:text-foreground dark:hover:text-white transition-colors cursor-pointer"
                  >
                    15 días
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePreset(30)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-[#141828] border border-slate-200 dark:border-[#232A40] text-foreground dark:text-[#C8D1E6] hover:bg-slate-200 dark:hover:bg-[#1E243A] hover:text-foreground dark:hover:text-white transition-colors cursor-pointer"
                  >
                    30 días
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePreset("month")}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-[#141828] border border-slate-200 dark:border-[#232A40] text-foreground dark:text-[#C8D1E6] hover:bg-slate-200 dark:hover:bg-[#1E243A] hover:text-foreground dark:hover:text-white transition-colors cursor-pointer"
                  >
                    Este mes
                  </button>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-200 dark:border-[#1E243A] my-4" />

            {/* Footer buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsCalendarOpen(false)}
                className="px-5 h-11 rounded-2xl bg-slate-100 dark:bg-[#141828] border border-slate-200 dark:border-[#232A40] text-xs font-semibold text-foreground dark:text-[#C8D1E6] hover:bg-slate-200 dark:hover:bg-[#1E243A] hover:text-foreground dark:hover:text-white transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApplyCustomRange}
                disabled={!tempStartDate || !tempEndDate}
                className="flex-1 h-11 rounded-2xl bg-brand-gradient hover:opacity-95 disabled:opacity-50 text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4 text-white" />
                <span>Aplicar rango</span>
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
