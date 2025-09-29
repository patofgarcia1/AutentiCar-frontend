import { URL_API } from '../constants/database.js';

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('misEventos-lista');
  const usuarioId = localStorage.getItem('usuarioId');
  const token = localStorage.getItem('token');

  if (!usuarioId) {
    container.innerHTML = `<div class="alert alert-warning">Debés iniciar sesión para ver tus eventos.</div>`;
    return;
  }
  if (!token) {
    container.innerHTML = `<div class="alert alert-warning">Sesión no válida. Iniciá sesión nuevamente.</div>`;
    return;
  }

  try {
    const resp = await fetch(`${URL_API}/usuarios/${usuarioId}/eventos`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (resp.status === 401 || resp.status === 403) {
      container.innerHTML = `<div class="alert alert-danger">No autorizado. Iniciá sesión nuevamente.</div>`;
      return;
    }

    if (!resp.ok) {
      const errorMsg = await resp.text();
      container.innerHTML = `<div class="alert alert-danger">${errorMsg || 'No se pudieron obtener tus eventos.'}</div>`;
      return;
    }

    const eventos = await resp.json();

    if (!Array.isArray(eventos) || eventos.length === 0) {
      container.innerHTML = `<div class="alert alert-info">No hay eventos disponibles.</div>`;
      return;
    }

    container.innerHTML = eventos.map(ev => `
      <div class="col">
        <div class="card h-100 shadow-sm">
          <div class="card-body">
            <h5 class="card-title">${ev.titulo ?? 'Evento'}</h5>
            <p><strong>Descripción:</strong> ${ev.descripcion ?? '—'}</p>
            <p><strong>Tipo:</strong> ${ev.tipoEvento ?? '—'}</p>
            <a href="eventoDetalle.html?id=${ev.idEvento ?? ev.id}" class="btn btn-primary">Ver detalle</a>
          </div>
        </div>
      </div>
    `).join('');

  } catch (error) {
    console.error("Error al obtener eventos:", error);
    container.innerHTML = `<div class="alert alert-danger">Error al conectar con el servidor.</div>`;
  }
  
});
