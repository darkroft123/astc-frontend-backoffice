# Frontend Backoffice (Admin UI)

Frontend para el rol Administrator del sistema ASTC - panel administrativo.

## Stack Tecnológico

- Next.js 14+ (React - App Router)
- TypeScript
- TailwindCSS
- GraphQL Client

## Descripción

El frontend de Backoffice es el panel administrativo del sistema ASTC. Permite:

- Gestión completa de usuarios
- Asignación de roles
- Configuración del sistema
- Monitoreo administrativo

**Puerto:** 3002

## Arquitectura

```
frontend-backoffice/
├── app/
│   └── backoffice/
│       ├── page.tsx              # Dashboard principal
│       ├── usuarios/             # Gestión de usuarios
│       └── configuracion/        # Configuración del sistema
├── features/
├── components/
├── hooks/
├── lib/
└── app/services/
    └── backoffice.service.ts     # Servicio GraphQL
```

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/backoffice` | Dashboard administrativo |
| `/backoffice/usuarios` | Gestión de usuarios |
| `/backoffice/configuracion` | Configuración del sistema |

## Funcionalidades

### Gestión de Usuarios
- Listar usuarios con filtros
- Crear nuevos usuarios
- Editar usuarios existentes
- Activar/desactivar usuarios
- Asignar roles

### Roles del Sistema

| Código | Nombre |
|--------|--------|
| ADMIN | Administrator |
| PROJECT_MANAGER | Project Manager |
| TEAM_MEMBER | Team Member |

## Variables de Entorno

| Variable | Descripción |
|----------|-------------|
| `NODE_OPTIONS` | Opciones de memoria Node.js |

## Ejecución Local

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Build
npm run build
```

## Docker

```bash
# Puerto mapeado: 3002:3000
docker compose up -d frontend-backoffice
```

## Integraciones

- **Gateway (Apollo)**: Consumo de GraphQL
- **backoffice-service**: Gestión de usuarios
- **auth-service**: Validación de tokens
