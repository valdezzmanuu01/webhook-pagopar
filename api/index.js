import { createClient } from "@supabase/supabase-js";

export default async function handler(request, response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    return response.status(200).end();
  }

  if (request.method !== "POST") {
    return response.status(405).send("Método no permitido");
  }

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

    if (!external_reference || status !== "pagado") {
      return response.status(400).json({ error: true, message: "Datos inválidos" });
    }

    const nuevaFecha = new Date(Date.now() + 2 * 60 * 1000).toISOString();

    const { error: updateError } = await supabase
      .from("perfiles")
      .update({ pro_expira: nuevaFecha })
      .eq("user_id", external_reference);

    if (updateError) {
      return response.status(500).json({ error: true, message: updateError.message });
    }

    const { data: verificacion } = await supabase
      .from("perfiles")
      .select("pro_expira")
      .eq("user_id", external_reference)
      .single();

    if (!verificacion?.pro_expira) {
      return response.status(500).json({ error: true, message: "Verificación fallida" });
    }

    return response.status(200).json({
      success: true,
      message: "pro_expira actualizado correctamente",
      pro_expira: verificacion.pro_expira,
    });
  } catch (error) {
    return response.status(500).json({
      error: true,
      message: error.message || "Error inesperado",
    });
  }
}
