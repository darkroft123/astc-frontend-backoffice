"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Users,
  LayoutDashboard,
  LogOut,
  FolderKanban,
  Bell,
  Calendar,
  Clock,
  CheckCircle2,
} from "lucide-react";
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
  { name: "Gestionar usuarios", href: "/users", icon: Users },
  { name: "Proyectos", href: "/projects", icon: FolderKanban },
  { name: "Historial de asistencias", href: "/asistencias-pm", icon: Clock },
  { name: "Feriados globales", href: "/feriados", icon: Calendar },
  { name: "Registrar asistencia", href: "/registrar", icon: CheckCircle2 },
  { name: "Notificaciones", href: "/notificaciones", icon: Bell },
];

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, role, token, logout, hydrated } = useAuth();
  const { project, projects, selectProject } = useUserProject();
  const [unreadCount, setUnreadCount] = useState(2);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [attendanceLabel, setAttendanceLabel] = useState("Registrar asistencia");

  useEffect(() => {
    if (!hydrated || !token || !project?.id) {
      setAttendanceLabel("Registrar asistencia");
      return;
    }
    const ctrl = new AbortController();
    const url = getGraphQLUrl();
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        query: `query($p:String){getTodayAttendance(projectId:$p){checkIn checkOut}}`,
        variables: { p: project.id },
      }),
      signal: ctrl.signal,
    })
      .then((r) => r.json())
      .then((j) => {
        const a = j?.data?.getTodayAttendance;
        setAttendanceLabel(a?.checkIn && !a?.checkOut ? "Marcar Salida" : "Registrar asistencia");
      })
      .catch(() => setAttendanceLabel("Registrar asistencia"));
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
      notificationService
        .getUnreadCount(user.id)
        .then((cnt) => setUnreadCount(cnt > 0 ? cnt : 2))
        .catch(() => setUnreadCount(2));

      const interval = setInterval(() => {
        notificationService
          .getUnreadCount(user.id)
          .then((cnt) => setUnreadCount(cnt > 0 ? cnt : 2))
          .catch(() => setUnreadCount(2));
      }, 60000);

      return () => clearInterval(interval);
    }
  }, [hydrated, user?.id, token]);

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
      : user?.username || "admin");

  const displayEmail = user?.email || "admin@astc.com";
  const avatarSrc = formatAvatarUrl(userProfile?.avatarUrl || user?.avatarUrl);

  const roleLabel =
    role === "BACKOFFICE" ? "ADMIN" : role === "ADMIN" ? "ADMIN" : "ADMIN";

  return (
    <div className="flex flex-col h-full">
      {/* 1. Perfil del usuario */}
      <div className="flex items-center gap-3 px-1 mb-3">
        <div className="h-10 w-10 rounded-[13px] bg-avatar-gradient flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md shadow-purple-500/10">
          {getInitials(displayName)}
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm leading-tight text-foreground truncate">
            {displayName}
          </p>
          <p className="font-normal text-xs leading-normal text-muted-foreground truncate mt-0.5">
            {displayEmail}
          </p>
        </div>
      </div>

      {/* 2. Tarjeta del Rol */}
      <div className="bg-card border border-border dark:bg-sidebar dark:border-raised rounded-2xl p-3.5 mb-4 shadow-xs">
        <div>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.05em] text-primary dark:text-[#7c9aff] font-semibold">
            {roleLabel}
          </span>
        </div>

        <div className="mt-2.5">
          <Link
            href="/projects"
            onClick={onNavigate}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-muted/60 border border-border/80 dark:bg-surface dark:border-raised text-xs text-foreground hover:bg-muted dark:hover:bg-raised transition-colors group cursor-pointer"
          >
            <FolderKanban className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" strokeWidth={1.8} />
            <span className="font-medium text-xs truncate">Gestión de proyectos</span>
          </Link>
        </div>
      </div>

      {/* 3. Navegación */}
      <nav
        className="flex-1 space-y-1 overflow-y-auto no-scrollbar pr-0.5"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <style>{`
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {navItems.map((item) => {
          const displayNameItem =
            item.name === "Registrar asistencia" ? attendanceLabel : item.name;
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-normal transition-all group",
                isActive
                  ? "bg-primary/10 text-primary border border-primary/25 shadow-2xs font-semibold dark:bg-violet/10 dark:text-[#c084fc] dark:border-violet/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60 dark:hover:bg-surface"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon
                  strokeWidth={2}
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive ? "text-primary dark:text-[#c084fc]" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <span className="truncate">{displayNameItem}</span>
              </div>
              {item.name === "Notificaciones" && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red text-white font-bold text-[10px] px-1.5 shrink-0">
                  {unreadCount > 9 ? "9+" : unreadCount > 0 ? unreadCount : "2"}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* 4. Footer */}
      <div className="border-t border-border dark:border-surface pt-4 mt-auto space-y-1">
        <ThemeToggle />
        <button
          onClick={() => {
            logout();
            onNavigate?.();
          }}
          className="w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-normal text-muted-foreground hover:text-red-ink hover:bg-red/10 transition-all group cursor-pointer"
        >
          <LogOut strokeWidth={2} className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-red-ink transition-colors" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  );
}

export default function Sidebar() {
  return (
    <aside className="hidden md:flex w-[268px] h-screen fixed left-0 top-0 z-50 bg-card dark:bg-background border-r border-border dark:border-surface flex-col overflow-hidden px-4 py-5">
      <SidebarNav />
    </aside>
  );
}
