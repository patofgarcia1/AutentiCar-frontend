import { URL_API } from '../constants/database.js';
import { initGaleriaImagenes } from './components/imagenes.js';

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const vehiculoId = params.get('id');
  const titulo = document.getElementById('titulo');
  const info = document.getElementById('info');
  const token = localStorage.getItem("token");

  if (!token) {
    info.innerHTML = `<div class="alert alert-warning">Sesión no válida. Iniciá sesión nuevamente.</div>`;
    // opcional: window.location.href = 'login.html';
    return;
  }

  if (!vehiculoId) {
    titulo.textContent = "Error";
    info.innerHTML = `<div class="alert alert-danger">ID de vehículo no especificado.</div>`;
    return;
  }

  function showMsg(html, type='info') {
    if (!mensaje) return;
    mensaje.innerHTML = `<div class="alert alert-${type}">${html}</div>`;
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

    info.innerHTML = `
      <p><strong>VIN:</strong> ${v.vin}</p>
      <p><strong>Kilometraje:</strong> ${v.kilometraje} km</p>
      <p><strong>Puertas:</strong> ${v.puertas}</p>
      <p><strong>Motor:</strong> ${v.motor}L</p>
      <p><strong>Color:</strong> ${v.color}</p>
      <p><strong>Combustible:</strong> ${v.tipoCombustible}</p>
      <p><strong>Transmisión:</strong> ${v.tipoTransmision}</p>
      <p><strong>Fecha de alta:</strong> ${v.fechaAlta}</p>
      <p><strong>Estado:</strong> ${v.estado}</p>

      <div class="gap-2 mb-3">
        <a href="docsVehiculo.html?id=${v.idVehiculo}" class="btn btn-primary flex-fill">Ver documentos</a>
        <a href="eventosVehiculo.html?id=${v.idVehiculo}" class="btn btn-primary flex-fill">Ver eventos</a>
      </div>

      <div class="mt-2">
        <button id="btnEliminarVehiculo" class="btn btn-danger btn-sm">Eliminar vehículo</button>
      </div>
    `;

    // Inicializa galería de imágenes
    const root = document.getElementById('imagenes-root');
    initGaleriaImagenes({
      root,
      vehiculoId: Number(vehiculoId),
      allowUpload: true,
      allowDelete: true,
      titulo: 'Imágenes del vehículo',
      authHeaders: { Authorization: `Bearer ${token}` },
    });

    // Handler de eliminación de vehículo
    const btnEliminarVehiculo = document.getElementById('btnEliminarVehiculo');
    btnEliminarVehiculo?.addEventListener('click', async () => {
      if (!confirm('¿Seguro que querés eliminar este vehículo?')) return;

      btnEliminarVehiculo.disabled = true;
      const originalText = btnEliminarVehiculo.textContent;
      btnEliminarVehiculo.textContent = 'Eliminando...';

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
