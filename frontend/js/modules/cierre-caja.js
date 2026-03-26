// ========================================
// MODULO: CIERRE DE CAJA
// ========================================

function formatearMonedaCaja(valor) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(Number(valor) || 0);
}

function obtenerHoyIsoCaja() {
  let hoy = new Date();
  let y = hoy.getFullYear();
  let m = String(hoy.getMonth() + 1).padStart(2, "0");
  let d = String(hoy.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function normalizarServiciosTurnoCaja(turno) {
  if (Array.isArray(turno && turno.servicios)) {
    return turno.servicios.map((s) => String(s || "").trim()).filter(Boolean);
  }

  let servicioUnico = String(turno && turno.servicio ? turno.servicio : "").trim();
  if (!servicioUnico) return [];

  return servicioUnico
    .split("+")
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalizarProductosTurnoCaja(turno) {
  if (Array.isArray(turno && turno.productos)) {
    return turno.productos.map((p) => String(p || "").trim()).filter(Boolean);
  }

  let productoUnico = String(turno && turno.producto ? turno.producto : "").trim();
  if (!productoUnico) return [];

  return productoUnico
    .split("+")
    .map((p) => p.trim())
    .filter(Boolean);
}

function obtenerPrecioProductoCaja(nombreProducto) {
  let nombreBuscado = String(nombreProducto || "").trim().toLowerCase();
  if (!nombreBuscado) return 0;

  let producto = obtenerProductos().find((item) => String(item.nombre || "").trim().toLowerCase() === nombreBuscado);
  return producto ? Number(producto.precio || 0) : 0;
}

function calcularMontoTurnoCaja(turno) {
  if (Number.isFinite(Number(turno && turno.montoServicio))) {
    return Number(turno.montoServicio);
  }

  let servicios = normalizarServiciosTurnoCaja(turno);
  let productos = normalizarProductosTurnoCaja(turno);
  if (servicios.length === 0 && productos.length === 0) return 0;

  let totalServicios = servicios.reduce((acum, nombre) => acum + Number(obtenerPrecioServicio(nombre) || 0), 0);
  let totalProductos = productos.reduce((acum, nombre) => acum + Number(obtenerPrecioProductoCaja(nombre) || 0), 0);

  return totalServicios + totalProductos;
}

function calcularResumenDiaCaja(fechaIso) {
  let turnos = obtenerTurnos();
  let realizadosDelDia = turnos.filter((turno) => {
    let estado = String(turno && turno.estado ? turno.estado : "").trim().toLowerCase();
    return estado === "realizado" && String(turno.fecha || "") === fechaIso;
  });

  let ingresos = realizadosDelDia.reduce((acum, turno) => acum + calcularMontoTurnoCaja(turno), 0);

  return {
    ingresos,
    totalTurnosRealizados: realizadosDelDia.length
  };
}

function obtenerTurnosPendientesParaCierre(fechaIso) {
  return obtenerTurnos().filter((turno) => {
    if (String(turno && turno.fecha ? turno.fecha : "") !== fechaIso) return false;
    let estado = String(turno && turno.estado ? turno.estado : "").trim().toLowerCase();
    return estado === "pendiente" || estado === "confirmado";
  });
}

function renderAvisoTurnosPendientesCierre(fechaIso) {
  let contenedor = document.getElementById("alertaTurnosPendientesCierre");
  if (!contenedor) return;

  let pendientes = obtenerTurnosPendientesParaCierre(fechaIso);
  if (pendientes.length === 0) {
    contenedor.style.display = "none";
    contenedor.innerHTML = "";
    return;
  }

  let items = pendientes.map((turno) => {
    let cliente = escaparHTML(turno.cliente || turno.nombre || "Cliente sin definir");
    let hora = escaparHTML(turno.hora || "Sin hora");
    let barbero = escaparHTML(turno.barbero || "Barbero sin definir");
    let estado = escaparHTML(turno.estado || "Pendiente");
    return `<li>${hora} · ${cliente} · ${barbero} · ${estado}</li>`;
  }).join("");

  contenedor.style.display = "block";
  contenedor.innerHTML = `
    <div style="font-weight:700; margin-bottom:6px;">Antes de cerrar caja, revisa estos turnos:</div>
    <ul style="margin:0; padding-left:18px; line-height:1.45;">${items}</ul>
    <div style="margin-top:8px;">Pásalos a Realizado, Cancelado o No asistió según corresponda.</div>
  `;
}

function mostrarListaCierresCaja() {
  let lista = document.getElementById("listaCierresCaja");
  if (!lista) return;

  let cierres = obtenerCierresCaja().sort((a, b) => b.fecha.localeCompare(a.fecha));
  lista.innerHTML = "";

  if (cierres.length === 0) {
    let li = document.createElement("li");
    li.className = "turno-item";
    li.innerHTML = `
      <div class="turno-info">
        <div class="turno-detalle">Todavia no hay cierres de caja guardados.</div>
      </div>
    `;
    lista.appendChild(li);
    return;
  }

  cierres.forEach((cierre) => {
    let fecha = escaparHTML(cierre.fecha);
    let ingresos = escaparHTML(formatearMonedaCaja(cierre.ingresos));
    let egresos = escaparHTML(formatearMonedaCaja(cierre.egresos));
    let esperado = escaparHTML(formatearMonedaCaja(cierre.esperado));
    let contado = escaparHTML(formatearMonedaCaja(cierre.contado));
    let diferencia = Number(cierre.diferencia || 0);
    let diferenciaTxt = escaparHTML(formatearMonedaCaja(diferencia));
    let colorDif = diferencia < 0 ? "#dc2626" : (diferencia > 0 ? "#0f766e" : "#475569");
    let nota = escaparHTML(cierre.nota || "Sin nota");

    let li = document.createElement("li");
    li.className = "turno-item";
    li.innerHTML = `
      <div class="turno-info">
        <div class="turno-nombre">Cierre ${fecha}</div>
        <div class="turno-detalle">Ingresos: ${ingresos}</div>
        <div class="turno-detalle">Egresos: ${egresos}</div>
        <div class="turno-detalle">Esperado: ${esperado}</div>
        <div class="turno-detalle">Contado: ${contado}</div>
        <div class="turno-detalle" style="color:${colorDif}; font-weight:600;">Diferencia: ${diferenciaTxt}</div>
        <div class="turno-detalle">Turnos realizados: ${escaparHTML(String(cierre.totalTurnosRealizados || 0))}</div>
        <div class="turno-detalle">Nota: ${nota}</div>
      </div>
    `;

    lista.appendChild(li);
  });
}

function recalcularCierreCajaEnPantalla() {
  let fecha = String(document.getElementById("fechaCierreCaja")?.value || "").trim();
  if (!fecha) return;

  let resumen = calcularResumenDiaCaja(fecha);
  let ingresos = Number(resumen.ingresos || 0);
  let egresos = Number(document.getElementById("egresosCierreCaja")?.value || 0);
  let contado = Number(document.getElementById("contadoCierreCaja")?.value || 0);
  let esperado = ingresos - egresos;
  let diferencia = contado - esperado;

  let elIngresos = document.getElementById("ingresosCalculadosCierreCaja");
  let elEsperado = document.getElementById("esperadoCierreCaja");
  let elDiferencia = document.getElementById("diferenciaCierreCaja");
  let elTurnos = document.getElementById("turnosRealizadosCierreCaja");

  if (elIngresos) elIngresos.innerText = formatearMonedaCaja(ingresos);
  if (elEsperado) elEsperado.innerText = formatearMonedaCaja(esperado);
  if (elDiferencia) {
    elDiferencia.innerText = formatearMonedaCaja(diferencia);
    elDiferencia.style.color = diferencia < 0 ? "#dc2626" : (diferencia > 0 ? "#0f766e" : "#475569");
  }
  if (elTurnos) elTurnos.innerText = String(resumen.totalTurnosRealizados || 0);

  renderAvisoTurnosPendientesCierre(fecha);
}

function cerrarDiaCaja() {
  let fecha = String(document.getElementById("fechaCierreCaja")?.value || "").trim();
  let egresos = Number(document.getElementById("egresosCierreCaja")?.value || 0);
  let contado = Number(document.getElementById("contadoCierreCaja")?.value || 0);
  let nota = String(document.getElementById("notaCierreCaja")?.value || "").trim();

  let mensaje = document.getElementById("mensajeCierreCaja");
  if (mensaje) {
    mensaje.style.display = "none";
    mensaje.innerText = "";
  }

  if (!fecha) {
    if (mensaje) {
      mensaje.style.display = "block";
      mensaje.style.color = "#b91c1c";
      mensaje.innerText = "Selecciona una fecha para cerrar caja.";
    }
    return;
  }

  if (!Number.isFinite(egresos) || egresos < 0) {
    if (mensaje) {
      mensaje.style.display = "block";
      mensaje.style.color = "#b91c1c";
      mensaje.innerText = "Los egresos deben ser un numero mayor o igual a 0.";
    }
    return;
  }

  if (!Number.isFinite(contado) || contado < 0) {
    if (mensaje) {
      mensaje.style.display = "block";
      mensaje.style.color = "#b91c1c";
      mensaje.innerText = "El efectivo contado debe ser un numero mayor o igual a 0.";
    }
    return;
  }

  let cierres = obtenerCierresCaja();
  let existe = cierres.some((cierre) => cierre.fecha === fecha);
  if (existe) {
    if (mensaje) {
      mensaje.style.display = "block";
      mensaje.style.color = "#b91c1c";
      mensaje.innerText = "Ya existe un cierre guardado para esa fecha.";
    }
    return;
  }

  let pendientes = obtenerTurnosPendientesParaCierre(fecha);
  if (pendientes.length > 0) {
    if (mensaje) {
      mensaje.style.display = "block";
      mensaje.style.color = "#b91c1c";
      mensaje.innerText = "No se puede cerrar caja: hay turnos Pendiente/Confirmado. Revísalos en Agenda.";
    }
    renderAvisoTurnosPendientesCierre(fecha);
    return;
  }

  let resumen = calcularResumenDiaCaja(fecha);
  let ingresos = Number(resumen.ingresos || 0);
  let esperado = ingresos - egresos;
  let diferencia = contado - esperado;

  cierres.push({
    fecha,
    ingresos,
    egresos,
    esperado,
    contado,
    diferencia,
    totalTurnosRealizados: Number(resumen.totalTurnosRealizados || 0),
    nota,
    creadoEn: new Date().toISOString()
  });

  guardarCierresCaja(cierres);

  if (mensaje) {
    mensaje.style.display = "block";
    mensaje.style.color = "#166534";
    mensaje.innerText = "Cierre de caja guardado correctamente.";
  }

  mostrarListaCierresCaja();
}

function exportarCierreCajaPDF() {
  let fecha = String(document.getElementById("fechaCierreCaja")?.value || "").trim();
  if (!fecha) {
    let mensaje = document.getElementById("mensajeCierreCaja");
    if (mensaje) {
      mensaje.style.display = "block";
      mensaje.style.color = "#b91c1c";
      mensaje.innerText = "Selecciona una fecha antes de exportar.";
    }
    return;
  }

  let cierres = obtenerCierresCaja();
  let cierreGuardado = cierres.find((cierre) => cierre.fecha === fecha);

  let resumen = calcularResumenDiaCaja(fecha);
  let egresosInput = Number(document.getElementById("egresosCierreCaja")?.value || 0);
  let contadoInput = Number(document.getElementById("contadoCierreCaja")?.value || 0);
  let notaInput = String(document.getElementById("notaCierreCaja")?.value || "").trim();

  let ingresos = cierreGuardado ? Number(cierreGuardado.ingresos || 0) : Number(resumen.ingresos || 0);
  let egresos = cierreGuardado ? Number(cierreGuardado.egresos || 0) : egresosInput;
  let esperado = cierreGuardado ? Number(cierreGuardado.esperado || 0) : (ingresos - egresos);
  let contado = cierreGuardado ? Number(cierreGuardado.contado || 0) : contadoInput;
  let diferencia = cierreGuardado ? Number(cierreGuardado.diferencia || 0) : (contado - esperado);
  let totalTurnos = cierreGuardado ? Number(cierreGuardado.totalTurnosRealizados || 0) : Number(resumen.totalTurnosRealizados || 0);
  let nota = cierreGuardado ? String(cierreGuardado.nota || "").trim() : notaInput;

  let diferenciaColor = diferencia < 0 ? "#b91c1c" : (diferencia > 0 ? "#0f766e" : "#334155");
  let negocio = (obtenerCuentaActual().negocio || "Barberia").trim();

  let html = `
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Cierre de caja ${fecha}</title>
        <style>
          body { font-family: Segoe UI, Arial, sans-serif; margin: 28px; color: #0f172a; }
          h1 { margin: 0 0 4px 0; font-size: 26px; }
          .muted { color: #475569; margin-bottom: 18px; }
          .card { border: 1px solid #cbd5e1; border-radius: 10px; padding: 14px; margin-bottom: 10px; }
          .row { display: flex; justify-content: space-between; margin: 6px 0; }
          .label { color: #334155; }
          .value { font-weight: 700; }
          .diff { color: ${diferenciaColor}; }
          .note { margin-top: 12px; padding-top: 10px; border-top: 1px dashed #cbd5e1; }
        </style>
      </head>
      <body>
        <h1>Cierre de Caja</h1>
        <div class="muted">${escaparHTML(negocio)} · Fecha ${escaparHTML(fecha)}</div>
        <div class="card">
          <div class="row"><span class="label">Turnos realizados</span><span class="value">${escaparHTML(String(totalTurnos))}</span></div>
          <div class="row"><span class="label">Ingresos</span><span class="value">${escaparHTML(formatearMonedaCaja(ingresos))}</span></div>
          <div class="row"><span class="label">Egresos</span><span class="value">${escaparHTML(formatearMonedaCaja(egresos))}</span></div>
          <div class="row"><span class="label">Esperado</span><span class="value">${escaparHTML(formatearMonedaCaja(esperado))}</span></div>
          <div class="row"><span class="label">Contado</span><span class="value">${escaparHTML(formatearMonedaCaja(contado))}</span></div>
          <div class="row"><span class="label">Diferencia</span><span class="value diff">${escaparHTML(formatearMonedaCaja(diferencia))}</span></div>
          <div class="note"><strong>Nota:</strong> ${escaparHTML(nota || "Sin nota")}</div>
        </div>
      </body>
    </html>
  `;

  let frame = document.getElementById("frameExportCierreCaja");
  if (!frame) {
    frame = document.createElement("iframe");
    frame.id = "frameExportCierreCaja";
    frame.style.position = "fixed";
    frame.style.right = "0";
    frame.style.bottom = "0";
    frame.style.width = "0";
    frame.style.height = "0";
    frame.style.border = "0";
    frame.style.opacity = "0";
    frame.setAttribute("aria-hidden", "true");
    document.body.appendChild(frame);
  }

  let doc = frame.contentWindow && frame.contentWindow.document;
  if (!doc) return;

  doc.open();
  doc.write(html);
  doc.close();

  frame.onload = () => {
    try {
      frame.contentWindow.focus();
      frame.contentWindow.print();
    } catch (_error) {
      let mensaje = document.getElementById("mensajeCierreCaja");
      if (mensaje) {
        mensaje.style.display = "block";
        mensaje.style.color = "#b91c1c";
        mensaje.innerText = "No se pudo abrir la impresión. Intenta nuevamente.";
      }
    }
  };
}

function mostrarCierreCaja() {
  let fechaHoy = obtenerHoyIsoCaja();

  document.getElementById("contenido").innerHTML = `
    <h1>Cierre de Caja</h1>

    <div id="cardCierreCaja" style="background:white; padding:20px; border-radius:10px; box-shadow:0 2px 6px rgba(0,0,0,0.1); margin-bottom:20px;">
      <h3 style="margin-top:0; color:#111827;">Cerrar el dia</h3>

      <div id="mensajeCierreCaja" style="display:none; margin-bottom:10px; font-size:14px;"></div>

      <div id="alertaTurnosPendientesCierre" style="display:none; background:#fff7ed; color:#9a3412; border:1px solid #fdba74; border-radius:8px; padding:10px; margin-bottom:10px;"></div>

      <label for="fechaCierreCaja">Fecha</label>
      <input type="date" id="fechaCierreCaja" value="${fechaHoy}">

      <div id="resumenPrevioCaja" style="background:#eff6ff; color:#1e3a8a; border-radius:8px; padding:10px; margin-top:10px;">
        <div>Turnos realizados: <strong id="turnosRealizadosCierreCaja">0</strong></div>
        <div>Ingresos calculados: <strong id="ingresosCalculadosCierreCaja">ARS 0</strong></div>
      </div>

      <label for="egresosCierreCaja" style="margin-top:12px; display:block;">Egresos del dia</label>
      <input type="number" id="egresosCierreCaja" min="0" step="0.01" value="0">

      <label for="contadoCierreCaja" style="margin-top:12px; display:block;">Efectivo contado</label>
      <input type="number" id="contadoCierreCaja" min="0" step="0.01" value="0">

      <div style="background:#f8fafc; color:#334155; border-radius:8px; padding:10px; margin-top:10px; border:1px solid #e2e8f0;">
        <div>Esperado: <strong id="esperadoCierreCaja">ARS 0</strong></div>
        <div>Diferencia: <strong id="diferenciaCierreCaja">ARS 0</strong></div>
      </div>

      <label for="notaCierreCaja" style="margin-top:12px; display:block;">Nota (opcional)</label>
      <input id="notaCierreCaja" placeholder="Ej: hubo gasto de insumos no previsto">

      <div class="acciones-item acciones-cierre-caja">
        <button class="btn-cierre-caja-accion" onclick="cerrarDiaCaja()">Cerrar dia</button>
        <button class="btn-accion btn-cierre-caja-accion" onclick="exportarCierreCajaPDF()">Exportar PDF</button>
      </div>
    </div>

    <h2>Historial de cierres</h2>
    <ul id="listaCierresCaja"></ul>
  `;

  let fechaInput = document.getElementById("fechaCierreCaja");
  let egresosInput = document.getElementById("egresosCierreCaja");
  let contadoInput = document.getElementById("contadoCierreCaja");

  if (fechaInput) fechaInput.addEventListener("change", recalcularCierreCajaEnPantalla);
  if (egresosInput) egresosInput.addEventListener("input", recalcularCierreCajaEnPantalla);
  if (contadoInput) contadoInput.addEventListener("input", recalcularCierreCajaEnPantalla);

  recalcularCierreCajaEnPantalla();
  mostrarListaCierresCaja();
}
