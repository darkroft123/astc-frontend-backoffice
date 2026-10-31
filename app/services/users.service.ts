import { getGraphQLUrl } from "@/lib/api-host";
import { formatAvatarUrl, invalidateAvatarCache } from "@/lib/avatar-url";

const USERS_CACHE_TTL_MS = 60_000;
let usersCache: { token: string; ts: number; data: any[] } | null = null;
let usersInFlight: { token: string; promise: Promise<any[]> } | null = null;

export function invalidateUsersCache() {
  usersCache = null;
  usersInFlight = null;
}

function preloadUserAvatars(users: any[]) {
  if (typeof window === "undefined" || !Array.isArray(users)) return;
  for (const u of users) {
    const src = formatAvatarUrl(u?.avatarUrl);
    if (src) {
      const img = new window.Image();
      img.src = src;
    }
  }
}

/* ================= QUERY ================= */
export async function listUsers(token: string, forceRefresh = false) {
  if (!token) return [];
  const now = Date.now();
  if (!forceRefresh && usersCache && usersCache.token === token && now - usersCache.ts < USERS_CACHE_TTL_MS) {
    return usersCache.data;
  }
  if (!forceRefresh && usersInFlight && usersInFlight.token === token) {
    return usersInFlight.promise;
  }

  const promise = (async () => {
    try {
      const res = await fetch(getGraphQLUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: `
            query {
              listUsers {
                id
                username
                firstName
                lastName
                email
                phone
                roleId
                avatarUrl
                roleCode
                roleName
              }
            }
          `,
        }),
      });

      const text = await res.text();
      const json = text ? JSON.parse(text) : null;

      if (!res.ok || json?.errors) {
        throw new Error("Error al listar usuarios");
      }

      const list = json.data?.listUsers || [];
      preloadUserAvatars(list);
      usersCache = { token, ts: Date.now(), data: list };
      return list;
    } finally {
      if (usersInFlight?.promise === promise) {
        usersInFlight = null;
      }
    }
  })();

  usersInFlight = { token, promise };
  return promise;
}

/* ================= CREATE ================= */
export async function createUser(token: string, input: any) {
  const res = await fetch(getGraphQLUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: `
        mutation createuser($input: CreateUserInput!) {
          createUser(input: $input) {
            id
            username
            email
            roleId
            firstName
            lastName
            phone
            avatarUrl
            roleCode
            roleName
          }
        }
      `,
      variables: {
        input,
      },
    }),
  });

  const text = await res.text();
  const json = text ? JSON.parse(text) : null;

  if (!res.ok || json?.errors) {
    throw new Error(
      json?.errors?.[0]?.message || "Error al crear usuario"
    );
  }

  invalidateUsersCache();
  invalidateAvatarCache();
  return json.data.createUser;
}

/* ================= DELETE ================= */
export async function deleteUser(
  token: string,
  id: string
) {
  const res = await fetch(getGraphQLUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: `
        mutation deleteuser($id: String!) {
          deleteUser(id: $id)
        }
      `,
      variables: { id },
    }),
  });

  const text = await res.text();
  const json = text ? JSON.parse(text) : null;

  if (!res.ok || json?.errors) {
    throw new Error("Error al eliminar usuario");
  }

  invalidateUsersCache();
  return json.data.deleteUser;
}


/* ================= EDIT ================= */
export async function editUser(
  token: string,
  id: string,
  input: any
) {
  const res = await fetch(getGraphQLUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: `
        mutation edituser($id: String!, $input: EditUserInput!) {
          editUser(id: $id, input: $input) {
            id
            username
            email
            roleId
            firstName
            lastName
            phone
            avatarUrl
            roleCode
            roleName
          }
        }
      `,
      variables: {
        id,
        input,
      },
    }),
  });

  const text = await res.text();
  const json = text ? JSON.parse(text) : null;

  console.log("EDIT RESPONSE:", json);

  if (!res.ok || json?.errors) {
    throw new Error(
      json?.errors?.[0]?.message || "Error al editar usuario"
    );
  }

  invalidateUsersCache();
  invalidateAvatarCache();
  return json.data.editUser;
}

export async function getUser(
  token: string,
  id: string
) {
  const users = await listUsers(token);
  return users.find((u: any) => u.id === id) || null;
}
