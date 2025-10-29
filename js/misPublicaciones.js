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
  const SIMBOLOS = { PESOS: '$', DOLARES: 'U$D' };

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
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
      cache: 'no-store'
    });

    if (response.status === 401 || response.status === 403) {
      container.innerHTML = `<div class="alert alert-danger">No autorizado. Iniciá sesión nuevamente.</div>`;
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

      const monedaKey = (pub.moneda || 'PESOS').toUpperCase();
      const simbolo = SIMBOLOS[monedaKey] || '$';
      const precioStr = (typeof pub.precio === 'number')
        ? pub.precio.toLocaleString('es-AR')
        : (pub.precio ?? '—');

      return `
        <div class="favorito-card d-flex flex-column flex-md-row align-items-stretch gap-3 p-4 bg-white border rounded-3 shadow-sm">
          
          <div class="publicaciones-thumb flex-shrink-0">
            <a href="publicacionDetalle.html?id=${pubId}">
              <img src="${imgSrc}" alt="Imagen del vehículo"
                class="w-100 h-100"
                onerror="this.onerror=null;this.src='${PLACEHOLDER}'">
            </a>
          </div>

          <div class="d-flex flex-column justify-content-between flex-grow-1">
            <div>
              <h4 class="mb-1 text-dark fw-semibold">${pub.titulo ?? 'Publicación sin título'}</h4>
              ${pub.descripcion ? `<p class="text-muted mb-2 small">${pub.descripcion}</p>` : ''}
              <p class="text-primary fw-semibold fs-5 mb-2">${simbolo} ${precioStr}</p>
              <p class="text-muted"><strong>Estado:</strong> ${pub.estadoPublicacion}</p>
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
