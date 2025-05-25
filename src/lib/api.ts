// src/lib/api.ts
export async function apiFetch(url: string, options: RequestInit = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      "Content-Type": options.body instanceof FormData ? "multipart/form-data" : "application/json",
    },
  });
  return res;
}