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
    // opcional: window.location.href = 'login.html';
    return;
  }

  const PLACEHOLDER = 'https://dummyimage.com/600x400/efefef/aaaaaa&text=Sin+foto';

  // genera un thumb de Cloudinary si hay portada
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
      // opcional: window.location.href = 'login.html';
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

    contenedor.innerHTML = vehiculos.map(v => {
      const thumb = toThumb(v.portadaUrl);
      return `
        <div class="col">
          <div class="card h-100 shadow-sm">
            ${
              thumb
                ? `<img src="${thumb}" class="card-img-top" alt="Imagen de ${v.marca} ${v.modelo}"
                     style="height:200px;object-fit:cover;background:#f7f7f7"
                     onerror="this.onerror=null;this.src='${PLACEHOLDER}'">`
                : `<img src="${PLACEHOLDER}" class="card-img-top" alt="Sin foto"
                     style="height:200px;object-fit:cover;background:#f7f7f7">`
            }
            <div class="card-body">
              <h5 class="card-title">${v.marca} ${v.modelo}</h5>
              <p class="card-text"><strong>Año:</strong> ${v.anio}</p>
              <a href="vehiculoDetalle.html?id=${v.idVehiculo}" class="btn btn-primary">Ver detalle</a>
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
