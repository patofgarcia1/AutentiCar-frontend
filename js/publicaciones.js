import { URL_API } from '../constants/database.js';

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('lista-publicaciones');
  

  const PLACEHOLDER = 'https://dummyimage.com/600x400/efefef/aaaaaa&text=Sin+foto';

  // Mismo helper que usás en misVehiculos.js para achicar/optimizar la imagen de Cloudinary
  const toThumb = (url) =>
    url ? url.replace('/upload/', '/upload/w_500,h_250,c_fill,f_auto,q_auto/') : null;

  // Saca el id del vehículo venga plano o anidado
  const resolveVehiculoId = (pub) =>
    pub?.vehiculoId ?? pub?.vehiculo?.idVehiculo ?? pub?.idVehiculo ?? null;

  // Trae el detalle del vehículo y devuelve la portada en miniatura (o null si no hay)
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
    const response = await fetch(`${URL_API}/publicaciones`);
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

    const SIMBOLOS = { PESOS: '$', DOLARES: 'U$D' };

    // Render de tarjetas con imagen (portada o placeholder)
    container.innerHTML = publicaciones.map((pub, i) => {
      const vehiculoId = resolveVehiculoId(pub);
      const imgSrc = portadas[i] || PLACEHOLDER;
      const pubId = pub.idPublicacion ?? pub.id ?? '';

      const monedaKey = (pub.moneda || 'PESOS').toUpperCase();
      const simbolo = SIMBOLOS[monedaKey] || '$';
      const precioStr = (typeof pub.precio === 'number')
        ? pub.precio.toLocaleString('es-AR')   // 30.000, 1.200.000, etc.
        : (pub.precio ?? '—');

      return `
        <div class="col-md-4">
          <div class="card h-100 shadow-sm" style="max-width: 400px; margin:auto">
          <a href="publicacionDetalle.html?id=${pubId}"> 
            <img
              src="${imgSrc}"
              class="card-img-top"
              alt="Imagen del vehículo"
              style="height:200px; object-fit:contain;"
              onerror="this.onerror=null;this.src='${PLACEHOLDER}'"
            >
          </a>
            <div class="card-body">
              <h5 class="card-title">${pub.titulo ?? 'Publicación'}</h5>
              <p class="card-text">${pub.descripcion ?? ''}</p>
              <p class="card-text"><strong>Precio:</strong> ${simbolo} ${precioStr}</p>
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
