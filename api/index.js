export default async function handler(req, res) {
  // BLOQUE CORS
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.status(200).end();
    return;
  }
  res.setHeader("Access-Control-Allow-Origin", "*");

  console.log("🟡 [Webhook] Botón 'Simular Pago' fue presionado desde Bubble.");

  if (req.method !== "POST") {
    console.log("🔴 [Error] Método no permitido:", req.method);
    return res.status(405).json({ error: "Método no permitido" });
  }

  console.log("🟢 [Webhook] Petición recibida correctamente en Vercel.");

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch (e) {
    console.log("🔴 [Error] No se pudo parsear el body:", req.body);
    return res.status(200).json({ recibido: false });
  }

  const { external_reference, status } = body || {};

  if (!external_reference || !status) {
    console.log("🔴 [Advertencia] El body llegó incompleto:", body);
    return res.status(200).json({ recibido: false });
  }

  console.log("🟢 [Éxito] Datos completos recibidos:");
  console.log("📄 ID de referencia:", external_reference);
  console.log("💰 Estado del pago:", status);

  res.status(200).json({ recibido: true });
}
