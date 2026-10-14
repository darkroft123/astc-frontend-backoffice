"use client";
import UsersList from "@/components/features/users/UsersList";
import PageHeader from "@/components/layout/page-header";

export default function UsersPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
        <PageHeader
          categoryTag={{ badge: "CONTROL GLOBAL", text: "Panel administrativo" }}
          title="Usuarios"
          description="Administración de cuentas, roles y permisos de los usuarios registrados en el sistema."
          showPeriodSelector={false}
        />
        <UsersList />
      </div>
    </div>
  );
}
