export default async function handler(req, res) {
  // Bloque CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).send("Método no permitido");

  try {
    const ablyKey = "AvTVYA.j46ZZg:PVcJZs85qnOHEL_dnYaUPfemjGKmLVFAWZZYk9L61zw";

    const result = await fetch("https://rest.ably.io/channels/pagos/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${Buffer.from(ablyKey).toString("base64")}`
      },
      body: JSON.stringify({
        name: "pago-exitoso",
        data: { mensaje: "Prueba desde REST directa" }
      })
    });

    if (!result.ok) {
      const text = await result.text();
      return res.status(500).json({ error: "No se pudo publicar en Ably", detalle: text });
    }

    return res.status(200).end();
  } catch (error) {
    return res.status(500).json({ error: "Error crítico en el servidor", detalle: error.message });
  }
}
