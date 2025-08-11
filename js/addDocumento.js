import { URL_API } from '../constants/database.js';
import { initDocumentos } from './components/documentos.js';

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const vehiculoId = params.get('id');          // viene de addDocumento.html?id=...
  const eventoIdQS = params.get('evento');      // opcional: &evento=...

  const form = document.getElementById('form-documento');
  const mensaje = document.getElementById('mensaje');
  const aviso = document.getElementById('aviso-ids');
  const fileInput = document.getElementById('fileDoc');
  const btnSubirDoc = document.getElementById('btnSubirDoc');
  const btnVolver = document.getElementById('btnVolver');

  const inputNombre = form.querySelector('input[name="nombre"]');
  const selTipo = form.querySelector('select[name="tipoDoc"]');
  const inputNivel = form.querySelector('input[name="nivelRiesgo"]');
  const chkIA = form.querySelector('input[name="validadoIA"]');

  // Mostrar qué IDs estamos usando
  aviso.innerHTML = `
    <div class="alert alert-info">
      <strong>Vehículo ID:</strong> ${vehiculoId ?? 'No detectado'}<br>
      <strong>Evento ID:</strong> ${eventoIdQS ?? 'Sin evento'}
    </div>
  `;

  // Listado debajo
  const root = document.getElementById('docs-root');
  const docsUI = initDocumentos({
    root,
    vehiculoId: Number(vehiculoId),
    allowDelete: true,
    titulo: 'Documentos del vehículo'
  });

  btnVolver.href = `docsVehiculo.html?id=${vehiculoId}`;

  btnSubirDoc.addEventListener('click', async () => {
    if (!vehiculoId) {
      alert('Falta ?id=vehiculo en la URL');
      return;
    }
    const file = fileInput.files?.[0];
    if (!file) {
      alert('Seleccioná un archivo');
      return;
    }
    if (!(file.type.startsWith('image/') || file.type === 'application/pdf')) {
      if (!confirm('No es imagen/PDF. Se subirá como RAW (sin vista previa). ¿Continuar?')) return;
    }

    const fd = new FormData();
    fd.append('file', file);
    fd.append('nombre', inputNombre.value || file.name);
    fd.append('tipoDoc', selTipo.value);
    fd.append('nivelRiesgo', inputNivel.value || '0');
    fd.append('validadoIA', chkIA.checked ? 'true' : 'false');
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
        alert(`Error: ${txt}`);
        return;
      }
      await docsUI.reload();
      if (mensaje) mensaje.innerHTML = `<div class="alert alert-success">Documento subido con éxito.</div>`;
      form.reset();
      fileInput.value = '';
    } catch (e) {
      console.error(e);
      if (mensaje) mensaje.innerHTML = `<div class="alert alert-danger">No se pudo subir el documento.</div>`;
    } finally {
      btnSubirDoc.disabled = false;
      btnSubirDoc.textContent = 'Subir documento';
    }
  });

  // prevenimos el submit tradicional
  form.addEventListener('submit', (e) => e.preventDefault());
});