========================================================
FRONTEND BACKOFFICE - ESPECIFICACIÓN TÉCNICA
SISTEMA ASTC
========================================================

1. DESCRIPCIÓN GENERAL
--------------------------------------------------------
El frontend Backoffice es el módulo administrativo del sistema ASTC.

Está diseñado exclusivamente para usuarios con rol ADMIN y
permite la administración global del sistema, incluyendo:

- Gestión de usuarios
- Visualización de métricas del sistema
- Creación de usuarios
- Asignación de roles
- Acceso a módulos administrativos

Este módulo representa la capa más alta de control del sistema.
========================================================


2. RESPONSABILIDADES DEL SISTEMA
--------------------------------------------------------
El frontend Backoffice es responsable de:

- Mostrar dashboard administrativo general
- Consultar usuarios del sistema vía GraphQL
- Crear nuevos usuarios en el auth-service
- Asignar roles (ADMIN, PROJECT_MANAGER, TEAM_MEMBER)
- Navegar a módulo de gestión de usuarios
- Visualizar métricas globales del sistema
- Mantener control administrativo del ecosistema ASTC

========================================================


3. ARQUITECTURA DEL FRONTEND
--------------------------------------------------------
Tecnología:

- Next.js (App Router)
- React (Client Components)
- TypeScript
- TailwindCSS
- GraphQL Client
- JWT Authentication

Estructura:

AdminDashboardPage
    ↓
GraphQL fetch (ListUsers)
    ↓
AuthService (JWT validation)
    ↓
Backoffice Service (usuarios + roles)
    ↓
Database (users, roles)
========================================================


4. FLUJO DEL DASHBOARD PRINCIPAL
--------------------------------------------------------
1. El administrador inicia sesión
2. Se valida JWT
3. Se carga el dashboard admin
4. Se ejecuta query:

   query { ListUsers { id } }

5. Se obtienen usuarios registrados
6. Se muestran métricas del sistema:
   - total de usuarios
   - total de proyectos
7. El admin accede a acciones rápidas
========================================================


5. MÓDULO DE GESTIÓN DE USUARIOS
--------------------------------------------------------
Este es el módulo principal del Backoffice.

Funcionalidades:

- Listar todos los usuarios del sistema
- Ver detalle de cada usuario
- Editar usuario
- Eliminar usuario
- Asignar roles

Datos mostrados:

- username
- email
- role
- estado del usuario

Regla:
Solo ADMIN puede acceder a este módulo.
========================================================


6. FLUJO DE CREACIÓN DE USUARIOS
--------------------------------------------------------
Este flujo es crítico del sistema.

1. ADMIN accede a "Crear Usuario"
2. Se abre formulario:
   - username
   - email
   - password
   - roleId
3. Se envía mutación GraphQL al backend
4. Backend valida rol y datos
5. Se encripta contraseña en auth-service
6. Se guarda usuario en base de datos
7. Se retorna usuario creado

Resultado:
Nuevo usuario disponible en auth-service + backoffice
========================================================


7. MÓDULO DE ROLES
--------------------------------------------------------
Roles del sistema:

- ADMIN
- PROJECT_MANAGER
- TEAM_MEMBER

Reglas:

- ADMIN → acceso total
- PROJECT_MANAGER → acceso a proyectos y asistencia
- TEAM_MEMBER → solo asistencia

El role se asigna en creación o edición de usuario.
========================================================


8. CONEXIÓN CON BACKEND
--------------------------------------------------------
Servicio principal:

- backoffice-service (GraphQL API)

Endpoint:

http://backoffice-service:8084/graphql

Servicios relacionados:

- auth-service (JWT + login)
- postgres (users + roles)

El frontend NO accede directamente a la base de datos.
========================================================


9. MÉTRICAS DEL DASHBOARD
--------------------------------------------------------
Se muestran métricas globales:

- total de usuarios registrados
- total de proyectos activos
- estado general del sistema

Estas métricas se obtienen mediante consultas GraphQL.
========================================================


10. FLUJO DE NAVEGACIÓN
--------------------------------------------------------
Pantallas principales:

- Dashboard Admin
- Gestión de usuarios
- Crear usuario
- Editar usuario
- Detalle de usuario

Flujo:

Dashboard → Users → Create User → Users List
========================================================


11. UI DEL SISTEMA
--------------------------------------------------------
Componentes:

- UserCard
- MetricCard
- ActionCard
- UserForm
- RoleSelector

Diseño:

- Layout tipo panel administrativo
- Tarjetas de métricas
- Botones de acción rápida
- Panel lateral de navegación
========================================================


12. REGLAS DE NEGOCIO
--------------------------------------------------------
- Solo ADMIN puede acceder al backoffice
- No se permite acceso sin JWT válido
- Los usuarios deben tener rol asignado
- No se pueden crear usuarios sin email o password
- Cada usuario debe tener un rol válido
========================================================


13. SEGURIDAD
--------------------------------------------------------
- JWT obligatorio en todas las requests
- Validación de rol ADMIN en backend
- Protección de rutas en frontend
- Token almacenado en localStorage (dev)
- Sin token → redirección a login
========================================================


14. INTEGRACIÓN CON SISTEMA GENERAL
--------------------------------------------------------
Flujo global:

LOGIN FRONTEND
      ↓
AUTH SERVICE (JWT)
      ↓
BACKOFFICE FRONTEND
      ↓
GRAPHQL REQUESTS
      ↓
BACKOFFICE SERVICE
      ↓
DATABASE (users + roles)
========================================================


15. ACCIONES RÁPIDAS
--------------------------------------------------------
El dashboard incluye:

- Gestionar usuarios → navegación a módulo users
- Crear usuario → formulario de registro
- Visualizar estadísticas del sistema

========================================================


16. CARACTERÍSTICAS TÉCNICAS
--------------------------------------------------------
- Next.js App Router
- Client-side rendering
- GraphQL API consumption
- JWT decoding en frontend
- Role-based access control
- Modular UI components
========================================================


17. REGLAS CRÍTICAS DEL SISTEMA
--------------------------------------------------------
- El backoffice es el núcleo administrativo
- No hay acceso sin rol ADMIN
- Todas las acciones son auditables
- Usuarios no pueden auto-escalar roles
========================================================


FIN DEL DOCUMENTO
========================================================