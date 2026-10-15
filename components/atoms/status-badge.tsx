import { cn } from "@/lib/utils";

type StatusType = string;

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusStyles: Record<string, string> = {
  ON_TIME:
    "bg-green/10 text-green-ink border-green/20",
  ON_TIME_CHECKED_OUT:
    "bg-green/10 text-green-ink border-green/20",
  LATE:
    "bg-amber/10 text-amber-ink border-amber/20",
  LATE_CHECKED_OUT:
    "bg-amber/10 text-amber-ink border-amber/20",
  EARLY:
    "bg-amber/10 text-amber-ink border-amber/20",
  EARLY_CHECKED_OUT:
    "bg-amber/10 text-amber-ink border-amber/20",
  OUTSIDE_SCHEDULE:
    "bg-red/10 text-red-ink border-red/20",
  OUTSIDE_SCHEDULE_CHECKED_OUT:
    "bg-red/10 text-red-ink border-red/20",
  EARLY_DEPARTURE:
    "bg-amber/10 text-amber-ink border-amber/20",
  CHECKED_IN:
    "bg-primary/10 text-primary border-primary/20",
  CHECKED_OUT:
    "bg-green/10 text-green-ink border-green/20",
  ASISTENCIA:
    "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20",
  PRESENTE:
    "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20",
  FALTA:
    "bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500/20",
  TARDE:
    "bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/20",
  PENDING:
    "bg-amber/10 text-amber-ink border-amber/20",
  SUBMITTED:
    "bg-primary/10 text-primary border-primary/20",
  OBSERVATION:
    "bg-amber/10 text-amber-ink border-amber/20",
  APPROVED:
    "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20",
  REJECTED:
    "bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500/20",
  JUSTIFICADO:
    "bg-primary/10 text-primary border-primary/20",
  VACACIONES:
    "bg-primary/10 text-violet-ink border-primary/20",
};

const statusLabels: Record<string, string> = {
  ASISTENCIA: "Asistencia",
  ON_TIME: "Asistencia",
  ON_TIME_CHECKED_OUT: "Asistencia",
  LATE: "Tarde",
  LATE_CHECKED_OUT: "Tarde",
  EARLY: "Entrada anticipada",
  EARLY_CHECKED_OUT: "Salida anticipada",
  OUTSIDE_SCHEDULE: "Fuera de horario",
  OUTSIDE_SCHEDULE_CHECKED_OUT: "Fuera de horario",
  EARLY_DEPARTURE: "Salida temprana",
  CHECKED_IN: "Entrada registrada",
  CHECKED_OUT: "Salida registrada",
  PRESENTE: "Asistencia",
  FALTA: "Falta",
  TARDE: "Tarde",
  PENDING: "Borrador",
  SUBMITTED: "Pendiente",
  OBSERVATION: "Observación",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
  JUSTIFICADO: "Justificado",
  VACACIONES: "Vacaciones",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalizedKey = status ? String(status).toUpperCase() : "";
  const label = statusLabels[normalizedKey] || status || "";
  const style =
    statusStyles[normalizedKey] ||
    "bg-muted text-muted-foreground border border-border";

  const isGreen = normalizedKey === "ASISTENCIA" || normalizedKey === "ON_TIME" || normalizedKey === "PRESENTE" || normalizedKey === "APPROVED";
  const isRed = normalizedKey === "FALTA" || normalizedKey === "REJECTED" || normalizedKey.includes("OUTSIDE");
  const isAmber = normalizedKey.includes("LATE") || normalizedKey.includes("EARLY") || normalizedKey === "TARDE";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors",
        style,
        className
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full mr-1.5",
          isGreen ? "bg-emerald-500" : isRed ? "bg-rose-500" : isAmber ? "bg-amber-500" : "bg-primary"
        )}
      />
      {label}
    </span>
  );
}