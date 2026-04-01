// ========================================
// STORAGE.JS - Capa de Datos
// Contraseñas: hash+salt, nunca texto plano
// Solo responsabilidades: abstracción de motor + CRUD de entidades
//
// Módulos relacionados (cargados por separado):
//   date-utils.js  → utilidades de fecha
//   license.js     → sistema de licencia trial
//   backup.js      → exportar/restaurar JSON
//   dev-tools.js   → herramientas de desarrollo
// ========================================

const CLAVE_MIGRACION_SQLITE_V1 = "barbeos_sqlite_migracion_v1";

// ========================================
// 1. CAPA DE ABSTRACCIÓN DE MOTOR
// ========================================

function dbBridgeDisponible() {
  return typeof window !== "undefined" && window.barbeosDB && window.barbeosDB.available;
}

function obtenerEstadoPersistencia() {
  if (!dbBridgeDisponible()) {
    return {
      disponible: false,
      motor: "localStorage",
      persistente: true
    };
  }

  let estado = window.barbeosDB.status ? window.barbeosDB.status() : null;
  return {
    disponible: Boolean(estado && estado.available),
    motor: String((estado && estado.engine) || "localStorage"),
    persistente: estado && typeof estado.persistent === "boolean" ? estado.persistent : true
  };
}

function rawLocalGetItem(clave) {
  return window.localStorage.getItem(clave);
}

function rawLocalSetItem(clave, valor) {
  window.localStorage.setItem(clave, valor);
}

function rawLocalRemoveItem(clave) {
  window.localStorage.removeItem(clave);
}

function storageGetItem(clave) {
  if (dbBridgeDisponible()) {
    let valor = window.barbeosDB.read(clave);
    if (typeof valor === "string") return valor;
  }
  return rawLocalGetItem(clave);
}

function storageSetItem(clave, valor) {
  if (dbBridgeDisponible()) {
    let ok = !!window.barbeosDB.write(clave, valor);
    if (ok) return true;
  }

  try {
    rawLocalSetItem(clave, valor);
    return true;
  } catch (_error) {
    return false;
  }
}

function storageRemoveItem(clave) {
  if (dbBridgeDisponible()) {
    let ok = !!window.barbeosDB.remove(clave);
    if (ok) return true;
  }

  try {
    rawLocalRemoveItem(clave);
    return true;
  } catch (_error) {
    return false;
  }
}

function storageListKeys() {
  if (dbBridgeDisponible()) {
    let claves = window.barbeosDB.keys();
    if (Array.isArray(claves)) return claves;
  }

  let claves = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    let clave = window.localStorage.key(i);
    if (clave) claves.push(clave);
  }
  return claves;
}

// ========================================
// 2. MIGRACIÓN localStorage → SQLite
// ========================================

function migrarLocalStorageASQLiteUnaVez() {
  if (!dbBridgeDisponible()) return;
  if (rawLocalGetItem(CLAVE_MIGRACION_SQLITE_V1) === "true") return;

  try {
    let claves = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      let clave = window.localStorage.key(i);
      if (clave) claves.push(clave);
    }

    if (claves.length > 0) {
      let entries = claves.map((clave) => ({ key: clave, value: rawLocalGetItem(clave) || "" }));
      window.barbeosDB.bulkWrite(entries);
    }

    rawLocalSetItem(CLAVE_MIGRACION_SQLITE_V1, "true");
    storageSetItem(CLAVE_MIGRACION_SQLITE_V1, "true");
  } catch (error) {
    console.error("No se pudo migrar localStorage a SQLite:", error);
  }
}

migrarLocalStorageASQLiteUnaVez();


// ========================================
// 3. INICIALIZACIÓN Y MIGRACIÓN DE DATOS
// ========================================

function inicializarStorage() {
  let datosViejos    = storageGetItem("datosBarberia");
  let migracionHecha = storageGetItem("barbeos_migracion_v1");

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

      storageSetItem("barbeos_admin",        JSON.stringify(adminAccount));
      storageSetItem("barbeos_business",     JSON.stringify(businessProfile));
      storageSetItem("barbeos_migracion_v1", "true");
      console.log("Migración de datos a v2 completada.");
    } catch (error) {
      console.error("Error migrando datos viejos:", error);
    }
  }
  // Nota: la auto-creación de licencia trial vive en license.js
}

inicializarStorage();


// ========================================
// 4. FUNCIONES BASE DE CUENTA Y NEGOCIO
// ========================================

function obtenerAdmin()                { return JSON.parse(storageGetItem("barbeos_admin"))    || {}; }
function guardarAdmin(adminData)       { storageSetItem("barbeos_admin",    JSON.stringify(adminData)); }

function obtenerBusiness()             { return JSON.parse(storageGetItem("barbeos_business")) || {}; }
function guardarBusiness(businessData) { storageSetItem("barbeos_business", JSON.stringify(businessData)); }

function obtenerLicense()              { return JSON.parse(storageGetItem("barbeos_license"))  || { status: "inactive" }; }
function guardarLicense(licenseData)   { storageSetItem("barbeos_license",  JSON.stringify(licenseData)); }


// ========================================
// 5. FUNCIONES DE COMPATIBILIDAD (PUENTE v1 → v2)
// ========================================

function obtenerCuentaActual() {
  if (storageGetItem("barbeos_migracion_v1") === "true") {
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
  let legacy = JSON.parse(storageGetItem("datosBarberia")) || {};
  delete legacy.password;
  return legacy;
}

function guardarCuentaActual(cuenta) {
  if (storageGetItem("barbeos_migracion_v1") === "true") {
    let business = obtenerBusiness();
    if (cuenta.negocio   !== undefined) business.businessName = cuenta.negocio;
    if (cuenta.telefono  !== undefined) business.phone        = cuenta.telefono;
    if (cuenta.direccion !== undefined) business.address      = cuenta.direccion;
    guardarBusiness(business);

    let legacyActual       = JSON.parse(storageGetItem("datosBarberia") || "{}");
    legacyActual.negocio   = business.businessName || "";
    legacyActual.telefono  = business.phone        || "";
    legacyActual.direccion = business.address      || "";
    legacyActual.password  = "[PROTECTED]";
    storageSetItem("datosBarberia", JSON.stringify(legacyActual));
  } else {
    storageSetItem("datosBarberia", JSON.stringify(cuenta));
  }
}


// ========================================
// 6. LECTURA Y ESCRITURA SEGURA DE JSON
// ========================================

function leerJSONStorage(clave, fallback) {
  try {
    let raw = storageGetItem(clave);
    if (!raw) return fallback;
    let parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch (error) {
    console.error(`Error leyendo ${clave} desde storage:`, error);
    return fallback;
  }
}

function esErrorCuotaStorage(error) {
  if (!error) return false;
  let nombre  = String(error.name    || "").toLowerCase();
  let mensaje = String(error.message || "").toLowerCase();
  return nombre.includes("quota") || mensaje.includes("quota") || mensaje.includes("storage");
}

function guardarJSONStorageSeguro(clave, valor) {
  try {
    let guardado = storageSetItem(clave, JSON.stringify(valor));
    if (!guardado) throw new Error("No se pudo persistir el dato en almacenamiento local.");
    storageRemoveItem("barbeos_storage_error");
    return true;
  } catch (error) {
    let esCuota = esErrorCuotaStorage(error);
    let detalle = esCuota
      ? "Se alcanzó el límite de almacenamiento local. Recomendado: generar backup y limpiar datos antiguos."
      : `Error al guardar en ${clave}: ${String(error && error.message ? error.message : error)}`;

    console.error(detalle, error);

    try {
      storageSetItem("barbeos_storage_error", JSON.stringify({
        clave,
        esCuota,
        detalle,
        fecha: new Date().toISOString()
      }));
    } catch (_errorSecundario) {
      // Si falla incluso este registro, evitamos romper el flujo principal.
    }

    return false;
  }
}


// ========================================
// 7. CRUD — ENTIDADES OPERATIVAS
// ========================================

// Turnos
function obtenerTurnos() {
  let turnos = leerJSONStorage("turnos", []);
  return Array.isArray(turnos) ? turnos : [];
}
function guardarTurnos(t)    { return guardarJSONStorageSeguro("turnos", t); }

// Cierres de Caja
function obtenerCierresCaja() {
  let cierres = leerJSONStorage("cierresCaja", []);
  if (!Array.isArray(cierres)) return [];

  return cierres
    .filter((cierre) => cierre && typeof cierre === "object")
    .map((cierre) => ({
      fecha:                String(cierre.fecha || "").trim(),
      ingresos:             Number(cierre.ingresos)             || 0,
      egresos:              Number(cierre.egresos)              || 0,
      esperado:             Number(cierre.esperado)             || 0,
      contado:              Number(cierre.contado)              || 0,
      diferencia:           Number(cierre.diferencia)           || 0,
      totalTurnosRealizados:Number(cierre.totalTurnosRealizados)|| 0,
      nota:                 String(cierre.nota || "").trim(),
      creadoEn:             String(cierre.creadoEn || "").trim()
    }))
    .filter((cierre) => cierre.fecha !== "");
}
function guardarCierresCaja(cierres) {
  if (!Array.isArray(cierres)) return guardarJSONStorageSeguro("cierresCaja", []);
  return guardarJSONStorageSeguro("cierresCaja", cierres);
}

// Productos
function obtenerProductos() {
  let productos = leerJSONStorage("productos", []);
  if (!Array.isArray(productos)) return [];

  return productos
    .filter((producto) => producto && typeof producto === "object")
    .map((producto) => ({
      nombre:    String(producto.nombre    || "").trim(),
      categoria: String(producto.categoria || "").trim(),
      precio:    normalizarPrecioServicio(producto.precio),
      stock:     Math.max(0, parseInt(producto.stock, 10) || 0)
    }))
    .filter((producto) => producto.nombre !== "");
}
function guardarProductos(productos) {
  if (!Array.isArray(productos)) return guardarJSONStorageSeguro("productos", []);

  let limpios = productos
    .map((producto) => ({
      nombre:    String(producto && producto.nombre    ? producto.nombre    : "").trim(),
      categoria: String(producto && producto.categoria ? producto.categoria : "").trim(),
      precio:    normalizarPrecioServicio(producto && producto.precio),
      stock:     Math.max(0, parseInt(producto && producto.stock, 10) || 0)
    }))
    .filter((producto) => producto.nombre !== "");

  return guardarJSONStorageSeguro("productos", limpios);
}

// Barberos
function obtenerBarberos() {
  let rawBarberos    = storageGetItem("barberos");
  let esPrimeraCarga = rawBarberos === null;
  let base;

  if (esPrimeraCarga) {
    base = ["Carlos", "Miguel", "Juan"];
  } else {
    try {
      base = JSON.parse(rawBarberos);
    } catch (_error) {
      base = [];
    }
  }

  if (!Array.isArray(base)) base = [];

  let resultado = [];
  let vistos    = new Set();

  base.forEach((nombre) => {
    let limpio = String(nombre || "").trim();
    let clave  = limpio.toLowerCase();
    if (limpio && !vistos.has(clave)) {
      vistos.add(clave);
      resultado.push(limpio);
    }
  });

  if (resultado.length === 0 && esPrimeraCarga) {
    return ["Carlos", "Miguel", "Juan"];
  }

  return resultado;
}
function guardarBarberos(b)  { return guardarJSONStorageSeguro("barberos", b); }

// Servicios (con precio)
function normalizarPrecioServicio(precio) {
  let numero = Number(precio);
  if (!Number.isFinite(numero) || numero < 0) return 0;
  return Math.round(numero * 100) / 100;
}

function obtenerServiciosConPrecio() {
  let rawServicios   = storageGetItem("servicios");
  let esPrimeraCarga = rawServicios === null;
  let base;

  if (esPrimeraCarga) {
    base = ["Corte", "Barba", "Corte + barba"];
  } else {
    try {
      base = JSON.parse(rawServicios);
    } catch (_error) {
      base = [];
    }
  }

  if (!Array.isArray(base)) base = [];

  let resultado = [];
  let vistos    = new Set();

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

  if (resultado.length === 0 && esPrimeraCarga) {
    return [
      { nombre: "Corte",        precio: 0 },
      { nombre: "Barba",        precio: 0 },
      { nombre: "Corte + barba",precio: 0 }
    ];
  }

  return resultado;
}

function guardarServiciosConPrecio(serviciosConPrecio) {
  if (!Array.isArray(serviciosConPrecio)) return guardarJSONStorageSeguro("servicios", []);

  let limpios = serviciosConPrecio
    .map((servicio) => ({
      nombre: String(servicio && servicio.nombre ? servicio.nombre : "").trim(),
      precio: normalizarPrecioServicio(servicio && servicio.precio)
    }))
    .filter((servicio) => servicio.nombre !== "");

  return guardarJSONStorageSeguro("servicios", limpios);
}

function obtenerServicios() {
  return obtenerServiciosConPrecio().map((servicio) => servicio.nombre);
}

function guardarServicios(s) {
  if (!Array.isArray(s)) return guardarJSONStorageSeguro("servicios", []);

  // Compatibilidad: acepta array de strings o de objetos {nombre, precio}
  if (s.length > 0 && typeof s[0] === "object") {
    return guardarServiciosConPrecio(s);
  }

  let conPrecio = s.map((nombre) => ({ nombre: String(nombre || "").trim(), precio: 0 }));
  return guardarServiciosConPrecio(conPrecio);
}

function obtenerPrecioServicio(nombreServicio) {
  let nombreBuscado = String(nombreServicio || "").trim().toLowerCase();
  if (!nombreBuscado) return 0;

  let servicio = obtenerServiciosConPrecio().find((item) => item.nombre.toLowerCase() === nombreBuscado);
  return servicio ? normalizarPrecioServicio(servicio.precio) : 0;
}

// Clientes
function obtenerClientes() {
  let base = leerJSONStorage("clientes", []);
  if (!Array.isArray(base)) return [];

  let resultado = [];
  let vistos    = new Set();

  base.forEach((cliente) => {
    if (!cliente || typeof cliente !== "object") return;

    let nombre = String(cliente.nombre || "").trim();
    if (!nombre) return;

    let clave = nombre.toLowerCase();
    if (vistos.has(clave)) return;

    vistos.add(clave);
    resultado.push({
      nombre:        nombre,
      telefono:      String(cliente.telefono      || "").trim(),
      observaciones: String(cliente.observaciones || "").trim(),
      ultimaVisita:  String(cliente.ultimaVisita  || "").trim()
    });
  });

  return resultado;
}
function guardarClientes(c)  { return guardarJSONStorageSeguro("clientes", c); }


// ========================================
// 8. DIAGNÓSTICO DE ALMACENAMIENTO
// ========================================

function obtenerDiagnosticoAlmacenamiento() {
  let estado         = obtenerEstadoPersistencia();
  let claves         = storageListKeys();
  let bytesEstimados = claves.reduce((acum, clave) => {
    let valor = storageGetItem(clave) || "";
    return acum + String(clave).length + String(valor).length;
  }, 0);

  let errorStorage = leerJSONStorage("barbeos_storage_error", null);

  return {
    modo:              estado.disponible ? "SQLite local" : "localStorage local",
    motor:             estado.motor,
    persistente:       estado.persistente,
    totalClaves:       claves.length,
    totalTurnos:       obtenerTurnos().length,
    totalClientes:     obtenerClientes().length,
    totalBarberos:     obtenerBarberos().length,
    totalServicios:    obtenerServicios().length,
    totalProductos:    obtenerProductos().length,
    bytesEstimados,
    ultimoErrorStorage: errorStorage
  };
}
