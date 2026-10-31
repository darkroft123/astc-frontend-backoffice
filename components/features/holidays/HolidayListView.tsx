"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import {
  getGlobalCollections,
  createCollection,
  deleteCollection,
  deleteCollectionItem,
  getAllProjects,
  linkProjectToCollection,
  getAdminSetting,
  updateAdminSetting,
  addDatesToCollection,
  CollectionOutput,
} from "@/app/services/project.assistance.service";
import {
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  RotateCcw,
  Layers,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Search,
  Loader2,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HolidayImporter } from "./HolidayImporter";
import { CreateGlobalCollectionModal } from "./CreateGlobalCollectionModal";
import { MonthCalendarPicker } from "./MonthCalendarPicker";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MOCK_COLLECTIONS } from "@/lib/mock-data";

export default function HolidayListView() {
  const { token, hydrated } = useAuth();
  const [collections, setCollections] = useState<CollectionOutput[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [assignedCollectionId, setAssignedCollectionId] = useState<string | null>(null);
  const [pendingAssignment, setPendingAssignment] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [itemsPage, setItemsPage] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit states for adding dates
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);
  const [editDateStrings, setEditDateStrings] = useState<string[]>([]);
  const [editDateNames, setEditDateNames] = useState<Record<string, string>>({});
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  const fetchCollections = async () => {
    if (!token) return;
    setLoading(true);
    console.log("[HolidayListView Admin] Fetching global collections, token:", !!token);
    try {
      const [data, assignedId] = await Promise.all([
        getGlobalCollections(token).catch(() => null),
        getAdminSetting(token, "GLOBAL_ASSIGNED_COLLECTION_ID").catch(() => null),
      ]);
      console.log("[HolidayListView Admin] getGlobalCollections received:", Array.isArray(data) ? data.length : data);
      if (Array.isArray(data) && data.length > 0) {
        setCollections(data);
      } else {
        setCollections([]);
      }
      if (assignedId && Array.isArray(data) && data.some((c: any) => c.id === assignedId)) {
        setAssignedCollectionId(assignedId);
      } else {
        setAssignedCollectionId(null);
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
    if (!hydrated) return;
    if (token) fetchCollections();
    else setLoading(false);
  }, [hydrated, token]);

  const filteredCollections = useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase();
    return collections.filter(
      (c) =>
        c.name.toLowerCase().includes(lowerQuery) ||
        (c.items &&
          c.items.some(
            (i) => i.name?.toLowerCase().includes(lowerQuery) || i.date.includes(lowerQuery)
          ))
    );
  }, [collections, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredCollections.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedCollections = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCollections.slice(start, start + pageSize);
  }, [filteredCollections, currentPage, pageSize]);

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

  const handleImportHolidays = async (items: { date: string; name: string }[], namePrefix: string) => {
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

  const handleToggleEditDate = (dateStr: string) => {
    setEditDateStrings((prev) => {
      if (prev.includes(dateStr)) {
        const next = prev.filter((d) => d !== dateStr);
        setEditDateNames((old) => {
          const updated = { ...old };
          delete updated[dateStr];
          return updated;
        });
        return next;
      } else {
        return [...prev, dateStr].sort();
      }
    });
  };

  const handleEditAddDates = async () => {
    if (!token || !editingCollectionId || editDateStrings.length === 0) return;
    setIsEditSubmitting(true);
    try {
      const items = editDateStrings.map((d) => editDateNames[d] || "Feriado");
      await addDatesToCollection(token, editingCollectionId, editDateStrings, items[0] || "Feriado");
      setEditingCollectionId(null);
      setEditDateStrings([]);
      setEditDateNames({});
      await fetchCollections();
      toast({ title: "Feriados agregados a la colección" });
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: error.message || "No se pudieron agregar las fechas.",
        variant: "destructive",
      });
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const confirmAssignment = async () => {
    if (!pendingAssignment) return;
    const collectionIdToAssign = pendingAssignment;
    setPendingAssignment(null); // Cierra el modal de inmediato

    if (!token) return;
    try {
      setAssignedCollectionId(collectionIdToAssign);
      await updateAdminSetting(token, "GLOBAL_ASSIGNED_COLLECTION_ID", collectionIdToAssign).catch(() => null);
      if (typeof window !== "undefined") {
        localStorage.setItem("astc_global_assigned_collection_id", collectionIdToAssign);
      }

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
  };

  return (
    <div className="relative min-h-screen bg-transparent pb-16 font-sans">
      <div className="relative w-full max-w-7xl mx-auto space-y-6 z-10">
        {/* 1. TOP HEADER & CREATE COLLECTION BUTTON */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:pr-14">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.05em] bg-primary/10 text-primary border border-primary/20 dark:bg-violet/10 dark:text-[#7c9aff] dark:border-violet/20 px-2.5 py-0.5 rounded-full">
                CONTROL GLOBAL
              </span>
              <span className="text-xs text-muted-foreground dark:text-[#8F96AE]">
                · Panel administrativo
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground dark:text-white">
              Colecciones globales de feriados
            </h1>
            <p className="font-hanken text-xs text-muted-foreground dark:text-[#8F96AE] leading-relaxed max-w-xl">
              Agrupa y administra feriados en colecciones que aplican a todos los proyectos.
            </p>
          </div>

          {/* Desktop Right Header Actions */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsFormOpen(true)}
              className="w-full md:w-auto h-11 px-5 rounded-2xl text-white font-semibold text-xs shadow-lg shadow-purple-500/25 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
              style={{
                background: "linear-gradient(90deg, #5B8CFF 0%, #A855F7 100%)",
              }}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Nueva colección</span>
            </button>
          </div>
        </div>

        {/* UNIFIED MAIN CONTAINER ("Un cuadro entero, no 3") */}
        <div className="rounded-[22px] border border-border dark:border-[#1E2335] bg-card/60 dark:bg-[#0C0E18] p-4 sm:p-5 md:p-6 shadow-sm space-y-5 sm:space-y-6">
          {/* 2. TOP 3 KPI METRIC CARDS */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4 pt-1">
            {/* Card 1: Colecciones disponibles (Amber) */}
            <div className="rounded-2xl border border-amber-500/20 dark:border-[#483713] bg-card dark:bg-[#16140D] p-3 sm:p-4 flex flex-col justify-between h-[95px] sm:h-[105px] shadow-xs">
              <div className="flex items-center justify-between">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-[#FBBF24]">
                  <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div>
                <span className="text-[9.5px] sm:text-xs font-semibold text-amber-600 dark:text-[#FBBF24] block leading-tight truncate">
                  Colecciones
                </span>
                <div className="text-2xl sm:text-3xl font-bold text-foreground dark:text-white leading-none mt-1">
                  {collections.length}
                </div>
              </div>
            </div>

            {/* Card 2: Asignadas globalmente (Purple) */}
            <div className="rounded-2xl border border-purple-500/20 dark:border-[#371E57] bg-card dark:bg-[#140E24] p-3 sm:p-4 flex flex-col justify-between h-[95px] sm:h-[105px] shadow-xs">
              <div className="flex items-center justify-between">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-[#A855F7]">
                  <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div>
                <span className="text-[9.5px] sm:text-xs font-semibold text-purple-600 dark:text-[#A855F7] block leading-tight truncate">
                  Asignada global
                </span>
                <div className="text-2xl sm:text-3xl font-bold text-foreground dark:text-white leading-none mt-1">
                  {assignedCollectionId && collections.some((c) => c.id === assignedCollectionId) ? 1 : 0}
                </div>
              </div>
            </div>

            {/* Card 3: Total feriados (Green/Teal) */}
            <div className="rounded-2xl border border-emerald-500/20 dark:border-[#134E35] bg-card dark:bg-[#0C1814] p-3 sm:p-4 flex flex-col justify-between h-[95px] sm:h-[105px] shadow-xs">
              <div className="flex items-center justify-between">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-[#34D399]">
                  <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div>
                <span className="text-[9.5px] sm:text-xs font-semibold text-emerald-600 dark:text-[#34D399] block leading-tight truncate">
                  Total feriados
                </span>
                <div className="text-2xl sm:text-3xl font-bold text-foreground dark:text-white leading-none mt-1">
                  {totalHolidays}
                </div>
              </div>
            </div>
          </div>

          {/* Divider Line */}
          <div className="border-t border-border/60 dark:border-[#1E2335] -mx-4 sm:-mx-5 md:-mx-6" />

          {/* 3. FILTERS, SEARCH & ACTIONS BAR */}
          <div className="pt-1">
            <div className="flex flex-col md:flex-row items-stretch md:items-end justify-between gap-3.5">
              {/* BUSCAR */}
              <div className="space-y-1.5 flex-1 max-w-full md:max-w-md">
                <label className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider block">
                  BUSCAR
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-muted-foreground dark:text-[#8F96AE] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Nombre de colección o fecha..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#12141F] text-xs font-medium text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder-[#606680] focus:outline-none focus:border-[#A855F7]"
                    />
                  </div>
                  {/* Actualizar Button */}
                  <button
                    type="button"
                    onClick={fetchCollections}
                    className="w-11 h-11 rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#12141F] hover:bg-muted dark:hover:bg-[#1A1D2E] flex items-center justify-center text-muted-foreground dark:text-[#8F96AE] hover:text-foreground dark:hover:text-white transition-colors cursor-pointer shrink-0 shadow-xs"
                    title="Recargar"
                  >
                    <RotateCcw className={`w-4 h-4 ${loading ? "animate-spin text-[#A855F7]" : ""}`} />
                  </button>
                </div>
              </div>

              {/* Action Toolbar on Right */}
              <div className="flex items-center gap-2.5">
                <HolidayImporter onImport={handleImportHolidays} year={new Date().getFullYear()} />
              </div>
            </div>
          </div>

          {/* 4. LIST OF COLLECTIONS */}
          <div className="space-y-3.5 pt-1">
            {loading ? (
              <div className="p-12 text-center text-muted-foreground bg-card dark:bg-[#0C0E18] border border-border dark:border-[#1E2335] rounded-2xl text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-[#A855F7]" />
                <span>Cargando colecciones...</span>
              </div>
            ) : filteredCollections.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground bg-card dark:bg-[#0C0E18] border border-dashed border-border dark:border-[#1E2335] rounded-2xl text-xs">
                {searchQuery ? "No se encontraron colecciones con ese criterio." : "No hay colecciones creadas."}
              </div>
            ) : (
              paginatedCollections.map((col) => {
                const isAssigned = col.id === assignedCollectionId;
                const isExpanded = expandedId === col.id;

                return (
                  <div
                    key={col.id}
                    className={`rounded-2xl border transition-all ${
                      isAssigned
                        ? "border-[#34D399]/40 bg-card dark:bg-[#0C0E18]"
                        : "border-border dark:border-[#1E2335] bg-card dark:bg-[#0C0E18]"
                    }`}
                  >
                    {/* Header Row */}
                    <div
                      onClick={() => toggleExpand(col.id)}
                      className="p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-[#281B0C] border border-amber-200 dark:border-[#483713] flex items-center justify-center text-amber-600 dark:text-[#FBBF24] shrink-0">
                          <Layers className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-foreground dark:text-white truncate">
                              {col.name}
                            </h4>
                            <span className="font-mono text-[9px] font-bold px-2 py-0.5 rounded-md bg-[#FEF3C7] dark:bg-[#282114] text-[#D97706] dark:text-[#EAB308] border border-[#FDE68A] dark:border-[#483718] uppercase tracking-wider shrink-0">
                              GLOBAL
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground dark:text-[#8F96AE] mt-0.5 truncate">
                            {col.items?.length || 0} feriados · Creado {format(new Date(col.createdAt || Date.now()), "dd MMM yyyy", { locale: es })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isAssigned ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-[#0C251C] dark:text-[#34D399] dark:border-[#194B37]">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Asignado</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPendingAssignment(col.id);
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 dark:bg-[#20183A] dark:hover:bg-[#2B1F4F] dark:border-[#3E256C] dark:text-[#C4B5FD] text-xs font-semibold cursor-pointer transition-colors"
                          >
                            Asignar
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(col.id);
                          }}
                          title="Eliminar colección"
                          className="w-8 h-8 rounded-xl border border-red-500/20 dark:border-[#4D1C27] bg-red-500/10 dark:bg-[#24131A] hover:bg-red-500/20 dark:hover:bg-[#321721] flex items-center justify-center text-red-600 dark:text-[#EF4444] transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <div className="w-8 h-8 rounded-xl bg-background dark:bg-[#12141F] border border-border dark:border-[#1E2335] flex items-center justify-center text-muted-foreground">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content: Holidays Cards List matching PM */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-border/40 dark:border-[#1E2335] text-xs">
                          <span className="font-semibold text-foreground dark:text-white">
                            {col.items?.length || 0} {col.items?.length === 1 ? "feriado en esta colección" : "feriados en esta colección"}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCollectionId(col.id);
                              setEditDateStrings([]);
                              setEditDateNames({});
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A855F7] hover:underline cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Agregar más fechas</span>
                          </button>
                        </div>

                        {!col.items || col.items.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-4">
                            Esta colección no tiene fechas asignadas.
                          </p>
                        ) : (
                          <>
                            <div className="max-h-[340px] sm:max-h-[380px] overflow-y-auto pr-1 sm:pr-1.5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                              {(col.items || []).slice(((itemsPage[col.id] || 1) - 1) * 5, (itemsPage[col.id] || 1) * 5).map((item) => {
                                const dateObj = new Date(item.date + "T12:00:00");
                                const days = [
                                  "Domingo",
                                  "Lunes",
                                  "Martes",
                                  "Miércoles",
                                  "Jueves",
                                  "Viernes",
                                  "Sábado",
                                ];
                                return (
                                  <div
                                    key={item.id}
                                    className="rounded-xl border border-border dark:border-[#1E2335] bg-background dark:bg-[#12141F] p-3 flex items-center justify-between shadow-2xs group"
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      {/* Date Squircle */}
                                      <div className="border border-purple-200 dark:border-[#342461] rounded-xl py-1 px-2.5 min-w-[50px] text-center bg-purple-50 dark:bg-[#1D1635] shrink-0">
                                        <span className="text-[10px] font-bold text-purple-700 dark:text-[#A855F7] block tracking-wider uppercase leading-tight">
                                          {format(dateObj, "MMM", { locale: es })}
                                        </span>
                                        <span className="text-base font-bold text-purple-950 dark:text-white leading-none block mt-0.5">
                                          {format(dateObj, "dd")}
                                        </span>
                                      </div>

                                      <div className="min-w-0">
                                        <p className="font-bold text-xs text-foreground dark:text-white truncate">
                                          {item.name}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground capitalize mt-0.5 truncate">
                                          {days[dateObj.getDay()]}, {dateObj.getFullYear()}
                                        </p>
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      className="w-7 h-7 rounded-lg text-red-500 hover:bg-red-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0 cursor-pointer"
                                      onClick={() => handleDeleteCollectionItem(item.id)}
                                      title="Eliminar fecha"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          {col.items && col.items.length > 5 && (
                            <div className="flex items-center justify-between pt-2 px-1 text-xs text-muted-foreground border-t border-border/30 dark:border-[#1E2335]">
                              <span>
                                Mostrando {Math.min(((itemsPage[col.id] || 1) - 1) * 5 + 1, col.items.length)} - {Math.min((itemsPage[col.id] || 1) * 5, col.items.length)} de {col.items.length} feriados
                              </span>
                              <div className="flex items-center gap-2">
                                <span>
                                  Página {itemsPage[col.id] || 1} de {Math.max(1, Math.ceil(col.items.length / 5))}
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    disabled={(itemsPage[col.id] || 1) <= 1}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setItemsPage((prev) => ({
                                        ...prev,
                                        [col.id]: Math.max(1, (prev[col.id] || 1) - 1),
                                      }));
                                    }}
                                    className="p-1 rounded border border-border dark:border-[#22283D] bg-card dark:bg-[#141829] hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                    title="Página anterior"
                                  >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={(itemsPage[col.id] || 1) >= Math.ceil(col.items.length / 5)}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const maxP = Math.ceil(col.items.length / 5);
                                      setItemsPage((prev) => ({
                                        ...prev,
                                        [col.id]: Math.min(maxP, (prev[col.id] || 1) + 1),
                                      }));
                                    }}
                                    className="p-1 rounded border border-border dark:border-[#22283D] bg-card dark:bg-[#141829] hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                    title="Página siguiente"
                                  >
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* 5. PAGINATION FOOTER */}
          {filteredCollections.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 px-1 text-xs text-muted-foreground dark:text-[#8F96AE]">
              <div>
                <span>
                  Mostrando{" "}
                  <strong className="text-foreground dark:text-white">
                    {Math.min((currentPage - 1) * pageSize + 1, filteredCollections.length)}
                  </strong>{" "}
                  -{" "}
                  <strong className="text-foreground dark:text-white">
                    {Math.min(currentPage * pageSize, filteredCollections.length)}
                  </strong>{" "}
                  de{" "}
                  <strong className="text-foreground dark:text-white">
                    {filteredCollections.length}
                  </strong>{" "}
                  colecciones
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span>
                  Página <strong className="text-foreground dark:text-white">{currentPage}</strong> de{" "}
                  <strong className="text-foreground dark:text-white">{totalPages}</strong>
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="h-8 px-2.5 rounded-lg border border-border dark:border-[#22283D] bg-card dark:bg-[#141829] hover:bg-muted dark:hover:bg-[#1C2238] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 text-foreground dark:text-white transition-colors cursor-pointer"
                    title="Página anterior"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-xs">Anterior</span>
                  </button>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="h-8 px-2.5 rounded-lg border border-border dark:border-[#22283D] bg-card dark:bg-[#141829] hover:bg-muted dark:hover:bg-[#1C2238] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 text-foreground dark:text-white transition-colors cursor-pointer"
                    title="Página siguiente"
                  >
                    <span className="hidden sm:inline text-xs">Siguiente</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Crear Colección Global */}
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
      <Dialog
        open={!!pendingAssignment}
        onOpenChange={(open) => {
          if (!open) setPendingAssignment(null);
        }}
      >
        <DialogContent className="sm:max-w-md rounded-2xl border border-border dark:border-[#1E2335] bg-card dark:bg-[#0E111C]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground dark:text-white">
              Asignar Colección Global
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground dark:text-[#8F96AE]">
              Se aplicará esta colección globalmente a todos los proyectos. Al hacer esto, reemplazará a cualquier colección asignada previamente. ¿Deseas continuar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPendingAssignment(null)}
              className="rounded-xl border-border dark:border-[#1E2335] text-xs font-semibold"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmAssignment}
              className="rounded-xl bg-gradient-to-r from-[#5B8CFF] to-[#A855F7] text-white text-xs font-semibold"
            >
              Aceptar y Asignar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Agregar fechas a colección existente */}
      <Dialog
        open={!!editingCollectionId}
        onOpenChange={(open) => {
          if (!open) {
            setEditingCollectionId(null);
            setEditDateStrings([]);
            setEditDateNames({});
          }
        }}
      >
        <DialogContent className="max-w-lg md:max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border dark:border-[#1E2335] bg-card dark:bg-[#0E111C] p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground dark:text-white">
              Agregar Feriados a la Colección
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground dark:text-[#8F96AE]">
              Selecciona las fechas que deseas sumar a esta colección.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 items-start">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground dark:text-white">
                  Selecciona fechas
                </Label>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-[#A855F7] font-semibold">
                  {editDateStrings.length} seleccionadas
                </span>
              </div>
              <MonthCalendarPicker
                selectedDates={editDateStrings}
                onToggleDate={handleToggleEditDate}
              />
            </div>

            <div className="space-y-3 flex flex-col">
              <Label className="text-xs font-semibold text-foreground dark:text-white">
                Nombres específicos <span className="text-muted-foreground font-normal">(opcional)</span>
              </Label>

              {editDateStrings.length > 0 ? (
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                  {editDateStrings.map((dateStr) => (
                    <div key={dateStr} className="flex items-center gap-2">
                      <span className="text-xs font-mono px-2.5 py-1.5 rounded-lg border border-border dark:border-[#1E2335] bg-muted/60 dark:bg-[#141829] text-muted-foreground min-w-[95px] text-center">
                        {dateStr}
                      </span>
                      <Input
                        className="h-8 text-xs rounded-lg border-border dark:border-[#1E2335] bg-background dark:bg-[#141829]"
                        placeholder="Feriado"
                        value={editDateNames[dateStr] || ""}
                        onChange={(e) =>
                          setEditDateNames((prev) => ({ ...prev, [dateStr]: e.target.value }))
                        }
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 border border-dashed border-border dark:border-[#1E2335] rounded-2xl text-center text-xs text-muted-foreground">
                  Selecciona fechas en el calendario
                </div>
              )}

              <DialogFooter className="pt-4 mt-auto flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingCollectionId(null);
                    setEditDateStrings([]);
                    setEditDateNames({});
                  }}
                  disabled={isEditSubmitting}
                  className="rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleEditAddDates}
                  disabled={isEditSubmitting || editDateStrings.length === 0}
                  className="rounded-xl bg-gradient-to-r from-[#5B8CFF] to-[#A855F7] text-white text-xs font-semibold"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {isEditSubmitting ? "Agregando..." : `Agregar ${editDateStrings.length} fechas`}
                </Button>
              </DialogFooter>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
