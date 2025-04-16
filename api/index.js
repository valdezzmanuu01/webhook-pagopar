import { createClient } from "@supabase/supabase-js";
import Ably from "ably";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).send("Método no permitido");
  }

  const SUPABASE_URL = "https://jicgsahphnlsbuuuajem.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppY2dzYWhwaG5sc2J1dXVhamVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwMzc3MTIsImV4cCI6MjA1ODYxMzcxMn0.VeixxYOrv1kjs13GpnsTikQEDiLBvzRA4xc26momIBE";
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    const rawBody = await new Promise((resolve, reject) => {
      let data = "";
      req.on("data", chunk => data += chunk);
      req.on("end", () => resolve(JSON.parse(data)));
      req.on("error", reject);
    });

    const { external_reference, status } = rawBody;

    console.log("🟡 [Webhook] Botón 'Simular Pago' fue presionado desde Bubble.");
    console.log("🟢 [Webhook] Petición recibida correctamente en Vercel.");
    console.log("🟢 [Éxito] Datos completos recibidos:");
    console.log("📄 ID de referencia:", external_reference);
    console.log("💰 Estado del pago:", status);

    if (!external_reference || status !== "pagado") {
      console.log("🔴 [Advertencia] El body llegó incompleto:", rawBody);
      return res.status(200).json(true);
    }

    const fechaPago = new Date();
    const fechaOffset = new Date(fechaPago.getTime() - 3 * 60 * 60 * 1000);
    const fechaLegible = fechaOffset.toLocaleString("es-ES", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: false
    });
    console.log("⏱️ Fecha del pago:", fechaLegible);

    const { data: usuario, error: userError } = await supabase
      .from("perfiles")
      .select("pro_expira")
      .eq("user_id", external_reference)
      .single();

    if (userError || !usuario) {
      console.error("❌ Usuario no encontrado en Supabase");
      return res.status(500).json({ error: true, message: "Usuario no encontrado" });
    }

    console.log("✅ Usuario encontrado");
    console.log("🟢 Columna pro_expira actual:", usuario.pro_expira);

    const nuevaFecha = new Date(Date.now() + 2 * 60 * 1000).toISOString();
    const nuevaOffset = new Date(new Date(nuevaFecha).getTime() - 3 * 60 * 60 * 1000);
    const nuevaLegible = nuevaOffset.toLocaleString("es-ES", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: false
    });

    console.log("🕓 Nueva fecha a guardar:", nuevaLegible);

    const { error: updateError } = await supabase
      .from("perfiles")
      .update({ pro_expira: nuevaFecha })
      .eq("user_id", external_reference);

    if (updateError) {
      console.error("❌ Error al actualizar Supabase:", updateError.message);
      return res.status(500).json({ error: true, message: updateError.message });
    }

    console.log("✅ Supabase actualizado correctamente");
    console.log("🗓️ Fecha PRO nueva:", nuevaLegible);

    // Enviar mensaje a Ably
    try {
      const ably = new Ably.Realtime({ key: "AvTVYA.j46Z2g:PVcJZs85qnOHEL_dnYaUPfemjGKmLVFAWZZYk9L61zw" });
      const canal = ably.channels.get("canal-global");

      await new Promise((resolve, reject) => {
        canal.publish("pago-confirmado", { id: external_reference }, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });

      console.log("📢 Mensaje enviado correctamente a Ably.");
    } catch (ablyError) {
      console.error("❌ Error crítico con Ably:", ablyError);
      return res.status(500).json({ error: true, message: "Error al publicar en Ably" });
    }

    return res.status(200).json(true);
  } catch (error) {
    console.error("❌ Error inesperado:", error);
    return res.status(500).json({ error: true, message: error.message || "Error desconocido" });
  }
}
