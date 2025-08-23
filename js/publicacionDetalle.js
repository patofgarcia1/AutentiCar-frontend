import { URL_API } from '../constants/database.js';

// util para mensajes (usa el contenedor global #mensaje)
function showMsg(html, type = 'info') {
  const mensaje = document.getElementById('mensaje');
  if (!mensaje) return;
  mensaje.innerHTML = `<div class="alert alert-${type}">${html}</div>`;
}

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const publicacionId = params.get('id');
  const container = document.getElementById('detalle-publicacion');
  const token = localStorage.getItem("token");

  const simbolos = {
    PESOS: "$",
    DOLARES: "U$D"
  };

  if (!publicacionId) {
    container.innerHTML = `<div class="alert alert-danger">ID de publicación no especificado.</div>`;
    return;
  }

  if (!token) {
    container.innerHTML = `<div class="alert alert-warning">Sesión no válida. Iniciá sesión nuevamente.</div>`;
    // opcional: window.location.href = 'login.html';
    return;
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

    // 4) Render base
    container.innerHTML = `
      <h3>${publicacion.titulo}</h3>
      <p><strong>Descripción:</strong> ${publicacion.descripcion}</p>
      <p><strong>Precio:</strong> ${simbolos[publicacion.moneda]} ${publicacion.precio}</p>
      <p><strong>Fecha de publicación:</strong> ${publicacion.fechaPublicacion}</p>
      <p><strong>Estado:</strong> <span id="estado-publicacion">${publicacion.estadoPublicacion}</span></p>
      <div id="acciones-publicacion" class="d-flex gap-2 mb-3 flex-wrap"></div>
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

      <a href="vehiculoDetalle.html?id=${publicacion.vehiculoId}" class="btn btn-primary mb-3">Ver más del vehículo</a>

      <hr/>
      <h5>Dueño</h5>
      ${usuario ? `
        <p>${usuario.nombre || ''} ${usuario.apellido || ''}</p>
      ` : `<p class="text-muted">No se pudo cargar información del dueño.</p>`}
    `;

    // 5) Render dinámico de botones según estado
    const acciones = document.getElementById('acciones-publicacion');
    const estadoSpan = document.getElementById('estado-publicacion');

    function renderBotones(estadoActual) {
      acciones.innerHTML = `
        ${estadoActual === 'ACTIVA'
          ? `<button id="btnToggleEstado" class="btn btn-warning">Pausar publicación</button>`
          : estadoActual === 'PAUSADA'
            ? `<button id="btnToggleEstado" class="btn btn-success">Activar publicación</button>`
            : ``
        }
        <button id="btnEliminarPublicacion" class="btn btn-danger">Eliminar publicación</button>
      `;

      // Toggle handler
      const btnToggle = document.getElementById('btnToggleEstado');
      btnToggle?.addEventListener('click', async () => {
        btnToggle.disabled = true;
        const original = btnToggle.textContent;
        btnToggle.textContent = 'Actualizando...';

        const token = localStorage.getItem('token');

        if (!token) {
          container.innerHTML = `<div class="alert alert-warning">Sesión no válida. Iniciá sesión nuevamente.</div>`;
          btnToggle.disabled = false;
          btnToggle.textContent = original;
          return;
        }

        try {
          const resp = await fetch(`${URL_API}/publicaciones/${publicacionId}/estado`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,   
              'Accept': 'application/json'
            } 
          });

          if (resp.status === 401 || resp.status === 403) {
            showMsg("No autorizado. Iniciá sesión nuevamente.", "danger");
            btnEliminar.textContent = "Eliminar Cuenta";
            btnEliminar.disabled = false;
            return;
          }

          if (!resp.ok) {
            const txt = await resp.text();
            alert(`No se pudo actualizar el estado: ${txt}`);
            return;
          }

          // Alternamos en el front en base al texto actual
          const nuevo = (estadoActual === 'ACTIVA') ? 'PAUSADA' : 'ACTIVA';
          estadoSpan.textContent = nuevo;
          renderBotones(nuevo);
          showMsg('Publicación actualizada', 'success');
        } catch (e) {
          console.error('Error al actualizar estado:', e);
          alert('Error al actualizar el estado de la publicación');
        } finally {
          btnToggle.disabled = false;
          btnToggle.textContent = original;
        }
      });

      // Eliminar handler (opcional, si querés tenerlo acá también)
      const btnEliminar = document.getElementById('btnEliminarPublicacion');
      btnEliminar?.addEventListener('click', async () => {
        if (!confirm('¿Seguro que querés eliminar esta publicación? El vehículo asociado NO se eliminará.')) return;

        btnEliminar.disabled = true;
        const originalText = btnEliminar.textContent;
        btnEliminar.textContent = 'Eliminando...';

        try {
          const del = await fetch(`${URL_API}/publicaciones/${publicacionId}`, { 
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
          showMsg('Publicación eliminada', 'success');
          window.location.href = `vehiculoDetalle.html?id=${publicacion.vehiculoId}`;
        } catch (e) {
          console.error('Error al eliminar la publicación:', e);
          alert('No se pudo eliminar la publicación');
        } finally {
          btnEliminar.disabled = false;
          btnEliminar.textContent = originalText;
        }
      });
    }

    // Primer render de botones
    renderBotones(publicacion.estadoPublicacion);

  } catch (error) {
    console.error("Error al obtener detalles de la publicación:", error);
    const container = document.getElementById('detalle-publicacion');
    container.innerHTML = `<div class="alert alert-danger">Error al conectar con el servidor.</div>`;
  }
});
