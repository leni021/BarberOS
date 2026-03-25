// ========================================
// MÓDULO: BARBEROS
// ========================================

function normalizarNombreBarbero(valor) {
  return (valor || "").trim().toLowerCase();
}

function mostrarBarberos() {
  recargarDatos();

  document.getElementById("contenido").innerHTML = `
    <h1>Barberos</h1>

    <input id="nuevoBarbero" placeholder="Nombre del barbero">
    <button onclick="agregarBarbero()">Agregar barbero</button>

    <ul id="listaBarberos"></ul>
  `;

  actualizarListaBarberos();
}

function agregarBarbero() {
  let input = document.getElementById("nuevoBarbero");
  let nombre = input.value.trim();

  if (nombre === "") return;

  let nombreNormalizado = normalizarNombreBarbero(nombre);
  let existeBarbero = barberos.some((barbero) => normalizarNombreBarbero(barbero) === nombreNormalizado);
  if (existeBarbero) {
    alert("Ese barbero ya existe en la lista.");
    return;
  }

  barberos.push(nombre);
  guardarBarberos(barberos);
  input.value = "";

  actualizarListaBarberos();
}

function eliminarBarbero(indice) {
  let barberoAEliminar = barberos[indice];
  if (!barberoAEliminar) return;

  let nombreBarbero = normalizarNombreBarbero(barberoAEliminar);
  let turnos = obtenerTurnos();
  let barberoEnUso = turnos.some((turno) => normalizarNombreBarbero(turno.barbero) === nombreBarbero);

  if (barberoEnUso) {
    alert("No puedes eliminar este barbero porque tiene turnos cargados.");
    return;
  }

  barberos.splice(indice, 1);
  guardarBarberos(barberos);
  actualizarListaBarberos();
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