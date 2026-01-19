// Always use relative /api so that:
// - In dev: Vite proxy rewrites /api -> backend /v1
// - In prod: Nginx proxies /api -> backend /v1
const API_BASE = "/api";

export function getStoredTokens() {
  return {
    accessToken: localStorage.getItem("accessToken") || undefined,
    refreshToken: localStorage.getItem("refreshToken") || undefined,
  };
}

export function storeTokens(accessToken, refreshToken) {
  if (accessToken) localStorage.setItem("accessToken", accessToken);
  if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
}

export function clearTokens() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}

async function refreshAccessToken() {
  const { refreshToken } = getStoredTokens();
  if (!refreshToken) throw new Error("No refresh token");
  const res = await fetch(`${API_BASE}/users/refresh_token`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to refresh token");
  const json = await res.json();
  const payload =
    typeof json === "object" && json && "data" in json ? json.data : json;
  if (payload?.accessToken) storeTokens(payload.accessToken, refreshToken);
  return payload.accessToken;
}

export async function forgotPassword(email) {
  return apiClient("/users/password-recovery", {
    method: "POST",
    body: { email },
  });
}

export async function apiClient(
  path,
  { method = "GET", body, headers = {}, retry = true, unwrap = true } = {}
) {
  const url = path.startsWith("http")
    ? path
    : `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
  const { accessToken } = getStoredTokens();
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  if (res.status === 401 && retry) {
    try {
      const newToken = await refreshAccessToken();
      return apiClient(path, { method, body, headers, retry: false });
    } catch (_) {
      clearTokens();
    }
  }

  if (!res.ok) {
    let errText = "Request failed";
    try {
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const errJson = await res.json();
        errText = errJson?.message || errJson?.error || errText;
      } else {
        const errRaw = await res.text();
        if (errRaw) errText = errRaw;
      }
    } catch (_) {}
    throw new Error(errText);
  }
  if (res.status === 204) return null;
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const txt = await res.text();
    return txt || null;
  }
  const raw = await res.text();
  if (!raw) return null;
  let json;
  try {
    json = JSON.parse(raw);
  } catch (_) {
    return null;
  }
  // Unwrap { success, message, data } format from server middleware if present
  if (
    unwrap &&
    typeof json === "object" &&
    json &&
    Object.prototype.hasOwnProperty.call(json, "data")
  ) {
    return json.data;
  }
  return json;
}

export async function listIntersections() {
  const envelope = await apiClient("/intersections", {
    method: "GET",
    unwrap: false,
  });
  const intersections = Array.isArray(envelope?.data)
    ? envelope.data
    : Array.isArray(envelope)
    ? envelope
    : [];
  const meta = {
    success: envelope?.success,
    message: envelope?.message,
    timestamp: envelope?.timestamp,
    total: intersections.length,
  };
  return { intersections, meta };
}

// Admin register API
export async function registerUser({ fullName, email, role = "user" }) {
  return apiClient("/admin/users/register", {
    method: "POST",
    body: { fullName, email, role },
  });
}

// Request password recovery (send reset link via email)
export async function requestPasswordRecovery(email) {
  return apiClient("/users/password-recovery", {
    method: "POST",
    body: { email },
  });
}

// Admin list all users
export async function listUsers() {
  const envelope = await apiClient("/admin/users", {
    method: "GET",
    unwrap: false,
  });
  const users = Array.isArray(envelope?.data)
    ? envelope.data
    : Array.isArray(envelope)
    ? envelope
    : [];
  const meta = {
    success: envelope?.success,
    message: envelope?.message,
    timestamp: envelope?.timestamp,
    total: users.length,
  };
  return { users, meta };
}

// Admin delete user by id
export async function deleteUser(userId) {
  return apiClient(`/admin/users/${userId}`, { method: "DELETE" });
}

// Intersections (Traffic Lights / Signals)
export async function createIntersection(data) {
  return apiClient("/intersections", {
    method: "POST",
    body: data,
  });
}

export async function getIntersectionById(id) {
  return apiClient(`/intersections/${id}`, { method: "GET" });
}

export async function updateIntersection(id, data) {
  return apiClient(`/intersections/${id}`, {
    method: "PATCH",
    body: data,
  });
}

export async function deleteIntersection(id) {
  return apiClient(`/intersections/${id}`, { method: "DELETE" });
}
export function triggerFirmwareUpdate(payload) {
  return apiClient("/firmware/trigger-update", {
    method: "POST",
    body: payload,
  });
}

export function getFirmwares() {
  return apiClient("/firmware");
}
