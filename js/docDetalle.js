import { URL_API } from '../constants/database.js';

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const docId = params.get('id');
  const titulo = document.getElementById('titulo');
  const info = document.getElementById('info');
  const token = localStorage.getItem("token");

  if (!docId) {
    titulo.textContent = "Error";
    info.innerHTML = `<div class="alert alert-danger">ID de documento no especificado en la URL.</div>`;
    return;
  }


  const PLACEHOLDER = 'https://dummyimage.com/800x500/efefef/aaaaaa&text=Documento';

  function showMsg(html, type='info') {
    if (!mensaje) return;
    mensaje.innerHTML = `<div class="alert alert-${type}">${html}</div>`;
  }

  function cloudThumb(url, mime) {
    if (!url) return null;

    // imágenes -> resize
    if (mime && mime.startsWith('image/')) {
      return url.replace('/upload/', '/upload/w_400,h_250,c_fill,f_auto,q_auto/');
    }
    // PDF subido como image -> miniatura página 1
    if (mime === 'application/pdf') {
      const t = url.replace('/upload/','/upload/pg_1,w_400,h_250,c_fill,f_auto,q_auto/');
      return t.replace(/\.pdf($|\?)/, '.jpg$1'); // forzar extensión imagen (opcional)
    }
    // otros -> sin preview real
    return null;
  }

  try {
    const url = `${URL_API}/documentos/${docId}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorMsg = await response.text();
      titulo.textContent = "Documento no encontrado";
      info.innerHTML = `<div class="alert alert-danger">${errorMsg}</div>`;
      return;
    }

    const doc = await response.json();
    titulo.textContent = doc.nombre || "Documento sin nombre";

    const botonEvento = doc.idEventoVehicular
      ? `<a href="eventoDetalle.html?id=${doc.idEventoVehicular}" class="btn btn-warning me-2">Ver Evento</a>`
      : "";

    const botonEliminar = `<button id="btnEliminarDoc" class="btn btn-danger btn-sm">Eliminar documento</button>`;

    info.innerHTML = `
      <p><strong>Tipo de documento:</strong> ${doc.tipoDoc}</p>
      <p><strong>Nivel de riesgo:</strong> ${doc.nivelRiesgo} %</p>
      <p><strong>Fecha de subida:</strong> ${doc.fechaSubida ?? '—'}</p>
      <p><strong>Validado por IA:</strong> ${doc.validadoIA ? 'Sí' : 'No'}</p>
      <div class="mt-3 d-flex gap-2">
        ${botonEvento}
        ${botonEliminar}
      </div>
      <hr class="my-4">
      <h5 class="mb-3">Vista previa</h5>
      <div id="doc-preview"></div>
    `;

    // render miniatura clickeable
    const preview = document.getElementById('doc-preview');
    const thumb = cloudThumb(doc.urlDoc, doc.mimeType);

    const a = document.createElement('a');
    a.href = doc.urlDoc || '#';
    a.target = '_blank';
    a.rel = 'noopener';

    const img = document.createElement('img');
    img.alt = doc.nombre || 'Documento';
    img.style.cssText = 'width:100%;max-width:400px;height:250px;object-fit:cover;background:#f7f7f7;border-radius:8px;';
    img.src = thumb || PLACEHOLDER;
    img.onerror = () => { img.src = PLACEHOLDER; };

    a.appendChild(img);
    preview.appendChild(a);

    // handler de eliminación
    const btnEliminar = document.getElementById('btnEliminarDoc');
    btnEliminar?.addEventListener('click', async () => {
      if (!confirm('¿Seguro que querés eliminar este documento? Esta acción es permanente.')) return;

      btnEliminar.disabled = true;
      const originalText = btnEliminar.textContent;
      btnEliminar.textContent = 'Eliminando...';

      if (!token) {
        showMsg("Sesión no válida. Iniciá sesión nuevamente.", "warning");
        return;
      }

      try {
        const del = await fetch(`${URL_API}/vehiculos/documentos/${docId}`, {
           method: 'DELETE',
           headers: {
            'Authorization': `Bearer ${token}`,   
            'Accept': 'application/json'
          } 
        });

        if (del.status === 401 || del.status === 403) {
          showMsg("No autorizado. Iniciá sesión nuevamente.", "danger");
          btnEliminar.textContent = originalText;
          btnEliminar.disabled = false;
          return;
        }


        if (!del.ok) {
          const txt = await del.text();
          alert(`Error al eliminar: ${txt}`);
          return;
        }

        // Intentamos deducir el id del vehículo para volver al listado
        const vehiculoId = doc.idVehiculo ?? doc.vehiculoId ?? null; // según tu DTO
        showMsg('Documento eliminado.', 'success');
        //alert('Documento eliminado');

        if (vehiculoId) {
          setTimeout(() => {
            window.location.href = `docsVehiculo.html?id=${vehiculoId}`;
          }, 1000);
        } else {
          // Fallback si el DTO no tiene el id del vehículo
          history.back();
        }
      } catch (e) {
        console.error(e);
        alert('No se pudo eliminar el documento');
      } finally {
        btnEliminar.disabled = false;
        btnEliminar.textContent = originalText;
      }
    });

  } catch (error) {
    console.error("docDetalle error:", error);
    titulo.textContent = "Error";
    info.innerHTML = `<div class="alert alert-danger">No se pudo conectar con el servidor.</div>`;
  }
});
