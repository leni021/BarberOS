// ========================================
// BACKUP.JS - Exportación e Importación de Datos
// Depende de: storage.js
// ========================================

function generarIdUnico(prefijo) {
  return prefijo + "_" + Math.random().toString(36).substr(2, 9) + "_" + Date.now();
}

// ── EXPORTACIÓN ──────────────────────────────────────────────────────────────

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


// ── IMPORTACIÓN ──────────────────────────────────────────────────────────────

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
    storageSetItem("datosBarberia",        JSON.stringify(cuentaLegada));
    storageSetItem("barbeos_migracion_v1", "true");

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
