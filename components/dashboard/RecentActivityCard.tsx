import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ActivityItem } from "./ActivityItem";
import { useRouter } from "next/navigation";

export function RecentActivityCard({ users = [] }: { users?: any[] }) {
  const router = useRouter();

  // Define static fallback users matching the current design
  const defaultUsers = [
    { initials: "JP", name: "Juan Pérez", action: "Subió justificación de ausencia", time: "1h", color: "blue" },
    { initials: "ML", name: "María López", action: "Registró asistencia", time: "3h", color: "emerald" },
    { initials: "CD", name: "Carlos Díaz", action: "Envió justificante médico", time: "5h", color: "amber" },
  ];

  // Map dynamic users first, and pad/fallback with default users if less than 3
  const displayActivities = Array.from({ length: 3 }).map((_, index) => {
    const user = users[index];
    if (user) {
      const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}` || "U";
      const name = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || "Colaborador";
      const action = index === 0 ? "Subió justificación de ausencia" : index === 1 ? "Registró asistencia" : "Envió justificante médico";
      const time = index === 0 ? "1h" : index === 1 ? "3h" : "5h";
      const color = index === 0 ? "blue" : index === 1 ? "emerald" : "amber";
      return { initials, name, action, time, color };
    }
    return defaultUsers[index];
  });

  return (
    <Card className="h-full">
      <CardContent className="p-5 h-full flex flex-col">
        <div className="mb-4">
          <h3 className="font-semibold text-lg">Actividad reciente</h3>
          <p className="text-sm text-muted-foreground">Últimas acciones del equipo</p>
        </div>

        <div className="flex-1 space-y-3">
          {displayActivities.map((act, idx) => (
            <ActivityItem
              key={idx}
              initials={act.initials}
              name={act.name}
              action={act.action}
              time={act.time}
              color={act.color}
            />
          ))}
        </div>

        <Button
          variant="ghost"
          className="w-full mt-auto text-violet-600 hover:bg-violet-50"
          onClick={() => router.push("/pm/asistencias")}
        >
          Ver todo
        </Button>
      </CardContent>
    </Card>
  );
}
