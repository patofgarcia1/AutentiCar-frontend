import { URL_API } from '../constants/database.js';

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const vehiculoId = params.get('id');          // viene de addDocumento.html?id=...
  const eventoIdQS = params.get('evento');      // opcional: &evento=...

  const form = document.getElementById('form-documento');
  const mensaje = document.getElementById('mensaje');
  const aviso = document.getElementById('aviso-ids');

  // Mostrar qué IDs estamos usando
  aviso.innerHTML = `
    <div class="alert alert-info">
      <strong>Vehículo ID:</strong> ${vehiculoId ?? 'No detectado'}<br>
      <strong>Evento ID:</strong> ${eventoIdQS ?? 'Sin evento'}
    </div>
  `;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!vehiculoId) {
      mensaje.innerHTML = `<div class="alert alert-danger">No se detectó el ID del vehículo (parámetro <code>?id</code>).</div>`;
      return;
    }

    const formData = new FormData(form);
    const datos = Object.fromEntries(formData.entries());

    const payload = {
      nombre: datos.nombre,
      urlDoc: datos.urlDoc,
      nivelRiesgo: parseInt(datos.nivelRiesgo, 10),
      validadoIA: datos.validadoIA === 'on',           // checkbox -> boolean
      tipoDoc: String(datos.tipoDoc).toUpperCase(),    // debe matchear el enum
      vehiculoId: parseInt(vehiculoId, 10),
      eventoId: eventoIdQS ? parseInt(eventoIdQS, 10) : null
    };

    try {
      const resp = await fetch(`${URL_API}/documentos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) {
        const txt = await resp.text();
        mensaje.innerHTML = `<div class="alert alert-danger">${txt}</div>`;
        return;
      }

      // por si tu back devuelve JSON o solo texto
      let data = null;
      try { data = await resp.json(); } catch {}

      mensaje.innerHTML = `<div class="alert alert-success">Documento cargado con éxito.</div>`;

      // Redirigimos al listado de docs del vehículo
      setTimeout(() => {
        window.location.href = `docsVehiculo.html?id=${payload.vehiculoId}`;
      }, 1000);

    } catch (error) {
      console.error('Error creando documento:', error);
      mensaje.innerHTML = `<div class="alert alert-danger">Error al conectar con el servidor.</div>`;
    }
  });
});
