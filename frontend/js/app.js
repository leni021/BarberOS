// ========================================
// BARBEROS - APP PRINCIPAL
// ========================================

function escaparHTML(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}



// ========================================
// 1. GUARDIA DE SEGURIDAD
// ========================================
if (typeof verificarSesionActiva === "function") {
  verificarSesionActiva();
} else if (localStorage.getItem("sesionActiva") !== "true") {
  window.location.href = "login.html";
}



// ========================================
// 2. DATOS GLOBALES
// ========================================
let cuentaActual = obtenerCuentaActual();
let turnos = obtenerTurnos();
let barberos = obtenerBarberos();
let servicios = obtenerServicios();
let clientes = obtenerClientes();



// ========================================
// 3. FUNCIONES GENERALES
// ========================================
function recargarDatos() {
  cuentaActual = obtenerCuentaActual();
  turnos = obtenerTurnos();
  barberos = obtenerBarberos();
  servicios = obtenerServicios();
  clientes = obtenerClientes();
}

function cerrarSesion() {
  localStorage.removeItem("sesionActiva");
  window.location.href = "login.html";
}



// ========================================
// 4. MENÚ LATERAL
// ========================================
function conectarMenuLateral() {
  const btnAgenda = document.getElementById("btnAgenda");
  const btnClientes = document.getElementById("btnClientes");
  const btnBarberos = document.getElementById("btnBarberos");
  const btnServicios = document.getElementById("btnServicios");
  const btnConfiguracion = document.getElementById("btnConfiguracion");
  const btnCerrarSesion = document.getElementById("btnCerrarSesion");

  if (btnAgenda) {
    btnAgenda.addEventListener("click", mostrarAgenda);
  }

  if (btnClientes) {
    btnClientes.addEventListener("click", mostrarClientes);
  }

  if (btnBarberos) {
    btnBarberos.addEventListener("click", mostrarBarberos);
  }

  if (btnServicios) {
    btnServicios.addEventListener("click", mostrarServicios);
  }

  if (btnConfiguracion) {
    btnConfiguracion.addEventListener("click", mostrarConfiguracion);
  }

  if (btnCerrarSesion) {
    btnCerrarSesion.addEventListener("click", cerrarSesion);
  }
}


// ========================================
// 5. INICIALIZACIÓN DE LA APP
// ========================================
conectarMenuLateral();
mostrarAgenda();