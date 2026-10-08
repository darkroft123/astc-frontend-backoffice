"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

import {
  Users, LayoutDashboard, LogOut, FolderKanban, Bell, Settings, Calendar, Clock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatAvatarUrl } from "@/lib/avatar-url";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import { notificationService } from "@/lib/notification.service";
import { useUserProject } from "@/features/attendance/hooks/useUserProject";
import { getGraphQLUrl } from "@/lib/api-host";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { getUser } from "@/app/services/users.service";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Usuarios", href: "/users", icon: Users },
  { name: "Proyectos", href: "/projects", icon: FolderKanban },
  { name: "Historial de Asistencias", href: "/asistencias-pm", icon: Clock },
  { name: "Feriados Globales", href: "/feriados", icon: Calendar },
  { name: "Registrar Asistencia", href: "/registrar", icon: CheckCircle },
  { name: "Mis Asistencias", href: "/mis-asistencias", icon: CheckCircle },
  { name: "Notificaciones", href: "/notificaciones", icon: Bell },
];

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, role, token, logout, hydrated } = useAuth();
  const { project, projects, selectProject, loadingProject } = useUserProject();
  const [unreadCount, setUnreadCount] = useState(0);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [attendanceLabel, setAttendanceLabel] = useState("Registrar Asistencia");

  useEffect(() => {
    if (!hydrated || !token || !project?.id) { setAttendanceLabel("Registrar Asistencia"); return; }
    const ctrl = new AbortController();
    const url = getGraphQLUrl();
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ query: `query($p:String){getTodayAttendance(projectId:$p){checkIn checkOut}}`, variables: { p: project.id } }),
      signal: ctrl.signal,
    })
      .then(r => r.json())
      .then(j => { const a = j?.data?.getTodayAttendance; setAttendanceLabel(a?.checkIn && !a?.checkOut ? "Marcar Salida" : "Registrar Asistencia"); })
      .catch(() => setAttendanceLabel("Registrar Asistencia"));
    return () => ctrl.abort();
  }, [hydrated, token, project?.id]);

  useEffect(() => {
    const userId = user?.sub || user?.id;
    if (hydrated && token && userId) {
      getUser(token, userId)
        .then((res) => {
          if (res) setUserProfile(res);
        })
        .catch(() => {});
    }
  }, [hydrated, token, user?.sub, user?.id]);

  useEffect(() => {
    if (hydrated && user?.id && token) {
      notificationService.setToken(token);
      notificationService.getUnreadCount(user.id)
        .then(setUnreadCount)
        .catch(err => console.error("Failed to fetch unread count", err));

      const interval = setInterval(() => {
        notificationService.getUnreadCount(user.id)
          .then(setUnreadCount)
          .catch(err => console.error("Failed to fetch unread count", err));
      }, 60000);

      return () => clearInterval(interval);
    }
  }, [hydrated, user?.id]);

  const getInitials = (name: string) => {
    if (!name) return "AD";
    return name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const displayName =
    (userProfile?.firstName && userProfile?.lastName
      ? `${userProfile.firstName} ${userProfile.lastName}`
      : null) ||
    (user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.username || user?.email?.split("@")[0] || "Administrador");

  const avatarSrc = formatAvatarUrl(userProfile?.avatarUrl || user?.avatarUrl);

  return (
    <>
      <div className="flex flex-col items-center gap-3 p-6 pt-8 border-b border-border">
        <Avatar className="h-14 w-14 border-2 border-primary/20">
          {avatarSrc && (
            <AvatarImage
              src={avatarSrc}
              alt={displayName}
              className="object-cover"
            />
          )}
          <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>

        <div className="text-center w-full px-2">
          <p className="text-xs text-muted-foreground">Bienvenido</p>
          <p className="font-bold text-base text-foreground truncate">
            {user?.username ?? "Administrador"}
          </p>
          {user?.firstName && user?.lastName && (
            <p className="text-sm font-semibold text-foreground truncate">{user.firstName} {user.lastName}</p>
          )}
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {user?.email ?? "admin@empresa.com"}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1 uppercase">ROL: {role || "ADMIN"}</p>

          <div className="mt-2.5 w-full">
            {loadingProject ? (
              <div className="px-3 py-1 bg-muted rounded-full border border-border inline-block max-w-full">
                <p className="text-[11px] font-medium text-muted-foreground truncate">Cargando proyectos...</p>
              </div>
            ) : projects.length > 1 ? (
              <select
                value={project?.id || ""}
                onChange={(e) => selectProject(e.target.value)}
                className="w-full bg-muted border border-border rounded-xl px-2.5 py-1.5 text-xs text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer text-center"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-card text-foreground text-xs">
                    {p.name}
                  </option>
                ))}
              </select>
            ) : project ? (
              <div className="px-3 py-1 bg-muted rounded-full border border-border inline-block max-w-full">
                <p className="text-[11px] font-medium text-muted-foreground truncate">Proyecto: {project.name}</p>
              </div>
            ) : (
              <Link
                href="/projects"
                onClick={onNavigate}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted border border-border text-[11px] font-medium text-muted-foreground hover:bg-accent transition-colors shadow-sm"
              >
                <FolderKanban className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Gestión Proyectos</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      <nav 
        className="flex-1 px-3 py-6 space-y-1 overflow-y-auto no-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style>{`
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {navItems.map((item) => {
          const displayName = item.name === "Registrar Asistencia" ? attendanceLabel : item.name;
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-5 w-5" />
                {displayName}
              </div>
              {item.name === "Notificaciones" && unreadCount > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 text-white font-extrabold text-[11px] px-1.5 shadow-xs shrink-0">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-4 mt-auto">
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => { logout(); onNavigate?.(); }}
            className="flex flex-1 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
          >
            <LogOut className="h-5 w-5" />
            Cerrar Sesión
          </button>
        </div>
      </div>
    </>
  );
}

export default function Sidebar() {
  return (
    <aside className="hidden md:flex w-64 flex-shrink-0 bg-card text-foreground border-r border-border flex-col h-screen fixed left-0 top-0 z-50 overflow-hidden">
      <SidebarNav />
    </aside>
  );
}
