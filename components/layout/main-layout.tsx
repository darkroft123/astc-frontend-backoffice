"use client";
interface MainLayoutProps {
  children: React.ReactNode
}
export function MainLayout({ children }: MainLayoutProps) {
  return (
    <main className="flex-1 overflow-auto p-4 md:p-6 bg-background">
      {children}
    </main>
  );
}