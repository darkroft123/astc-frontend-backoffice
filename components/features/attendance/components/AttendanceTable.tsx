"use client";

import { StatusBadge } from "@/components/atoms/status-badge";
import { LocationCell } from "@/components/atoms/LocationCell";
import { Folder, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

interface AttendanceTableProps {
  paginatedRows: any[];
  filteredRows: any[];
  formatDateDisplay: (dateStr: string) => string;
  page: number;
  totalPages: number;
  setPage: (updater: (prev: number) => number) => void;
  isLoading?: boolean;
}

export function AttendanceTable({
  paginatedRows,
  filteredRows,
  formatDateDisplay,
  page,
  totalPages,
  setPage,
  isLoading = false,
}: AttendanceTableProps) {
  return (
    <div className="space-y-4">
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
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-5 h-5 animate-spin text-[#A855F7]" />
                      <span>Cargando asistencias...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedRows.length === 0 ? (
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
                  const isPm =
                    !isAdmin &&
                    (r.userRole === "PROJECT_MANAGER" ||
                      r.user?.roleCode === "PROJECT_MANAGER");

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

      {/* MOBILE ATTENDANCE CARDS */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-muted-foreground bg-card dark:bg-[#101322] border border-border dark:border-[#1E2335] rounded-2xl flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-[#A855F7]" />
            <span>Cargando asistencias...</span>
          </div>
        ) : paginatedRows.length === 0 ? (
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
            const isPm =
              !isAdmin &&
              (r.userRole === "PROJECT_MANAGER" ||
                r.user?.roleCode === "PROJECT_MANAGER");

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

      {/* FOOTER PAGINATION */}
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
    </div>
  );
}
