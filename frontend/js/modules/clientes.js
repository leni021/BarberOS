// ========================================
// MÓDULO: CLIENTES
// ========================================

function normalizarNombreCliente(valor) {
  return (valor || "").trim().toLowerCase();
}

function formatearFechaCliente(fecha) {
  if (!fecha) return "Sin registro";
  if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    let [anio, mes, dia] = fecha.split("-");
    return `${dia}/${mes}/${anio}`;
  }
  return fecha;
}

function mostrarClientes() {
  recargarDatos();

  document.getElementById("contenido").innerHTML = `
    <h1>Clientes</h1>

    <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); margin-bottom: 20px; max-width: 500px;">
      <h3 style="margin-top: 0; color: #111827;">Nuevo Cliente</h3>

      <div id="errorCliente" style="color: #ef4444; font-size: 14px; margin-bottom: 10px; display: none;"></div>

      <input id="nuevoNombreCliente" placeholder="Nombre completo" style="margin-bottom: 10px; width: 100%; box-sizing: border-box;">
      <input id="nuevoTelefonoCliente" placeholder="Teléfono (Opcional)" style="margin-bottom: 10px; width: 100%; box-sizing: border-box;">
      <input id="nuevasObservaciones" placeholder="Observaciones (ej: Degradado alto, sin gel)" style="margin-bottom: 10px; width: 100%; box-sizing: border-box;">

      <button onclick="agregarCliente()" style="width: 100%; margin-top: 10px;">Guardar Cliente</button>
    </div>

    <h2>Lista de Clientes</h2>
    <ul id="listaClientes"></ul>
  `;

  actualizarListaClientes();
}

function agregarCliente() {
  let nombre = document.getElementById("nuevoNombreCliente").value.trim();
  let telefono = document.getElementById("nuevoTelefonoCliente").value.trim();
  let observaciones = document.getElementById("nuevasObservaciones").value.trim();
  let errorCliente = document.getElementById("errorCliente");

  if (errorCliente) {
    errorCliente.style.display = "none";
  }

  if (nombre === "") {
    if (errorCliente) {
      errorCliente.innerText = "Por favor, ingresa al menos el nombre del cliente.";
      errorCliente.style.display = "block";
    }
    return;
  }

  let nombreNormalizado = normalizarNombreCliente(nombre);
  let existeCliente = clientes.some((cliente) => normalizarNombreCliente(cliente.nombre) === nombreNormalizado);

  if (existeCliente) {
    if (errorCliente) {
      errorCliente.innerText = "Ese cliente ya existe en la lista.";
      errorCliente.style.display = "block";
    }
    return;
  }

  let fechaHoy = new Date().toISOString().slice(0, 10);

  clientes.push({
    nombre,
    telefono,
    observaciones,
    ultimaVisita: fechaHoy
  });

  guardarClientes(clientes);
  mostrarClientes();
}

function eliminarCliente(indice) {
  let clienteAEliminar = clientes[indice];
  if (!clienteAEliminar) return;

  let nombreCliente = normalizarNombreCliente(clienteAEliminar.nombre);
  let turnos = obtenerTurnos();
  let clienteEnUso = turnos.some((turno) => {
    let nombreTurno = turno.cliente || turno.nombre || "";
    return normalizarNombreCliente(nombreTurno) === nombreCliente;
  });

  if (clienteEnUso) {
    alert("No puedes eliminar este cliente porque tiene turnos cargados.");
    return;
  }

  clientes.splice(indice, 1);
  guardarClientes(clientes);
  actualizarListaClientes();
}

function actualizarListaClientes() {
  let lista = document.getElementById("listaClientes");
  if (!lista) return;

  lista.innerHTML = "";

  clientes.forEach((cliente, indice) => {
    let li = document.createElement("li");
    li.className = "turno-item";

    let nombreSeguro = escaparHTML(cliente.nombre || "");
    let telefonoSeguro = escaparHTML(cliente.telefono || "");
    let observacionesSeguro = escaparHTML(cliente.observaciones || "");
    let fechaSeguro = escaparHTML(formatearFechaCliente(cliente.ultimaVisita));

    li.innerHTML = `
      <div class="turno-info">
        <div class="turno-nombre" style="font-size: 18px;">${nombreSeguro}</div>
        <div class="turno-detalle">${cliente.telefono ? "Tel: " + telefonoSeguro : "Sin teléfono"}</div>
        <div class="turno-detalle">${cliente.observaciones ? "Obs: " + observacionesSeguro : "Sin observaciones"}</div>
        <div class="turno-detalle" style="font-size: 12px; margin-top: 6px; color: #2563eb;">Última visita: ${fechaSeguro}</div>
      </div>

      <button class="btn-eliminar" onclick="eliminarCliente(${indice})">Eliminar</button>
    `;

    lista.appendChild(li);
  });
}