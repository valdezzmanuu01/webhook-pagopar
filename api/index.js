export default async function handler(req, res) {
  // BLOQUE CORS QUE TÚ CONFIRMASTE QUE FUNCIONA
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.status(200).end();
    return;
  }
  res.setHeader("Access-Control-Allow-Origin", "*");

  // MENSAJE: INICIO DE CONEXIÓN
  console.log("🟡 [Webhook] Botón 'Simular Pago' fue presionado desde Bubble.");

  // MÉTODO INCORRECTO
  if (req.method !== "POST") {
    console.log("🔴 [Error] Método no permitido:", req.method);
    return res.status(405).json({ error: "Método no permitido" });
  }

  // MENSAJE: CONEXIÓN EXITOSA
  console.log("🟢 [Webhook] Petición recibida correctamente en Vercel.");

  // PARSE Y VALIDACIÓN
  const { external_reference, status } = req.body || {};

  if (!external_reference || !status) {
    console.log("🔴 [Advertencia] El body llegó incompleto:", req.body);
    return res.status(200).json({ recibido: false });
  }

  // MENSAJES DE CONFIRMACIÓN DE DATOS
  console.log("🟢 [Éxito] Datos completos recibidos:");
  console.log("📄 ID de referencia:", external_reference);
  console.log("💰 Estado del pago:", status);

  // RESPUESTA EXITOSA PARA BUBBLE
  res.status(200).json({ recibido: true });
}
