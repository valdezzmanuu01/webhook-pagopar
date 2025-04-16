export default async function handler(req, res) {
  // Bloque CORS – NO TOCAR
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(200).end();
    return;
  }

  // Validaciones de consola
  console.log('🟡 [Webhook] Botón "Simular Pago" fue presionado desde Bubble.');
  console.log('🟢 [Webhook] Petición recibida correctamente en Vercel.');

  try {
    const { body } = req;
    const { id, monto, cliente } = body || {};

    if (!id || !monto || !cliente) {
      console.log('🔴 [Advertencia] El body llegó incompleto:', body);
    } else {
      console.log('🟢 [Datos recibidos]', { id, monto, cliente });
    }
  } catch (e) {
    console.log('🔴 [Error] No se pudo analizar el body de la petición.', e);
  }

  // Aquí continúa tu lógica normal, sin modificar lo que ya funcionaba antes.
}
