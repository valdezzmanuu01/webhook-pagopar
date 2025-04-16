import { createClient } from "@supabase/supabase-js";
import Ably from "ably";

// Inicialización de Supabase
const supabase = createClient(
  "https://jicgsahphnlsbuuuajem.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
);

// Inicialización de Ably
const ably = new Ably.Rest("AvTVYAj46ZZg:PVcJZs85qnOHEL_dnYaUPfemjGKmLVFAWZZYk9L61zw");

export default async function handler(req, res) {
  // Configuración CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).send("Método no permitido");

  console.log("🟡 [Webhook] Botón 'Simular Pago' fue presionado desde Bubble.");
  console.log("🟢 [Webhook] Petición recibida correctamente en Vercel.");

  try {
    const body = await new Promise((resolve, reject) => {
      let raw = "";
      req.on("data", (chunk) => (raw += chunk));
      req.on("end", () => resolve(JSON.parse(raw)));
      req.on("error", reject);
    });

    const { external_reference, status } = body;

    console.log("🟢 [Éxito] Datos completos recibidos:");
    console.log("📄 ID de referencia:", external_reference);
    console.log("💰 Estado del pago:", status);

    if (!external_reference || status !== "pagado") {
      console.log("🔴 [Advertencia] El body llegó incompleto:", body);
      return res.status(200).json(true); // Bubble solo quiere saber si se conectó
    }

    // Fecha del pago
    const fechaPago = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const fechaPagoLegible = fechaPago.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    console.log("⏱️ Fecha del pago:", fechaPagoLegible);

    // Buscar usuario
    const { data: usuario, error: userError } = await supabase
      .from("perfiles")
      .select("pro_expira")
      .eq("user_id", external_reference)
      .single();

    if (userError || !usuario) {
      console.log("❌ Usuario no encontrado en Supabase");
      return res.status(200).json(true);
    }

    console.log("✅ Usuario encontrado");
    console.log("🟢 Columna pro_expira actual:", usuario.pro_expira);

    // Calcular nueva fecha PRO
    const nuevaFecha = new Date(Date.now() + 2 * 60 * 1000);
    const nuevaFechaOffset = new Date(nuevaFecha.getTime() - 3 * 60 * 60 * 1000);
    const nuevaFechaLegible = nuevaFechaOffset.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    console.log("⏱️ Nueva fecha a guardar:", nuevaFechaLegible);

    // Actualizar en Supabase
    const { error: updateError } = await supabase
      .from("perfiles")
      .update({ pro_expira: nuevaFecha.toISOString() })
      .eq("user_id", external_reference);

    if (updateError) {
      console.error("❌ Error al actualizar Supabase:", updateError.message);
      return res.status(200).json(true);
    }

    console.log("✅ Supabase actualizado correctamente");
    console.log("📆 Fecha PRO nueva:", nuevaFechaLegible);

    // Publicar en Ably
    try {
      await ably.channels.get("canal-unico").publish("nuevo-pago", {
        id: external_reference,
      });
      console.log("📤 Mensaje enviado correctamente a Ably.");
    } catch (ablyError) {
      console.error("❌ Error al enviar a Ably:", ablyError.message);
    }

    return res.status(200).json(true); // Siempre retornar true a Bubble
  } catch (error) {
    console.error("❌ Error inesperado:", error.message);
    return res.status(200).json(true); // Bubble solo necesita confirmar conexión
  }
}
