"use client";
import React from 'react';
import { Settings } from "lucide-react";
import { usePathname } from 'next/navigation';

export default function Header() {

  const pathname = usePathname();

  const getPageTitle = () => {

    if (
      pathname === '/' ||
      pathname === '/dashboard'
    ) {
      return "Dashboard";
    }

    if (pathname.startsWith('/users')) {
      return "Gestionar Usuarios";
    }

    return "Panel Administrativo";
  };

  return (
    <header
      className="
        bg-brand-gradient
        border-b border-line-2
        px-8 py-5
        flex items-center justify-between
        shadow-lg
        z-40
      "
    >

      {/* TITLE */}
      <div>

        <h1 className="
          text-2xl
          font-bold
          text-white
          tracking-tight
        ">
          {getPageTitle()}
        </h1>

        <p className="text-primary-foreground/90 text-sm mt-1">
          Panel administrativo
        </p>

      </div>

      {/* ACTIONS */}
      <div className="flex items-center gap-3">

        <button
          className="
            w-11 h-11
            rounded-2xl
            bg-primary-foreground/10
            border border-primary-foreground/10
            flex items-center justify-center
            text-primary-foreground/90
            hover:bg-primary-foreground/20
            hover:text-primary-foreground
            transition-all
            backdrop-blur-sm
          "
        >
          <Settings size={20} />
        </button>

      </div>

    </header>
  );
}