import Ably from "ably";

export default async function handler(req, res) {
  // Bloque CORS obligatorio
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).send("Método no permitido");

  try {
    const ably = new Ably.Rest({ key: "AvTVYA.j46ZZg:PVcJZs85qnOHEL_dnYaUPfemjGKmLVFAWZZYk9L61zw" });
    const channel = ably.channels.get("pagos");

    channel.publish("pago-exitoso", { mensaje: "Prueba simple desde webhook" }, (err) => {
      if (err) {
        return res.status(500).json({ error: "No se pudo publicar en Ably", detalle: err.message });
      }
      return res.status(200).end();
    });
  } catch (error) {
    return res.status(500).json({ error: "Error crítico en el servidor", detalle: error.message });
  }
}
