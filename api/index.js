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

  let body = "";

  try {
    for await (const chunk of request) {
      body += chunk;
    }

    const parsedBody = JSON.parse(body);
    console.log("✅ Webhook recibido:", parsedBody);

    const { external_reference, status } = parsedBody;

    if (!external_reference || !status) {
      return response.status(400).json({
        error: true,
        message: "Faltan campos obligatorios"
      });
    }

    if (status !== "pagado") {
      return response.status(200).send("El estado no es 'pagado'");
    }

    const SUPABASE_URL = "https://jicgsahphnlsbuuuajem.supabase.co";
    const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppY2dzYWhwaG5sc2J1dXVhamVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwMzc3MTIsImV4cCI6MjA1ODYxMzcxMn0.VeixxYOrv1kjs13GpnsTikQEDiLBvzRA4xc26momIBE";

    const nuevaFecha = new Date(Date.now() + 2 * 60 * 1000).toISOString();

    // ACTUALIZAR pro_expira
    const actualizar = await fetch(`${SUPABASE_URL}/rest/v1/perfiles?user_id=eq.${external_reference}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Prefer": "return=representation"
      },
      body: JSON.stringify({ pro_expira: nuevaFecha })
    });

    const resultado = await actualizar.json();

    // VERIFICAR QUE LA ACTUALIZACIÓN FUE REAL
    const verificar = await fetch(`${SUPABASE_URL}/rest/v1/perfiles?user_id=eq.${external_reference}&select=pro_expira`, {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`
      }
    });

    const datos = await verificar.json();
    const registro = datos && datos[0];

    if (!registro || !registro.pro_expira || registro.pro_expira !== nuevaFecha) {
      console.error("❌ Verificación fallida. El campo pro_expira no se actualizó correctamente.");
      return response.status(500).json({
        error: true,
        message: "La columna pro_expira no se actualizó correctamente"
      });
    }

    console.log("✅ Supabase actualizado y verificado:", registro);
    return response.status(200).json({
      success: true,
      message: "pro_expira actualizado correctamente",
      pro_expira: registro.pro_expira
    });

  } catch (error) {
    console.error("❌ Error general:", error);
    return response.status(500).json({
      error: true,
      message: error.message || "Error desconocido",
      stack: error.stack || null
    });
  }
}
