import { execFileSync } from "node:child_process";

const propertyId = process.env.GA4_PROPERTY_ID;
const projectId = process.env.GOOGLE_CLOUD_PROJECT;
const accessToken = process.env.GA4_ACCESS_TOKEN ?? getGcloudAccessToken();

if (!propertyId || !/^\d+$/.test(propertyId)) {
  throw new Error("Defina GA4_PROPERTY_ID com o ID numérico da propriedade GA4 (não o ID do fluxo de dados).");
}
if (!accessToken) {
  throw new Error("Autenticação em falta. Defina GA4_ACCESS_TOKEN ou configure Application Default Credentials com gcloud.");
}

const request = {
  dateRanges: [{ startDate: "7daysAgo", endDate: "yesterday" }],
  dimensions: [{ name: "country" }],
  metrics: [{ name: "activeUsers" }],
  orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
  limit: 100,
};

const headers = {
  Authorization: `Bearer ${accessToken}`,
  "Content-Type": "application/json",
};
if (projectId) headers["x-goog-user-project"] = projectId;

const response = await fetch(
  `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
  { method: "POST", headers, body: JSON.stringify(request) },
);
const payload = await response.json().catch(() => ({}));

if (!response.ok) {
  const message = payload?.error?.message ?? `HTTP ${response.status}`;
  throw new Error(`GA4 Data API: ${message}`);
}

const rows = payload.rows ?? [];
console.log("HMATIAS · GA4 — Utilizadores ativos por país");
console.log("Período: últimos 7 dias completos (7daysAgo até yesterday)");
console.log(`Propriedade: ${propertyId}`);
console.log("");
console.log("País".padEnd(32) + "Utilizadores ativos");
console.log("-".repeat(52));
for (const row of rows) {
  const country = row.dimensionValues?.[0]?.value ?? "(not set)";
  const users = row.metricValues?.[0]?.value ?? "0";
  console.log(country.padEnd(32) + users);
}
console.log("-".repeat(52));
console.log(`Linhas: ${payload.rowCount ?? rows.length}`);
console.log("Fonte: Google Analytics Data API v1");

function getGcloudAccessToken() {
  try {
    return execFileSync("gcloud", ["auth", "application-default", "print-access-token"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}
