"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/atoms/status-badge";
import { LocationCell } from "@/components/atoms/LocationCell";
import { Folder, ChevronLeft, ChevronRight, Loader2, Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatAvatarUrl } from "@/lib/avatar-url";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* DESKTOP ATTENDANCE TABLE */}
      <div className="hidden md:block rounded-2xl border border-slate-200/80 dark:border-surface bg-white dark:bg-background overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/80 dark:border-surface bg-muted/30 dark:bg-transparent">
                <th className="py-3 px-3.5 lg:px-4 font-mono text-[10.5px] uppercase tracking-wider font-semibold text-muted-foreground dark:text-text-5">
                  COLABORADOR
                </th>
                <th className="py-3 px-3.5 lg:px-4 font-mono text-[10.5px] uppercase tracking-wider font-semibold text-muted-foreground dark:text-text-5">
                  PROYECTO
                </th>
                <th className="py-3 px-3.5 lg:px-4 font-mono text-[10.5px] uppercase tracking-wider font-semibold text-muted-foreground dark:text-text-5">
                  FECHA
                </th>
                <th className="py-3 px-3.5 lg:px-4 font-mono text-[10.5px] uppercase tracking-wider font-semibold text-muted-foreground dark:text-text-5">
                  ENTRADA
                </th>
                <th className="py-3 px-3.5 lg:px-4 font-mono text-[10.5px] uppercase tracking-wider font-semibold text-muted-foreground dark:text-text-5">
                  SALIDA
                </th>
                <th className="py-3 px-3.5 lg:px-4 font-mono text-[10.5px] uppercase tracking-wider font-semibold text-muted-foreground dark:text-text-5">
                  ESTADO
                </th>
                <th className="py-3 px-3.5 lg:px-4 font-mono text-[10.5px] uppercase tracking-wider font-semibold text-muted-foreground dark:text-text-5">
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
            const photos = (r.photoUrl || "").split(",").map((p: string) => p.trim()).filter(Boolean);
            const checkInPhoto = photos.find((p: string) => !p.includes("_checkout") && !p.includes("checkout")) || null;
            const checkOutPhoto = photos.find((p: string) => p.includes("_checkout") || p.includes("checkout")) || null;
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
                      <td className="py-3 px-3.5 lg:px-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="w-8 h-8 rounded-full shrink-0 shadow-sm">
                          {formatAvatarUrl(r.user?.avatarUrl) && (
                            <AvatarImage src={formatAvatarUrl(r.user?.avatarUrl)!} alt={r.userName} className="object-cover" />
                          )}
                          <AvatarFallback className="bg-avatar-gradient text-white font-bold text-xs">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
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
                                <span className="text-[11px] text-muted-foreground truncate max-w-[140px]">
                                  {r.user.email}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3.5 lg:px-4">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                          <Folder className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span>{r.projectName}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3.5 lg:px-4 text-xs font-mono text-foreground">
                        {formatDateDisplay(r.date)}
                      </td>

                      <td className="py-3 px-3.5 lg:px-4 text-xs font-mono text-foreground">
                        <div className="flex items-center gap-1.5">
                          <span>{r.checkIn}</span>
                          {r.checkIn && r.checkIn !== "-" && checkInPhoto && (
                            <button
                              type="button"
                              onClick={() => setSelectedPhotoUrl(formatAvatarUrl(checkInPhoto))}
                              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                              title="Ver foto de entrada"
                            >
                              <Camera className="w-3.5 h-3.5 text-[#A855F7]" />
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3.5 lg:px-4 text-xs font-mono text-foreground">
                        <div className="flex items-center gap-1.5">
                          {r.checkOut ? (
                            <span>{r.checkOut}</span>
                          ) : (
                            <span className="text-muted-foreground italic">Sin salida</span>
                          )}
                          {r.checkOut && r.checkOut !== "-" && checkOutPhoto && (
                            <button
                              type="button"
                              onClick={() => setSelectedPhotoUrl(formatAvatarUrl(checkOutPhoto))}
                              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                              title="Ver foto de salida"
                            >
                              <Camera className="w-3.5 h-3.5 text-[#A855F7]" />
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3.5 lg:px-4">
                        <StatusBadge status={r.status} />
                      </td>

                      <td className="py-3 px-3.5 lg:px-4">
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
            const photos = (r.photoUrl || "").split(",").map((p: string) => p.trim()).filter(Boolean);
            const checkInPhoto = photos.find((p: string) => !p.includes("_checkout") && !p.includes("checkout")) || null;
            const checkOutPhoto = photos.find((p: string) => p.includes("_checkout") || p.includes("checkout")) || null;
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
                {/* Header row: Avatar, Name, Status */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar className="w-9 h-9 rounded-full shrink-0 shadow-sm">
                    {formatAvatarUrl(r.user?.avatarUrl) && (
                      <AvatarImage src={formatAvatarUrl(r.user?.avatarUrl)!} alt={r.userName} className="object-cover" />
                    )}
                    <AvatarFallback className="bg-avatar-gradient text-white font-bold text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground dark:text-white truncate">
                        {r.userName}
                      </p>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-medium border inline-block mt-0.5 ${
                          isAdmin
                            ? "bg-violet/10 text-violet-ink dark:text-violet border-violet/20"
                            : isPm
                            ? "bg-amber/10 text-amber-ink dark:text-amber border-amber/20"
                            : "bg-blue/10 text-blue dark:text-blue border-blue/20"
                        }`}
                      >
                        {isAdmin ? "Administrador" : isPm ? "Jefe de proyecto" : "Colaborador"}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={r.status} />
                </div>

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
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-mono text-sm font-bold text-foreground dark:text-white">
                        {r.checkIn}
                      </span>
                      {r.checkIn && r.checkIn !== "-" && checkInPhoto && (
                        <button
                          type="button"
                          onClick={() => setSelectedPhotoUrl(formatAvatarUrl(checkInPhoto))}
                          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                          title="Ver foto de entrada"
                        >
                          <Camera className="w-3.5 h-3.5 text-[#A855F7]" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="bg-muted/40 dark:bg-[#141829] border border-border/70 dark:border-[#1E2335] rounded-xl p-2.5">
                    <span className="font-mono text-[10px] font-semibold text-muted-foreground dark:text-[#8F96AE] tracking-wider uppercase block">
                      SALIDA
                    </span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-mono text-sm font-bold text-foreground dark:text-white">
                        {r.checkOut || (
                          <span className="text-muted-foreground dark:text-[#8F96AE] font-normal text-xs">
                            Sin salida
                          </span>
                        )}
                      </span>
                      {r.checkOut && r.checkOut !== "-" && checkOutPhoto && (
                        <button
                          type="button"
                          onClick={() => setSelectedPhotoUrl(formatAvatarUrl(checkOutPhoto))}
                          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                          title="Ver foto de salida"
                        >
                          <Camera className="w-3.5 h-3.5 text-[#A855F7]" />
                        </button>
                      )}
                    </div>
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

      {/* Modal Photo Preview */}
      <Dialog open={!!selectedPhotoUrl} onOpenChange={(open) => { if (!open) setSelectedPhotoUrl(null); }}>
        <DialogContent className="max-w-md bg-card border-border p-4 rounded-2xl">
          <div className="space-y-3">
            <DialogTitle className="font-semibold text-base text-foreground">Foto de marcación</DialogTitle>
            <DialogDescription className="sr-only">Vista previa de la foto de marcación</DialogDescription>
            {selectedPhotoUrl && (
              <img
                src={selectedPhotoUrl}
                alt="Foto de marcación"
                className="w-full h-auto rounded-xl object-contain max-h-[400px] border border-border"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
