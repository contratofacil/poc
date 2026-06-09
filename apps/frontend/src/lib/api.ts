function resolveBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl.length > 0) return envUrl;

  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:3001";
  }

  throw new Error(
    "NEXT_PUBLIC_API_URL is not configured. Set it at build time so the frontend can reach the API."
  );
}

export function getApiUrl(path: string): string {
  return resolveBaseUrl() + path;
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  return fetch(getApiUrl(path), {
    ...options,
    headers,
  });
}
