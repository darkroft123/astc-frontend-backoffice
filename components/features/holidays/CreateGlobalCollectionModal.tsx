"use client";

import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface CreateGlobalCollectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, dates: Date[], dateNames: Record<string, string>) => Promise<void>;
  isSubmitting?: boolean;
}

export function CreateGlobalCollectionModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: CreateGlobalCollectionModalProps) {
  const [formName, setFormName] = useState("");
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [dateNames, setDateNames] = useState<Record<string, string>>({});
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date(2026, 8, 1)); // Default Sep 2026 matching SVG design

  // Format month title: "Septiembre 2026"
  const monthTitle = useMemo(() => {
    const raw = format(currentMonth, "MMMM yyyy", { locale: es });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, [currentMonth]);

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Generate calendar days for current month view
  const calendarCells = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Monday = 0, Sunday = 6
    const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7;

    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells: { day: number; isCurrentMonth: boolean; date: Date }[] = [];

    // Prev month padding
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      cells.push({
        day: d,
        isCurrentMonth: false,
        date: new Date(year, month - 1, d),
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      cells.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(year, month, i),
      });
    }

    // Next month padding to fill complete rows of 7
    const remainder = (7 - (cells.length % 7)) % 7;
    for (let i = 1; i <= remainder; i++) {
      cells.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(year, month + 1, i),
      });
    }

    return cells;
  }, [currentMonth]);

  const isDateSelected = (date: Date) => {
    const targetYMD = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return selectedDates.some(
      (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` === targetYMD
    );
  };

  const toggleDate = (date: Date) => {
    const targetYMD = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const exists = selectedDates.some(
      (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` === targetYMD
    );

    if (exists) {
      setSelectedDates(
        selectedDates.filter(
          (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` !== targetYMD
        )
      );
      const offset = date.getTimezoneOffset();
      const adjusted = new Date(date.getTime() - offset * 60 * 1000);
      const dateStr = adjusted.toISOString().split("T")[0];
      const updated = { ...dateNames };
      delete updated[dateStr];
      setDateNames(updated);
    } else {
      setSelectedDates([...selectedDates, date]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert("El nombre de la colección es obligatorio.");
      return;
    }
    await onSubmit(formName, selectedDates, dateNames);
    // Reset form
    setFormName("");
    setSelectedDates([]);
    setDateNames({});
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[92vw] max-w-[420px] p-0 rounded-3xl bg-white dark:bg-[#12141F] border border-border dark:border-white/10 text-foreground dark:text-white shadow-2xl overflow-hidden focus:outline-none transition-colors"
      >
        <DialogTitle className="sr-only">Crear colección global</DialogTitle>
        <DialogDescription className="sr-only">
          Crea una colección para agrupar múltiples feriados. Aplica a toda la organización.
        </DialogDescription>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {/* Top Grab Handle */}
          <div className="w-10 h-1 rounded-full bg-muted dark:bg-white/20 mx-auto -mt-1 mb-3" />

          {/* Header Row: Title & Subtitle + Squircle Close Button */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-foreground dark:text-white tracking-tight">
                Crear colección global
              </h2>
              <p className="text-xs text-muted-foreground dark:text-[#8F96AE] mt-1 leading-relaxed">
                Crea una colección para agrupar múltiples feriados. Aplica a toda la organización.
              </p>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="w-10 h-10 rounded-2xl bg-[#F8FAFC] dark:bg-[#1D2030] border border-border dark:border-[#2B3048] flex items-center justify-center text-muted-foreground dark:text-[#8F96AE] hover:text-foreground dark:hover:text-white transition-colors cursor-pointer shrink-0 shadow-xs"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Field 1: Nombre de la colección */}
          <div className="pt-1">
            <label className="text-xs font-semibold text-foreground/90 dark:text-white/90 block mb-1.5">
              Nombre de la colección<span className="text-[#EF4444]">*</span>
            </label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Ej. Feriados Perú 2026"
              className="w-full h-12 px-4 rounded-xl bg-[#F8FAFC] dark:bg-[#1D2030] border border-border dark:border-[#2B3048] text-sm text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder-[#606680] focus:outline-none focus:border-purple-500/60 transition-colors shadow-2xs"
            />
          </div>

          {/* Field 2: Selecciona las fechas */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground dark:text-[#8F96AE] block mb-2">
              Selecciona las fechas
            </label>

            {/* Calendar Box matching exact SVG design */}
            <div className="bg-[#F8FAFC] dark:bg-[#181B2A] border border-border dark:border-[#23283E] rounded-2xl p-4 shadow-2xs">
              {/* Header: < Septiembre 2026 > */}
              <div className="flex items-center justify-between mb-3 px-1">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground dark:text-[#8F96AE] hover:text-foreground dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  aria-label="Mes anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="text-sm font-bold text-foreground dark:text-white tracking-tight">
                  {monthTitle}
                </span>

                <button
                  type="button"
                  onClick={nextMonth}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground dark:text-[#8F96AE] hover:text-foreground dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  aria-label="Mes siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Day Headers: LU MA MI JU VI SÁ DO */}
              <div className="grid grid-cols-7 mb-2 text-center">
                {["LU", "MA", "MI", "JU", "VI", "SÁ", "DO"].map((dayName) => (
                  <span
                    key={dayName}
                    className="text-[11px] font-semibold text-muted-foreground dark:text-[#656C8A] uppercase tracking-wider"
                  >
                    {dayName}
                  </span>
                ))}
              </div>

              {/* Day Numbers Grid */}
              <div className="grid grid-cols-7 gap-1 place-items-center">
                {calendarCells.map((cell, idx) => {
                  const selected = cell.isCurrentMonth && isDateSelected(cell.date);

                  if (!cell.isCurrentMonth) {
                    return (
                      <div
                        key={idx}
                        className="w-9 h-9 flex items-center justify-center text-xs font-medium text-muted-foreground/40 dark:text-[#3B425C] select-none"
                      >
                        {cell.day}
                      </div>
                    );
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleDate(cell.date)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-semibold transition-all cursor-pointer ${
                        selected
                          ? "bg-white dark:bg-[#282F48] text-foreground dark:text-white border border-border dark:border-[#3E4868] shadow-sm font-bold scale-105"
                          : "text-foreground dark:text-white/90 hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                    >
                      {cell.day}
                    </button>
                  );
                })}
              </div>

              {/* Bottom Counter */}
              <p className="text-xs text-muted-foreground dark:text-[#8F96AE] text-center mt-3 font-normal">
                Has seleccionado <strong className="text-foreground dark:text-white font-semibold">{selectedDates.length}</strong> días.
              </p>
            </div>
          </div>

          {/* Optional: Names for selected dates (collapsible / compact) */}
          {selectedDates.length > 0 && (
            <div className="max-h-36 overflow-y-auto space-y-2 pr-1 border border-border dark:border-[#23283E] rounded-xl p-2.5 bg-[#F8FAFC] dark:bg-[#161928]">
              <span className="text-[11px] font-semibold text-muted-foreground dark:text-[#8F96AE] block">
                Nombres específicos (Opcional):
              </span>
              {selectedDates.map((d, i) => {
                const offset = d.getTimezoneOffset();
                const adjusted = new Date(d.getTime() - offset * 60 * 1000);
                const dateStr = adjusted.toISOString().split("T")[0];
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[11px] font-mono bg-card dark:bg-[#1D2030] text-muted-foreground dark:text-[#8F96AE] border border-border dark:border-transparent px-2 py-1 rounded-md shrink-0">
                      {dateStr}
                    </span>
                    <input
                      type="text"
                      className="h-8 flex-1 px-2.5 text-xs rounded-lg bg-card dark:bg-[#1D2030] border border-border dark:border-[#2B3048] text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder-[#606680] focus:outline-none"
                      placeholder={formName || "Nombre del feriado..."}
                      value={dateNames[dateStr] || ""}
                      onChange={(e) =>
                        setDateNames((prev) => ({ ...prev, [dateStr]: e.target.value }))
                      }
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer: Cancelar & Crear Colección Buttons */}
          <div className="border-t border-border dark:border-[#1E2338] pt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="h-12 flex-1 rounded-2xl bg-[#F8FAFC] dark:bg-[#1A1D2D] border border-border dark:border-[#2A2F45] text-foreground dark:text-white font-semibold text-sm hover:bg-muted dark:hover:bg-[#23273C] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center disabled:opacity-50 shadow-2xs"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-12 flex-1 rounded-2xl bg-gradient-to-r from-[#5B8CFF] to-[#A855F7] text-white font-semibold text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-purple-500/25 hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>{isSubmitting ? "Creando..." : "Crear colección"}</span>
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
