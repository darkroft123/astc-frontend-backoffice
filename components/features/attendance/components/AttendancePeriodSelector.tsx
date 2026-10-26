"use client";

import { Calendar as CalendarIcon } from "lucide-react";

export type Period =
  | "today"
  | "thisweek"
  | "month"
  | "3months"
  | "6months"
  | "9months"
  | "total";

export const PERIOD_TABS: { id: Period; label: string }[] = [
  { id: "today", label: "Hoy" },
  { id: "thisweek", label: "Esta semana" },
  { id: "month", label: "Este mes" },
  { id: "3months", label: "3 meses" },
  { id: "6months", label: "6 meses" },
  { id: "9months", label: "9 meses" },
  { id: "total", label: "Total" },
];

interface AttendancePeriodSelectorProps {
  activePeriod: Period;
  setActivePeriod: (p: Period) => void;
  dateRangeDisplay: string;
  onOpenCalendar: () => void;
}

export function AttendancePeriodSelector({
  activePeriod,
  setActivePeriod,
  dateRangeDisplay,
  onOpenCalendar,
}: AttendancePeriodSelectorProps) {
  return (
    <>
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
            onClick={onOpenCalendar}
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
            onClick={onOpenCalendar}
            className="w-9 h-9 rounded-xl bg-white dark:bg-[#151928] border border-slate-200 dark:border-[#232A40] flex items-center justify-center text-muted-foreground dark:text-[#8F98B2] hover:text-foreground dark:hover:text-white shadow-xs transition-colors cursor-pointer"
            aria-label="Abrir selector de fecha"
          >
            <CalendarIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}
