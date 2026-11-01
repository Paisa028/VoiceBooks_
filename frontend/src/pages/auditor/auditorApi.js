
const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

async function request(endpoint, signal) {
  const response = await fetch(`${API_URL}/api/auditor/${endpoint}`, {
    method: "GET",
    credentials: "include",
    signal,
    headers: {
      Accept: "application/json",
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.success) {
    throw new Error(data.message || `Unable to load ${endpoint}.`);
  }

  return data.data;
}

export const auditorApi = {
  dashboard: (signal) => request("dashboard", signal),
  businesses: (signal) => request("businesses", signal),
  transactions: (signal) => request("transactions", signal),
  auditTrail: (signal) => request("audit-trail", signal),
};

export function formatAuditDate(value) {
  if (!value) return "—";

  const normalized =
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(value)
      ? `${value.replace(" ", "T")}Z`
      : value;

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatAuditMoney(value, currency = "ZAR") {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return "—";

  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatAuditStatus(status) {
  return {
    approved: "Approved",
    pending_review: "Pending Review",
    returned: "Returned",
  }[status] || status || "Unknown";
}
