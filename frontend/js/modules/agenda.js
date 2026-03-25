// ========================================
// MÓDULO: AGENDA
// ========================================

function normalizarAgendaTexto(valor) {
  return (valor || "").trim().toLowerCase();
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
  let listaServicios = obtenerServicios();

  // 3. Aviso de seguridad si faltan datos base
  let alertaFaltanDatos = "";
  if (listaClientes.length === 0 || listaBarberos.length === 0 || listaServicios.length === 0) {
    alertaFaltanDatos = `
      <div style="background-color: #fee2e2; color: #b91c1c; padding: 12px; border-radius: 6px; margin-bottom: 15px; font-size: 14px;">
        <strong>Aviso:</strong> Para agendar correctamente, asegúrate de registrar al menos un cliente, un barbero y un servicio en sus respectivas secciones.
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
    let nombreSeguro = escaparHTML(s);
    return `<option value="${nombreSeguro}">${nombreSeguro}</option>`;
  }).join("");

  // 5. Construcción de la interfaz sin emojis y usando tus clases de style.css
  document.getElementById("contenido").innerHTML = `
    <h1>Agenda - ${cuenta.negocio || "Mi Barbería"}</h1>

    ${alertaFaltanDatos}

    <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); margin-bottom: 20px; max-width: 600px;">
        <h3 style="margin-top: 0; color: #111827;">Nuevo Turno</h3>
        
        <div id="errorAgenda" style="color: #ef4444; font-size: 14px; margin-bottom: 10px; display: none;"></div>

        <div style="display: flex; gap: 10px; margin-bottom: 10px;">
            <input type="date" id="fechaTurno" style="width: 100%; box-sizing: border-box; margin-top: 0;">
            <input type="time" id="horaTurno" style="width: 100%; box-sizing: border-box; margin-top: 0;">
        </div>

        <select id="clienteTurno" style="width: 100%; box-sizing: border-box; margin-bottom: 10px; margin-top: 0;">
            <option value="">Seleccionar cliente...</option>
            ${opcionesClientes}
        </select>

        <div style="display: flex; gap: 10px; margin-bottom: 10px;">
            <select id="barberoTurno" style="width: 100%; box-sizing: border-box; margin-top: 0;">
                <option value="">Seleccionar barbero...</option>
                ${opcionesBarberos}
            </select>

            <select id="servicioTurno" style="width: 100%; box-sizing: border-box; margin-top: 0;">
                <option value="">Seleccionar servicio...</option>
                ${opcionesServicios}
            </select>
        </div>

        <select id="estadoTurno" style="width: 100%; box-sizing: border-box; margin-bottom: 10px; margin-top: 0;">
            <option value="Pendiente">Estado: Pendiente</option>
            <option value="Confirmado">Estado: Confirmado</option>
            <option value="Realizado">Estado: Realizado</option>
            <option value="Cancelado">Estado: Cancelado</option>
        </select>

        <button onclick="agregarTurno()" style="width: 100%; margin-top: 10px;">Agendar Turno</button>
    </div>

    <h2>Lista de Turnos</h2>
    <ul id="listaTurnos"></ul>
  `;

  actualizarListaTurnos();
}

function agregarTurno() {
  let fecha = document.getElementById("fechaTurno").value;
  let hora = document.getElementById("horaTurno").value;
  let cliente = document.getElementById("clienteTurno").value;
  let barbero = document.getElementById("barberoTurno").value;
  let servicio = document.getElementById("servicioTurno").value;
  let estado = document.getElementById("estadoTurno").value;
  
  let errorAgenda = document.getElementById("errorAgenda");
  if (errorAgenda) errorAgenda.style.display = "none";

  if (fecha === "" || hora === "" || cliente === "" || barbero === "" || servicio === "") {
    if (errorAgenda) {
      errorAgenda.innerText = "Por favor, completa todos los campos del turno.";
      errorAgenda.style.display = "block";
    }
    return;
  }

  // Traemos los datos frescos desde storage
  let listaTurnosActuales = obtenerTurnos();

  let choqueBarbero = listaTurnosActuales.some((turno) => {
    let mismoDia = turno.fecha === fecha;
    let mismaHora = turno.hora === hora;
    let mismoBarbero = normalizarAgendaTexto(turno.barbero) === normalizarAgendaTexto(barbero);
    let turnoCancelado = turno.estado === "Cancelado";
    return mismoDia && mismaHora && mismoBarbero && !turnoCancelado;
  });

  if (choqueBarbero) {
    if (errorAgenda) {
      errorAgenda.innerText = "Ese barbero ya tiene un turno en la misma fecha y hora.";
      errorAgenda.style.display = "block";
    }
    return;
  }

  let choqueCliente = listaTurnosActuales.some((turno) => {
    let mismoDia = turno.fecha === fecha;
    let mismaHora = turno.hora === hora;
    let nombreTurno = turno.cliente || turno.nombre || "";
    let mismoCliente = normalizarAgendaTexto(nombreTurno) === normalizarAgendaTexto(cliente);
    let turnoCancelado = turno.estado === "Cancelado";
    return mismoDia && mismaHora && mismoCliente && !turnoCancelado;
  });

  if (choqueCliente) {
    if (errorAgenda) {
      errorAgenda.innerText = "Ese cliente ya tiene un turno en la misma fecha y hora.";
      errorAgenda.style.display = "block";
    }
    return;
  }

  listaTurnosActuales.push({
    cliente: cliente, 
    fecha: fecha,
    hora: hora,
    barbero: barbero,
    servicio: servicio,
    estado: estado
  });

  // Guardamos a través del storage centralizado
  guardarTurnos(listaTurnosActuales);

  // Recargar la vista
  mostrarAgenda();
}

function eliminarTurno(indice) {
  let listaTurnosActuales = obtenerTurnos();
  listaTurnosActuales.splice(indice, 1);
  
  guardarTurnos(listaTurnosActuales);
  actualizarListaTurnos();
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
    if (turno.estado === "Cancelado") colorEstado = "#ef4444"; 

    // COMPATIBILIDAD HACIA ATRÁS: Si es un turno viejo, leemos 'turno.nombre' en lugar de 'turno.cliente'
    let nombreMostrar = escaparHTML(turno.cliente || turno.nombre || "Cliente Desconocido");
    let fechaMostrar = escaparHTML(turno.fecha || "Sin fecha asignada");
    let estadoMostrar = escaparHTML(turno.estado || "Pendiente");
    let horaMostrar = escaparHTML(turno.hora || "Sin hora asignada");
    let barberoMostrar = escaparHTML(turno.barbero || "Barbero Desconocido");
    let servicioMostrar = escaparHTML(turno.servicio || "Servicio Desconocido");

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
        </div>
      </div>

      <div style="display: flex; align-items: center; margin-left: 15px;">
        <button class="btn-eliminar" onclick="eliminarTurno(${indice})">Eliminar</button>
      </div>
    `;

    lista.appendChild(li);
  });
}