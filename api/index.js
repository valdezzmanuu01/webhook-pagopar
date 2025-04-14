export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).send("Método no permitido");
  }

  try {
    const body = await request.json();
    console.log("✅ Webhook recibido:", body);

    // Enviar una respuesta exitosa
    return response.status(200).send("Webhook recibido correctamente");
  } catch (error) {
    console.error("❌ Error al procesar el webhook:", error);
    return response.status(500).send("Error interno del servidor");
  }
}
