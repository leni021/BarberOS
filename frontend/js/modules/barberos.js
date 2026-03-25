// ========================================
// MÓDULO: BARBEROS
// ========================================

function normalizarNombreBarbero(valor) {
  return (valor || "").trim().toLowerCase();
}

function mostrarMensajeBarberos(mensaje, tipo = "error") {
  let contenedor = document.getElementById("mensajeBarberos");
  if (!contenedor) return;

  let esError = tipo === "error";
  contenedor.style.display = "block";
  contenedor.style.backgroundColor = esError ? "#fee2e2" : "#dcfce7";
  contenedor.style.color = esError ? "#b91c1c" : "#166534";
  contenedor.style.border = `1px solid ${esError ? "#fecaca" : "#86efac"}`;
  contenedor.innerText = mensaje;
}

function limpiarMensajeBarberos() {
  let contenedor = document.getElementById("mensajeBarberos");
  if (!contenedor) return;
  contenedor.style.display = "none";
  contenedor.innerText = "";
}

function mostrarBarberos() {
  recargarDatos();

  document.getElementById("contenido").innerHTML = `
    <h1>Barberos</h1>

    <div id="mensajeBarberos" style="display:none; margin-bottom: 12px; padding: 10px 12px; border-radius: 6px; font-size: 14px;"></div>

    <input id="nuevoBarbero" placeholder="Nombre del barbero">
    <button onclick="agregarBarbero()">Agregar barbero</button>

    <ul id="listaBarberos"></ul>
  `;

  limpiarMensajeBarberos();

  actualizarListaBarberos();
}

function agregarBarbero() {
  let input = document.getElementById("nuevoBarbero");
  if (!input) return;

  let nombre = input.value.trim();

  if (nombre === "") {
    mostrarMensajeBarberos("Escribe un nombre para agregar el barbero.", "error");
    return;
  }

  let nombreNormalizado = normalizarNombreBarbero(nombre);
  let existeBarbero = barberos.some((barbero) => normalizarNombreBarbero(barbero) === nombreNormalizado);
  if (existeBarbero) {
    mostrarMensajeBarberos("Ese barbero ya existe en la lista.", "error");
    return;
  }

  barberos.push(nombre);
  guardarBarberos(barberos);
  input.value = "";
  mostrarMensajeBarberos("Barbero agregado correctamente.", "ok");

  actualizarListaBarberos();
}

function eliminarBarbero(indice) {
  try {
    let barberoAEliminar = barberos[indice];
    if (!barberoAEliminar) return;

    let nombreBarbero = normalizarNombreBarbero(barberoAEliminar);
    let turnos = obtenerTurnos();
    let barberoEnUso = turnos.some((turno) => normalizarNombreBarbero(turno.barbero) === nombreBarbero);

    if (barberoEnUso) {
      mostrarMensajeBarberos("No puedes eliminar este barbero porque tiene turnos cargados.", "error");
      return;
    }

    barberos.splice(indice, 1);
    guardarBarberos(barberos);
    mostrarMensajeBarberos("Barbero eliminado correctamente.", "ok");
    actualizarListaBarberos();
  } catch (error) {
    console.error("Error al eliminar barbero:", error);
    mostrarMensajeBarberos("Ocurrio un error al eliminar el barbero. Intenta nuevamente.", "error");
  }
}

function actualizarListaBarberos() {
  let lista = document.getElementById("listaBarberos");
  if (!lista) return;

  lista.innerHTML = "";

  barberos.forEach((barbero, indice) => {
    let li = document.createElement("li");
    li.className = "turno-item";

    let barberoSeguro = escaparHTML(barbero);

    li.innerHTML = `
      <div class="turno-info">
        <div class="turno-nombre">${barberoSeguro}</div>
      </div>

      <button class="btn-eliminar" onclick="eliminarBarbero(${indice})">Eliminar</button>
    `;

    lista.appendChild(li);
  });
}