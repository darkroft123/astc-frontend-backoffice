"use client";
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Eye, EyeOff, Upload, X, UserPlus, UserCheck, Shield, Briefcase, User as UserIcon, Loader2, Info, Globe, Phone, Clock, CalendarDays, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  InputGroup,
  InputGroupInput,
  InputGroupButton,
} from "@/components/ui/input-group";
import { useRouter, useSearchParams } from "next/navigation";

import {
  createUser,
  editUser,
  getUser,
} from "@/app/services/users.service";
import { formatAvatarUrl } from "@/lib/avatar-url";
import { useAuthGuard } from "@/app/jwt/auth/useAuthGuard";

const ROLES = {
  ADMIN: "018f6b7a-0001-7000-8000-000000000001",
  PROJECT_MANAGER: "018f6b7a-0001-7000-8000-000000000002",
  TEAM_MEMBER: "018f6b7a-0001-7000-8000-000000000003",
};

const ROLE_INFO = [
  {
    id: ROLES.TEAM_MEMBER,
    title: "Team Member",
    description: "Colaborador estándar. Marca asistencia con biometría facial, GPS y envía justificaciones.",
    icon: UserIcon,
  },
  {
    id: ROLES.PROJECT_MANAGER,
    title: "Project Manager",
    description: "Jefe de proyecto. Gestiona equipos, horarios de turno, excepciones y aprueba justificaciones.",
    icon: Briefcase,
  },
  {
    id: ROLES.ADMIN,
    title: "Administrador",
    description: "Acceso total. Administra catálogo de usuarios, proyectos globales, sedes y reportes.",
    icon: Shield,
  },
];

interface CountryConfig {
  id: string;
  name: string;
  prefix: string;
  digits: number;
  placeholder: string;
  timezone: string;
  utcOffset: string;
  diffFromPeru: string;
  holidayLaw: string;
  description: string;
}

const COUNTRIES: Record<string, CountryConfig> = {
  Peru: {
    id: "Peru",
    name: "Perú",
    prefix: "+51",
    digits: 9,
    placeholder: "987654321",
    timezone: "America/Lima",
    utcOffset: "UTC-5",
    diffFromPeru: "Mismo horario",
    holidayLaw: "Feriados de Perú",
    description: "Horario estándar (UTC-5) y feriados nacionales de Perú.",
  },
  Mexico: {
    id: "Mexico",
    name: "México",
    prefix: "+52",
    digits: 10,
    placeholder: "5512345678",
    timezone: "America/Mexico_City",
    utcOffset: "UTC-6",
    diffFromPeru: "-1 hora",
    holidayLaw: "Feriados de México",
    description: "Horario de México (UTC-6). Los turnos se ajustan a su hora local.",
  },
  Colombia: {
    id: "Colombia",
    name: "Colombia",
    prefix: "+57",
    digits: 10,
    placeholder: "3001234567",
    timezone: "America/Bogota",
    utcOffset: "UTC-5",
    diffFromPeru: "Mismo horario",
    holidayLaw: "Feriados de Colombia",
    description: "Horario de Colombia (UTC-5) y feriados locales.",
  },
  Chile: {
    id: "Chile",
    name: "Chile",
    prefix: "+56",
    digits: 9,
    placeholder: "912345678",
    timezone: "America/Santiago",
    utcOffset: "UTC-3 / UTC-4",
    diffFromPeru: "+1 a +2 horas",
    holidayLaw: "Feriados de Chile",
    description: "Horario de Chile y feriados nacionales chilenos.",
  },
  Argentina: {
    id: "Argentina",
    name: "Argentina",
    prefix: "+54",
    digits: 10,
    placeholder: "1123456789",
    timezone: "America/Argentina/Buenos_Aires",
    utcOffset: "UTC-3",
    diffFromPeru: "+2 horas",
    holidayLaw: "Feriados de Argentina",
    description: "Horario de Argentina (UTC-3) y feriados nacionales.",
  },
  Ecuador: {
    id: "Ecuador",
    name: "Ecuador",
    prefix: "+593",
    digits: 9,
    placeholder: "991234567",
    timezone: "America/Guayaquil",
    utcOffset: "UTC-5",
    diffFromPeru: "Mismo horario",
    holidayLaw: "Feriados de Ecuador",
    description: "Horario de Ecuador (UTC-5) y feriados locales.",
  },
  Espana: {
    id: "Espana",
    name: "España",
    prefix: "+34",
    digits: 9,
    placeholder: "612345678",
    timezone: "Europe/Madrid",
    utcOffset: "UTC+1 / UTC+2",
    diffFromPeru: "+6 a +7 horas",
    holidayLaw: "Feriados de España",
    description: "Horario de España y calendario laboral español.",
  },
  Otros: {
    id: "Otros",
    name: "Otros / Internacional",
    prefix: "+",
    digits: 15,
    placeholder: "Número telefónico",
    timezone: "UTC",
    utcOffset: "UTC",
    diffFromPeru: "Según proyecto",
    holidayLaw: "Según proyecto",
    description: "Configuración para colaboradores en otros países.",
  },
};

export default function CreateUserPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("id");
  const isEditMode = !!userId;
  const { token, checkingAuth, hydrated, user } = useAuthGuard(["ADMIN"]);

  const [loading, setLoading] = useState(false);
  const [changePassword, setChangePassword] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    roleId: ROLES.TEAM_MEMBER,
    country: 'Peru',
    phoneLocal: '',
    password: '',
    confirmPassword: '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentCountry = COUNTRIES[formData.country] || COUNTRIES.Peru;

  useEffect(() => {
    if (!token || !userId) return;
    loadUser();
  }, [token, userId]);

  // Función para detectar país a partir de un número de teléfono guardado
  function parsePhoneAndCountry(rawPhone: string | null | undefined): { countryId: string; localDigits: string } {
    if (!rawPhone) return { countryId: "Peru", localDigits: "" };

    const clean = rawPhone.trim();

    // Buscar si coincide con algún prefijo conocido
    for (const [cId, config] of Object.entries(COUNTRIES)) {
      if (cId === "Otros") continue;
      if (clean.startsWith(config.prefix)) {
        const local = clean.substring(config.prefix.length).replace(/\D/g, "").slice(0, config.digits);
        return { countryId: cId, localDigits: local };
      }
    }

    // Si es sólo números (sin prefijo explícito)
    const digitsOnly = clean.replace(/\D/g, "");
    if (digitsOnly.length === 9) {
      return { countryId: "Peru", localDigits: digitsOnly };
    } else if (digitsOnly.length === 10) {
      return { countryId: "Mexico", localDigits: digitsOnly };
    }

    return { countryId: "Peru", localDigits: digitsOnly.slice(0, 9) };
  }

  async function loadUser() {
    try {
      const data = await getUser(token!, userId!);
      const parsed = parsePhoneAndCountry(data.phone);

      setFormData({
        username: data.username || "",
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        email: data.email || "",
        phoneLocal: parsed.localDigits,
        roleId: data.roleId || ROLES.TEAM_MEMBER,
        country: parsed.countryId,
        password: "",
        confirmPassword: "",
      });
      setImagePreview(formatAvatarUrl(data?.avatarUrl));
    } catch (err) {
      console.error(err);
      setError("Error al cargar datos del usuario");
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Manejo del teléfono con límite de dígitos según país
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;

    // Detectar si el usuario pegó un número con código internacional (+52, +51, etc.)
    if (rawVal.startsWith("+")) {
      for (const [cId, config] of Object.entries(COUNTRIES)) {
        if (cId === "Otros") continue;
        if (rawVal.startsWith(config.prefix)) {
          const digits = rawVal.substring(config.prefix.length).replace(/\D/g, "").slice(0, config.digits);
          setFormData((prev) => ({ ...prev, country: cId, phoneLocal: digits }));
          return;
        }
      }
    }

    // Filtrar solo dígitos y limitar a la cantidad del país
    const cleanDigits = rawVal.replace(/\D/g, "").slice(0, currentCountry.digits);
    setFormData((prev) => ({ ...prev, phoneLocal: cleanDigits }));
  };

  // Manejo de cambio de país
  const handleCountryChange = (newCountryId: string) => {
    const newConfig = COUNTRIES[newCountryId] || COUNTRIES.Peru;
    setFormData((prev) => ({
      ...prev,
      country: newCountryId,
      phoneLocal: prev.phoneLocal.slice(0, newConfig.digits),
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("La imagen no debe superar los 5MB");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);

    try {
      // Validar longitud del teléfono si se ingresó
      if (formData.phoneLocal && formData.phoneLocal.length < Math.min(currentCountry.digits, 8)) {
        setError(`El número de teléfono para ${currentCountry.name} debe tener ${currentCountry.digits} dígitos.`);
        setLoading(false);
        return;
      }

      // Ensamblar teléfono completo con prefijo internacional
      const fullPhone = formData.phoneLocal
        ? `${currentCountry.prefix} ${formData.phoneLocal}`
        : null;

      const input: any = {
        username: formData.username.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: fullPhone,
        roleId: formData.roleId,
      };

      let avatarPayload = "";
      if (imageFile) {
        const base64Full = await fileToBase64(imageFile);
        avatarPayload = base64Full.includes(",") ? base64Full.split(",")[1] : base64Full;
      } else if (imagePreview) {
        if (imagePreview.startsWith("data:image/")) {
          avatarPayload = imagePreview.split(",")[1];
        } else {
          avatarPayload = imagePreview;
        }
      } else {
        avatarPayload = "";
      }

      if (isEditMode) {
        if (changePassword) {
          if (formData.password !== formData.confirmPassword) {
            setError("Las contraseñas no coinciden");
            setLoading(false);
            return;
          }
          if (formData.password.length < 8) {
            setError("La contraseña debe tener al menos 8 caracteres");
            setLoading(false);
            return;
          }
          input.password = formData.password;
        }
        input.avatarUrl = avatarPayload;
        await editUser(token!, userId!, input);
        if (userId === user?.id) {
          window.location.reload();
          return;
        }
      } else {
        if (formData.password !== formData.confirmPassword) {
          setError("Las contraseñas no coinciden");
          setLoading(false);
          return;
        }
        if (formData.password.length < 8) {
          setError("La contraseña debe tener al menos 8 caracteres");
          setLoading(false);
          return;
        }
        await createUser(token!, {
          ...input,
          password: formData.password,
          avatarUrl: avatarPayload || null,
        });
      }
      router.push("/users");
    } catch (error: any) {
      console.error(error);
      const msg = error?.message || "Error al guardar usuario";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const isReady = hydrated && !checkingAuth && token && user;
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
              {isEditMode ? (
                <UserCheck className="w-5 h-5 text-white" />
              ) : (
                <UserPlus className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">
                {isEditMode ? "Editar Usuario" : "Crear Nuevo Usuario"}
              </h1>
              <p className="text-xs text-muted-foreground">
                {isEditMode
                  ? "Modifica los datos del usuario, país, rol y credenciales de acceso"
                  : "Registra al colaborador con su país de residencia, biometría y rol institucional"}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/users')}
            className="text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            Volver a Usuarios
          </Button>
        </div>

        {error && (
          <div className="mb-5 p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-800 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* LEFT COLUMN: Personal Info & Avatar */}
            <div className="space-y-6">
              
              {/* CARD 1: PERSONAL INFORMATION */}
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-3 bg-zinc-50/50 border-b border-zinc-100">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span>1. Datos Personales y Ubicación</span>
                    <span className="text-[11px] font-normal text-muted-foreground">Información básica oficial</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Datos de identidad y país para cálculo de huso horario y feriados
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    
                    {/* USUARIO */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="username" className="text-xs font-semibold text-muted-foreground">Usuario (@) *</Label>
                      </div>
                      <Input
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="ej. carlos.mamani"
                        required
                        className="h-9 text-xs"
                      />
                      <p className="text-[10px] text-muted-foreground">Nombre de usuario único para menciones y login.</p>
                    </div>

                    {/* CORREO */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="email" className="text-xs font-semibold text-muted-foreground">Correo Electrónico *</Label>
                      </div>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="ej. carlos@empresa.com"
                        required
                        className="h-9 text-xs"
                      />
                      <p className="text-[10px] text-muted-foreground">Email institucional para recepción de notificaciones.</p>
                    </div>

                    {/* NOMBRE */}
                    <div className="space-y-1">
                      <Label htmlFor="firstName" className="text-xs font-semibold text-muted-foreground">Nombres *</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="ej. Carlos Enrique"
                        required
                        className="h-9 text-xs"
                      />
                      <p className="text-[10px] text-muted-foreground">Nombres según documento de identidad.</p>
                    </div>

                    {/* APELLIDOS */}
                    <div className="space-y-1">
                      <Label htmlFor="lastName" className="text-xs font-semibold text-muted-foreground">Apellidos *</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="ej. Mamani Gutiérrez"
                        required
                        className="h-9 text-xs"
                      />
                      <p className="text-[10px] text-muted-foreground">Apellido paterno y materno.</p>
                    </div>

                    {/* PAÍS SELECTOR */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="country" className="text-xs font-semibold text-zinc-700 flex items-center gap-1">
                          <Globe className="w-3.5 h-3.5 text-blue-600" />
                          <span>País de Residencia *</span>
                        </Label>
                      </div>
                      <Select
                        name="country"
                        value={formData.country}
                        onValueChange={handleCountryChange}
                      >
                        <SelectTrigger className="w-full h-9 text-xs">
                          <SelectValue placeholder="Seleccionar país" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(COUNTRIES).map((c) => (
                            <SelectItem key={c.id} value={c.id} className="text-xs">
                              <span className="font-medium">{c.name}</span>
                              <span className="ml-2 text-zinc-400 text-[10px]">({c.prefix})</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-muted-foreground">Sincroniza prefijo y matriz horaria.</p>
                    </div>

                    {/* TELÉFONO DINÁMICO */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="phoneLocal" className="text-xs font-semibold text-zinc-700 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Teléfono / Celular</span>
                        </Label>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {formData.phoneLocal.length}/{currentCountry.digits} dígitos
                        </span>
                      </div>
                      
                      <div className="relative flex rounded-lg border border-border bg-card overflow-hidden focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500">
                        {/* BADGE DE PREFIJO */}
                        <div className="flex items-center px-2.5 bg-zinc-100/80 border-r border-border text-xs font-bold text-blue-700 select-none transition-all duration-300">
                          <span>{currentCountry.prefix}</span>
                        </div>
                        <input
                          id="phoneLocal"
                          type="tel"
                          value={formData.phoneLocal}
                          onChange={handlePhoneChange}
                          placeholder={currentCountry.placeholder}
                          maxLength={currentCountry.digits}
                          className="h-9 w-full px-3 text-xs focus:outline-none bg-transparent"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Máx. {currentCountry.digits} dígitos para {currentCountry.name}.
                      </p>
                    </div>

                  </div>

                  {/* TARJETA INFORMATIVA: ZONA HORARIA Y PAÍS */}
                  <div className="mt-3 p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-semibold text-blue-900">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        <span>Zona Horaria: {currentCountry.name}</span>
                      </div>
                      <span className="text-[10px] font-mono font-semibold bg-card text-blue-800 px-2 py-0.5 rounded-full border border-blue-200 shadow-2xs">
                        {currentCountry.utcOffset}
                      </span>
                    </div>

                    <p className="text-[11px] text-muted-foreground">
                      {currentCountry.description}
                    </p>
                  </div>

                </CardContent>
              </Card>

              {/* CARD 2: AVATAR & PHOTO */}
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-3 bg-zinc-50/50 border-b border-zinc-100">
                  <CardTitle className="text-sm">2. Fotografía de Perfil (Patrón Biométrico IA)</CardTitle>
                  <CardDescription className="text-xs">
                    Imagen oficial utilizada por el motor de IA para validar el rostro en cada Check-In
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-5">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-border bg-muted flex items-center justify-center">
                        {imagePreview ? (
                          <img
                            src={imagePreview}
                            alt="preview"
                            className="w-full h-full object-cover"
                            onError={() => setImagePreview(null)}
                          />
                        ) : (
                          <UserIcon className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                      {imagePreview && (
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center shadow hover:bg-rose-700 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="cursor-pointer inline-block">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                        <div className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 text-xs font-semibold shadow-sm transition-colors">
                          <Upload className="w-3.5 h-3.5" />
                          {imagePreview ? "Cambiar Imagen" : "Subir Foto Oficial"}
                        </div>
                      </label>
                      <p className="text-[10px] text-muted-foreground">Rostro frontal, fondo claro (JPG, PNG o WEBP - Máx. 5MB).</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* RIGHT COLUMN: Roles & Credentials */}
            <div className="space-y-6">
              
              {/* CARD 3: ROLE SELECTION */}
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-3 bg-zinc-50/50 border-b border-zinc-100">
                  <CardTitle className="text-sm">3. Rol Institucional y Nivel de Acceso</CardTitle>
                  <CardDescription className="text-xs">Define los permisos y el portal asignado al usuario</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {ROLE_INFO.map((r) => {
                      const isSelected = formData.roleId === r.id;
                      const Icon = r.icon;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, roleId: r.id })}
                          className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 text-xs font-medium transition-all ${
                            isSelected
                              ? "bg-blue-50 text-blue-700 border-blue-600 shadow-sm"
                              : "border-zinc-100 bg-card text-zinc-500 hover:border-border hover:bg-background"
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${isSelected ? "text-blue-600" : "text-zinc-400"}`} />
                          <span className="font-semibold text-center leading-tight">{r.title}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-3 p-2.5 rounded-lg bg-muted/50 border border-zinc-100 text-[11px] text-zinc-600 flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span>
                      {ROLE_INFO.find(r => r.id === formData.roleId)?.description}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* CARD 4: CREDENTIALS */}
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-3 bg-zinc-50/50 border-b border-zinc-100">
                  <CardTitle className="text-sm">4. Credenciales de Acceso</CardTitle>
                  <CardDescription className="text-xs">
                    {isEditMode ? "Modificar contraseña del usuario (opcional)" : "Contraseña de acceso inicial segura"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  {isEditMode ? (
                    <div>
                      <label className="flex items-center gap-2 text-xs font-medium text-zinc-700 cursor-pointer select-none mb-3">
                        <input
                          type="checkbox"
                          checked={changePassword}
                          onChange={(e) => setChangePassword(e.target.checked)}
                          className="rounded text-blue-600 border-zinc-300 focus:ring-blue-500"
                        />
                        <span>Cambiar contraseña de este usuario</span>
                      </label>

                      {changePassword && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-100">
                          <div className="space-y-1.5">
                            <Label htmlFor="edit-password" className="text-xs text-muted-foreground">Nueva Contraseña</Label>
                            <InputGroup>
                              <InputGroupInput
                                id="edit-password"
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                placeholder="Mínimo 8 caracteres"
                                className="h-9 text-xs"
                              />
                              <InputGroupButton
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </InputGroupButton>
                            </InputGroup>
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor="edit-confirm" className="text-xs text-muted-foreground">Confirmar Contraseña</Label>
                            <InputGroup>
                              <InputGroupInput
                                id="edit-confirm"
                                type={showConfirmPassword ? "text" : "password"}
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                placeholder="Repite la contraseña"
                                className="h-9 text-xs"
                              />
                              <InputGroupButton
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              >
                                {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </InputGroupButton>
                            </InputGroup>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="password" className="text-xs text-muted-foreground">Contraseña *</Label>
                          <InputGroup>
                            <InputGroupInput
                              id="password"
                              type={showPassword ? "text" : "password"}
                              name="password"
                              value={formData.password}
                              onChange={handleChange}
                              required
                              placeholder="Mínimo 8 caracteres"
                              className="h-9 text-xs"
                            />
                            <InputGroupButton
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </InputGroupButton>
                          </InputGroup>
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="confirmPassword" className="text-xs text-muted-foreground">Confirmar Contraseña *</Label>
                          <InputGroup>
                            <InputGroupInput
                              id="confirmPassword"
                              type={showConfirmPassword ? "text" : "password"}
                              name="confirmPassword"
                              value={formData.confirmPassword}
                              onChange={handleChange}
                              required
                              placeholder="Repite la contraseña"
                              className="h-9 text-xs"
                            />
                            <InputGroupButton
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </InputGroupButton>
                          </InputGroup>
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground">Recomendado: Usar al menos 8 caracteres con letras y números.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>

          </div>

          {/* BOTTOM BUTTONS */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-6">
            <Button
              variant="outline"
              type="button"
              onClick={() => router.push('/users')}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {loading ? 'Guardando...' : isEditMode ? 'Actualizar Usuario' : 'Guardar Usuario'}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}
