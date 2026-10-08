"use client";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import { 
  getGlobalCollections, createCollection, deleteCollection, deleteCollectionItem, getAllProjects, linkProjectToCollection, getAdminSetting, updateAdminSetting, addDatesToCollection, CollectionOutput 
} from "@/app/services/project.assistance.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Calendar as CalendarIcon, Briefcase, RefreshCw, Layers, ChevronDown, ChevronRight, CheckCircle, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { SubMetricCard } from "@/components/dashboard/SubMetricCard";
import PageHeader from "@/components/layout/page-header";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { HolidayImporter } from "./HolidayImporter";
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
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-4">

        <PageHeader
          categoryTag={{ badge: "CONTROL GLOBAL", text: "Panel Administrativo" }}
          title="Colecciones Globales de Feriados"
          description="Agrupa y administra feriados en colecciones que aplican a todos los proyectos."
          showPeriodSelector={false}
        />

        <Card className="mt-4">
          <CardContent className="p-4">

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <SubMetricCard 
                label="TOTAL FERIADOS" 
                value={totalHolidays} 
                icon={<CalendarIcon className="w-5 h-5" />} 
                color="violet"
              />
              <SubMetricCard 
                label="COLECCIONES" 
                value={collections.length} 
                icon={<Layers className="w-5 h-5" />} 
                color="green"
              />
              <SubMetricCard 
                label="DÍAS PRÓXIMOS" 
                value={collections.reduce((acc, c) => acc + (c.items?.filter(i => new Date(i.date) >= new Date()).length || 0), 0)} 
                icon={<Briefcase className="w-5 h-5" />} 
                color="amber"
              />
            </div>

            <div className="flex items-end gap-3 flex-wrap lg:flex-nowrap mb-6">
              <div className="flex flex-col min-w-[250px]">
                <label className="text-[10px] text-zinc-500 mb-1">Buscar colección o fecha</label>
                <Input
                  placeholder="Buscar..."
                  className="h-9 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Button variant="ghost" onClick={fetchCollections} className="border border-border h-9 px-3">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
              <h3 className="text-sm font-semibold text-foreground">Listado de Colecciones</h3>
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                <HolidayImporter onImport={handleImportHolidays} year={new Date().getFullYear()} />
                <Button onClick={() => setIsFormOpen(true)} className="h-9 bg-violet-600 hover:bg-violet-700 text-white shadow-sm shrink-0">
                  <Plus className="w-4 h-4 mr-1.5" /> Nueva Colección
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {filteredCollections.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground bg-card border border-dashed rounded-lg">
                  {searchQuery ? "No se encontraron colecciones." : "No hay colecciones creadas."}
                </div>
              ) : (
                filteredCollections.map(c => (
                  <div key={c.id} className="border rounded-lg bg-card overflow-hidden shadow-sm">
                    <div 
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => toggleExpand(c.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 text-indigo-700 rounded-md">
                          <Layers className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">{c.name}</h4>
                          <p className="text-xs text-muted-foreground">{c.items?.length || 0} feriados ⬢ Creado {format(new Date(c.createdAt), "dd MMM yyyy", { locale: es })}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">GLOBAL</span>
                        <Button 
                          size="sm" 
                          variant={assignedCollectionId === c.id ? "outline" : "default"}
                          disabled={assignedCollectionId === c.id}
                          onClick={(e) => { e.stopPropagation(); setPendingAssignment(c.id); }}
                          className="h-8 text-xs font-semibold"
                        >
                          {assignedCollectionId === c.id ? <><CheckCircle className="w-3 h-3 mr-1" /> Asignado</> : "Asignar"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        {expandedId === c.id ? <ChevronDown className="w-5 h-5 text-muted-foreground" /> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
                      </div>
                    </div>
                    
                    {expandedId === c.id && (
                      <div className="bg-background border-t p-4">
                        {!c.items || c.items.length === 0 ? (
                          <p className="text-sm text-zinc-500 text-center py-4">Esta colección no tiene fechas asignadas.</p>
                        ) : (
                          <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                              {c.items.map(item => {
                                const dateObj = new Date(item.date + "T00:00:00");
                                const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
                                return (
                                  <div key={item.id} className="flex items-center justify-between p-3 bg-card border rounded-md shadow-sm group">
                                    <div className="flex items-center gap-3">
                                      <div className="flex flex-col items-center justify-center bg-muted rounded p-2 min-w-[50px]">
                                        <span className="text-xs text-muted-foreground uppercase">{format(dateObj, "MMM", { locale: es })}</span>
                                        <span className="text-lg font-bold text-foreground leading-none">{format(dateObj, "dd")}</span>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-foreground">{item.name}</p>
                                        <p className="text-xs text-muted-foreground">{days[dateObj.getDay()]}, {dateObj.getFullYear()}</p>
                                      </div>
                                    </div>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDeleteCollectionItem(item.id)} title="Eliminar fecha">
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="mt-3 flex justify-center">
                              <Button size="sm" variant="outline" className="text-xs border-dashed" onClick={() => { setEditingCollectionId(c.id); setEditDates([]); setEditDateNames({}); }}>
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

          </CardContent>
        </Card>

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-foreground">Crear Colección Global</DialogTitle>
              <DialogDescription className="text-zinc-500">
                Crea una colección para agrupar múltiples feriados. Aplica a toda la organización.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              
              <div className="space-y-3 bg-muted/50 p-4 rounded-lg border border-zinc-100 flex flex-col items-center">
                <Label className="text-foreground font-semibold mb-2">Selecciona las Fechas</Label>
                <div className="bg-card rounded-md shadow-sm border p-2">
                  <CalendarUI mode="multiple" selected={formDates} onSelect={(dates) => setFormDates(dates as Date[])} className="rounded-md" />
                </div>
                <p className="text-xs text-zinc-500 mt-2 text-center">Has seleccionado {formDates.length} días.</p>
              </div>

              <div className="space-y-5 flex flex-col">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Nombre de la Colección <span className="text-red-500">*</span></Label>
                  <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Ej. Feriados Perú 2026" required />
                </div>

                {formDates.length > 0 && (
                  <div className="space-y-3 max-h-48 overflow-y-auto pr-2 border rounded-md p-3 bg-muted/30 flex-1">
                    <Label className="text-sm font-semibold block mb-2 text-muted-foreground">Nombres específicos (Opcional)</Label>
                    {formDates.map((d, i) => {
                      const offset = d.getTimezoneOffset();
                      const adjusted = new Date(d.getTime() - (offset*60*1000));
                      const dateStr = adjusted.toISOString().split('T')[0];
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-xs font-mono bg-muted px-2 py-1 rounded text-muted-foreground min-w-[90px] text-center">{dateStr}</span>
                          <Input 
                            size={1}
                            className="h-8 text-sm" 
                            placeholder={formName || "Nombre..."} 
                            value={dateNames[dateStr] || ""} 
                            onChange={(e) => setDateNames(prev => ({...prev, [dateStr]: e.target.value}))} 
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

                <DialogFooter className="pt-2 mt-auto">
                  <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>Cancelar</Button>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={isSubmitting}>
                    <Plus className="w-4 h-4 mr-1" /> {isSubmitting ? "Creando..." : "Crear Colección"}
                  </Button>
                </DialogFooter>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal: Confirmar Asignación Global */}
        <Dialog open={!!pendingAssignment} onOpenChange={(open) => { if (!open) setPendingAssignment(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Asignar Colección Global</DialogTitle>
              <DialogDescription>
                Se aplicará esta colección globalmente a todos los proyectos. Al hacer esto, reemplazará a cualquier colección asignada previamente. ¿Aceptas?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setPendingAssignment(null)}>Cancelar</Button>
              <Button onClick={confirmAssignment} className="bg-violet-600 hover:bg-violet-700 text-white">
                Aceptar y Asignar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal: Agregar fechas a colección existente */}
        <Dialog open={!!editingCollectionId} onOpenChange={(open) => { if (!open) { setEditingCollectionId(null); setEditDates([]); setEditDateNames({}); } }}>
          <DialogContent className="sm:max-w-3xl">
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
                  <Button onClick={handleEditAddDates} disabled={isEditSubmitting || editDates.length === 0} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="w-4 h-4 mr-1" /> {isEditSubmitting ? "Agregando..." : `Agregar ${editDates.length} fechas`}
                  </Button>
                </DialogFooter>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
