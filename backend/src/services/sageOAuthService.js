
const SAGE_BASE_URL = "https://accounting.sageone.co.za";
const SAGE_API_VERSION = "2.0.0";

function getSageCredentials() {
  const apiKey = process.env.SAGE_SA_API_KEY;
  const username = process.env.SAGE_SA_USERNAME;
  const password = process.env.SAGE_SA_PASSWORD;

  if (!apiKey || !username || !password) {
    const error = new Error(
      "Sage South Africa credentials are not configured."
    );
    error.status = 503;
    throw error;
  }

  return { apiKey, username, password };
}

async function sageRequest(service, method) {
  const { apiKey, username, password } =
    getSageCredentials();

  // Allow only explicitly supported endpoints.
  if (service !== "Company" || method !== "Get") {
    throw new Error("Unsupported Sage API operation.");
  }

  const url = new URL(
    `/api/${SAGE_API_VERSION}/${service}/${method}`,
    SAGE_BASE_URL
  );

  url.searchParams.set("apikey", apiKey);

  const basicAuth = Buffer.from(
    `${username}:${password}`,
    "utf8"
  ).toString("base64");

  let response;

  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(15000),
      redirect: "error",
    });
  } catch {
    const error = new Error(
      "Unable to reach Sage Accounting South Africa."
    );
    error.status = 502;
    throw error;
  }

  if (!response.ok) {
    const error = new Error(
      response.status === 401
        ? "Sage authentication failed."
        : response.status === 429
          ? "Sage request limit reached. Do not retry immediately."
          : `Sage request failed with HTTP ${response.status}.`
    );

    error.status =
      response.status === 429 ? 429 : 502;

    throw error;
  }

  try {
    return await response.json();
  } catch {
    const error = new Error(
      "Sage returned invalid JSON."
    );
    error.status = 502;
    throw error;
  }
}

async function getSageCompanies() {
  const data = await sageRequest("Company", "Get");

  const companies = Array.isArray(data)
    ? data
    : Array.isArray(data?.Results)
      ? data.Results
      : Array.isArray(data?.results)
        ? data.results
        : null;

  if (!companies) {
    const error = new Error(
      "Unexpected Sage company response format."
    );
    error.status = 502;
    throw error;
  }

  return companies.map((company) => ({
    id: company.ID ?? company.Id ?? company.id,
    name:
      company.Name ??
      company.name ??
      "Unnamed company",
  }));
}

module.exports = {
  getSageCompanies,
};
