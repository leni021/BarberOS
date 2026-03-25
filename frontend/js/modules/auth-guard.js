// ========================================
// AUTH-GUARD.JS - Guardia de Sesión
// Verifica sesión activa. Permite uso gratuito SIEMPRE.
// ========================================

function verificarSesionActiva() {
  if (localStorage.getItem("sesionActiva") !== "true") {
    window.location.href = "login.html";
    return false;
  }
  return true;
}