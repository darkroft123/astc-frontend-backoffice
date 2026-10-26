"use client";
import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Save,
  Eye,
  EyeOff,
  Upload,
  X,
  UserPlus,
  UserCheck,
  Shield,
  Briefcase,
  User as UserIcon,
  Loader2,
  Info,
  Globe,
  Phone,
  Clock,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createUser,
  editUser,
  getUser,
} from "@/app/services/users.service";
import { formatAvatarUrl } from "@/lib/avatar-url";
import { useAuthGuard } from "@/app/jwt/auth/useAuthGuard";
import { NotificationBell } from "@/components/layout/notification-bell";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const ROLES = {
  ADMIN: "018f6b7a-0001-7000-8000-000000000001",
  PROJECT_MANAGER: "018f6b7a-0001-7000-8000-000000000002",
  TEAM_MEMBER: "018f6b7a-0001-7000-8000-000000000003",
};

const ROLE_INFO = [
  {
    id: ROLES.TEAM_MEMBER,
    title: "Team member",
    description:
      "Trabajador estándar. Marca asistencia con biometría facial y GPS, y envía justificaciones.",
    icon: UserIcon,
  },
  {
    id: ROLES.PROJECT_MANAGER,
    title: "Project manager",
    description:
      "Jefe de proyecto. Gestiona equipos, horarios de turno, excepciones y aprueba justificaciones.",
    icon: Briefcase,
  },
  {
    id: ROLES.ADMIN,
    title: "Administrador",
    description:
      "Acceso total. Administra catálogo de usuarios, proyectos globales, sedes y reportes.",
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
    description: "Configuración para trabajadores en otros países.",
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
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    roleId: ROLES.TEAM_MEMBER,
    country: "Peru",
    phoneLocal: "",
    password: "",
    confirmPassword: "",
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

  function parsePhoneAndCountry(rawPhone: string | null | undefined): {
    countryId: string;
    localDigits: string;
  } {
    if (!rawPhone) return { countryId: "Peru", localDigits: "" };

    const clean = rawPhone.trim();

    for (const [cId, config] of Object.entries(COUNTRIES)) {
      if (cId === "Otros") continue;
      if (clean.startsWith(config.prefix)) {
        const local = clean
          .substring(config.prefix.length)
          .replace(/\D/g, "")
          .slice(0, config.digits);
        return { countryId: cId, localDigits: local };
      }
    }

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

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;

    if (rawVal.startsWith("+")) {
      for (const [cId, config] of Object.entries(COUNTRIES)) {
        if (cId === "Otros") continue;
        if (rawVal.startsWith(config.prefix)) {
          const digits = rawVal
            .substring(config.prefix.length)
            .replace(/\D/g, "")
            .slice(0, config.digits);
          setFormData((prev) => ({ ...prev, country: cId, phoneLocal: digits }));
          return;
        }
      }
    }

    const cleanDigits = rawVal.replace(/\D/g, "").slice(0, currentCountry.digits);
    setFormData((prev) => ({ ...prev, phoneLocal: cleanDigits }));
  };

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
      if (
        formData.phoneLocal &&
        formData.phoneLocal.length < Math.min(currentCountry.digits, 8)
      ) {
        setError(
          `El número de teléfono para ${currentCountry.name} debe tener ${currentCountry.digits} dígitos.`
        );
        setLoading(false);
        return;
      }

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
        avatarPayload = base64Full.includes(",")
          ? base64Full.split(",")[1]
          : base64Full;
      } else if (imagePreview) {
        if (imagePreview.startsWith("data:image/")) {
          avatarPayload = imagePreview.split(",")[1];
        } else {
          avatarPayload = imagePreview;
        }
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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-transparent overflow-hidden pb-12">
      <div className="relative w-full max-w-7xl mx-auto space-y-6 z-10">
        {/* MOBILE TOP BAR (MATCHING SVG: <- Usuarios + Notification Bell) */}
        <div className="flex md:hidden items-center justify-between pb-1">
          <button
            type="button"
            onClick={() => router.push("/users")}
            className="flex items-center gap-2 text-sm font-semibold text-foreground hover:opacity-80 transition-opacity cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Usuarios</span>
          </button>
          <NotificationBell />
        </div>

        {/* SECTION HEADER */}
        <div className="flex items-start md:items-center justify-between gap-4">
          <div className="flex items-start md:items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#6366F1] to-[#A855F7] flex items-center justify-center text-white shadow-md shrink-0">
              {isEditMode ? (
                <UserCheck className="w-6 h-6 shrink-0 aspect-square" strokeWidth={1.8} />
              ) : (
                <UserPlus className="w-6 h-6 shrink-0 aspect-square" strokeWidth={1.8} />
              )}
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">
                {isEditMode ? "Editar usuario" : "Crear nuevo usuario"}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {isEditMode
                  ? "Modifica los datos del usuario, país, rol y credenciales de acceso."
                  : "Registra al trabajador con su país de residencia, biometría y rol institucional."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push("/users")}
            className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-raised text-xs font-medium text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a usuarios</span>
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red/10 border border-red/20 text-sm text-red-ink flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: Personal Info & Location (Card 1) */}
            <div className="lg:col-span-7 bg-card border border-border rounded-2xl p-5 shadow-xs space-y-5">
              {/* Card 1 Header */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground">
                    Datos personales y ubicación
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Datos de identidad y país para calcular el huso horario y los feriados
                  </p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4 pt-1">
                {/* USUARIO */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">
                    Usuario (@) <span className="text-red">*</span>
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="ej. carlos.mamani"
                    required
                    className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-foreground text-xs placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all shadow-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Nombre de usuario único para menciones y acceso.
                  </p>
                </div>

                {/* CORREO ELECTRÓNICO */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">
                    Correo electrónico <span className="text-red">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="ej. carlos@empresa.com"
                    required
                    className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-foreground text-xs placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all shadow-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Correo institucional para recibir notificaciones.
                  </p>
                </div>

                {/* NOMBRES */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">
                    Nombres <span className="text-red">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="ej. Carlos Enrique"
                    required
                    className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-foreground text-xs placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all shadow-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Según documento de identidad.
                  </p>
                </div>

                {/* APELLIDOS */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">
                    Apellidos <span className="text-red">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="ej. Mamani Gutiérrez"
                    required
                    className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-foreground text-xs placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all shadow-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Apellido paterno y materno.
                  </p>
                </div>

                {/* PAÍS DE RESIDENCIA */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-primary" />
                    <span>País de residencia</span>
                    <span className="text-red">*</span>
                  </label>
                  <Select
                    value={formData.country}
                    onValueChange={(val) => handleCountryChange(val)}
                  >
                    <SelectTrigger className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-foreground text-xs shadow-xs">
                      <div className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                        <SelectValue placeholder="Selecciona un país" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(COUNTRIES).map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} ({c.prefix})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    Sincroniza el prefijo telefónico y la zona horaria.
                  </p>
                </div>

                {/* TELÉFONO */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-green-ink" />
                      <span>Teléfono / celular</span>
                    </label>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {formData.phoneLocal.length}/{currentCountry.digits} dígitos
                    </span>
                  </div>
                  <div className="flex rounded-xl border border-border bg-background overflow-hidden focus-within:ring-2 focus-within:ring-primary/10 focus-within:border-primary transition-all shadow-xs">
                    <div className="flex items-center px-3 bg-muted/40 border-r border-border text-xs font-semibold text-primary select-none">
                      {currentCountry.prefix}
                    </div>
                    <input
                      type="tel"
                      value={formData.phoneLocal}
                      onChange={handlePhoneChange}
                      placeholder={currentCountry.placeholder}
                      maxLength={currentCountry.digits}
                      className="h-10 w-full px-3.5 text-xs bg-transparent text-foreground placeholder:text-muted-foreground outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Máx. {currentCountry.digits} dígitos para {currentCountry.name}.
                  </p>
                </div>

                {/* ZONA HORARIA CALLOUT */}
                <div className="mt-4 p-3.5 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/20 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      <span>Zona horaria: {currentCountry.name}</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-card border border-primary/20 text-primary">
                      {currentCountry.utcOffset}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {currentCountry.description}
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Photo (2), Role (3), Credentials (4) */}
            <div className="lg:col-span-5 space-y-6">
              {/* CARD 2: FOTOGRAFÍA DE PERFIL */}
              <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-foreground">
                      Fotografía de perfil (patrón biométrico IA)
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Imagen oficial que usa el motor de IA para validar el rostro en cada check-in
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-1">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border border-border bg-muted/40 flex items-center justify-center overflow-hidden shrink-0">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="preview"
                          className="w-full h-full object-cover"
                          onError={() => setImagePreview(null)}
                        />
                      ) : (
                        <UserIcon className="w-7 h-7 text-muted-foreground" />
                      )}
                    </div>
                    {imagePreview && (
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center shadow-xs hover:bg-destructive/90 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-raised text-xs font-medium text-foreground transition-colors shadow-xs">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <Upload className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{imagePreview ? "Cambiar foto oficial" : "Subir foto oficial"}</span>
                    </label>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      Rostro frontal y fondo claro · JPG, PNG o WEBP · máx. 5 MB
                    </p>
                  </div>
                </div>
              </div>

              {/* CARD 3: ROL INSTITUCIONAL */}
              <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-foreground">
                      Rol institucional y nivel de acceso
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Define los permisos y el portal asignado al usuario
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5 pt-1">
                  {ROLE_INFO.map((r) => {
                    const isSelected = formData.roleId === r.id;
                    const Icon = r.icon;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, roleId: r.id })}
                        className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                          isSelected
                            ? "bg-primary/10 text-primary border-2 border-primary shadow-xs"
                            : "border border-border bg-card text-muted-foreground hover:bg-raised hover:text-foreground"
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                        <span className="font-semibold text-center leading-tight">
                          {r.title}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground flex items-center gap-2.5">
                  <Info className="w-4 h-4 text-primary shrink-0" />
                  <span>
                    {ROLE_INFO.find((r) => r.id === formData.roleId)?.description}
                  </span>
                </div>
              </div>

              {/* CARD 4: CREDENCIALES DE ACCESO */}
              <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    4
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-foreground">
                      Credenciales de acceso
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isEditMode
                        ? "Modificar contraseña del usuario (opcional)"
                        : "Contraseña inicial de acceso"}
                    </p>
                  </div>
                </div>

                {isEditMode ? (
                  <div className="space-y-3 pt-1">
                    <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={changePassword}
                        onChange={(e) => setChangePassword(e.target.checked)}
                        className="rounded text-primary border-border focus:ring-primary"
                      />
                      <span>Cambiar contraseña de este usuario</span>
                    </label>

                    {changePassword && (
                      <div className="space-y-3 pt-2">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-foreground">
                            Nueva contraseña <span className="text-red">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              name="password"
                              value={formData.password}
                              onChange={handleChange}
                              placeholder="Mínimo 8 caracteres"
                              required
                              className="w-full h-10 pl-3.5 pr-10 rounded-xl border border-border bg-background text-foreground text-xs placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all shadow-xs"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-medium text-foreground">
                            Confirmar contraseña <span className="text-red">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              name="confirmPassword"
                              value={formData.confirmPassword}
                              onChange={handleChange}
                              placeholder="Repite la contraseña"
                              required
                              className="w-full h-10 pl-3.5 pr-10 rounded-xl border border-border bg-background text-foreground text-xs placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all shadow-xs"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-foreground">
                        Contraseña <span className="text-red">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Mínimo 8 caracteres"
                          required
                          className="w-full h-10 pl-3.5 pr-10 rounded-xl border border-border bg-background text-foreground text-xs placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all shadow-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-foreground">
                        Confirmar contraseña <span className="text-red">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="Repite la contraseña"
                          required
                          className="w-full h-10 pl-3.5 pr-10 rounded-xl border border-border bg-background text-foreground text-xs placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all shadow-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-muted-foreground">
                      Usa al menos 8 caracteres con letras y números.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* BOTTOM ACTION BAR */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Info className="w-4 h-4 text-primary shrink-0" />
              <span>Completa los campos con <span className="text-destructive font-bold">*</span> para guardar.</span>
            </div>

            <div className="flex items-center gap-3 w-full">
              <button
                type="button"
                onClick={() => router.push("/users")}
                disabled={loading}
                className="h-12 flex-1 rounded-2xl text-xs sm:text-sm font-semibold border border-border bg-card dark:bg-[#161928] hover:bg-raised text-foreground transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center shadow-xs"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={loading}
                className="h-12 flex-1 rounded-2xl text-xs sm:text-sm font-semibold bg-brand-gradient hover:brightness-110 active:scale-[0.98] text-white flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 transition-all cursor-pointer disabled:opacity-50 px-3 whitespace-nowrap"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 shrink-0 aspect-square animate-spin" />
                ) : (
                  <Save className="w-4 h-4 shrink-0 aspect-square" strokeWidth={1.75} />
                )}
                <span className="truncate">
                  {loading
                    ? "Guardando..."
                    : isEditMode
                    ? "Actualizar usuario"
                    : "Guardar usuario"}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
