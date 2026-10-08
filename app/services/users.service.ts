import { getGraphQLUrl } from "@/lib/api-host";

/* ================= QUERY ================= */
export async function listUsers(token: string) {
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

  return json.data.listUsers;
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

  return json.data.editUser;
}
export async function getUser(
  token: string,
  id: string
) {
  const users = await listUsers(token);
  return users.find((u: any) => u.id === id) || null;
}


