"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Calendar as CalendarIcon, Plus } from "lucide-react";
import { MonthCalendarPicker } from "./MonthCalendarPicker";

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
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [dateNames, setDateNames] = useState<Record<string, string>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggleDate = (dateStr: string) => {
    setSelectedDates((prev) => {
      if (prev.includes(dateStr)) {
        const next = prev.filter((d) => d !== dateStr);
        setDateNames((old) => {
          const updated = { ...old };
          delete updated[dateStr];
          return updated;
        });
        return next;
      } else {
        return [...prev, dateStr].sort();
      }
    });
  };

  const handleClose = () => {
    setFormName("");
    setSelectedDates([]);
    setDateNames({});
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    if (selectedDates.length === 0) {
      alert("Por favor selecciona al menos una fecha.");
      return;
    }

    const dateObjects = selectedDates.map((str) => new Date(`${str}T12:00:00`));
    await onSubmit(formName, dateObjects, dateNames);
    handleClose();
  };

  if (!open || !mounted) return null;

  const modalNode = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in-0 duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="w-full max-w-lg md:max-w-4xl max-h-[92vh] overflow-y-auto overscroll-contain bg-card dark:bg-[#0E111C] border border-border dark:border-[#1E2335] rounded-[24px] sm:rounded-[28px] p-5 sm:p-7 pb-8 sm:pb-8 shadow-2xl relative text-foreground dark:text-white space-y-5">
        {/* Mobile Slide-Down to Close Button & Handle */}
        <button
          type="button"
          onClick={handleClose}
          onTouchStart={(e) => {
            (e.currentTarget as any)._startY = e.touches[0].clientY;
          }}
          onTouchEnd={(e) => {
            const startY = (e.currentTarget as any)._startY;
            if (startY && e.changedTouches[0].clientY - startY > 20) {
              handleClose();
            }
          }}
          className="w-12 h-1.5 rounded-full bg-muted-foreground/30 hover:bg-muted-foreground/60 active:bg-muted-foreground/80 active:scale-95 transition-all mx-auto md:hidden block cursor-pointer -mt-1 mb-2 touch-none"
          title="Deslizar hacia abajo o pulsar para cerrar"
          aria-label="Cerrar modal"
        />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-2 border-b border-border dark:border-[#1E2335]">
          <div>
            <h3 className="text-lg font-bold text-foreground dark:text-white">
              Crear colección global
            </h3>
            <p className="text-xs text-muted-foreground dark:text-[#8F96AE] mt-1">
              Crea una colección para agrupar múltiples feriados. Aplica a toda la organización.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-xl border border-border dark:border-[#1E2335] bg-muted/50 dark:bg-[#141829] hover:bg-muted dark:hover:bg-[#1c2238] flex items-center justify-center text-muted-foreground hover:text-foreground dark:hover:text-white transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Desktop 2-column layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
            {/* Left Column: Nombre & Calendar */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground dark:text-white">
                  Nombre de la colección<span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Feriados Perú 2026"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] text-xs font-medium text-foreground dark:text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground dark:text-white">
                    Selecciona las fechas
                  </label>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-[#A855F7] border border-purple-500/20 font-semibold">
                    {selectedDates.length} seleccionadas
                  </span>
                </div>
                <MonthCalendarPicker
                  selectedDates={selectedDates}
                  onToggleDate={handleToggleDate}
                />
              </div>
            </div>

            {/* Right Column: Holiday Names / Empty prompt */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground dark:text-white block">
                Nombres específicos <span className="text-muted-foreground dark:text-[#8F96AE] font-normal">(opcional)</span>
              </label>

              {selectedDates.length > 0 ? (
                <div className="rounded-2xl border border-border dark:border-[#1E2335] bg-muted/50 dark:bg-[#111422] p-4 space-y-3">
                  <p className="text-[11px] text-muted-foreground dark:text-[#8F96AE]">
                    Asigna un nombre a cada feriado seleccionado para que el equipo lo identifique fácilmente:
                  </p>
                  <div className="space-y-2 max-h-[300px] md:max-h-[350px] overflow-y-auto pr-1">
                    {selectedDates.map((dateStr) => (
                      <div key={dateStr} className="flex items-center gap-2">
                        <span className="px-3 py-2 rounded-xl border border-border dark:border-[#1E2335] bg-card dark:bg-[#141829] text-xs font-mono text-foreground dark:text-white min-w-[105px] text-center shrink-0">
                          {dateStr}
                        </span>
                        <input
                          type="text"
                          placeholder="Ej. Día del Trabajador..."
                          value={dateNames[dateStr] || ""}
                          onChange={(e) =>
                            setDateNames((prev) => ({
                              ...prev,
                              [dateStr]: e.target.value,
                            }))
                          }
                          className="flex-1 h-9 px-3 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#141829] text-xs font-medium text-foreground dark:text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border dark:border-[#1E2335] bg-muted/30 dark:bg-[#111422]/60 p-8 flex flex-col items-center justify-center text-center space-y-3 min-h-[260px]">
                  <div className="w-12 h-12 rounded-2xl bg-background dark:bg-[#141829] border border-border dark:border-[#1E2335] flex items-center justify-center text-purple-600 dark:text-[#A855F7]">
                    <CalendarIcon className="w-6 h-6 stroke-[1.8]" />
                  </div>
                  <p className="text-xs font-semibold text-foreground dark:text-white">
                    Ninguna fecha seleccionada
                  </p>
                  <p className="text-[11px] text-muted-foreground dark:text-[#8F96AE] max-w-[240px]">
                    Haz clic en los días del calendario a la izquierda para marcarlos como feriados y asignarles un nombre.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border dark:border-[#1E2335]">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-border dark:border-[#1E2335] bg-card dark:bg-[#141829] hover:bg-muted dark:hover:bg-[#1c2238] text-xs font-semibold text-foreground dark:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-white text-xs font-semibold shadow-lg shadow-purple-500/25 hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              style={{
                background: "linear-gradient(90deg, #5B8CFF 0%, #A855F7 100%)",
              }}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{isSubmitting ? "Creando..." : "Crear colección"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalNode, document.body) : null;
}
