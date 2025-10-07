import { URL_API } from '../constants/database.js';
import { initGaleriaImagenes } from './components/imagenes.js';
import { isAdmin, isUser, getSession } from './roles.js';

// Regla de visibilidad SIN dueño


document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const vehiculoId = params.get('id');
  const titulo = document.getElementById('titulo');
  const info = document.getElementById('info');
  const usuarioId = localStorage.getItem('usuarioId');

  if (!vehiculoId) {
    titulo.textContent = "Error";
    info.innerHTML = `<div class="alert alert-danger">ID de vehículo no especificado.</div>`;
    return;
  }

  function showMsg(html, type='info') {
    const msgEl = document.getElementById('mensaje'); // <-- usa el id real
    if (!msgEl) return;
    msgEl.innerHTML = `<div class="alert alert-${type}">${html}</div>`;
  }

  try {
    const response = await fetch(`${URL_API}/vehiculos/${vehiculoId}`);
    if (!response.ok) {
      const errorMsg = await response.text();
      titulo.textContent = "Vehículo no encontrado";
      info.innerHTML = `<div class="alert alert-danger">${errorMsg}</div>`;
      return;
    }
    const v = await response.json();

    titulo.textContent = `${v.marca} ${v.modelo} (${v.anio})`;

    const allowed = ((v.allowedToSee || 'REGISTRADO') + '').toUpperCase();

    const token = localStorage.getItem('token');
    const isLogged = !!token;

    const ownerId = (v?.idUsuario != null) ? Number(v.idUsuario) : null;
    const userIdStr = localStorage.getItem('usuarioId');
    const userIdNum = userIdStr != null ? Number(userIdStr) : null;
    const isOwner = isLogged && ownerId != null && userIdNum === ownerId;

    let nivelUsuarioLog = 'REGISTRADO';
    if (isLogged && userIdNum != null) {
      try {
        const resp = await fetch(`${URL_API}/usuarios/publico/${userIdNum}`, {
          headers: { 
            'Accept': 'application/json', 
            'Cache-Control': 'no-cache' 
          },
          cache: 'no-store'
        });
        if (resp.ok) {
          const pub = await resp.json();
          if (pub?.nivelUsuario) nivelUsuarioLog = norm(pub.nivelUsuario);
        }
      } catch (e) {
        console.warn('No se pudo obtener nivelUsuario público:', e);
      }
    }

    function canSee(allowedVal, nivelVal) {
      const a = (allowedVal || 'REGISTRADO').toString().toUpperCase();
      const n = (nivelVal || 'REGISTRADO').toString().toUpperCase();
      if (a === 'VALIDADO') return n === 'VALIDADO';
      return n === 'REGISTRADO' || n === 'VALIDADO'; // allowed = REGISTRADO
    }

    const puedeVerHistorial = isLogged && (isOwner || canSee(allowed, nivelUsuarioLog));

    // Links solo si está logueado
    const linksHtml = puedeVerHistorial
      ? `
        <div class="gap-2 mb-3">
          <a href="docsVehiculo.html?id=${v.idVehiculo}" class="btn btn-primary flex-fill">Ver documentos</a>
          <a href="eventosVehiculo.html?id=${v.idVehiculo}" class="btn btn-primary flex-fill">Ver eventos</a>
        </div>
      `
      : '';

    info.innerHTML = `
      <p><strong>Kilometraje:</strong> ${v.kilometraje} km</p>
      <p><strong>Puertas:</strong> ${v.puertas}</p>
      <p><strong>Motor:</strong> ${v.motor}L</p>
      <p><strong>Color:</strong> ${v.color}</p>
      <p><strong>Combustible:</strong> ${v.tipoCombustible}</p>
      <p><strong>Transmisión:</strong> ${v.tipoTransmision}</p>
      ${linksHtml}
    `;

    const canManageImages = isLogged && (isAdmin() || (isUser() && ownerId != null && userIdNum === ownerId));
    const puedeEliminar = isLogged && (isAdmin() || (isUser() && ownerId != null && userIdNum === ownerId));

    let acciones = document.getElementById('acciones-vehiculo');
    if (!acciones) {
      acciones = document.createElement('div');
      acciones.id = 'acciones-vehiculo';
      acciones.className = 'd-flex gap-2 flex-wrap my-3';
      info.appendChild(acciones);
    }

    // 6) Render condicional del botón
    acciones.innerHTML = puedeEliminar
      ? `<button id="btnEliminarVehiculo" class="btn btn-danger">Eliminar vehículo</button>`
      : ``;


    const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;

    const root = document.getElementById('imagenes-root');
    initGaleriaImagenes({
      root,
      vehiculoId: Number(vehiculoId),
      allowUpload: canManageImages ,
      allowDelete: canManageImages ,
      titulo: 'Imágenes del vehículo',
      authHeaders,
    });

    const btnEliminarVehiculo = document.getElementById('btnEliminarVehiculo');
    btnEliminarVehiculo?.addEventListener('click', async () => {
      if (!confirm('¿Seguro que querés eliminar este vehículo?')) return;

      btnEliminarVehiculo.disabled = true;
      const originalText = btnEliminarVehiculo.textContent;
      btnEliminarVehiculo.textContent = 'Eliminando...';

      if (!token) {
        showMsg("Sesión no válida. Iniciá sesión nuevamente.", "warning");
        btnEliminarVehiculo.textContent = originalText;  
        btnEliminarVehiculo.disabled = false;
        return;
      }

      try {
        const del = await fetch(`${URL_API}/vehiculos/${vehiculoId}`,
          { method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,   
            'Accept': 'application/json'
          } 
        });

        if (del.status === 401 || del.status === 403) {
          showMsg("No autorizado. Iniciá sesión nuevamente.", "danger");
          btnEliminarVehiculo.textContent = originalText;
          btnEliminarVehiculo.disabled = false;
          return;
        }

        if (!del.ok) {
          const txt = await del.text();
          alert(`Error al eliminar: ${txt}`);
          return;
        }

        showMsg('Vehículo eliminado.', 'success');
        setTimeout(() => {
            window.location.href = 'misVehiculos.html';
        }, 1000);
      } catch (e) {
        console.error(e);
        alert('No se pudo eliminar el vehículo');
      } finally {
        btnEliminarVehiculo.disabled = false;
        btnEliminarVehiculo.textContent = originalText;
      }
    });

  } catch (error) {
    console.error(error);
    titulo.textContent = "Error";
    info.innerHTML = `<div class="alert alert-danger">No se pudo conectar con el servidor.</div>`;
  }
});
