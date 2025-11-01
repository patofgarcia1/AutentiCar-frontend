import { URL_API } from '../constants/database.js';

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const vehiculoId = params.get('id');
  const eventoId = params.get('evento');

  const form = document.getElementById('form-documento');
  const mensaje = document.getElementById('mensaje');
  const fileInput = document.getElementById('fileDoc');
  const btnSubirDoc = document.getElementById('btnSubirDoc');

  const inputNombre = document.getElementById('nombre');
  const selTipo = document.getElementById('tipoDoc');

  const token = localStorage.getItem("token");

  if (!token) {
    mensaje.innerHTML = `<div class="alert alert-warning">Sesión no válida. Iniciá sesión nuevamente.</div>`;
    return;
  }

  if (!vehiculoId) {
    aviso.innerHTML = `<div class="alert alert-warning">Falta el parámetro "id" del vehículo.</div>`;
    return;
  }

  if (!eventoId) { 
    showMsg('Falta el parámetro "?evento". Debés entrar desde el detalle del evento para adjuntar documentos.', 'danger');
    if (btnSubirDoc) btnSubirDoc.disabled = true; 
    if (aviso) {
      aviso.innerHTML = `
        <div class="alert alert-warning">
          <strong>Vehículo ID:</strong> ${vehiculoId}<br>
          <strong>Evento ID:</strong> <em>no especificado</em>
        </div>`;
    }
    return;
  }

  function showMsg(html, type='info') {
    if (!mensaje) return;
    mensaje.innerHTML = `<div class="alert alert-${type}">${html}</div>`;
  }

  function validar() {
    const file = fileInput.files?.[0];
    const nombre = (inputNombre.value || '').trim();
    const tipo = selTipo.value;

    if (!vehiculoId) { showMsg('Falta ?id de vehículo.', 'danger'); return null; }
    if (!file)       { showMsg('Seleccioná un archivo.', 'warning'); return null; }
    if (!nombre)     { showMsg('Ingresá un nombre para el documento.', 'warning'); return null; }
    if (!tipo)       { showMsg('Seleccioná un tipo de documento.', 'warning'); return null; }


    if (!(file.type.startsWith('image/') || file.type === 'application/pdf')) {
      const ok = confirm('No es imagen/PDF. Se subirá como RAW (sin vista previa). ¿Continuar?');
      if (!ok) return null;
    }

    return { file, nombre, tipo };
  }

  function openIASpinner(minMs = 8000) {
    const modalEl = document.getElementById('iaSpinnerModal');
    const modal = new bootstrap.Modal(modalEl, {
      backdrop: 'static',
      keyboard: false
    });

    const started = Date.now();
    modal.show();

    return async function close() {
      const elapsed = Date.now() - started;
      const wait = Math.max(0, minMs - elapsed);
      if (wait > 0) {
        await new Promise(r => setTimeout(r, wait));
      }
      modal.hide();
    };
  }

  btnSubirDoc.addEventListener('click', async () => {
    if (!form.reportValidity()) return;

    const vals = validar();
    if (!vals) return;

    const { file, nombre, tipo } = vals;

    const fd = new FormData();
    fd.append('file', file);
    fd.append('nombre', nombre);               
    fd.append('tipoDoc', tipo);
    fd.append('eventoId', eventoId); 

    btnSubirDoc.disabled = true;
    btnSubirDoc.textContent = 'Subiendo...';

    const closeSpinner = openIASpinner(5000);

    try {
      const resp = await fetch(`${URL_API}/vehiculos/${vehiculoId}/documentos`, {
        method: 'POST',
        headers: { 
          "Authorization": `Bearer ${token}`,
          Accept: 'application/json'
        },
        body: fd
      });

      if (resp.status === 401 || resp.status === 403) {
        mensaje.innerHTML = `<div class="alert alert-danger">No autorizado. Iniciá sesión nuevamente.</div>`;
        return;
      }

      if (!resp.ok) {
        const txt = await resp.text();
        showMsg(`Error: ${txt}`, 'danger');
        return;
      }

      let data = null;
      try { data = await resp.json(); } catch {}

      const vId = data?.vehiculoId ?? vehiculoId; 

      await closeSpinner();

      showMsg('Documento subido con éxito.', 'success');

      setTimeout(() => {
        window.location.href = `eventoDetalle.html?id=${eventoId}`;
      }, 1000);

      form.reset();
      fileInput.value = '';

    } catch (e) {
      console.error(e);
      showMsg('No se pudo subir el documento.', 'danger');
    } finally {
      btnSubirDoc.disabled = false;
      btnSubirDoc.textContent = 'Subir documento';
    }
  });

  form.addEventListener('submit', (e) => e.preventDefault());
});
