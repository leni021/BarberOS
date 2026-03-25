// ========================================
// MÓDULO: SERVICIOS
// ========================================

function normalizarNombreServicio(valor) {
  return (valor || "").trim().toLowerCase();
}

function mostrarServicios() {
  recargarDatos();

  document.getElementById("contenido").innerHTML = `
    <h1>Servicios</h1>

    <input id="nuevoServicio" placeholder="Nombre del servicio">
    <button onclick="agregarServicio()">Agregar servicio</button>

    <ul id="listaServicios"></ul>
  `;

  actualizarListaServicios();
}

function agregarServicio() {
  let input = document.getElementById("nuevoServicio");
  let nombre = input.value.trim();

  if (nombre === "") return;

  let nombreNormalizado = normalizarNombreServicio(nombre);
  let existeServicio = servicios.some((servicio) => normalizarNombreServicio(servicio) === nombreNormalizado);
  if (existeServicio) {
    alert("Ese servicio ya existe en la lista.");
    return;
  }

  servicios.push(nombre);
  guardarServicios(servicios);
  input.value = "";

  actualizarListaServicios();
}

function eliminarServicio(indice) {
  let servicioAEliminar = servicios[indice];
  if (!servicioAEliminar) return;

  let nombreServicio = normalizarNombreServicio(servicioAEliminar);
  let turnos = obtenerTurnos();
  let servicioEnUso = turnos.some((turno) => normalizarNombreServicio(turno.servicio) === nombreServicio);

  if (servicioEnUso) {
    alert("No puedes eliminar este servicio porque tiene turnos cargados.");
    return;
  }

  servicios.splice(indice, 1);
  guardarServicios(servicios);
  actualizarListaServicios();
}

function actualizarListaServicios() {
  let lista = document.getElementById("listaServicios");
  if (!lista) return;

  lista.innerHTML = "";

  servicios.forEach((servicio, indice) => {
    let li = document.createElement("li");
    li.className = "turno-item";

    let servicioSeguro = escaparHTML(servicio);

    li.innerHTML = `
      <div class="turno-info">
        <div class="turno-nombre">${servicioSeguro}</div>
      </div>

      <button class="btn-eliminar" onclick="eliminarServicio(${indice})">Eliminar</button>
    `;

    lista.appendChild(li);
  });
}