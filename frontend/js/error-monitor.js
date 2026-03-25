// ========================================
// MONITOR GLOBAL DE ERRORES FRONTEND
// Se carga en todas las pantallas para registrar fallos en todas las instalaciones.
// ========================================

(function iniciarMonitorErroresFrontend() {
  let CLAVE_LOG_LOCAL = "barbeos_frontend_errors";
  let MAX_REGISTROS = 100;

  function guardarEventoLocal(tipo, detalle) {
    try {
      let actuales = [];
      let raw = localStorage.getItem(CLAVE_LOG_LOCAL);
      if (raw) {
        let parseado = JSON.parse(raw);
        if (Array.isArray(parseado)) actuales = parseado;
      }

      actuales.push({
        fecha: new Date().toISOString(),
        tipo,
        detalle: String(detalle || "").slice(0, 1200)
      });

      if (actuales.length > MAX_REGISTROS) {
        actuales = actuales.slice(actuales.length - MAX_REGISTROS);
      }

      localStorage.setItem(CLAVE_LOG_LOCAL, JSON.stringify(actuales));
    } catch (error) {
      console.error("[BARBEROS][FRONTEND] Fallo guardando log local:", error);
    }
  }

  window.addEventListener("error", (event) => {
    let mensaje = [
      event && event.message ? event.message : "Error JS sin mensaje",
      event && event.filename ? `archivo=${event.filename}` : "",
      Number.isFinite(event && event.lineno) ? `linea=${event.lineno}` : "",
      Number.isFinite(event && event.colno) ? `col=${event.colno}` : ""
    ].filter(Boolean).join(" | ");

    guardarEventoLocal("window.error", mensaje);
    console.error("[BARBEROS][FRONTEND]", mensaje);
  });

  window.addEventListener("unhandledrejection", (event) => {
    let motivo = event && event.reason ? String(event.reason) : "Promise rechazada sin detalle";
    guardarEventoLocal("window.unhandledrejection", motivo);
    console.error("[BARBEROS][FRONTEND]", `Promise rechazada: ${motivo}`);
  });
})();
