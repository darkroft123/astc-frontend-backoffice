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

const ITEMS_PER_PAGE = 5;

export default function UsersList() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
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
    if (!hydrated || checkingAuth) return;
    if (token) loadUsers();
    else setLoading(false);
  }, [hydrated, token, checkingAuth]);

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

      const rawUsers = Array.isArray(userData) ? userData : (userData?.items || []);
      const projects = Array.isArray(projectsData) ? projectsData : [];

      setUsers(
        rawUsers.map((u: any) => {
          const userProjects = projects.filter(
            (p: any) =>
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

      {/* DESKTOP TABLE */}
      <div className="hidden md:block w-full border border-border bg-card dark:bg-sidebar/70 dark:border-raised rounded-2xl shadow-xs overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border/80 dark:border-raised bg-muted/30 dark:bg-inset/60">
                <th className="text-left font-mono text-[10.5px] uppercase tracking-wider font-semibold text-muted-foreground dark:text-text-5 px-4 py-3.5">
                  USUARIO
                </th>
                <th className="text-left font-mono text-[10.5px] uppercase tracking-wider font-semibold text-muted-foreground dark:text-text-5 px-4 py-3.5">
                  CORREO
                </th>
                <th className="text-left font-mono text-[10.5px] uppercase tracking-wider font-semibold text-muted-foreground dark:text-text-5 px-4 py-3.5">
                  TELÉFONO
                </th>
                <th className="text-left font-mono text-[10.5px] uppercase tracking-wider font-semibold text-muted-foreground dark:text-text-5 px-4 py-3.5">
                  ROL
                </th>
                <th className="text-left font-mono text-[10.5px] uppercase tracking-wider font-semibold text-muted-foreground dark:text-text-5 px-4 py-3.5">
                  PROYECTO
                </th>
                <th className="text-right font-mono text-[10.5px] uppercase tracking-wider font-semibold text-muted-foreground dark:text-text-5 px-4 py-3.5">
                  ACCIONES
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/60 dark:divide-raised">
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
                paginatedUsers.map((u, index) => {
                  const fullName =
                    `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
                    u.username ||
                    "Usuario";
                  const avatarSrc = formatAvatarUrl(u.avatarUrl);
                  const assigned: any[] = Array.isArray(u.projects) ? u.projects : [];
                  const firstProject = assigned[0];
                  const isPM = firstProject?.responsibleId === u.id;
                  const remainingCount = assigned.length - 1;

                  return (
                    <tr
                      key={u.id}
                      className={`border-b border-border/40 dark:border-raised transition-colors group ${
                        index % 2 === 0
                          ? "bg-muted/30 dark:bg-surface/50 hover:bg-muted/50 dark:hover:bg-raised/60"
                          : "bg-transparent hover:bg-muted/20 dark:hover:bg-surface/40"
                      }`}
                    >
                      {/* USUARIO */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 rounded-full shrink-0 shadow-2xs">
                            {avatarSrc && (
                              <AvatarImage
                                src={avatarSrc}
                                alt={fullName}
                                className="object-cover"
                              />
                            )}
                            <AvatarFallback className="bg-avatar-gradient text-white text-xs font-bold">
                              {getInitials(fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-foreground text-sm leading-tight truncate">
                              {fullName}
                            </span>
                            <span className="text-xs text-muted-foreground dark:text-text-5 leading-tight truncate mt-0.5">
                              @{u.username}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* CORREO */}
                      <td className="px-4 py-3.5 text-xs text-muted-foreground dark:text-[#9ca3af] font-normal whitespace-nowrap">
                        {u.email}
                      </td>

                      {/* TELÉFONO */}
                      <td className="px-4 py-3.5 text-xs whitespace-nowrap">
                        {u.phone ? (
                          <span className="font-mono font-medium text-foreground dark:text-text-2 whitespace-nowrap">
                            {u.phone}
                          </span>
                        ) : (
                          <span className="text-muted-foreground dark:text-[#5a607f] whitespace-nowrap">
                            Sin teléfono
                          </span>
                        )}
                      </td>

                      {/* ROL */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {u.roleCode === "ADMIN" || u.roleId === "ADMIN" || u.roleName === "Administrador" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-violet/10 text-violet-ink border border-violet/20 dark:bg-violet/10 dark:text-[#c084fc] dark:border-violet/20 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-violet shrink-0" />
                            Admin
                          </span>
                        ) : u.roleCode === "PROJECT_MANAGER" || u.roleId === "PROJECT_MANAGER" || u.roleName === "Project manager" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber/10 text-amber-ink border border-amber/20 dark:bg-amber/10 dark:text-amber dark:border-amber/20 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber shrink-0" />
                            Jefe de Proyecto
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue/10 text-blue border border-blue/20 dark:bg-blue/10 dark:text-[#60a5fa] dark:border-blue/20 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue shrink-0" />
                            Trabajador
                          </span>
                        )}
                      </td>

                      {/* PROYECTO */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {assigned.length === 0 ? (
                          <span className="text-xs text-muted-foreground dark:text-[#5a607f] whitespace-nowrap">
                            Sin proyecto
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-lg bg-violet/10 text-violet-ink border border-violet/20 dark:bg-violet/10 dark:text-[#c084fc] dark:border-violet/20 whitespace-nowrap">
                              <span className="truncate max-w-[160px]">
                                {firstProject.name}
                              </span>
                              {isPM && (
                                <span className="text-[9px] font-bold bg-violet/20 dark:bg-violet/20 text-violet-ink dark:text-[#c084fc] px-1 py-0.5 rounded ml-1">
                                  PM
                                </span>
                              )}
                            </span>

                            {remainingCount > 0 && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground border border-border dark:bg-raised dark:text-[#9ca3af] dark:border-field ml-1.5">
                                +{remainingCount}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* ACCIONES */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleEdit(u)}
                          title="Editar usuario"
                          className="p-1.5 text-muted-foreground dark:text-text-5 hover:text-foreground dark:hover:text-white transition-colors cursor-pointer inline-flex items-center justify-center"
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

      {/* MOBILE CARDS (MATCHING dark-usuarios.svg) */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="py-12 text-center text-muted-foreground bg-card dark:bg-[#101322] border border-border dark:border-[#1E2335] rounded-2xl">
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span className="text-xs">Cargando usuarios...</span>
            </div>
          </div>
        ) : paginatedUsers.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground bg-card dark:bg-[#101322] border border-border dark:border-[#1E2335] rounded-2xl">
            Sin usuarios registrados
          </div>
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

            const isAdmin =
              u.roleCode === "ADMIN" ||
              u.roleId === "ADMIN" ||
              u.roleName === "Administrador";
            const isProjectManager =
              u.roleCode === "PROJECT_MANAGER" ||
              u.roleId === "PROJECT_MANAGER" ||
              u.roleName === "Project manager";

            return (
              <div
                key={u.id}
                className="bg-card dark:bg-[#101322] border border-border dark:border-[#1E2335] rounded-2xl p-4 space-y-3.5 shadow-sm"
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-10 w-10 rounded-2xl shrink-0 shadow-sm">
                      {avatarSrc && (
                        <AvatarImage
                          src={avatarSrc}
                          alt={fullName}
                          className="object-cover"
                        />
                      )}
                      <AvatarFallback className="bg-avatar-gradient text-white text-xs font-bold rounded-2xl">
                        {getInitials(fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-foreground dark:text-white text-sm leading-tight truncate">
                        {fullName}
                      </span>
                      <span className="text-xs text-muted-foreground dark:text-[#8F96AE] leading-tight truncate mt-0.5">
                        @{u.username}
                      </span>
                    </div>
                  </div>

                  {/* Edit squircle button */}
                  <button
                    type="button"
                    onClick={() => handleEdit(u)}
                    title="Editar usuario"
                    className="w-9 h-9 rounded-xl bg-muted/60 dark:bg-[#161B2E] border border-border dark:border-[#232B45] text-muted-foreground dark:text-[#8F96AE] hover:text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>

                {/* Fields: CORREO and TELÉFONO */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-semibold text-muted-foreground dark:text-[#8F96AE] tracking-wider uppercase">
                      CORREO
                    </span>
                    <span className="text-foreground dark:text-white truncate max-w-[220px]">
                      {u.email}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-semibold text-muted-foreground dark:text-[#8F96AE] tracking-wider uppercase">
                      TELÉFONO
                    </span>
                    <span className="font-mono text-foreground dark:text-white">
                      {u.phone || "Sin teléfono"}
                    </span>
                  </div>
                </div>

                {/* Divider line */}
                <div className="border-t border-border/60 dark:border-[#1E2335]" />

                {/* Badges row */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Role badge */}
                  {isAdmin ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-violet/10 text-violet-ink border border-violet/20 dark:bg-[#241738] dark:text-[#C084FC] dark:border-[#401E68] whitespace-nowrap">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C084FC] shrink-0" />
                      Admin
                    </span>
                  ) : isProjectManager ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber/10 text-amber-ink border border-amber/20 dark:bg-[#2C2112] dark:text-[#FBBF24] dark:border-[#4E3815] whitespace-nowrap">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FBBF24] shrink-0" />
                      Jefe de Proyecto
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue/10 text-blue border border-blue/20 dark:bg-[#132238] dark:text-[#38BDF8] dark:border-[#1E3A5F] whitespace-nowrap">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] shrink-0" />
                      Trabajador
                    </span>
                  )}

                  {/* Project badge */}
                  {assigned.length === 0 ? (
                    <span className="text-xs text-muted-foreground dark:text-[#8F96AE] whitespace-nowrap">
                      Sin proyecto
                    </span>
                  ) : (
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-lg bg-violet/10 text-violet-ink border border-violet/20 dark:bg-[#221A3B] dark:text-[#D8B4FE] dark:border-[#3B2A63] whitespace-nowrap">
                        <span className="truncate max-w-[150px]">
                          {firstProject.name}
                        </span>
                        {isPM && (
                          <span className="text-[9px] font-bold bg-[#3B2A63] text-[#D8B4FE] px-1 py-0.5 rounded ml-1">
                            PM
                          </span>
                        )}
                      </span>

                      {remainingCount > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground border border-border dark:bg-[#161B2E] dark:text-[#8F96AE] dark:border-[#232B45]">
                          +{remainingCount}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FOOTER / PAGINATION */}
      <div className="flex items-center justify-between px-1 pt-2">
        <span className="text-xs text-muted-foreground dark:text-text-5 font-medium">
          {filteredUsers.length} usuarios
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="h-8 w-8 rounded-lg border border-border bg-card dark:bg-inset dark:border-raised flex items-center justify-center text-muted-foreground dark:text-text-5 hover:text-foreground dark:hover:text-white disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            title="Página anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs text-muted-foreground dark:text-text-5 font-medium px-1">
            Página {currentPage} de {totalPages}
          </span>

          <button
            type="button"
            className="h-8 w-8 rounded-lg border border-border bg-card dark:bg-inset dark:border-raised flex items-center justify-center text-muted-foreground dark:text-text-5 hover:text-foreground dark:hover:text-white disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
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
