// ========================================
// MÓDULO: CONFIGURACIÓN DEL NEGOCIO
// ========================================

function mostrarConfiguracion() {
  recargarDatos();

  let negocioSeguro = escaparHTML(cuentaActual.negocio || "");
  let telefonoSeguro = escaparHTML(cuentaActual.telefono || "");
  let direccionSeguro = escaparHTML(cuentaActual.direccion || "");

  document.getElementById("contenido").innerHTML = `
    <h1>Configuración del Negocio</h1>

    <div id="mensajeExitoConf" style="color: #16a34a; font-size: 14px; margin-bottom: 15px; display: none; font-weight: bold;">
      ¡Datos del negocio guardados con éxito!
    </div>

    <div style="background: linear-gradient(to right, #111827, #1f2937); color: white; padding: 20px; border-radius: 8px; margin-bottom: 30px; max-width: 500px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <h3 style="margin-top: 0; color: #f59e0b;">Próximamente: BarberOS PRO (Prueba 1.0.1)</h3>
      <p style="font-size: 14px; margin-bottom: 0; color: #cbd5e1;">
        Estamos trabajando en la automatización de turnos por <strong>WhatsApp</strong> y recordatorios a clientes. 
        <br><br>¡Pronto podrás mejorar tu plan desde aquí y llevar tu barbería al siguiente nivel!
      </p>
    </div>

    <div style="max-width: 500px;">
      <h3 style="color: #111827;">Datos Operativos</h3>
      <label style="color: #475569; font-size: 14px;">Nombre de la Barbería</label>
      <input id="confNegocio" value="${negocioSeguro}">

      <label style="color: #475569; font-size: 14px; margin-top:12px;">Teléfono</label>
      <input id="confTelefono" value="${telefonoSeguro}" placeholder="Ej: +54 9 11 1234-5678">

      <label style="color: #475569; font-size: 14px; margin-top:12px;">Dirección</label>
      <input id="confDireccion" value="${direccionSeguro}" placeholder="Ej: Av. Principal 123">

      <button onclick="guardarConfiguracion()" style="width: 100%; margin-top: 15px;">Guardar Cambios</button>

      <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 30px 0;">
      
      <h3 style="margin-top: 0; color: #111827;">Gestión de Datos</h3>
      <p style="color: #475569; font-size: 14px; margin-bottom: 10px;">Exportá o restaurá una copia de seguridad de tu información.</p>
      
      <button onclick="exportarBackupJSON()" style="background: #10b981; width: 100%;">Descargar Backup de Datos</button>
      
      <input type="file" id="inputFileBackup" accept=".json" style="display: none;" onchange="procesarArchivoBackup(event)">
      <button onclick="document.getElementById('inputFileBackup').click()" style="background: #dc2626; width: 100%; margin-top: 10px;">Restaurar Backup</button>
    </div>
  `;
}

function guardarConfiguracion() {
  cuentaActual.negocio = document.getElementById("confNegocio").value.trim();
  cuentaActual.telefono = document.getElementById("confTelefono").value.trim();
  cuentaActual.direccion = document.getElementById("confDireccion").value.trim();

  guardarCuentaActual(cuentaActual);

  let mensaje = document.getElementById("mensajeExitoConf");
  if (mensaje) {
    mensaje.style.display = "block";
    setTimeout(() => { mensaje.style.display = "none"; }, 3000);
  }
}

function procesarArchivoBackup(event) {
    let file = event.target.files[0];
    if (!file) return;

    let confirmar = confirm("¿Estás seguro de que deseás restaurar este backup? Todos los datos actuales serán reemplazados.");
    if (!confirmar) { event.target.value = ""; return; }

    let reader = new FileReader();
    reader.onload = function(e) {
        let exito = restaurarBackupDesdeJSON(e.target.result);
        if (exito) {
            alert("Datos restaurados correctamente. La sesión se cerrará para aplicar los cambios.");
            localStorage.removeItem("sesionActiva"); window.location.href = "login.html";
        } else {
            alert("Error: El archivo seleccionado no es válido o está corrupto.");
        }
        event.target.value = "";
    };
    reader.readAsText(file);
}