/**
 * GET /api/fhir-get — Read Medical Data from Google Cloud Healthcare API
 * 
 * Retrieves a patient's medical data from the FHIR Store by cédula,
 * then transforms FHIR resources back into the form format.
 * 
 * Query params:
 *   - cedula (required): Patient's identity document number
 * 
 * Returns: JSON with the same shape as the frontend form state
 */

import {
  findPatientByIdentifier,
  getPatientResources,
} from "./_lib/fhir-client.js";

/**
 * Extract text values from FHIR resources into a simple comma-separated string
 */
function extractTexts(resources, textPath) {
  return resources
    .map((r) => {
      // Navigate nested path like "code.text"
      const parts = textPath.split(".");
      let value = r;
      for (const part of parts) {
        value = value?.[part];
      }
      return value || "";
    })
    .filter(Boolean)
    .join(", ");
}

export default async function handler(req, res) {
  // ─── CORS ────────────────────────────────────────────────────────
  const allowedOrigin = process.env.FRONTEND_URL || "*";
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido. Use GET." });
  }

  const requestId = `fhir-get-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const { cedula } = req.query;

  if (!cedula || typeof cedula !== "string" || cedula.trim().length < 3) {
    return res.status(400).json({
      error: "Parámetro 'cedula' es requerido y debe tener al menos 3 caracteres.",
    });
  }

  const sanitizedCedula = cedula.replace(/<[^>]*>/g, "").trim().substring(0, 30);

  console.log(`[${requestId}] GET /api/fhir-get — cédula: ${sanitizedCedula}`);

  try {
    // ─── Find Patient ────────────────────────────────────────────
    const patient = await findPatientByIdentifier(sanitizedCedula);

    if (!patient) {
      console.log(`[${requestId}] No patient found for cédula: ${sanitizedCedula}`);
      return res.status(404).json({
        found: false,
        message: "No se encontraron datos médicos para esta cédula.",
      });
    }

    const patientId = patient.id;
    console.log(`[${requestId}] Found Patient/${patientId}. Fetching resources...`);

    // ─── Fetch all related resources in parallel ─────────────────
    const [conditions, allergies, observations, medications, carePlans, immunizations, relatedPersons] =
      await Promise.all([
        getPatientResources(patientId, "Condition").catch(() => []),
        getPatientResources(patientId, "AllergyIntolerance").catch(() => []),
        getPatientResources(patientId, "Observation").catch(() => []),
        getPatientResources(patientId, "MedicationStatement").catch(() => []),
        getPatientResources(patientId, "CarePlan").catch(() => []),
        getPatientResources(patientId, "Immunization").catch(() => []),
        getPatientResources(patientId, "RelatedPerson").catch(() => []),
      ]);

    // ─── Transform FHIR → form format ───────────────────────────

    // Enfermedades (Conditions)
    const enfermedades = extractTexts(conditions, "code.text");

    // Alergias
    const alergias = extractTexts(allergies, "code.text");

    // Tipo de sangre (Observation with LOINC 882-1)
    const bloodTypeObs = observations.find(
      (o) => o.code?.coding?.some((c) => c.code === "882-1")
    );
    const tipoSangre = bloodTypeObs?.valueCodeableConcept?.text || "";

    // Peso (Observation with LOINC 29463-7)
    const weightObs = observations.find(
      (o) => o.code?.coding?.some((c) => c.code === "29463-7")
    );
    const peso = weightObs?.valueQuantity?.value?.toString() || "";

    // Altura (Observation with LOINC 8302-2)
    const heightObs = observations.find(
      (o) => o.code?.coding?.some((c) => c.code === "8302-2")
    );
    const altura = heightObs?.valueQuantity?.value?.toString() || "";

    // Pastillas (MedicationStatements)
    const pastillas = extractTexts(medications, "medicationCodeableConcept.text");

    // Tratamientos (CarePlan activities)
    const tratamientos = carePlans
      .flatMap((cp) => cp.activity || [])
      .map((a) => a.detail?.description || "")
      .filter(Boolean)
      .join(", ");

    // Vacunas (Immunizations)
    const vacunas = extractTexts(immunizations, "vaccineCode.text");

    // Cédula — from Patient.identifier
    const cedulaValue =
      patient.identifier?.find((i) => i.system === "urn:oid:2.16.558.1")?.value || sanitizedCedula;

    // Contacto de emergencia (RelatedPerson)
    const contactoEmergencia =
      relatedPersons[0]?.telecom?.find((t) => t.system === "phone")?.value || 
      patient.contact?.[0]?.telecom?.[0]?.value || ""; // Fallback for old data

    const formData = {
      enfermedades,
      alergias,
      tipoSangre,
      tratamientos,
      pastillas,
      vacunas,
      peso,
      altura,
      cedula: cedulaValue,
      contactoEmergencia,
    };

    console.log(`[${requestId}] ✅ Data loaded. Conditions: ${conditions.length}, Allergies: ${allergies.length}, Observations: ${observations.length}, Medications: ${medications.length}, CarePlans: ${carePlans.length}, Immunizations: ${immunizations.length}`);

    return res.status(200).json({
      found: true,
      patientId,
      data: formData,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error(`[${requestId}] ❌ Error:`, error);

    const status = error.status || 500;
    return res.status(status >= 400 && status < 600 ? status : 500).json({
      found: false,
      error: "Error al recuperar los datos médicos.",
      timestamp: new Date().toISOString(),
    });
  }
}
