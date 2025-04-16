import { createClient } from "@supabase/supabase-js";

// Ably (configuración)
const ABLY_URL = "https://rest.ably.io/channels/general/messages";
const ABLY_KEY = "AvTVYAj46ZZg:PVcJZs85qnOHEL_dnYaUPfemjGKmLVFAWZZYk9L61zw";

export default async function handler(req, res) {
  // CORS necesario para Bubble
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  console.log("🟡 [Webhook] Botón 'Simular Pago' fue presionado desde Bubble.");
  console.log("🟢 [Webhook] Petición recibida correctamente en Vercel.");

  // Conexión con Supabase
  const supabase = createClient(
    "https://jicgsahphnlsbuuuajem.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppY2dzYWhwaG5sc2J1dXVhamVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwMzc3MTIsImV4cCI6MjA1ODYxMzcxMn0.VeixxYOrv1kjs13GpnsTikQEDiLBvzRA4xc26momIBE"
  );

  try {
    const body = await new Promise((resolve, reject) => {
      let raw = "";
      req.on("data", (chunk) => (raw += chunk));
      req.on("end", () => resolve(JSON.parse(raw)));
      req.on("error", reject);
    });

    const { external_reference, status } = body;

    if (!external_reference || status !== "pagado") {
      console.log("🔴 [Advertencia] El body llegó incompleto:", body);
      return res.status(200).json(true); // igual devolvemos true solo para confirmar recepción
    }

    console.log("🟢 [Éxito] Datos completos recibidos:");
    console.log("📄 ID de referencia:", external_reference);
    console.log("💰 Estado del pago:", status);

    // Fecha del pago (offset -3h)
    const fechaPago = new Date();
    const offsetPago = new Date(fechaPago.getTime() - 3 * 60 * 60 * 1000);
    const legiblePago = offsetPago.toLocaleString("es-ES", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: false,
    });
    console.log("💳 Fecha del pago:", legiblePago);

    // Verificar si el usuario existe
    const { data: usuario, error: userError } = await supabase
      .from("perfiles")
      .select("pro_expira")
      .eq("user_id", external_reference)
      .single();

    if (userError || !usuario) {
      console.log("❌ [Advertencia] Usuario no encontrado en Supabase");
      return res.status(200).json(true);
    }

    console.log("✅ Usuario encontrado");
    console.log("🟢 Columna pro_expira actual:", usuario.pro_expira);

    // Calcular nueva fecha (2 minutos más)
    const nuevaFecha = new Date(Date.now() + 2 * 60 * 1000).toISOString();
    const offsetNueva = new Date(new Date(nuevaFecha).getTime() - 3 * 60 * 60 * 1000);
    const legibleNueva = offsetNueva.toLocaleString("es-ES", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: false,
    });

    console.log("🕓 Nueva fecha a guardar:", legibleNueva);

    // Actualizar Supabase
    const { error: updateError } = await supabase
      .from("perfiles")
      .update({ pro_expira: nuevaFecha })
      .eq("user_id", external_reference);

    if (updateError) {
      console.log("❌ [Advertencia] Error al actualizar Supabase:", updateError.message);
      return res.status(200).json(true);
    }

    console.log("✅ Supabase actualizado correctamente");
    console.log("🗓️ Fecha PRO nueva:", legibleNueva);

    // Enviar mensaje por Ably (para recargar desde Bubble)
    const ablyRes = await fetch(ABLY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(ABLY_KEY)}`,
      },
      body: JSON.stringify({
        name: "recarga",
        data: external_reference,
      }),
    });

    if (!ablyRes.ok) {
      console.log("⚠️ [Advertencia] No se pudo enviar el mensaje a Ably");
    } else {
      console.log("📡 Mensaje enviado a Ably correctamente:", external_reference);
    }

    // Respuesta a Bubble (éxito de conexión, sin detalles internos)
    return res.status(200).json(true);

  } catch (error) {
    console.log("❌ [Advertencia] Error inesperado:", error.message);
    return res.status(200).json(true);
  }
}
