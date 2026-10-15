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
          {/* Ambient light for all screens in dark mode (-250px top) */}
          <div className="absolute top-[-250px] right-[-100px] w-[650px] h-[500px] bg-purple-600/20 blur-[140px] rounded-full pointer-events-none hidden dark:block z-0" />
          <div className="absolute top-[-100px] right-[80px] w-[350px] h-[300px] bg-indigo-500/15 blur-[120px] rounded-full pointer-events-none hidden dark:block z-0" />

          <div className="absolute top-4 right-4 z-50"><NotificationBell /></div>
          <div className="md:hidden p-4"><HamburgerButton /></div>
          <div className="relative z-10">
            {children}
          </div>
        </main>
      </MobileSidebarProvider>
    </div>
  );
}
