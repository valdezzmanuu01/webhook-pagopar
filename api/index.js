export default async function handler(request, response) {
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

    return response.status(200).send("Webhook recibido correctamente");
  } catch (error) {
    console.error("❌ Error al procesar el webhook:");
    console.error("Mensaje:", error.message);
    console.error("Stack:", error.stack);
    console.error("Completo:", error);

    return response.status(500).json({
      error: true,
      message: error.message || "Error desconocido",
      stack: error.stack || "Sin stack disponible"
    });
  }
}
