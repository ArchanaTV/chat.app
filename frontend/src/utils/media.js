// The API returns file paths like "/uploads/avatars/xyz.png" which are relative
// to the BACKEND, not the frontend. In dev, Vite's proxy makes relative paths work.
// In production (frontend and backend on different domains), we need to prefix
// them with the backend's actual origin.
const API_BASE = import.meta.env.VITE_API_URL || "/api";
const BACKEND_ORIGIN = API_BASE.replace(/\/api\/?$/, "");

export function resolveMediaUrl(path) {
  if (!path) return path;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${BACKEND_ORIGIN}${path}`;
}
