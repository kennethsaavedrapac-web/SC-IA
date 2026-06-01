module.exports = function handler(req, res) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  res.setHeader("Content-Type", "application/json");
  
  return res.status(200).json({
    status: "ok",
    apiKeyConfigured: !!apiKey,
    apiKeyLength: apiKey?.length || 0,
    apiKeyPreview: apiKey ? apiKey.substring(0, 8) + "..." : "NOT SET",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "unknown"
  });
};
