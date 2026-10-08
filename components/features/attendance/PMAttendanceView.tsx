"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/atoms/status-badge";
import { SubMetricCard } from "@/components/dashboard/SubMetricCard";
import { RefreshCw, Clock, CheckCircle2, AlertTriangle, Users, Search, FolderKanban, ShieldCheck, Download, TrendingUp, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PageHeader from "@/components/layout/page-header";
import { DataTable, Column } from "@/components/DataTable";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAllProjects, getAllUsers, listTeamAttendance, exportAttendance, User } from "@/app/services/project.assistance.service";
import { LocationCell } from "@/components/atoms/LocationCell";
import { formatAvatarUrl } from "@/lib/avatar-url";

type Period = "today" | "thisweek" | "month" | "currentperiod" | "3months" | "6months" | "9months" | "total" | "custom";

interface DateRange {
  fromDate: string;
  toDate: string;
  label: string;
  period: Period;
}

function toDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getInitialRange(p: Period): DateRange {
  const today = new Date();
  if (p === "today") {
    return { fromDate: toDateString(today), toDate: toDateString(today), label: "Hoy", period: p };
  }
  const from = new Date(today.getFullYear(), today.getMonth(), 1);
  return { fromDate: toDateString(from), toDate: toDateString(today), label: "Este mes", period: p };
}

function formatLocalDateString(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  if (dateStr.includes("T")) {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } else {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  }
}

export function PMAttendanceView() {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [rawAttendances, setRawAttendances] = useState<any[]>([]);

  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userMap, setUserMap] = useState<Record<string, User>>({});

  const [dateRange, setDateRange] = useState<DateRange>(getInitialRange("month"));
  const [selectedProject, setSelectedProject] = useState("all");
  const [selectedRole, setSelectedRole] = useState<"ALL" | "PROJECT_MANAGER" | "TEAM_MEMBER">("ALL");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);

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
        statusFilter === "all" ? undefined : statusFilter,
        dateRange.fromDate,
        dateRange.toDate
      );

      let list = Array.isArray(data) ? data : [];
      if (selectedRole !== "ALL") {
        list = list.filter((item: any) => {
          const u = userMap[item.userId];
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
  }, [token, dateRange.fromDate, dateRange.toDate, selectedProject, selectedRole, statusFilter, userMap]);

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
      const u = userMap[item.userId];
      const userName = u
        ? `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username || u.email
        : `Usuario (${item.userId?.slice(0, 8) || "—"})`;
      const projectName = item.projectId ? projectMap[item.projectId] || "Proyecto Asignado" : "Gestión General";

      let overtimeText = "—";
      let isOvertime = false;
      let isEarly = item.status === "EARLY_DEPARTURE";

      if (item.checkIn && item.checkOut) {
        try {
          const [inH, inM] = item.checkIn.split(":").map(Number);
          const [outH, outM] = item.checkOut.split(":").map(Number);
          const totalMinutesWorked = (outH * 60 + outM) - (inH * 60 + inM);

          if (outH >= 17 && totalMinutesWorked > 480) {
            const extraMins = totalMinutesWorked - 480;
            const extraH = Math.floor(extraMins / 60);
            const extraRemM = extraMins % 60;
            overtimeText = `+${extraH > 0 ? `${extraH}h ` : ""}${extraRemM}m extra`;
            isOvertime = true;
          } else if (outH < 17 && isEarly) {
            const earlyMins = (17 * 60) - (outH * 60 + outM);
            const earlyH = Math.floor(earlyMins / 60);
            const earlyRemM = earlyMins % 60;
            overtimeText = `-${earlyH > 0 ? `${earlyH}h ` : ""}${earlyRemM}m salida`;
          }
        } catch {}
      }

      return {
        id: item.id,
        userId: item.userId,
        user: u,
        userName,
        userRole: u?.roleCode || (u as any)?.role || "PROJECT_MANAGER",
        projectName,
        date: item.date,
        checkIn: item.checkIn ? item.checkIn.substring(0, 5) : "—",
        checkOut: item.checkOut ? item.checkOut.substring(0, 5) : "—",
        overtimeText,
        isOvertime,
        isEarly,
        status: item.status,
        photoUrl: formatAvatarUrl(item.photoUrl),
        latitude: item.latitude,
        longitude: item.longitude,
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
    const onTime = filteredRows.filter((r) => r.status.includes("ON_TIME") || r.status === "ASISTENCIA" || r.status === "PRESENTE").length;
    const late = filteredRows.filter((r) => r.status.includes("LATE") || r.status === "TARDE").length;
    const absences = filteredRows.filter((r) => r.status === "FALTA" || r.status === "EARLY_DEPARTURE").length;
    const rate = total > 0 ? Math.round((onTime / total) * 100) : 0;
    return { total, onTime, late, absences, rate };
  }, [filteredRows]);

  const columns: Column<any>[] = [
    {
      key: "userName",
      header: "COLABORADOR",
      render: (r) => {
        const initials = ((r.user?.firstName?.[0] || "") + (r.user?.lastName?.[0] || "") || r.userName?.[0] || "U").toUpperCase();
        const avatarSrc = formatAvatarUrl(r.user?.avatarUrl || r.photoUrl);
        return (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 font-bold text-xs flex items-center justify-center border border-violet-200 shrink-0 overflow-hidden">
              {avatarSrc ? (
                <img src={avatarSrc} alt={r.userName} className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div>
              <p className="font-semibold text-foreground text-xs">{r.userName}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium border ${
                  r.userRole === "PROJECT_MANAGER"
                    ? "bg-violet-50 text-violet-700 border-violet-200"
                    : r.userRole === "ADMIN"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-blue-50 text-blue-700 border-blue-200"
                }`}>
                  {r.userRole === "PROJECT_MANAGER" ? "Jefe de Proyecto" : r.userRole === "ADMIN" ? "Administrador" : "Colaborador"}
                </span>
                {r.user?.email && <span className="text-[10px] text-zinc-400 truncate max-w-[130px]">{r.user.email}</span>}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: "projectName",
      header: "PROYECTO",
      render: (r) => (
        <span className="text-xs font-medium text-foreground flex items-center gap-1">
          <FolderKanban className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          {r.projectName}
        </span>
      ),
    },
    {
      key: "date",
      header: "FECHA",
      render: (r) => <span className="text-xs text-muted-foreground">{formatLocalDateString(r.date)}</span>,
    },
    {
      key: "checkIn",
      header: "ENTRADA",
      render: (r) => (
        <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
          {r.checkIn}
        </span>
      ),
    },
    {
      key: "checkOut",
      header: "SALIDA",
      render: (r) => (
        <span className={`font-mono text-xs font-semibold px-2 py-0.5 rounded ${
          r.checkOut !== "—" ? "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-400" : "text-zinc-400 bg-background"
        }`}>
          {r.checkOut}
        </span>
      ),
    },
    {
      key: "status",
      header: "ESTADO",
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: "location",
      header: "UBICACIÓN GPS",
      render: (r) => <LocationCell latitude={r.latitude} longitude={r.longitude} />,
    },
  ];

  const handleExportCSV = async () => {
    if (!token) return;
    try {
      const result = await exportAttendance(
        token,
        {
          projectId: selectedProject === "all" ? undefined : selectedProject,
          status: statusFilter === "all" ? undefined : statusFilter,
          fromDate: dateRange.fromDate,
          toDate: dateRange.toDate,
        }
      );
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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-5 space-y-5">
        
        <PageHeader
          categoryTag={{ badge: "CONTROL GLOBAL", text: "Panel Administrativo" }}
          title="Historial de Asistencias"
          description="Auditoría y control de asistencias de Jefes de Proyecto y Colaboradores en todos los proyectos."
          period={dateRange.period}
          dateRange={dateRange}
          onPeriodChange={setDateRange}
        />

        {/* Standard SubMetricCards consistent with Justificaciones and Faltas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SubMetricCard label="TOTAL" value={metrics.total} icon={<Clock className="w-5 h-5" />} />
          <SubMetricCard label="PRESENTES" value={metrics.onTime} color="green" icon={<CheckCircle2 className="w-5 h-5" />} />
          <SubMetricCard label="FALTAS / TARDANZAS" value={metrics.late + metrics.absences} color="red" icon={<XCircle className="w-5 h-5" />} />
          <SubMetricCard label="% ASISTENCIA" value={`${metrics.rate}%`} color="blue" icon={<TrendingUp className="w-5 h-5" />} />
        </div>

        <div className="bg-card p-4 rounded-2xl border border-border shadow-xs space-y-3">
          <div className="flex flex-wrap items-end gap-3 justify-between">
            <div className="flex flex-wrap items-end gap-3 flex-1">
              
              <div className="flex flex-col min-w-[170px]">
                <label className="text-[11px] font-semibold text-zinc-500 mb-1">Filtrar por Rol</label>
                <Select value={selectedRole} onValueChange={(val: any) => setSelectedRole(val)}>
                  <SelectTrigger className="h-9 rounded-xl border-border text-xs">
                    <SelectValue placeholder="Seleccione Rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos los Usuarios</SelectItem>
                    <SelectItem value="PROJECT_MANAGER">Jefes de Proyecto</SelectItem>
                    <SelectItem value="TEAM_MEMBER">Colaboradores</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col min-w-[190px]">
                <label className="text-[11px] font-semibold text-zinc-500 mb-1">Proyecto</label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger className="h-9 rounded-xl border-border text-xs">
                    <SelectValue placeholder="Todos los Proyectos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los Proyectos</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col min-w-[160px]">
                <label className="text-[11px] font-semibold text-zinc-500 mb-1">Estado</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 rounded-xl border-border text-xs">
                    <SelectValue placeholder="Todos los Estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los Estados</SelectItem>
                    <SelectItem value="PRESENTE">Presente</SelectItem>
                    <SelectItem value="TARDE">Tarde</SelectItem>
                    <SelectItem value="FALTA">Falta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col min-w-[200px] flex-1">
                <label className="text-[11px] font-semibold text-zinc-500 mb-1">Buscar</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    placeholder="Colaborador o proyecto..."
                    className="h-9 text-xs pl-8 rounded-xl border-border"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={fetchAttendance} className="border border-border h-9 px-3 rounded-xl">
                <RefreshCw className={`w-3.5 h-3.5 text-zinc-600 ${isLoading ? "animate-spin" : ""}`} />
                <span className="text-xs font-semibold">Actualizar</span>
              </Button>
              <Button
                onClick={handleExportCSV}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold gap-1.5 h-9 px-3 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" /> Exportar CSV
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-xs">
          {isLoading ? (
            <div className="py-16 text-center text-zinc-400 text-sm">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-violet-500" />
              Cargando registros de asistencia...
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="py-16 text-center text-zinc-400 text-sm">
              <Clock className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
              No se encontraron registros de asistencia para los filtros seleccionados
            </div>
          ) : (
            <DataTable columns={columns} data={filteredRows} />
          )}
        </div>

      </div>

      <Dialog open={!!selectedPhotoUrl} onOpenChange={(open) => !open && setSelectedPhotoUrl(null)}>
        <DialogContent className="max-w-md p-5 rounded-2xl">
          {selectedPhotoUrl && (
            <div className="mt-3 rounded-2xl overflow-hidden border border-border bg-black">
              <img src={selectedPhotoUrl} alt="Foto Biométrica" className="w-full max-h-[400px] object-cover" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
