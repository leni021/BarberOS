// ========================================
// MÓDULO: SERVICIOS
// ========================================

function normalizarNombreServicio(valor) {
  return String(valor || "").trim().toLowerCase();
}

function obtenerNombreServicioTurno(turno) {
  if (!turno || typeof turno !== "object") return "";

  if (typeof turno.servicio === "string") {
    return turno.servicio;
  }

  if (turno.servicio && typeof turno.servicio === "object") {
    return String(turno.servicio.nombre || "");
  }

  return "";
}

function normalizarServicioParaVista(servicio) {
  if (typeof servicio === "string") {
    let nombreDesdeTexto = servicio.trim();
    return nombreDesdeTexto ? { nombre: nombreDesdeTexto, precio: 0 } : null;
  }

  if (!servicio || typeof servicio !== "object") return null;

  let nombre = String(servicio.nombre || "").trim();
  if (!nombre) return null;

  let precio = Number(servicio.precio);
  if (!Number.isFinite(precio) || precio < 0) precio = 0;

  return { nombre, precio };
}

function obtenerServiciosConPrecioSeguros() {
  let base = obtenerServiciosConPrecio();
  if (!Array.isArray(base)) return [];

  return base
    .map((servicio) => normalizarServicioParaVista(servicio))
    .filter(Boolean);
}

function mostrarMensajeServicios(mensaje, tipo = "error") {
  let contenedor = document.getElementById("mensajeServicios");
  if (!contenedor) return;

  let esError = tipo === "error";
  contenedor.style.display = "block";
  contenedor.style.backgroundColor = esError ? "#fee2e2" : "#dcfce7";
  contenedor.style.color = esError ? "#b91c1c" : "#166534";
  contenedor.style.border = `1px solid ${esError ? "#fecaca" : "#86efac"}`;
  contenedor.innerText = mensaje;
}

function limpiarMensajeServicios() {
  let contenedor = document.getElementById("mensajeServicios");
  if (!contenedor) return;
  contenedor.style.display = "none";
  contenedor.innerText = "";
}

let indiceServicioEnEdicion = -1;

function mostrarServicios() {
  recargarDatos();

  let serviciosConPrecio = obtenerServiciosConPrecioSeguros();

  document.getElementById("contenido").innerHTML = `
    <h1>Servicios</h1>

    <div id="mensajeServicios" style="display:none; margin-bottom: 12px; padding: 10px 12px; border-radius: 6px; font-size: 14px;"></div>

    <form id="formServicio" style="background: white; padding: 16px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); margin-bottom: 16px;">
      <input id="nuevoServicio" placeholder="Nombre del servicio" style="margin-bottom: 10px;">
      <input id="precioServicio" type="number" min="0" step="0.01" placeholder="Precio (ej: 4500)" style="margin-top: 0; margin-bottom: 10px;">
      <button type="submit">Agregar servicio</button>
    </form>

    <ul id="listaServicios"></ul>
  `;

  let formServicio = document.getElementById("formServicio");
  if (formServicio) {
    formServicio.addEventListener("submit", (event) => {
      event.preventDefault();
      agregarServicio();
    });
  }

  limpiarMensajeServicios();

  actualizarListaServicios(serviciosConPrecio);
}

function agregarServicio() {
  let input = document.getElementById("nuevoServicio");
  let inputPrecio = document.getElementById("precioServicio");
  if (!input || !inputPrecio) return;

  let nombre = input.value.trim();
  let precioTexto = String(inputPrecio.value || "").replace(",", ".");
  let precio = precioTexto === "" ? 0 : Number(precioTexto);

  if (nombre === "") return;
  if (!Number.isFinite(precio) || precio < 0) {
    mostrarMensajeServicios("Ingresa un precio valido mayor o igual a 0.", "error");
    return;
  }

  let serviciosConPrecio = obtenerServiciosConPrecioSeguros();
  let nombreNormalizado = normalizarNombreServicio(nombre);
  let existeServicio = serviciosConPrecio.some((servicio) => normalizarNombreServicio(servicio.nombre) === nombreNormalizado);
  if (existeServicio) {
    mostrarMensajeServicios("Ese servicio ya existe en la lista.", "error");
    return;
  }

  serviciosConPrecio.push({ nombre, precio });
  guardarServiciosConPrecio(serviciosConPrecio);
  if (typeof recargarDatos === "function") recargarDatos();
  input.value = "";
  inputPrecio.value = "";
  mostrarMensajeServicios("Servicio agregado correctamente.", "ok");

  actualizarListaServicios(obtenerServiciosConPrecioSeguros());
}

function eliminarServicio(indice) {
  try {
    let serviciosConPrecio = obtenerServiciosConPrecioSeguros();
    let servicioAEliminar = serviciosConPrecio[indice];
    if (!servicioAEliminar) return;

    let nombreServicio = normalizarNombreServicio(servicioAEliminar.nombre);
    let turnos = obtenerTurnos();

    let servicioEnUso = turnos.some((turno) => {
      let estadoTurno = String(turno && turno.estado ? turno.estado : "Pendiente").trim().toLowerCase();
      if (estadoTurno === "cancelado") return false;

      let nombreEnTurno = normalizarNombreServicio(obtenerNombreServicioTurno(turno));
      return nombreEnTurno === nombreServicio;
    });

    if (servicioEnUso) {
      mostrarMensajeServicios("No puedes eliminar este servicio porque tiene turnos activos asociados.", "error");
      return;
    }

    serviciosConPrecio.splice(indice, 1);
    guardarServiciosConPrecio(serviciosConPrecio);
    if (typeof recargarDatos === "function") recargarDatos();
    mostrarMensajeServicios("Servicio eliminado correctamente.", "ok");
    actualizarListaServicios(obtenerServiciosConPrecioSeguros());
  } catch (error) {
    console.error("Error al eliminar servicio:", error);
    mostrarMensajeServicios("Ocurrió un error al eliminar el servicio. Intenta nuevamente.", "error");
  }
}

function formatearPrecioServicio(precio) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(Number(precio) || 0);
}

function actualizarListaServicios(serviciosConPrecio = obtenerServiciosConPrecioSeguros()) {
  let lista = document.getElementById("listaServicios");
  if (!lista) return;

  lista.innerHTML = "";

  let serviciosSeguros = Array.isArray(serviciosConPrecio)
    ? serviciosConPrecio.map((servicio) => normalizarServicioParaVista(servicio)).filter(Boolean)
    : [];

  if (serviciosSeguros.length === 0) {
    let liVacio = document.createElement("li");
    liVacio.className = "turno-item";
    liVacio.innerHTML = `
      <div class="turno-info">
        <div class="turno-detalle">No hay servicios cargados.</div>
      </div>
    `;
    lista.appendChild(liVacio);
    return;
  }

  serviciosSeguros.forEach((servicio, indice) => {
    let li = document.createElement("li");
    li.className = "turno-item";

    if (indice === indiceServicioEnEdicion) {
      let nombreEdit = escaparHTML(servicio.nombre || "");
      let precioEdit = Number(servicio.precio || 0);

      li.innerHTML = `
        <div class="turno-info" style="width:100%;">
          <input id="editNombreServicio" value="${nombreEdit}" placeholder="Nombre del servicio" style="margin-top:0; margin-bottom:8px;">
          <input id="editPrecioServicio" type="number" min="0" step="0.01" value="${precioEdit}" placeholder="Precio" style="margin-top:0; margin-bottom:8px;">
          <div class="acciones-item">
            <button onclick="guardarEdicionServicio(${indice})">Guardar</button>
            <button onclick="cancelarEdicionServicio()" style="background:#475569;">Cancelar</button>
          </div>
        </div>
      `;

      lista.appendChild(li);
      return;
    }

    let servicioSeguro = escaparHTML(servicio.nombre);
    let precioSeguro = escaparHTML(formatearPrecioServicio(servicio.precio));

    li.innerHTML = `
      <div class="turno-info">
        <div class="turno-nombre">${servicioSeguro}</div>
        <div class="turno-detalle">Precio: ${precioSeguro}</div>
      </div>

      <div class="acciones-item">
        <button class="btn-accion" onclick="iniciarEdicionServicio(${indice})">Editar</button>
        <button class="btn-eliminar" onclick="eliminarServicio(${indice})">Eliminar</button>
      </div>
    `;

    lista.appendChild(li);
  });
}

function iniciarEdicionServicio(indice) {
  indiceServicioEnEdicion = indice;
  actualizarListaServicios(obtenerServiciosConPrecioSeguros());
}

function cancelarEdicionServicio() {
  indiceServicioEnEdicion = -1;
  actualizarListaServicios(obtenerServiciosConPrecioSeguros());
}

function guardarEdicionServicio(indice) {
  let nombre = String(document.getElementById("editNombreServicio")?.value || "").trim();
  let precioTexto = String(document.getElementById("editPrecioServicio")?.value || "").replace(",", ".");
  let precio = precioTexto === "" ? 0 : Number(precioTexto);

  if (!nombre) {
    mostrarMensajeServicios("El nombre del servicio no puede quedar vacío.", "error");
    return;
  }
  if (!Number.isFinite(precio) || precio < 0) {
    mostrarMensajeServicios("Ingresa un precio válido mayor o igual a 0.", "error");
    return;
  }

  let serviciosConPrecio = obtenerServiciosConPrecioSeguros();
  let nombreNormalizado = normalizarNombreServicio(nombre);
  let duplicado = serviciosConPrecio.some((servicio, i) => i !== indice && normalizarNombreServicio(servicio.nombre) === nombreNormalizado);
  if (duplicado) {
    mostrarMensajeServicios("Ya existe otro servicio con ese nombre.", "error");
    return;
  }

  if (!serviciosConPrecio[indice]) return;
  serviciosConPrecio[indice] = { nombre, precio };
  guardarServiciosConPrecio(serviciosConPrecio);
  if (typeof recargarDatos === "function") recargarDatos();

  indiceServicioEnEdicion = -1;
  mostrarMensajeServicios("Servicio actualizado correctamente.", "ok");
  actualizarListaServicios(obtenerServiciosConPrecioSeguros());
}