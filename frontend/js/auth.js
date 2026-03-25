// ========================================
// AUTH.JS - Autenticacion Segura v2
// Usa Web Crypto API (PBKDF2-SHA256)
// ========================================

const CLAVE_VERSION_APP = "barbeos_app_version";
const ALGORITMO_HASH_V1 = "sha256-v1";
const ALGORITMO_HASH_V2 = "pbkdf2-sha256";
const ITERACIONES_PBKDF2 = 210000;

function obtenerVersionDesdeURL() {
  let query = new URLSearchParams(window.location.search || "");
  return (query.get("v") || "").trim();
}

function obtenerVersionAppActual() {
  let versionUrl = obtenerVersionDesdeURL();
  if (versionUrl) {
    localStorage.setItem(CLAVE_VERSION_APP, versionUrl);
    return versionUrl;
  }

  return (localStorage.getItem(CLAVE_VERSION_APP) || "").trim();
}

function construirRutaConVersion(rutaBase) {
  let version = obtenerVersionAppActual();
  if (!version) return rutaBase;
  return `${rutaBase}?v=${encodeURIComponent(version)}`;
}

function mostrarVersionEnPantallaAuth() {
  let etiqueta = document.getElementById("appVersionLabel");
  if (!etiqueta) return;

  let version = obtenerVersionAppActual();
  etiqueta.textContent = version
    ? `Version instalada: ${version}`
    : "Version instalada: desconocida";
}

function leerJSONSeguro(clave, fallback) {
  try {
    let raw = localStorage.getItem(clave);
    if (!raw) return fallback;
    let parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch (_error) {
    return fallback;
  }
}

// ========================================
// UTILIDADES CRIPTOGRAFICAS
// ========================================
function generarSalt() {
  let array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function hashearPassword(password, salt) {
  let encoder = new TextEncoder();
  let data = encoder.encode(password + salt);
  let hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hashearPasswordPBKDF2(password, salt, iteraciones = ITERACIONES_PBKDF2) {
  let encoder = new TextEncoder();
  let materialClave = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  let bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      iterations: Number(iteraciones) || ITERACIONES_PBKDF2,
      hash: "SHA-256"
    },
    materialClave,
    256
  );

  return Array.from(new Uint8Array(bits))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// ========================================
// INICIO DE SESION
// ========================================
async function iniciarSesion() {
  let emailInput = document.getElementById("loginEmail").value.trim();
  let passwordInput = document.getElementById("loginPassword").value.trim();
  let recordarSesion = document.getElementById("recordarSesion");
  let mantenerSesion = recordarSesion ? recordarSesion.checked : false;
  let mensajeError = document.getElementById("mensajeError");
  let btnEntrar = document.getElementById("btnEntrar");

  if (mensajeError) mensajeError.style.display = "none";

  if (!emailInput || !passwordInput) {
    mostrarError(mensajeError, "Por favor, ingresa tu correo y contrasena.");
    return;
  }

  if (btnEntrar) btnEntrar.disabled = true;

  let admin = leerJSONSeguro("barbeos_admin", null);

  if (admin) {
    if (admin.password && !admin.passwordHash) {
      if (emailInput === admin.email && passwordInput === admin.password) {
        await migrarPasswordAHash(admin, passwordInput);
        localStorage.setItem("sesionActiva", "true");
        localStorage.setItem("sesionRecordada", mantenerSesion ? "true" : "false");
        window.location.href = construirRutaConVersion("index.html");
        return;
      }

      mostrarError(mensajeError, "Correo o contrasena incorrectos.");
      if (btnEntrar) btnEntrar.disabled = false;
      return;
    }

    if (emailInput !== admin.email) {
      mostrarError(mensajeError, "Correo o contrasena incorrectos.");
      if (btnEntrar) btnEntrar.disabled = false;
      return;
    }

    let algoritmo = admin.passwordAlgo || ALGORITMO_HASH_V1;
    let hashIngresado = "";

    if (algoritmo === ALGORITMO_HASH_V2) {
      hashIngresado = await hashearPasswordPBKDF2(passwordInput, admin.passwordSalt, admin.passwordIteraciones);
    } else {
      hashIngresado = await hashearPassword(passwordInput, admin.passwordSalt);
    }

    if (hashIngresado === admin.passwordHash) {
      if (algoritmo !== ALGORITMO_HASH_V2) {
        await migrarPasswordAHash(admin, passwordInput);
      }
      localStorage.setItem("sesionActiva", "true");
      localStorage.setItem("sesionRecordada", mantenerSesion ? "true" : "false");
      window.location.href = construirRutaConVersion("index.html");
    } else {
      mostrarError(mensajeError, "Correo o contrasena incorrectos.");
      if (btnEntrar) btnEntrar.disabled = false;
    }
    return;
  }

  let cuentaLegacy = leerJSONSeguro("datosBarberia", null);

  if (cuentaLegacy) {
    if (emailInput === cuentaLegacy.email && passwordInput === cuentaLegacy.password) {
      await migrarPasswordAHash(cuentaLegacy, passwordInput);
      localStorage.setItem("sesionActiva", "true");
      localStorage.setItem("sesionRecordada", mantenerSesion ? "true" : "false");
      window.location.href = construirRutaConVersion("index.html");
    } else {
      mostrarError(mensajeError, "Correo o contrasena incorrectos.");
      if (btnEntrar) btnEntrar.disabled = false;
    }
    return;
  }

  mostrarError(mensajeError, "No hay cuenta registrada. Registrate primero.");
  if (btnEntrar) btnEntrar.disabled = false;
}

// ========================================
// REGISTRO
// ========================================
async function registrarBarberia() {
  let negocio = document.getElementById("regNegocio").value.trim();
  let dueno = document.getElementById("regDueno").value.trim();
  let email = document.getElementById("regEmail").value.trim();
  let password = document.getElementById("regPassword").value.trim();
  let btnRegistrar = document.getElementById("btnRegistrar");

  if (!negocio || !dueno || !email || !password) {
    alert("Por favor, completa todos los campos para registrarte.");
    return;
  }

  if (password.length < 6) {
    alert("La contrasena debe tener al menos 6 caracteres.");
    return;
  }

  if (btnRegistrar) btnRegistrar.disabled = true;

  let salt = generarSalt();
  let hash = await hashearPasswordPBKDF2(password, salt, ITERACIONES_PBKDF2);

  let adminAccount = {
    email: email,
    ownerName: dueno,
    passwordHash: hash,
    passwordSalt: salt,
    passwordAlgo: ALGORITMO_HASH_V2,
    passwordIteraciones: ITERACIONES_PBKDF2
  };

  let businessProfile = {
    businessName: negocio,
    phone: "",
    address: ""
  };

  localStorage.setItem("barbeos_admin", JSON.stringify(adminAccount));
  localStorage.setItem("barbeos_business", JSON.stringify(businessProfile));
  localStorage.setItem("barbeos_migracion_v1", "true");

  let cuentaLegada = {
    negocio: negocio,
    dueno: dueno,
    email: email,
    password: "[PROTECTED]",
    telefono: "",
    direccion: ""
  };
  localStorage.setItem("datosBarberia", JSON.stringify(cuentaLegada));

  if (!localStorage.getItem("barbeos_license") && typeof crearLicenciaTrial === "function") {
    crearLicenciaTrial();
  }

  alert("Barberia registrada con exito. Ya podes iniciar sesion en tu sistema de gestion gratuito.");
  window.location.href = construirRutaConVersion("login.html");
}

// ========================================
// HELPERS INTERNOS
// ========================================
function mostrarError(elemento, mensaje) {
  if (elemento) {
    elemento.innerText = mensaje;
    elemento.style.display = "block";
  }
}

async function migrarPasswordAHash(cuentaVieja, passwordPlano) {
  let salt = generarSalt();
  let hash = await hashearPasswordPBKDF2(passwordPlano, salt, ITERACIONES_PBKDF2);

  let adminActual = leerJSONSeguro("barbeos_admin", {});

  adminActual.email = cuentaVieja.email || adminActual.email || "";
  adminActual.ownerName = cuentaVieja.dueno || adminActual.ownerName || cuentaVieja.ownerName || "";
  adminActual.passwordHash = hash;
  adminActual.passwordSalt = salt;
  adminActual.passwordAlgo = ALGORITMO_HASH_V2;
  adminActual.passwordIteraciones = ITERACIONES_PBKDF2;

  delete adminActual.password;

  localStorage.setItem("barbeos_admin", JSON.stringify(adminActual));
  localStorage.setItem("barbeos_migracion_v1", "true");

  let legacyActual = leerJSONSeguro("datosBarberia", {});
  legacyActual.password = "[PROTECTED]";
  localStorage.setItem("datosBarberia", JSON.stringify(legacyActual));
}

document.addEventListener("DOMContentLoaded", () => {
  const formLogin = document.getElementById("formLogin");
  const formRegistro = document.getElementById("formRegistro");
  const btnEntrar = document.getElementById("btnEntrar");
  const btnRegistrar = document.getElementById("btnRegistrar");

  mostrarVersionEnPantallaAuth();

  if (window.location.pathname.endsWith("/login.html") || window.location.pathname.endsWith("\\login.html") || window.location.pathname.includes("login.html")) {
    if (localStorage.getItem("sesionActiva") === "true" && localStorage.getItem("sesionRecordada") === "true") {
      window.location.href = construirRutaConVersion("index.html");
      return;
    }

    if (localStorage.getItem("sesionActiva") === "true" && localStorage.getItem("sesionRecordada") !== "true") {
      localStorage.removeItem("sesionActiva");
    }
  }

  if (formLogin) {
    formLogin.addEventListener("submit", (event) => {
      event.preventDefault();
      iniciarSesion();
    });
  }

  if (btnEntrar && !formLogin) btnEntrar.addEventListener("click", iniciarSesion);

  if (formRegistro) {
    formRegistro.addEventListener("submit", (event) => {
      event.preventDefault();
      registrarBarberia();
    });
  }

  if (btnRegistrar && !formRegistro) btnRegistrar.addEventListener("click", registrarBarberia);
});
