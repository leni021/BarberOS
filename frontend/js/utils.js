// ========================================
// UTILS.JS - Utilidades Compartidas
// Sin dependencias externas.
// Debe cargarse antes de cualquier módulo.
// ========================================


// ── Seguridad ────────────────────────────────────────────────────────────────

// Escapa caracteres especiales HTML para prevenir XSS.
// Usada en todos los módulos al renderizar datos del usuario.
function escaparHTML(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}


// ── Formato de Moneda ─────────────────────────────────────────────────────────

// Formatea un número como moneda en pesos argentinos (ARS).
// Reemplaza: formatearMonedaConfig, formatearMonedaCaja,
//            formatearMonedaAgenda, formatearPrecioServicio
// Para adaptar a otro mercado: cambiar solo "es-AR" y "ARS" aquí.
function formatearMoneda(valor) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(Number(valor) || 0);
}


// ── Formato de Fecha ──────────────────────────────────────────────────────────

// Convierte una fecha ISO "YYYY-MM-DD" al formato legible "DD/MM/YYYY".
// Si la fecha está vacía o no es válida, devuelve "Sin registro".
function formatearFecha(fecha) {
  if (!fecha) return "Sin registro";
  if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    let [anio, mes, dia] = fecha.split("-");
    return `${dia}/${mes}/${anio}`;
  }
  return fecha;
}
