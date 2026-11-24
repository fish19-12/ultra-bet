const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("ultraBetToken");
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers = {
    ...(options.headers || {}),
  };
  if (!isFormData && options.body) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  let payload;
  try {
    payload = await response.json();
  } catch {
    payload = { success: false, message: "The server returned an invalid response" };
  }

  if (!response.ok) {
    const error = new Error(payload.message || "Request failed");
    error.status = response.status;
    throw error;
  }
  return payload;
}
