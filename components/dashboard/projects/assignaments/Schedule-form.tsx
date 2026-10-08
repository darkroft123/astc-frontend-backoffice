"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Save, Clock, Repeat, CalendarDays, CalendarRange, Settings, Info, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import {
  getAllProjects,
} from "@/app/services/project.assistance.service";
import { getGraphQLUrl } from "@/lib/api-host";

const CREATE_TEMPLATE = `
  mutation createShiftTemplate($input: ShiftTemplateInput!) {
    createShiftTemplate(input: $input) {
      id
      projectId
      shiftType
      name
    }
  }
`;

type ShiftType = "REGULAR" | "ROTATING_4X4" | "ROTATING_7X7" | "FLEXIBLE" | "TRANSITORY";

const SHIFT_TYPES: { key: ShiftType; label: string; icon: typeof Clock; desc: string }[] = [
  { key: "REGULAR", label: "Regular", icon: Clock, desc: "Lun-Vie laboral, Sab-Dom descanso" },
  { key: "ROTATING_4X4", label: "Rotativo 4x4", icon: Repeat, desc: "4 días trabajo / 4 descanso" },
  { key: "ROTATING_7X7", label: "Rotativo 7x7", icon: Repeat, desc: "7 días trabajo / 7 descanso" },
  { key: "FLEXIBLE", label: "Flexible", icon: CalendarDays, desc: "Horario distinto por día" },
  { key: "TRANSITORY", label: "Transitorio", icon: CalendarRange, desc: "Rango de fechas específico" },
];

const DAYS = [
  { key: "monday" as const, label: "Lunes" },
  { key: "tuesday" as const, label: "Martes" },
  { key: "wednesday" as const, label: "Miércoles" },
  { key: "thursday" as const, label: "Jueves" },
  { key: "friday" as const, label: "Viernes" },
  { key: "saturday" as const, label: "Sábado" },
  { key: "sunday" as const, label: "Domingo" },
];

const ICON_BY_SHIFT: Record<string, typeof Clock> = {
  REGULAR: Clock,
  ROTATING_4X4: Repeat,
  ROTATING_7X7: Repeat,
  FLEXIBLE: CalendarDays,
  TRANSITORY: CalendarRange,
};

export default function ScheduleForm({
  mode = "create",
  initialData,
}: any) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, hydrated } = useAuth();

  const [advancedMode, setAdvancedMode] = useState(false);

  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");

  // Simple mode fields
  const [startHour, setStartHour] = useState("08:00");
  const [endHour, setEndHour] = useState("17:00");
  const [graceMinutes, setGraceMinutes] = useState(10);
  const [absenceCutoffTime, setAbsenceCutoffTime] = useState("09:30");

  // Advanced mode fields
  const [shiftType, setShiftType] = useState<ShiftType>("REGULAR");

  const [flexHours, setFlexHours] = useState<Record<string, { start: string; end: string }>>({
    monday: { start: "08:00", end: "17:00" },
    tuesday: { start: "08:00", end: "17:00" },
    wednesday: { start: "08:00", end: "17:00" },
    thursday: { start: "08:00", end: "17:00" },
    friday: { start: "08:00", end: "17:00" },
    saturday: { start: "", end: "" },
    sunday: { start: "", end: "" },
  });

  const [rotationWorkDays, setRotationWorkDays] = useState(4);
  const [rotationRestDays, setRotationRestDays] = useState(4);
  const [rotationStartHour, setRotationStartHour] = useState("08:00");
  const [rotationEndHour, setRotationEndHour] = useState("20:00");

  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && token) {
      getAllProjects(token)
        .then((projData) => {
          setProjects(projData || []);
          const qProjectId = searchParams.get("projectId");
          if (qProjectId) {
            setSelectedProjectId(qProjectId);
            const p = (projData || []).find((x: any) => x.id === qProjectId);
            if (p) {
              setStartHour(p.workStartTime || "08:00");
              setEndHour(p.workEndTime || "17:00");
            }
          }
        })
        .catch((err) => console.error("Error loading projects:", err));
    }
  }, [hydrated, token, searchParams]);

  useEffect(() => {
    if (shiftType === "ROTATING_4X4") {
      setRotationWorkDays(4);
      setRotationRestDays(4);
    } else if (shiftType === "ROTATING_7X7") {
      setRotationWorkDays(7);
      setRotationRestDays(7);
    }
  }, [shiftType]);

  useEffect(() => {
    if (!selectedProjectId) return;
    const proj = projects.find(p => p.id === selectedProjectId);
    if (!proj) return;
    if (proj.workStartTime) {
      setStartHour(proj.workStartTime.substring(0, 5));
      setRotationStartHour(proj.workStartTime.substring(0, 5));
    }
    if (proj.workEndTime) {
      setEndHour(proj.workEndTime.substring(0, 5));
      setRotationEndHour(proj.workEndTime.substring(0, 5));
    }
  }, [selectedProjectId, projects]);

  const handleSubmit = async () => {
    if (!hydrated || !token) return;
    setError(null);

    if (!selectedProjectId) {
      setError("Seleccione un proyecto.");
      return;
    }

    try {
      setIsSubmitting(true);

      const selectedProject = projects.find(p => p.id === selectedProjectId);

      if (!advancedMode) {
        // Simple mode: update the project's fallback schedule directly
        const projAny = selectedProject as any;
        const updateInput: any = {
          name: projAny?.name || "Proyecto",
          description: projAny?.description || "",
          status: projAny?.status || "ACTIVE",
          startDate: projAny?.startDate || "",
          endDate: projAny?.endDate || "",
          budget: projAny?.budget || 0,
          currency: projAny?.currency || "PEN",
          workStartTime: startHour,
          workEndTime: endHour,
          graceMinutes,
          absenceCutoffTime: absenceCutoffTime ? `${absenceCutoffTime}:00` : null,
        };

        const res = await fetch(getGraphQLUrl(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            query: `
              mutation updateProject($id: String!, $input: ProjectInput!) {
                updateProject(id: $id, input: $input) { id name }
              }
            `,
            variables: { id: selectedProjectId, input: updateInput },
          }),
        });

        const json = await res.json();
        if (json.errors) throw new Error(json.errors[0].message);
      } else {
        // Advanced mode: create a shift template for the project
        const input: any = {
          projectId: selectedProjectId,
          name: "Plantilla de horario",
          shiftType,
          graceMinutes,
          timezone: selectedProject?.timezone || "America/Lima",
          absenceCutoffTime: absenceCutoffTime ? `${absenceCutoffTime}:00` : null,
        };

        if (shiftType === "REGULAR" || shiftType === "TRANSITORY") {
          input.workStartTime = `${startHour}:00`;
          input.workEndTime = `${endHour}:00`;
        }

        if (shiftType === "FLEXIBLE") {
          for (const day of DAYS) {
            const h = flexHours[day.key];
            input[`${day.key}Start`] = h.start ? `${h.start}:00` : null;
            input[`${day.key}End`] = h.end ? `${h.end}:00` : null;
          }
        }

        if (shiftType.startsWith("ROTATING")) {
          input.rotationWorkDays = rotationWorkDays;
          input.rotationRestDays = rotationRestDays;
          input.rotationShiftStartTime = `${rotationStartHour}:00`;
          input.rotationShiftEndTime = `${rotationEndHour}:00`;
          input.validFrom = validFrom || null;
        }

        if (shiftType === "TRANSITORY") {
          input.validFrom = validFrom || null;
          input.validUntil = validUntil || null;
        }

        const res = await fetch(getGraphQLUrl(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            query: CREATE_TEMPLATE,
            variables: { input },
          }),
        });

        const json = await res.json();
        if (json.errors) throw new Error(json.errors[0].message);
      }

      router.push("/projects");
    } catch (err: any) {
      setError(err?.message || "Error al guardar.");
      setIsSubmitting(false);
    }
  };

  const SelectedIcon = ICON_BY_SHIFT[shiftType] || Clock;
  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-4">

        <div className="flex items-center justify-between gap-2 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
              <CalendarDays className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Configurar Horario del Proyecto</h1>
              <p className="text-xs text-muted-foreground">Define el horario base o una plantilla para el proyecto</p>
            </div>
          </div>

          <Button
            type="button"
            variant={advancedMode ? "default" : "outline"}
            size="sm"
            onClick={() => setAdvancedMode(!advancedMode)}
            className="gap-1.5 text-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {advancedMode ? "Modo simple" : "Modo avanzado"}
          </Button>
        </div>

        {error && (
          <div className="mb-5 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
            {error}
          </div>
        )}

        {!advancedMode && (
          <div className="bg-card border rounded-2xl shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-zinc-600 block mb-1">Proyecto</label>
                <select
                  className="h-10 w-full border rounded-lg px-3 text-sm bg-background"
                  value={selectedProjectId}
                  onChange={(e) => {
                    const p = projects.find((x) => x.id === e.target.value);
                    setSelectedProjectId(p?.id || "");
                    if (p) {
                      setStartHour(p.workStartTime || "08:00");
                      setEndHour(p.workEndTime || "17:00");
                    }
                  }}
                >
                  <option value="">Seleccionar proyecto</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-600 block mb-1">Hora de entrada</label>
                <input type="time" value={startHour} onChange={(e) => setStartHour(e.target.value)} className="h-10 w-full border rounded-lg px-3 text-sm" />
                <p className="text-[10px] text-zinc-400 mt-0.5">Hora esperada de inicio de jornada</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-600 block mb-1">Hora de salida</label>
                <input type="time" value={endHour} onChange={(e) => setEndHour(e.target.value)} className="h-10 w-full border rounded-lg px-3 text-sm" />
                <p className="text-[10px] text-zinc-400 mt-0.5">Hora esperada de fin de jornada</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-600 block mb-1">Tolerancia (min)</label>
                <input type="number" min={0} max={120} value={graceMinutes} onChange={(e) => setGraceMinutes(parseInt(e.target.value) || 0)} className="h-10 w-full border rounded-lg px-3 text-sm" />
                <p className="text-[10px] text-zinc-400 mt-0.5">Minutos de gracia para llegar tarde</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-600 block mb-1">Corte de falta</label>
                <input type="time" value={absenceCutoffTime} onChange={(e) => setAbsenceCutoffTime(e.target.value)} className="h-10 w-full border rounded-lg px-3 text-sm" />
                <p className="text-[10px] text-zinc-400 mt-0.5">Hora límite para marcar o genera falta</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => window.history.back()}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-blue-600">
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? "Guardando..." : "Guardar horario base"}
              </Button>
            </div>
          </div>
        )}

        {advancedMode && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            <div className="space-y-6">

              <Card className="border-border shadow-sm">
                <CardHeader className="pb-3 bg-zinc-50/50 border-b border-zinc-100">
                  <CardTitle className="text-sm">1. Proyecto</CardTitle>
                  <CardDescription className="text-xs">Selecciona el proyecto para la plantilla de horario</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <Select value={selectedProjectId} onValueChange={(v) => {
                    const p = projects.find((x) => x.id === v);
                    setSelectedProjectId(v);
                    if (p) {
                      setStartHour(p.workStartTime || "08:00");
                      setEndHour(p.workEndTime || "17:00");
                    }
                  }}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar proyecto..." />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card className="border-border shadow-sm">
                <CardHeader className="pb-3 bg-zinc-50/50 border-b border-zinc-100">
                  <CardTitle className="text-sm">2. Tipo de Turno</CardTitle>
                  <CardDescription className="text-xs">Elige la modalidad de horario para el proyecto</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {SHIFT_TYPES.map((t) => {
                      const Icon = t.icon;
                      const isActive = shiftType === t.key;
                      return (
                        <button
                          key={t.key}
                          type="button"
                          onClick={() => setShiftType(t.key)}
                          className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 text-xs font-medium transition-all
                            ${isActive
                              ? "bg-blue-600/10 text-blue-700 border-blue-600 shadow-sm"
                              : "border-border bg-background text-muted-foreground hover:border-border hover:bg-muted"}`}
                        >
                          <Icon className={`w-5 h-5 ${isActive ? "text-blue-600" : "text-zinc-400"}`} />
                          <span className="text-center leading-tight font-semibold">{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">

              {(shiftType === "REGULAR" || shiftType === "TRANSITORY") && (
                <Card className="border-border shadow-sm">
                  <CardHeader className="pb-3 bg-zinc-50/50 border-b border-zinc-100">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      3. Horario {shiftType === "TRANSITORY" ? "Transitorio" : "Regular"}
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">Define las horas de entrada y salida</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="flex gap-3 bg-blue-50/50 text-blue-800 p-3 rounded-lg border border-blue-100 text-xs">
                      <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
                      <p>
                        {shiftType === "REGULAR"
                          ? "Horario laboral de Lunes a Viernes. Sábados y Domingos son descanso automático (no se exige marcar ni genera falta). Ideal para personal administrativo u oficina."
                          : "Los miembros tendrán este horario solo durante el rango de fechas seleccionado."}
                      </p>
                    </div>
                    {(shiftType === "REGULAR" || shiftType === "TRANSITORY") && (
                      <div className="flex gap-2 bg-muted/50 p-2 rounded-lg border border-zinc-100">
                        <Button type="button" variant="outline" size="sm" className="h-8 text-xs flex-1 bg-background" onClick={() => { setStartHour("08:00"); setEndHour("17:00"); }}>Día</Button>
                        <Button type="button" variant="outline" size="sm" className="h-8 text-xs flex-1 bg-background" onClick={() => { setStartHour("14:00"); setEndHour("22:00"); }}>Tarde</Button>
                        <Button type="button" variant="outline" size="sm" className="h-8 text-xs flex-1 bg-background" onClick={() => { setStartHour("22:00"); setEndHour("06:00"); }}>
Noche <span className="text-[9px] text-zinc-400 ml-1">22:00–06:00</span>
                        </Button>
                      </div>
                    )}
                    {(shiftType === "REGULAR" || shiftType === "TRANSITORY") && startHour === "22:00" && endHour === "06:00" && (
                      <div className="flex gap-2 bg-amber-50/50 text-amber-700 p-2 rounded-lg border border-amber-200 text-[10px]">
                        <Info className="w-3 h-3 shrink-0 mt-0.5" />
                        <p>Turno nocturno: la jornada cruza la medianoche. El sistema evaluará la asistencia entre las 22:00 y las 06:00 del día siguiente.</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Hora de Entrada</Label>
                        <Input type="time" value={startHour} onChange={(e) => setStartHour(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Hora de Salida</Label>
                        <Input type="time" value={endHour} onChange={(e) => setEndHour(e.target.value)} />
                      </div>
                    </div>
                    {shiftType === "TRANSITORY" && (
                      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-zinc-100">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Válido desde</Label>
                          <Input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Válido hasta</Label>
                          <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {shiftType === "FLEXIBLE" && (
                <Card className="border-border shadow-sm">
                  <CardHeader className="pb-3 bg-zinc-50/50 border-b border-zinc-100">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-muted-foreground" />
                      3. Horario Flexible
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">Configura horas distintas por día</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex gap-3 bg-blue-50/50 text-blue-800 p-3 rounded-lg border border-blue-100 text-xs mb-4">
                      <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
                      <p>Los días sin horas configuradas se consideran día libre y no generarán faltas automáticas.</p>
                    </div>
                    {DAYS.map((day) => {
                      const h = flexHours[day.key];
                      return (
                        <div key={day.key} className="grid grid-cols-[80px_1fr_1fr] gap-3 items-center">
                          <span className="text-xs font-medium text-muted-foreground">{day.label}</span>
                          <Input type="time" className="h-8 text-xs" value={h.start} onChange={(e) => setFlexHours({ ...flexHours, [day.key]: { ...h, start: e.target.value } })} />
                          <Input type="time" className="h-8 text-xs" value={h.end} onChange={(e) => setFlexHours({ ...flexHours, [day.key]: { ...h, end: e.target.value } })} />
                        </div>
                      );
                    })}
                    <p className="text-[10px] text-zinc-400 mt-2 text-center bg-muted/50 py-1 rounded">Deja vacío si es día libre</p>
                  </CardContent>
                </Card>
              )}

              {shiftType.startsWith("ROTATING") && (
                <Card className="border-border shadow-sm">
                  <CardHeader className="pb-3 bg-zinc-50/50 border-b border-zinc-100">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Repeat className="w-4 h-4 text-muted-foreground" />
                      3. Turno Rotativo
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">Ciclos de trabajo y descanso</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="flex gap-3 bg-blue-50/50 text-blue-800 p-3 rounded-lg border border-blue-100 text-xs">
                      <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
                      <p>El equipo trabajará <strong>{rotationWorkDays} días</strong> consecutivos y descansará <strong>{rotationRestDays} días</strong>. Durante el descanso no se generarán faltas.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Días de trabajo</Label>
                        <Input type="number" min={1} max={30} value={rotationWorkDays} onChange={(e) => setRotationWorkDays(parseInt(e.target.value) || 4)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Días de descanso</Label>
                        <Input type="number" min={1} max={30} value={rotationRestDays} onChange={(e) => setRotationRestDays(parseInt(e.target.value) || 4)} />
                      </div>
                    </div>
                    <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-center">
                      <p className="text-xs text-blue-700 font-medium">Ciclo: {rotationWorkDays}d trabajo → {rotationRestDays}d descanso</p>
                    </div>
                    <div className="flex gap-2 bg-muted/50 p-2 rounded-lg border border-zinc-100">
                      <Button type="button" variant="outline" size="sm" className="h-8 text-xs flex-1 bg-background" onClick={() => { setRotationStartHour("08:00"); setRotationEndHour("20:00"); }}>Día</Button>
                      <Button type="button" variant="outline" size="sm" className="h-8 text-xs flex-1 bg-background" onClick={() => { setRotationStartHour("14:00"); setRotationEndHour("22:00"); }}>Tarde</Button>
                      <Button type="button" variant="outline" size="sm" className="h-8 text-xs flex-1 bg-background" onClick={() => { setRotationStartHour("22:00"); setRotationEndHour("06:00"); }}>
                        Noche <span className="text-[9px] text-zinc-400 ml-1">22:00–06:00</span>
                      </Button>
                    </div>
                    {rotationStartHour === "22:00" && rotationEndHour === "06:00" && (
                      <div className="flex gap-2 bg-amber-50/50 text-amber-700 p-2 rounded-lg border border-amber-200 text-[10px]">
                        <Info className="w-3 h-3 shrink-0 mt-0.5" />
                        <p>Turno nocturno: la jornada cruza la medianoche. El sistema evaluará la asistencia entre las 22:00 y las 06:00 del día siguiente.</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Entrada (laboral)</Label>
                        <Input type="time" value={rotationStartHour} onChange={(e) => setRotationStartHour(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Salida (laboral)</Label>
                        <Input type="time" value={rotationEndHour} onChange={(e) => setRotationEndHour(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-1.5 pt-2 border-t border-zinc-100">
                      <Label className="text-xs text-muted-foreground">Fecha de inicio del ciclo</Label>
                      <Input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
                      <p className="text-[10px] text-muted-foreground">El sistema empezará a contar el ciclo desde esta fecha. Si no se asigna, usará la fecha actual.</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="border-border shadow-sm">
                <CardHeader className="pb-3 bg-zinc-50/50 border-b border-zinc-100">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    4. Reglas Generales
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">Tolerancia y hora límite para generar faltas</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Tolerancia (minutos)</Label>
                      <Input type="number" min={0} max={120} value={graceMinutes} onChange={(e) => setGraceMinutes(parseInt(e.target.value) || 0)} />
                      <p className="text-[10px] text-muted-foreground">Minutos después de la hora de entrada para llegar a tiempo.</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Corte de falta automática</Label>
                      <Input type="time" value={absenceCutoffTime} onChange={(e) => setAbsenceCutoffTime(e.target.value)} />
                      <p className="text-[10px] text-muted-foreground">Si no marcan antes de esta hora, se genera falta automática. En turnos nocturnos solo evalúa dentro de la ventana del turno.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-blue-600/5 border-blue-600/20 shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <SelectedIcon className="w-4 h-4 text-blue-700" />
                      <p className="text-sm font-medium text-foreground">{selectedProject?.name || "Sin proyecto"}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {SHIFT_TYPES.find(s => s.key === shiftType)?.label} | Tolerancia: {graceMinutes}m | Corte: {absenceCutoffTime || "—"}
                    </p>
                  </div>
                  <Button onClick={handleSubmit} disabled={isSubmitting || !selectedProjectId} className="shrink-0 shadow-sm bg-blue-600 hover:bg-blue-700">
                    <Save className="w-4 h-4 mr-2" />
                    {isSubmitting ? "Guardando..." : "Guardar plantilla"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

