import { URL_API } from '../constants/database.js';

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const eventoId = params.get('id');
  const contenedor = document.getElementById('docs-lista');

  if (!eventoId) {
    contenedor.innerHTML = `<div class="alert alert-danger">ID del evento no especificado en la URL.</div>`;
    return;
  }

  const token = localStorage.getItem('token');
  if (!token) {
    contenedor.innerHTML = `<div class="alert alert-warning">Sesión no válida. Iniciá sesión nuevamente.</div>`;
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

  
  //skeleton de carga
  contenedor.innerHTML = `
    <div class="col"><div class="card placeholder-wave"><div class="card-body">
      <span class="placeholder col-12" style="height:180px"></span>
      <span class="placeholder col-8 mt-3"></span>
      <span class="placeholder col-6 mt-2"></span>
    </div></div></div>`.repeat(3);

  try {
    const response = await fetch(`${URL_API}/eventos/${eventoId}/documentos`, {
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
      contenedor.innerHTML = `<div class="alert alert-danger">${errorMsg || 'Error al obtener documentos.'}</div>`;
      return;
    }

    const documentos = await response.json();

    if (!Array.isArray(documentos) || documentos.length === 0) {
      contenedor.innerHTML = `<div class="alert alert-info">No hay documentos asociados a este evento.</div>`;
      return;
    }

    contenedor.innerHTML = documentos.map(doc => {
      const thumb = cloudThumb(doc.urlDoc, doc.mimeType);
      const safeNombre = doc.nombre || 'Documento';
      const imgTag = `
        <a href="${doc.urlDoc}" target="_blank" rel="noopener noreferrer">
          <img
            class="card-img-top"
            alt="${safeNombre}"
            src="${thumb || PLACEHOLDER}"
            onerror="this.onerror=null;this.src='${PLACEHOLDER}';"
          />
        </a>`;

      return `
        <div class="col">
          <div class="card h-100 shadow-sm">
            ${imgTag}
            <div class="card-body">
              <h5 class="card-title mb-2">${safeNombre}</h5>
              <p class="mb-1"><strong>Tipo:</strong> ${doc.tipoDoc ?? '-'}</p>
              <p class="mb-3"><strong>Nivel de riesgo:</strong> ${doc.nivelRiesgo ?? '-'}%</p>
              <div class="d-flex gap-2">
                <a href="docDetalle.html?id=${doc.idDocVehiculo}" class="btn btn-primary btn-sm">Ver detalle</a>
              </div>
            </div>
          </div>
        </div>`;
    }).join('');

  } catch (error) {
    console.error("Error al obtener documentos:", error);
    contenedor.innerHTML = `<div class="alert alert-danger">Error al conectar con el servidor.</div>`;
  }
});