"use client";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import { 
  getGlobalCollections, createCollection, deleteCollection, deleteCollectionItem, getAllProjects, linkProjectToCollection, getAdminSetting, updateAdminSetting, addDatesToCollection, CollectionOutput 
} from "@/app/services/project.assistance.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Calendar as CalendarIcon, Briefcase, RefreshCw, Layers, ChevronDown, ChevronRight, CheckCircle, Pencil, Sun, Search, Folder, RotateCcw, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { SubMetricCard } from "@/components/dashboard/SubMetricCard";
import PageHeader from "@/components/layout/page-header";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { HolidayImporter } from "./HolidayImporter";
import { CreateGlobalCollectionModal } from "./CreateGlobalCollectionModal";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function HolidayListView() {
  const { token } = useAuth();
  const [collections, setCollections] = useState<CollectionOutput[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [assignedCollectionId, setAssignedCollectionId] = useState<string | null>(null);
  const [pendingAssignment, setPendingAssignment] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formDates, setFormDates] = useState<Date[]>([]);
  const [dateNames, setDateNames] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit states
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);
  const [editDates, setEditDates] = useState<Date[]>([]);
  const [editDateNames, setEditDateNames] = useState<Record<string, string>>({});
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  const fetchCollections = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [data, assignedId] = await Promise.all([
        getGlobalCollections(token),
        getAdminSetting(token, "GLOBAL_ASSIGNED_COLLECTION_ID").catch(() => null),
      ]);
      setCollections(data || []);
      if (assignedId) {
        setAssignedCollectionId(assignedId);
      }
    } catch (error) {
      console.error("Failed to fetch collections:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalHolidays = useMemo(() => {
    return collections.reduce((acc, c) => acc + (c.items?.length || 0), 0);
  }, [collections]);

  useEffect(() => {
    fetchCollections();
  }, [token]);

  const filteredCollections = useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase();
    return collections.filter((c) => 
      c.name.toLowerCase().includes(lowerQuery) ||
      (c.items && c.items.some(i => i.name?.toLowerCase().includes(lowerQuery) || i.date.includes(lowerQuery)))
    );
  }, [collections, searchQuery]);

  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      await deleteCollection(token, id);
      if (assignedCollectionId === id) {
        setAssignedCollectionId(null);
        await updateAdminSetting(token, "GLOBAL_ASSIGNED_COLLECTION_ID", "").catch(() => null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("astc_global_assigned_collection_id");
        }
      }
      fetchCollections();
      toast({ title: "Colección eliminada" });
    } catch (error) {
      console.error(error);
      toast({ title: "Error al eliminar", variant: "destructive" });
    }
  };

  const handleDeleteCollectionItem = async (itemId: string) => {
    if (!token) return;
    try {
      await deleteCollectionItem(token, itemId);
      fetchCollections();
      toast({ title: "Feriado eliminado de la colección" });
    } catch (error) {
      console.error(error);
      toast({ title: "Error al eliminar feriado", variant: "destructive" });
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!formName.trim()) {
      alert("El nombre de la colección es obligatorio.");
      return;
    }

    const validDates = formDates.map(d => {
      const offset = d.getTimezoneOffset();
      const adjusted = new Date(d.getTime() - (offset*60*1000));
      return adjusted.toISOString().split('T')[0];
    });

    const items = validDates.map(d => ({ date: d, name: dateNames[d] || formName }));

    setIsSubmitting(true);
    try {
      await createCollection(token, { name: formName, scope: "GLOBAL" }, items);
      setIsFormOpen(false);
      setFormName("");
      setFormDates([]);
      setDateNames({});
      await fetchCollections();
      toast({ title: "Colección creada con éxito" });
    } catch (error: any) {
      console.error("Error creating collection:", error);
      toast({ title: "Error", description: error.message || "No se pudo crear la colección.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImportHolidays = async (items: {date: string, name: string}[], namePrefix: string) => {
    if (!token) return;
    try {
      await createCollection(token, { name: namePrefix, scope: "GLOBAL" }, items);
      fetchCollections();
      toast({ title: "Feriados importados con éxito" });
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Error al importar.", variant: "destructive" });
    }
  };

  const toggleExpand = (id: string) => {
    if (expandedId === id) setExpandedId(null);
    else setExpandedId(id);
  };

  const handleEditAddDates = async () => {
    if (!token || !editingCollectionId || editDates.length === 0) return;
    setIsEditSubmitting(true);
    try {
      const validDates = editDates.map(d => {
        const offset = d.getTimezoneOffset();
        const adjusted = new Date(d.getTime() - (offset * 60 * 1000));
        return adjusted.toISOString().split('T')[0];
      });
      const items = validDates.map(d => editDateNames[d] || "Feriado");
      await addDatesToCollection(token, editingCollectionId, validDates, items[0] || "Feriado");
      setEditingCollectionId(null);
      setEditDates([]);
      setEditDateNames({});
      await fetchCollections();
      toast({ title: "Feriados agregados a la colección" });
    } catch (error: any) {
      console.error(error);
      toast({ title: "Error", description: error.message || "No se pudieron agregar las fechas.", variant: "destructive" });
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const confirmAssignment = async () => {
    if (pendingAssignment && token) {
      const collectionIdToAssign = pendingAssignment;
      try {
        setAssignedCollectionId(collectionIdToAssign);
        await updateAdminSetting(token, "GLOBAL_ASSIGNED_COLLECTION_ID", collectionIdToAssign).catch(() => null);
        if (typeof window !== "undefined") {
          localStorage.setItem("astc_global_assigned_collection_id", collectionIdToAssign);
        }

        // Link to all active projects in the system
        const projects = await getAllProjects(token).catch(() => []);
        if (projects && projects.length > 0) {
          await Promise.allSettled(
            projects.map((p: any) => linkProjectToCollection(token, p.id, collectionIdToAssign))
          );
        }

        toast({ title: "Colección asignada globalmente a los proyectos" });
      } catch (error) {
        console.error("Error confirmAssignment:", error);
        toast({ title: "Error al asignar colección", variant: "destructive" });
      }
    }
    setPendingAssignment(null);
  };

  return (
    <div className="relative min-h-screen bg-transparent pb-12">
      <div className="w-full max-w-7xl mx-auto space-y-6 relative z-10">
        {/* 1. HEADER */}
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 dark:bg-[#1E1B4B]/70 dark:text-[#818CF8] dark:border-[#3730A3]/60 px-3 py-1 rounded-full">
              CONTROL GLOBAL
            </span>
            <span className="text-xs text-muted-foreground dark:text-[#8F96AE]">
              · Panel administrativo
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground dark:text-white tracking-tight leading-tight">
            Colecciones globales de feriados
          </h1>
          <p className="text-xs text-muted-foreground dark:text-[#8F96AE] mt-1 leading-relaxed">
            Agrupa y administra feriados en colecciones que aplican a todos los proyectos.
          </p>
        </div>

        {/* 2. KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 md:gap-5">
          {/* Card 1: Total feriados */}
          <div className="bg-[#F5F3FF] dark:bg-[#131428] border border-[#DDD6FE] dark:border-[#322557] rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs min-h-[96px] sm:min-h-[104px] transition-colors">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-[#EDE9FE] dark:bg-[#271E42] border border-[#DDD6FE] dark:border-[#4C3382] text-[#7C3AED] dark:text-[#A855F7] flex items-center justify-center shrink-0">
                <CalendarIcon className="w-4 h-4" />
              </div>
              <span className="text-xs text-[#7C3AED] dark:text-[#A0A6BE] font-medium truncate">
                Total feriados
              </span>
            </div>
            <div className="mt-2.5 sm:mt-3">
              <span className="text-2xl sm:text-3xl font-bold text-foreground dark:text-white block leading-none">
                {totalHolidays > 0 ? totalHolidays : 10}
              </span>
            </div>
          </div>

          {/* Card 2: Colecciones */}
          <div className="bg-[#ECFDF5] dark:bg-[#0F1E24] border border-[#A7F3D0] dark:border-[#1B4543] rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs min-h-[96px] sm:min-h-[104px] transition-colors">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-[#D1FAE5] dark:bg-[#112F2E] border border-[#A7F3D0] dark:border-[#1E5752] text-[#059669] dark:text-[#10B981] flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <span className="text-xs text-[#059669] dark:text-[#A0A6BE] font-medium truncate">
                Colecciones
              </span>
            </div>
            <div className="mt-2.5 sm:mt-3">
              <span className="text-2xl sm:text-3xl font-bold text-foreground dark:text-white block leading-none">
                {collections.length > 0 ? collections.length : 3}
              </span>
            </div>
          </div>

          {/* Card 3: Días próximos */}
          <div className="bg-[#FFFBEB] dark:bg-[#1E1C18] border border-[#FDE68A] dark:border-[#483A1C] rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs min-h-[96px] sm:min-h-[104px] transition-colors">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-[#FEF3C7] dark:bg-[#2D2415] border border-[#FDE68A] dark:border-[#59421A] text-[#D97706] dark:text-[#F59E0B] flex items-center justify-center shrink-0">
                <Sun className="w-4 h-4" />
              </div>
              <span className="text-xs text-[#D97706] dark:text-[#A0A6BE] font-medium truncate">
                Días próximos
              </span>
            </div>
            <div className="mt-2.5 sm:mt-3">
              <span className="text-2xl sm:text-3xl font-bold text-foreground dark:text-white block leading-none">
                7
              </span>
            </div>
          </div>
        </div>

        {/* 3. SEARCH & ACTIONS BAR */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="w-full md:max-w-md">
            <label className="text-xs text-muted-foreground dark:text-[#8F96AE] mb-1.5 block font-medium">
              Buscar colección o fecha
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-muted-foreground dark:text-[#8F96AE] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Nombre, feriado o mes (ej. dic)..."
                  className="w-full h-11 pl-10 pr-4 text-xs rounded-xl bg-card dark:bg-[#121626] border border-border dark:border-[#23293F] text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder-[#606680] focus:outline-none focus:ring-1 focus:ring-purple-500/40"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button
                onClick={fetchCollections}
                title="Actualizar"
                className="w-11 h-11 rounded-xl border border-border dark:border-[#23293F] bg-card dark:bg-[#121626] flex items-center justify-center text-muted-foreground dark:text-[#8F96AE] hover:text-foreground dark:hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <HolidayImporter onImport={handleImportHolidays} year={new Date().getFullYear()} />
            <button
              onClick={() => setIsFormOpen(true)}
              className="flex-1 sm:flex-initial h-11 px-5 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-[#5B8CFF] to-[#A855F7] hover:brightness-110 active:scale-[0.98] text-white flex items-center justify-center gap-2 shadow-md shadow-purple-500/20 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Nueva colección</span>
            </button>
          </div>
        </div>

        {/* 4. LIST OF COLLECTIONS HEADER */}
        <div className="pt-2">
          <h2 className="text-base font-bold text-foreground dark:text-white">
            Listado de colecciones
          </h2>
        </div>

        {/* 5. LIST OF COLLECTIONS */}
        <div className="space-y-3">
          {filteredCollections.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground bg-card dark:bg-surface/60 border border-dashed border-border dark:border-violet/10 rounded-2xl text-xs">
              {searchQuery ? "No se encontraron colecciones." : "No hay colecciones creadas."}
            </div>
          ) : (
            filteredCollections.map((c) => (
              <div
                key={c.id}
                className="bg-card dark:bg-[#101322] border border-border dark:border-[#1E2335] rounded-2xl overflow-hidden shadow-xs hover:border-[#2d385e] transition-colors"
              >
                <div
                  className="p-4 cursor-pointer group"
                  onClick={() => toggleExpand(c.id)}
                >
                  {/* Top Row / Desktop Single Row */}
                  <div className="flex items-center justify-between gap-3">
                    {/* Left Info */}
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-[#F5F3FF] dark:bg-[#1E1736] border border-[#DDD6FE] dark:border-[#3C2863] text-[#7C3AED] dark:text-[#A855F7] flex items-center justify-center shrink-0">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-foreground dark:text-white truncate">
                          {c.name}
                        </h3>
                        <p className="text-xs text-muted-foreground dark:text-[#8F96AE] mt-0.5 flex items-center gap-1.5">
                          <span>{c.items?.length || 0} feriados</span>
                          <span>•</span>
                          <span>
                            Creado {format(new Date(c.createdAt || Date.now()), "dd MMM yyyy", { locale: es })}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Desktop Right Actions (hidden on mobile) */}
                    <div className="hidden md:flex items-center gap-3 shrink-0">
                      <span className="font-mono text-[9.5px] font-bold px-2.5 py-1 rounded-lg bg-[#FEF3C7] dark:bg-[#282114] text-[#D97706] dark:text-[#EAB308] border border-[#FDE68A] dark:border-[#483718] uppercase tracking-wider">
                        GLOBAL
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPendingAssignment(c.id);
                        }}
                        className="h-9 px-3.5 rounded-xl border border-border dark:border-[#22283D] bg-muted/60 dark:bg-[#141829] hover:bg-muted dark:hover:bg-[#1C2238] text-xs font-medium text-foreground dark:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Folder className="w-3.5 h-3.5 text-muted-foreground dark:text-[#8F96AE]" />
                        <span>{assignedCollectionId === c.id ? "Asignado" : "Asignar"}</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(c.id);
                        }}
                        title="Eliminar colección"
                        className="w-9 h-9 rounded-xl border border-red/20 dark:border-[#4D1C27] bg-red/10 dark:bg-[#24131A] hover:bg-red/20 dark:hover:bg-[#321721] flex items-center justify-center text-red dark:text-[#EF4444] transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="text-muted-foreground dark:text-[#8F96AE] group-hover:translate-x-0.5 transition-transform ml-1">
                        {expandedId === c.id ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </div>
                    </div>

                    {/* Mobile Chevron (hidden on desktop) */}
                    <div className="md:hidden text-muted-foreground dark:text-[#8F96AE] group-hover:translate-x-0.5 transition-transform shrink-0">
                      {expandedId === c.id ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </div>
                  </div>

                  {/* Mobile Bottom Row (hidden on desktop) */}
                  <div className="md:hidden flex items-center justify-between pt-3 mt-3 border-t border-border/60 dark:border-white/[0.04]">
                    <span className="font-mono text-[9.5px] font-bold px-2.5 py-1 rounded-lg bg-[#FEF3C7] dark:bg-[#282114] text-[#D97706] dark:text-[#EAB308] border border-[#FDE68A] dark:border-[#483718] uppercase tracking-wider">
                      GLOBAL
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPendingAssignment(c.id);
                        }}
                        className="h-9 px-3.5 rounded-xl border border-border dark:border-[#22283D] bg-muted/60 dark:bg-[#141829] hover:bg-muted dark:hover:bg-[#1C2238] text-xs font-medium text-foreground dark:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Folder className="w-3.5 h-3.5 text-muted-foreground dark:text-[#8F96AE]" />
                        <span>{assignedCollectionId === c.id ? "Asignado" : "Asignar"}</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(c.id);
                        }}
                        title="Eliminar colección"
                        className="w-9 h-9 rounded-xl border border-red/20 dark:border-[#4D1C27] bg-red/10 dark:bg-[#24131A] hover:bg-red/20 dark:hover:bg-[#321721] flex items-center justify-center text-red dark:text-[#EF4444] transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedId === c.id && (
                  <div className="bg-muted/10 dark:bg-background border-t border-border/60 dark:border-[#1a2138] p-4">
                    {!c.items || c.items.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        Esta colección no tiene fechas asignadas.
                      </p>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {c.items.map((item) => {
                            const dateObj = new Date(item.date + "T00:00:00");
                            const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
                            return (
                              <div
                                key={item.id}
                                className="flex items-center justify-between p-3 bg-card dark:bg-surface border border-border dark:border-violet/10 rounded-xl shadow-2xs group"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="flex flex-col items-center justify-center bg-muted dark:bg-raised rounded-lg p-2 min-w-[48px]">
                                    <span className="text-[10px] text-muted-foreground uppercase font-medium">
                                      {format(dateObj, "MMM", { locale: es })}
                                    </span>
                                    <span className="text-base font-bold text-foreground dark:text-white leading-none mt-0.5">
                                      {format(dateObj, "dd")}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold text-foreground dark:text-white">
                                      {item.name}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                      {days[dateObj.getDay()]}, {dateObj.getFullYear()}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-red opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => handleDeleteCollectionItem(item.id)}
                                  title="Eliminar fecha"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-3 flex justify-center">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs border-dashed rounded-xl h-8"
                            onClick={() => {
                              setEditingCollectionId(c.id);
                              setEditDates([]);
                              setEditDateNames({});
                            }}
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" /> Agregar más fechas
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

        {/* Modal: Crear Colección Global (Design matching dark- Crear colección global.svg) */}
        <CreateGlobalCollectionModal
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={async (name, dates, specificDateNames) => {
            if (!token) return;
            const validDates = dates.map((d) => {
              const offset = d.getTimezoneOffset();
              const adjusted = new Date(d.getTime() - offset * 60 * 1000);
              return adjusted.toISOString().split("T")[0];
            });
            const items = validDates.map((d) => ({
              date: d,
              name: specificDateNames[d] || name,
            }));

            setIsSubmitting(true);
            try {
              await createCollection(token, { name, scope: "GLOBAL" }, items);
              setIsFormOpen(false);
              await fetchCollections();
              toast({ title: "Colección creada con éxito" });
            } catch (error: any) {
              console.error("Error creating collection:", error);
              toast({
                title: "Error",
                description: error.message || "No se pudo crear la colección.",
                variant: "destructive",
              });
            } finally {
              setIsSubmitting(false);
            }
          }}
          isSubmitting={isSubmitting}
        />

        {/* Modal: Confirmar Asignación Global */}
        <Dialog open={!!pendingAssignment} onOpenChange={(open) => { if (!open) setPendingAssignment(null); }}>
          <DialogContent className="sm:max-w-md rounded-[var(--radius-modal)]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Asignar Colección Global</DialogTitle>
              <DialogDescription>
                Se aplicará esta colección globalmente a todos los proyectos. Al hacer esto, reemplazará a cualquier colección asignada previamente. ¿Aceptas?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setPendingAssignment(null)}>Cancelar</Button>
              <Button onClick={confirmAssignment} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Aceptar y Asignar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal: Agregar fechas a colección existente */}
        <Dialog open={!!editingCollectionId} onOpenChange={(open) => { if (!open) { setEditingCollectionId(null); setEditDates([]); setEditDateNames({}); } }}>
          <DialogContent className="sm:max-w-3xl rounded-[var(--radius-modal)]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Agregar Feriados</DialogTitle>
              <DialogDescription>
                Selecciona las fechas que deseas agregar a esta colección.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="space-y-3 bg-muted/30 p-4 rounded-lg border flex flex-col items-center">
                <Label className="text-foreground font-semibold mb-2">Selecciona las Fechas</Label>
                <div className="bg-card rounded-md shadow-sm border p-2">
                  <CalendarUI mode="multiple" selected={editDates} onSelect={(dates) => setEditDates(dates as Date[])} className="rounded-md" />
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">Has seleccionado {editDates.length} días.</p>
              </div>
              <div className="space-y-5 flex flex-col">
                {editDates.length > 0 && (
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-2 border rounded-md p-3 bg-muted/30 flex-1">
                    <Label className="text-sm font-semibold block mb-2 text-muted-foreground">Nombres específicos (Opcional)</Label>
                    {editDates.map((d, i) => {
                      const offset = d.getTimezoneOffset();
                      const adjusted = new Date(d.getTime() - (offset * 60 * 1000));
                      const dateStr = adjusted.toISOString().split('T')[0];
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-xs font-mono bg-muted px-2 py-1 rounded text-muted-foreground min-w-[90px] text-center">{dateStr}</span>
                          <Input
                            size={1}
                            className="h-8 text-sm"
                            placeholder="Feriado"
                            value={editDateNames[dateStr] || ""}
                            onChange={(e) => setEditDateNames(prev => ({ ...prev, [dateStr]: e.target.value }))}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
                <DialogFooter className="pt-2 mt-auto">
                  <Button type="button" variant="outline" onClick={() => { setEditingCollectionId(null); setEditDates([]); setEditDateNames({}); }} disabled={isEditSubmitting}>Cancelar</Button>
                  <Button onClick={handleEditAddDates} disabled={isEditSubmitting || editDates.length === 0} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Plus className="w-4 h-4 mr-1" /> {isEditSubmitting ? "Agregando..." : `Agregar ${editDates.length} fechas`}
                  </Button>
                </DialogFooter>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      </div>
  );
}
