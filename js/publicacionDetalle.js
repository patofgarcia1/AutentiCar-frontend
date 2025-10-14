import { URL_API } from '../constants/database.js';
import { isAdmin, isUser } from './roles.js';

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const publicacionId = params.get('id');
  const container = document.getElementById('detalle-publicacion');

  if (!publicacionId) {
    container.innerHTML = `<div class="alert alert-danger text-center">ID de publicación no especificado.</div>`;
    return;
  }

  try {
    // 1️⃣ Publicación
    const pubResp = await fetch(`${URL_API}/publicaciones/${publicacionId}`);
    if (!pubResp.ok) throw new Error(await pubResp.text());
    const publicacion = await pubResp.json();

    // 2️⃣ Vehículo
    const vehResp = await fetch(`${URL_API}/vehiculos/${publicacion.vehiculoId}`);
    const vehiculo = vehResp.ok ? await vehResp.json() : null;

    // 3️⃣ Dueño
    const userResp = vehiculo?.idUsuario
      ? await fetch(`${URL_API}/usuarios/publico/${vehiculo.idUsuario}`)
      : null;
    const usuario = userResp?.ok ? await userResp.json() : null;

    const simbolo = publicacion.moneda === 'DOLARES' ? 'U$D' : '$';
    const portada = vehiculo?.portadaUrl || 'img/defaultCar.jpg';

    container.innerHTML = `
      <div class="row g-4">
        <!-- Columna izquierda -->
        <div class="col-lg-8">
          <div class="card card-autoplat overflow-hidden mb-4">
            <img src="${portada}" class="w-100" style="max-height: 420px; object-fit: cover;" alt="Portada vehículo"/>

            <div class="card-body">
              <div class="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-3">
                <div>
                  <h2 class="fw-bold mb-1">${publicacion.titulo}</h2>
                  <p class="text-muted mb-0">
                    ${vehiculo?.marca || ''} • ${vehiculo?.modelo || ''} • ${vehiculo?.anio || ''} • ${vehiculo?.tipoTransmision || ''} • ${vehiculo?.tipoCombustible || ''}
                  </p>
                </div>
                <h3 class="text-primary fw-bold mt-3 mt-sm-0">${simbolo} ${publicacion.precio}</h3>
              </div>

              <hr/>

              <!-- Especificaciones -->
              <h5 class="fw-bold mb-3">Especificaciones</h5>
              <div class="row row-cols-2 row-cols-md-3 g-3">
                ${renderSpec('motorIcono.png', 'Motor', vehiculo?.motor + 'L')}
                ${renderSpec('transmisionIcono.png', 'Transmisión', vehiculo?.tipoTransmision)}
                ${renderSpec('kilometrajeIcono.png', 'Kilometraje', vehiculo?.kilometraje + ' km')}
                ${renderSpec('combustibleIcono.png', 'Combustible', vehiculo?.tipoCombustible)}
                ${renderSpec('colorIcono.png', 'Color', vehiculo?.color)}
                ${renderSpec('puertasIcono.png', 'Puertas', vehiculo?.puertas)}
                ${renderSpec('anioIcono.png', 'Año', vehiculo?.anio)}
              </div>

              <hr class="my-4"/>

              <!-- Descripción -->
              <h5 class="fw-bold mb-3">Características Destacadas</h5>
              <p class="text-secondary">${publicacion.descripcion || 'Sin descripción disponible.'}</p>
            </div>
          </div>
        </div>

        <!-- Columna derecha -->
        <div class="col-lg-4">
          <!-- Card vendedor -->
          ${usuario ? `
            <div class="card card-autoplat mb-4">
              <div class="card-body d-flex align-items-center gap-3">
                <img src="${usuario.fotoPerfilUrl || 'img/defaultProfile.png'}" 
                     class="rounded-circle border" width="70" height="70" style="object-fit:cover" alt="Vendedor">
                <div>
                  <h6 class="fw-bold mb-0">${usuario.nombre || ''} ${usuario.apellido || ''}</h6>
                  <p class="text-muted mb-1 small">${usuario.email || ''}</p>
                  <p class="text-muted mb-0 small">${usuario.telefono || ''}</p>
                </div>
              </div>
            </div>
          ` : `
            <div class="card card-autoplat mb-4 p-3 text-muted text-center">
              No se pudo cargar información del vendedor.
            </div>
          `}

          <!-- Card mantenimiento -->
          <div class="card card-autoplat p-4">
            <h6 class="fw-bold mb-3">Historial de Mantenimiento</h6>
            <p class="text-muted small mb-2">
              Incluye registros de documentos y eventos del vehículo.
            </p>
            <a href="docsVehiculo.html?id=${vehiculo?.idVehiculo}" class="btn btn-outline-primary w-100 mb-2">Ver Documentos</a>
            <a href="eventosVehiculo.html?id=${vehiculo?.idVehiculo}" class="btn btn-outline-primary w-100">Ver Eventos</a>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    console.error('Error al cargar:', err);
    container.innerHTML = `<div class="alert alert-danger text-center">No se pudo conectar con el servidor.</div>`;
  }
});

function renderSpec(icon, label, value) {
  return `
    <div class="col spec-item">
      <img src="img/iconos/${icon}" alt="${label}" class="spec-icon"/>
      <div>
        <p class="fw-semibold mb-0">${label}</p>
        <p class="text-muted small mb-0">${value || '-'}</p>
      </div>
    </div>
  `;
}
