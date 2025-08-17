import { URL_API } from '../constants/database.js';

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const vehiculoId = params.get('id');
  const contenedor = document.getElementById('eventos-lista');

  if (!vehiculoId) {
    contenedor.innerHTML = `<div class="alert alert-danger">ID de vehículo no especificado en la URL.</div>`;
    return;
  }

  try {
    const response = await fetch(`${URL_API}/vehiculos/${vehiculoId}/eventos`);
    if (!response.ok) {
      const errorMsg = await response.text();
      contenedor.innerHTML = `<div class="alert alert-danger">${errorMsg}</div>`;
    } else {
      const eventos = await response.json();

      if (!Array.isArray(eventos) || eventos.length === 0) {
        contenedor.innerHTML = `<div class="alert alert-info">No hay eventos asociados a este vehículo.</div>`;
      } else {
        contenedor.innerHTML = eventos.map(ev => `
          <div class="col">
            <div class="card h-100 shadow-sm">
              <div class="card-body">
                <h5 class="card-title">${ev.titulo}</h5>
                <p><strong>Descripción:</strong> ${ev.descripcion}</p>
                <p><strong>Tipo:</strong> ${ev.tipoEvento}</p>
                <a href="eventoDetalle.html?id=${ev.idEvento}" class="btn btn-primary">Ver detalle</a>
              </div>
            </div>
          </div>
        `).join('');
      }
    }

    // Mostrar SIEMPRE el botón, abajo a la derecha
    contenedor.insertAdjacentHTML(
      'afterend',
      `
      <div class="d-flex justify-content-end mt-3">
        <a href="addEvento.html?id=${vehiculoId}" class="btn btn-success">Agregar evento</a>
      </div>
      `
    );

  } catch (error) {
    console.error("Error al obtener los eventos:", error);
    contenedor.innerHTML = `<div class="alert alert-danger">Error al conectar con el servidor.</div>`;
    // Incluso en error, mostramos el botón para permitir crear uno nuevo
    contenedor.insertAdjacentHTML(
      'afterend',
      `
      <div class="d-flex justify-content-end mt-3">
        <a href="addEvento.html?id=${vehiculoId}" class="btn btn-success">Agregar evento</a>
      </div>
      `
    );
  }
});
