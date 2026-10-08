"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { useAuth } from "@/app/jwt/auth/auth.provider";
import ProjectForm from "@/components/dashboard/projects/project-form";

import {
  getProjectById,
} from "@/app/services/project.assistance.service";

export default function EditProjectPage() {
  const params = useParams();
  const { token, hydrated } = useAuth();

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProject() {
      if (!hydrated || !token) return;

      try {
        const data = await getProjectById(
          token,
          params.id as string
        );

        console.log("PROJECT:", data);

        setProject(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadProject();
  }, [hydrated, token, params.id]);

  if (loading) {
    return <div>Cargando proyecto...</div>;
  }

  if (!project) {
    return <div>Proyecto no encontrado</div>;
  }

  return (
    <div className="min-h-screen bg-muted/50 p-4">
      <ProjectForm
        mode="edit"
        initialData={project}
      />
    </div>
  );
}
