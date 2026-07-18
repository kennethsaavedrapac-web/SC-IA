/**
 * FHIR Client for Google Cloud Healthcare API
 * 
 * HTTP wrapper that handles:
 *   - URL construction for the FHIR Store
 *   - Authentication header injection
 *   - CRUD operations on FHIR resources
 *   - Transaction Bundles
 *   - Structured error handling and logging
 */

import { getAccessToken, invalidateToken } from "./gcp-auth.js";

// ─── Configuration ───────────────────────────────────────────────────

function getFhirBaseUrl() {
  const project = process.env.GCP_PROJECT_ID;
  const location = process.env.GCP_HEALTHCARE_LOCATION || "us-central1";
  const dataset = process.env.GCP_HEALTHCARE_DATASET;
  const fhirStore = process.env.GCP_HEALTHCARE_FHIR_STORE;

  if (!project || !dataset || !fhirStore) {
    throw new Error(
      "FHIR Store not configured. Set GCP_PROJECT_ID, GCP_HEALTHCARE_DATASET, GCP_HEALTHCARE_FHIR_STORE."
    );
  }

  return `https://healthcare.googleapis.com/v1/projects/${project}/locations/${location}/datasets/${dataset}/fhirStores/${fhirStore}/fhir`;
}

// ─── HTTP Helper ─────────────────────────────────────────────────────

/**
 * Make an authenticated request to the FHIR Store.
 * Retries once on 401 (token may have expired).
 */
async function fhirFetch(path, options = {}, retried = false) {
  const baseUrl = getFhirBaseUrl();
  const url = path.startsWith("http") ? path : `${baseUrl}${path}`;

  const token = await getAccessToken();

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/fhir+json; charset=utf-8",
    Accept: "application/fhir+json",
    ...options.headers,
  };

  const startTime = Date.now();

  console.log(`[FHIR Client] ${options.method || "GET"} ${url}`);

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const elapsed = Date.now() - startTime;

  // Retry once on 401 (expired token)
  if (response.status === 401 && !retried) {
    console.warn("[FHIR Client] 401 Unauthorized — refreshing token and retrying...");
    invalidateToken();
    return fhirFetch(path, options, true);
  }

  let responseBody;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("json") || contentType.includes("fhir")) {
    responseBody = await response.json();
  } else {
    responseBody = await response.text();
  }

  console.log(`[FHIR Client] ${response.status} (${elapsed}ms)`);

  if (!response.ok) {
    const errorMsg = typeof responseBody === "object"
      ? JSON.stringify(responseBody, null, 2)
      : responseBody;
    console.error(`[FHIR Client] Error response:`, errorMsg);
    const error = new Error(`FHIR API error (${response.status})`);
    error.status = response.status;
    error.body = responseBody;
    throw error;
  }

  return responseBody;
}

// ─── Public API ──────────────────────────────────────────────────────

/**
 * Create a single FHIR resource
 * @param {string} resourceType - e.g. "Patient", "Condition"
 * @param {object} resource - FHIR resource body
 * @returns {Promise<object>} Created resource with server-assigned ID
 */
export async function createResource(resourceType, resource) {
  return fhirFetch(`/${resourceType}`, {
    method: "POST",
    body: JSON.stringify(resource),
  });
}

/**
 * Update a FHIR resource by ID
 * @param {string} resourceType - e.g. "Patient"
 * @param {string} id - Resource ID
 * @param {object} resource - Updated FHIR resource body
 * @returns {Promise<object>} Updated resource
 */
export async function updateResource(resourceType, id, resource) {
  return fhirFetch(`/${resourceType}/${id}`, {
    method: "PUT",
    body: JSON.stringify({ ...resource, id }),
  });
}

/**
 * Search for FHIR resources
 * @param {string} resourceType - e.g. "Patient"
 * @param {object} params - Search parameters as key-value pairs
 * @returns {Promise<object>} FHIR Bundle with search results
 */
export async function searchResource(resourceType, params = {}) {
  const query = new URLSearchParams(params).toString();
  const path = query ? `/${resourceType}?${query}` : `/${resourceType}`;
  return fhirFetch(path, { method: "GET" });
}

/**
 * Get a single resource by ID
 * @param {string} resourceType
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function getResource(resourceType, id) {
  return fhirFetch(`/${resourceType}/${id}`, { method: "GET" });
}

/**
 * Delete a FHIR resource by ID
 * @param {string} resourceType
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function deleteResource(resourceType, id) {
  return fhirFetch(`/${resourceType}/${id}`, { method: "DELETE" });
}

/**
 * Execute a FHIR Transaction Bundle.
 * All entries in the bundle are processed atomically.
 * 
 * @param {object} bundle - FHIR Bundle of type "transaction"
 * @returns {Promise<object>} Bundle response with results for each entry
 */
export async function executeBundle(bundle) {
  // Transaction bundles go to the FHIR store root (no resource type path)
  return fhirFetch("", {
    method: "POST",
    body: JSON.stringify(bundle),
  });
}

/**
 * Search for a Patient by identifier (e.g. cédula)
 * @param {string} identifier - The identifier value (e.g. "001-010190-0001A")
 * @param {string} system - The identifier system (default: Nicaragua OID)
 * @returns {Promise<object|null>} Patient resource or null if not found
 */
export async function findPatientByIdentifier(identifier, system = "urn:oid:2.16.558.1") {
  const bundle = await searchResource("Patient", {
    identifier: `${system}|${identifier}`,
  });

  if (bundle.entry && bundle.entry.length > 0) {
    return bundle.entry[0].resource;
  }
  return null;
}

/**
 * Get all resources related to a patient using compartment search
 * @param {string} patientId - The patient's FHIR resource ID
 * @param {string} resourceType - The type to search (e.g. "Condition")
 * @returns {Promise<Array>} Array of FHIR resources
 */
export async function getPatientResources(patientId, resourceType) {
  const bundle = await searchResource(resourceType, {
    patient: `Patient/${patientId}`,
  });

  if (bundle.entry && bundle.entry.length > 0) {
    return bundle.entry.map((e) => e.resource);
  }
  return [];
}
