"use client";
import ProjectForm from "@/components/dashboard/projects/project-form";

export default function CreateProjectPage() {
  return (
    <div className="min-h-screen bg-background">
      <ProjectForm mode="create" />
    </div>
  );
}