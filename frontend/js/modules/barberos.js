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

let indiceBarberoEnEdicion = -1;

function mostrarBarberos() {
  recargarDatos();

  document.getElementById("contenido").innerHTML = `
    <h1>Barberos</h1>

    <div id="mensajeBarberos" style="display:none; margin-bottom: 12px; padding: 10px 12px; border-radius: 6px; font-size: 14px;"></div>

    <div id="cardNuevoBarbero" style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); margin-bottom: 20px;">
      <h3 style="margin-top: 0; color: #111827;">Nuevo Barbero</h3>
      <input id="nuevoBarbero" placeholder="Nombre del barbero">
      <button onclick="agregarBarbero()">Agregar barbero</button>
    </div>

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
    let barberoEnUso = turnos.some((turno) => {
      let estadoTurno = String(turno && turno.estado ? turno.estado : "Pendiente").trim().toLowerCase();
      if (estadoTurno === "cancelado") return false;

      return normalizarNombreBarbero(turno.barbero) === nombreBarbero;
    });

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

    if (indice === indiceBarberoEnEdicion) {
      let barberoEdit = escaparHTML(barbero || "");
      li.innerHTML = `
        <div class="turno-info" style="width:100%;">
          <input id="editNombreBarbero" value="${barberoEdit}" placeholder="Nombre del barbero" style="margin-top:0; margin-bottom:8px;">
          <div class="acciones-item">
            <button onclick="guardarEdicionBarbero(${indice})">Guardar</button>
            <button onclick="cancelarEdicionBarbero()" style="background:#475569;">Cancelar</button>
          </div>
        </div>
      `;
      lista.appendChild(li);
      return;
    }

    let barberoSeguro = escaparHTML(barbero);

    li.innerHTML = `
      <div class="turno-info">
        <div class="turno-nombre">${barberoSeguro}</div>
      </div>

      <div class="acciones-item">
        <button class="btn-accion" onclick="iniciarEdicionBarbero(${indice})">Editar</button>
        <button class="btn-eliminar" onclick="eliminarBarbero(${indice})">Eliminar</button>
      </div>
    `;

    lista.appendChild(li);
  });
}

function iniciarEdicionBarbero(indice) {
  indiceBarberoEnEdicion = indice;
  actualizarListaBarberos();
}

function cancelarEdicionBarbero() {
  indiceBarberoEnEdicion = -1;
  actualizarListaBarberos();
}

function guardarEdicionBarbero(indice) {
  let nombre = String(document.getElementById("editNombreBarbero")?.value || "").trim();
  if (!nombre) {
    mostrarMensajeBarberos("El nombre del barbero no puede quedar vacío.", "error");
    return;
  }

  let nombreNormalizado = normalizarNombreBarbero(nombre);
  let duplicado = barberos.some((barbero, i) => i !== indice && normalizarNombreBarbero(barbero) === nombreNormalizado);
  if (duplicado) {
    mostrarMensajeBarberos("Ya existe otro barbero con ese nombre.", "error");
    return;
  }

  if (!barberos[indice]) return;
  barberos[indice] = nombre;
  guardarBarberos(barberos);
  indiceBarberoEnEdicion = -1;
  mostrarMensajeBarberos("Barbero actualizado correctamente.", "ok");
  actualizarListaBarberos();
}