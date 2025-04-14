export default async function handler(request, response) {
  // -------------------------
  // CONFIGURAR CORS
  // -------------------------
  response.setHeader("Access-Control-Allow-Origin", "*"); // Permitir cualquier origen
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS"); // Permitir métodos necesarios
  response.setHeader("Access-Control-Allow-Headers", "Content-Type"); // Permitir contenido JSON

  // -------------------------
  // RESPONDER A PRE-FLIGHT (OPTIONS)
  // -------------------------
  if (request.method === "OPTIONS") {
    return response.status(200).end(); // Finaliza rápido
  }

  // -------------------------
  // SOLO PERMITIR MÉTODO POST
  // -------------------------
  if (request.method !== "POST") {
    return response.status(405).send("Método no permitido");
  }

  // -------------------------
  // LEER EL CUERPO MANUALMENTE
  // -------------------------
  let body = "";
  try {
    for await (const chunk of request) {
      body += chunk;
    }

    const parsedBody = JSON.parse(body);
    console.log("✅ Webhook recibido:", parsedBody);

    // -------------------------
    // EXTRAER DATOS
    // -------------------------
    const { external_reference, status } = parsedBody;

    if (!external_reference || !status) {
      return response.status(400).json({
        error: true,
        message: "Faltan campos obligatorios: external_reference o status"
      });
    }

    if (status !== "pagado") {
      return response.status(200).send("El estado no es 'pagado'. No se actualiza.");
    }

    // -------------------------
    // CONFIGURACIÓN SUPABASE
    // -------------------------
    const SUPABASE_URL = "https://jicgsahphnlsbuuuajem.supabase.co";
    const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppY2dzYWhwaG5sc2J1dXVhamVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwMzc3MTIsImV4cCI6MjA1ODYxMzcxMn0.VeixxYOrv1kjs13GpnsTikQEDiLBvzRA4xc26momIBE";

    // -------------------------
    // CALCULAR NUEVA FECHA +2 MINUTOS
    // -------------------------
    const nuevaFecha = new Date(Date.now() + 2 * 60 * 1000).toISOString();

    // -------------------------
    // ENVIAR PATCH A SUPABASE
    // -------------------------
    const supabaseResponse = await fetch(`${SUPABASE_URL}/rest/v1/perfiles?id=eq.${external_reference}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Prefer": "return=representation"
      },
      body: JSON.stringify({ pro_expira: nuevaFecha })
    });

    const resultado = await supabaseResponse.json();

    if (!supabaseResponse.ok) {
      console.error("❌ Error al actualizar Supabase:", resultado);
      return response.status(500).json({
        error: true,
        message: "Error al actualizar pro_expira",
        detalle: resultado
      });
    }

    // -------------------------
    // TODO OK
    // -------------------------
    console.log("✅ Supabase actualizado:", resultado);
    return response.status(200).json({
      success: true,
      message: "pro_expira actualizado correctamente",
      resultado
    });

  } catch (error) {
    // -------------------------
    // MANEJO DE ERRORES
    // -------------------------
    console.error("❌ Error general:", error);
    return response.status(500).json({
      error: true,
      message: error.message || "Error desconocido",
      stack: error.stack || null
    });
  }
}
