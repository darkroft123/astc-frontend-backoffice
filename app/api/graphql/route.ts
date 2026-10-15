import { NextResponse } from "next/server";
import {
  MOCK_ADMIN_USER,
  MOCK_PROJECTS,
  MOCK_USERS_LIST,
  MOCK_ATTENDANCES_LIST,
  MOCK_DASHBOARD_BACKOFFICE,
  MOCK_NOTIFICATIONS,
  MOCK_COLLECTIONS,
} from "@/lib/mock-data";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const query = body.query || "";

    console.log("[MOCK GRAPHQL BACKOFFICE] Processing query:", query.slice(0, 60).replace(/\s+/g, " "));

    // 1. Dashboard
    if (query.includes("getDashboard")) {
      return NextResponse.json({
        data: {
          getDashboard: MOCK_DASHBOARD_BACKOFFICE,
          getDashboardPM: MOCK_DASHBOARD_BACKOFFICE,
        },
      });
    }

    // 2. Projects
    if (
      query.includes("getAllProjects") ||
      query.includes("listProjects") ||
      query.includes("getMyProjects")
    ) {
      return NextResponse.json({
        data: {
          getAllProjects: MOCK_PROJECTS,
          listProjects: MOCK_PROJECTS,
          getMyProjects: MOCK_PROJECTS,
        },
      });
    }

    // 3. Users
    if (query.includes("createUser")) {
      const input = body.variables?.input || {};
      const newUser = {
        id: `u-${Date.now()}`,
        username: input.username || "nuevo.usuario",
        email: input.email || "nuevo@empresa.com",
        firstName: input.firstName || "",
        lastName: input.lastName || "",
        phone: input.phone || null,
        roleId: input.roleId || "TEAM_MEMBER",
        roleCode: input.roleId === "018f6b7a-0001-7000-8000-000000000001" ? "ADMIN" : input.roleId === "018f6b7a-0001-7000-8000-000000000002" ? "PROJECT_MANAGER" : "TEAM_MEMBER",
        roleName: input.roleId === "018f6b7a-0001-7000-8000-000000000001" ? "Administrador" : input.roleId === "018f6b7a-0001-7000-8000-000000000002" ? "Project manager" : "Team member",
        avatarUrl: input.avatarUrl || "",
      };
      MOCK_USERS_LIST.push(newUser);
      return NextResponse.json({
        data: {
          createUser: newUser,
        },
      });
    }

    if (query.includes("editUser")) {
      const editId = body.variables?.id;
      const target = MOCK_USERS_LIST.find((x) => x.id === editId) || MOCK_USERS_LIST[0];
      if (body.variables?.input && target) {
        const inp = body.variables.input;
        if (inp.username) target.username = inp.username;
        if (inp.firstName !== undefined) target.firstName = inp.firstName;
        if (inp.lastName !== undefined) target.lastName = inp.lastName;
        if (inp.email) target.email = inp.email;
        if (inp.phone !== undefined) target.phone = inp.phone;
        if (inp.roleId) {
          target.roleId = inp.roleId;
          target.roleCode = inp.roleId === "018f6b7a-0001-7000-8000-000000000001" ? "ADMIN" : inp.roleId === "018f6b7a-0001-7000-8000-000000000002" ? "PROJECT_MANAGER" : "TEAM_MEMBER";
          target.roleName = inp.roleId === "018f6b7a-0001-7000-8000-000000000001" ? "Administrador" : inp.roleId === "018f6b7a-0001-7000-8000-000000000002" ? "Project manager" : "Team member";
        }
        if (inp.avatarUrl) target.avatarUrl = inp.avatarUrl;
      }
      return NextResponse.json({
        data: {
          editUser: target,
        },
      });
    }

    if (query.includes("listUsers") || query.includes("getUsers")) {
      return NextResponse.json({
        data: {
          listUsers: MOCK_USERS_LIST,
          getUsers: MOCK_USERS_LIST,
        },
      });
    }

    if (query.includes("getUser(")) {
      const u = MOCK_USERS_LIST.find((x) => query.includes(x.id)) || MOCK_ADMIN_USER;
      return NextResponse.json({
        data: {
          getUser: u,
        },
      });
    }

    // 4. Notifications
    if (query.includes("getUnreadNotificationsCount") || query.includes("unread")) {
      const count = MOCK_NOTIFICATIONS.filter((n) => !n.read).length;
      return NextResponse.json({
        data: {
          getUnreadNotificationsCount: count,
        },
      });
    }

    if (
      query.includes("getallnotifications") ||
      query.includes("getNotificationsByCategory") ||
      query.includes("getNotifications")
    ) {
      const page = body.variables?.page || 1;
      const size = body.variables?.size || 10;
      const start = (page - 1) * size;
      const paged = MOCK_NOTIFICATIONS.slice(start, start + size);
      return NextResponse.json({
        data: {
          getallnotifications: {
            page,
            size,
            total: MOCK_NOTIFICATIONS.length,
            items: paged,
          },
          getNotificationsByCategory: {
            page,
            size,
            total: MOCK_NOTIFICATIONS.length,
            items: paged,
          },
        },
      });
    }

    if (query.includes("markAllAsRead") || query.includes("markAllRead")) {
      MOCK_NOTIFICATIONS.forEach((n) => {
        n.read = true;
      });
      return NextResponse.json({
        data: {
          markAllAsRead: true,
        },
      });
    }

    if (query.includes("markAsRead")) {
      const nid = body.variables?.notificationId || body.variables?.id;
      const item = MOCK_NOTIFICATIONS.find((n) => n.id === nid);
      if (item) item.read = true;
      return NextResponse.json({
        data: {
          markAsRead: true,
        },
      });
    }

    if (query.includes("deleteNotification")) {
      const nid = body.variables?.notificationId || body.variables?.id;
      const idx = MOCK_NOTIFICATIONS.findIndex((n) => n.id === nid);
      if (idx !== -1) MOCK_NOTIFICATIONS.splice(idx, 1);
      return NextResponse.json({
        data: {
          deleteNotification: true,
        },
      });
    }

    // 5. Today Attendance
    if (query.includes("getTodayAttendance")) {
      return NextResponse.json({
        data: {
          getTodayAttendance: {
            checkIn: null,
            checkOut: null,
          },
        },
      });
    }

    // 6. Attendances
    if (query.includes("listAttendance") || query.includes("listTeamAttendance")) {
      return NextResponse.json({
        data: {
          listAttendance: {
            items: MOCK_ATTENDANCES_LIST,
            page: 1,
            size: 20,
            total: MOCK_ATTENDANCES_LIST.length,
          },
          listTeamAttendance: {
            items: MOCK_ATTENDANCES_LIST,
            page: 1,
            size: 20,
            total: MOCK_ATTENDANCES_LIST.length,
          },
        },
      });
    }

    // 7. Global Collections
    if (query.includes("getGlobalCollections") || query.includes("listCollections")) {
      return NextResponse.json({
        data: {
          getGlobalCollections: MOCK_COLLECTIONS,
          listCollections: MOCK_COLLECTIONS,
        },
      });
    }

    if (query.includes("createCollection")) {
      const input = body.variables?.input || {};
      const newCol = {
        id: `col-${Date.now()}`,
        name: input.name || "Nueva Colección",
        scope: "GLOBAL",
        createdAt: new Date().toISOString(),
        items: Array.isArray(input.items)
          ? input.items.map((it: any, idx: number) => ({
              id: `ci-${Date.now()}-${idx}`,
              collectionId: `col-${Date.now()}`,
              date: it.date,
              name: it.name || "Feriado",
            }))
          : [],
      };
      MOCK_COLLECTIONS.unshift(newCol);
      return NextResponse.json({
        data: {
          createCollection: newCol,
        },
      });
    }

    if (query.includes("deleteCollection")) {
      const id = body.variables?.id;
      const idx = MOCK_COLLECTIONS.findIndex((c) => c.id === id);
      if (idx !== -1) MOCK_COLLECTIONS.splice(idx, 1);
      return NextResponse.json({
        data: {
          deleteCollection: true,
        },
      });
    }

    if (query.includes("getAdminSetting")) {
      return NextResponse.json({
        data: {
          getAdminSetting: "col-1",
        },
      });
    }

    if (query.includes("updateAdminSetting")) {
      return NextResponse.json({
        data: {
          updateAdminSetting: true,
        },
      });
    }

    return NextResponse.json({
      data: {
        success: true,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { errors: [{ message: err.message || "Error in Mock GraphQL Route" }] },
      { status: 500 }
    );
  }
}
