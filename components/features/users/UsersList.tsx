"use client";
import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import FilterBar from "./FilterBar";
import { DataTable, Column } from "@/components/DataTable";
import { useAuthGuard } from "@/app/jwt/auth/useAuthGuard";

/* ================= SERVICES ================= */
import { listUsers, deleteUser } from "@/app/services/users.service";
import { getAllProjects } from "@/app/services/project.assistance.service";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatAvatarUrl } from "@/lib/avatar-url";

const ITEMS_PER_PAGE = 10;

export default function UsersList() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  /* ================= AUTH ================= */
  const { token, checkingAuth, hydrated, user } = useAuthGuard(["ADMIN"]);
  const isReady = hydrated && !checkingAuth && token && user;

  const getInitials = (name: string) => {
    if (!name) return "US";
    return name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  /* ================= LOAD USERS ================= */
  useEffect(() => {
    if (!token || checkingAuth) return;
    loadUsers();
  }, [token, checkingAuth]);

  async function loadUsers() {
    if (!token) return;

    setLoading(true);
    try {
      const [userData, projectsData] = await Promise.all([
        listUsers(token),
        getAllProjects(token).catch((e) => {
          console.error("Error getAllProjects in UsersList:", e);
          return [];
        }),
      ]);

      const projects = projectsData || [];

      setUsers(
        userData.map((u: any) => {
          const userProjects = projects.filter((p: any) =>
            p.responsibleId === u.id || (Array.isArray(p.members) && p.members.some((m: any) => (m.userId || m.id) === u.id))
          );
          const projectAssigned = userProjects.length > 0
            ? userProjects.map((p: any) => p.name).join(", ")
            : "Sin proyecto";

          return {
            ...u,
            projectAssigned,
            projects: userProjects,
          };
        })
      );
    } catch (err) {
      console.error("Error listUsers:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  /* ================= DELETE ================= */
  const handleDelete = async (id: string) => {
    const ok = window.confirm("¿Eliminar usuario?");
    if (!ok || !token) return;

    try {
      await deleteUser(token, id);
      await loadUsers();
    } catch (err) {
      console.error("Error deleteUser:", err);
      alert("No se pudo eliminar usuario");
    }
  };

  /* ================= EDIT ================= */
  const handleEdit = (user: any) => {
    router.push(`/users/create?id=${user.id}`);
  };

  /* ================= FILTER ================= */
  const filteredUsers = useMemo(() => {
    const search = searchTerm.toLowerCase();

    return users.filter((u) => {
      const matchesSearch =
        u.username?.toLowerCase().includes(search) ||
        u.firstName?.toLowerCase().includes(search) ||
        u.lastName?.toLowerCase().includes(search) ||
        u.email?.toLowerCase().includes(search) ||
        u.projectAssigned?.toLowerCase().includes(search) ||
        (Array.isArray(u.projects) && u.projects.some((p: any) => p.name?.toLowerCase().includes(search)));

      const matchesRole =
        roleFilter === "all" || u.roleCode === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  /* ================= PAGINATION FIX ================= */
  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / ITEMS_PER_PAGE)
  );

  const safePage = Math.min(currentPage, totalPages);

  const startIdx = (safePage - 1) * ITEMS_PER_PAGE;

  const paginatedUsers = filteredUsers.slice(
    startIdx,
    startIdx + ITEMS_PER_PAGE
  );

  /* reset page when filters change */
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter]);

  /* ================= COLUMNS ================= */
  const columns: Column<any>[] = [
    {
      key: "user",
      header: "Usuario",
      render: (user) => {
        const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || "Usuario";
        const avatarSrc = formatAvatarUrl(user.avatarUrl);
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border border-border shrink-0">
              {avatarSrc && (
                <AvatarImage src={avatarSrc} alt={fullName} className="object-cover" />
              )}
              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-bold">
                {getInitials(fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-foreground truncate">
                {fullName}
              </span>
              <span className="text-xs text-muted-foreground truncate">@{user.username}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: "email",
      header: "Correo",
      hideOnMobile: true,
      render: (user) => (
        <span className="text-foreground">{user.email}</span>
      ),
    },
    {
      key: "phone",
      header: "Teléfono",
      hideOnMobile: true,
      render: (user) => (
        <span className="text-muted-foreground">
          {user.phone || "Sin teléfono"}
        </span>
      ),
    },
    {
      key: "role",
      header: "Rol",
      render: (user) => (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/5 text-primary">
          {user.roleName || "Desconocido"}
        </span>
      ),
    },
    {
      key: "project",
      header: "Proyecto",
      hideOnMobile: true,
      render: (user) => {
        const assigned: any[] = Array.isArray(user.projects) ? user.projects : [];
        if (assigned.length === 0) {
          return (
            <span className="text-xs font-medium text-zinc-400 italic">
              Sin proyecto
            </span>
          );
        }

        const p = assigned[0];
        const isPM = p.responsibleId === user.id;
        const remainingCount = assigned.length - 1;
        const allProjectNames = assigned.map((x: any) => x.name).join(", ");

        return (
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span
              title={`${p.name}${isPM ? " (Responsable / PM)" : " (Colaborador)"}`}
              className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border transition-all ${
                isPM
                  ? "text-violet-700 bg-violet-50 border-violet-200"
                  : "text-blue-700 bg-blue-50 border-blue-200"
              }`}
            >
              <span className="truncate max-w-[120px]">{p.name}</span>
              {isPM && (
                <span className="text-[9px] bg-violet-200/80 text-violet-800 px-1 rounded font-bold">
                  PM
                </span>
              )}
            </span>

            {remainingCount > 0 && (
              <span
                title={`Proyectos asignados: ${allProjectNames}`}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-zinc-600 border border-border cursor-help transition-colors hover:bg-zinc-200"
              >
                +{remainingCount} más
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "Acciones",
      render: (user) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(user)}
            className="px-3 py-1 text-xs rounded-lg bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
          >
            Editar
          </button>

          <button
            onClick={() => handleDelete(user.id)}
            className="px-3 py-1 text-xs rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
          >
            Eliminar
          </button>
        </div>
      ),
    },
  ];

  /* ================= LOADING ================= */
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4">

        {/* TOOLBAR */}
        <div className="bg-card border border-[#D0D7DE] rounded-2xl shadow-sm p-3 sm:p-4">
          <FilterBar
            roleFilter={roleFilter}
            onRoleChange={setRoleFilter}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </div>

        {/* TABLE */}
        <div>
          <DataTable
            data={paginatedUsers}
            columns={columns}
            loading={loading}
            emptyText="Sin usuarios"
            maxHeight="620px"
          />

          {/* PAGINATION */}
          <div className="flex items-center justify-center gap-3 mt-4">
            <button
              className="px-3 py-1.5 text-sm rounded-lg border border-border bg-background text-foreground hover:bg-accent disabled:opacity-50 transition-all"
              onClick={() =>
                setCurrentPage((p) => Math.max(p - 1, 1))
              }
              disabled={currentPage === 1}
            >
              Anterior
            </button>

            <span className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </span>

            <button
              className="px-3 py-1.5 text-sm rounded-lg border border-border bg-background text-foreground hover:bg-accent disabled:opacity-50 transition-all"
              onClick={() =>
                setCurrentPage((p) =>
                  Math.min(p + 1, totalPages)
                )
              }
              disabled={currentPage === totalPages}
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
