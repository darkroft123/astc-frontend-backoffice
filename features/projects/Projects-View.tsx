"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SubMetricCard } from "@/components/dashboard/SubMetricCard";
import {
  FolderKanban, Users, Pencil, Trash2, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { DataTable, Column } from "@/components/DataTable";
import PageHeader from "@/components/layout/page-header";
import { getAllProjects } from "@/app/services/project.assistance.service";
import type { Project } from "@/components/types/dashboard";

import {
  graphqlRequest,
  deleteProject,
} from "@/app/services/project.assistance.service";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import DeleteProjectModal from "@/components/features/projects/DeleteProjectModal";

/* ===================== VIEW ===================== */

export function ProjectsManagementView({ context = "PM" }: { context?: "ADMIN" | "PM" }) {

  const router = useRouter();
  const { token, hydrated } = useAuth();
  const isAdmin = context === "ADMIN";
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [page, setPage] = useState(1);
  const [selectedProjectForMembers, setSelectedProjectForMembers] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("all");


  /* ===================== FETCH PROJECTS ===================== */
async function fetchProjects() {
  if (!hydrated || !token) return;

  setIsLoading(true);

  try {
    const data = await getAllProjects(token);

    const sorted = [...(data ?? [])].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    );

    setProjects(sorted);
  } catch (err) {
    console.error("? Error fetching projects:", err);
  } finally {
    setIsLoading(false);
  }
}
  /* ===================== DELETE ===================== */

async function handleDeleteConfirm() {
  try {
    if (!token || !projectToDelete) return;

    console.log("DELETE:", projectToDelete.id);

    const result = await deleteProject(token, projectToDelete.id);

    console.log("RESULT:", result);

    setProjectToDelete(null);
    await fetchProjects();
  } catch (err) {
    console.error("? Delete error:", err);
  }
}

  
/* ===================== INIT ===================== */

    useEffect(() => {
      fetchProjects();
    }, [hydrated, token]);

    useEffect(() => {
      setPage(1);
    }, [search, estadoFilter]);

    
  /* ===================== FILTERS ===================== */

      const filteredProjects = useMemo(() => {
        return projects.filter((p) => {
          const matchesSearch =
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.id.toLowerCase().includes(search.toLowerCase());

          const matchesEstado =
            estadoFilter === "all" || p.status === estadoFilter;

          return matchesSearch && matchesEstado;
        });
      }, [projects, search, estadoFilter]);

      const totalProjects = filteredProjects.length;

      const activeProjects = filteredProjects.filter(
        (p) => p.status === "ACTIVE"
      ).length;

      const inactiveProjects = filteredProjects.filter(
        (p) => p.status === "INACTIVE"
      ).length;

      const pageSize = 5;

      const totalPages = Math.max(
        1,
        Math.ceil(filteredProjects.length / pageSize)
      );

      useEffect(() => {
        if (page > totalPages) {
          setPage(totalPages);
        }
      }, [page, totalPages]);

      const paginatedProjects = useMemo(() => {
        const start = (page - 1) * pageSize;

        return filteredProjects.slice(
          start,
          start + pageSize
        );
      }, [filteredProjects, page]);

      /* ===================== COLUMNS ===================== */

    const columns: Column<Project>[] = [
      {
        key: "name",
        header: "PROYECTO",
        render: (r) => (
          <div>
            <p className="font-medium text-foreground">{r.name}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{r.id}</p>
          </div>
        ),
      },

      {
        key: "startDate",
        header: "INICIO",
        hideOnMobile: true,
        render: (r) =>
          r.startDate
            ? new Date(r.startDate).toLocaleDateString("es-PE", {
                day: "2-digit",
                month: "2-digit",
                year: "2-digit",
              })
            : "-",
      },

      {
        key: "endDate",
        header: "FIN",
        hideOnMobile: true,
        render: (r) =>
          r.endDate
            ? new Date(r.endDate).toLocaleDateString("es-PE", {
                day: "2-digit",
                month: "2-digit",
                year: "2-digit",
              })
            : "-",
      },

      {
        key: "status",
        header: "ESTADO",
        render: (r) => <ProjectStatusBadge status={r.status} />,
      },

      {
        key: "assignedUser",
        header: "RESPONSABLE",
        hideOnMobile: true,
        render: (r: any) => {
          const responsibleMember = r.members?.find((m: any) => m.role === "PROJECT_MANAGER") || r.members?.[0];
          if (!responsibleMember || !responsibleMember.user) return <span className="text-zinc-400 text-xs">-</span>;
          const u = responsibleMember.user;
          return (
            <div>
              <p className="font-medium text-foreground text-xs">
                {u.firstName} {u.lastName}
              </p>
              <p className="text-[10px] text-muted-foreground">
                @{u.username}
              </p>
            </div>
          );
        }
      },

      {
        key: "actions",
        header: "ACCIONES",
        render: (r) => (
          <div className="flex flex-wrap gap-2">
            {isAdmin && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/projects/edit/${r.id}`)}
                >
                  <Pencil className="w-3.5 h-3.5 mr-1.5" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setProjectToDelete(r)}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Eliminar
                </Button>
              </>
            )}
            <Button
              size="sm"
              className="bg-violet-600 hover:bg-violet-700"
              onClick={() => setSelectedProjectForMembers(r)}
            >
              <Users className="w-3.5 h-3.5 mr-1.5" />
              Miembros
            </Button>
          </div>
        ),
      },
    ];

  /* ===================== UI ===================== */
return (
  <div className="min-h-screen bg-background">
    <div className="max-w-7xl mx-auto px-4 py-4">

      {/* HEADER */}
      <PageHeader
          categoryTag={{ badge: "CONTROL GLOBAL", text: "Panel Administrativo" }}
          title="Gestión de Proyectos"
        description="Administración de proyectos, configuración y asignación de recursos del sistema"
        showPeriodSelector={false}
      />

      {/* CARD */}
      <Card>
        <CardContent className="p-4">

          {/* TOOLBAR */}
          <div className="flex flex-wrap items-center gap-3 mb-4">

            {/* METRICS */}
            <div className="flex gap-2">
              <SubMetricCard label="TOTAL" value={totalProjects} />
              <SubMetricCard label="ACTIVOS" value={activeProjects} color="green" />
              <SubMetricCard label="INACTIVOS" value={inactiveProjects} color="red" />
            </div>

            {/* SEARCH */}
            <input
              className="border border-border px-3 h-9 rounded-lg text-sm w-full sm:w-auto sm:min-w-[200px] focus:border-violet-400 outline-none transition-all"
              placeholder="Buscar por nombre o ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {/* STATE */}
            <select
              className="border border-border px-3 h-9 rounded-lg text-sm focus:border-violet-400 outline-none"
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
            >
              <option value="all">Todos</option>
              <option value="ACTIVE">Activos</option>
              <option value="INACTIVE">Inactivos</option>
            </select>

            {/* ACTIONS */}
            <div className="flex gap-2 ml-auto">

              {isAdmin && (
                <Button
                  onClick={() => router.push("/projects/create")}
                  className="h-9 bg-blue-600 hover:bg-blue-700"
                >
                  <FolderKanban className="w-4 h-4 mr-1.5" />
                  Crear Proyecto
                </Button>
              )}

              <Button
                onClick={fetchProjects}
                variant="ghost"
                className="h-9 border border-slate-200 bg-card text-zinc-700 hover:bg-slate-50"
              >
                <RefreshCw className="w-4 h-4" />
                Actualizar
              </Button>

            </div>

          </div>

          <DataTable
          data={paginatedProjects}
          columns={columns}
          loading={isLoading}
          emptyText="No hay proyectos"
        />

       <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-4">

            <span className="text-sm text-zinc-500 order-2 sm:order-1">
              Página {page} de {totalPages}
            </span>

            <div className="flex gap-2 order-1 sm:order-2">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="h-9 px-3"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <Button
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-9 px-3"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedProjectForMembers} onOpenChange={(open) => !open && setSelectedProjectForMembers(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Miembros de {selectedProjectForMembers?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedProjectForMembers?.members && selectedProjectForMembers.members.length > 0 ? (
              <div className="space-y-3">
                {selectedProjectForMembers.members.map((m: any, idx: number) => {
                  const u = m.user;
                  return (
                    <div key={idx} className="flex justify-between items-center p-2.5 bg-muted/50 border rounded-lg">
                      <div>
                        <p className="font-semibold text-foreground text-sm">
                          {u ? `${u.firstName} ${u.lastName}` : "Colaborador"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          @{u?.username || m.userId}
                        </p>
                      </div>
                      <span className="text-xs bg-violet-100 text-violet-700 px-2.5 py-0.5 rounded-full font-medium">
                        {m.role || "TEAM_MEMBER"}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-zinc-500 text-center py-4">No hay miembros asignados a este proyecto.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {projectToDelete && (
        <DeleteProjectModal
          projectName={projectToDelete.name}
          projectId={projectToDelete.id}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setProjectToDelete(null)}
        />
      )}

    </div>
  </div>
);
}

/* ================= BADGE ================= */

function ProjectStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`px-2 py-1 text-xs rounded-full ${
        status === "ACTIVE"
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-700"
      }`}
    >
      {status === "ACTIVE" ? "Activo" : status === "INACTIVE" ? "Inactivo" : status === "COMPLETED" ? "Completado" : status}
    </span>
  );
}
