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
        bg-gradient-to-r
        from-violet-700
        via-purple-700
        to-fuchsia-700
        border-b border-violet-500/30
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

        <p className="text-violet-100 text-sm mt-1">
          Panel administrativo
        </p>

      </div>

      {/* ACTIONS */}
      <div className="flex items-center gap-3">

        <button
          className="
            w-11 h-11
            rounded-2xl
            bg-white/10
            border border-white/10
            flex items-center justify-center
            text-violet-100
            hover:bg-white/20
            hover:text-white
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