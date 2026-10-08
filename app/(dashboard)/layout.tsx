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
        <main className="flex-1 min-h-screen md:ml-64 bg-background overflow-auto pb-6 md:pb-0 relative">
          <div className="absolute top-4 right-4 z-50"><NotificationBell /></div>
          <div className="md:hidden p-4"><HamburgerButton /></div>
          {children}
        </main>
      </MobileSidebarProvider>
    </div>
  );
}
