// ========================================
// STORAGE.JS - Capa de Datos v2
// Contraseñas: hash+salt, nunca texto plano
// Licencias: sistema trial de 30 días
// ========================================
 
 
// ========================================
// 1. INICIALIZACIÓN Y MIGRACIÓN SILENCIOSA
// ========================================
function inicializarStorage() {
  let datosViejos    = localStorage.getItem("datosBarberia");
  let migracionHecha = localStorage.getItem("barbeos_migracion_v1");
 
  if (datosViejos && !migracionHecha) {
    try {
      let cuentaVieja = JSON.parse(datosViejos);
 
      let adminAccount = {
        email:     cuentaVieja.email    !== undefined ? cuentaVieja.email    : "",
        ownerName: cuentaVieja.dueno    !== undefined ? cuentaVieja.dueno    : "",
        password:  cuentaVieja.password !== undefined ? cuentaVieja.password : ""
      };
 
      let businessProfile = {
        businessName: cuentaVieja.negocio   !== undefined ? cuentaVieja.negocio   : "",
        phone:        cuentaVieja.telefono  !== undefined ? cuentaVieja.telefono  : "",
        address:      cuentaVieja.direccion !== undefined ? cuentaVieja.direccion : ""
      };
 
      localStorage.setItem("barbeos_admin",        JSON.stringify(adminAccount));
      localStorage.setItem("barbeos_business",     JSON.stringify(businessProfile));
      localStorage.setItem("barbeos_migracion_v1", "true");
      console.log("Migración de datos a v2 completada.");
    } catch (error) {
      console.error("Error migrando datos viejos:", error);
    }
  }
 
  // ── AUTO-CREACIÓN DE LICENCIA TRIAL ──────────────────────────────────
  // Si ya hay una cuenta registrada pero no existe licencia, la creamos
  // automáticamente UNA SOLA VEZ para no dejar instalaciones viejas rotas.
  let licenciaActual = localStorage.getItem("barbeos_license");
  let hayAdmin       = localStorage.getItem("barbeos_admin") || localStorage.getItem("datosBarberia");
 
  if (hayAdmin && !licenciaActual) {
    console.log("Cuenta existente sin licencia detectada. Creando trial automáticamente.");
    crearLicenciaTrial();
  }
}
 
 
// ========================================
// 2. FUNCIONES DE LA CAPA DE DATOS
// ========================================
function obtenerAdmin()                { return JSON.parse(localStorage.getItem("barbeos_admin"))    || {}; }
function guardarAdmin(adminData)       { localStorage.setItem("barbeos_admin",    JSON.stringify(adminData)); }
 
function obtenerBusiness()             { return JSON.parse(localStorage.getItem("barbeos_business")) || {}; }
function guardarBusiness(businessData) { localStorage.setItem("barbeos_business", JSON.stringify(businessData)); }
 
function obtenerLicense()              { return JSON.parse(localStorage.getItem("barbeos_license"))  || { status: "inactive" }; }
function guardarLicense(licenseData)   { localStorage.setItem("barbeos_license",  JSON.stringify(licenseData)); }
 
 
// ========================================
// 3. SISTEMA DE LICENCIA TRIAL
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
    activationKey: null       // reservado para activación futura
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
 
  // ── TRIAL ────────────────────────────────────────────────────────────
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
 
 
// ========================================
// 4. UTILIDADES DE FECHA
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
 
 
// ========================================
// 5. FUNCIONES DE COMPATIBILIDAD (PUENTE)
// ========================================
function obtenerCuentaActual() {
  if (localStorage.getItem("barbeos_migracion_v1") === "true") {
    let admin    = obtenerAdmin();
    let business = obtenerBusiness();
    return {
      email:     admin.email,
      dueno:     admin.ownerName,
      negocio:   business.businessName,
      telefono:  business.phone,
      direccion: business.address
      // "password" nunca se expone aquí
    };
  }
  let legacy = JSON.parse(localStorage.getItem("datosBarberia")) || {};
  delete legacy.password;
  return legacy;
}
 
function guardarCuentaActual(cuenta) {
  if (localStorage.getItem("barbeos_migracion_v1") === "true") {
    let business = obtenerBusiness();
    if (cuenta.negocio   !== undefined) business.businessName = cuenta.negocio;
    if (cuenta.telefono  !== undefined) business.phone        = cuenta.telefono;
    if (cuenta.direccion !== undefined) business.address      = cuenta.direccion;
    guardarBusiness(business);
 
    let legacyActual       = JSON.parse(localStorage.getItem("datosBarberia") || "{}");
    legacyActual.negocio   = business.businessName || "";
    legacyActual.telefono  = business.phone        || "";
    legacyActual.direccion = business.address      || "";
    legacyActual.password  = "[PROTECTED]";
    localStorage.setItem("datosBarberia", JSON.stringify(legacyActual));
  } else {
    localStorage.setItem("datosBarberia", JSON.stringify(cuenta));
  }
}
 
 
// ========================================
// 6. DATOS OPERATIVOS
// ========================================
function leerJSONStorage(clave, fallback) {
  try {
    let raw = localStorage.getItem(clave);
    if (!raw) return fallback;
    let parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch (error) {
    console.error(`Error leyendo ${clave} desde localStorage:`, error);
    return fallback;
  }
}

function obtenerTurnos() {
  let turnos = leerJSONStorage("turnos", []);
  return Array.isArray(turnos) ? turnos : [];
}
function guardarTurnos(t)    { localStorage.setItem("turnos",    JSON.stringify(t)); }
 
function obtenerBarberos() {
  let base = leerJSONStorage("barberos", ["Carlos", "Miguel", "Juan"]);
  if (!Array.isArray(base)) return ["Carlos", "Miguel", "Juan"];

  let resultado = [];
  let vistos = new Set();

  base.forEach((nombre) => {
    let limpio = String(nombre || "").trim();
    let clave = limpio.toLowerCase();
    if (limpio && !vistos.has(clave)) {
      vistos.add(clave);
      resultado.push(limpio);
    }
  });

  return resultado.length > 0 ? resultado : ["Carlos", "Miguel", "Juan"];
}
function guardarBarberos(b)  { localStorage.setItem("barberos",  JSON.stringify(b)); }
 
function normalizarPrecioServicio(precio) {
  let numero = Number(precio);
  if (!Number.isFinite(numero) || numero < 0) return 0;
  return Math.round(numero * 100) / 100;
}

function obtenerServiciosConPrecio() {
  let base = leerJSONStorage("servicios", ["Corte", "Barba", "Corte + barba"]);
  if (!Array.isArray(base)) base = ["Corte", "Barba", "Corte + barba"];

  let resultado = [];
  let vistos = new Set();

  base.forEach((servicio) => {
    let nombre = "";
    let precio = 0;

    if (typeof servicio === "string") {
      nombre = servicio.trim();
    } else if (servicio && typeof servicio === "object") {
      nombre = String(servicio.nombre || "").trim();
      precio = normalizarPrecioServicio(servicio.precio);
    }

    let clave = nombre.toLowerCase();
    if (nombre && !vistos.has(clave)) {
      vistos.add(clave);
      resultado.push({ nombre, precio });
    }
  });

  if (resultado.length === 0) {
    return [
      { nombre: "Corte", precio: 0 },
      { nombre: "Barba", precio: 0 },
      { nombre: "Corte + barba", precio: 0 }
    ];
  }

  return resultado;
}

function guardarServiciosConPrecio(serviciosConPrecio) {
  if (!Array.isArray(serviciosConPrecio)) {
    localStorage.setItem("servicios", JSON.stringify([]));
    return;
  }

  let limpios = serviciosConPrecio
    .map((servicio) => ({
      nombre: String(servicio && servicio.nombre ? servicio.nombre : "").trim(),
      precio: normalizarPrecioServicio(servicio && servicio.precio)
    }))
    .filter((servicio) => servicio.nombre !== "");

  localStorage.setItem("servicios", JSON.stringify(limpios));
}

function obtenerServicios() {
  return obtenerServiciosConPrecio().map((servicio) => servicio.nombre);
}

function guardarServicios(s) {
  if (!Array.isArray(s)) {
    localStorage.setItem("servicios", JSON.stringify([]));
    return;
  }

  // Compatibilidad: acepta array de strings o de objetos {nombre, precio}
  if (s.length > 0 && typeof s[0] === "object") {
    guardarServiciosConPrecio(s);
    return;
  }

  let conPrecio = s.map((nombre) => ({ nombre: String(nombre || "").trim(), precio: 0 }));
  guardarServiciosConPrecio(conPrecio);
}

function obtenerPrecioServicio(nombreServicio) {
  let nombreBuscado = String(nombreServicio || "").trim().toLowerCase();
  if (!nombreBuscado) return 0;

  let servicio = obtenerServiciosConPrecio().find((item) => item.nombre.toLowerCase() === nombreBuscado);
  return servicio ? normalizarPrecioServicio(servicio.precio) : 0;
}
 
function obtenerClientes() {
  let base = leerJSONStorage("clientes", []);
  if (!Array.isArray(base)) return [];

  let resultado = [];
  let vistos = new Set();

  base.forEach((cliente) => {
    if (!cliente || typeof cliente !== "object") return;

    let nombre = String(cliente.nombre || "").trim();
    if (!nombre) return;

    let clave = nombre.toLowerCase();
    if (vistos.has(clave)) return;

    vistos.add(clave);
    resultado.push({
      nombre,
      telefono: String(cliente.telefono || "").trim(),
      observaciones: String(cliente.observaciones || "").trim(),
      ultimaVisita: String(cliente.ultimaVisita || "").trim()
    });
  });

  return resultado;
}
function guardarClientes(c)  { localStorage.setItem("clientes",  JSON.stringify(c)); }
 
 
// ========================================
// 7. EXPORTACIÓN JSON (BACKUP)
// ========================================
function generarIdUnico(prefijo) {
  return prefijo + "_" + Math.random().toString(36).substr(2, 9) + "_" + Date.now();
}
 
function consolidarModeloRelacional() {
  let clientesAntiguos  = obtenerClientes();
  let barberosAntiguos  = obtenerBarberos();
  let serviciosAntiguos = obtenerServicios();
  let turnosAntiguos    = obtenerTurnos();
 
  let mapaClientes  = {};
  let mapaBarberos  = {};
  let mapaServicios = {};
 
  let barberosSaaS = barberosAntiguos.map(nombreBarb => {
    let id = generarIdUnico("barb");
    mapaBarberos[nombreBarb] = id;
    return { id, nombre: nombreBarb, activo: 1 };
  });
 
  let serviciosSaaS = serviciosAntiguos.map(nombreServ => {
    let id = generarIdUnico("serv");
    mapaServicios[nombreServ] = id;
    return { id, nombre: nombreServ };
  });
 
  let clientesSaaS = clientesAntiguos.map(cli => {
    let id = generarIdUnico("cli");
    mapaClientes[cli.nombre] = id;
    return {
      id,
      nombre:        cli.nombre,
      telefono:      cli.telefono      || "",
      observaciones: cli.observaciones || "",
      ultimaVisita:  cli.ultimaVisita  || ""
    };
  });
 
  let turnosSaaS = turnosAntiguos.map(turno => {
    let nombreClienteTurno = turno.cliente || turno.nombre;
    return {
      id:          generarIdUnico("tur"),
      cliente_id:  mapaClientes[nombreClienteTurno]  || null,
      barbero_id:  mapaBarberos[turno.barbero]        || null,
      servicio_id: mapaServicios[turno.servicio]      || null,
      fecha:       turno.fecha  || "1970-01-01",
      hora:        turno.hora   || "00:00",
      estado:      turno.estado || "Pendiente"
    };
  });
 
  let admin    = obtenerAdmin();
  let business = obtenerBusiness();
  let license  = obtenerLicense();
 
  // El backup exporta hash+salt, NUNCA la contraseña en texto plano
  let adminSeguro = {
    email:        admin.email        || "",
    ownerName:    admin.ownerName    || "",
    passwordHash: admin.passwordHash || null,
    passwordSalt: admin.passwordSalt || null
  };
 
  return {
    metadata:    { version: "2.0", fechaExportacion: new Date().toISOString() },
    cuenta:      { admin: adminSeguro, business, license },
    operaciones: { barberos: barberosSaaS, servicios: serviciosSaaS, clientes: clientesSaaS, turnos: turnosSaaS }
  };
}
 
function exportarBackupJSON() {
  let datosRelacionales = consolidarModeloRelacional();
  let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(datosRelacionales, null, 4));
  let a = document.createElement("a");
  a.setAttribute("href", dataStr);
  a.setAttribute("download", "BarbeOS_Backup.json");
  document.body.appendChild(a);
  a.click();
  a.remove();
}
 
 
// ========================================
// 8. IMPORTACIÓN (RESTAURAR BACKUP)
// ========================================
function restaurarBackupDesdeJSON(jsonString) {
  try {
    let data = JSON.parse(jsonString);
 
    if (!data.metadata || !data.cuenta || !data.operaciones || !data.operaciones.turnos) {
      console.error("Estructura JSON no reconocida.");
      return false;
    }
 
    let mapaClientes  = {};
    let mapaBarberos  = {};
    let mapaServicios = {};
 
    if (data.operaciones.clientes)  data.operaciones.clientes.forEach(c  => mapaClientes[c.id]  = c.nombre);
    if (data.operaciones.barberos)  data.operaciones.barberos.forEach(b  => mapaBarberos[b.id]  = b.nombre);
    if (data.operaciones.servicios) data.operaciones.servicios.forEach(s => mapaServicios[s.id] = s.nombre);
 
    let barberosPlanos  = data.operaciones.barberos  ? data.operaciones.barberos.map(b  => b.nombre) : [];
    let serviciosPlanos = data.operaciones.servicios ? data.operaciones.servicios.map(s => s.nombre) : [];
 
    let clientesPlanos = data.operaciones.clientes ? data.operaciones.clientes.map(c => ({
      nombre: c.nombre, telefono: c.telefono, observaciones: c.observaciones, ultimaVisita: c.ultimaVisita
    })) : [];
 
    let turnosPlanos = data.operaciones.turnos.map(t => ({
      cliente:  t.cliente_id  ? (mapaClientes[t.cliente_id]   || "Cliente Desconocido") : "Cliente Desconocido",
      fecha:    t.fecha,
      hora:     t.hora,
      barbero:  t.barbero_id  ? (mapaBarberos[t.barbero_id]   || "Barbero Eliminado")   : "Barbero Desconocido",
      servicio: t.servicio_id ? (mapaServicios[t.servicio_id] || "Servicio Eliminado")  : "Servicio Desconocido",
      estado:   t.estado
    }));
 
    let adminData    = data.cuenta.admin    || {};
    let businessData = data.cuenta.business || {};
 
    let adminRestaurado = {
      email:        adminData.email        || "",
      ownerName:    adminData.ownerName    || "",
      passwordHash: adminData.passwordHash || null,
      passwordSalt: adminData.passwordSalt || null
    };
 
    // Compatibilidad con backups v1 que tenían contraseña en texto plano
    if (!adminRestaurado.passwordHash && adminData.password && adminData.password !== "[PROTECTED]") {
      adminRestaurado.password = adminData.password;
    }
 
    guardarAdmin(adminRestaurado);
    guardarBusiness(businessData);
 
    // Restauramos la licencia del backup (respetamos fechas originales)
    if (data.cuenta.license) guardarLicense(data.cuenta.license);
 
    let cuentaLegada = {
      negocio:  businessData.businessName || "",
      dueno:    adminData.ownerName       || "",
      email:    adminData.email           || "",
      password: (adminData.password && adminData.password !== "[PROTECTED]")
                  ? adminData.password
                  : "[PROTECTED]",
      telefono:  businessData.phone    || "",
      direccion: businessData.address  || ""
    };
    localStorage.setItem("datosBarberia",        JSON.stringify(cuentaLegada));
    localStorage.setItem("barbeos_migracion_v1", "true");
 
    guardarBarberos(barberosPlanos);
    guardarServicios(serviciosPlanos);
    guardarClientes(clientesPlanos);
    guardarTurnos(turnosPlanos);
 
    return true;
  } catch (error) {
    console.error("Error crítico al procesar el backup:", error);
    return false;
  }
}
 
 
// ========================================
// 9. HERRAMIENTAS DE DESARROLLO
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
 
  localStorage.setItem("barbeos_admin",        JSON.stringify(adminAccount));
  localStorage.setItem("barbeos_business",     JSON.stringify(businessProfile));
  localStorage.setItem("barbeos_migracion_v1", "true");
 
  let cuentaLegada = {
    negocio:  businessProfile.businessName,
    dueno:    adminAccount.ownerName,
    email:    adminAccount.email,
    password: "[PROTECTED]",
    telefono: businessProfile.phone,
    direccion: businessProfile.address
  };
  localStorage.setItem("datosBarberia", JSON.stringify(cuentaLegada));
 
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
    ].forEach(k => localStorage.removeItem(k));
    alert("Instalación limpia completada.");
    window.location.href = "login.html";
  }
}
 
// Llamamos inicializarStorage al cargar el archivo
inicializarStorage();
// (la auto-creación de licencia queda dentro de esta función)