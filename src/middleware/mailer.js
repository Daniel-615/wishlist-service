const { EMAIL_USER, EMAIL_PASSWORD, FRONTEND_URL } = require("../config/config.js");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD,
  },
});


function formatCurrency(value = 0, currency = "GTQ") {
  try {
    return new Intl.NumberFormat("es-GT", { style: "currency", currency }).format(value);
  } catch {
    return `Q ${Number(value || 0).toFixed(2)}`;
  }
}


async function enviarCorreoCarrito(destinatario, items = [], options = {}) {
  const {
    currency = "GTQ",
    soporteUrl = `${FRONTEND_URL}/help`,
    titulo = "Tu carrito te espera 🛒",
    asunto = "¿Aún deseas hacer tus compras?",
    preheader = "Guardamos tus productos. Completa tu compra en minutos."
  } = options;

  const itemsHTML = (items || []).map(it => `
    <tr>
      <td style="padding:12px 0; border-bottom:1px solid #eee;">
        <table width="100%" cellspacing="0" cellpadding="0" role="presentation">
          <tr>
            <td width="96" valign="top" style="padding-right:12px;">
              <a href="${`${FRONTEND_URL}/carrito`}" target="_blank">
                <img src="${it.imagenUrl}" alt="${it.nombre}" width="96" height="96" style="display:block;border-radius:8px;object-fit:cover;" />
              </a>
            </td>
            <td valign="top" style="font-size:14px;color:#333;">
              <div style="font-weight:600; margin-bottom:4px;">${it.nombre || "Producto"}</div>
              ${typeof it.cantidad !== "undefined" ? `<div style="color:#666; margin-bottom:6px;">Cantidad: ${it.cantidad}</div>` : ""}
              ${typeof it.precio !== "undefined" ? `<div style="font-weight:600;">${formatCurrency(it.precio, currency)}</div>` : ""}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join("");

  const subtotal = (items || []).reduce((acc, it) => acc + (Number(it.precio || 0) * Number(it.cantidad || 1)), 0);
  const subtotalHTML = items.length
    ? `<div style="margin-top:16px; font-size:15px; color:#333; font-weight:600;">Subtotal estimado: ${formatCurrency(subtotal, currency)}</div>`
    : "";

  const html = `
<!doctype html>
<html lang="es">
<head>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<title>${titulo}</title>
</head>
<body style="margin:0; padding:0; background:#f5f7fb;">
  <span style="display:none; visibility:hidden; opacity:0; height:0; width:0; overflow:hidden;">
    ${preheader}
  </span>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%">
    <tr>
      <td align="center" style="padding:24px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px;">
          <tr>
            <td style="background:#ffffff; border-radius:12px; padding:28px; box-shadow:0 2px 6px rgba(0,0,0,0.05);">
              <div style="text-align:center; margin-bottom:10px;">
                <a href="${FRONTEND_URL}" target="_blank" style="text-decoration:none; color:#111;">
                  <h1 style="margin:0; font-size:20px;">${titulo}</h1>
                </a>
              </div>

              <p style="font-size:15px; color:#333; line-height:1.55; margin:16px 0 8px;">
                Notamos que dejaste algunos productos en tu carrito. ¡Aún están disponibles!
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:10px;">
                ${itemsHTML || `
                  <tr><td style="font-size:14px;color:#666;">(No pudimos listar productos. Abre tu carrito para verlos.)</td></tr>
                `}
              </table>

              ${subtotalHTML}

              <div style="text-align:center; margin:24px 0 8px;">
                <a href="${FRONTEND_URL}/carrito" target="_blank"
                   style="display:inline-block; padding:14px 24px; background:#2563EB; color:#fff; border-radius:8px; text-decoration:none; font-weight:700;">
                  Completar compra
                </a>
              </div>
              <div style="text-align:center; margin-top:6px;">
                <a href="${FRONTEND_URL}" target="_blank" style="font-size:13px; color:#2563EB; text-decoration:none;">
                  Seguir viendo
                </a>
              </div>

              <p style="font-size:13px; color:#666; line-height:1.55; margin-top:18px;">
                Disponibilidad y precios sujetos a cambios. Si necesitas ayuda, visita
                <a href="${soporteUrl}" target="_blank" style="color:#2563EB; text-decoration:none;">Soporte</a>.
              </p>
            </td>
          </tr>
          <tr>
            <td style="text-align:center; color:#9aa3af; font-size:12px; padding:16px 8px;">
              © ${new Date().getFullYear()} Tu Aplicación. Todos los derechos reservados.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    "Tu carrito te espera",
    "Aún guardamos tus productos. Completa tu compra:",
    `${FRONTEND_URL}/carrito`,
    "",
    (items || []).map(it => `• ${it.nombre}${it.cantidad ? ` x${it.cantidad}` : ""}${typeof it.precio !== "undefined" ? ` — ${formatCurrency(it.precio, currency)}` : ""}${it.link ? ` (${it.link})` : ""}`).join("\n")
  ].filter(Boolean).join("\n");

  try {
    await transporter.sendMail({
      from: `"Soporte" <${EMAIL_USER}>`,
      to: destinatario,
      subject: asunto,
      html,
      text,
    });
  } catch (err) {
    console.error("Error al enviar correo de carrito:", err.message);
    throw err;
  }
}

async function enviarCorreoRecordatorio(destinatario, productoNombre, productoLink) {
  try {
    const info = await transporter.sendMail({
      from: `"Soporte" <${EMAIL_USER}>`,
      to: destinatario,
      subject: "¡No olvides los productos de tu lista de deseos!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; background-color: #f4f4f4; border-radius: 8px;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            <h2 style="color: #333333; text-align: center;">¡No olvides tu lista de deseos!</h2>
            <p style="font-size: 16px; color: #555555;">
              <strong>Productos: ${productoNombre}</strong>
            </p>
            <div style="text-align: center; margin: 10px 0;">
              <img src="${productoLink}" alt="${productoNombre}" style="width:100px; height:auto; display:block; margin: 0 auto;" />
            </div>
            <p style="font-size: 16px; color: #555555;">
              Parece que tienes algunos productos en tu lista de deseos que aún no has revisado.
            </p>
            <p style="font-size: 16px; color: #555555;">
              Vuelve y echa un vistazo para no perder la oportunidad.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${FRONTEND_URL}/wishlist" 
                style="padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Ver mi lista de deseos
              </a>
            </div>
          </div>
          <p style="font-size: 12px; color: #aaaaaa; text-align: center; margin-top: 20px;">
            © ${new Date().getFullYear()} Tu Aplicación. Todos los derechos reservados.
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Error al enviar correo recordatorio:", error.message);
    throw error;
  }
}

function programarCorreoCarritoNextDay(destinatario, items = [], options = {}) {
  const MS_24H =  24*60 * 60 * 1000; //24 horas
  const itemsCopy = Array.isArray(items) ? JSON.parse(JSON.stringify(items)) : [];
  const optionsCopy = { ...(options || {}) };

  const timer = setTimeout(async () => {
    try {
      enviarCorreoCarrito(destinatario, itemsCopy, optionsCopy);
    } catch (err) {
      console.error("Error al enviar recordatorio de carrito (día siguiente):", err?.message || err);
    }
  }, MS_24H);

  return timer;
}

function programarRecordatorio(usuarioEmail, productoNombre, productoLink) {
  setTimeout(() => {
    enviarCorreoRecordatorio(usuarioEmail, productoNombre, productoLink);
  }, 60 * 60 * 1000); // 1 hora
}


module.exports = { enviarCorreoCarrito, enviarCorreoRecordatorio, programarRecordatorio, programarCorreoCarritoNextDay  };
