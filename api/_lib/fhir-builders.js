/**
 * FHIR R4 Resource Builders
 * 
 * Pure functions that transform form data into valid FHIR R4 resources.
 * 
 * Mapping:
 *   Cédula          → Patient.identifier
 *   Nombre/Ciudad   → Patient.name / Patient.address
 *   Emergencia tel  → Patient.contact
 *   Enfermedades    → Condition (one per disease)
 *   Alergias        → AllergyIntolerance (one per allergy)
 *   Tipo sangre     → Observation (LOINC 882-1)
 *   Peso            → Observation (LOINC 29463-7)
 *   Altura          → Observation (LOINC 8302-2)
 *   Pastillas       → MedicationStatement (one per medication)
 *   Tratamientos    → CarePlan
 *   Vacunas         → Immunization (one per vaccine)
 */

const SOURCE_SYSTEM = "salud-conecta-ia";
const NICARAGUA_OID = "urn:oid:2.16.558.1";

/**
 * Build common meta for all resources
 */
function buildMeta() {
  return {
    lastUpdated: new Date().toISOString(),
    source: SOURCE_SYSTEM,
  };
}

/**
 * Build a Patient resource
 */
export function buildPatient({ cedula, nombre, ciudad, pais, contactoEmergencia, email }) {
  const patient = {
    resourceType: "Patient",
    meta: buildMeta(),
    identifier: [],
    active: true,
  };

  // Cédula as primary identifier
  if (cedula) {
    patient.identifier.push({
      use: "official",
      system: NICARAGUA_OID,
      value: cedula,
    });
  }

  // Name
  if (nombre) {
    const parts = nombre.trim().split(/\s+/);
    patient.name = [{
      use: "official",
      text: nombre,
      family: parts.length > 1 ? parts.slice(1).join(" ") : parts[0],
      given: parts.length > 1 ? [parts[0]] : [],
    }];
  }

  // Address
  if (ciudad || pais) {
    patient.address = [{
      use: "home",
      city: ciudad || undefined,
      country: pais || undefined,
    }];
  }

  // Telecom — email
  if (email) {
    patient.telecom = patient.telecom || [];
    patient.telecom.push({
      system: "email",
      value: email,
      use: "home",
    });
  }

  return patient;
}

/**
 * Build Condition resources (diseases)
 * @param {string} enfermedades - Comma-separated list of diseases
 * @param {string} patientReference - e.g. "Patient/abc123"
 * @returns {Array} Array of Condition resources
 */
export function buildConditions(enfermedades, patientReference) {
  if (!enfermedades || !enfermedades.trim()) return [];

  return enfermedades.split(",").map((disease) => {
    const trimmed = disease.trim();
    if (!trimmed) return null;

    return {
      resourceType: "Condition",
      meta: buildMeta(),
      clinicalStatus: {
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
          code: "active",
          display: "Active",
        }],
      },
      verificationStatus: {
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/condition-ver-status",
          code: "confirmed",
          display: "Confirmed",
        }],
      },
      category: [{
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/condition-category",
          code: "problem-list-item",
          display: "Problem List Item",
        }],
      }],
      code: {
        text: trimmed,
      },
      subject: {
        reference: patientReference,
      },
      recordedDate: new Date().toISOString().split("T")[0],
    };
  }).filter(Boolean);
}

/**
 * Build AllergyIntolerance resources
 * @param {string} alergias - Comma-separated list of allergies
 * @param {string} patientReference
 * @returns {Array}
 */
export function buildAllergyIntolerances(alergias, patientReference) {
  if (!alergias || !alergias.trim()) return [];

  return alergias.split(",").map((allergy) => {
    const trimmed = allergy.trim();
    if (!trimmed) return null;

    return {
      resourceType: "AllergyIntolerance",
      meta: buildMeta(),
      clinicalStatus: {
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical",
          code: "active",
          display: "Active",
        }],
      },
      verificationStatus: {
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/allergyintolerance-verification",
          code: "confirmed",
          display: "Confirmed",
        }],
      },
      type: "allergy",
      category: ["environment"],
      code: {
        text: trimmed,
      },
      patient: {
        reference: patientReference,
      },
      recordedDate: new Date().toISOString().split("T")[0],
    };
  }).filter(Boolean);
}

/**
 * Build Observation for blood type
 * LOINC 882-1: ABO and Rh group [Type] in Blood
 */
export function buildBloodTypeObservation(tipoSangre, patientReference) {
  if (!tipoSangre) return null;

  return {
    resourceType: "Observation",
    meta: buildMeta(),
    status: "final",
    category: [{
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/observation-category",
        code: "laboratory",
        display: "Laboratory",
      }],
    }],
    code: {
      coding: [{
        system: "http://loinc.org",
        code: "882-1",
        display: "ABO and Rh group [Type] in Blood",
      }],
      text: "Tipo de Sangre",
    },
    subject: {
      reference: patientReference,
    },
    effectiveDateTime: new Date().toISOString(),
    valueCodeableConcept: {
      text: tipoSangre,
    },
  };
}

/**
 * Build Observation for body weight
 * LOINC 29463-7: Body weight
 */
export function buildWeightObservation(pesoKg, patientReference) {
  if (!pesoKg && pesoKg !== 0) return null;

  const numericWeight = parseFloat(pesoKg);
  if (isNaN(numericWeight)) return null;

  return {
    resourceType: "Observation",
    meta: buildMeta(),
    status: "final",
    category: [{
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/observation-category",
        code: "vital-signs",
        display: "Vital Signs",
      }],
    }],
    code: {
      coding: [{
        system: "http://loinc.org",
        code: "29463-7",
        display: "Body weight",
      }],
      text: "Peso Corporal",
    },
    subject: {
      reference: patientReference,
    },
    effectiveDateTime: new Date().toISOString(),
    valueQuantity: {
      value: numericWeight,
      unit: "kg",
      system: "http://unitsofmeasure.org",
      code: "kg",
    },
  };
}

/**
 * Build Observation for body height
 * LOINC 8302-2: Body height
 */
export function buildHeightObservation(alturaCm, patientReference) {
  if (!alturaCm && alturaCm !== 0) return null;

  const numericHeight = parseFloat(alturaCm);
  if (isNaN(numericHeight)) return null;

  return {
    resourceType: "Observation",
    meta: buildMeta(),
    status: "final",
    category: [{
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/observation-category",
        code: "vital-signs",
        display: "Vital Signs",
      }],
    }],
    code: {
      coding: [{
        system: "http://loinc.org",
        code: "8302-2",
        display: "Body height",
      }],
      text: "Altura",
    },
    subject: {
      reference: patientReference,
    },
    effectiveDateTime: new Date().toISOString(),
    valueQuantity: {
      value: numericHeight,
      unit: "cm",
      system: "http://unitsofmeasure.org",
      code: "cm",
    },
  };
}

/**
 * Build MedicationStatement resources
 * @param {string} pastillas - Comma-separated list of medications
 * @param {string} patientReference
 * @returns {Array}
 */
export function buildMedicationStatements(pastillas, patientReference) {
  if (!pastillas || !pastillas.trim()) return [];

  return pastillas.split(",").map((med) => {
    const trimmed = med.trim();
    if (!trimmed) return null;

    return {
      resourceType: "MedicationStatement",
      meta: buildMeta(),
      status: "active",
      medicationCodeableConcept: {
        text: trimmed,
      },
      subject: {
        reference: patientReference,
      },
      effectiveDateTime: new Date().toISOString(),
    };
  }).filter(Boolean);
}

/**
 * Build CarePlan resource for treatments
 * @param {string} tratamientos - Comma-separated list of treatments
 * @param {string} patientReference
 * @returns {object|null}
 */
export function buildCarePlan(tratamientos, patientReference) {
  if (!tratamientos || !tratamientos.trim()) return null;

  const activities = tratamientos.split(",").map((t) => {
    const trimmed = t.trim();
    if (!trimmed) return null;

    return {
      detail: {
        status: "in-progress",
        description: trimmed,
      },
    };
  }).filter(Boolean);

  if (activities.length === 0) return null;

  return {
    resourceType: "CarePlan",
    meta: buildMeta(),
    status: "active",
    intent: "plan",
    title: "Tratamientos actuales",
    description: `Tratamientos reportados por el paciente: ${tratamientos}`,
    subject: {
      reference: patientReference,
    },
    created: new Date().toISOString().split("T")[0],
    activity: activities,
  };
}

/**
 * Build Immunization resources
 * @param {string} vacunas - Comma-separated list of vaccines
 * @param {string} patientReference
 * @returns {Array}
 */
export function buildImmunizations(vacunas, patientReference) {
  if (!vacunas || !vacunas.trim()) return [];

  return vacunas.split(",").map((vaccine) => {
    const trimmed = vaccine.trim();
    if (!trimmed) return null;

    return {
      resourceType: "Immunization",
      meta: buildMeta(),
      status: "completed",
      vaccineCode: {
        text: trimmed,
      },
      patient: {
        reference: patientReference,
      },
      occurrenceString: "Fecha no especificada",
      primarySource: false,
    };
  }).filter(Boolean);
}

/**
 * Build RelatedPerson resource for emergency contact
 * @param {string} contactoEmergencia - Phone number of emergency contact
 * @param {string} patientReference
 * @returns {object|null}
 */
export function buildRelatedPerson(contactoEmergencia, patientReference) {
  if (!contactoEmergencia || !contactoEmergencia.trim()) return null;

  return {
    resourceType: "RelatedPerson",
    meta: buildMeta(),
    active: true,
    patient: {
      reference: patientReference,
    },
    relationship: [{
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/v2-0131",
        code: "C",
        display: "Emergency Contact",
      }],
    }],
    telecom: [{
      system: "phone",
      value: contactoEmergencia.trim(),
      use: "mobile",
    }],
  };
}

/**
 * Build a Transaction Bundle from all resources.
 * Uses conditional create (ifNoneExist) to avoid duplicating the Patient.
 * 
 * @param {object} patient - Patient resource
 * @param {Array} otherResources - Array of all other FHIR resources
 * @param {string|null} existingPatientId - If patient already exists, use PUT instead of POST
 * @returns {object} FHIR Bundle of type "transaction"
 */
export function buildTransactionBundle(patient, otherResources, existingPatientId = null, temporaryUuid = null) {
  const entries = [];

  // Patient entry — update if exists, create if new
  if (existingPatientId) {
    entries.push({
      fullUrl: `Patient/${existingPatientId}`,
      resource: { ...patient, id: existingPatientId },
      request: {
        method: "PUT",
        url: `Patient/${existingPatientId}`,
      },
    });
  } else {
    // Use identifier-based conditional create to prevent duplicates
    const cedula = patient.identifier?.find((i) => i.system === NICARAGUA_OID)?.value;
    entries.push({
      fullUrl: temporaryUuid, // Allow intra-bundle referencing for the new patient
      resource: patient,
      request: {
        method: "POST",
        url: "Patient",
        ifNoneExist: cedula ? `identifier=${NICARAGUA_OID}|${cedula}` : undefined,
      },
    });
  }

  // All other resources — POST (create new each time; old ones will be cleaned)
  for (const resource of otherResources) {
    if (!resource || !resource.resourceType) continue;

    entries.push({
      resource,
      request: {
        method: "POST",
        url: resource.resourceType,
      },
    });
  }

  return {
    resourceType: "Bundle",
    type: "transaction",
    entry: entries,
  };
}
