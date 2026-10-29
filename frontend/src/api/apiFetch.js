
const API_BASE_URL = (
  import.meta.env.VITE_API_URL || ""
).replace(/\/+$/, "");

export async function apiFetch(path, options = {}) {
  const normalizedPath = path.startsWith("/")
    ? path
    : `/${path}`;

  const apiPath =
    normalizedPath === "/api" ||
    normalizedPath.startsWith("/api/")
      ? normalizedPath
      : `/api${normalizedPath}`;

  return fetch(`${API_BASE_URL}${apiPath}`, {
    ...options,
    credentials: "include",
  });
}
