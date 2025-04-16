import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).send("Método no permitido");

  console.log("🟡 [Webhook] Botón 'Simular Pago' fue presionado desde Bubble.");
  console.log("🟢 [Webhook] Petición recibida correctamente en Vercel.");

  const SUPABASE_URL = "https://jicgsahphnlsbuuuajem.supabase.co";
  const SUPABASE_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppY2dzYWhwaG5sc2J1dXVhamVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwMzc3MTIsImV4cCI6MjA1ODYxMzcxMn0.VeixxYOrv1kjs13GpnsTikQEDiLBvzRA4xc26momIBE";
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
      return res.status(200).json(true); // igual responde true para Bubble
    }

    const fechaPago = new Date();
    const fechaPagoLegible = new Date(fechaPago.getTime() - 3 * 60 * 60 * 1000).toLocaleString(
      "es-ES",
      { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }
    );
    console.log("⏰ Fecha del pago:", fechaPagoLegible);

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

    const nuevaFecha = new Date(Date.now() + 2 * 60 * 1000).toISOString();
    const nuevaFechaLegible = new Date(new Date(nuevaFecha).getTime() - 3 * 60 * 60 * 1000).toLocaleString(
      "es-ES",
      { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }
    );
    console.log("🕓 Nueva fecha a guardar:", nuevaFechaLegible);

    const { error: updateError } = await supabase
      .from("perfiles")
      .update({ pro_expira: nuevaFecha })
      .eq("user_id", external_reference);

    if (updateError) {
      console.log("❌ Error al actualizar Supabase:", updateError.message);
      return res.status(200).json(true);
    }

    console.log("✅ Supabase actualizado correctamente");
    console.log("🗓️ Fecha PRO nueva:", nuevaFechaLegible);

    // Enviar mensaje a Ably
    try {
      await fetch("https://rest.ably.io/channels/general/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Basic " + btoa("AvTVYAj46ZZg:PVcJZs85qnOHEL_dnYaUPfemjGKmLVFAWZZYk9L61zw"),
        },
        body: JSON.stringify({
          name: "pro-update",
          data: { id: external_reference },
        }),
      });
      console.log("📡 Mensaje enviado correctamente a Ably.");
    } catch (ablyError) {
      console.error("❌ Error al enviar mensaje a Ably:", ablyError.message);
    }

    return res.status(200).json(true);
  } catch (e) {
    console.log("❌ Error inesperado:", e);
    return res.status(200).json(true);
  }
}
