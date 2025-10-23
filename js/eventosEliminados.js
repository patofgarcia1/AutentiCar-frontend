import { URL_API } from '../constants/database.js';

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
    const response = await fetch(`${URL_API}/vehiculos/${vehiculoId}/eventos/eliminados`);
    if (!response.ok) {
      const errorMsg = await response.text();
      contenedor.innerHTML = `<div class="alert alert-info">${errorMsg}</div>`;
    } else {
      const eventos = await response.json();

      if (!Array.isArray(eventos) || eventos.length === 0) {
        contenedor.innerHTML = `<div class="alert alert-info">No hay eventos eliminados asociados a este vehículo.</div>`;
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
                <h5 class="mb-2">${ev.titulo ?? 'Evento'}</h5>

                ${ev.descripcion ? `
                  <div class="evento-line">
                    <span class="evento-info-label"> <strong> Descripción: </strong></span>
                    <span class="evento-info-value">${ev.descripcion}</span>
                  </div>` : ''}

                <div class="evento-line">
                  <span class="evento-info-label"> <strong> Tipo: </strong></span>
                  <span class="evento-info-value">${tipo}</span>
                </div>

                <a href="eventoDetalle.html?id=${ev.idEvento ?? ev.id}" class="btn btn-sm btn-primary mt-2">Ver detalle</a>
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

});
