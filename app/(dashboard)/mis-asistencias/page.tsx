"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Search, Calendar as CalendarIcon, RefreshCw, ChevronLeft, ChevronRight, Loader2, Clock, CheckCircle2, XCircle, TrendingUp, X as XIcon, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogClose, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/atoms/status-badge";
import PageHeader from "@/components/layout/page-header";
import { DataTable, Column } from "@/components/DataTable";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { SubMetricCard } from "@/components/dashboard/SubMetricCard";
import { useAuthGuard } from "@/app/jwt/auth/useAuthGuard";
import { listAttendance } from "@/app/services/assistance.service";
import { exportAttendance } from "@/app/services/project.assistance.service";
import { useUserProject } from "@/features/attendance/hooks/useUserProject";
import { formatLocalTime, getEffectiveTimezone } from "@/lib/timezone";
import { LocationCell } from "@/components/atoms/LocationCell";
import { formatAvatarUrl } from "@/lib/avatar-url";

type Period =
  | "today"
  | "thisweek"
  | "month"
  | "currentperiod"
  | "3months"
  | "6months"
  | "9months"
  | "total"
  | "custom";

interface DateRange {
  fromDate: string;
  toDate: string;
  label: string;
  period: Period;
}

type AttendanceStatus = "PRESENTE" | "FALTA" | "TARDE";

type AttendanceRecord = {
  id: string;
  userId?: string | null;
  projectId?: string | null;
  date: string;
  checkIn?: string | null;
  checkOut?: string | null;
  status: AttendanceStatus;
  latitude?: number | null;
  longitude?: number | null;
  photoUrl?: string | null;
};

function getInitialMonthRange(): DateRange {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  return {
    fromDate: formatDate(firstDay),
    toDate: formatDate(today),
    label: "Este mes",
    period: "month",
  };
}

export default function AttendanceHistoryPage() {
  const { hydrated, token, user, checkingAuth } = useAuthGuard(["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER"]);
  const { project } = useUserProject();

  const [period, setPeriod] = useState<Period>("month");
  const [dateRange, setDateRange] = useState<DateRange>(getInitialMonthRange());

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchDate, setSearchDate] = useState("");
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const timezone = useMemo(() => {
    return getEffectiveTimezone(project?.timezone, user?.timezone);
  }, [project?.timezone, user?.timezone]);

  const handlePeriodChange = (newRange: DateRange) => {
    setPeriod(newRange.period);
    setDateRange(newRange);
    setCurrentPage(1);
  };

  useEffect(() => {
    if (!hydrated || checkingAuth || !token) return;

    let cancelled = false;

    const fetchAttendance = async () => {
      try {
        setLoading(true);
        const data = await listAttendance(token, {
          fromDate: dateRange.fromDate,
          toDate: dateRange.toDate,
          projectId: project?.id,
        });

        if (cancelled) return;

        const mapped: AttendanceRecord[] = (data?.items || []).map((item: any) => ({
          id: item.id,
          userId: item.userId,
          projectId: item.projectId,
          date: item.date,
          checkIn: item.checkIn,
          checkOut: item.checkOut,
          status: item.status as AttendanceStatus,
          latitude: item.latitude,
          longitude: item.longitude,
          photoUrl: item.photoUrl,
        }));

        setRecords(mapped);
      } catch (err) {
        console.error("Error al cargar asistencias:", err);
        if (!cancelled) setRecords([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAttendance();

    return () => {
      cancelled = true;
    };
  }, [hydrated, checkingAuth, token, dateRange, project?.id]);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (searchDate && !r.date.includes(searchDate)) return false;
      return true;
    });
  }, [records, statusFilter, searchDate]);

  const metrics = useMemo(() => {
    const total = filteredRecords.length;
    const presentes = filteredRecords.filter((r) => r.status === "PRESENTE").length;
    const faltas = filteredRecords.filter((r) => r.status === "FALTA").length;
    const tardanzas = filteredRecords.filter((r) => r.status === "TARDE").length;
    const rate = total > 0 ? Math.round((presentes / total) * 100) : 0;

    return { total, presentes, faltas, tardanzas, rate };
  }, [filteredRecords]);

  const handleExportCSV = async () => {
    if (!token) return;
    try {
      const result = await exportAttendance(
        token,
        {
          projectId: project?.id,
          userId: user?.id,
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
        link.download = result.fileName || "mis-asistencias.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Error exporting CSV:", err);
    }
  };

  const columns: Column<AttendanceRecord>[] = [
    {
      key: "date",
      header: "FECHA",
      render: (r) => {
        const parts = r.date.split("-");
        const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : r.date;
        return <span className="font-semibold text-foreground">{formattedDate}</span>;
      },
    },
    {
      key: "checkIn",
      header: "HORA ENTRADA",
      render: (r) => (
        <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          {formatLocalTime(r.checkIn, timezone)}
        </span>
      ),
    },
    {
      key: "checkOut",
      header: "HORA SALIDA",
      render: (r) => (
        <span className="font-mono text-xs font-semibold text-amber-600 dark:text-amber-400">
          {formatLocalTime(r.checkOut, timezone)}
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
    {
      key: "biometria",
      header: "BIOMETRÍA",
      render: (r) =>
        r.photoUrl ? (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs border-violet-200 text-violet-700 hover:bg-violet-50 px-2 rounded-lg"
            onClick={() => setSelectedPhotoUrl(formatAvatarUrl(r.photoUrl))}
          >
            Ver Foto
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
  ];

  return (
    <div className="min-h-screen bg-muted/50 py-4 flex flex-col">
      <div className="max-w-7xl mx-auto px-4 w-full flex-1 flex flex-col space-y-4">
        <PageHeader
          title="Historial de Asistencia"
          description="Consulta y filtra el historial completo de tus registros de asistencia personal"
          period={period}
          dateRange={dateRange}
          onPeriodChange={handlePeriodChange}
        />

        <Card className="flex-1 border border-border shadow-sm bg-card rounded-2xl overflow-hidden flex flex-col">
          <CardContent className="p-4 flex-1 flex flex-col overflow-hidden space-y-4">
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <SubMetricCard label="TOTAL" value={metrics.total} icon={<Clock className="w-5 h-5" />} />
              <SubMetricCard label="PRESENTES" value={metrics.presentes} color="green" icon={<CheckCircle2 className="w-5 h-5" />} />
              <SubMetricCard label="FALTAS" value={metrics.faltas} color="red" icon={<XCircle className="w-5 h-5" />} />
              <SubMetricCard label="% ASISTENCIA" value={`${metrics.rate}%`} color="blue" icon={<TrendingUp className="w-5 h-5" />} />
            </div>

            <div className="flex flex-wrap items-end gap-3 justify-between bg-muted/40 p-3 rounded-xl border border-border">
              <div className="flex flex-wrap items-end gap-3 flex-1">
                <div className="flex flex-col min-w-[160px]">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Buscar Fecha
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-muted-foreground" size={14} />
                    <Input
                      placeholder="YYYY-MM-DD..."
                      value={searchDate}
                      onChange={(e) => setSearchDate(e.target.value)}
                      className="pl-8 h-9 text-xs rounded-xl border-border bg-background"
                    />
                  </div>
                </div>

                <div className="flex flex-col min-w-[140px]">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Filtrar Estado
                  </label>
                  <Select
                    value={statusFilter}
                    onValueChange={(v) => {
                      setStatusFilter(v);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs rounded-xl border-border bg-background">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="PRESENTE">Presente</SelectItem>
                      <SelectItem value="FALTA">Falta</SelectItem>
                      <SelectItem value="TARDE">Tarde</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  className="h-9 px-3 text-xs gap-1.5 rounded-xl border-border bg-background"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Actualizar
                </Button>
                <Button
                  onClick={handleExportCSV}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold gap-1.5 h-9 px-3 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" /> Exportar CSV
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden border border-border rounded-xl">
              <DataTable
                data={filteredRecords}
                columns={columns}
                loading={loading}
                emptyText="No se encontraron registros de asistencia"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedPhotoUrl} onOpenChange={(open) => !open && setSelectedPhotoUrl(null)}>
        <DialogContent className="max-w-md p-5 rounded-2xl">
          <DialogTitle className="text-base font-bold text-foreground">Foto Biométrica</DialogTitle>
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
