/**
 * POST /api/fhir — Save Medical Data to Google Cloud Healthcare API
 * 
 * Receives form data from the frontend and persists it as FHIR R4 resources
 * in Google Cloud Healthcare API using a Transaction Bundle.
 * 
 * Flow:
 *   1. Validate + sanitize input
 *   2. Authenticate with Google Cloud (JWT → access token)
 *   3. Search for existing Patient by cédula (upsert)
 *   4. Delete existing related resources (to avoid duplicates on re-save)
 *   5. Build FHIR Transaction Bundle with all resources
 *   6. Execute Bundle atomically
 *   7. Return created resource IDs
 * 
 * Security:
 *   - POST only
 *   - CORS headers
 *   - Input validation & sanitization
 *   - No credentials exposed to client
 *   - Structured error responses
 */

import { validateMedicalData, validateUserContext } from "./_lib/validators.js";
import {
  findPatientByIdentifier,
  executeBundle,
  searchResource,
  deleteResource,
} from "./_lib/fhir-client.js";
import {
  buildPatient,
  buildConditions,
  buildAllergyIntolerances,
  buildBloodTypeObservation,
  buildWeightObservation,
  buildHeightObservation,
  buildMedicationStatements,
  buildCarePlan,
  buildImmunizations,
  buildRelatedPerson,
  buildTransactionBundle,
} from "./_lib/fhir-builders.js";
import crypto from "crypto";
import { z } from "zod";
import { verifyJwt, checkBOLA, supabaseAdmin, logEvent, requireAuth, requireOwnershipOrDoctor } from "./_lib/security.js";

const fhirPostSchema = z.object({
  medicalData: z.object({
    enfermedades: z.string().max(500).optional().default(""),
    alergias: z.string().max(500).optional().default(""),
    tipoSangre: z.string().max(5).optional().default(""),
    tratamientos: z.string().max(500).optional().default(""),
    pastillas: z.string().max(500).optional().default(""),
    vacunas: z.string().max(500).optional().default(""),
    peso: z.string().max(10).optional().default(""),
    altura: z.string().max(10).optional().default(""),
    cedula: z.string().min(3, "La cédula debe tener al menos 3 caracteres").max(30),
    contactoEmergencia: z.string().max(30).optional().default("")
  }),
  userContext: z.object({
    userId: z.string().max(100),
    nombre: z.string().max(200).optional().default(""),
    email: z.string().max(200).optional().default(""),
    ciudad: z.string().max(100).optional().default(""),
    pais: z.string().max(100).optional().default("")
  })
});

export default requireAuth(requireOwnershipOrDoctor()(async function handler(req, res) {
  // ─── CORS ────────────────────────────────────────────────────────
  const allowedOrigin = process.env.FRONTEND_URL || "*";
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido. Use POST." });
  }

  const requestId = `fhir-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  console.log(`[${requestId}] POST /api/fhir — Inicio`);

  try {
    const user = req.user;

    // ─── Validate input with Zod whitelisting ──────────────────────
    const zodResult = fhirPostSchema.safeParse(req.body);
    if (!zodResult.success) {
      logEvent("warn", "FHIR_SAVE_VALIDATION_FAILED", { userId: user.id, errors: zodResult.error.errors });
      return res.status(400).json({
        error: "Datos médicos o contexto inválidos.",
        details: zodResult.error.errors.map(e => `${e.path.join(".")}: ${e.message}`)
      });
    }

    const { medicalData, userContext } = zodResult.data;

    const data = medicalData;
    const ctx = {
      ...userContext,
      userId: user.id // Force the user ID to be the authenticated user's ID
    };

    console.log(`[${requestId}] Validated data for user: ${ctx.userId || "unknown"}, cédula: ${data.cedula || "none"}`);

    // ─── Find or prepare Patient ─────────────────────────────────
    let existingPatient = null;
    let existingPatientId = null;

    if (data.cedula) {
      try {
        existingPatient = await findPatientByIdentifier(data.cedula);
        if (existingPatient) {
          existingPatientId = existingPatient.id;
          console.log(`[${requestId}] Found existing Patient: ${existingPatientId}`);
        }
      } catch (searchErr) {
        console.warn(`[${requestId}] Patient search failed (will create new):`, searchErr.message);
      }
    }

    // ─── Delete old resources if patient exists (clean re-save) ──
    if (existingPatientId) {
      console.log(`[${requestId}] Cleaning old resources for Patient/${existingPatientId}...`);
      const resourceTypes = [
        "Condition",
        "AllergyIntolerance",
        "Observation",
        "MedicationStatement",
        "CarePlan",
        "Immunization",
        "RelatedPerson",
      ];

      for (const resourceType of resourceTypes) {
        try {
          const bundle = await searchResource(resourceType, {
            patient: `Patient/${existingPatientId}`,
            _count: "100",
          });

          if (bundle.entry && bundle.entry.length > 0) {
            // Only delete resources created by our system
            for (const entry of bundle.entry) {
              if (entry.resource?.meta?.source === "salud-conecta-ia") {
                try {
                  await deleteResource(resourceType, entry.resource.id);
                  console.log(`[${requestId}] Deleted ${resourceType}/${entry.resource.id}`);
                } catch (delErr) {
                  console.warn(`[${requestId}] Failed to delete ${resourceType}/${entry.resource.id}:`, delErr.message);
                }
              }
            }
          }
        } catch (err) {
          console.warn(`[${requestId}] Failed to clean ${resourceType}:`, err.message);
        }
      }
    }

    // ─── Build Patient resource ──────────────────────────────────
    const patient = buildPatient({
      cedula: data.cedula,
      nombre: ctx.nombre,
      ciudad: ctx.ciudad,
      pais: ctx.pais,
      contactoEmergencia: data.contactoEmergencia,
      email: ctx.email,
    });

    // ─── Build patient reference ─────────────────────────────────
    // For new patients, we use a temporary UUID reference within the bundle.
    // For existing patients, use their actual ID.
    const temporaryUuid = `urn:uuid:${crypto.randomUUID()}`;
    const patientRef = existingPatientId
      ? `Patient/${existingPatientId}`
      : temporaryUuid;

    // ─── Build all FHIR resources ────────────────────────────────
    const allResources = [];

    // Conditions (diseases)
    allResources.push(...buildConditions(data.enfermedades, patientRef));

    // Allergy Intolerances
    allResources.push(...buildAllergyIntolerances(data.alergias, patientRef));

    // Observations (blood type, weight, height)
    const bloodObs = buildBloodTypeObservation(data.tipoSangre, patientRef);
    if (bloodObs) allResources.push(bloodObs);

    const weightObs = buildWeightObservation(data.peso, patientRef);
    if (weightObs) allResources.push(weightObs);

    const heightObs = buildHeightObservation(data.altura, patientRef);
    if (heightObs) allResources.push(heightObs);

    // Medication Statements
    allResources.push(...buildMedicationStatements(data.pastillas, patientRef));

    // CarePlan (treatments)
    const carePlan = buildCarePlan(data.tratamientos, patientRef);
    if (carePlan) allResources.push(carePlan);

    // Immunizations (vaccines)
    allResources.push(...buildImmunizations(data.vacunas, patientRef));

    // Emergency Contact
    const relatedPerson = buildRelatedPerson(data.contactoEmergencia, patientRef);
    if (relatedPerson) allResources.push(relatedPerson);

    console.log(`[${requestId}] Built ${allResources.length} resources + 1 Patient`);

    // ─── Build and execute Transaction Bundle ────────────────────
    const bundle = buildTransactionBundle(patient, allResources, existingPatientId, temporaryUuid);

    console.log(`[${requestId}] Executing FHIR Transaction Bundle with ${bundle.entry.length} entries...`);

    const bundleResponse = await executeBundle(bundle);

    // ─── Parse response ──────────────────────────────────────────
    const createdResources = [];
    if (bundleResponse.entry) {
      for (const entry of bundleResponse.entry) {
        const location = entry.response?.location || "";
        const status = entry.response?.status || "";
        createdResources.push({ location, status });
      }
    }

    console.log(`[${requestId}] ✅ Transaction completed. ${createdResources.length} resources processed.`);

    return res.status(200).json({
      success: true,
      message: "Datos médicos guardados exitosamente en FHIR.",
      patientId: existingPatientId || createdResources[0]?.location?.split("/")[1] || null,
      resourceCount: createdResources.length,
      resources: createdResources,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error(`[${requestId}] ❌ Error:`, error);

    // Determine appropriate error response
    const status = error.status || 500;
    const isConfigError = error.message?.includes("not configured");
    const isAuthError = error.message?.includes("token") || error.message?.includes("credential") || status === 401 || status === 403;

    let userMessage = "Error al guardar los datos médicos. Intente nuevamente.";
    if (isConfigError) {
      userMessage = "El servicio de datos médicos no está configurado correctamente. Contacte al administrador.";
    } else if (isAuthError) {
      userMessage = "Error de autenticación con el servicio de salud. Contacte al administrador.";
    }

    return res.status(status >= 400 && status < 600 ? status : 500).json({
      success: false,
      error: userMessage,
      timestamp: new Date().toISOString(),
    });
  }
}));
