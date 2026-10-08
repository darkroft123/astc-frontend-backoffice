import { Card, CardContent } from "@/components/ui/card";
import { LegendItem } from "./LegendItem";

interface GeneralSummaryCardProps {
  totalUsers: number;
  teamMembersCount: number;
  pmsCount: number;
  adminsCount: number;
  totalProjects: number;
  activeProjects: number;
}

export function GeneralSummaryCard({
  totalUsers,
  teamMembersCount,
  pmsCount,
  adminsCount,
  totalProjects,
  activeProjects,
}: GeneralSummaryCardProps) {
  const sumRoles = teamMembersCount + pmsCount + adminsCount;
  const total = sumRoles > 0 ? sumRoles : totalUsers;

  const R = 38;
  const C = 2 * Math.PI * R;

  const tmLen = total > 0 ? (teamMembersCount / total) * C : 0;
  const pmLen = total > 0 ? (pmsCount / total) * C : 0;
  const adminLen = total > 0 ? (adminsCount / total) * C : 0;

  return (
    <Card className="h-full rounded-3xl shadow-sm overflow-hidden">
      <CardContent className="p-6 h-full flex flex-col justify-between">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-bold text-lg text-foreground">Estructura de la Organización</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Consolidado de roles, colaboradores y proyectos
            </p>
          </div>
          <span className="text-xs font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-full border border-border flex-shrink-0">
            {totalProjects} {totalProjects === 1 ? 'Proyecto' : 'Proyectos'}
          </span>
        </div>

        <div className="flex-1 flex items-center justify-center py-4">
          <div className="flex items-center gap-8">
            <div className="relative w-40 h-40 sm:w-48 sm:h-48 flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r={R} fill="none" stroke="currentColor" strokeWidth="12" className="text-muted/40" />
                {total > 0 ? (
                  <>
                    {tmLen > 0 && (
                      <circle cx="50" cy="50" r={R} fill="none" stroke="#2563eb" strokeWidth="12"
                        strokeDasharray={`${tmLen} ${C}`} strokeDashoffset="0" strokeLinecap="butt" />
                    )}
                    {pmLen > 0 && (
                      <circle cx="50" cy="50" r={R} fill="none" stroke="#8b5cf6" strokeWidth="12"
                        strokeDasharray={`${pmLen} ${C}`} strokeDashoffset={-tmLen} strokeLinecap="butt" />
                    )}
                    {adminLen > 0 && (
                      <circle cx="50" cy="50" r={R} fill="none" stroke="#f59e0b" strokeWidth="12"
                        strokeDasharray={`${adminLen} ${C}`} strokeDashoffset={-(tmLen + pmLen)} strokeLinecap="butt" />
                    )}
                  </>
                ) : (
                  <circle cx="50" cy="50" r={R} fill="none" stroke="currentColor" strokeWidth="12" className="text-muted/60" />
                )}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-4xl sm:text-5xl font-extrabold text-foreground leading-none">{totalUsers}</p>
                  <p className="text-[10px] tracking-[2px] text-muted-foreground font-bold mt-1">USUARIOS</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <LegendItem color="blue" label="Colaboradores" value={teamMembersCount} />
              <LegendItem color="violet" label="Jefes de Proyecto" value={pmsCount} />
              <LegendItem color="amber" label="Administradores" value={adminsCount} />
              <LegendItem color="emerald" label="Proyectos Activos" value={activeProjects} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
