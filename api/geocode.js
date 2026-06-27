export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  const allowedOrigin = process.env.FRONTEND_URL || "*"; 
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { lat, lng } = req.query;

  // Validate coordinates are valid numbers within acceptable ranges
  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);

  if (!lat || !lng || isNaN(latNum) || isNaN(lngNum)) {
    return res.status(400).json({ error: "lat and lng must be valid numeric coordinates" });
  }

  if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
    return res.status(400).json({ error: "lat must be between -90 and 90, lng between -180 and 180" });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(latNum)}&lon=${encodeURIComponent(lngNum)}`;
    
    const response = await fetch(url, {
      headers: {
        "User-Agent": "SaludConectaIA/1.0 (contact@saludconecta.app)"
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `Nominatim API responded with status ${response.status}` 
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error("Geocoding proxy error:", error);
    return res.status(500).json({ error: "Error al obtener datos de geolocalización. Intente nuevamente." });
  }
};
