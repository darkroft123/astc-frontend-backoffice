"use client";

import { formatAttendanceTime } from "@/lib/timezone";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import {
  getAllProjects,
  getAllUsers,
  listTeamAttendance,
  exportAttendance,
} from "@/app/services/project.assistance.service";

import {
  AttendancePeriodSelector,
  Period,
} from "./components/AttendancePeriodSelector";
import { AttendanceKPIs } from "./components/AttendanceKPIs";
import { AttendanceFilterBar } from "./components/AttendanceFilterBar";
import { AttendanceTable } from "./components/AttendanceTable";
import { AttendanceCustomRangeDialog } from "./components/AttendanceCustomRangeDialog";

type User = any;

export function PMAttendanceView() {
  const { user, role, token, hydrated } = useAuth();
  const userRoleStr = (
    typeof role === "string"
      ? role
      : (user?.role as any)?.code || (user?.role as any) || ""
  ).toUpperCase();
  const isViewerAdmin =
    userRoleStr !== "PROJECT_MANAGER" && userRoleStr !== "TEAM_MEMBER";

  const [isLoading, setIsLoading] = useState(true);
  const [rawAttendances, setRawAttendances] = useState<any[]>([]);

  const [projects, setProjects] = useState<any[]>([]);
  const [, setUsers] = useState<User[]>([]);
  const [userMap, setUserMap] = useState<Record<string, User>>({});

  const getDatesForPeriod = (period: Period): { start: string; end: string } => {
    const today = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const end = fmt(today);

    switch (period) {
      case "today":
        return { start: end, end };
      case "thisweek": {
        const d = new Date(today);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        return { start: fmt(d), end };
      }
      case "month": {
        const first = new Date(today.getFullYear(), today.getMonth(), 1);
        return { start: fmt(first), end };
      }
      case "3months": {
        const d = new Date(today);
        d.setMonth(d.getMonth() - 3);
        return { start: fmt(d), end };
      }
      case "6months": {
        const d = new Date(today);
        d.setMonth(d.getMonth() - 6);
        return { start: fmt(d), end };
      }
      case "9months": {
        const d = new Date(today);
        d.setMonth(d.getMonth() - 9);
        return { start: fmt(d), end };
      }
      case "total":
      default:
        return { start: "2024-01-01", end };
    }
  };

  const [activePeriod, setActivePeriod] = useState<Period>("month");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [customRange, setCustomRange] = useState(() => getDatesForPeriod("month"));
  const [tempStartDate, setTempStartDate] = useState(() => getDatesForPeriod("month").start);
  const [tempEndDate, setTempEndDate] = useState(() => getDatesForPeriod("month").end);

  const handlePeriodChange = (p: Period) => {
    setActivePeriod(p);
    const newRange = getDatesForPeriod(p);
    setCustomRange(newRange);
    setTempStartDate(newRange.start);
    setTempEndDate(newRange.end);
  };

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
  const [selectedRole, setSelectedRole] = useState<
    "ALL" | "ADMIN" | "PROJECT_MANAGER" | "TEAM_MEMBER"
  >("ALL");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 5;

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
    console.log("[AttendanceView Admin] Fetching attendance, project:", selectedProject, "role:", selectedRole, "status:", statusFilter);
    try {
      const data = await listTeamAttendance(
        token,
        selectedProject === "all" ? undefined : selectedProject,
        undefined,
        statusFilter === "all" ? undefined : statusFilter,
        customRange.start,
        customRange.end
      );

      const list = Array.isArray(data) ? data : [];
      setRawAttendances(list);
    } catch (err) {
      console.error("Error fetching attendance in PMAttendanceView:", err);
      setRawAttendances([]);
    } finally {
      setIsLoading(false);
    }
  }, [token, selectedProject, statusFilter, customRange]);

  useEffect(() => {
    if (!hydrated) return;
    if (token) fetchAttendance();
    else setIsLoading(false);
  }, [hydrated, token, fetchAttendance]);

  const projectMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of projects) {
      map[p.id] = p.name;
    }
    return map;
  }, [projects]);

  const rows = useMemo(() => {
    return rawAttendances
      .filter((item) => {
        if (selectedRole === "ALL") return true;
        const u = userMap[item.userId] || item.user;
        const roleCode = u?.roleCode || (u as any)?.role;
        return roleCode === selectedRole;
      })
      .map((item) => {
      const u = userMap[item.userId] || item.user;
      const userName = u
        ? `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
          u.username ||
          u.email
        : `Usuario (${item.userId?.slice(0, 8) || "—"})`;
      const projectName =
        item.projectName ||
        (item.projectId ? projectMap[item.projectId] || (projects.length === 1 && projects[0]?.name ? projects[0].name : "Proyecto general") : "Gestión General");

      return {
        id: item.id,
        userId: item.userId,
        user: u,
        userName,
        userRole: u?.roleCode || (u as any)?.role || "TEAM_MEMBER",
        projectName,
        date: item.date,
        checkIn: formatAttendanceTime(item.checkIn, item.date),
        checkOut: item.checkOut ? formatAttendanceTime(item.checkOut, item.date) : null,
        status: item.status || "ASISTENCIA",
        photoUrl: item.photoUrl,
        locationName: item.locationName || "Ubicación registrada",
        latitude: item.latitude || -12.0123,
        longitude: item.longitude || -77.0543,
      };
    });
  }, [rawAttendances, userMap, projectMap, selectedRole, projects]);

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
    const late = filteredRows.filter(
      (r) => r.status.includes("LATE") || r.status === "TARDE"
    ).length;
    const absences = filteredRows.filter(
      (r) => r.status === "FALTA" || r.status === "EARLY_DEPARTURE"
    ).length;
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
        fromDate: customRange.start,
        toDate: customRange.end,
      });
      if (result?.content) {
        let exportContent = result.content;
        if (!exportContent.startsWith("\uFEFF")) {
          exportContent = "\uFEFF" + exportContent;
        }
        if (!exportContent.includes("sep=")) {
          exportContent = "\uFEFFsep=;\r\n" + exportContent.replace(/^\uFEFF/, "");
        }
        const blob = new Blob([exportContent], {
          type: "text/csv;charset=utf-8;",
        });
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
            Auditoría y control de asistencias de jefes de proyecto y trabajadores en todos los proyectos.
          </p>
        </div>

        {/* PERIOD / DATE SELECTOR BAR */}
        <AttendancePeriodSelector
          activePeriod={activePeriod}
          setActivePeriod={handlePeriodChange}
          dateRangeDisplay={dateRangeDisplay}
          onOpenCalendar={handleOpenCalendar}
        />

        {/* 4 METRIC CARDS */}
        <AttendanceKPIs metrics={metrics} />

        {/* FILTER BAR */}
        <AttendanceFilterBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedRole={selectedRole}
          setSelectedRole={setSelectedRole}
          selectedProject={selectedProject}
          setSelectedProject={setSelectedProject}
          projects={projects}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          isLoading={isLoading}
          onRefresh={fetchAttendance}
          onExportCSV={handleExportCSV}
        />

        {/* ATTENDANCE TABLE (DESKTOP + MOBILE + PAGINATION) */}
        <AttendanceTable
          paginatedRows={paginatedRows}
          filteredRows={filteredRows}
          formatDateDisplay={formatDateDisplay}
          page={page}
          totalPages={totalPages}
          setPage={setPage}
          isLoading={isLoading}
        />

        {/* CALENDAR DATE RANGE PICKER DIALOG */}
        <AttendanceCustomRangeDialog
          isOpen={isCalendarOpen}
          onClose={() => setIsCalendarOpen(false)}
          tempStartDate={tempStartDate}
          tempEndDate={tempEndDate}
          setTempStartDate={setTempStartDate}
          setTempEndDate={setTempEndDate}
          onPreset={handlePreset}
          onApply={handleApplyCustomRange}
        />
      </div>
    </div>
  );
}
