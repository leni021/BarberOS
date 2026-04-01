// ========================================
// DATE-UTILS.JS - Utilidades de Fecha
// Sin dependencias externas.
// ========================================

// Devuelve la fecha de hoy como "YYYY-MM-DD" (hora local, no UTC)
function obtenerFechaHoyISO() {
  let hoy = new Date();
  let y   = hoy.getFullYear();
  let m   = String(hoy.getMonth() + 1).padStart(2, "0");
  let d   = String(hoy.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Suma N días a una fecha ISO y devuelve otra fecha ISO
function sumarDiasAFecha(fechaISO, dias) {
  let fecha = new Date(fechaISO + "T00:00:00");
  fecha.setDate(fecha.getDate() + dias);
  let y = fecha.getFullYear();
  let m = String(fecha.getMonth() + 1).padStart(2, "0");
  let d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Días que faltan desde "desde" hasta "hasta" (ambas ISO "YYYY-MM-DD")
function calcularDiasEntre(desde, hasta) {
  let d1   = new Date(desde + "T00:00:00");
  let d2   = new Date(hasta + "T00:00:00");
  let diff = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}
