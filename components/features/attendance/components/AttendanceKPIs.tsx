"use client";

import { Clock, CheckCircle2, XCircle, TrendingUp } from "lucide-react";

interface AttendanceKPIsProps {
  metrics: {
    total: number;
    onTime: number;
    late: number;
    absences: number;
    rate: number;
  };
}

export function AttendanceKPIs({ metrics }: AttendanceKPIsProps) {
  return (
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
  );
}
