"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users, Briefcase, UserCog, UserCheck, Calendar, Clock, ScanFace, Loader2 } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { GeneralSummaryCard } from "@/components/dashboard/GeneralSummaryCard";
import { formatAvatarUrl } from "@/lib/avatar-url";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAuthGuard } from "@/app/jwt/auth/useAuthGuard";
import { getUser } from "@/app/services/users.service";
import {
  getAllProjects,
  getGlobalCollections,
} from "@/app/services/project.assistance.service";

/* ================= GRAPHQL ================= */
import { getGraphQLUrl } from "@/lib/api-host";

const ROLES = {
  ADMIN: "018f6b7a-0001-7000-8000-000000000001",
  PROJECT_MANAGER: "018f6b7a-0001-7000-8000-000000000002",
  TEAM_MEMBER: "018f6b7a-0001-7000-8000-000000000003",
};

/* ================= FETCH USERS ================= */
async function fetchUsersList(token: string): Promise<any[]> {
  try {
    const res = await fetch(getGraphQLUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query: `
          query {
            listUsers {
              id
              username
              roleId
            }
          }
        `,
      }),
    });

    const json = await res.json();
    return json?.data?.listUsers || [];
  } catch (err) {
    console.error("GRAPHQL ERROR:", err);
    return [];
  }
}

/* ================= PAGE ================= */
export default function AdminDashboardPage() {
  const router = useRouter();
  const { hydrated, token, user, role, checkingAuth } = useAuthGuard(["ADMIN"]);

  const [usersList, setUsersList] = useState<any[]>([]);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [holidaysCount, setHolidaysCount] = useState(0);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  /* ================= LOAD DASHBOARD METRICS ================= */
  useEffect(() => {
    if (!token || checkingAuth || !hydrated) return;

    let isMounted = true;
    setLoading(true);

    Promise.all([
      fetchUsersList(token).catch(() => []),
      getAllProjects(token).catch(() => []),
      getGlobalCollections(token).catch(() => []),
      user?.sub ? getUser(token, user.sub).catch(() => null) : Promise.resolve(null),
    ])
      .then(([users, projects, cols, userProfile]) => {
        if (!isMounted) return;
        setUsersList(Array.isArray(users) ? users : []);
        setProjectsList(Array.isArray(projects) ? projects : []);
        const totalHolidays = Array.isArray(cols)
          ? cols.reduce((acc: number, c: any) => acc + (c.items?.length || 0), 0)
          : 0;
        setHolidaysCount(totalHolidays);
        if (userProfile) setUserData(userProfile);
      })
      .catch((err) => console.error("Error loading dashboard data:", err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token, checkingAuth, hydrated, user?.sub]);

  /* ================= LOADING ================= */
  if (!hydrated || checkingAuth || !token || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  /* ================= CALCULATIONS ================= */
  const totalUsers = usersList.length;
  const teamMembersCount = usersList.filter(
    (u) => u.roleId === ROLES.TEAM_MEMBER || u.roleId === "3" || !u.roleId
  ).length;
  const pmsCount = usersList.filter(
    (u) => u.roleId === ROLES.PROJECT_MANAGER || u.roleId === "2"
  ).length;
  const adminsCount = usersList.filter(
    (u) => u.roleId === ROLES.ADMIN || u.roleId === "1"
  ).length;

  const totalProjects = projectsList.length;
  const activeProjectsCount = projectsList.filter(
    (p) => p.status === "ACTIVE" || !p.status
  ).length;

  const fullName =
    `${userData?.firstName ?? ""} ${userData?.lastName ?? ""}`.trim() ||
    user?.username ||
    "—";

  const avatarSrc = formatAvatarUrl(userData?.avatarUrl || user?.avatarUrl);
  const initialLetter = (userData?.username || user?.username || "A").charAt(0).toUpperCase();

  const chartData = [
    {
      name: "Usuarios",
      value: totalUsers,
    },
    {
      name: "Trabajadores",
      value: teamMembersCount,
    },
    {
      name: "Jefes de Proyecto",
      value: pmsCount,
    },
    {
      name: "Proyectos",
      value: totalProjects,
    },
  ];

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-muted/50 pb-12">
      {/* HEADER */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Panel Global
              </span>
              <span className="text-zinc-400 text-xs">•</span>
              <span className="text-zinc-500 text-xs font-medium">Panel Administrativo</span>
            </div>
            <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight mt-1">
              Dashboard General
            </h1>
            <p className="text-sm text-muted-foreground">
              Visión ejecutiva de los recursos de la organización, proyectos y usuarios del sistema
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* TOP ROW: PROFILE & KEY METRICS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* USER PROFILE CARD */}
          <Card className="lg:col-span-4 bg-gradient-to-br from-primary via-primary to-primary/80 rounded-2xl shadow-md border-0 overflow-hidden text-white">
            <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12 rounded-full border-2 border-white/40 shadow-sm shrink-0">
                  <AvatarImage src={avatarSrc} alt={fullName} className="object-cover" />
                  <AvatarFallback className="bg-card text-primary text-lg font-bold">
                    {initialLetter}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                  <span className="bg-card/20 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                    {role || "ADMINISTRADOR"}
                  </span>
                  <h2 className="text-base font-bold text-white truncate mt-0.5">
                    {fullName}
                  </h2>
                  <p className="text-blue-100 text-xs truncate">
                    {userData?.email || user.email || "—"}
                  </p>
                </div>
              </div>

              {/* GRID INFO */}
              <div className="grid grid-cols-2 gap-2 text-left pt-2 border-t border-white/15">
                <div className="bg-card/10 rounded-xl p-2.5">
                  <p className="text-white/70 text-[9px] uppercase tracking-wider font-semibold">USUARIO</p>
                  <p className="text-white text-xs font-bold truncate mt-0.5">
                    {userData?.username || user.username}
                  </p>
                </div>

                <div className="bg-card/10 rounded-xl p-2.5">
                  <p className="text-white/70 text-[9px] uppercase tracking-wider font-semibold">TELÉFONO</p>
                  <p className="text-white text-xs font-bold truncate mt-0.5">
                    {userData?.phone || "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* MAIN EXECUTIVE METRIC CARDS */}
          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div onClick={() => router.push("/users")} className="cursor-pointer">
              <MetricCard
                icon={<Users className="w-8 h-8 opacity-80" />}
                value={loading ? "..." : totalUsers}
                title="Usuarios"
                subtitle="En el sistema"
                trend="Gestión global"
                color="blue"
              />
            </div>

            <div onClick={() => router.push("/projects")} className="cursor-pointer">
              <MetricCard
                icon={<Briefcase className="w-8 h-8 opacity-80" />}
                value={loading ? "..." : activeProjectsCount}
                title="Proyectos"
                subtitle={`${activeProjectsCount} de ${totalProjects} activos`}
                trend="Organización"
                color="violet"
              />
            </div>

            <div onClick={() => router.push("/users")} className="cursor-pointer">
              <MetricCard
                icon={<UserCog className="w-8 h-8 opacity-80" />}
                value={loading ? "..." : pmsCount}
                title="Jefes de Proyecto"
                subtitle="Líderes asignados"
                trend="Gestión de equipo"
                color="indigo"
              />
            </div>

            <div onClick={() => router.push("/users")} className="cursor-pointer">
              <MetricCard
                icon={<UserCheck className="w-8 h-8 opacity-80" />}
                value={loading ? "..." : teamMembersCount}
                title="Colaboradores"
                subtitle="Personal operativo"
                trend="Personal activo"
                color="emerald"
              />
            </div>
          </div>
        </div>

        {/* SECOND ROW: DISTRIBUTION SUMMARY & RESOURCE CHART */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* DISTRIBUTION SUMMARY CARD */}
          <div className="lg:col-span-6">
            <GeneralSummaryCard
              totalUsers={totalUsers}
              teamMembersCount={teamMembersCount}
              pmsCount={pmsCount}
              adminsCount={adminsCount}
              totalProjects={totalProjects}
              activeProjects={activeProjectsCount}
            />
          </div>

          {/* RESOURCE OVERVIEW CHART */}
          <Card className="lg:col-span-6 bg-card border border-border rounded-3xl shadow-sm overflow-hidden">
            <CardContent className="p-6 h-full flex flex-col justify-between">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-bold text-lg text-foreground">Resumen de Recursos</h3>
                  <p className="text-xs text-muted-foreground">Distribución de entidades del sistema</p>
                </div>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                  Global
                </span>
              </div>

              <div className="flex-1 w-full min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" stroke="#71717A" fontSize={12} interval={0} />
                    <YAxis stroke="#71717A" fontSize={12} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E4E4E7' }} />
                    <Bar dataKey="value" fill="#2563EB" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* THIRD ROW: QUICK ACTIONS */}
        <Card className="bg-card border border-border rounded-3xl shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg text-foreground">Acciones Rápidas</h3>
                <p className="text-xs text-muted-foreground">Accesos directos para la administración del sistema</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <Button
                onClick={() => router.push("/registrar")}
                className="h-auto py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl flex flex-col items-center justify-center gap-1.5 shadow-sm transition-all hover:shadow-md"
              >
                <ScanFace className="w-5 h-5" />
                <span className="text-xs font-bold">Marcar Asistencia</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => router.push("/users")}
                className="h-auto py-3.5 px-4 border-border hover:bg-accent text-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-1.5 shadow-sm"
              >
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-xs font-bold">Usuarios</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => router.push("/projects")}
                className="h-auto py-3.5 px-4 border-border hover:bg-accent text-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-1.5 shadow-sm"
              >
                <Briefcase className="w-5 h-5 text-violet-600" />
                <span className="text-xs font-bold">Proyectos</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => router.push("/feriados")}
                className="h-auto py-3.5 px-4 border-border hover:bg-accent text-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-1.5 shadow-sm"
              >
                <Calendar className="w-5 h-5 text-amber-600" />
                <span className="text-xs font-bold">Feriados Globales</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => router.push("/mis-asistencias")}
                className="h-auto py-3.5 px-4 border-border hover:bg-accent text-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-1.5 shadow-sm col-span-2 sm:col-span-1"
              >
                <Clock className="w-5 h-5 text-indigo-600" />
                <span className="text-xs font-bold">Mis Asistencias</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
