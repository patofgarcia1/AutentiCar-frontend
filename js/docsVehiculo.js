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

    // imágenes -> resize
    if (mime && mime.startsWith('image/')) {
      return url.replace('/upload/', '/upload/w_500,h_300,c_fill,f_auto,q_auto/');
    }
    // PDF subido como image -> miniatura página 1
    if (mime === 'application/pdf') {
      const t = url.replace('/upload/', '/upload/pg_1,w_500,h_300,c_fill,f_auto,q_auto/');
      // forzar extensión de salida (algunas CDNs lo prefieren)
      return t.replace(/\.pdf($|\?)/, '.jpg$1');
    }
    // otros tipos -> sin preview
    return null;
  }

  try {
    const response = await fetch(`${URL_API}/vehiculos/${vehiculoId}/documentos`);
    if (!response.ok) {
      const errorMsg = await response.text();
      contenedor.innerHTML = `<div class="alert alert-danger">${errorMsg}</div>`;
      return;
    }

    const documentos = await response.json();

    if (!documentos.length) {
      contenedor.innerHTML = `<div class="alert alert-danger">No hay documentos asociados a este vehículo.</div>`;
      return;
    }

    contenedor.innerHTML = documentos.map(doc => {
      const thumb = cloudThumb(doc.urlDoc, doc.mimeType);
      const imgTag = `
        <a href="${doc.urlDoc}" target="_blank" rel="noopener">
          <img
            class="card-img-top"
            alt="${doc.nombre || 'Documento'}"
            src="${thumb || PLACEHOLDER}"
            onerror="this.onerror=null;this.src='${PLACEHOLDER}';"
            style="height:200px;object-fit:cover;background:#f7f7f7"
          />
        </a>
      `;

      return `
        <div class="col-md-4">
          <div class="card h-100 shadow-sm">
            ${imgTag}
            <div class="card-body">
              <h5 class="card-title mb-2">${doc.nombre}</h5>
              <p class="mb-1"><strong>Tipo:</strong> ${doc.tipoDoc}</p>
              <p class="mb-3"><strong>Nivel de riesgo:</strong> ${doc.nivelRiesgo}</p>
              <div class="d-flex gap-2">
                <a href="docDetalle.html?id=${doc.idDocVehiculo}" class="btn btn-primary btn-sm">Ver detalle</a>
            </div>
          </div>
          <div class="gap-2 mb-3">
        </div>
      `;
    }).join('');

    contenedor.insertAdjacentHTML(
      'afterend',
      `
      <div class="d-flex justify-content-end mt-3">
        <a href="addDocumento.html?id=${vehiculoId}" class="btn btn-success">Agregar documento</a>
      </div>
      `
    );

  } catch (error) {
    console.error("Error al obtener documentos:", error);
    contenedor.innerHTML = `<div class="alert alert-danger">Error al conectar con el servidor.</div>`;
  }
});
