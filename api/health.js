export default function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  
  return res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "unknown"
  });
};
