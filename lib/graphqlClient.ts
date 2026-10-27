import { getGraphQLUrl } from "@/lib/api-host";

export async function graphqlRequest(query: string, variables?: any) {
  const opMatch = query.match(/(query|mutation)\s+([A-Za-z0-9_]+)/);
  const opName = opMatch ? opMatch[2] : "GraphQL_Backoffice";
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") || "" : "";
  console.log(`📡 [FRONTEND-BACKOFFICE / graphqlClient] ${opName} -> URL: ${getGraphQLUrl()}`, { variables, hasToken: !!token });

  const res = await fetch(getGraphQLUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  const json = await res.json();

  if (!res.ok || json.errors) {
    console.error(`❌ [FRONTEND-BACKOFFICE / graphqlClient] ${opName} FAILED (HTTP ${res.status}):`, json.errors || json);
    throw new Error(json.errors?.[0]?.message || "Error de GraphQL");
  }

  console.log(`✅ [FRONTEND-BACKOFFICE / graphqlClient] ${opName} SUCCESS:`, json.data);
  return json.data;
}
