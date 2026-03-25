// ========================================
// MÓDULO: SERVICIOS
// ========================================

function normalizarNombreServicio(valor) {
  return (valor || "").trim().toLowerCase();
}

function mostrarServicios() {
  recargarDatos();

  let serviciosConPrecio = obtenerServiciosConPrecio();

  document.getElementById("contenido").innerHTML = `
    <h1>Servicios</h1>

    <div style="background: white; padding: 16px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); max-width: 520px; margin-bottom: 16px;">
      <input id="nuevoServicio" placeholder="Nombre del servicio" style="margin-bottom: 10px;">
      <input id="precioServicio" type="number" min="0" step="0.01" placeholder="Precio (ej: 4500)" style="margin-top: 0; margin-bottom: 10px;">
      <button onclick="agregarServicio()">Agregar servicio</button>
    </div>

    <ul id="listaServicios"></ul>
  `;

  actualizarListaServicios(serviciosConPrecio);
}

function agregarServicio() {
  let input = document.getElementById("nuevoServicio");
  let inputPrecio = document.getElementById("precioServicio");
  let nombre = input.value.trim();
  let precio = inputPrecio ? Number(inputPrecio.value) : 0;

  if (nombre === "") return;
  if (!Number.isFinite(precio) || precio < 0) {
    alert("Ingresa un precio valido mayor o igual a 0.");
    return;
  }

  let serviciosConPrecio = obtenerServiciosConPrecio();
  let nombreNormalizado = normalizarNombreServicio(nombre);
  let existeServicio = serviciosConPrecio.some((servicio) => normalizarNombreServicio(servicio.nombre) === nombreNormalizado);
  if (existeServicio) {
    alert("Ese servicio ya existe en la lista.");
    return;
  }

  serviciosConPrecio.push({ nombre, precio });
  guardarServiciosConPrecio(serviciosConPrecio);
  servicios = obtenerServicios();
  input.value = "";
  if (inputPrecio) inputPrecio.value = "";

  actualizarListaServicios(obtenerServiciosConPrecio());
}

function eliminarServicio(indice) {
  let serviciosConPrecio = obtenerServiciosConPrecio();
  let servicioAEliminar = serviciosConPrecio[indice];
  if (!servicioAEliminar) return;

  let nombreServicio = normalizarNombreServicio(servicioAEliminar.nombre);
  let turnos = obtenerTurnos();
  let servicioEnUso = turnos.some((turno) => normalizarNombreServicio(turno.servicio) === nombreServicio);

  if (servicioEnUso) {
    alert("No puedes eliminar este servicio porque tiene turnos cargados.");
    return;
  }

  serviciosConPrecio.splice(indice, 1);
  guardarServiciosConPrecio(serviciosConPrecio);
  servicios = obtenerServicios();
  actualizarListaServicios(obtenerServiciosConPrecio());
}

function formatearPrecioServicio(precio) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(Number(precio) || 0);
}

function actualizarListaServicios(serviciosConPrecio = obtenerServiciosConPrecio()) {
  let lista = document.getElementById("listaServicios");
  if (!lista) return;

  lista.innerHTML = "";

  serviciosConPrecio.forEach((servicio, indice) => {
    let li = document.createElement("li");
    li.className = "turno-item";

    let servicioSeguro = escaparHTML(servicio.nombre);
    let precioSeguro = escaparHTML(formatearPrecioServicio(servicio.precio));

    li.innerHTML = `
      <div class="turno-info">
        <div class="turno-nombre">${servicioSeguro}</div>
        <div class="turno-detalle">Precio: ${precioSeguro}</div>
      </div>

      <button class="btn-eliminar" onclick="eliminarServicio(${indice})">Eliminar</button>
    `;

    lista.appendChild(li);
  });
}