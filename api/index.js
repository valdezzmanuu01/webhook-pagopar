export default async function handler(req, res) {
  // Configuración CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Respuesta inmediata a OPTIONS
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Solo permitimos POST
  if (req.method !== "POST") {
    return res.status(405).send("Método no permitido");
  }

  // Log de prueba en consola y respuesta simple
  console.log("✅ Webhook de prueba recibido correctamente.");
  return res.status(200).json({ success: true, message: "Webhook activo y funcionando" });
}
