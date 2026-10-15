"use client";
import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import FilterBar from "./FilterBar";
import { useAuthGuard } from "@/app/jwt/auth/useAuthGuard";
import { listUsers } from "@/app/services/users.service";
import { getAllProjects } from "@/app/services/project.assistance.service";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatAvatarUrl } from "@/lib/avatar-url";
import { Pencil, ChevronLeft, ChevronRight } from "lucide-react";

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
        listUsers(token).catch((e) => {
          console.error("Error listUsers in UsersList:", e);
          return [];
        }),
        getAllProjects(token).catch((e) => {
          console.error("Error getAllProjects in UsersList:", e);
          return [];
        }),
      ]);

      const projects = Array.isArray(projectsData) ? projectsData : [];
      const rawUsers = Array.isArray(userData) ? userData : (userData?.items || []);

      setUsers(
        rawUsers.map((u: any) => {
          const userProjects = projects.filter((p: any) =>
            p.responsibleId === u.id ||
            (Array.isArray(p.members) &&
              p.members.some((m: any) => (m.userId || m.id) === u.id))
          );
          const projectAssigned =
            userProjects.length > 0
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
      console.error("Error loadUsers:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  /* ================= EDIT ================= */
  const handleEdit = (user: any) => {
    router.push(`/users/create?id=${user.id}`);
  };

  /* ================= FILTER ================= */
  const filteredUsers = useMemo(() => {
    const search = searchTerm.toLowerCase();

    return users.filter((u) => {
      const fullName = `${u.firstName || ""} ${u.lastName || ""}`.trim().toLowerCase();
      const matchesSearch =
        u.username?.toLowerCase().includes(search) ||
        fullName.includes(search) ||
        u.email?.toLowerCase().includes(search) ||
        u.projectAssigned?.toLowerCase().includes(search) ||
        (Array.isArray(u.projects) &&
          u.projects.some((p: any) => p.name?.toLowerCase().includes(search)));

      const matchesRole =
        roleFilter === "all" ||
        u.roleCode === roleFilter ||
        u.roleId === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  /* ================= PAGINATION ================= */
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * ITEMS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter]);

  /* ================= LOADING ================= */
  if (!isReady) {
    return (
      <div className="py-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  /* ================= UI ================= */
  return (
    <div className="space-y-4">
      {/* FILTER BAR */}
      <FilterBar
        roleFilter={roleFilter}
        onRoleChange={setRoleFilter}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {/* TABLE */}
      <div className="w-full border border-border bg-card dark:bg-[#0b0c16]/70 dark:border-[#1c1e2e] rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px] border-collapse">
            <thead>
              <tr className="border-b border-border/80 dark:border-[#1c1e2e] bg-muted/30 dark:bg-[#0e101d]/60">
                <th className="text-left font-mono text-[10.5px] uppercase tracking-wider font-semibold text-muted-foreground dark:text-[#6e7494] px-5 py-3.5">
                  USUARIO
                </th>
                <th className="text-left font-mono text-[10.5px] uppercase tracking-wider font-semibold text-muted-foreground dark:text-[#6e7494] px-5 py-3.5">
                  CORREO
                </th>
                <th className="text-left font-mono text-[10.5px] uppercase tracking-wider font-semibold text-muted-foreground dark:text-[#6e7494] px-5 py-3.5">
                  TELÉFONO
                </th>
                <th className="text-left font-mono text-[10.5px] uppercase tracking-wider font-semibold text-muted-foreground dark:text-[#6e7494] px-5 py-3.5">
                  ROL
                </th>
                <th className="text-left font-mono text-[10.5px] uppercase tracking-wider font-semibold text-muted-foreground dark:text-[#6e7494] px-5 py-3.5">
                  PROYECTO
                </th>
                <th className="text-right font-mono text-[10.5px] uppercase tracking-wider font-semibold text-muted-foreground dark:text-[#6e7494] px-5 py-3.5">
                  ACCIONES
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/60 dark:divide-[#171928]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      <span className="text-xs">Cargando usuarios...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-xs text-muted-foreground">
                    Sin usuarios registrados
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => {
                  const fullName =
                    `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
                    u.username ||
                    "Usuario";
                  const avatarSrc = formatAvatarUrl(u.avatarUrl);
                  const assigned: any[] = Array.isArray(u.projects) ? u.projects : [];
                  const firstProject = assigned[0];
                  const isPM = firstProject?.responsibleId === u.id;
                  const remainingCount = assigned.length - 1;

                  const fallbackBg =
                    u.roleCode === "ADMIN" || u.roleId === "ADMIN"
                      ? "bg-[#705cf6]"
                      : u.roleCode === "PROJECT_MANAGER" || u.roleId === "PROJECT_MANAGER"
                      ? "bg-[#7c3aed]"
                      : "bg-[#6366f1]";

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-muted/30 dark:hover:bg-[#121422]/60 transition-colors group"
                    >
                      {/* USUARIO */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 rounded-full shrink-0 shadow-2xs">
                            {avatarSrc && (
                              <AvatarImage
                                src={avatarSrc}
                                alt={fullName}
                                className="object-cover"
                              />
                            )}
                            <AvatarFallback className="bg-gradient-to-br from-[#38bdf8] via-[#818cf8] to-[#c084fc] text-white text-xs font-bold">
                              {getInitials(fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-foreground text-sm leading-tight truncate">
                              {fullName}
                            </span>
                            <span className="text-xs text-muted-foreground dark:text-[#707694] leading-tight truncate mt-0.5">
                              @{u.username}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* CORREO */}
                      <td className="px-5 py-3.5 text-xs text-muted-foreground dark:text-[#9ca3af] font-normal">
                        {u.email}
                      </td>

                      {/* TELÉFONO */}
                      <td className="px-5 py-3.5 text-xs">
                        {u.phone ? (
                          <span className="font-mono font-medium text-foreground dark:text-[#c8cddc]">
                            {u.phone}
                          </span>
                        ) : (
                          <span className="text-muted-foreground dark:text-[#5a607f]">
                            Sin teléfono
                          </span>
                        )}
                      </td>

                      {/* ROL */}
                      <td className="px-5 py-3.5">
                        {u.roleCode === "ADMIN" || u.roleId === "ADMIN" || u.roleName === "Administrador" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-600 border border-purple-500/20 dark:bg-[#241538] dark:text-[#c084fc] dark:border-[#3b2058]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#a855f7] shrink-0" />
                            Administrador
                          </span>
                        ) : u.roleCode === "PROJECT_MANAGER" || u.roleId === "PROJECT_MANAGER" || u.roleName === "Project manager" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:bg-[#2a2010] dark:text-[#fbbf24] dark:border-[#4a3715]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] shrink-0" />
                            Project manager
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 border border-blue-500/20 dark:bg-[#131d38] dark:text-[#60a5fa] dark:border-[#1e2f58]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] shrink-0" />
                            Team member
                          </span>
                        )}
                      </td>

                      {/* PROYECTO */}
                      <td className="px-5 py-3.5">
                        {assigned.length === 0 ? (
                          <span className="text-xs text-muted-foreground dark:text-[#5a607f]">
                            Sin proyecto
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-lg bg-purple-500/10 text-purple-600 border border-purple-500/20 dark:bg-[#251538] dark:text-[#c084fc] dark:border-[#3d1f5c]">
                              <span className="truncate max-w-[140px]">
                                {firstProject.name}
                              </span>
                              {isPM && (
                                <span className="text-[9px] font-bold bg-purple-500/20 dark:bg-[#3d1f5c] text-purple-600 dark:text-[#c084fc] px-1 py-0.5 rounded ml-1">
                                  PM
                                </span>
                              )}
                            </span>

                            {remainingCount > 0 && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground border border-border dark:bg-[#181a28] dark:text-[#9ca3af] dark:border-[#26283b] ml-1.5">
                                +{remainingCount}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* ACCIONES */}
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleEdit(u)}
                          title="Editar usuario"
                          className="p-1.5 text-muted-foreground dark:text-[#6e7494] hover:text-foreground dark:hover:text-white transition-colors cursor-pointer inline-flex items-center justify-center"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FOOTER / PAGINATION */}
      <div className="flex items-center justify-between px-1 pt-2">
        <span className="text-xs text-muted-foreground dark:text-[#707694] font-medium">
          {filteredUsers.length} usuarios
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="h-8 w-8 rounded-lg border border-border bg-card dark:bg-[#0e101d] dark:border-[#1e2032] flex items-center justify-center text-muted-foreground dark:text-[#6e7494] hover:text-foreground dark:hover:text-white disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            title="Página anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs text-muted-foreground dark:text-[#707694] font-medium px-1">
            Página {currentPage} de {totalPages}
          </span>

          <button
            type="button"
            className="h-8 w-8 rounded-lg border border-border bg-card dark:bg-[#0e101d] dark:border-[#1e2032] flex items-center justify-center text-muted-foreground dark:text-[#6e7494] hover:text-foreground dark:hover:text-white disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            title="Página siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
