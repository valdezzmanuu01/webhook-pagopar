// ... bloque CORS (no se toca)

if (req.method === 'POST') {
  try {
    console.log('🟢 [Webhook] Se recibió una solicitud desde Bubble');

    const contentType = req.headers['content-type'];
    if (contentType !== 'application/json') {
      console.log('🔴 [Alerta] Content-Type no es JSON:', contentType);
    } else {
      console.log('🟢 [OK] Content-Type es JSON');
    }

    if (!req.body || Object.keys(req.body).length === 0) {
      console.log('🔴 [Error] El cuerpo de la solicitud está vacío');
    } else {
      console.log('🟢 [Datos recibidos]', req.body);
    }

  } catch (error) {
    console.log('🔴 [Excepción capturada]', error.message);
  }

  // NO agregamos return ni res.end acá para no interrumpir la estructura original
}
