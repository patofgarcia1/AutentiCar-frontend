import { URL_API } from '../constants/database.js';

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const vehiculoId = params.get('id');
  const contenedor = document.getElementById('docs-lista');

  if (!vehiculoId) {
    contenedor.innerHTML = `<div class="alert alert-danger">ID de vehículo no especificado en la URL.</div>`;
    return;
  }

  const PLACEHOLDER = 'https://dummyimage.com/600x400/efefef/aaaaaa&text=Documento';

  function cloudThumb(url, mime) {
    if (!url) return null;

    if (mime && mime.startsWith('image/')) {
      return url.replace('/upload/', '/upload/w_500,h_300,c_fill,f_auto,q_auto/');
    }
    if (mime === 'application/pdf') {
      const t = url.replace('/upload/', '/upload/pg_1,w_500,h_300,c_fill,f_auto,q_auto/');
      return t.replace(/\.pdf($|\?)/, '.jpg$1');
    }
    return null;
  }

  try {
    const response = await fetch(`${URL_API}/vehiculos/${vehiculoId}/documentos`, {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      const errorMsg = await response.text();
      contenedor.innerHTML = `<div class="alert alert-danger">${errorMsg}</div>`;
      return;
    }

    const documentos = await response.json();

    if (!Array.isArray(documentos) || documentos.length === 0) {
      contenedor.innerHTML = `<div class="alert alert-info">No hay documentos asociados a este vehículo.</div>`;
      return;
    }

    contenedor.innerHTML = documentos.map(doc => {
      const thumb = cloudThumb(doc.urlDoc, doc.mimeType);
      const safeNombre = doc.nombre || 'Documento';
      const tipo = doc.tipoDoc ?? '-';
      const riesgo = (doc.nivelRiesgo != null) ? `${doc.nivelRiesgo}%` : '-';

      return `
        <div class="col">
          <div class="card card-auto h-100 border-0 shadow-sm">
            <a href="${doc.urlDoc}" target="_blank" rel="noopener noreferrer">
              <img src="${thumb || PLACEHOLDER}" 
                   alt="${safeNombre}" 
                   class="card-img-top rounded-top" 
                   onerror="this.onerror=null;this.src='${PLACEHOLDER}'" />
            </a>
            <div class="card-body d-flex flex-column">
              <h5 class="card-title text-dark fw-bold">${safeNombre}</h5>
              <p class="card-text text-muted small mb-1">
                <strong>Tipo:</strong> ${tipo}
              </p>
              <p class="card-text text-muted small mb-3">
                <strong>Nivel de riesgo:</strong> ${riesgo}
              </p>
              <div class="mt-auto d-flex gap-2">
                <a href="docDetalle.html?id=${doc.idDocVehiculo}" class="btn btn-primary btn-sm">Ver detalle</a>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

  } catch (error) {
    console.error("Error al obtener documentos:", error);
    contenedor.innerHTML = `<div class="alert alert-danger">Error al conectar con el servidor.</div>`;
  }
});