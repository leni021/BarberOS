// ========================================
// MÓDULO: AGENDA
// ========================================

function normalizarAgendaTexto(valor) {
  return (valor || "").trim().toLowerCase();
}

function esTurnoCancelado(turno) {
  let estado = String(turno && turno.estado ? turno.estado : "").trim().toLowerCase();
  return estado === "cancelado";
}

function formatearMonedaAgenda(valor) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(Number(valor) || 0);
}

let indiceTurnoEnEdicion = -1;
let serviciosSeleccionadosEnFormulario = [];
let productosSeleccionadosEnFormulario = [];

function normalizarServiciosTurno(turno) {
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

function calcularMontoServicios(servicios) {
  if (!Array.isArray(servicios)) return 0;
  return servicios.reduce((acum, nombre) => acum + Number(obtenerPrecioServicio(nombre) || 0), 0);
}

function normalizarProductosTurno(turno) {
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

function obtenerPrecioProductoAgenda(nombreProducto) {
  let nombreBuscado = String(nombreProducto || "").trim().toLowerCase();
  if (!nombreBuscado) return 0;

  let producto = obtenerProductos().find((item) => String(item.nombre || "").trim().toLowerCase() === nombreBuscado);
  return producto ? Number(producto.precio || 0) : 0;
}

function calcularMontoProductos(productos) {
  if (!Array.isArray(productos)) return 0;
  return productos.reduce((acum, nombre) => acum + Number(obtenerPrecioProductoAgenda(nombre) || 0), 0);
}

function actualizarMontoServicioSeleccionado() {
  let etiquetaMonto = document.getElementById("montoServicioTurno");
  if (!etiquetaMonto) return;

  let cantidadServicios = Array.isArray(serviciosSeleccionadosEnFormulario) ? serviciosSeleccionadosEnFormulario.length : 0;
  let cantidadProductos = Array.isArray(productosSeleccionadosEnFormulario) ? productosSeleccionadosEnFormulario.length : 0;

  if (cantidadServicios === 0 && cantidadProductos === 0) {
    etiquetaMonto.innerText = "Monto estimado: ARS 0";
    return;
  }

  let monto = calcularMontoServicios(serviciosSeleccionadosEnFormulario) + calcularMontoProductos(productosSeleccionadosEnFormulario);
  etiquetaMonto.innerText = `Monto estimado: ${formatearMonedaAgenda(monto)}`;
}

function renderServiciosSeleccionadosAgenda() {
  let contenedor = document.getElementById("serviciosSeleccionadosTurno");
  if (!contenedor) return;

  if (!Array.isArray(serviciosSeleccionadosEnFormulario) || serviciosSeleccionadosEnFormulario.length === 0) {
    contenedor.innerHTML = `<div class="turno-detalle" style="margin:0;">Sin servicios seleccionados.</div>`;
    actualizarMontoServicioSeleccionado();
    return;
  }

  contenedor.innerHTML = serviciosSeleccionadosEnFormulario
    .map((nombre, indice) => {
      let nombreSeguro = escaparHTML(nombre);
      return `<span class="servicio-chip">${nombreSeguro} <button class="servicio-chip-remove" onclick="quitarServicioSeleccionadoTurnoPorIndice(${indice})">x</button></span>`;
    })
    .join(" ");

  actualizarMontoServicioSeleccionado();
}

function agregarServicioSeleccionadoTurno() {
  let selectServicio = document.getElementById("servicioTurno");
  if (!selectServicio) return;

  let servicio = String(selectServicio.value || "").trim();
  if (!servicio) return;

  if (!serviciosSeleccionadosEnFormulario.includes(servicio)) {
    serviciosSeleccionadosEnFormulario.push(servicio);
  }

  selectServicio.value = "";
  renderServiciosSeleccionadosAgenda();
}

function quitarServicioSeleccionadoTurnoPorIndice(indice) {
  serviciosSeleccionadosEnFormulario.splice(indice, 1);
  renderServiciosSeleccionadosAgenda();
}

function renderProductosSeleccionadosAgenda() {
  let contenedor = document.getElementById("productosSeleccionadosTurno");
  if (!contenedor) return;

  if (!Array.isArray(productosSeleccionadosEnFormulario) || productosSeleccionadosEnFormulario.length === 0) {
    contenedor.innerHTML = `<div class="turno-detalle" style="margin:0;">Sin productos seleccionados.</div>`;
    actualizarMontoServicioSeleccionado();
    return;
  }

  contenedor.innerHTML = productosSeleccionadosEnFormulario
    .map((nombre, indice) => {
      let nombreSeguro = escaparHTML(nombre);
      return `<span class="servicio-chip">${nombreSeguro} <button class="servicio-chip-remove" onclick="quitarProductoSeleccionadoTurnoPorIndice(${indice})">x</button></span>`;
    })
    .join(" ");

  actualizarMontoServicioSeleccionado();
}

function agregarProductoSeleccionadoTurno() {
  let selectProducto = document.getElementById("productoTurno");
  if (!selectProducto) return;

  let producto = String(selectProducto.value || "").trim();
  if (!producto) return;

  if (!productosSeleccionadosEnFormulario.includes(producto)) {
    productosSeleccionadosEnFormulario.push(producto);
  }

  selectProducto.value = "";
  renderProductosSeleccionadosAgenda();
}

function quitarProductoSeleccionadoTurnoPorIndice(indice) {
  productosSeleccionadosEnFormulario.splice(indice, 1);
  renderProductosSeleccionadosAgenda();
}

function limpiarFormularioAgenda() {
  let ids = ["fechaTurno", "horaTurno", "clienteTurno", "barberoTurno", "estadoTurno", "servicioTurno", "productoTurno"];
  ids.forEach((id) => {
    let el = document.getElementById(id);
    if (!el) return;
    if (id === "estadoTurno") {
      el.value = "Pendiente";
    } else {
      el.value = "";
    }
  });

  let btn = document.getElementById("btnGuardarTurno");
  if (btn) btn.innerText = "Agendar Turno";

  indiceTurnoEnEdicion = -1;
  serviciosSeleccionadosEnFormulario = [];
  productosSeleccionadosEnFormulario = [];
  renderServiciosSeleccionadosAgenda();
  renderProductosSeleccionadosAgenda();
}

function mostrarAgenda() {
  // 1. Sincronizamos datos globales usando tu coordinador app.js
  if (typeof recargarDatos === "function") {
    recargarDatos();
  }

  // 2. Leemos los datos centralizados desde storage.js
  let cuenta = obtenerCuentaActual();
  let listaClientes = obtenerClientes();
  let listaBarberos = obtenerBarberos();
  let listaServicios = obtenerServiciosConPrecio();
  let listaProductos = obtenerProductos();

  // 3. Aviso de seguridad si faltan datos base
  let alertaFaltanDatos = "";
  if (listaClientes.length === 0 || listaBarberos.length === 0 || (listaServicios.length === 0 && listaProductos.length === 0)) {
    alertaFaltanDatos = `
      <div style="background-color: #eff6ff; color: #1e3a8a; padding: 12px; border-radius: 6px; margin-bottom: 15px; font-size: 14px;">
        <strong>Tip:</strong> Para agendar se requiere fecha, hora y barbero. Cliente/servicios/productos son opcionales.
      </div>
    `;
  }

  // 4. Mapeo de opciones dinámicas (usando nombres como paso intermedio hacia IDs)
  let opcionesClientes = listaClientes.map((c) => {
    let nombreSeguro = escaparHTML(c.nombre);
    return `<option value="${nombreSeguro}">${nombreSeguro}</option>`;
  }).join("");
  let opcionesBarberos = listaBarberos.map((b) => {
    let nombreSeguro = escaparHTML(b);
    return `<option value="${nombreSeguro}">${nombreSeguro}</option>`;
  }).join("");
  let opcionesServicios = listaServicios.map((s) => {
    let nombreSeguro = escaparHTML(s.nombre);
    let precioSeguro = escaparHTML(formatearMonedaAgenda(s.precio));
    return `<option value="${nombreSeguro}">${nombreSeguro} - ${precioSeguro}</option>`;
  }).join("");
  let opcionesProductos = listaProductos.map((p) => {
    let nombreSeguro = escaparHTML(p.nombre);
    let precioSeguro = escaparHTML(formatearMonedaAgenda(p.precio));
    return `<option value="${nombreSeguro}">${nombreSeguro} - ${precioSeguro}</option>`;
  }).join("");

  // 5. Construcción de la interfaz sin emojis y usando tus clases de style.css
  document.getElementById("contenido").innerHTML = `
    <h1>Agenda - ${cuenta.negocio || "Mi Barbería"}</h1>

    ${alertaFaltanDatos}

    <div id="cardNuevoTurno" style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); margin-bottom: 20px;">
        <h3 style="margin-top: 0; color: #111827;">Nuevo Turno</h3>
        
        <div id="errorAgenda" style="color: #ef4444; font-size: 14px; margin-bottom: 10px; display: none;"></div>

        <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 10px;">
            <input type="date" id="fechaTurno" style="width: 100%; box-sizing: border-box; margin-top: 0;">
            <input type="time" id="horaTurno" style="width: 100%; box-sizing: border-box; margin-top: 0;">
        </div>

        <select id="barberoTurno" style="width: 100%; box-sizing: border-box; margin-bottom: 10px; margin-top: 0;">
            <option value="">Seleccionar barbero (obligatorio)...</option>
            ${opcionesBarberos}
        </select>

        <details id="detallesOpcionalesTurno" style="margin-bottom:10px;">
          <summary style="cursor:pointer; color:#334155; font-weight:600;">Datos opcionales (cliente, servicios, productos, estado)</summary>

          <select id="clienteTurno" style="width: 100%; box-sizing: border-box; margin-bottom: 10px; margin-top: 10px;">
              <option value="">Cliente sin definir</option>
              ${opcionesClientes}
          </select>

            <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 10px;">
              <select id="servicioTurno" style="width: 100%; box-sizing: border-box; margin-top: 0;">
                  <option value="">Seleccionar servicio...</option>
                  ${opcionesServicios}
              </select>
          </div>

          <div style="display:flex; gap:10px; align-items:center; margin-bottom:10px; flex-wrap:wrap;">
            <button type="button" onclick="agregarServicioSeleccionadoTurno()" style="margin-top:0; background:#0f766e;">Agregar servicio</button>
            <div id="serviciosSeleccionadosTurno" class="servicios-seleccionados"></div>
          </div>

          <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 10px;">
              <select id="productoTurno" style="width: 100%; box-sizing: border-box; margin-top: 0;">
                  <option value="">Seleccionar producto...</option>
                  ${opcionesProductos}
              </select>
          </div>

          <div style="display:flex; gap:10px; align-items:center; margin-bottom:10px; flex-wrap:wrap;">
            <button type="button" onclick="agregarProductoSeleccionadoTurno()" style="margin-top:0; background:#0f766e;">Agregar producto</button>
            <div id="productosSeleccionadosTurno" class="servicios-seleccionados"></div>
          </div>

          <div id="montoServicioTurno" style="background: #eff6ff; color: #1e3a8a; border-radius: 6px; padding: 10px; font-size: 14px; margin-bottom: 10px;">
            Monto estimado: ARS 0
          </div>

          <select id="estadoTurno" style="width: 100%; box-sizing: border-box; margin-bottom: 10px; margin-top: 0;">
              <option value="Pendiente">Estado: Pendiente</option>
              <option value="Confirmado">Estado: Confirmado</option>
              <option value="Realizado">Estado: Realizado</option>
            <option value="No asistió">Estado: No asistió</option>
              <option value="Cancelado">Estado: Cancelado</option>
          </select>
        </details>

        <button id="btnGuardarTurno" onclick="agregarTurno()" style="width: 100%; margin-top: 10px;">Agendar Turno</button>
    </div>

    <h2>Lista de Turnos</h2>
    <ul id="listaTurnos"></ul>
  `;

  actualizarListaTurnos();

  renderServiciosSeleccionadosAgenda();
  renderProductosSeleccionadosAgenda();
}

function agregarTurno() {
  let fecha = document.getElementById("fechaTurno").value;
  let hora = document.getElementById("horaTurno").value;
  let cliente = document.getElementById("clienteTurno")?.value || "";
  let barbero = document.getElementById("barberoTurno")?.value || "";
  let estado = document.getElementById("estadoTurno")?.value || "Pendiente";
  let servicios = Array.isArray(serviciosSeleccionadosEnFormulario) ? [...serviciosSeleccionadosEnFormulario] : [];
  let productos = Array.isArray(productosSeleccionadosEnFormulario) ? [...productosSeleccionadosEnFormulario] : [];
  let montoServicio = calcularMontoServicios(servicios) + calcularMontoProductos(productos);
  
  let errorAgenda = document.getElementById("errorAgenda");
  if (errorAgenda) errorAgenda.style.display = "none";

  if (fecha === "" || hora === "" || barbero === "") {
    if (errorAgenda) {
      errorAgenda.innerText = "Completa fecha, hora y barbero para agendar.";
      errorAgenda.style.display = "block";
    }
    return;
  }

  // Traemos los datos frescos desde storage
  let listaTurnosActuales = obtenerTurnos();

  let choqueBarbero = listaTurnosActuales.some((turno, i) => {
    if (i === indiceTurnoEnEdicion) return false;
    let mismoDia = turno.fecha === fecha;
    let mismaHora = turno.hora === hora;
    let mismoBarbero = normalizarAgendaTexto(turno.barbero) === normalizarAgendaTexto(barbero);
    let turnoCancelado = esTurnoCancelado(turno);
    return mismoDia && mismaHora && mismoBarbero && !turnoCancelado;
  });

  if (choqueBarbero) {
    if (errorAgenda) {
      errorAgenda.innerText = "Ese barbero ya tiene un turno en la misma fecha y hora.";
      errorAgenda.style.display = "block";
    }
    return;
  }

  let choqueCliente = cliente ? listaTurnosActuales.some((turno, i) => {
    if (i === indiceTurnoEnEdicion) return false;
    let mismoDia = turno.fecha === fecha;
    let mismaHora = turno.hora === hora;
    let nombreTurno = turno.cliente || turno.nombre || "";
    let mismoCliente = normalizarAgendaTexto(nombreTurno) === normalizarAgendaTexto(cliente);
    let turnoCancelado = esTurnoCancelado(turno);
    return mismoDia && mismaHora && mismoCliente && !turnoCancelado;
  }) : false;

  if (choqueCliente) {
    if (errorAgenda) {
      errorAgenda.innerText = "Ese cliente ya tiene un turno en la misma fecha y hora.";
      errorAgenda.style.display = "block";
    }
    return;
  }

  let nuevoTurno = {
    cliente: cliente,
    fecha: fecha,
    hora: hora,
    barbero: barbero,
    servicios: servicios,
    servicio: servicios.join(" + "),
    productos: productos,
    producto: productos.join(" + "),
    estado: estado,
    montoServicio: montoServicio
  };

  if (indiceTurnoEnEdicion >= 0 && listaTurnosActuales[indiceTurnoEnEdicion]) {
    listaTurnosActuales[indiceTurnoEnEdicion] = nuevoTurno;
  } else {
    listaTurnosActuales.push(nuevoTurno);
  }

  // Guardamos a través del storage centralizado
  guardarTurnos(listaTurnosActuales);

  indiceTurnoEnEdicion = -1;
  serviciosSeleccionadosEnFormulario = [];
  productosSeleccionadosEnFormulario = [];
  mostrarAgenda();
}

function eliminarTurno(indice) {
  let listaTurnosActuales = obtenerTurnos();
  listaTurnosActuales.splice(indice, 1);
  
  guardarTurnos(listaTurnosActuales);
  actualizarListaTurnos();
}

function editarTurno(indice) {
  let listaTurnosActuales = obtenerTurnos();
  let turno = listaTurnosActuales[indice];
  if (!turno) return;

  let fechaTurno = document.getElementById("fechaTurno");
  let horaTurno = document.getElementById("horaTurno");
  let clienteTurno = document.getElementById("clienteTurno");
  let barberoTurno = document.getElementById("barberoTurno");
  let estadoTurno = document.getElementById("estadoTurno");
  let btn = document.getElementById("btnGuardarTurno");

  if (!fechaTurno || !horaTurno || !clienteTurno || !barberoTurno || !estadoTurno) return;

  fechaTurno.value = turno.fecha || "";
  horaTurno.value = turno.hora || "";
  clienteTurno.value = turno.cliente || turno.nombre || "";
  barberoTurno.value = turno.barbero || "";
  estadoTurno.value = turno.estado || "Pendiente";

  let detallesOpcionales = document.getElementById("detallesOpcionalesTurno");
  if (detallesOpcionales) detallesOpcionales.open = true;

  serviciosSeleccionadosEnFormulario = normalizarServiciosTurno(turno);
  productosSeleccionadosEnFormulario = normalizarProductosTurno(turno);
  renderServiciosSeleccionadosAgenda();
  renderProductosSeleccionadosAgenda();

  indiceTurnoEnEdicion = indice;
  if (btn) btn.innerText = "Guardar cambios";
}

function actualizarListaTurnos() {
  let lista = document.getElementById("listaTurnos");
  if (!lista) return;

  lista.innerHTML = "";
  let listaTurnosActuales = obtenerTurnos();

  listaTurnosActuales.forEach((turno, indice) => {
    let li = document.createElement("li");
    li.className = "turno-item"; 

    // Colores discretos según el estado para mejor lectura
    let colorEstado = "#475569"; 
    if (turno.estado === "Confirmado") colorEstado = "#2563eb";
    if (turno.estado === "Realizado") colorEstado = "#16a34a";
    if (String(turno.estado || "").trim().toLowerCase() === "no asistió" || String(turno.estado || "").trim().toLowerCase() === "no asistio") colorEstado = "#f59e0b";
    if (esTurnoCancelado(turno)) colorEstado = "#ef4444"; 

    // COMPATIBILIDAD HACIA ATRÁS: Si es un turno viejo, leemos 'turno.nombre' en lugar de 'turno.cliente'
    let nombreMostrar = escaparHTML(turno.cliente || turno.nombre || "Cliente sin definir");
    let fechaMostrar = escaparHTML(turno.fecha || "Sin fecha asignada");
    let estadoMostrar = escaparHTML(turno.estado || "Pendiente");
    let horaMostrar = escaparHTML(turno.hora || "Sin hora asignada");
    let barberoMostrar = escaparHTML(turno.barbero || "Barbero sin definir");
    let serviciosTurno = normalizarServiciosTurno(turno);
    let productosTurno = normalizarProductosTurno(turno);
    let servicioMostrar = escaparHTML(serviciosTurno.length > 0 ? serviciosTurno.join(", ") : (turno.servicio || "Servicio Desconocido"));
    let productoMostrar = escaparHTML(productosTurno.length > 0 ? productosTurno.join(", ") : (turno.producto || "Sin productos"));
    let montoTurno = Number.isFinite(Number(turno.montoServicio)) ? Number(turno.montoServicio) : (calcularMontoServicios(serviciosTurno) + calcularMontoProductos(productosTurno));
    let montoMostrar = escaparHTML(formatearMonedaAgenda(montoTurno));

    li.innerHTML = `
      <div class="turno-info" style="width: 100%;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 8px;">
          <span class="turno-nombre" style="font-size: 18px;">${nombreMostrar}</span>
          <span style="background: ${colorEstado}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">${estadoMostrar}</span>
        </div>
        
        <div style="display: flex; gap: 15px; flex-wrap: wrap; margin-top: 8px;">
          <div class="turno-detalle">Fecha: ${fechaMostrar}</div>
          <div class="turno-detalle">Hora: ${horaMostrar}</div>
          <div class="turno-detalle">Barbero: ${barberoMostrar}</div>
          <div class="turno-detalle">Servicio: ${servicioMostrar}</div>
          <div class="turno-detalle">Productos: ${productoMostrar}</div>
          <div class="turno-detalle">Monto: ${montoMostrar}</div>
        </div>
      </div>

      <div class="acciones-item">
        <button class="btn-accion" onclick="editarTurno(${indice})">Editar</button>
        <button class="btn-eliminar" onclick="eliminarTurno(${indice})">Eliminar</button>
      </div>
    `;

    lista.appendChild(li);
  });
}