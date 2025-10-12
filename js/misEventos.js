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

  const ICONOS = {
    SERVICIO: "img/servicioIcono.png",
    REPARACION: "img/reparacionIcono.png",
    SINIESTRO: "img/siniestroIcono.png",
    VTV: "img/vtvIcono.png",
    TRANSFERENCIA: "img/transferIcono.png",
    DOCUMENTACION: "img/docIcono.png",
    OTRO: "img/otroIcono.png"
  };

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
      container.innerHTML = `<div class="alert alert-info">${errorMsg || 'No se pudieron obtener tus eventos.'}</div>`;
      return;
    }

    const eventos = await resp.json();

    if (!Array.isArray(eventos) || eventos.length === 0) {
      container.innerHTML = `<div class="alert alert-info">No hay eventos disponibles.</div>`;
      return;
    }

    container.innerHTML = eventos.map(ev => {
      const tipo = (ev.tipoEvento || 'OTRO').toUpperCase();
      const iconoSrc = ICONOS[tipo] || ICONOS['OTRO'];

      return `
        <div class="evento-card">
          <div class="evento-icono">
            <img src="${iconoSrc}" alt="${tipo}">
          </div>
          <div class="evento-info">
            <h5>${ev.titulo ?? 'Evento'}</h5>
            ${ev.descripcion ? `<p><strong>Descripción:</strong> ${ev.descripcion}</p>` : ''}
            <p><strong>Tipo:</strong> ${tipo}</p>
            ${ev.fecha ? `<p><strong>Fecha:</strong> ${new Date(ev.fecha).toLocaleDateString('es-AR')}</p>` : ''}
            <a href="eventoDetalle.html?id=${ev.idEvento ?? ev.id}" class="btn btn-sm btn-primary mt-2">Ver detalle</a>
          </div>
        </div>
      `;
    }).join('');

  } catch (error) {
    console.error("Error al obtener eventos:", error);
    container.innerHTML = `<div class="alert alert-danger">Error al conectar con el servidor.</div>`;
  }
  
});
