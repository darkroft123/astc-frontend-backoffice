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
  const totalUsers = usersList.length;
  const teamMembersCount =
    usersList.filter(
      (u) =>
        u.roleCode === "TEAM_MEMBER" ||
        u.roleId === "TEAM_MEMBER" ||
        u.roleName?.toLowerCase().includes("member")
    ).length;

  const pmsCount =
    usersList.filter(
      (u) =>
        u.roleCode === "PROJECT_MANAGER" ||
        u.roleId === "PROJECT_MANAGER" ||
        u.roleName?.toLowerCase().includes("project")
    ).length;

  const adminsCount =
    usersList.filter(
      (u) =>
        u.roleCode === "ADMIN" ||
        u.roleId === "ADMIN" ||
        u.roleName?.toLowerCase().includes("admin")
    ).length;

  const totalProjects = projectsList.length;
  const maxResourceCount = Math.max(totalUsers, teamMembersCount, pmsCount, totalProjects, 1);
  const getBarHeight = (value: number) =>
    Math.max(26, Math.round((value / maxResourceCount) * 118));

  const isUserAdmin =
    user?.role === "ADMIN" ||
    user?.roleCode === "ADMIN" ||
    user?.username?.toLowerCase().startsWith("admin");
  const fullName = isUserAdmin ? "admin" : (user?.username || "admin");
  const email = isUserAdmin && (!user?.email || user.email.includes("astc")) ? "admin@astc.com" : (user?.email || "admin@astc.com");

  // Donut chart calculations: Radius = 52, Circumference = 2 * PI * 52 ≈ 326.726
  const R = 52;
  const C = 2 * Math.PI * R;
  const GAP = 6; // Minimal separation between slices
  const totalAvailable = C - 3 * GAP;

  const teamArc = (teamMembersCount / totalUsers) * totalAvailable;
  const pmArc = (pmsCount / totalUsers) * totalAvailable;
  const adminArc = (adminsCount / totalUsers) * totalAvailable;

  const teamPercent = totalUsers > 0 ? Math.round((teamMembersCount / totalUsers) * 100) : 0;
  const pmPercent = totalUsers > 0 ? Math.round((pmsCount / totalUsers) * 100) : 0;
  const adminPercent = totalUsers > 0 ? Math.round((adminsCount / totalUsers) * 100) : 0;

  return (
    <div className="relative min-h-screen bg-transparent pb-12">
      <div className="relative w-full max-w-7xl mx-auto space-y-4 md:space-y-6 z-10">
        {/* 1. HEADER */}
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.05em] bg-primary/10 text-primary border border-primary/20 dark:bg-violet/10 dark:text-[#7c9aff] dark:border-violet/20 px-2.5 py-0.5 rounded-full">
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
          <div className="w-full xl:w-[280px] 2xl:w-[320px] shrink-0 bg-card border border-border dark:bg-sidebar dark:border-field rounded-2xl p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-[var(--radius-kpi)] bg-avatar-gradient flex items-center justify-center text-white font-bold text-base shrink-0 shadow-sm">
                A
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-base text-foreground dark:text-white truncate">
                    {fullName}
                  </span>
                  <span className="bg-[#5B8CFF]/15 text-[#3b6ed8] border border-[#5B8CFF]/30 dark:bg-[#141C38] dark:border-[#23315C] dark:text-[#A5C0FF] text-[10.5px] font-mono font-bold px-3 py-0.5 rounded-full tracking-wider">
                    ADMIN
                  </span>
                </div>
                <p className="text-xs text-muted-foreground dark:text-text-5 truncate mt-0.5">
                  {email}
                </p>
              </div>
            </div>

            <div className="border-t border-border/70 dark:border-raised my-3.5" />

            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-muted/50 border border-border/70 dark:bg-background dark:border-raised rounded-xl p-3">
                <p className="text-[10px] font-mono uppercase text-muted-foreground dark:text-text-4 font-semibold tracking-wider">
                  USUARIO
                </p>
                <p className="text-sm font-bold text-foreground dark:text-white truncate mt-1">
                  {fullName}
                </p>
              </div>
              <div className="bg-muted/50 border border-border/70 dark:bg-background dark:border-raised rounded-xl p-3">
                <p className="text-[10px] font-mono uppercase text-muted-foreground dark:text-text-4 font-semibold tracking-wider">
                  TELÉFONO
                </p>
                <p className="text-xs text-muted-foreground dark:text-text-5 mt-1 whitespace-nowrap">
                  Sin registrar
                </p>
              </div>
            </div>
          </div>

          {/* CARDS 2-5: RESPONSIVE METRIC CARDS (2-COL ON MOBILE, 4-COL ON TABLET/DESKTOP) */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 xl:flex xl:flex-1 gap-3 md:gap-3.5 w-full">
            {/* CARD 2: JEFES DE PROYECTO */}
            <div
              onClick={() => router.push("/users")}
              className="xl:flex-1 min-w-0 bg-card border border-border hover:border-amber/40 dark:bg-amber/10 dark:backdrop-blur-md dark:border-amber/20 dark:hover:border-amber/60 rounded-2xl p-4 shadow-sm flex flex-col justify-between cursor-pointer transition-colors group"
            >
              <div className="w-8 h-8 rounded-xl bg-amber/10 border border-amber/20 text-amber-ink dark:bg-amber/10 dark:border-amber/20 dark:text-amber flex items-center justify-center shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-amber-ink dark:text-amber font-medium mt-2.5">
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
              className="xl:flex-1 min-w-0 bg-card border border-border hover:border-green/40 dark:bg-green/10 dark:backdrop-blur-md dark:border-green/20 dark:hover:border-green/60 rounded-2xl p-4 shadow-sm flex flex-col justify-between cursor-pointer transition-colors group"
            >
              <div className="w-8 h-8 rounded-xl bg-green/10 border border-green/20 text-green-ink dark:bg-green/15 dark:border-green/20 dark:text-green flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-green-ink dark:text-green font-medium mt-2.5">
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
              className="xl:flex-1 min-w-0 bg-card border border-border hover:border-blue/40 dark:bg-blue/10 dark:backdrop-blur-md dark:border-blue/20 dark:hover:border-blue/60 rounded-2xl p-4 shadow-sm flex flex-col justify-between cursor-pointer transition-colors group"
            >
              <div className="w-8 h-8 rounded-xl bg-blue/10 border border-blue/20 text-blue dark:bg-blue/10 dark:border-blue/20 dark:text-blue flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-blue dark:text-blue font-medium mt-2.5">
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
              className="xl:flex-1 min-w-0 bg-card border border-border hover:border-violet/40 dark:bg-violet/10 dark:backdrop-blur-md dark:border-violet/20 dark:hover:border-violet/60 rounded-2xl p-4 shadow-sm flex flex-col justify-between cursor-pointer transition-colors group"
            >
              <div className="w-8 h-8 rounded-xl bg-violet/10 border border-violet/20 text-violet-ink dark:bg-violet/10 dark:border-violet/20 dark:text-violet flex items-center justify-center shrink-0">
                <FolderKanban className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-violet-ink dark:text-violet font-medium mt-2.5">
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
          <div className="lg:col-span-6 bg-card border border-border dark:bg-blue/10 dark:backdrop-blur-md dark:border-blue/20 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-sm font-bold text-foreground">
                  Estructura de la organización
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Consolidado de roles, trabajadores y proyectos
                </p>
              </div>
              <span className="bg-primary/10 text-primary border border-primary/20 dark:bg-violet/10 dark:text-[#7c9aff] dark:border-violet/20 text-xs px-2.5 py-0.5 rounded-full font-medium">
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
                    stroke="var(--violet)"
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
                    stroke="var(--amber)"
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
                    <span className="w-2.5 h-2.5 rounded-full bg-blue shrink-0" />
                    <span className="text-muted-foreground">Team members</span>
                  </div>
                  <span className="font-semibold text-foreground font-mono">
                    {teamMembersCount} · {teamPercent}%
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-violet shrink-0" />
                    <span className="text-muted-foreground">Project managers</span>
                  </div>
                  <span className="font-semibold text-foreground font-mono">
                    {pmsCount} · {pmPercent}%
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber shrink-0" />
                    <span className="text-muted-foreground">Administradores</span>
                  </div>
                  <span className="font-semibold text-foreground font-mono">
                    {adminsCount} · {adminPercent}%
                  </span>
                </div>

                <div className="pt-3 border-t border-border/80 dark:border-[#1f2840]/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <FolderKanban className="w-3.5 h-3.5 text-green shrink-0" />
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
          <div className="lg:col-span-6 bg-card border border-border dark:bg-[#101322] dark:border-[#1E2335] rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-foreground dark:text-white">
                  Resumen de recursos
                </h2>
                <p className="text-xs text-muted-foreground dark:text-[#8F96AE] mt-0.5">
                  Distribución de entidades del sistema
                </p>
              </div>
              <span className="bg-primary/10 text-primary border border-primary/20 dark:bg-[#141C38] dark:text-[#7B9BFF] dark:border-[#233260] text-[10px] font-mono font-bold px-3 py-1 rounded-full uppercase">
                GLOBAL
              </span>
            </div>

            {/* Custom Bar Chart Canvas Matching Figma SVG */}
            <div className="pt-6 pb-2">
              {/* Bars Row */}
              <div className="grid grid-cols-4 items-end w-full h-[152px]">
                {/* BAR 1: Usuarios (5) */}
                <div className="flex flex-col items-center justify-end h-full">
                  <span className="text-xs font-bold text-foreground dark:text-white font-mono mb-1.5">
                    {totalUsers}
                  </span>
                  <div
                    style={{ height: `${getBarHeight(totalUsers)}px` }}
                    className="w-[52px] sm:w-[56px] max-w-[85%] bg-[#5B8CFF] rounded-t-[10px] rounded-b-[4px] transition-all shadow-sm"
                  />
                </div>

                {/* BAR 2: Trabajadores (3) */}
                <div className="flex flex-col items-center justify-end h-full">
                  <span className="text-xs font-bold text-foreground dark:text-white font-mono mb-1.5">
                    {teamMembersCount}
                  </span>
                  <div
                    style={{ height: `${getBarHeight(teamMembersCount)}px` }}
                    className="w-[52px] sm:w-[56px] max-w-[85%] bg-[#34D399] rounded-t-[10px] rounded-b-[4px] transition-all shadow-sm"
                  />
                </div>

                {/* BAR 3: Jefes de proyecto (1) */}
                <div className="flex flex-col items-center justify-end h-full">
                  <span className="text-xs font-bold text-foreground dark:text-white font-mono mb-1.5">
                    {pmsCount}
                  </span>
                  <div
                    style={{ height: `${getBarHeight(pmsCount)}px` }}
                    className="w-[52px] sm:w-[56px] max-w-[85%] bg-[#FBBF24] rounded-t-[10px] rounded-b-[4px] transition-all shadow-sm"
                  />
                </div>

                {/* BAR 4: Proyectos (3) */}
                <div className="flex flex-col items-center justify-end h-full">
                  <span className="text-xs font-bold text-foreground dark:text-white font-mono mb-1.5">
                    {totalProjects}
                  </span>
                  <div
                    style={{ height: `${getBarHeight(totalProjects)}px` }}
                    className="w-[52px] sm:w-[56px] max-w-[85%] bg-[#A855F7] rounded-t-[10px] rounded-b-[4px] transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Baseline */}
              <div className="w-full border-b border-border/80 dark:border-white/10" />

              {/* Labels Row */}
              <div className="grid grid-cols-4 w-full pt-2.5">
                <span className="text-[10px] sm:text-xs text-muted-foreground dark:text-[#8F96AE] text-center block truncate px-0.5">
                  Usuarios
                </span>
                <span className="text-[10px] sm:text-xs text-muted-foreground dark:text-[#8F96AE] text-center block px-0.5">
                  Trabajadores
                </span>
                <div className="text-[10px] sm:text-xs text-muted-foreground dark:text-[#8F96AE] text-center flex flex-col items-center justify-start leading-[13px] px-0.5">
                  <span>Jefes de</span>
                  <span>proyecto</span>
                </div>
                <span className="text-[10px] sm:text-xs text-muted-foreground dark:text-[#8F96AE] text-center block truncate px-0.5">
                  Proyectos
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. BOTTOM ROW: ACCIONES RÁPIDAS */}
        <div className="bg-card border border-border dark:bg-blue/10 dark:backdrop-blur-md dark:border-blue/20 rounded-2xl p-5 shadow-sm space-y-3">
          <div>
            <h2 className="text-sm font-bold text-foreground">
              Acciones rápidas
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Accesos directos para la administración del sistema
            </p>
          </div>

          <div className="flex flex-col lg:grid lg:grid-cols-5 gap-3 pt-1">
            {/* 1: MARCAR ASISTENCIA (Radiant Button) */}
            <button
              type="button"
              onClick={() => router.push("/registrar")}
              className="w-full lg:w-auto h-12 px-4 rounded-xl flex items-center justify-center gap-2 bg-brand-gradient hover:brightness-110 active:scale-[0.98] text-white font-medium text-xs transition-all shadow-lg shadow-purple-500/25 cursor-pointer"
            >
              <ScanFace size={16} strokeWidth={2.2} />
              <span>Marcar asistencia</span>
            </button>

            {/* 2-5: 2x2 GRID ON MOBILE, SPREAD ACROSS DESKTOP GRID */}
            <div className="grid grid-cols-2 lg:contents gap-3">
              {/* 2: GESTIÓN DE USUARIOS */}
              <button
                type="button"
                onClick={() => router.push("/users")}
                className="h-12 px-4 rounded-xl flex items-center justify-center gap-2 bg-muted/60 hover:bg-muted border border-border text-foreground dark:bg-blue/10 dark:hover:bg-blue/20 dark:border-blue/20 dark:text-[#e2e8f0] font-medium text-xs transition-colors cursor-pointer"
              >
                <Users size={16} className="text-muted-foreground" />
                <span>Gestión de usuarios</span>
              </button>

              {/* 3: PROYECTOS */}
              <button
                type="button"
                onClick={() => router.push("/projects")}
                className="h-12 px-4 rounded-xl flex items-center justify-center gap-2 bg-muted/60 hover:bg-muted border border-border text-foreground dark:bg-blue/10 dark:hover:bg-blue/20 dark:border-blue/20 dark:text-[#e2e8f0] font-medium text-xs transition-colors cursor-pointer"
              >
                <Briefcase size={16} className="text-muted-foreground" />
                <span>Proyectos</span>
              </button>

              {/* 4: FERIADOS GLOBALES */}
              <button
                type="button"
                onClick={() => router.push("/feriados")}
                className="h-12 px-4 rounded-xl flex items-center justify-center gap-2 bg-muted/60 hover:bg-muted border border-border text-foreground dark:bg-blue/10 dark:hover:bg-blue/20 dark:border-blue/20 dark:text-[#e2e8f0] font-medium text-xs transition-colors cursor-pointer"
              >
                <Calendar size={16} className="text-muted-foreground" />
                <span>Feriados globales</span>
              </button>

              {/* 5: MIS ASISTENCIAS */}
              <button
                type="button"
                onClick={() => router.push("/mis-asistencias")}
                className="h-12 px-4 rounded-xl flex items-center justify-center gap-2 bg-muted/60 hover:bg-muted border border-border text-foreground dark:bg-blue/10 dark:hover:bg-blue/20 dark:border-blue/20 dark:text-[#e2e8f0] font-medium text-xs transition-colors cursor-pointer"
              >
                <Clock size={16} className="text-muted-foreground" />
                <span>Mis asistencias</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
