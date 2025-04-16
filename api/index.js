export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  console.log("✅ Webhook desplegado correctamente y ejecutándose.");
  return res.status(200).json({ message: "Webhook activo y funcionando" });
}
 
