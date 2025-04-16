import Ably from "ably";

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).send("Método no permitido");
  }

  console.log("🔵 Publicando mensaje en Ably...");

  try {
    const ably = new Ably.Rest("AvTVYA.j46Z2g:PVcJZs85qnOHEL_dnYaUPfemjGKmLVFAWZZYk9L61zw");
    const canal = ably.channels.get("canal-pagos");
    canal.publish("test", { mensaje: "Prueba directa desde webhook" });

    console.log("✅ Script ejecutado. Verifica en el dashboard de Ably si llegó.");
    return res.status(200).json(true);
  } catch (error) {
    console.error("❌ Error al intentar publicar en Ably:", error);
    return res.status(500).json({ error: true, message: error.message });
  }
}
