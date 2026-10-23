"use client";
import { ReactNode } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { SidebarNav } from "@/components/layout/Sidebar";
import { NotificationBell } from "@/components/layout/notification-bell";
import { MobileSidebarProvider, MobileSidebar, HamburgerButton } from "@/components/layout/MobileSidebar";
import { usePathname } from "next/navigation";

import { MobileHeader } from "@/components/layout/MobileHeader";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { cn } from "@/lib/utils";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // On creation or edition pages, the page itself renders its own mobile header (<- Back + Notification Bell)
  // and the Figma design excludes the global MobileHeader and MobileBottomNav.
  const isCreateOrEdit =
    pathname?.startsWith("/users/create") ||
    pathname?.startsWith("/projects/create") ||
    pathname?.includes("/projects/edit");

  return (
    <div className="flex min-h-screen w-full">
      <MobileSidebarProvider>
        <Sidebar />
        <MobileSidebar>
          <SidebarNav onNavigate={() => {}} />
        </MobileSidebar>
        <div className="flex-1 min-w-0 md:ml-[268px] flex flex-col min-h-screen relative bg-background">
          {/* Mobile Top Header (Hidden on creation/edit screens) */}
          {!isCreateOrEdit && <MobileHeader />}

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
