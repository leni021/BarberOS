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

function abrirWhatsAppWebOnePage() {
  let numero = limpiarNumeroWhatsApp(obtenerWhatsAppProPrivado());
  if (!numero) {
    alert("Canal de contacto no disponible por el momento.");
    return;
  }

  let negocio = obtenerCuentaActual().negocio || "mi negocio";
  let texto = encodeURIComponent(`Hola, quiero información sobre una página web para ${negocio}.`);
  window.open(`https://wa.me/${numero}?text=${texto}`, "_blank");
}

function mostrarPro() {
  document.getElementById("contenido").innerHTML = `
    <h1>BarberOS PRO</h1>

    <div id="cardProPrincipal" class="pro-hero">
      <h3 class="pro-hero-titulo">Automatización PRO + Presencia Online</h3>
      <p class="pro-hero-descripcion">
        Potenciá tu barbería con herramientas que trabajan por vos: recordatorios automáticos por WhatsApp, confirmaciones, seguimiento de clientes y tu propia página web. Actualmente en desarrollo — contactanos para acceso anticipado.
      </p>
      <button id="btnActivarPro" class="pro-btn-cta">
        Quiero activar BarberOS PRO
      </button>
      <div class="pro-badge-pronto">
        Automatización PRO por WhatsApp — próximamente disponible
      </div>
    </div>

    <div id="gridProBeneficios" class="pro-grid">

      <div class="pro-card">
        <h4 class="pro-card-titulo">Automatización PRO (WhatsApp)</h4>
        <ul class="pro-card-lista">
          <li>Recordatorios automáticos antes del turno.</li>
          <li>Confirmación y cancelación con un clic.</li>
          <li>Mensaje post-turno para que el cliente vuelva a reservar.</li>
          <li>Relleno de huecos por cancelaciones con clientes en espera.</li>
          <li>Ofertas automáticas para clientes que hace tiempo no vuelven.</li>
        </ul>
      </div>

      <div class="pro-card">
        <h4 class="pro-card-titulo">Estadísticas PRO</h4>
        <ul class="pro-card-lista">
          <li>Porcentaje de clientes que reservaron pero no asistieron.</li>
          <li>Clientes que no volvieron en 30 / 60 días.</li>
          <li>Facturación por barbero y por servicio.</li>
          <li>Horas pico y ocupación real de agenda.</li>
          <li>Proyección simple de ingresos del mes.</li>
        </ul>
      </div>

      <div class="pro-card pro-card-web">
        <h4 class="pro-card-titulo">Presencia Online (One Page)</h4>
        <p class="pro-card-texto">
          Creamos tu página web profesional para mostrar servicios, horarios, ubicación, galería y botón directo a WhatsApp. Ideal para negocios que quieren verse profesionales sin complicaciones técnicas.
        </p>
        <button id="btnInfoWebOnePage" class="pro-btn-web">
          Quiero información sobre la página web
        </button>
      </div>

      <div class="pro-card pro-card-roadmap">
        <h4 class="pro-card-titulo">Roadmap Futuro</h4>
        <p class="pro-card-texto">
          Evaluamos integraciones avanzadas según la recepción del producto y la demanda real de los clientes. Tu feedback es lo que define las próximas funciones.
        </p>
      </div>

    </div>
  `;

  let btnActivarPro = document.getElementById("btnActivarPro");
  if (btnActivarPro) {
    btnActivarPro.addEventListener("click", abrirWhatsAppPro);
  }

  let btnInfoWebOnePage = document.getElementById("btnInfoWebOnePage");
  if (btnInfoWebOnePage) {
    btnInfoWebOnePage.addEventListener("click", abrirWhatsAppWebOnePage);
  }
}
