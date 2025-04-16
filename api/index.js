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

  console.log("🟡 [Prueba] Webhook recibido para prueba simple de publicación en Ably");

  try {
    const ably = new Ably.Rest("AvTVYA.j46Z2g:PVcJZs85qnOHEL_dnYaUPfemjGKmLVFAWZZYk9L61zw");
    const canal = ably.channels.get("canal-pagos");

    canal.publish("pago-confirmado", { id: "test-id" }, (err) => {
      if (err) {
        console.error("❌ Error al publicar en Ably:", err);
      } else {
        console.log("📡 Mensaje de prueba publicado en Ably correctamente.");
      }
    });
  } catch (error) {
    console.error("❌ Error inesperado en Ably:", error);
  }

  return res.status(200).json(true);
}
