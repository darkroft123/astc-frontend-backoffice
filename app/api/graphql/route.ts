import { NextResponse } from "next/server";
import {
  MOCK_ADMIN_USER,
  MOCK_PROJECTS,
  MOCK_USERS_LIST,
  MOCK_ATTENDANCES_LIST,
  MOCK_DASHBOARD_BACKOFFICE,
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
      return NextResponse.json({
        data: {
          getUnreadNotificationsCount: 2,
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
