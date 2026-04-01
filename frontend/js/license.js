// ========================================
// LICENSE.JS - Sistema de Licencia Trial
// Depende de: storage.js, date-utils.js
// ========================================

const DIAS_TRIAL = 30;

// Crea una licencia trial nueva desde hoy.
// Llamada al registrar una cuenta nueva o al detectar instalación vieja sin licencia.
function crearLicenciaTrial() {
  let hoy      = obtenerFechaHoyISO();
  let fechaFin = sumarDiasAFecha(hoy, DIAS_TRIAL);

  let licencia = {
    status:        "trial",
    startDate:     hoy,
    endDate:       fechaFin,
    lastOpenDate:  hoy,
    activationKey: null  // reservado para activación futura
  };

  guardarLicense(licencia);
  console.log("Licencia trial creada:", licencia);
  return licencia;
}

// Verifica el estado de la licencia.
// Actualiza lastOpenDate si el acceso es válido.
// Retorna: { valida, estado, diasRestantes, mensaje }
//
// Estados posibles:
//   "active"       → licencia paga activada (futura)
//   "trial"        → prueba vigente
//   "vencida"      → los 30 días pasaron
//   "manipulacion" → el reloj del sistema fue movido hacia atrás
//   "sin_licencia" → no existe ninguna licencia
function verificarLicencia() {
  let licencia = obtenerLicense();

  // Sin licencia
  if (!licencia || licencia.status === "inactive" || !licencia.startDate) {
    return {
      valida:        false,
      estado:        "sin_licencia",
      diasRestantes: 0,
      mensaje:       "No hay licencia registrada."
    };
  }

  // Licencia activa permanente (preparada para activación futura)
  if (licencia.status === "active") {
    return {
      valida:        true,
      estado:        "active",
      diasRestantes: null,
      mensaje:       "Licencia activa."
    };
  }

  // ── TRIAL ────────────────────────────────────────────────────────────────
  let hoy      = obtenerFechaHoyISO();
  let lastOpen = licencia.lastOpenDate || licencia.startDate;
  let endDate  = licencia.endDate;

  // Detección simple de manipulación: el reloj fue movido hacia atrás
  if (hoy < lastOpen) {
    return {
      valida:        false,
      estado:        "manipulacion",
      diasRestantes: 0,
      mensaje:       "Se detectó un cambio en la fecha del sistema. Contactá al proveedor para resolver esto."
    };
  }

  // Trial vencido
  if (hoy > endDate) {
    return {
      valida:        false,
      estado:        "vencida",
      diasRestantes: 0,
      mensaje:       "El período de prueba gratuita de 30 días ha finalizado."
    };
  }

  // Trial válido → actualizamos lastOpenDate y guardamos
  let diasRestantes     = calcularDiasEntre(hoy, endDate);
  licencia.lastOpenDate = hoy;
  guardarLicense(licencia);

  return {
    valida:        true,
    estado:        "trial",
    diasRestantes: diasRestantes,
    mensaje:       diasRestantes === 1
                     ? "Queda 1 día de prueba gratuita."
                     : `Quedan ${diasRestantes} días de prueba gratuita.`
  };
}

// ── Auto-creación de licencia para instalaciones existentes sin licencia ──
// Se ejecuta una sola vez al cargar este módulo.
// Si hay cuenta pero no hay licencia, la crea automáticamente.
(function _inicializarLicencia() {
  let licenciaActual = storageGetItem("barbeos_license");
  let hayAdmin       = storageGetItem("barbeos_admin") || storageGetItem("datosBarberia");

  if (hayAdmin && !licenciaActual) {
    console.log("Cuenta existente sin licencia detectada. Creando trial automáticamente.");
    crearLicenciaTrial();
  }
})();
