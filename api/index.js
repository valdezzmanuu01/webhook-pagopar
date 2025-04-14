export default async function handler(request, response) {
  console.log("✅ Webhook recibido");

  if (request.method !== "POST") {
    console.warn("❌ Método no permitido:", request.method);
    return response.status(405).send("Método no permitido");
  }

  const body = request.body;
  const userId = body?.external_reference;

  if (!userId) {
    console.error("❌ Falta external_reference en el cuerpo");
    return response.status(400).send("Falta external_reference");
  }

  // Configuración Supabase
  const SUPABASE_URL = "https://jicgsahphnlsbuuuajem.supabase.co";
  const SUPABASE_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppY2dzYWhwaG5sc2J1dXVhamVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwMzc3MTIsImV4cCI6MjA1ODYxMzcxMn0.VeixxYOrv1kjs13GpnsTikQEDiLBvzRA4xc26momIBE";

  const now = new Date();
  const proExpira = new Date(now.getTime() + 2 * 60 * 1000); // 2 minutos desde ahora

  const result = await fetch(`${SUPABASE_URL}/rest/v1/perfiles?user_id=eq.${userId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: "return=minimal"
    },
    body: JSON.stringify({ pro_expira: proExpira.toISOString() })
  });

  if (!result.ok) {
    const errorText = await result.text();
    console.error("❌ Error al actualizar Supabase:", errorText);
    return response.status(500).send("Error al actualizar Supabase");
  }

  console.log("✅ Usuario actualizado correctamente:", userId);
  return response.status(200).send("Actualización completada");
}
