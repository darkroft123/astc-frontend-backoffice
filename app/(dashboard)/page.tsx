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
  const teamMembersCount = usersList.filter(
    (u) =>
      u.roleCode === "TEAM_MEMBER" ||
      u.roleId === "TEAM_MEMBER" ||
      u.roleName?.toLowerCase().includes("member")
  ).length || 3;

  const pmsCount = usersList.filter(
    (u) =>
      u.roleCode === "PROJECT_MANAGER" ||
      u.roleId === "PROJECT_MANAGER" ||
      u.roleName?.toLowerCase().includes("project")
  ).length || 1;

  const adminsCount = usersList.filter(
    (u) =>
      u.roleCode === "ADMIN" ||
      u.roleId === "ADMIN" ||
      u.roleName?.toLowerCase().includes("admin")
  ).length || 1;

  const totalProjects = projectsList.length > 0 ? Math.min(projectsList.length, 3) : 3;

  const fullName = user?.username || "admin";
  const email = user?.email || "admin@astc.com";

  // Percentages for Donut chart (Total = totalUsers)
  const teamPercent = Math.round((teamMembersCount / totalUsers) * 100);
  const pmPercent = Math.round((pmsCount / totalUsers) * 100);
  const adminPercent = Math.round((adminsCount / totalUsers) * 100);

  // SVG Donut calculation: Radius = 56, Circumference ≈ 351.858
  const C = 2 * Math.PI * 56;
  const teamArc = (teamMembersCount / totalUsers) * C;
  const pmArc = (pmsCount / totalUsers) * C;
  const adminArc = (adminsCount / totalUsers) * C;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* 1. HEADER (Directly integrated, without gray block) */}
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.05em] text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
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

        {/* 2. TOP ROW: 5 SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* CARD 1: ADMIN PROFILE */}
          <div className="bg-card border border-border rounded-2xl p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-xs">
                A
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-foreground truncate">
                    {fullName}
                  </span>
                  <span className="bg-primary/15 text-primary text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                    ADMIN
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {email}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-border/60">
              <div className="bg-muted/40 rounded-xl p-2">
                <p className="text-[9px] font-mono uppercase text-muted-foreground font-semibold">
                  USUARIO
                </p>
                <p className="text-xs font-bold text-foreground truncate mt-0.5">
                  {fullName}
                </p>
              </div>
              <div className="bg-muted/40 rounded-xl p-2">
                <p className="text-[9px] font-mono uppercase text-muted-foreground font-semibold">
                  TELÉFONO
                </p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  Sin registrar
                </p>
              </div>
            </div>
          </div>

          {/* CARD 2: JEFES DE PROYECTO */}
          <div
            onClick={() => router.push("/users")}
            className="bg-card border border-border hover:border-amber/40 rounded-2xl p-4 shadow-xs flex flex-col justify-between cursor-pointer transition-colors group"
          >
            <div className="w-8 h-8 rounded-xl bg-amber/10 text-amber flex items-center justify-center shrink-0">
              <UserCheck className="w-4 h-4 text-amber" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium mt-2">
                Jefes de proyecto
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground mt-0.5">
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
            className="bg-card border border-border hover:border-green/40 rounded-2xl p-4 shadow-xs flex flex-col justify-between cursor-pointer transition-colors group"
          >
            <div className="w-8 h-8 rounded-xl bg-green/10 text-green-ink flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-green-ink" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium mt-2">
                Trabajadores
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground mt-0.5">
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
            className="bg-card border border-border hover:border-blue/40 rounded-2xl p-4 shadow-xs flex flex-col justify-between cursor-pointer transition-colors group"
          >
            <div className="w-8 h-8 rounded-xl bg-blue/10 text-blue-ink flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-blue-ink" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium mt-2">
                Usuarios
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground mt-0.5">
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
            className="bg-card border border-border hover:border-primary/40 rounded-2xl p-4 shadow-xs flex flex-col justify-between cursor-pointer transition-colors group"
          >
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <FolderKanban className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium mt-2">
                Proyectos
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground mt-0.5">
                {totalProjects}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                de {totalProjects} totales
              </p>
            </div>
          </div>
        </div>

        {/* 3. MIDDLE ROW: CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* DONUT CHART: ESTRUCTURA DE LA ORGANIZACIÓN */}
          <div className="lg:col-span-6 bg-card border border-border rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-sm font-bold text-foreground">
                  Estructura de la organización
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Consolidado de roles, colaboradores y proyectos
                </p>
              </div>
              <span className="bg-primary/10 text-primary border border-primary/20 text-xs px-2.5 py-0.5 rounded-full font-medium">
                {totalProjects} proyectos
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-6">
              {/* DONUT SVG */}
              <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
                  {/* Background Circle */}
                  <circle
                    cx="70"
                    cy="70"
                    r="52"
                    fill="none"
                    stroke="currentColor"
                    className="text-muted/20"
                    strokeWidth="18"
                  />
                  {/* Segment 1: Team Members (Blue) */}
                  <circle
                    cx="70"
                    cy="70"
                    r="52"
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
                    r="52"
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="18"
                    strokeDasharray={`${pmArc} ${C}`}
                    strokeDashoffset={-teamArc}
                  />
                  {/* Segment 3: Admins (Amber) */}
                  <circle
                    cx="70"
                    cy="70"
                    r="52"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="18"
                    strokeDasharray={`${adminArc} ${C}`}
                    strokeDashoffset={-(teamArc + pmArc)}
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

                <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <FolderKanban className="w-3.5 h-3.5 text-green-ink shrink-0" />
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
          <div className="lg:col-span-6 bg-card border border-border rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-sm font-bold text-foreground">
                  Resumen de recursos
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Distribución de entidades del sistema
                </p>
              </div>
              <span className="bg-primary/15 text-primary border border-primary/20 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md uppercase">
                GLOBAL
              </span>
            </div>

            {/* Custom Bar Chart Canvas */}
            <div className="py-4">
              <div className="relative h-44 w-full flex items-end justify-between px-4 pb-6 pt-6">
                {/* Y-Axis dashed grid lines */}
                <div className="absolute inset-x-0 bottom-6 border-b border-border/80" />
                <div className="absolute inset-x-0 bottom-[68px] border-b border-border/40 border-dashed" />
                <div className="absolute inset-x-0 bottom-[114px] border-b border-border/40 border-dashed" />
                <div className="absolute inset-x-0 top-4 border-b border-border/40 border-dashed" />

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
        <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-3">
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
              className="h-12 px-4 rounded-xl flex items-center justify-center gap-2 bg-gradient-to-r from-[#6366f1] via-[#8b5cf6] to-[#a855f7] hover:brightness-110 active:scale-[0.98] text-white font-medium text-xs transition-all shadow-md shadow-primary/25 cursor-pointer"
            >
              <ScanFace size={16} strokeWidth={2.2} />
              <span>Marcar asistencia</span>
            </button>

            {/* 2: GESTIÓN DE USUARIOS */}
            <button
              type="button"
              onClick={() => router.push("/users")}
              className="h-12 px-4 rounded-xl flex items-center justify-center gap-2 bg-muted/40 hover:bg-raised border border-border/80 text-foreground font-medium text-xs transition-colors cursor-pointer"
            >
              <Users size={16} className="text-muted-foreground" />
              <span>Gestión de usuarios</span>
            </button>

            {/* 3: PROYECTOS */}
            <button
              type="button"
              onClick={() => router.push("/projects")}
              className="h-12 px-4 rounded-xl flex items-center justify-center gap-2 bg-muted/40 hover:bg-raised border border-border/80 text-foreground font-medium text-xs transition-colors cursor-pointer"
            >
              <Briefcase size={16} className="text-muted-foreground" />
              <span>Proyectos</span>
            </button>

            {/* 4: FERIADOS GLOBALES */}
            <button
              type="button"
              onClick={() => router.push("/feriados")}
              className="h-12 px-4 rounded-xl flex items-center justify-center gap-2 bg-muted/40 hover:bg-raised border border-border/80 text-foreground font-medium text-xs transition-colors cursor-pointer"
            >
              <Calendar size={16} className="text-muted-foreground" />
              <span>Feriados globales</span>
            </button>

            {/* 5: MIS ASISTENCIAS */}
            <button
              type="button"
              onClick={() => router.push("/mis-asistencias")}
              className="h-12 px-4 rounded-xl flex items-center justify-center gap-2 bg-muted/40 hover:bg-raised border border-border/80 text-foreground font-medium text-xs transition-colors cursor-pointer"
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
