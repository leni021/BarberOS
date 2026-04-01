// ========================================
// DEV-TOOLS.JS - Herramientas de Desarrollo
// Solo para uso interno. No exponer al usuario final.
// Depende de: storage.js, auth.js (hashearPassword, generarSalt)
// ========================================

async function inyectarCredencialesPrueba() {
  if (typeof hashearPassword !== "function" || typeof generarSalt !== "function") {
    alert("Error: auth.js debe estar cargado para usar esta función.");
    return;
  }

  let saltPrueba = generarSalt();
  let hashPrueba = await hashearPassword("admin", saltPrueba);

  let adminAccount = {
    email:        "admin@barbeos.local",
    ownerName:    "Admin Prueba",
    passwordHash: hashPrueba,
    passwordSalt: saltPrueba
  };

  let businessProfile = {
    businessName: "Barbería Local (Test)",
    phone:        "0000-0000",
    address:      "Entorno Local"
  };

  storageSetItem("barbeos_admin",        JSON.stringify(adminAccount));
  storageSetItem("barbeos_business",     JSON.stringify(businessProfile));
  storageSetItem("barbeos_migracion_v1", "true");

  let cuentaLegada = {
    negocio:   businessProfile.businessName,
    dueno:     adminAccount.ownerName,
    email:     adminAccount.email,
    password:  "[PROTECTED]",
    telefono:  businessProfile.phone,
    direccion: businessProfile.address
  };
  storageSetItem("datosBarberia", JSON.stringify(cuentaLegada));

  // Creamos licencia trial desde hoy para las pruebas
  crearLicenciaTrial();

  alert("Credenciales de prueba inyectadas.\nCorreo: admin@barbeos.local\nClave: admin");
  if (typeof mostrarConfiguracion === "function") mostrarConfiguracion();
}

function restablecerInstalacionLimpia() {
  let confirmar = confirm("Atención: Esto borrará toda la aplicación. ¿Estás seguro?");
  if (confirmar) {
    [
      "barbeos_admin", "barbeos_business", "barbeos_license",
      "barbeos_migracion_v1", "datosBarberia", "sesionActiva",
      "clientes", "barberos", "servicios", "turnos"
    ].forEach(k => storageRemoveItem(k));
    alert("Instalación limpia completada.");
    window.location.href = "login.html";
  }
}
