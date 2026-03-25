// ========================================
// AUTH.JS - Autenticación Segura v2
// Usa Web Crypto API (SHA-256 + salt)
// ========================================
 
document.addEventListener("DOMContentLoaded", () => {
  const btnEntrar    = document.getElementById("btnEntrar");
  const btnRegistrar = document.getElementById("btnRegistrar");
 
  if (btnEntrar)    btnEntrar.addEventListener("click",    iniciarSesion);
  if (btnRegistrar) btnRegistrar.addEventListener("click", registrarBarberia);
});
 
// ========================================
// UTILIDADES CRIPTOGRÁFICAS
// ========================================
function generarSalt() {
  let array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, "0")).join("");
}
 
async function hashearPassword(password, salt) {
  let encoder    = new TextEncoder();
  let data       = encoder.encode(password + salt);
  let hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
              .map(b => b.toString(16).padStart(2, "0"))
              .join("");
}
 
// ========================================
// INICIO DE SESIÓN
// ========================================
async function iniciarSesion() {
  let emailInput    = document.getElementById("loginEmail").value.trim();
  let passwordInput = document.getElementById("loginPassword").value.trim();
  let mensajeError  = document.getElementById("mensajeError");
  let btnEntrar     = document.getElementById("btnEntrar");
 
  if (mensajeError) mensajeError.style.display = "none";
 
  if (!emailInput || !passwordInput) {
    mostrarError(mensajeError, "Por favor, ingresa tu correo y contraseña.");
    return;
  }
 
  if (btnEntrar) btnEntrar.disabled = true;
 
  let datosAdmin = localStorage.getItem("barbeos_admin");
 
  if (datosAdmin) {
    let admin = JSON.parse(datosAdmin);
 
    if (admin.password && !admin.passwordHash) {
      if (emailInput === admin.email && passwordInput === admin.password) {
        await migrarPasswordAHash(admin, passwordInput);
        localStorage.setItem("sesionActiva", "true");
        window.location.href = "index.html";
        return;
      } else {
        mostrarError(mensajeError, "Correo o contraseña incorrectos.");
        if (btnEntrar) btnEntrar.disabled = false;
        return;
      }
    }
 
    if (emailInput !== admin.email) {
      mostrarError(mensajeError, "Correo o contraseña incorrectos.");
      if (btnEntrar) btnEntrar.disabled = false;
      return;
    }
 
    let hashIngresado = await hashearPassword(passwordInput, admin.passwordSalt);
 
    if (hashIngresado === admin.passwordHash) {
      localStorage.setItem("sesionActiva", "true");
      window.location.href = "index.html";
    } else {
      mostrarError(mensajeError, "Correo o contraseña incorrectos.");
      if (btnEntrar) btnEntrar.disabled = false;
    }
    return;
  }
 
  let datosLegacy = localStorage.getItem("datosBarberia");
 
  if (datosLegacy) {
    let cuentaLegacy = JSON.parse(datosLegacy);
 
    if (emailInput === cuentaLegacy.email && passwordInput === cuentaLegacy.password) {
      await migrarPasswordAHash(cuentaLegacy, passwordInput);
      localStorage.setItem("sesionActiva", "true");
      window.location.href = "index.html";
    } else {
      mostrarError(mensajeError, "Correo o contraseña incorrectos.");
      if (btnEntrar) btnEntrar.disabled = false;
    }
    return;
  }
 
  mostrarError(mensajeError, "No hay cuenta registrada. Regístrate primero.");
  if (btnEntrar) btnEntrar.disabled = false;
}
 
// ========================================
// REGISTRO
// ========================================
async function registrarBarberia() {
  let negocio      = document.getElementById("regNegocio").value.trim();
  let dueno        = document.getElementById("regDueno").value.trim();
  let email        = document.getElementById("regEmail").value.trim();
  let password     = document.getElementById("regPassword").value.trim();
  let btnRegistrar = document.getElementById("btnRegistrar");
 
  if (!negocio || !dueno || !email || !password) {
    alert("Por favor, completa todos los campos para registrarte.");
    return;
  }
 
  if (password.length < 6) {
    alert("La contraseña debe tener al menos 6 caracteres.");
    return;
  }
 
  if (btnRegistrar) btnRegistrar.disabled = true;
 
  let salt = generarSalt();
  let hash = await hashearPassword(password, salt);
 
  let adminAccount = {
    email:        email,
    ownerName:    dueno,
    passwordHash: hash,
    passwordSalt: salt
  };
 
  let businessProfile = {
    businessName: negocio,
    phone:        "",
    address:      ""
  };
 
  localStorage.setItem("barbeos_admin",        JSON.stringify(adminAccount));
  localStorage.setItem("barbeos_business",     JSON.stringify(businessProfile));
  localStorage.setItem("barbeos_migracion_v1", "true");
 
  let cuentaLegada = {
    negocio:  negocio,
    dueno:    dueno,
    email:    email,
    password: "[PROTECTED]",
    telefono: "",
    direccion: ""
  };
  localStorage.setItem("datosBarberia", JSON.stringify(cuentaLegada));
 
  if (!localStorage.getItem("barbeos_license") && typeof crearLicenciaTrial === "function") {
    crearLicenciaTrial();
  }
 
  // ==== MENSAJE ACTUALIZADO ====
  alert("¡Barbería registrada con éxito! Ya podés iniciar sesión en tu sistema de gestión gratuito.");
  window.location.href = "login.html";
}
 
// ========================================
// HELPERS INTERNOS
// ========================================
function mostrarError(elemento, mensaje) {
  if (elemento) {
    elemento.innerText  = mensaje;
    elemento.style.display = "block";
  }
}
 
async function migrarPasswordAHash(cuentaVieja, passwordPlano) {
  let salt = generarSalt();
  let hash = await hashearPassword(passwordPlano, salt);
 
  let adminActual = JSON.parse(localStorage.getItem("barbeos_admin") || "{}");
 
  adminActual.email        = cuentaVieja.email     || adminActual.email     || "";
  adminActual.ownerName    = cuentaVieja.dueno     || adminActual.ownerName || cuentaVieja.ownerName || "";
  adminActual.passwordHash = hash;
  adminActual.passwordSalt = salt;
 
  delete adminActual.password;
 
  localStorage.setItem("barbeos_admin",        JSON.stringify(adminActual));
  localStorage.setItem("barbeos_migracion_v1", "true");
 
  let legacyActual  = JSON.parse(localStorage.getItem("datosBarberia") || "{}");
  legacyActual.password = "[PROTECTED]";
  localStorage.setItem("datosBarberia", JSON.stringify(legacyActual));
 
  console.log("Contraseña migrada a hash SHA-256 con éxito.");
}