import { URL_API } from '../constants/database.js';
import { initGaleriaImagenes } from './components/imagenes.js';
import { isAdmin, isUser, getSession } from './roles.js';

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const vehiculoId = params.get('id');
  const titulo = document.getElementById('titulo');
  const info = document.getElementById('info');
  //const token = localStorage.getItem("token");


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

    console.log('vehiculo payload =>', v);

    titulo.textContent = `${v.marca} ${v.modelo} (${v.anio})`;

    info.innerHTML = `
      <p><strong>Kilometraje:</strong> ${v.kilometraje} km</p>
      <p><strong>Puertas:</strong> ${v.puertas}</p>
      <p><strong>Motor:</strong> ${v.motor}L</p>
      <p><strong>Color:</strong> ${v.color}</p>
      <p><strong>Combustible:</strong> ${v.tipoCombustible}</p>
      <p><strong>Transmisión:</strong> ${v.tipoTransmision}</p>

      <div class="gap-2 mb-3">
        <a href="docsVehiculo.html?id=${v.idVehiculo}" class="btn btn-primary flex-fill">Ver documentos</a>
        <a href="eventosVehiculo.html?id=${v.idVehiculo}" class="btn btn-primary flex-fill">Ver eventos</a>
      </div>
    `;

    // Dueño del vehículo según tu DTO (VehiculosDTO.idUsuario)
    const ownerId = (v?.idUsuario != null) ? Number(v.idUsuario) : null;

    // Usuario logueado (desde roles.js)
    const { userId: loggedIdRaw } = getSession();
    const loggedId = (loggedIdRaw != null) ? Number(loggedIdRaw) : null;

    let canManageImages = false;
    if (localStorage.getItem('token')) {
      canManageImages = isAdmin() || (isUser() && ownerId != null && loggedId === ownerId);
    }

    let acciones = document.getElementById('acciones-vehiculo');
    if (!acciones) {
      acciones = document.createElement('div');
      acciones.id = 'acciones-vehiculo';
      acciones.className = 'd-flex gap-2 flex-wrap my-3';
      info.appendChild(acciones);
    }

    const puedeEliminar = isAdmin() || (isUser() && ownerId != null && loggedId === ownerId);

    // 6) Render condicional del botón
    acciones.innerHTML = puedeEliminar
      ? `<button id="btnEliminarVehiculo" class="btn btn-danger">Eliminar vehículo</button>`
      : ``;


    const authHeaders = localStorage.getItem('token')
      ? { Authorization: `Bearer ${localStorage.getItem('token')}` }
      : undefined;

    // Inicializa galería de imágenes
    const root = document.getElementById('imagenes-root');
    initGaleriaImagenes({
      root,
      vehiculoId: Number(vehiculoId),
      allowUpload: canManageImages ,
      allowDelete: canManageImages ,
      titulo: 'Imágenes del vehículo',
      authHeaders,
    });

    // Handler de eliminación de vehículo
    const btnEliminarVehiculo = document.getElementById('btnEliminarVehiculo');
    btnEliminarVehiculo?.addEventListener('click', async () => {
      if (!confirm('¿Seguro que querés eliminar este vehículo?')) return;

      btnEliminarVehiculo.disabled = true;
      const originalText = btnEliminarVehiculo.textContent;
      btnEliminarVehiculo.textContent = 'Eliminando...';

      if (!token) {
        showMsg("Sesión no válida. Iniciá sesión nuevamente.", "warning");
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
          btnEliminar.textContent = originalText;
          btnEliminar.disabled = false;
          return;
        }

        if (!del.ok) {
          const txt = await del.text();
          alert(`Error al eliminar: ${txt}`);
          return;
        }

        showMsg('Vehículo eliminado.', 'success');
        // alert('Vehículo eliminado.');
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
