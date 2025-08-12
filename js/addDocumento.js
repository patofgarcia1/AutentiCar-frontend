import { URL_API } from '../constants/database.js';
import { initDocumentos } from './components/documentos.js';

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const vehiculoId = params.get('id');
  const eventoIdQS = params.get('evento');

  const form = document.getElementById('form-documento');
  const mensaje = document.getElementById('mensaje');
  const aviso = document.getElementById('aviso-ids');
  const fileInput = document.getElementById('fileDoc');
  const btnSubirDoc = document.getElementById('btnSubirDoc');
  const btnVolver = document.getElementById('btnVolver');

  const inputNombre = document.getElementById('nombre');
  const selTipo     = document.getElementById('tipoDoc');
  const inputNivel  = document.getElementById('nivelRiesgo');
  const chkIA       = document.getElementById('validadoIA');

  aviso.innerHTML = `
    <div class="alert alert-info">
      <strong>Vehículo ID:</strong> ${vehiculoId ?? 'No detectado'}<br>
      <strong>Evento ID:</strong> ${eventoIdQS ?? 'Sin evento'}
    </div>
  `;

  const root = document.getElementById('docs-root');
  const docsUI = initDocumentos({
    root, vehiculoId: Number(vehiculoId), allowDelete: true, titulo: 'Documentos del vehículo'
  });

  btnVolver.href = `docsVehiculo.html?id=${vehiculoId}`;

  function showMsg(html, type='info') {
    if (!mensaje) return;
    mensaje.innerHTML = `<div class="alert alert-${type}">${html}</div>`;
  }

  function validar() {
    const file = fileInput.files?.[0];
    const nombre = (inputNombre.value || '').trim();
    const tipo = selTipo.value;
     const nivelS = (inputNivel.value || '').trim();

    // HTML5 ya valida, pero reforzamos:
    if (!vehiculoId) { showMsg('Falta ?id de vehículo.', 'danger'); return null; }
    if (!file)       { showMsg('Seleccioná un archivo.', 'warning'); return null; }
    if (!nombre)     { showMsg('Ingresá un nombre para el documento.', 'warning'); return null; }
    if (!tipo)       { showMsg('Seleccioná un tipo de documento.', 'warning'); return null; }

    if (nivelS === '') {
    showMsg('Ingresá el nivel de riesgo.', 'warning');
    return null;
    }
    if (!/^\d{1,3}$/.test(nivelS)) {
      showMsg('El nivel de riesgo debe ser un número entero.', 'warning');
      return null;
    }
    const n = parseInt(nivelS, 10);
    if (n < 0 || n > 100) {
      showMsg('El nivel de riesgo debe estar entre 0 y 100.', 'warning');
      return null;
    }

    if (!(file.type.startsWith('image/') || file.type === 'application/pdf')) {
      const ok = confirm('No es imagen/PDF. Se subirá como RAW (sin vista previa). ¿Continuar?');
      if (!ok) return null;
    }

    return { file, nombre, tipo, nivel: n };
  }

  btnSubirDoc.addEventListener('click', async () => {
    if (!form.reportValidity()) return;

    const vals = validar();
    if (!vals) return;

    const { file, nombre, tipo, nivel } = vals;

    const fd = new FormData();
    fd.append('file', file);
    fd.append('nombre', nombre);                 // ← sin defaults
    fd.append('tipoDoc', tipo);
    fd.append('nivelRiesgo', String(nivel));
    fd.append('validadoIA', chkIA?.checked ? 'true' : 'false');
    if (eventoIdQS) fd.append('eventoId', eventoIdQS);

    btnSubirDoc.disabled = true;
    btnSubirDoc.textContent = 'Subiendo...';

    try {
      const resp = await fetch(`${URL_API}/vehiculos/${vehiculoId}/documentos`, {
        method: 'POST',
        body: fd
      });

      if (!resp.ok) {
        const txt = await resp.text();
        showMsg(`Error: ${txt}`, 'danger');
        return;
      }

      let data = null;
      try { data = await resp.json(); } catch {}

      const vId = data?.vehiculoId ?? vehiculoId; 
      await docsUI.reload();
      showMsg('Documento subido con éxito.', 'success');

      setTimeout(() => {
        window.location.href = `docsVehiculo.html?id=${vId}`; 
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

  // evitar submit tradicional
  form.addEventListener('submit', (e) => e.preventDefault());
});
