import { URL_API } from '../constants/database.js';

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const publicacionId = params.get('id');
  const container = document.getElementById('detalle-publicacion');

  if (!publicacionId) {
    container.innerHTML = `<div class="alert alert-danger">ID de publicación no especificado.</div>`;
    return;
  }

  function showMsg(html, type='info') {
    if (!mensaje) return;
    mensaje.innerHTML = `<div class="alert alert-${type}">${html}</div>`;
  }

  try {
    // 1) Obtener publicación
    const pubResp = await fetch(`${URL_API}/publicaciones/${publicacionId}`);
    if (!pubResp.ok) {
      const error = await pubResp.text();
      container.innerHTML = `<div class="alert alert-danger">${error}</div>`;
      return;
    }
    const publicacion = await pubResp.json();

    // 2) Obtener datos del vehículo
    const vehiculoResp = await fetch(`${URL_API}/vehiculos/${publicacion.vehiculoId}`);
    const vehiculo = vehiculoResp.ok ? await vehiculoResp.json() : null;

    // 3) Obtener datos del usuario
    const usuarioResp = await fetch(`${URL_API}/usuarios/${publicacion.usuarioId}`);
    const usuario = usuarioResp.ok ? await usuarioResp.json() : null;

    // 4) Renderizar todo
    container.innerHTML = `
      <h3>${publicacion.titulo}</h3>
      <p><strong>Descripción:</strong> ${publicacion.descripcion}</p>
      <p><strong>Precio:</strong> $${publicacion.precio}</p>
      <p><strong>Fecha de publicación:</strong> ${publicacion.fechaPublicacion}</p>
      <p><strong>Estado:</strong> ${publicacion.estadoPublicacion}</p>
      <hr/>

      <h5>Datos del Vehículo</h5>
      ${vehiculo ? `
        <ul>
          <li><strong>Marca:</strong> ${vehiculo.marca}</li>
          <li><strong>Modelo:</strong> ${vehiculo.modelo}</li>
          <li><strong>Año:</strong> ${vehiculo.anio}</li>
          <li><strong>VIN:</strong> ${vehiculo.vin}</li>
          <li><strong>Kilometraje:</strong> ${vehiculo.kilometraje} km</li>
          <li><strong>Motor:</strong> ${vehiculo.motor}L</li>
          <li><strong>Color:</strong> ${vehiculo.color}</li>
          <li><strong>Combustible:</strong> ${vehiculo.tipoCombustible}</li>
          <li><strong>Transmisión:</strong> ${vehiculo.tipoTransmision}</li>
        </ul>
      ` : `<p class="text-muted">No se pudo cargar información del vehículo.</p>`}

      <div class="d-flex gap-2 mb-3 flex-wrap">
        <a href="vehiculoDetalle.html?id=${publicacion.vehiculoId}" class="btn btn-primary">Ver más del vehículo</a>
        <button id="btnEliminarPublicacion" class="btn btn-danger">Eliminar publicación</button>
      </div>

      <hr/>
      <h5>Dueño</h5>
      ${usuario ? `
        <p>${usuario.nombre || ''} ${usuario.apellido || ''}</p>
      ` : `<p class="text-muted">No se pudo cargar información del dueño.</p>`}
    `;

    // 5) Handler de eliminación de publicación (NO elimina el vehículo)
    const btnEliminarPublicacion = document.getElementById('btnEliminarPublicacion');
    btnEliminarPublicacion?.addEventListener('click', async () => {
      if (!confirm('¿Seguro que querés eliminar esta publicación? El vehículo asociado NO se eliminará.')) return;

      btnEliminarPublicacion.disabled = true;
      const originalText = btnEliminarPublicacion.textContent;
      btnEliminarPublicacion.textContent = 'Eliminando...';

      try {
        const del = await fetch(`${URL_API}/publicaciones/${publicacionId}`, { method: 'DELETE' });
        if (!del.ok) {
          const txt = await del.text();
          alert(`Error al eliminar: ${txt}`);
          return;
        }

        showMsg('Documento eliminado.', 'success');
        // alert('Publicación eliminada.');
        // Redirigimos al detalle del vehículo para mantener el contexto
        setTimeout(() => {
            window.location.href = `vehiculoDetalle.html?id=${publicacion.vehiculoId}`;
          }, 1000);
      } catch (e) {
        console.error('Error al eliminar la publicación:', e);
        alert('No se pudo eliminar la publicación');
      } finally {
        btnEliminarPublicacion.disabled = false;
        btnEliminarPublicacion.textContent = originalText;
      }
    });

  } catch (error) {
    console.error("Error al obtener detalles de la publicación:", error);
    container.innerHTML = `<div class="alert alert-danger">Error al conectar con el servidor.</div>`;
  }
});
