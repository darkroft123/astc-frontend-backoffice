"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MisAsistenciasPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/asistencias-pm");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-2">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-xs text-muted-foreground">Redirigiendo a Historial de asistencias...</p>
      </div>
    </div>
  );
}
