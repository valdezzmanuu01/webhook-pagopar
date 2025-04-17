import Ably from "ably";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).send("Método no permitido");

  try {
    const ably = new Ably.Rest("AvTVYAj46ZZg:PVcJZs85qnOHEL_dnYaUPfemjGKmLVFAWZZYk9L61zw");
    const canal = ably.channels.get("pagos");

    canal.publish("pago-exitoso", { mensaje: "Prueba directa desde webhook" });

    return res.status(200).end();
  } catch (error) {
    return res.status(500).json({ error: true, mensaje: error.message });
  }
}
