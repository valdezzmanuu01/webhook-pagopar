import { createClient } from "@supabase/supabase-js";
import Ably from "ably";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).send("Método no permitido");

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

    console.log("🟡 [Webhook] Botón 'Simular Pago' fue presionado desde Bubble.");
    console.log("🟢 [Webhook] Petición recibida correctamente en Vercel.");

    if (!external_reference || status !== "pagado") {
      console.log("🔴 [Advertencia] El body llegó incompleto:", body);
      return res.status(200).json(true);
    }

    console.log("🟢 [Éxito] Datos completos recibidos:");
    console.log("📄 ID de referencia:", external_reference);
    console.log("💰 Estado del pago:", status);

    const fechaPago = new Date();
    const fechaPagoOffset = new Date(fechaPago.getTime() - 3 * 60 * 60 * 1000);
    const fechaPagoLegible = fechaPagoOffset.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    console.log("🕰️ Fecha del pago:", fechaPagoLegible);

    const { data: usuario, error: userError } = await supabase
      .from("perfiles")
      .select("pro_expira")
      .eq("user_id", external_reference)
      .single();

    if (userError || !usuario) {
      throw new Error("Usuario no encontrado en Supabase");
    }

    console.log("✅ Usuario encontrado");
    console.log("🟢 Columna pro_expira actual:", usuario.pro_expira);

    const nuevaFecha = new Date(Date.now() + 2 * 60 * 1000).toISOString();
    const nuevaFechaOffset = new Date(new Date(nuevaFecha).getTime() - 3 * 60 * 60 * 1000);
    const nuevaFechaLegible = nuevaFechaOffset.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    console.log("⏱️ Nueva fecha a guardar:", nuevaFechaLegible);

    const { error: updateError } = await supabase
      .from("perfiles")
      .update({ pro_expira: nuevaFecha })
      .eq("user_id", external_reference);

    if (updateError) {
      throw new Error("Error al actualizar Supabase: " + updateError.message);
    }

    console.log("✅ Supabase actualizado correctamente");
    console.log("📅 Fecha PRO nueva:", nuevaFechaLegible);

    // Enviar a Ably
    try {
      const ably = new Ably.Realtime("AvTVYA.j46Z2g:PVcJZs85qnOHEL_dnYaUPfemjGKmLVFAWZZYk9L61zw");

      await new Promise((resolve, reject) => {
        ably.channels.get("canal-unico").publish("pro-pagado", external_reference, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });

      console.log("📡 Mensaje enviado correctamente a Ably.");
    } catch (err) {
      console.error("❌ Error crítico con Ably:", err);
    }

    return res.status(200).json(true);
  } catch (err) {
    console.error("❌ Error crítico:", err.message || err);
    return res.status(500).send("Error en el servidor");
  }
}
