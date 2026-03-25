// ========================================
// MÓDULO: CONFIGURACIÓN DEL NEGOCIO
// ========================================

function formatearMonedaConfig(valor) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(Number(valor) || 0);
}

function calcularRangoSemana(fecha) {
  let copia = new Date(fecha);
  let dia = copia.getDay();
  let offset = dia === 0 ? -6 : 1 - dia;

  let inicio = new Date(copia);
  inicio.setHours(0, 0, 0, 0);
  inicio.setDate(inicio.getDate() + offset);

  let fin = new Date(inicio);
  fin.setDate(fin.getDate() + 6);
  fin.setHours(23, 59, 59, 999);

  return { inicio, fin };
}

function obtenerMontoTurno(turno) {
  if (Number.isFinite(Number(turno.montoServicio))) {
    return Number(turno.montoServicio);
  }
  return obtenerPrecioServicio(turno.servicio);
}

function calcularResumenNegocio() {
  let listaTurnos = obtenerTurnos();
  let hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  let { inicio: inicioSemana, fin: finSemana } = calcularRangoSemana(new Date());
  let inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  let finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59, 999);

  let ingresosHoy = 0;
  let ingresosSemana = 0;
  let ingresosMes = 0;
  let realizados = 0;
  let cancelados = 0;
  let serviciosVendidos = {};

  listaTurnos.forEach((turno) => {
    let estado = String(turno.estado || "Pendiente");
    if (estado === "Cancelado") cancelados += 1;
    if (estado !== "Realizado") return;

    realizados += 1;
    let monto = obtenerMontoTurno(turno);

    let nombreServicio = String(turno.servicio || "Sin servicio");
    serviciosVendidos[nombreServicio] = (serviciosVendidos[nombreServicio] || 0) + 1;

    let fechaTurno = turno.fecha ? new Date(`${turno.fecha}T00:00:00`) : null;
    if (!fechaTurno || Number.isNaN(fechaTurno.getTime())) return;

    if (fechaTurno.getTime() === hoy.getTime()) ingresosHoy += monto;
    if (fechaTurno >= inicioSemana && fechaTurno <= finSemana) ingresosSemana += monto;
    if (fechaTurno >= inicioMes && fechaTurno <= finMes) ingresosMes += monto;
  });

  let servicioTop = "Sin datos";
  let maxVenta = 0;
  Object.keys(serviciosVendidos).forEach((nombre) => {
    if (serviciosVendidos[nombre] > maxVenta) {
      maxVenta = serviciosVendidos[nombre];
      servicioTop = nombre;
    }
  });

  let ticketPromedio = realizados > 0 ? ingresosMes / realizados : 0;

  return {
    ingresosHoy,
    ingresosSemana,
    ingresosMes,
    ticketPromedio,
    realizados,
    cancelados,
    servicioTop,
    totalTurnos: listaTurnos.length
  };
}

function mostrarConfiguracion() {
  recargarDatos();
  let resumen = calcularResumenNegocio();

  let negocioSeguro = escaparHTML(cuentaActual.negocio || "");
  let telefonoSeguro = escaparHTML(cuentaActual.telefono || "");
  let direccionSeguro = escaparHTML(cuentaActual.direccion || "");

  document.getElementById("contenido").innerHTML = `
    <h1>Configuración del Negocio</h1>

    <div id="mensajeExitoConf" style="color: #16a34a; font-size: 14px; margin-bottom: 15px; display: none; font-weight: bold;">
      ¡Datos del negocio guardados con éxito!
    </div>

    <div style="background: linear-gradient(135deg, #0f172a, #1e293b); color: white; padding: 22px; border-radius: 10px; margin-bottom: 30px; max-width: 680px; box-shadow: 0 6px 14px rgba(0,0,0,0.15); border: 1px solid #334155;">
      <h3 style="margin-top: 0; color: #f59e0b;">Próximamente: BarberOS PRO</h3>
      <p style="font-size: 14px; margin-bottom: 12px; color: #cbd5e1; line-height: 1.5;">
        Objetivo: <strong>reducir ausencias y ahorrar tiempo</strong> en la gestión diaria de tu barbería.
      </p>
      <ul style="margin: 0; padding-left: 18px; color: #e2e8f0; font-size: 14px; line-height: 1.6;">
        <li>Recordatorios automáticos por WhatsApp a clientes.</li>
        <li>Confirmación y cancelación de turnos en un clic.</li>
        <li>Detección de huecos libres para recuperar ingresos.</li>
      </ul>
      <button style="margin-top: 14px; background: #f59e0b; color: #111827; font-weight: 700;" onclick="alert('Próximamente habilitaremos el acceso anticipado a BarberOS PRO.')">Quiero acceso anticipado</button>
    </div>

    <div style="max-width: 680px; margin-bottom: 26px;">
      <h3 style="color: #111827; margin-bottom: 12px;">Resumen del Negocio</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 10px;">
        <div style="background: white; border-radius: 8px; padding: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.08);">
          <div style="font-size: 12px; color: #64748b;">Ingresos de hoy</div>
          <div style="font-size: 20px; font-weight: 700; color: #0f172a;">${escaparHTML(formatearMonedaConfig(resumen.ingresosHoy))}</div>
        </div>
        <div style="background: white; border-radius: 8px; padding: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.08);">
          <div style="font-size: 12px; color: #64748b;">Ingresos semanales</div>
          <div style="font-size: 20px; font-weight: 700; color: #0f172a;">${escaparHTML(formatearMonedaConfig(resumen.ingresosSemana))}</div>
        </div>
        <div style="background: white; border-radius: 8px; padding: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.08);">
          <div style="font-size: 12px; color: #64748b;">Ingresos mensuales</div>
          <div style="font-size: 20px; font-weight: 700; color: #0f172a;">${escaparHTML(formatearMonedaConfig(resumen.ingresosMes))}</div>
        </div>
        <div style="background: white; border-radius: 8px; padding: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.08);">
          <div style="font-size: 12px; color: #64748b;">Ticket promedio</div>
          <div style="font-size: 20px; font-weight: 700; color: #0f172a;">${escaparHTML(formatearMonedaConfig(resumen.ticketPromedio))}</div>
        </div>
        <div style="background: white; border-radius: 8px; padding: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.08);">
          <div style="font-size: 12px; color: #64748b;">Turnos realizados</div>
          <div style="font-size: 20px; font-weight: 700; color: #0f172a;">${escaparHTML(resumen.realizados)}</div>
        </div>
        <div style="background: white; border-radius: 8px; padding: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.08);">
          <div style="font-size: 12px; color: #64748b;">Turnos cancelados</div>
          <div style="font-size: 20px; font-weight: 700; color: #0f172a;">${escaparHTML(resumen.cancelados)}</div>
        </div>
      </div>
      <div style="margin-top: 10px; color: #334155; font-size: 14px;">
        Servicio más vendido: <strong>${escaparHTML(resumen.servicioTop)}</strong>
      </div>
    </div>

    <div style="max-width: 500px;">
      <h3 style="color: #111827;">Datos Operativos</h3>
      <label style="color: #475569; font-size: 14px;">Nombre de la Barbería</label>
      <input id="confNegocio" value="${negocioSeguro}">

      <label style="color: #475569; font-size: 14px; margin-top:12px;">Teléfono</label>
      <input id="confTelefono" value="${telefonoSeguro}" placeholder="Ej: +54 9 11 1234-5678">

      <label style="color: #475569; font-size: 14px; margin-top:12px;">Dirección</label>
      <input id="confDireccion" value="${direccionSeguro}" placeholder="Ej: Av. Principal 123">

      <button onclick="guardarConfiguracion()" style="width: 100%; margin-top: 15px;">Guardar Cambios</button>

      <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 30px 0;">
      
      <h3 style="margin-top: 0; color: #111827;">Gestión de Datos</h3>
      <p style="color: #475569; font-size: 14px; margin-bottom: 10px;">Exportá o restaurá una copia de seguridad de tu información.</p>
      
      <button onclick="exportarBackupJSON()" style="background: #10b981; width: 100%;">Descargar Backup de Datos</button>
      
      <input type="file" id="inputFileBackup" accept=".json" style="display: none;" onchange="procesarArchivoBackup(event)">
      <button onclick="document.getElementById('inputFileBackup').click()" style="background: #dc2626; width: 100%; margin-top: 10px;">Restaurar Backup</button>
    </div>
  `;
}

function guardarConfiguracion() {
  cuentaActual.negocio = document.getElementById("confNegocio").value.trim();
  cuentaActual.telefono = document.getElementById("confTelefono").value.trim();
  cuentaActual.direccion = document.getElementById("confDireccion").value.trim();

  guardarCuentaActual(cuentaActual);

  let mensaje = document.getElementById("mensajeExitoConf");
  if (mensaje) {
    mensaje.style.display = "block";
    setTimeout(() => { mensaje.style.display = "none"; }, 3000);
  }
}

function procesarArchivoBackup(event) {
    let file = event.target.files[0];
    if (!file) return;

    let confirmar = confirm("¿Estás seguro de que deseás restaurar este backup? Todos los datos actuales serán reemplazados.");
    if (!confirmar) { event.target.value = ""; return; }

    let reader = new FileReader();
    reader.onload = function(e) {
        let exito = restaurarBackupDesdeJSON(e.target.result);
        if (exito) {
            alert("Datos restaurados correctamente. La sesión se cerrará para aplicar los cambios.");
            localStorage.removeItem("sesionActiva"); window.location.href = "login.html";
        } else {
            alert("Error: El archivo seleccionado no es válido o está corrupto.");
        }
        event.target.value = "";
    };
    reader.readAsText(file);
}