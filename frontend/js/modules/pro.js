// ========================================
// MODULO: BARBEROS PRO
// ========================================

// Contacto PRO privado (editar solo por el dueño en este archivo)
const WHATSAPP_PRO_PRIVADO = "+541178980792";

function limpiarNumeroWhatsApp(valor) {
  return String(valor || "").replace(/[^\d]/g, "");
}

function obtenerWhatsAppProPrivado() {
  return WHATSAPP_PRO_PRIVADO;
}

function abrirWhatsAppPro() {
  let numero = limpiarNumeroWhatsApp(obtenerWhatsAppProPrivado());
  if (!numero) {
    alert("Canal de contacto PRO no disponible por el momento.");
    return;
  }

  let negocio = obtenerCuentaActual().negocio || "mi negocio";
  let texto = encodeURIComponent(`Hola, quiero activar BarberOS PRO para ${negocio}.`);
  window.open(`https://wa.me/${numero}?text=${texto}`, "_blank");
}

function mostrarPro() {
  document.getElementById("contenido").innerHTML = `
    <h1>BarberOS PRO</h1>

    <div id="cardProPrincipal" style="background: linear-gradient(135deg, #111827, #0f766e); color: #ecfeff; padding: 22px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 8px 18px rgba(0,0,0,0.14);">
      <h3 style="margin-top: 0; color: #fde68a;">Estadísticas PRO + Automatización PRO</h3>
      <p style="margin-bottom: 10px; color: #cffafe;">
        BarberOS PRO incluirá estadísticas más completas para mejorar decisiones del negocio y automatización por WhatsApp para ahorrar tiempo operativo. El modelo de pago se habilitará en una actualización futura y actualmente estamos trabajando en su lanzamiento.
      </p>
      <button id="btnActivarPro" style="background: linear-gradient(135deg, #22d3ee, #2563eb); color: #f8fafc; font-weight: 700; border: 1px solid rgba(255,255,255,0.25); box-shadow: 0 6px 16px rgba(37,99,235,0.35);">
        Quiero activar BarberOS PRO
      </button>
      <div style="margin-top: 10px; font-size: 13px; color: #e5e7eb; background: rgba(15, 23, 42, 0.4); border: 1px solid rgba(148, 163, 184, 0.35); padding: 8px 10px; border-radius: 8px; display: inline-block;">
        Actualización futura en desarrollo: automatización PRO por WhatsApp.
      </div>
    </div>

    <div id="gridProBeneficios" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px; max-width: 900px;">
      <div style="background: white; border-radius: 8px; padding: 14px; box-shadow: 0 2px 6px rgba(0,0,0,0.08);">
        <h4 style="margin-top: 0; color: #0f172a;">Estadísticas PRO</h4>
        <ul style="color: #334155; line-height: 1.6; margin: 0; padding-left: 18px;">
          <li>Porcentaje de clientes que reservaron pero no asistieron (semanal y mensual).</li>
          <li>Clientes que no volvieron en 30/60 días.</li>
          <li>Facturación por barbero y por servicio.</li>
          <li>Horas pico y ocupación real de agenda.</li>
          <li>Proyección simple de ingresos del mes.</li>
        </ul>
      </div>

      <div style="background: white; border-radius: 8px; padding: 14px; box-shadow: 0 2px 6px rgba(0,0,0,0.08);">
        <h4 style="margin-top: 0; color: #0f172a;">Automatización PRO (WhatsApp)</h4>
        <ul style="color: #334155; line-height: 1.6; margin: 0; padding-left: 18px;">
          <li>Recordatorios automáticos antes del turno.</li>
          <li>Confirmación y cancelación en un clic.</li>
          <li>Mensajes después del turno para que el cliente vuelva a reservar.</li>
          <li>Relleno de horarios liberados por cancelaciones con clientes en espera.</li>
          <li>Ofertas automáticas para clientes antiguos que hace tiempo no vuelven.</li>
        </ul>
      </div>
    </div>
  `;

  let btnActivarPro = document.getElementById("btnActivarPro");
  if (btnActivarPro) {
    btnActivarPro.addEventListener("click", abrirWhatsAppPro);
  }
}
