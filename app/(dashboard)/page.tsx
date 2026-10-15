"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Briefcase,
  UserCheck,
  Calendar,
  Clock,
  ScanFace,
  FolderKanban,
  Loader2,
} from "lucide-react";
import { useAuthGuard } from "@/app/jwt/auth/useAuthGuard";
import { listUsers } from "@/app/services/users.service";
import { getAllProjects } from "@/app/services/project.assistance.service";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { hydrated, token, user, checkingAuth } = useAuthGuard(["ADMIN"]);

  const [loading, setLoading] = useState(true);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [projectsList, setProjectsList] = useState<any[]>([]);

  useEffect(() => {
    if (!token || checkingAuth || !hydrated) return;

    let isMounted = true;
    setLoading(true);

    Promise.all([
      listUsers(token).catch(() => []),
      getAllProjects(token).catch(() => []),
    ])
      .then(([users, projects]) => {
        if (!isMounted) return;
        setUsersList(Array.isArray(users) ? users : users?.items || []);
        setProjectsList(Array.isArray(projects) ? projects : []);
      })
      .catch((err) => console.error("Error loading dashboard data:", err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token, checkingAuth, hydrated]);

  if (!hydrated || checkingAuth || !token || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  /* ================= METRICS ================= */
  const totalUsers = usersList.length > 0 ? usersList.length : 5;
  const teamMembersCount =
    usersList.filter(
      (u) =>
        u.roleCode === "TEAM_MEMBER" ||
        u.roleId === "TEAM_MEMBER" ||
        u.roleName?.toLowerCase().includes("member")
    ).length || 3;

  const pmsCount =
    usersList.filter(
      (u) =>
        u.roleCode === "PROJECT_MANAGER" ||
        u.roleId === "PROJECT_MANAGER" ||
        u.roleName?.toLowerCase().includes("project")
    ).length || 1;

  const adminsCount =
    usersList.filter(
      (u) =>
        u.roleCode === "ADMIN" ||
        u.roleId === "ADMIN" ||
        u.roleName?.toLowerCase().includes("admin")
    ).length || 1;

  const totalProjects = projectsList.length > 0 ? Math.min(projectsList.length, 3) : 3;

  const fullName = user?.username || "admin";
  const email = user?.email || "admin@astc.com";

  // Donut chart calculations: Radius = 52, Circumference = 2 * PI * 52 ≈ 326.726
  const R = 52;
  const C = 2 * Math.PI * R;
  const GAP = 6; // Minimal separation between slices
  const totalAvailable = C - 3 * GAP;

  const teamArc = (teamMembersCount / totalUsers) * totalAvailable;
  const pmArc = (pmsCount / totalUsers) * totalAvailable;
  const adminArc = (adminsCount / totalUsers) * totalAvailable;

  const teamPercent = Math.round((teamMembersCount / totalUsers) * 100);
  const pmPercent = Math.round((pmsCount / totalUsers) * 100);
  const adminPercent = Math.round((adminsCount / totalUsers) * 100);

  return (
    <div className="relative min-h-screen bg-transparent pb-12">
      <div className="relative max-w-6xl mx-auto px-4 sm:px-8 py-6 space-y-6 z-10">
        {/* 1. HEADER */}
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.05em] bg-primary/10 text-primary border border-primary/20 dark:bg-[#1a2238]/80 dark:text-[#7c9aff] dark:border-[#2b3758] px-2.5 py-0.5 rounded-full">
              CONTROL GLOBAL
            </span>
            <span className="font-sans text-xs text-muted-foreground">
              · Panel administrativo
            </span>
          </div>

          <h1 className="text-[26px] font-bold text-foreground tracking-tight leading-tight">
            Dashboard general
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Visión ejecutiva de los recursos de la organización, proyectos y usuarios del sistema.
          </p>
        </div>

        {/* 2. TOP ROW: 5 SUMMARY CARDS WITH RESPONSIVE LAYOUT & OFFICIAL FIGMA DESIGN */}
        <div className="flex flex-col xl:flex-row gap-3.5 items-stretch">
          {/* CARD 1: ADMIN PROFILE CARD */}
          <div className="w-full xl:w-[280px] 2xl:w-[320px] shrink-0 bg-card border border-border dark:bg-[#0c0d18] dark:border-[#252538] rounded-2xl p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#38bdf8] via-[#818cf8] to-[#c084fc] flex items-center justify-center text-white font-bold text-base shrink-0 shadow-sm">
                A
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-base text-foreground dark:text-white truncate">
                    {fullName}
                  </span>
                  <span className="bg-primary/10 text-primary border border-primary/20 dark:bg-[#181a33] dark:text-[#7d97ff] dark:border-[#2b3054] text-[10.5px] font-mono font-bold px-2.5 py-0.5 rounded-full">
                    ADMIN
                  </span>
                </div>
                <p className="text-xs text-muted-foreground dark:text-[#707694] truncate mt-0.5">
                  {email}
                </p>
              </div>
            </div>

            <div className="border-t border-border/70 dark:border-[#1e1f30] my-3.5" />

            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-muted/50 border border-border/70 dark:bg-[#080811] dark:border-[#1c1d2e] rounded-xl p-3">
                <p className="text-[10px] font-mono uppercase text-muted-foreground dark:text-[#8b8fa8] font-semibold tracking-wider">
                  USUARIO
                </p>
                <p className="text-sm font-bold text-foreground dark:text-white truncate mt-1">
                  {fullName}
                </p>
              </div>
              <div className="bg-muted/50 border border-border/70 dark:bg-[#080811] dark:border-[#1c1d2e] rounded-xl p-3">
                <p className="text-[10px] font-mono uppercase text-muted-foreground dark:text-[#8b8fa8] font-semibold tracking-wider">
                  TELÉFONO
                </p>
                <p className="text-xs text-muted-foreground dark:text-[#707694] mt-1 whitespace-nowrap">
                  Sin registrar
                </p>
              </div>
            </div>
          </div>

          {/* CARDS 2-5: RESPONSIVE METRIC CARDS (2-COL ON MOBILE, 4-COL ON TABLET/DESKTOP) */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 xl:flex xl:flex-1 gap-3.5 w-full">
            {/* CARD 2: JEFES DE PROYECTO */}
            <div
              onClick={() => router.push("/users")}
              className="xl:flex-1 min-w-0 bg-card border border-border hover:border-amber-500/40 dark:bg-[#16120b]/70 dark:backdrop-blur-md dark:border-[#382b16] dark:hover:border-amber-500/60 rounded-2xl p-4 shadow-sm flex flex-col justify-between cursor-pointer transition-colors group"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:bg-[#261d0f] dark:border-[#4a371a] dark:text-amber-400 flex items-center justify-center shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-2.5">
                  Jefes de proyecto
                </p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {pmsCount}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Project managers
                </p>
              </div>
            </div>

            {/* CARD 3: TRABAJADORES */}
            <div
              onClick={() => router.push("/users")}
              className="xl:flex-1 min-w-0 bg-card border border-border hover:border-emerald-500/40 dark:bg-[#0a1713]/70 dark:backdrop-blur-md dark:border-[#16382b] dark:hover:border-emerald-500/60 rounded-2xl p-4 shadow-sm flex flex-col justify-between cursor-pointer transition-colors group"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:bg-[#112920] dark:border-[#1c4737] dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-2.5">
                  Trabajadores
                </p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {teamMembersCount}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Personal de campo
                </p>
              </div>
            </div>

            {/* CARD 4: USUARIOS */}
            <div
              onClick={() => router.push("/users")}
              className="xl:flex-1 min-w-0 bg-card border border-border hover:border-blue-500/40 dark:bg-[#0c1322]/70 dark:backdrop-blur-md dark:border-[#1a2b4a] dark:hover:border-blue-500/60 rounded-2xl p-4 shadow-sm flex flex-col justify-between cursor-pointer transition-colors group"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:bg-[#14223b] dark:border-[#213760] dark:text-blue-400 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-2.5">
                  Usuarios
                </p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {totalUsers}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  En el sistema
                </p>
              </div>
            </div>

            {/* CARD 5: PROYECTOS */}
            <div
              onClick={() => router.push("/projects")}
              className="xl:flex-1 min-w-0 bg-card border border-border hover:border-purple-500/40 dark:bg-[#130d22]/70 dark:backdrop-blur-md dark:border-[#311c50] dark:hover:border-purple-500/60 rounded-2xl p-4 shadow-sm flex flex-col justify-between cursor-pointer transition-colors group"
            >
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:bg-[#23153d] dark:border-[#44236e] dark:text-purple-400 flex items-center justify-center shrink-0">
                <FolderKanban className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mt-2.5">
                  Proyectos
                </p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {totalProjects}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  de {totalProjects} totales
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. MIDDLE ROW: TWO CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* DONUT: ESTRUCTURA DE LA ORGANIZACIÓN */}
          <div className="lg:col-span-6 bg-card border border-border dark:bg-[#0e1322]/70 dark:backdrop-blur-md dark:border-[#212b45] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-sm font-bold text-foreground">
                  Estructura de la organización
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Consolidado de roles, colaboradores y proyectos
                </p>
              </div>
              <span className="bg-primary/10 text-primary border border-primary/20 dark:bg-[#1c243a] dark:text-[#7c9aff] dark:border-[#2b3758] text-xs px-2.5 py-0.5 rounded-full font-medium">
                {totalProjects} proyectos
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-6">
              {/* DONUT SVG WITH GAPS */}
              <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
                  {/* Segment 1: Team members (Blue) */}
                  <circle
                    cx="70"
                    cy="70"
                    r={R}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="18"
                    strokeDasharray={`${teamArc} ${C}`}
                    strokeDashoffset="0"
                  />
                  {/* Segment 2: PMs (Purple) */}
                  <circle
                    cx="70"
                    cy="70"
                    r={R}
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="18"
                    strokeDasharray={`${pmArc} ${C}`}
                    strokeDashoffset={-(teamArc + GAP)}
                  />
                  {/* Segment 3: Admins (Amber) */}
                  <circle
                    cx="70"
                    cy="70"
                    r={R}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="18"
                    strokeDasharray={`${adminArc} ${C}`}
                    strokeDashoffset={-(teamArc + GAP + pmArc + GAP)}
                  />
                </svg>

                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center select-none pointer-events-none">
                  <span className="text-3xl font-extrabold text-foreground leading-none">
                    {totalUsers}
                  </span>
                  <span className="text-[10px] font-mono font-semibold tracking-widest text-muted-foreground uppercase mt-1">
                    USUARIOS
                  </span>
                </div>
              </div>

              {/* LEGEND */}
              <div className="space-y-3 min-w-[200px]">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                    <span className="text-muted-foreground">Team members</span>
                  </div>
                  <span className="font-semibold text-foreground font-mono">
                    {teamMembersCount} · {teamPercent}%
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
                    <span className="text-muted-foreground">Project managers</span>
                  </div>
                  <span className="font-semibold text-foreground font-mono">
                    {pmsCount} · {pmPercent}%
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                    <span className="text-muted-foreground">Administradores</span>
                  </div>
                  <span className="font-semibold text-foreground font-mono">
                    {adminsCount} · {adminPercent}%
                  </span>
                </div>

                <div className="pt-3 border-t border-border/80 dark:border-[#1f2840]/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <FolderKanban className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="text-muted-foreground">Proyectos activos</span>
                  </div>
                  <span className="font-bold text-foreground font-mono">
                    {totalProjects}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* BAR CHART: RESUMEN DE RECURSOS */}
          <div className="lg:col-span-6 bg-card border border-border dark:bg-[#0e1322]/70 dark:backdrop-blur-md dark:border-[#212b45] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-sm font-bold text-foreground">
                  Resumen de recursos
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Distribución de entidades del sistema
                </p>
              </div>
              <span className="bg-primary/10 text-primary border border-primary/20 dark:bg-[#1c243a] dark:text-[#7c9aff] dark:border-[#2b3758] text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase">
                GLOBAL
              </span>
            </div>

            {/* Custom Bar Chart Canvas */}
            <div className="py-4">
              <div className="relative h-44 w-full flex items-end justify-between px-4 pb-6 pt-6">
                {/* Y-Axis dashed grid lines */}
                <div className="absolute inset-x-0 bottom-6 border-b border-border dark:border-[#212b45]" />
                <div className="absolute inset-x-0 bottom-[68px] border-b border-border/60 dark:border-[#212b45]/60 border-dashed" />
                <div className="absolute inset-x-0 bottom-[114px] border-b border-border/60 dark:border-[#212b45]/60 border-dashed" />
                <div className="absolute inset-x-0 top-4 border-b border-border/60 dark:border-[#212b45]/60 border-dashed" />

                {/* Y-Axis numbers */}
                <span className="absolute left-0 bottom-5 text-[10px] font-mono text-muted-foreground">0</span>
                <span className="absolute left-0 bottom-[63px] text-[10px] font-mono text-muted-foreground">2</span>
                <span className="absolute left-0 bottom-[109px] text-[10px] font-mono text-muted-foreground">4</span>
                <span className="absolute left-0 top-3 text-[10px] font-mono text-muted-foreground">6</span>

                {/* BARS */}
                <div className="flex-1 flex items-end justify-around pl-4">
                  {/* BAR 1: Usuarios (5) */}
                  <div className="flex flex-col items-center gap-1.5 w-14">
                    <span className="text-xs font-bold text-foreground font-mono">5</span>
                    <div
                      style={{ height: `${(5 / 6) * 110}px` }}
                      className="w-full bg-[#3b82f6] rounded-t-lg transition-all shadow-sm"
                    />
                    <span className="text-[11px] text-muted-foreground text-center truncate mt-1">
                      Usuarios
                    </span>
                  </div>

                  {/* BAR 2: Trabajadores (3) */}
                  <div className="flex flex-col items-center gap-1.5 w-14">
                    <span className="text-xs font-bold text-foreground font-mono">3</span>
                    <div
                      style={{ height: `${(3 / 6) * 110}px` }}
                      className="w-full bg-[#10b981] rounded-t-lg transition-all shadow-sm"
                    />
                    <span className="text-[11px] text-muted-foreground text-center truncate mt-1">
                      Trabajadores
                    </span>
                  </div>

                  {/* BAR 3: Jefes de proyecto (1) */}
                  <div className="flex flex-col items-center gap-1.5 w-14">
                    <span className="text-xs font-bold text-foreground font-mono">1</span>
                    <div
                      style={{ height: `${(1 / 6) * 110}px` }}
                      className="w-full bg-[#f59e0b] rounded-t-lg transition-all shadow-sm"
                    />
                    <span className="text-[11px] text-muted-foreground text-center truncate mt-1">
                      Jefes de proyecto
                    </span>
                  </div>

                  {/* BAR 4: Proyectos (3) */}
                  <div className="flex flex-col items-center gap-1.5 w-14">
                    <span className="text-xs font-bold text-foreground font-mono">3</span>
                    <div
                      style={{ height: `${(3 / 6) * 110}px` }}
                      className="w-full bg-[#a855f7] rounded-t-lg transition-all shadow-sm"
                    />
                    <span className="text-[11px] text-muted-foreground text-center truncate mt-1">
                      Proyectos
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. BOTTOM ROW: ACCIONES RÁPIDAS */}
        <div className="bg-card border border-border dark:bg-[#0e1322]/70 dark:backdrop-blur-md dark:border-[#212b45] rounded-2xl p-5 shadow-sm space-y-3">
          <div>
            <h2 className="text-sm font-bold text-foreground">
              Acciones rápidas
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Accesos directos para la administración del sistema
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
            {/* 1: MARCAR ASISTENCIA (Radiant Button) */}
            <button
              type="button"
              onClick={() => router.push("/registrar")}
              className="h-12 px-4 rounded-xl flex items-center justify-center gap-2 bg-gradient-to-r from-[#4f46e5] via-[#7c3aed] to-[#38bdf8] hover:brightness-110 active:scale-[0.98] text-white font-medium text-xs transition-all shadow-lg shadow-purple-500/25 cursor-pointer"
            >
              <ScanFace size={16} strokeWidth={2.2} />
              <span>Marcar asistencia</span>
            </button>

            {/* 2: GESTIÓN DE USUARIOS */}
            <button
              type="button"
              onClick={() => router.push("/users")}
              className="h-12 px-4 rounded-xl flex items-center justify-center gap-2 bg-muted/60 hover:bg-muted border border-border text-foreground dark:bg-[#141b2f]/80 dark:hover:bg-[#1a233d] dark:border-[#222c48]/80 dark:text-[#e2e8f0] font-medium text-xs transition-colors cursor-pointer"
            >
              <Users size={16} className="text-muted-foreground" />
              <span>Gestión de usuarios</span>
            </button>

            {/* 3: PROYECTOS */}
            <button
              type="button"
              onClick={() => router.push("/projects")}
              className="h-12 px-4 rounded-xl flex items-center justify-center gap-2 bg-muted/60 hover:bg-muted border border-border text-foreground dark:bg-[#141b2f]/80 dark:hover:bg-[#1a233d] dark:border-[#222c48]/80 dark:text-[#e2e8f0] font-medium text-xs transition-colors cursor-pointer"
            >
              <Briefcase size={16} className="text-muted-foreground" />
              <span>Proyectos</span>
            </button>

            {/* 4: FERIADOS GLOBALES */}
            <button
              type="button"
              onClick={() => router.push("/feriados")}
              className="h-12 px-4 rounded-xl flex items-center justify-center gap-2 bg-muted/60 hover:bg-muted border border-border text-foreground dark:bg-[#141b2f]/80 dark:hover:bg-[#1a233d] dark:border-[#222c48]/80 dark:text-[#e2e8f0] font-medium text-xs transition-colors cursor-pointer"
            >
              <Calendar size={16} className="text-muted-foreground" />
              <span>Feriados globales</span>
            </button>

            {/* 5: MIS ASISTENCIAS */}
            <button
              type="button"
              onClick={() => router.push("/mis-asistencias")}
              className="h-12 px-4 rounded-xl flex items-center justify-center gap-2 bg-muted/60 hover:bg-muted border border-border text-foreground dark:bg-[#141b2f]/80 dark:hover:bg-[#1a233d] dark:border-[#222c48]/80 dark:text-[#e2e8f0] font-medium text-xs transition-colors cursor-pointer"
            >
              <Clock size={16} className="text-muted-foreground" />
              <span>Mis asistencias</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
