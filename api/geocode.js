export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  // Allow CORS just in case
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: "Missing lat or lng parameter" });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`;
    
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
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};
