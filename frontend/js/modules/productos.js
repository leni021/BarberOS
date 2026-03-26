// ========================================
// MODULO: PRODUCTOS
// ========================================

function normalizarNombreProducto(valor) {
  return String(valor || "").trim().toLowerCase();
}

function mostrarMensajeProductos(mensaje, tipo = "error") {
  let contenedor = document.getElementById("mensajeProductos");
  if (!contenedor) return;

  let esError = tipo === "error";
  contenedor.style.display = "block";
  contenedor.style.backgroundColor = esError ? "#fee2e2" : "#dcfce7";
  contenedor.style.color = esError ? "#b91c1c" : "#166534";
  contenedor.style.border = `1px solid ${esError ? "#fecaca" : "#86efac"}`;
  contenedor.innerText = mensaje;
}

function limpiarMensajeProductos() {
  let contenedor = document.getElementById("mensajeProductos");
  if (!contenedor) return;
  contenedor.style.display = "none";
  contenedor.innerText = "";
}

let indiceProductoEnEdicion = -1;

function mostrarProductos() {
  recargarDatos();

  document.getElementById("contenido").innerHTML = `
    <h1>Productos</h1>

    <div id="mensajeProductos" style="display:none; margin-bottom: 12px; padding: 10px 12px; border-radius: 6px; font-size: 14px;"></div>

    <div id="cardNuevoProducto" style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); margin-bottom: 20px;">
      <h3 style="margin-top: 0; color: #111827;">Nuevo Producto</h3>

      <input id="nuevoNombreProducto" placeholder="Nombre del producto" style="margin-bottom: 10px; width: 100%; box-sizing: border-box;">
      <input id="nuevaCategoriaProducto" placeholder="Categoria (ej: Cera, Shampoo)" style="margin-bottom: 10px; width: 100%; box-sizing: border-box;">
      <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:10px;">
        <input id="nuevoPrecioProducto" type="number" min="0" step="0.01" placeholder="Precio" style="margin:0; flex:1 1 220px;">
        <input id="nuevoStockProducto" type="number" min="0" step="1" placeholder="Stock" style="margin:0; flex:1 1 220px;">
      </div>

      <button onclick="agregarProducto()">Guardar Producto</button>
    </div>

    <h2>Lista de Productos</h2>
    <ul id="listaProductos"></ul>
  `;

  limpiarMensajeProductos();
  actualizarListaProductos();
}

function agregarProducto() {
  let nombre = String(document.getElementById("nuevoNombreProducto")?.value || "").trim();
  let categoria = String(document.getElementById("nuevaCategoriaProducto")?.value || "").trim();
  let precio = Number(document.getElementById("nuevoPrecioProducto")?.value || 0);
  let stock = parseInt(document.getElementById("nuevoStockProducto")?.value || 0, 10);

  if (!nombre) {
    mostrarMensajeProductos("El nombre del producto es obligatorio.", "error");
    return;
  }
  if (!Number.isFinite(precio) || precio < 0) {
    mostrarMensajeProductos("El precio debe ser mayor o igual a 0.", "error");
    return;
  }
  if (!Number.isFinite(stock) || stock < 0) {
    mostrarMensajeProductos("El stock debe ser mayor o igual a 0.", "error");
    return;
  }

  let productos = obtenerProductos();
  let nombreNorm = normalizarNombreProducto(nombre);
  let duplicado = productos.some((p) => normalizarNombreProducto(p.nombre) === nombreNorm);
  if (duplicado) {
    mostrarMensajeProductos("Ya existe un producto con ese nombre.", "error");
    return;
  }

  productos.push({ nombre, categoria, precio, stock });
  guardarProductos(productos);

  mostrarMensajeProductos("Producto guardado correctamente.", "ok");
  mostrarProductos();
  mostrarMensajeProductos("Producto guardado correctamente.", "ok");
}

function actualizarListaProductos() {
  let lista = document.getElementById("listaProductos");
  if (!lista) return;

  lista.innerHTML = "";
  let productos = obtenerProductos();

  if (productos.length === 0) {
    let li = document.createElement("li");
    li.className = "turno-item";
    li.innerHTML = `
      <div class="turno-info">
        <div class="turno-detalle">No hay productos cargados.</div>
      </div>
    `;
    lista.appendChild(li);
    return;
  }

  productos.forEach((producto, indice) => {
    let li = document.createElement("li");
    li.className = "turno-item";

    if (indice === indiceProductoEnEdicion) {
      let nombre = escaparHTML(producto.nombre || "");
      let categoria = escaparHTML(producto.categoria || "");
      let precio = Number(producto.precio || 0);
      let stock = parseInt(producto.stock, 10) || 0;

      li.innerHTML = `
        <div class="turno-info" style="width:100%;">
          <input id="editNombreProducto" value="${nombre}" placeholder="Nombre" style="margin-top:0; margin-bottom:8px;">
          <input id="editCategoriaProducto" value="${categoria}" placeholder="Categoria" style="margin-top:0; margin-bottom:8px;">
          <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:8px;">
            <input id="editPrecioProducto" type="number" min="0" step="0.01" value="${precio}" placeholder="Precio" style="margin:0; flex:1 1 220px;">
            <input id="editStockProducto" type="number" min="0" step="1" value="${stock}" placeholder="Stock" style="margin:0; flex:1 1 220px;">
          </div>
          <div class="acciones-item">
            <button onclick="guardarEdicionProducto(${indice})">Guardar</button>
            <button onclick="cancelarEdicionProducto()" style="background:#475569;">Cancelar</button>
          </div>
        </div>
      `;

      lista.appendChild(li);
      return;
    }

    let nombreSeguro = escaparHTML(producto.nombre || "");
    let categoriaSeguro = escaparHTML(producto.categoria || "Sin categoria");
    let precioSeguro = escaparHTML(new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number(producto.precio) || 0));
    let stockSeguro = escaparHTML(String(parseInt(producto.stock, 10) || 0));

    li.innerHTML = `
      <div class="turno-info">
        <div class="turno-nombre">${nombreSeguro}</div>
        <div class="turno-detalle">Categoria: ${categoriaSeguro}</div>
        <div class="turno-detalle">Precio: ${precioSeguro}</div>
        <div class="turno-detalle">Stock: ${stockSeguro}</div>
      </div>
      <div class="acciones-item">
        <button class="btn-accion" onclick="iniciarEdicionProducto(${indice})">Editar</button>
        <button class="btn-eliminar" onclick="eliminarProducto(${indice})">Eliminar</button>
      </div>
    `;

    lista.appendChild(li);
  });
}

function iniciarEdicionProducto(indice) {
  indiceProductoEnEdicion = indice;
  actualizarListaProductos();
}

function cancelarEdicionProducto() {
  indiceProductoEnEdicion = -1;
  actualizarListaProductos();
}

function guardarEdicionProducto(indice) {
  let nombre = String(document.getElementById("editNombreProducto")?.value || "").trim();
  let categoria = String(document.getElementById("editCategoriaProducto")?.value || "").trim();
  let precio = Number(document.getElementById("editPrecioProducto")?.value || 0);
  let stock = parseInt(document.getElementById("editStockProducto")?.value || 0, 10);

  if (!nombre) {
    mostrarMensajeProductos("El nombre del producto es obligatorio.", "error");
    return;
  }
  if (!Number.isFinite(precio) || precio < 0) {
    mostrarMensajeProductos("El precio debe ser mayor o igual a 0.", "error");
    return;
  }
  if (!Number.isFinite(stock) || stock < 0) {
    mostrarMensajeProductos("El stock debe ser mayor o igual a 0.", "error");
    return;
  }

  let productos = obtenerProductos();
  let nombreNorm = normalizarNombreProducto(nombre);
  let duplicado = productos.some((p, i) => i !== indice && normalizarNombreProducto(p.nombre) === nombreNorm);
  if (duplicado) {
    mostrarMensajeProductos("Ya existe otro producto con ese nombre.", "error");
    return;
  }

  if (!productos[indice]) return;

  productos[indice] = { nombre, categoria, precio, stock };
  guardarProductos(productos);

  indiceProductoEnEdicion = -1;
  mostrarMensajeProductos("Producto actualizado correctamente.", "ok");
  actualizarListaProductos();
}

function eliminarProducto(indice) {
  let productos = obtenerProductos();
  if (!productos[indice]) return;

  productos.splice(indice, 1);
  guardarProductos(productos);
  mostrarMensajeProductos("Producto eliminado correctamente.", "ok");
  actualizarListaProductos();
}
