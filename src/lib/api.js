// Talks to FullBackendd's /api/v1/codm routes. The token lives in
// localStorage (Bearer header only, never a cookie), like the other apps.
const BASE = (import.meta.env.VITE_API_URL || "http://localhost:7004").replace(/\/$/, "");
const KEY = "codm_token";

export const tokenStore = {
  get: () => {
    try { return localStorage.getItem(KEY); } catch { return null; }
  },
  set: (t) => {
    try { t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY); } catch { /* private mode */ }
  },
};

// A random id for this browser session (sessionStorage: a new tab or browser
// starts a new one). The backend's wrong-password lockout is per session.
const sessionId = (() => {
  try {
    let id = sessionStorage.getItem("codm_session");
    if (!id) {
      const bytes = crypto.getRandomValues(new Uint8Array(16));
      id = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
      sessionStorage.setItem("codm_session", id);
    }
    return id;
  } catch {
    return null;
  }
})();

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function api(path, { method = "GET", body, auth = true, signal } = {}) {
  const headers = { Accept: "application/json" };
  if (sessionId) headers["X-Codm-Session"] = sessionId;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = auth ? tokenStore.get() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE}/api/v1/codm${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (err.name === "AbortError") throw err;
    throw new ApiError("Can't reach the server. Check your data or Wi-Fi and try again.", 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) {
      tokenStore.set(null);
      window.dispatchEvent(new Event("codm:logout"));
    }
    throw new ApiError(data.msg || "Something went wrong. Please try again.", res.status);
  }
  return data;
}

export async function downloadCsv() {
  const res = await fetch(`${BASE}/api/v1/codm/admin/export.csv`, {
    headers: { Authorization: `Bearer ${tokenStore.get()}` },
  });
  if (!res.ok) throw new ApiError("Could not download the sheet.", res.status);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "codm-registrations.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export const cedis = (n) => `GH₵${Number(n).toLocaleString("en-GH")}`;

export const formatDate = (iso, opts) =>
  new Date(iso).toLocaleString("en-GB", { timeZone: "Africa/Accra", ...opts });
