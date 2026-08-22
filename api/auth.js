export default async function handler(req, res) {
  return res.status(200).json({ status: "ok", service: "Salud-Conecta IA Auth Service" });
}
