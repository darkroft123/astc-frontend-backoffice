"use client";
import { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import { SidebarNav } from "@/components/layout/Sidebar";
import { NotificationBell } from "@/components/layout/notification-bell";
import { MobileSidebarProvider, MobileSidebar, HamburgerButton } from "@/components/layout/MobileSidebar";
import { usePathname, useRouter } from "next/navigation";
import { useAuthGuard } from "@/app/jwt/auth/useAuthGuard";

import { MobileHeader } from "@/components/layout/MobileHeader";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { cn } from "@/lib/utils";


function getSubPageInfo(pathname: string | null): { isSubPage: boolean; title: string; backHref: string } {
  if (!pathname) return { isSubPage: false, title: "", backHref: "/" };
  if (pathname.startsWith("/users/create")) {
    return { isSubPage: true, title: "Usuarios", backHref: "/users" };
  }
  if (pathname.startsWith("/projects/create") || pathname.includes("/projects/edit")) {
    return { isSubPage: true, title: "Proyectos", backHref: "/projects" };
  }
  if (pathname.startsWith("/registrar/prev")) {
    return { isSubPage: true, title: "Asistencia", backHref: "/" };
  }
  return { isSubPage: false, title: "", backHref: "/" };
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { hydrated, token, user, checkingAuth } = useAuthGuard(["ADMIN"]);

  // On creation or edition pages, the page itself renders its own mobile header (<- Back + Notification Bell)
  // and the Figma design excludes the global MobileHeader and MobileBottomNav.
  const subPageInfo = getSubPageInfo(pathname);
  const isCreateOrEdit = subPageInfo.isSubPage;

  if (!hydrated || checkingAuth || !token || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      <MobileSidebarProvider>
        <Sidebar />
        <MobileSidebar>
          <SidebarNav onNavigate={() => {}} />
        </MobileSidebar>
        <div className="flex-1 min-w-0 md:ml-[268px] flex flex-col min-h-screen relative bg-background">
          {/* Mobile Top Header: Global Header OR Subpage Header (Image 5) covering edge to edge */}
          {!isCreateOrEdit ? (
            <MobileHeader />
          ) : (
            <div className="md:hidden sticky top-0 z-40 w-full bg-white dark:bg-[#0C0E18] border-b border-border dark:border-[#1E2335] px-4 h-14 flex items-center justify-between shadow-xs">
              <button
                type="button"
                onClick={() => router.push(subPageInfo.backHref)}
                className="flex items-center gap-2.5 text-[#6D28D9] dark:text-[#C4B5FD] font-semibold text-[17px] tracking-tight hover:opacity-80 transition-opacity cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
                <span>{subPageInfo.title}</span>
              </button>
              <div className="shrink-0 flex items-center pr-0.5">
                <NotificationBell iconOnly />
              </div>
            </div>
          )}

          {/* Ambient light for all screens in dark mode (desktop only, to prevent purple glow on mobile screens) */}
          <div className="absolute top-[-300px] right-0 w-[600px] h-[450px] bg-violet/10 dark:bg-violet/20 blur-[140px] rounded-full pointer-events-none hidden md:dark:block z-0" />
          <div className="absolute top-[-130px] right-[200px] w-[350px] h-[250px] bg-indigo-500/10 dark:bg-indigo-500/15 blur-[100px] rounded-full pointer-events-none hidden md:dark:block z-0" />

          {/* Desktop Notification Bell */}
          {!isCreateOrEdit && (
            <div className="hidden md:flex absolute top-5 right-6 lg:top-5 lg:right-8 z-40 items-center gap-3">
              <NotificationBell />
            </div>
          )}

          <main
            className={cn(
              "flex-1 p-4 md:px-8 md:pt-5 md:pb-6 bg-transparent relative z-10",
              isCreateOrEdit ? "pb-6" : "pb-24 md:pb-6"
            )}
          >
            {children}
          </main>

          {/* Mobile Bottom Navigation (Hidden on creation/edit screens) */}
          {!isCreateOrEdit && <MobileBottomNav />}
        </div>
      </MobileSidebarProvider>
    </div>
  );
}
