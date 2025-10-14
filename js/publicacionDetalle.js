import { URL_API } from '../constants/database.js';
import { isAdmin, isUser } from './roles.js';
import { initGaleriaImagenes } from './components/imagenes.js';

function showMsg(html, type = 'info') {
  const mensaje = document.getElementById('mensaje');
  if (!mensaje) return;
  mensaje.innerHTML = `<div class="alert alert-${type} mt-3">${html}</div>`;
}

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const publicacionId = params.get('id');
  const container = document.getElementById('detalle-publicacion');

  if (!publicacionId) {
    container.innerHTML = `<div class="alert alert-danger text-center">ID de publicación no especificado.</div>`;
    return;
  }

  try {
    // === 1) PUBLICACIÓN ===
    const pubResp = await fetch(`${URL_API}/publicaciones/${publicacionId}`);
    if (!pubResp.ok) throw new Error(await pubResp.text());
    const publicacion = await pubResp.json();

    // === 2) VEHÍCULO ===
    const vehResp = await fetch(`${URL_API}/vehiculos/${publicacion.vehiculoId}`);
    const vehiculo = vehResp.ok ? await vehResp.json() : null;

    // === 3) USUARIO (VENDEDOR) ===
    const userResp = vehiculo?.idUsuario
      ? await fetch(`${URL_API}/usuarios/publico/${vehiculo.idUsuario}`)
      : null;
    const usuario = userResp?.ok ? await userResp.json() : null;

    // === 4) LOGIN & ROLES ===
    const token = localStorage.getItem('token');
    const usuarioIdStr = localStorage.getItem('usuarioId');
    const usuarioId = usuarioIdStr != null ? Number(usuarioIdStr) : null;
    const isLogged = !!token;

    const ownerId = vehiculo?.idUsuario ? Number(vehiculo.idUsuario) : null;
    const isOwner = isLogged && ownerId != null && usuarioId === ownerId;

    // === 5) DATOS ===
    const simbolo = publicacion.moneda === 'DOLARES' ? 'U$D' : '$';
    const portada = vehiculo?.portadaUrl || 'img/defaultCar.jpg';
    const galeria = vehiculo?.imagenes || [];
    const todasLasFotos = [portada, ...galeria.filter(f => f !== portada)];

    // === 6) HTML ===
    container.innerHTML = `
      <div class="row g-4">
        <!-- IZQUIERDA -->
        <div class="col-lg-8 position-relative">
          <button id="btnFavorito" class="btn-favorito">
            <i class="bi bi-heart"></i>
          </button>

          <!-- Galería principal -->
          <div id="carouselFotos" class="carousel slide card-autoplat overflow-hidden mb-4" data-bs-ride="carousel">
            <div class="carousel-inner">
              ${todasLasFotos
                .map(
                  (img, idx) => `
                <div class="carousel-item ${idx === 0 ? 'active' : ''}">
                  <img src="${img}" class="d-block w-100 portada-vehiculo" alt="Imagen vehículo ${idx + 1}">
                </div>`
                )
                .join('')}
            </div>
            ${
              todasLasFotos.length > 1
                ? `
              <button class="carousel-control-prev" type="button" data-bs-target="#carouselFotos" data-bs-slide="prev">
                <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                <span class="visually-hidden">Anterior</span>
              </button>
              <button class="carousel-control-next" type="button" data-bs-target="#carouselFotos" data-bs-slide="next">
                <span class="carousel-control-next-icon" aria-hidden="true"></span>
                <span class="visually-hidden">Siguiente</span>
              </button>` : ''
            }
          </div>

          <!-- Datos del vehículo -->
          <div class="card card-autoplat overflow-hidden mb-4">
            <div class="card-body">
              <div class="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-3">
                <div>
                  <h2 class="fw-bold mb-1">${publicacion.titulo}</h2>
                  <p class="text-muted mb-0">
                    ${vehiculo?.marca || ''} • ${vehiculo?.modelo || ''} • ${vehiculo?.anio || ''} • ${vehiculo?.tipoTransmision || ''}
                  </p>
                </div>
                <h3 class="text-primary fw-bold precio-publicacion">${simbolo} ${publicacion.precio}</h3>
              </div>

              <hr/>

              <h5 class="fw-bold mb-3">Especificaciones</h5>
              <div class="row row-cols-2 row-cols-md-3 g-3">
                ${renderSpec('motorIcono.png', 'Motor', vehiculo?.motor + 'L')}
                ${renderSpec('transmisionIcono.png', 'Transmisión', vehiculo?.tipoTransmision)}
                ${renderSpec('kilometrajeIcono.png', 'Kilometraje', vehiculo?.kilometraje + ' km')}
                ${renderSpec('combustibleIcono.png', 'Combustible', vehiculo?.tipoCombustible)}
                ${renderSpec('colorIcono.png', 'Color', vehiculo?.color)}
                ${renderSpec('puertasIcono.png', 'Puertas', vehiculo?.puertas)}
                ${renderSpec('calendarioIcono.png', 'Año', vehiculo?.anio)}
              </div>

              <hr class="my-4"/>

              <h5 class="fw-bold mb-3">Descripción</h5>
              <p class="text-secondary">${publicacion.descripcion || 'Sin descripción disponible.'}</p>
            </div>
          </div>
        </div>

        <!-- DERECHA -->
        <div class="col-lg-4">
          <!-- Card vendedor -->
          ${usuario ? `
            <div class="card card-autoplat mb-4 p-3">
              <div class="card-header-vendedor mb-2">
                <h6 class="fw-semibold mb-0 text-primary">Contactate con el vendedor</h6>
              </div>
              <div class="card-body d-flex align-items-center gap-3 p-0">
                <img src="${usuario.fotoPerfilUrl || 'img/defaultProfile.png'}" 
                     class="rounded-circle border vendedor-foto" alt="Vendedor">
                <div>
                  <h6 class="fw-bold mb-0">${usuario.nombre || ''} ${usuario.apellido || ''}</h6>
                  <p class="text-muted mb-1 small">${usuario.email || ''}</p>
                  <p class="text-muted mb-0 small">Teléfono: ${usuario.telefono || '-'}</p>
                </div>
              </div>
            </div>
          ` : ''}

          <!-- Card mantenimiento -->
          ${await puedeVerHistorial(vehiculo, usuarioId, isLogged, isOwner) ? `
            <div class="card card-autoplat p-4">
              <h6 class="fw-bold">Historial de Mantenimiento</h6>
              <p class="text-muted small mb-2">
                Incluye registros de documentos y eventos del vehículo.
              </p>
              <a href="docsVehiculo.html?id=${vehiculo?.idVehiculo}" class="btn btn-outline-primary w-100 mb-2">Ver Documentos</a>
              <a href="eventosVehiculo.html?id=${vehiculo?.idVehiculo}" class="btn btn-outline-primary w-100">Ver Eventos</a>
            </div>
          ` : ''}

          <!-- Card acciones -->
          ${(isOwner || isAdmin()) ? `
            <div class="card card-autoplat p-4 mt-3">
              <h6 class="fw-bold">Acciones del dueño</h6>
              <div class="d-flex flex-column gap-2">
                <button id="btnAgregarImgs" class="btn btn-outline-primary w-100">Agregar imágenes</button>
                <button id="btnToggleEstado" class="btn btn-warning w-100">Pausar publicación</button>
                <button id="btnEliminarPublicacion" class="btn btn-danger w-100">Eliminar publicación</button>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    // === GALERÍA “INVISIBLE” PARA SUBIR IMÁGENES ===
    const canManageImages = isLogged && (isAdmin() || (isUser() && isOwner));
    const tempDiv = document.createElement('div'); // No se agrega al DOM visible

    const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;
    initGaleriaImagenes({
      root: tempDiv,
      vehiculoId: Number(vehiculo.idVehiculo),
      allowUpload: canManageImages,
      allowDelete: canManageImages,
      titulo: 'Galería del vehículo',
      authHeaders,
      hidden: true, // 👈 clave: el componente no se renderiza visualmente
      onChange: async (imagenes) => {
        const nuevasFotos = imagenes.map(i => i.urlImagen);
        const portadaActual = vehiculo.portadaUrl || 'img/defaultCar.jpg';
        const todasLasFotos = [portadaActual, ...nuevasFotos.filter(f => f !== portadaActual)];
        actualizarCarousel(todasLasFotos);
      }
    });

    // === FAVORITOS ===
    initFavoritos(publicacionId);

    // === ACCIONES DEL DUEÑO ===
    if (isOwner || isAdmin()) initOwnerActions(publicacionId, vehiculo, publicacion.estadoPublicacion);

  } catch (err) {
    console.error('Error al cargar:', err);
    container.innerHTML = `<div class="alert alert-danger text-center">No se pudo conectar con el servidor.</div>`;
  }
});

// === UTILIDADES ===
function renderSpec(icon, label, value) {
  return `
    <div class="col spec-item">
      <img src="img/${icon}" alt="${label}" class="spec-icon spec-icon-blue"/>
      <div>
        <p class="fw-semibold mb-0">${label}</p>
        <p class="text-muted small mb-0">${value || '-'}</p>
      </div>
    </div>
  `;
}

function actualizarCarousel(fotos) {
  const carousel = document.getElementById('carouselFotos');
  if (!carousel) return;
  const inner = carousel.querySelector('.carousel-inner');
  if (!inner) return;

  inner.innerHTML = fotos
    .map((img, idx) => `
      <div class="carousel-item ${idx === 0 ? 'active' : ''}">
        <img src="${img}" class="d-block w-100 portada-vehiculo" alt="Imagen ${idx + 1}">
      </div>
    `)
    .join('');

  const hasControls = fotos.length > 1;
  carousel.querySelectorAll('.carousel-control-prev, .carousel-control-next').forEach(btn => {
    btn.style.display = hasControls ? 'block' : 'none';
  });
}

function initFavoritos(publicacionId) {
  const btn = document.getElementById('btnFavorito');
  if (!btn) return;

  const usuarioId = localStorage.getItem('usuarioId');
  const token = localStorage.getItem('token');
  if (!usuarioId || !token) return;

  fetch(`${URL_API}/usuarios/${usuarioId}/favoritos/check/${publicacionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(r => (r.ok ? r.json() : { favorito: false }))
    .then(data => {
      const esFav = data?.favorito;
      btn.classList.toggle('favorito-activo', esFav);
      btn.innerHTML = `<i class="bi ${esFav ? 'bi-heart-fill' : 'bi-heart'}"></i>`;
    });

  btn.addEventListener('click', async () => {
    const esActivo = btn.classList.contains('favorito-activo');
    try {
      const resp = await fetch(`${URL_API}/usuarios/${usuarioId}/favoritos/${publicacionId}`, {
        method: esActivo ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resp.ok) {
        btn.classList.toggle('favorito-activo');
        btn.innerHTML = `<i class="bi ${!esActivo ? 'bi-heart-fill' : 'bi-heart'}"></i>`;
      }
    } catch (e) {
      console.error('Error al actualizar favorito:', e);
    }
  });
}

async function puedeVerHistorial(vehiculo, userId, isLogged, isOwner) {
  if (!isLogged) return false;
  if (isOwner) return true;

  const allowed = ((vehiculo?.allowedToSee || 'REGISTRADO') + '').toUpperCase();
  let nivel = 'REGISTRADO';
  try {
    const r = await fetch(`${URL_API}/usuarios/publico/${userId}`);
    if (r.ok) {
      const d = await r.json();
      if (d?.nivelUsuario) nivel = (d.nivelUsuario + '').toUpperCase();
    }
  } catch {}
  if (allowed === 'VALIDADO') return nivel === 'VALIDADO';
  return true;
}

function initOwnerActions(publicacionId, vehiculo, estadoActual) {
  const token = localStorage.getItem('token');
  const btnEliminar = document.getElementById('btnEliminarPublicacion');
  const btnToggle = document.getElementById('btnToggleEstado');
  const btnAddImgs = document.getElementById('btnAgregarImgs');

  btnAddImgs?.addEventListener('click', () => {
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.click();
  });

  btnToggle?.addEventListener('click', async () => {
    if (!token) return showMsg('Sesión no válida.', 'warning');
    btnToggle.disabled = true;
    btnToggle.textContent = 'Actualizando...';

    try {
      const resp = await fetch(`${URL_API}/publicaciones/${publicacionId}/estado`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) throw new Error(await resp.text());
      showMsg('Estado actualizado correctamente.', 'success');
      setTimeout(() => window.location.reload(), 800);
    } catch (e) {
      console.error(e);
      showMsg('Error al actualizar estado.', 'danger');
    } finally {
      btnToggle.disabled = false;
      btnToggle.textContent = 'Pausar publicación';
    }
  });

  btnEliminar?.addEventListener('click', async () => {
    if (!confirm('¿Seguro que querés eliminar esta publicación?')) return;
    btnEliminar.disabled = true;
    btnEliminar.textContent = 'Eliminando...';
    try {
      const del = await fetch(`${URL_API}/publicaciones/${publicacionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!del.ok) throw new Error(await del.text());
      showMsg('Publicación eliminada correctamente.', 'success');
      setTimeout(() => (window.location.href = `vehiculoDetalle.html?id=${vehiculo.idVehiculo}`), 1000);
    } catch (e) {
      console.error(e);
      showMsg('Error al eliminar publicación.', 'danger');
    } finally {
      btnEliminar.disabled = false;
      btnEliminar.textContent = 'Eliminar publicación';
    }
  });
}
