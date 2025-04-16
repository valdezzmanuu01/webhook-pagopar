import { createClient } from "@supabase/supabase-js";
import Ably from "ably";

export default async function handler(request, response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") return response.status(200).end();
  if (request.method !== "POST") return response.status(405).send("Método no permitido");

  const SUPABASE_URL = "https://jicgsahphnlsbuuuajem.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppY2dzYWhwaG5sc2J1dXVhamVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwMzc3MTIsImV4cCI6MjA1ODYxMzcxMn0.VeixxYOrv1kjs13GpnsTikQEDiLBvzRA4xc26momIBE";
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    const body = await new Promise((resolve, reject) => {
      let raw = "";
      request.on("data", (chunk) => (raw += chunk));
      request.on("end", () => resolve(JSON.parse(raw)));
      request.on("error", reject);
    });

    const { external_reference, status } = body;

    console.log("🟡 [Webhook] Botón 'Simular Pago' fue presionado desde Bubble.");
    console.log("🟢 [Webhook] Petición recibida correctamente en Vercel.");
    console.log("🟢 [Éxito] Datos completos recibidos:");
    console.log("🧾 ID de referencia:", external_reference);
    console.log("💰 Estado del pago:", status);

    if (!external_reference || status !== "pagado") {
      console.warn("🔴 [Advertencia] El body llegó incompleto:", body);
      return response.status(200).json(true);
    }

    const fechaPago = new Date();
    const fechaPagoOffset = new Date(fechaPago.getTime() - 3 * 60 * 60 * 1000);
    const fechaPagoLegible = fechaPagoOffset.toLocaleString("es-ES", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: false,
    });

    console.log("⏰ Fecha del pago:", fechaPagoLegible);

    const { data: usuario, error: userError } = await supabase
      .from("perfiles")
      .select("pro_expira")
      .eq("user_id", external_reference)
      .single();

    if (userError || !usuario) {
      console.error("❌ Usuario no encontrado en Supabase");
      return response.status(200).json(true);
    }

    console.log("✅ Usuario encontrado");
    console.log("🟢 Columna pro_expira actual:", usuario.pro_expira);

    const nuevaFecha = new Date(Date.now() + 2 * 60 * 1000).toISOString();
    const nuevaFechaOffset = new Date(new Date(nuevaFecha).getTime() - 3 * 60 * 60 * 1000);
    const nuevaFechaLegible = nuevaFechaOffset.toLocaleString("es-ES", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: false,
    });

    console.log("⏱️ Nueva fecha a guardar:", nuevaFechaLegible);

    const { error: updateError } = await supabase
      .from("perfiles")
      .update({ pro_expira: nuevaFecha })
      .eq("user_id", external_reference);

    if (updateError) {
      console.error("❌ Error al actualizar Supabase:", updateError.message);
      return response.status(200).json(true);
    }

    console.log("✅ Supabase actualizado correctamente");
    console.log("🗓️ Fecha PRO nueva:", nuevaFechaLegible);

    // Publicar mensaje en Ably
    const ably = new Ably.Realtime("AvTVYA.j46Z2g:PVcJZs85qnOHEL_dnYaUPfemjGKmLVFAWZZYk9L61zw");

    await new Promise((resolve, reject) => {
      ably.connection.once("connected", () => {
        const canal = ably.channels.get("canal-pagos");
        canal.publish("pago-completado", { user_id: external_reference }, (err) => {
          if (err) {
            console.error("❌ Error crítico: No se pudo enviar el mensaje a Ably:", err);
            reject(err);
          } else {
            console.log("📡 Mensaje enviado correctamente a Ably.");
            resolve();
          }
        });
      });

      ably.connection.on("failed", (err) => {
        console.error("❌ Error crítico: Fallo de conexión con Ably:", err);
        reject(err);
      });
    });

    return response.status(200).json(true);

  } catch (error) {
    console.error("❌ Error inesperado:", error);
    return response.status(200).json(true);
  }
}

