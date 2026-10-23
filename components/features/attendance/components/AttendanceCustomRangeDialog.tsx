"use client";

import {
  Calendar as CalendarIcon,
  Check,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface AttendanceCustomRangeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tempStartDate: string;
  tempEndDate: string;
  setTempStartDate: (date: string) => void;
  setTempEndDate: (date: string) => void;
  onPreset: (daysOrType: number | "month") => void;
  onApply: () => void;
}

export function AttendanceCustomRangeDialog({
  isOpen,
  onClose,
  tempStartDate,
  tempEndDate,
  setTempStartDate,
  setTempEndDate,
  onPreset,
  onApply,
}: AttendanceCustomRangeDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
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
            onClick={onClose}
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
                onClick={() => onPreset(7)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-[#141828] border border-slate-200 dark:border-[#232A40] text-foreground dark:text-[#C8D1E6] hover:bg-slate-200 dark:hover:bg-[#1E243A] hover:text-foreground dark:hover:text-white transition-colors cursor-pointer"
              >
                7 días
              </button>
              <button
                type="button"
                onClick={() => onPreset(15)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-[#141828] border border-slate-200 dark:border-[#232A40] text-foreground dark:text-[#C8D1E6] hover:bg-slate-200 dark:hover:bg-[#1E243A] hover:text-foreground dark:hover:text-white transition-colors cursor-pointer"
              >
                15 días
              </button>
              <button
                type="button"
                onClick={() => onPreset(30)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-[#141828] border border-slate-200 dark:border-[#232A40] text-foreground dark:text-[#C8D1E6] hover:bg-slate-200 dark:hover:bg-[#1E243A] hover:text-foreground dark:hover:text-white transition-colors cursor-pointer"
              >
                30 días
              </button>
              <button
                type="button"
                onClick={() => onPreset("month")}
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
            onClick={onClose}
            className="px-5 h-11 rounded-2xl bg-slate-100 dark:bg-[#141828] border border-slate-200 dark:border-[#232A40] text-xs font-semibold text-foreground dark:text-[#C8D1E6] hover:bg-slate-200 dark:hover:bg-[#1E243A] hover:text-foreground dark:hover:text-white transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onApply}
            disabled={!tempStartDate || !tempEndDate}
            className="flex-1 h-11 rounded-2xl bg-brand-gradient hover:opacity-95 disabled:opacity-50 text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4 text-white" />
            <span>Aplicar rango</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
