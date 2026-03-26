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

const CLAVE_VERSION_APP = "barbeos_app_version";

function obtenerVersionAppActual() {
  let query = new URLSearchParams(window.location.search || "");
  let versionDesdeUrl = (query.get("v") || "").trim();

  if (versionDesdeUrl) {
    localStorage.setItem(CLAVE_VERSION_APP, versionDesdeUrl);
    return versionDesdeUrl;
  }

  return (localStorage.getItem(CLAVE_VERSION_APP) || "").trim();
}

function construirRutaConVersion(rutaBase) {
  let version = obtenerVersionAppActual();
  if (!version) return rutaBase;
  return `${rutaBase}?v=${encodeURIComponent(version)}`;
}

function mostrarVersionEnSidebar() {
  let etiqueta = document.getElementById("appVersionSidebar");
  if (!etiqueta) return;

  let version = obtenerVersionAppActual();
  etiqueta.textContent = version ? `Version ${escaparHTML(version)}` : "Version desconocida";
}



// ========================================
// 1. GUARDIA DE SEGURIDAD
// ========================================
if (typeof verificarSesionActiva === "function") {
  verificarSesionActiva();
} else if (localStorage.getItem("sesionActiva") !== "true") {
  window.location.href = construirRutaConVersion("login.html");
}



// ========================================
// 2. DATOS GLOBALES
// ========================================
let cuentaActual = obtenerCuentaActual();
let turnos = obtenerTurnos();
let barberos = obtenerBarberos();
let servicios = obtenerServicios();
let clientes = obtenerClientes();

const CLAVE_MODO_UI = "barbeos_ui_modo";



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
  localStorage.removeItem("sesionRecordada");
  window.location.href = construirRutaConVersion("login.html");
}

function obtenerModoOscuroActivo() {
  return localStorage.getItem(CLAVE_MODO_UI) === "oscuro";
}

function actualizarTextoBotonModoOscuro() {
  let btn = document.getElementById("btnModoOscuro");
  if (!btn) return;
  let modoOscuroActivo = obtenerModoOscuroActivo();

  btn.classList.toggle("activo", modoOscuroActivo);

  btn.title = modoOscuroActivo ? "Cambiar a modo claro" : "Cambiar a modo oscuro";
  btn.setAttribute("aria-label", btn.title);
}

function aplicarModoOscuro(activar) {
  if (activar) {
    document.body.classList.add("modo-oscuro");
    localStorage.setItem(CLAVE_MODO_UI, "oscuro");
  } else {
    document.body.classList.remove("modo-oscuro");
    localStorage.setItem(CLAVE_MODO_UI, "claro");
  }

  actualizarTextoBotonModoOscuro();
}

function alternarModoOscuro() {
  aplicarModoOscuro(!obtenerModoOscuroActivo());
}



// ========================================
// 4. MENÚ LATERAL
// ========================================
function conectarMenuLateral() {
  const btnAgenda = document.getElementById("btnAgenda");
  const btnClientes = document.getElementById("btnClientes");
  const btnBarberos = document.getElementById("btnBarberos");
  const btnServicios = document.getElementById("btnServicios");
  const btnProductos = document.getElementById("btnProductos");
  const btnCierreCaja = document.getElementById("btnCierreCaja");
  const btnPro = document.getElementById("btnPro");
  const btnConfiguracion = document.getElementById("btnConfiguracion");
  const btnCerrarSesion = document.getElementById("btnCerrarSesion");
  const btnModoOscuro = document.getElementById("btnModoOscuro");

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

  if (btnProductos && typeof mostrarProductos === "function") {
    btnProductos.addEventListener("click", mostrarProductos);
  }

  if (btnCierreCaja && typeof mostrarCierreCaja === "function") {
    btnCierreCaja.addEventListener("click", mostrarCierreCaja);
  }

  if (btnPro && typeof mostrarPro === "function") {
    btnPro.addEventListener("click", mostrarPro);
  }

  if (btnConfiguracion) {
    btnConfiguracion.addEventListener("click", mostrarConfiguracion);
  }

  if (btnCerrarSesion) {
    btnCerrarSesion.addEventListener("click", cerrarSesion);
  }

  if (btnModoOscuro) {
    btnModoOscuro.addEventListener("click", alternarModoOscuro);
  }
}


// ========================================
// 5. INICIALIZACIÓN DE LA APP
// ========================================
aplicarModoOscuro(obtenerModoOscuroActivo());
conectarMenuLateral();
mostrarVersionEnSidebar();
mostrarAgenda();