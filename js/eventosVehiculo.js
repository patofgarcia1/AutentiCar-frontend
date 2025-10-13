import { URL_API } from '../constants/database.js';
import { isAdmin, isUser, isTaller, getSession } from './roles.js';

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const vehiculoId = params.get('id');
  const contenedor = document.getElementById('eventos-lista');

  if (!vehiculoId) {
    contenedor.innerHTML = `<div class="alert alert-danger">ID de vehículo no especificado en la URL.</div>`;
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
    const response = await fetch(`${URL_API}/vehiculos/${vehiculoId}/eventos`);
    if (!response.ok) {
      const errorMsg = await response.text();
      contenedor.innerHTML = `<div class="alert alert-info">${errorMsg}</div>`;
    } else {
      const eventos = await response.json();

      if (!Array.isArray(eventos) || eventos.length === 0) {
        contenedor.innerHTML = `<div class="alert alert-info">No hay eventos asociados a este vehículo.</div>`;
      } else {
        contenedor.innerHTML = eventos.map(ev => {
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
                <a href="eventoDetalle.html?id=${ev.idEvento}" class="btn btn-sm btn-primary mt-2 btn-ver-detalle">Ver detalle</a>
              </div>
            </div>
          `;
        }).join('');
      }
    }
    } catch (error) {
    console.error("Error al obtener los eventos:", error);
    contenedor.innerHTML = `<div class="alert alert-danger">Error al conectar con el servidor.</div>`;
  }

  // 2) Decidir si mostramos el botón “Agregar evento”
  try {
    // detalle del vehículo (público) para conocer al dueño
    const vResp = await fetch(`${URL_API}/vehiculos/${vehiculoId}`);
    if (!vResp.ok) {
      // si falla, no podemos saber el dueño => no mostramos botón
      return;
    }
    const v = await vResp.json();

    // dueño del vehículo según tu DTO (VehiculosDTO.idUsuario)
    const ownerId = (v?.idUsuario != null) ? Number(v.idUsuario) : null;

    // usuario logueado y rol
    const { userId: loggedIdRaw } = getSession(); // lee de localStorage
    const loggedId = (loggedIdRaw != null) ? Number(loggedIdRaw) : null;

    // Reglas
    const puedeAgregar =
      isAdmin() || isTaller() || (isUser() && ownerId != null && loggedId === ownerId);

    if (puedeAgregar) {
      contenedor.insertAdjacentHTML(
        'afterend',
        `
        <div class="d-flex justify-content-end mt-3">
          <a href="addEvento.html?id=${vehiculoId}" class="btn btn-agregar-evento">Agregar evento</a>
        </div>
        `
      );
    }
  } catch (e) {
    console.warn('No se pudo evaluar permisos para el botón Agregar evento:', e);
    // si falla esta parte, simplemente no mostramos el botón
  }
});
