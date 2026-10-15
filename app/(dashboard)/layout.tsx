"use client";
import { ReactNode } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { SidebarNav } from "@/components/layout/Sidebar";
import { NotificationBell } from "@/components/layout/notification-bell";
import { MobileSidebarProvider, MobileSidebar, HamburgerButton } from "@/components/layout/MobileSidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex">
      <MobileSidebarProvider>
        <Sidebar />
        <MobileSidebar>
          <SidebarNav onNavigate={() => {}} />
        </MobileSidebar>
        <main className="flex-1 min-h-screen md:ml-[268px] bg-background overflow-x-hidden overflow-y-auto pb-6 md:pb-0 relative">
          {/* Ambient light for all screens in dark mode (Figma official position) */}
          <div className="fixed top-[-40px] right-[-40px] w-[600px] h-[600px] bg-gradient-to-br from-purple-600/30 via-indigo-600/20 to-transparent blur-[130px] rounded-full pointer-events-none hidden dark:block z-0" />
          <div className="fixed top-[60px] right-[80px] w-[350px] h-[350px] bg-cyan-400/15 blur-[100px] rounded-full pointer-events-none hidden dark:block z-0" />

          <div className="absolute top-4 right-4 z-50"><NotificationBell /></div>
          <div className="md:hidden p-4"><HamburgerButton /></div>
          <div className="relative z-10 bg-transparent min-h-screen">
            {children}
          </div>
        </main>
      </MobileSidebarProvider>
    </div>
  );
}
