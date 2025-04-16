import { createClient } from "@supabase/supabase-js";
import Ably from "ably";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    console.warn("⚠️ [Advertencia] Método no permitido:", req.method);
    return res.status(405).send("Método no permitido");
  }

  console.log("🟡 [Webhook] Botón 'Simular Pago' fue presionado desde Bubble.");
  console.log("🟢 [Webhook] Petición recibida correctamente en Vercel.");

  try {
    const raw = await new Promise((resolve, reject) => {
      let body = "";
      req.on("data", chunk => (body += chunk));
      req.on("end", () => resolve(body));
      req.on("error", reject);
    });

    const { external_reference, status } = JSON.parse(raw);
    console.log("🟢 [Éxito] Datos completos recibidos:");
    console.log("📄 ID de referencia:", external_reference);
    console.log("💰 Estado del pago:", status);

    if (!external_reference || status !== "pagado") {
      console.warn("🟠 [Advertencia] El body llegó incompleto o inválido.");
      return res.status(200).json(true); // conexión establecida, aunque el body esté mal
    }

    const fechaPago = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const fechaPagoLegible = fechaPago.toLocaleString("es-ES", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: false
    });
    console.log("⏱️ Fecha del pago:", fechaPagoLegible);

    const supabase = createClient(
      "https://jicgsahphnlsbuuuajem.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppY2dzYWhwaG5sc2J1dXVhamVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwMzc3MTIsImV4cCI6MjA1ODYxMzcxMn0.VeixxYOrv1kjs13GpnsTikQEDiLBvzRA4xc26momIBE"
    );

    const { data: usuario, error: userError } = await supabase
      .from("perfiles")
      .select("pro_expira")
      .eq("user_id", external_reference)
      .single();

    if (userError) {
      throw new Error("Error desde Supabase (consulta): " + userError.message);
    }

    if (!usuario) {
      throw new Error("Usuario no encontrado en Supabase.");
    }

    console.log("✅ Usuario encontrado");
    console.log("🟢 Columna pro_expira actual:", usuario.pro_expira);

    const nuevaFecha = new Date(Date.now() + 2 * 60 * 1000).toISOString();
    const nuevaFechaLegible = new Date(new Date(nuevaFecha).getTime() - 3 * 60 * 60 * 1000).toLocaleString("es-ES", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: false
    });

    console.log("⏲️ Nueva fecha a guardar:", nuevaFechaLegible);

    const { error: updateError } = await supabase
      .from("perfiles")
      .update({ pro_expira: nuevaFecha })
      .eq("user_id", external_reference);

    if (updateError) {
      throw new Error("Error al actualizar Supabase: " + updateError.message);
    }

    console.log("✅ Supabase actualizado correctamente");
    console.log("📅 Fecha PRO nueva:", nuevaFechaLegible);

    const ably = new Ably.Realtime.Promise({ key: "AvTVYAj46ZZg:PVcJZs85qnOHEL_dnYaUPfemjGKmLVFAWZZYk9L61zw" });

    try {
      const channel = ably.channels.get("canal-pagos");
      await channel.publish("pago-confirmado", { user_id: external_reference });
      console.log("📤 Mensaje enviado correctamente a Ably.");
    } catch (ablyError) {
      throw new Error("Error al enviar mensaje a Ably: " + ablyError.message);
    }

    return res.status(200).json(true);
  } catch (error) {
    console.error("❌ Error crítico:", error);
    return res.status(500).json({ error: true, message: error.message || "Error inesperado" });
  }
}
