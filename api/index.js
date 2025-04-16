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
    console.log("🟡 [Webhook] Botón 'Simular Pago' fue presionado desde Bubble.");

    const rawBody = await new Promise((resolve, reject) => {
      let raw = "";
      request.on("data", chunk => (raw += chunk));
      request.on("end", () => resolve(JSON.parse(raw)));
      request.on("error", reject);
    });

    const { external_reference, status } = rawBody;

    console.log("🟢 [Webhook] Petición recibida correctamente en Vercel.");
    console.log("📄 ID de referencia:", external_reference);
    console.log("💰 Estado del pago:", status);

    if (!external_reference || status !== "pagado") {
      console.warn("🔴 [Advertencia] Body incompleto o estado inválido:", rawBody);
      return response.status(200).json(true);
    }

    const fechaPago = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const fechaPagoLegible = fechaPago.toLocaleString("es-ES", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: false
    });
    console.log("⏰ Fecha del pago:", fechaPagoLegible);

    const { data: usuario, error: userError } = await supabase
      .from("perfiles")
      .select("pro_expira")
      .eq("user_id", external_reference)
      .single();

    if (userError || !usuario) {
      throw new Error("❌ Usuario no encontrado en Supabase");
    }

    console.log("✅ Usuario encontrado. Fecha pro actual:", usuario.pro_expira);

    const nuevaFecha = new Date(Date.now() + 2 * 60 * 1000).toISOString();
    const nuevaFechaLegible = new Date(new Date(nuevaFecha).getTime() - 3 * 60 * 60 * 1000).toLocaleString("es-ES", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: false
    });

    console.log("🕓 Nueva fecha a guardar:", nuevaFechaLegible);

    const { error: updateError } = await supabase
      .from("perfiles")
      .update({ pro_expira: nuevaFecha })
      .eq("user_id", external_reference);

    if (updateError) {
      throw new Error(`❌ Error al actualizar Supabase: ${updateError.message}`);
    }

    console.log("✅ Supabase actualizado correctamente.");

    // Publicación directa a Ably (forma que funcionaba)
    const ably = new Ably.Realtime("AvTVYA.j46Z2g:PVcJZs85qnOHEL_dnYaUPfemjGKmLVFAWZZYk9L61zw");
    const canal = ably.channels.get("pagos");
    canal.publish("pago-exitoso", { user_id: external_reference });

    return response.status(200).json(true);

  } catch (error) {
    console.error("❌ Error crítico:", error.message);
    return response.status(500).send("Error interno");
  }
}
