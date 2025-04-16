export default async function handler(req, res) {
  console.log("🟡 [Webhook] Botón 'Simular Pago' fue presionado desde Bubble.");

  if (req.method !== "POST") {
    console.log("🔴 [Advertencia] Método no permitido:", req.method);
    return res.status(405).json({ error: "Método no permitido" });
  }

  console.log("🟢 [Webhook] Petición recibida correctamente en Vercel.");

  let body = req.body;

  // Si el body está vacío y viene como texto, intentamos convertirlo
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (e) {
      console.log("🔴 [Advertencia] No se pudo parsear el body como JSON.");
      return res.status(400).json({ error: "Body inválido" });
    }
  }

  const { external_reference, status } = body;

  if (!external_reference || !status) {
    console.log("🔴 [Advertencia] El body llegó incompleto:", body);
    return res.status(200).json({ message: "Faltan datos, pero se recibió la petición." });
  }

  console.log("🟢 [Éxito] Datos completos recibidos:");
  console.log("🧾 ID de referencia:", external_reference);
  console.log("💰 Estado del pago:", status);

  res.status(200).json({ message: "Petición procesada correctamente." });
}
