import { URL_API } from '../constants/database.js';

document.addEventListener('DOMContentLoaded', async () => {
  const usuarioId = localStorage.getItem("usuarioId");
  const token = localStorage.getItem("token");
  const container = document.getElementById('publicaciones-lista');

  if (!usuarioId) {
    container.innerHTML = `<div class="alert alert-warning">Debés iniciar sesión para ver tus publicaciones.</div>`;
    return;
  }
  if (!token) {
    container.innerHTML = `<div class="alert alert-warning">Sesión no válida. Iniciá sesión nuevamente.</div>`;
    // opcional: window.location.href = 'login.html';
    return;
  }

  const PLACEHOLDER = 'https://dummyimage.com/600x400/efefef/aaaaaa&text=Sin+foto';
  const toThumb = (url) =>
    url ? url.replace('/upload/', '/upload/w_500,h_250,c_fill,f_auto,q_auto/') : null;

  const resolveVehiculoId = (pub) =>
    pub?.vehiculoId ?? pub?.vehiculo?.idVehiculo ?? pub?.idVehiculo ?? null;

  async function fetchPortadaVehiculo(vehiculoId) {
    try {
      const vResp = await fetch(`${URL_API}/vehiculos/${vehiculoId}`);
      if (!vResp.ok) return null;
      const v = await vResp.json();
      return toThumb(v.portadaUrl) || null;
    } catch {
      return null;
    }
  }

  try {
    const response = await fetch(`${URL_API}/usuarios/${usuarioId}/publicaciones`,{
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (response.status === 401 || response.status === 403) {
      container.innerHTML = `<div class="alert alert-danger">No autorizado. Iniciá sesión nuevamente.</div>`;
      // opcional: window.location.href = 'login.html';
      return;
    }

    if (!response.ok) {
      const errorMsg = await response.text();
      container.innerHTML = `<div class="alert alert-danger">${errorMsg}</div>`;
      return;
    }

    const publicaciones = await response.json();
    if (!Array.isArray(publicaciones) || publicaciones.length === 0) {
      container.innerHTML = `<div class="alert alert-info">No hay publicaciones disponibles.</div>`;
      return;
    }

    // Traemos en paralelo la portada (si existe) de cada vehículo
    const portadas = await Promise.all(
      publicaciones.map(async (pub) => {
        const vehiculoId = resolveVehiculoId(pub);
        if (!vehiculoId) return null;
        return await fetchPortadaVehiculo(vehiculoId);
      })
    );

    container.innerHTML = publicaciones.map((pub, i) => {
      const vehiculoId = resolveVehiculoId(pub);
      const pubId = pub.idPublicacion ?? pub.id ?? '';
      const imgSrc = portadas[i] || PLACEHOLDER;

      return `
        <div class="col">
          <div class="card h-100 shadow-sm">
            <a href="publicacionDetalle.html?id=${pubId}" style="display:block">
              <img
                src="${imgSrc}"
                class="card-img-top"
                alt="Vehículo"
                onerror="this.onerror=null;this.src='${PLACEHOLDER}'"
              >
            </a>
            <div class="card-body">
              <h5 class="card-title">${pub.titulo ?? 'Publicación'}</h5>
              <p class="card-text">${pub.descripcion ?? ''}</p>
              <p class="card-text"><strong>Precio:</strong> $${pub.precio ?? '—'}</p>
              <p class="card-text"><strong>Estado:</strong> ${pub.estadoPublicacion}</p>
              <div class="d-flex gap-2">
                <a href="publicacionDetalle.html?id=${pubId}" class="btn btn-primary btn-sm">Ver detalle</a>
                ${vehiculoId ? `<a href="vehiculoDetalle.html?id=${vehiculoId}" class="btn btn-outline-secondary btn-sm">Vehículo</a>` : ``}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

  } catch (error) {
    console.error("Error al obtener publicaciones:", error);
    container.innerHTML = `<div class="alert alert-danger">Error al conectar con el servidor.</div>`;
  }
});
