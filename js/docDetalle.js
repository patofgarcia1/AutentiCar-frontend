import { URL_API } from '../constants/database.js';
import { isAdmin, isUser, getSession } from './roles.js';

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const docId = params.get('id');
  const titulo = document.getElementById('titulo');
  const info = document.getElementById('info');
  const mensaje = document.getElementById('mensaje'); // <- para showMsg
  const localToken = localStorage.getItem("token");

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
    if (mime && mime.startsWith('image/')) {
      return url.replace('/upload/', '/upload/w_400,h_250,c_fill,f_auto,q_auto/');
    }
    if (mime === 'application/pdf') {
      const t = url.replace('/upload/','/upload/pg_1,w_400,h_250,c_fill,f_auto,q_auto/');
      return t.replace(/\.pdf($|\?)/, '.jpg$1');
    }
    return null;
  }

  try {
    // 1) Traer detalle del documento (público)
    const response = await fetch(`${URL_API}/documentos/${docId}`);
    if (!response.ok) {
      const errorMsg = await response.text();
      titulo.textContent = "Documento no encontrado";
      info.innerHTML = `<div class="alert alert-danger">${errorMsg}</div>`;
      return;
    }
    const doc = await response.json();
    titulo.textContent = doc.nombre || "Documento sin nombre";

    // 2) Resolver si se puede eliminar (ADMIN o USER dueño del vehículo)
    //    Necesitamos conocer el dueño del vehículo
    const vehiculoId = doc.idVehiculo ?? doc.vehiculoId ?? null;
    let ownerId = null;
    if (vehiculoId != null) {
      try {
        const vResp = await fetch(`${URL_API}/vehiculos/${vehiculoId}`);
        if (vResp.ok) {
          const v = await vResp.json();
          ownerId = (v?.idUsuario != null) ? Number(v.idUsuario) : null; // tu DTO usa idUsuario
        }
      } catch {}
    }

    const sess = getSession(); // { isLogged, userId, token, rol }
    const loggedId = (sess?.userId != null) ? Number(sess.userId) : null;
    const authToken = sess?.token || localToken || null;

    const puedeEliminar =
      !!authToken && ( isAdmin() || (isUser() && ownerId != null && loggedId === ownerId) );

    // 3) Botones dinámicos
    const botonEvento = doc.idEventoVehicular
      ? `<a href="eventoDetalle.html?id=${doc.idEventoVehicular}" class="btn btn-warning me-2">Ver Evento</a>`
      : "";

    const botonAnalisis = doc.idEventoVehicular
      ? `<a href="analisisIA.html?id=${docId}" class="btn btn-info">Ver análisis IA</a>`
      : "";

    const botonEliminar = puedeEliminar
      ? `<button id="btnEliminarDoc" class="btn btn-danger btn-sm">Eliminar documento</button>`
      : "";

    const validadoIAHtml = doc.validadoIA
      ? `
        <div class="d-flex align-items-center gap-2">
          <img src="img/greenBadge.png" alt="Validado por IA" width="40" height="35" />
          <span class="fw-semibold text">Validado por IA</span>
        </div>
      `
      : `
        <span class="badge text-bg-secondary">No validado por IA</span>
      `;

    // 4) Render info
    info.innerHTML = `
      <p><strong>Tipo de documento:</strong> ${doc.tipoDoc}</p>
      <p><strong>Nivel de riesgo:</strong> ${doc.nivelRiesgo} %</p>
      <p><strong>Fecha de subida:</strong> ${doc.fechaSubida ?? '—'}</p>
      <div class="mb-2">${validadoIAHtml}</div>
      <div class="mt-3 d-flex gap-2">
        ${botonEvento}
        ${botonAnalisis}
        ${botonEliminar}
      </div>
      <hr class="my-4">
      <h5 class="mb-3">Vista previa</h5>
      <div id="doc-preview"></div
    `;

    // 5) Vista previa
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

    // 6) Handler de eliminación (solo si hay botón)
    const btnEliminar = document.getElementById('btnEliminarDoc');
    btnEliminar?.addEventListener('click', async () => {
      if (!confirm('¿Seguro que querés eliminar este documento? Esta acción es permanente.')) return;

      btnEliminar.disabled = true;
      const originalText = btnEliminar.textContent;
      btnEliminar.textContent = 'Eliminando...';

      if (!authToken) {
        showMsg("Sesión no válida. Iniciá sesión nuevamente.", "warning");
        btnEliminar.disabled = false;
        btnEliminar.textContent = originalText;
        return;
      }

      try {
        const del = await fetch(`${URL_API}/vehiculos/documentos/${docId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authToken}`,
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

        // Volver a la lista del vehículo si logramos deducirlo
        const backVehiculoId = vehiculoId;
        showMsg('Documento eliminado.', 'success');
        if (backVehiculoId) {
          setTimeout(() => {
            window.location.href = `docsVehiculo.html?id=${backVehiculoId}`;
          }, 1000);
        } else {
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
