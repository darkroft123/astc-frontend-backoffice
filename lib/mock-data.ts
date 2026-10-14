// ==========================================
// CENTRAL MOCK DATA FOR LOCAL DEVELOPMENT - BACKOFFICE
// ==========================================

export const MOCK_ADMIN_USER = {
  id: "admin-001",
  sub: "admin-001",
  email: "admin@astc.com",
  username: "admin",
  firstName: "admin",
  lastName: "",
  role: "ADMIN",
  avatarUrl: "",
  exp: Math.floor(Date.now() / 1000) + 86400 * 30,
};

export const MOCK_PROJECTS = [
  {
    id: "p-gestion-asistencia",
    name: "gestion de asistencia",
    code: "G-ASIST",
    workStartTime: "08:00:00",
    workEndTime: "17:00:00",
    graceMinutes: 10,
    timezone: "America/Lima",
    responsibleId: "u-2",
    members: [{ userId: "u-1" }],
  },
  {
    id: "p-testo6",
    name: "testo6",
    code: "TESTO6",
    workStartTime: "08:00:00",
    workEndTime: "17:00:00",
    graceMinutes: 10,
    timezone: "America/Lima",
    responsibleId: "u-2",
    members: [{ userId: "u-2" }, { userId: "u-4" }],
  },
  {
    id: "p-testeo",
    name: "proyecto testeo",
    code: "TESTEO",
    workStartTime: "08:00:00",
    workEndTime: "17:00:00",
    graceMinutes: 10,
    timezone: "America/Lima",
    responsibleId: "u-5",
    members: [{ userId: "u-5" }],
  },
  {
    id: "p-extra1",
    name: "Proyecto Alpha",
    code: "ALPHA",
    responsibleId: "u-5",
    members: [{ userId: "u-5" }],
  },
  {
    id: "p-extra2",
    name: "Proyecto Beta",
    code: "BETA",
    responsibleId: "u-5",
    members: [{ userId: "u-5" }],
  },
];

export const MOCK_USERS_LIST = [
  {
    id: "u-1",
    username: "carlos123",
    firstName: "carlos",
    lastName: "mamani",
    email: "mamanigutierrezcarlos2123@gmail.com",
    phone: "+51 999 999 999",
    roleId: "TEAM_MEMBER",
    roleCode: "TEAM_MEMBER",
    roleName: "Team member",
    avatarUrl: "",
  },
  {
    id: "u-2",
    username: "carlos",
    firstName: "carlos",
    lastName: "mamani",
    email: "mamanigutierrezcarlos123@gmail.com",
    phone: null,
    roleId: "TEAM_MEMBER",
    roleCode: "TEAM_MEMBER",
    roleName: "Team member",
    avatarUrl: "",
  },
  {
    id: "u-3",
    username: "admin",
    firstName: "admin",
    lastName: "",
    email: "admin@astc.com",
    phone: null,
    roleId: "ADMIN",
    roleCode: "ADMIN",
    roleName: "Administrador",
    avatarUrl: "",
  },
  {
    id: "u-4",
    username: "user-carlos",
    firstName: "user-carlos",
    lastName: "",
    email: "user@astc.com",
    phone: null,
    roleId: "TEAM_MEMBER",
    roleCode: "TEAM_MEMBER",
    roleName: "Team member",
    avatarUrl: "",
  },
  {
    id: "u-5",
    username: "jefeproyecto-x",
    firstName: "jefeproyecto-x",
    lastName: "",
    email: "pm@astc.com",
    phone: null,
    roleId: "PROJECT_MANAGER",
    roleCode: "PROJECT_MANAGER",
    roleName: "Project manager",
    avatarUrl: "",
  },
];

export const MOCK_DASHBOARD_BACKOFFICE = {
  totalAttendances: 540,
  totalAbsences: 18,
  pendingJustifications: 4,
  porcentajeAsistencia: 96.7,
  totalUsers: 5,
  totalProjects: 3,
};

export const MOCK_ATTENDANCES_LIST = [
  {
    id: "att-1",
    userId: "u-1",
    user: {
      id: "u-1",
      firstName: "carlos",
      lastName: "mamani",
      username: "carlos123",
      email: "mamanigutierrezcarlos2123@gmail.com",
    },
    projectId: "p-gestion-asistencia",
    project: {
      id: "p-gestion-asistencia",
      name: "gestion de asistencia",
    },
    checkIn: "2026-10-14T08:02:15Z",
    checkOut: "2026-10-14T17:05:00Z",
    status: "ON_TIME",
  },
];

