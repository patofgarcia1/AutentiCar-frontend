import { URL_API } from '../constants/database.js';

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const eventoId = params.get('id');
  const titulo = document.getElementById('titulo');
  const info = document.getElementById('info');

  if (!eventoId) {
    titulo.textContent = "Error";
    info.innerHTML = `<div class="alert alert-danger">ID de evento no especificado en la URL.</div>`;
    return;
  }

  try {
    // 1) Traer detalle del evento
    const evResp = await fetch(`${URL_API}/eventos/${eventoId}`);
    if (!evResp.ok) {
      const msg = await evResp.text();
      titulo.textContent = "Evento no encontrado";
      info.innerHTML = `<div class="alert alert-danger">${msg}</div>`;
      return;
    }
    const ev = await evResp.json();

    // 2) Traer usuario (vendedor/creador) si viene idUsuario
    let usuarioNombre = 'No disponible';
    if (ev.idUsuario != null) {
      try {
        const uResp = await fetch(`${URL_API}/usuarios/${ev.idUsuario}`);
        if (uResp.ok) {
          const u = await uResp.json();
          usuarioNombre = `${u.nombre ?? ''} ${u.apellido ?? ''}`.trim() || 'No disponible';
        }
      } catch {
        // si falla, dejamos "No disponible"
      }
    }

    // 3) Render
    titulo.textContent = ev.titulo || 'Evento';

    info.innerHTML = `
      <p><strong>Descripción:</strong> ${ev.descripcion || '—'}</p>
      <p><strong>Kilometraje:</strong> ${ev.kilometrajeEvento ?? '—'}</p>
      <p><strong>Tipo de evento:</strong> ${ev.tipoEvento ?? '—'}</p>
      <p><strong>Validado por tercero:</strong> ${ev.validadoPorTercero ? 'Sí' : 'No'}</p>
      <p><strong>Fecha del evento:</strong> ${ev.fechaEvento ?? '—'}</p>
      <hr/>
      <p><strong>Usuario:</strong> ${usuarioNombre}</p>
      <hr/>
      <a href="addDocumento.html?id=${ev.idVehiculo}&evento=${ev.idEvento}" class="btn btn-primary">
        Agregar Documentos
      </a>
    `;
  } catch (err) {
    console.error('eventoDetalle error:', err);
    titulo.textContent = "Error";
    info.innerHTML = `<div class="alert alert-danger">Error al conectar con el servidor.</div>`;
  }
});
