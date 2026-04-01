// ========================================
// MÓDULO: CLIENTES
// ========================================

function normalizarNombreCliente(valor) {
  return (valor || "").trim().toLowerCase();
}

// formatearFecha → utils.js

function mostrarMensajeClientes(mensaje, tipo = "error") {
  let contenedor = document.getElementById("mensajeClientes");
  if (!contenedor) return;

  let esError = tipo === "error";
  contenedor.style.display = "block";
  contenedor.style.backgroundColor = esError ? "#fee2e2" : "#dcfce7";
  contenedor.style.color = esError ? "#b91c1c" : "#166534";
  contenedor.style.border = `1px solid ${esError ? "#fecaca" : "#86efac"}`;
  contenedor.innerText = mensaje;
}

function limpiarMensajeClientes() {
  let contenedor = document.getElementById("mensajeClientes");
  if (!contenedor) return;
  contenedor.style.display = "none";
  contenedor.innerText = "";
}

let indiceClienteEnEdicion = -1;
let paginaClientesActual = 1;
const TAMANO_PAGINA_CLIENTES = 50;
let filtroClientesTexto = "";

function limpiarFiltrosClientes() {
  filtroClientesTexto = "";
  paginaClientesActual = 1;
  mostrarClientes();
}

function irPaginaClientes(nuevaPagina) {
  paginaClientesActual = Math.max(1, Number(nuevaPagina) || 1);
  actualizarListaClientes();
}

function obtenerClientesFiltradosConIndice() {
  let textoBuscado = normalizarNombreCliente(filtroClientesTexto);

  return clientes
    .map((cliente, indiceOriginal) => ({ cliente, indiceOriginal }))
    .filter(({ cliente }) => {
      if (!textoBuscado) return true;
      let compuesto = `${cliente.nombre || ""} ${cliente.telefono || ""} ${cliente.observaciones || ""}`;
      return normalizarNombreCliente(compuesto).includes(textoBuscado);
    })
    .reverse(); // Mostramos los últimos agregados primero por default
}

function mostrarClientes() {
  recargarDatos();

  document.getElementById("contenido").innerHTML = `
    <h1>Clientes</h1>

    <div id="mensajeClientes" style="display:none; margin-bottom: 12px; padding: 10px 12px; border-radius: 6px; font-size: 14px;"></div>

    <div id="cardNuevoCliente" style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); margin-bottom: 20px;">
      <h3 style="margin-top: 0; color: #111827;">Nuevo Cliente</h3>

      <div id="errorCliente" style="color: #ef4444; font-size: 14px; margin-bottom: 10px; display: none;"></div>

      <input id="nuevoNombreCliente" placeholder="Nombre completo" style="margin-bottom: 10px; width: 100%; box-sizing: border-box;">
      <input id="nuevoTelefonoCliente" placeholder="Teléfono (Opcional)" style="margin-bottom: 10px; width: 100%; box-sizing: border-box;">
      <input id="nuevasObservaciones" placeholder="Observaciones (ej: Degradado alto, sin gel)" style="margin-bottom: 10px; width: 100%; box-sizing: border-box;">

      <button onclick="agregarCliente()" style="width: 100%; margin-top: 10px;">Guardar Cliente</button>
    </div>

    <h2>Lista de Clientes</h2>
    
    <div class="agenda-filtros" style="margin-bottom: 16px;">
      <div class="agenda-filtro-group" style="flex: 1 1 300px;">
        <label>Buscar cliente</label>
        <input id="filtroTextoClientes" type="text" placeholder="Nombre, teléfono u observaciones..." value="${escaparHTML(filtroClientesTexto)}">
      </div>
      <button type="button" class="agenda-accion-secundaria" onclick="limpiarFiltrosClientes()">Limpiar filtro</button>
    </div>

    <div id="resumenPaginacionClientes" class="agenda-resumen"></div>
    <ul id="listaClientes"></ul>
    <div id="controlesPaginacionClientes" class="agenda-paginacion"></div>
  `;

  limpiarMensajeClientes();

  let inputFiltro = document.getElementById("filtroTextoClientes");
  if (inputFiltro) {
    inputFiltro.addEventListener("input", (e) => {
      filtroClientesTexto = String(e.target.value || "");
      paginaClientesActual = 1;
      actualizarListaClientes();
    });
  }

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
    mostrarMensajeClientes("Completa el nombre del cliente para guardar.", "error");
    return;
  }

  let nombreNormalizado = normalizarNombreCliente(nombre);
  let existeCliente = clientes.some((cliente) => normalizarNombreCliente(cliente.nombre) === nombreNormalizado);

  if (existeCliente) {
    if (errorCliente) {
      errorCliente.innerText = "Ese cliente ya existe en la lista.";
      errorCliente.style.display = "block";
    }
    mostrarMensajeClientes("Ese cliente ya existe en la lista.", "error");
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
  
  // Limpiamos los filtros para que el usuario vea su cliente recién agregado
  filtroClientesTexto = "";
  paginaClientesActual = 1;

  mostrarClientes();
  mostrarMensajeClientes("Cliente guardado correctamente.", "ok");
}

function eliminarCliente(indice) {
  try {
    let clienteAEliminar = clientes[indice];
    if (!clienteAEliminar) return;

    let nombreCliente = normalizarNombreCliente(clienteAEliminar.nombre);
    let turnos = obtenerTurnos();
    let clienteEnUso = turnos.some((turno) => {
      let estadoTurno = String(turno && turno.estado ? turno.estado : "Pendiente").trim().toLowerCase();
      if (estadoTurno === "cancelado") return false;

      let nombreTurno = turno.cliente || turno.nombre || "";
      return normalizarNombreCliente(nombreTurno) === nombreCliente;
    });

    if (clienteEnUso) {
      mostrarMensajeClientes("No puedes eliminar este cliente porque tiene turnos cargados.", "error");
      return;
    }

    clientes.splice(indice, 1);
    guardarClientes(clientes);
    mostrarMensajeClientes("Cliente eliminado correctamente.", "ok");
    
    // Si la página se quedó vacía por borrar el último, retrocedemos
    let filtrados = obtenerClientesFiltradosConIndice();
    let totalPaginas = Math.max(1, Math.ceil(filtrados.length / TAMANO_PAGINA_CLIENTES));
    if (paginaClientesActual > totalPaginas) paginaClientesActual = totalPaginas;

    actualizarListaClientes();
  } catch (error) {
    console.error("Error al eliminar cliente:", error);
    mostrarMensajeClientes("Ocurrio un error al eliminar el cliente. Intenta nuevamente.", "error");
  }
}

function actualizarListaClientes() {
  let lista = document.getElementById("listaClientes");
  let resumenPaginacion = document.getElementById("resumenPaginacionClientes");
  let controlesPaginacion = document.getElementById("controlesPaginacionClientes");
  
  if (!lista) return;

  lista.innerHTML = "";

  let filtrados = obtenerClientesFiltradosConIndice();
  let total = filtrados.length;
  let totalPaginas = Math.max(1, Math.ceil(total / TAMANO_PAGINA_CLIENTES));
  if (paginaClientesActual > totalPaginas) paginaClientesActual = totalPaginas;

  let inicio = (paginaClientesActual - 1) * TAMANO_PAGINA_CLIENTES;
  let fin = inicio + TAMANO_PAGINA_CLIENTES;
  let paginaItems = filtrados.slice(inicio, fin);

  if (resumenPaginacion) {
    if (total === 0) {
      resumenPaginacion.innerText = "Sin resultados para la búsqueda.";
    } else {
      resumenPaginacion.innerText = `Mostrando ${inicio + 1}-${Math.min(fin, total)} de ${total} clientes (Página ${paginaClientesActual}/${totalPaginas})`;
    }
  }

  if (controlesPaginacion) {
    if (total <= TAMANO_PAGINA_CLIENTES) {
      controlesPaginacion.innerHTML = "";
    } else {
      let deshabilitarPrev = paginaClientesActual <= 1 ? "disabled" : "";
      let deshabilitarNext = paginaClientesActual >= totalPaginas ? "disabled" : "";
      controlesPaginacion.innerHTML = `
        <button type="button" ${deshabilitarPrev} onclick="irPaginaClientes(${paginaClientesActual - 1})" style="margin:0;">Anterior</button>
        <button type="button" ${deshabilitarNext} onclick="irPaginaClientes(${paginaClientesActual + 1})" style="margin:0;">Siguiente</button>
      `;
    }
  }

  if (total === 0) return;

  paginaItems.forEach(({ cliente, indiceOriginal }) => {
    let li = document.createElement("li");
    li.className = "turno-item";

    if (indiceOriginal === indiceClienteEnEdicion) {
      let nombreEdit = escaparHTML(cliente.nombre || "");
      let telefonoEdit = escaparHTML(cliente.telefono || "");
      let obsEdit = escaparHTML(cliente.observaciones || "");

      li.innerHTML = `
        <div class="turno-info" style="width:100%;">
          <input id="editNombreCliente" value="${nombreEdit}" placeholder="Nombre completo" style="margin-top:0; margin-bottom:8px;">
          <input id="editTelefonoCliente" value="${telefonoEdit}" placeholder="Teléfono" style="margin-top:0; margin-bottom:8px;">
          <input id="editObservacionesCliente" value="${obsEdit}" placeholder="Observaciones" style="margin-top:0; margin-bottom:8px;">
          <div class="acciones-item">
            <button onclick="guardarEdicionCliente(${indiceOriginal})">Guardar</button>
            <button onclick="cancelarEdicionCliente()" style="background:#475569;">Cancelar</button>
          </div>
        </div>
      `;

      lista.appendChild(li);
      return;
    }

    let nombreSeguro = escaparHTML(cliente.nombre || "");
    let telefonoSeguro = escaparHTML(cliente.telefono || "");
    let observacionesSeguro = escaparHTML(cliente.observaciones || "");
    let fechaSeguro = escaparHTML(formatearFecha(cliente.ultimaVisita));

    li.innerHTML = `
      <div class="turno-info">
        <div class="turno-nombre" style="font-size: 18px;">${nombreSeguro}</div>
        <div class="meta-row">
          <span class="meta-chip">${cliente.telefono ? "Tel: " + telefonoSeguro : "Sin teléfono"}</span>
          <span class="meta-chip">${cliente.observaciones ? "Obs: " + observacionesSeguro : "Sin observaciones"}</span>
          <span class="meta-chip meta-chip-info">Última visita: ${fechaSeguro}</span>
        </div>
      </div>

      <div class="acciones-item">
        <button class="btn-accion" onclick="iniciarEdicionCliente(${indiceOriginal})">Editar</button>
        <button class="btn-eliminar" onclick="eliminarCliente(${indiceOriginal})">Eliminar</button>
      </div>
    `;

    lista.appendChild(li);
  });
}

function iniciarEdicionCliente(indice) {
  indiceClienteEnEdicion = indice;
  actualizarListaClientes(); // Se dibuja la página actual mostrando el input
}

function cancelarEdicionCliente() {
  indiceClienteEnEdicion = -1;
  actualizarListaClientes();
}

function guardarEdicionCliente(indice) {
  let nombre = String(document.getElementById("editNombreCliente")?.value || "").trim();
  let telefono = String(document.getElementById("editTelefonoCliente")?.value || "").trim();
  let observaciones = String(document.getElementById("editObservacionesCliente")?.value || "").trim();

  if (!nombre) {
    mostrarMensajeClientes("El nombre del cliente no puede quedar vacío.", "error");
    return;
  }

  let nombreNormalizado = normalizarNombreCliente(nombre);
  let duplicado = clientes.some((cliente, i) => i !== indice && normalizarNombreCliente(cliente.nombre) === nombreNormalizado);
  if (duplicado) {
    mostrarMensajeClientes("Ya existe otro cliente con ese nombre.", "error");
    return;
  }

  if (!clientes[indice]) return;
  clientes[indice].nombre = nombre;
  clientes[indice].telefono = telefono;
  clientes[indice].observaciones = observaciones;

  guardarClientes(clientes);
  indiceClienteEnEdicion = -1;
  mostrarMensajeClientes("Cliente actualizado correctamente.", "ok");
  actualizarListaClientes();
}