import { URL_API } from '../constants/database.js';

document.addEventListener('DOMContentLoaded', async () => {
  const usuarioId = localStorage.getItem("usuarioId");
  const token = localStorage.getItem("token");
  const contenedor = document.getElementById('vehiculos-lista');

  if (!usuarioId) {
    contenedor.innerHTML = `<div class="alert alert-warning">Debés iniciar sesión para ver tus vehículos.</div>`;
    return;
  }

  if (!token) {
    contenedor.innerHTML = `<div class="alert alert-warning">Sesión no válida. Iniciá sesión nuevamente.</div>`;
    return;
  }

  const PLACEHOLDER = 'https://dummyimage.com/600x400/efefef/aaaaaa&text=Sin+foto';

  const toThumb = (url) =>
    url ? url.replace('/upload/', '/upload/w_500,h_250,c_fill,f_auto,q_auto/') : null;

  try {
    const response = await fetch(`${URL_API}/usuarios/${usuarioId}/vehiculos`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (response.status === 401 || response.status === 403) {
      contenedor.innerHTML = `<div class="alert alert-danger">No autorizado. Iniciá sesión nuevamente.</div>`;
      return;
    }
    
    if (!response.ok) {
      const errorMsg = await response.text();
      contenedor.innerHTML = `<div class="alert alert-danger">${errorMsg}</div>`;
      return;
    }

    const vehiculos = await response.json();

    if (!vehiculos.length) {
      contenedor.innerHTML = `<div class="alert alert-info">No tenés vehículos cargados aún.</div>`;
      return;
    }

    contenedor.innerHTML = vehiculos.map((v) => {
      const thumb = toThumb(v.portadaUrl);
      const imgSrc = thumb || PLACEHOLDER;

      return `
        <div class="favorito-card d-flex flex-column flex-md-row align-items-stretch gap-3 p-4 bg-white border rounded-3 shadow-sm">
          
          <div class="favorito-thumb flex-shrink-0">
            <img src="${imgSrc}" alt="Imagen de ${v.marca} ${v.modelo}"
              onerror="this.onerror=null;this.src='${PLACEHOLDER}'">
          </div>

          <div class="d-flex flex-column justify-content-between flex-grow-1">
            <div>
              <h4 class="mb-1 text-dark fw-semibold">${v.marca} ${v.modelo}</h4>
              <p class="text-muted mb-2 small">${v.version ?? ''}</p>
              <p class="mb-1"><strong>Año:</strong> ${v.anio ?? '—'}</p>
              ${v.kilometraje ? `<p class="mb-3"><strong>Kilometraje:</strong> ${v.kilometraje.toLocaleString('es-AR')} km</p>` : ''}
            </div>

            <div class="d-flex flex-wrap gap-2 mt-2">
              <a href="vehiculoDetalle.html?id=${v.idVehiculo}" class="btn btn-primary btn-sm">Ver detalle</a>
            </div>
          </div>

        </div>
      `;
    }).join('');

  } catch (error) {
    console.error(error);
    contenedor.innerHTML = `<div class="alert alert-danger">Error al conectar con el servidor.</div>`;
  }
});
