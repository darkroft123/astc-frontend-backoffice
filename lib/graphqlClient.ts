import { getGraphQLUrl } from "@/lib/api-host";

export async function graphqlRequest(query: string, variables?: any) {
  const res = await fetch(getGraphQLUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${typeof window !== "undefined" ? localStorage.getItem("auth_token") || "" : ""}`,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  const json = await res.json();

  if (json.errors) {
    console.error("GRAPHQL FULL ERROR:", JSON.stringify(json.errors, null, 2));
    throw new Error(json.errors[0]?.message || "Error de GraphQL");
  }

  return json.data;
}