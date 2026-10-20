"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Users,
  Folder,
  Clock,
  MoreHorizontal,
} from "lucide-react";
import { useMobileSidebar } from "./MobileSidebar";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { setOpen } = useMobileSidebar();

  const navItems = [
    {
      name: "Inicio",
      href: "/",
      icon: LayoutGrid,
    },
    {
      name: "Usuarios",
      href: "/users",
      icon: Users,
    },
    {
      name: "Proyectos",
      href: "/projects",
      icon: Folder,
    },
    {
      name: "Historial",
      href: "/asistencias-pm",
      icon: Clock,
    },
    {
      name: "Más",
      isAction: true,
      icon: MoreHorizontal,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-[#0C0E18] border-t border-border dark:border-[#1E2335] px-2 py-1.5 flex items-center justify-around shadow-lg dark:shadow-2xl transition-colors">
      {navItems.map((item) => {
        if (item.isAction) {
          const isMoreActive = pathname.startsWith("/feriados") || pathname.startsWith("/notificaciones") || pathname.startsWith("/registrar");

          return (
            <button
              key={item.name}
              type="button"
              onClick={() => setOpen(true)}
              className="flex flex-col items-center justify-center flex-1 py-1 px-1 cursor-pointer group"
            >
              <div
                className={cn(
                  "w-10 h-7 rounded-full flex items-center justify-center transition-all",
                  isMoreActive
                    ? "bg-[#F3E8FF] text-[#9333EA] dark:bg-[#271D47] dark:text-[#C084FC]"
                    : "text-muted-foreground dark:text-[#8F96AE] group-hover:text-foreground dark:group-hover:text-white"
                )}
              >
                <item.icon className="w-5 h-5" />
              </div>
              <span
                className={cn(
                  "text-[10.5px] leading-tight mt-0.5",
                  isMoreActive
                    ? "text-[#9333EA] dark:text-white font-bold"
                    : "text-muted-foreground dark:text-[#8F96AE] font-normal"
                )}
              >
                {item.name}
              </span>
            </button>
          );
        }

        const href = item.href || "/";
        const isActive =
          href === "/"
            ? pathname === "/"
            : pathname.startsWith(href);

        return (
          <Link
            key={item.name}
            href={href}
            className="flex flex-col items-center justify-center flex-1 py-1 px-1 group cursor-pointer"
          >
            <div
              className={cn(
                "w-10 h-7 rounded-full flex items-center justify-center transition-all",
                isActive
                  ? "bg-[#F3E8FF] text-[#9333EA] dark:bg-[#271D47] dark:text-[#C084FC]"
                  : "text-muted-foreground dark:text-[#8F96AE] group-hover:text-foreground dark:group-hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5" />
            </div>
            <span
              className={cn(
                "text-[10.5px] leading-tight mt-0.5",
                isActive
                  ? "text-[#9333EA] dark:text-white font-bold"
                  : "text-muted-foreground dark:text-[#8F96AE] font-normal"
              )}
            >
              {item.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
