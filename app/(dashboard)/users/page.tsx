"use client";
import UsersList from '@/components/features/users/UsersList';
import PageHeader from '@/components/layout/page-header';

export default function UsersPage() {
  return (
    <div className="min-h-screen bg-muted/50 py-4">
      <div className="max-w-5xl mx-auto px-4">
        <PageHeader
          categoryTag={{ badge: "CONTROL GLOBAL", text: "Panel Administrativo" }}
          title="Usuarios"
          description="Administración de cuentas, roles y permisos de los usuarios registrados en el sistema"
          showPeriodSelector={false}
        />
        <div className="mt-4">
          <UsersList />
        </div>
      </div>
    </div>
  );
}
