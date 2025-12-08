import { URL_API } from '../constants/database.js';
import { isAdmin, isUser } from './roles.js';
import { initGaleriaDetalle } from './components/galeriaDetalle.js';
import { renderHistorialCard } from './components/historialCard.js'; 
import { initTransferirTitularidad } from './components/transferirTitularidad.js';
import { initAgregarTaller } from './components/agregarTaller.js';
import { renderTalleresAsignados } from './components/listarTalleres.js';
import { initDocumentosRecomendados } from './components/documentosRecomendados.js';

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
    const pubResp = await fetch(`${URL_API}/publicaciones/${publicacionId}`);
    if (!pubResp.ok) throw new Error(await pubResp.text());
    const publicacion = await pubResp.json();

    const vehResp = await fetch(`${URL_API}/vehiculos/${publicacion.vehiculoId}`);
    const vehiculo = vehResp.ok ? await vehResp.json() : null;

    const userResp = vehiculo?.idUsuario
      ? await fetch(`${URL_API}/usuarios/publico/${vehiculo.idUsuario}`)
      : null;
    const usuario = userResp?.ok ? await userResp.json() : null;

    const token = localStorage.getItem('token');
    const usuarioIdStr = localStorage.getItem('usuarioId');
    const usuarioId = usuarioIdStr != null ? Number(usuarioIdStr) : null;
    const isLogged = !!token;
    const ownerId = vehiculo?.idUsuario ? Number(vehiculo.idUsuario) : null;
    const isOwner = isLogged && ownerId != null && usuarioId === ownerId;

    const puedeVer = await puedeVerHistorial(vehiculo, usuarioId, isLogged, isOwner);

    const allowedRaw = vehiculo?.allowedToSee ?? null;
    const allowed = allowedRaw ? String(allowedRaw).toUpperCase() : null;
    const soloValidados = ['VALIDADO', 'VALIDADOS', 'USUARIOS_VALIDADOS'].includes(allowed);

    const cardHistorialHTML = renderHistorialCard({
      puedeVer,
      isLogged,
      soloValidados,
      vehiculoId: vehiculo?.idVehiculo
    });

    const simbolo = publicacion.moneda === 'DOLARES' ? 'U$D' : '$';

    container.innerHTML = `
      <div class="row g-4">
        <div class="col-lg-8 position-relative">
          ${isLogged ? `
            <button id="btnFavorito" class="btn-favorito">
              <img id="iconoFavorito" src="img/corazonVacio.png" alt="Favorito" class="icono-favorito">
            </button>
          ` : ''}

          <div id="galeria-root" class="card card-autoplat overflow-hidden mb-4"></div>

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
              <p class="text-secondary descripcion-publicacion">
                ${publicacion.descripcion || 'Sin descripción disponible.'}
              </p>
            </div>
          </div>
        </div>

        <div class="col-lg-4">
          ${usuario ? `
            <div class="card card-autoplat mb-4 p-3">
              <div class="card-header-vendedor mb-2">
                <h6 class="fw-bold mb-0 text-primary text-center">Información del vendedor</h6>
              </div>

              <div class="card-body d-flex align-items-center gap-3 p-0">
                <img src="${usuario.fotoPerfilUrl || 'img/defaultProfile.jpg'}" 
                  class="rounded-circle border vendedor-foto" alt="Vendedor">
                <div>
                  <h6 class="fw-bold mb-0">${usuario.nombre || ''} ${usuario.apellido || ''}</h6>

                  ${isLogged ? `
                    <p class="text-muted mb-1 small">${usuario.email || ''}</p>
                    <p class="text-muted mb-0 small">Teléfono: ${usuario.telefono || '-'}</p>
                  ` : ''}
                </div>
              </div>

              ${isLogged && usuario.telefono ? `
                <div class="mt-3 px-4">
                  <a href="https://api.whatsapp.com/send?phone=${usuario.telefono}&text=${encodeURIComponent('Hola, quiero más información sobre tu publicación en AutentiCar.')}"
                    target="_blank"
                    class="botonWpp btn btn-wpp d-flex align-items-center justify-content-center gap-2 w-100">
                    <img src="img/wppIcono.png" alt="WhatsApp" class="wpp-icono">
                    <span>Contactar por WhatsApp</span>
                  </a>
                </div>
              ` : ''}
            </div>
          ` : ''}

          ${cardHistorialHTML}
          
          ${(isOwner || isAdmin()) ? `
            <div class="card card-autoplat p-4 mt-3">
              <h6 class="fw-bold">Acciones del dueño</h6>
              <div class="d-flex flex-column gap-2">
                <button id="btnToggleEstado" class="btn btn-warning w-100">Pausar publicación</button>
                <button id="btnEliminarPublicacion" class="btn btn-danger w-100">Eliminar vehículo</button>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    if (puedeVer && vehiculo?.idVehiculo) {
      initDocumentosRecomendados(vehiculo.idVehiculo);
    }

    const canManageImages = isLogged && (isAdmin() || (isUser() && isOwner));
    const galeriaRoot = document.getElementById('galeria-root');

    if (galeriaRoot) {
      galeriaRoot.classList.add('loading');

      const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;
      const galeria = initGaleriaDetalle({
        root: galeriaRoot,
        vehiculoId: Number(vehiculo.idVehiculo),
        allowUpload: canManageImages,
        allowDelete: canManageImages,
        authHeaders,
        onChange: (imagenes) => {
          const nuevasFotos = imagenes.map(i => i.urlImagen);
          // actualizarCarousel(nuevasFotos);
        },
        onReady: () => {
          galeriaRoot.classList.remove('loading');
        }
      });

      setTimeout(() => galeriaRoot.classList.remove('loading'), 1200);

      if (canManageImages) {
        galeriaRoot.classList.add('position-relative');

        const fab = document.createElement('button');
        fab.id = 'btnAddImgsFab';
        fab.className = 'btn-addimg-fab';
        fab.type = 'button';
        fab.title = 'Agregar imágenes';
        fab.innerHTML = `<img src="img/pluswhite.png" alt="Agregar">`;
        galeriaRoot.appendChild(fab);

        fab.addEventListener('click', () => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.multiple = true;

          input.onchange = async () => {
            const files = Array.from(input.files || []);
            if (!files.length) return;

            const oldHtml = fab.innerHTML;
            fab.disabled = true;
            fab.innerHTML = `<span class="spinner-border spinner-border-sm"></span>`;

            try {
              await galeria.upload(files);
            } catch (e) {
              console.error(e);
              showMsg(e.message || 'Error al subir', 'danger');
            } finally {
              fab.disabled = false;
              fab.innerHTML = oldHtml;
              input.value = '';
            }
          };

          input.click();
        });
      }
    }

    initFavoritos(publicacionId);

    if (isOwner || isAdmin()) initOwnerActions(publicacionId, vehiculo, publicacion.estadoPublicacion);
    
    if (isOwner || isAdmin()) {
      const colDerecha = document.querySelector('.col-lg-4');
      if (colDerecha) {
        const token = localStorage.getItem('token');
        renderTalleresAsignados(vehiculo.idUsuario, token, colDerecha);
      }
    }

  } catch (err) {
    console.error('Error al cargar:', err);
    container.innerHTML = `<div class="alert alert-danger text-center">No se pudo conectar con el servidor.</div>`;
  }
});

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

// function actualizarCarousel(fotos) {
//   // opcional: refrescar portada si querés mantener sincronía visual
// }

function initFavoritos(publicacionId) {
  const btn = document.getElementById('btnFavorito');
  const icono = document.getElementById('iconoFavorito');
  if (!btn || !icono) return;

  const usuarioId = localStorage.getItem('usuarioId');
  const token = localStorage.getItem('token');
  if (!usuarioId || !token) return;

  function actualizarIcono(esFav) {
    icono.src = esFav ? 'img/corazonRelleno.png' : 'img/corazonVacio.png';
  }

  fetch(`${URL_API}/usuarios/${usuarioId}/favoritos/check/${publicacionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(r => (r.ok ? r.json() : { favorito: false }))
    .then(data => {
      const esFav = !!data?.favorito;
      btn.classList.toggle('favorito-activo', esFav);
      actualizarIcono(esFav);
    })
    .catch(() => actualizarIcono(false));

  btn.addEventListener('click', async () => {
    const esActivo = btn.classList.contains('favorito-activo');

    try {
      const resp = await fetch(`${URL_API}/usuarios/${usuarioId}/favoritos/${publicacionId}`, {
        method: esActivo ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (resp.ok) {
        const nuevoEstado = !esActivo;
        btn.classList.toggle('favorito-activo', nuevoEstado);
        actualizarIcono(nuevoEstado);
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
    const r = await fetch(`${URL_API}/usuarios/${userId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
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
  initTransferirTitularidad(vehiculo.idVehiculo, token);
  initAgregarTaller(vehiculo.idUsuario, token);

  function actualizarBotonToggle(estado) {
    if (!btnToggle) return;

    if (estado === 'ACTIVA') {
      btnToggle.classList.remove('btn-success');
      btnToggle.classList.add('btn-warning');
      btnToggle.textContent = 'Pausar publicación';
    } else if (estado === 'PAUSADA') {
      btnToggle.classList.remove('btn-warning');
      btnToggle.classList.add('btn-success');
      btnToggle.textContent = 'Activar publicación';
    }
  }

  actualizarBotonToggle(estadoActual);

  btnToggle?.addEventListener('click', async () => {
    if (!token) return showMsg('Sesión no válida.', 'warning');

    const estadoPrevio = estadoActual;
    const nuevoEstado = estadoPrevio === 'ACTIVA' ? 'PAUSADA' : 'ACTIVA';

    btnToggle.disabled = true;
    btnToggle.textContent = 'Actualizando...';

    try {
      const resp = await fetch(`${URL_API}/publicaciones/${publicacionId}/estado`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) throw new Error(await resp.text());

      estadoActual = nuevoEstado;
      actualizarBotonToggle(estadoActual);
      showMsg(
        estadoActual === 'ACTIVA'
          ? 'La publicación fue activada correctamente.'
          : 'La publicación fue pausada correctamente.',
        'success'
      );
    } catch (e) {
      console.error(e);
      showMsg('Error al actualizar estado.', 'danger');
      actualizarBotonToggle(estadoPrevio); 
    } finally {
      btnToggle.disabled = false;
    }
  });

  btnEliminar?.addEventListener('click', async () => {
    const idUsuario = localStorage.getItem("usuarioId");
    if (!confirm('¿Seguro que querés eliminar este vehículo?')) return;
    btnEliminar.disabled = true;
    btnEliminar.textContent = 'Eliminando...';

    try {
      const del = await fetch(`${URL_API}/vehiculos/${vehiculo.idVehiculo}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!del.ok) throw new Error(await del.text());

      showMsg('Vehículo eliminado correctamente.', 'success');
      setTimeout(() => (window.location.href = `misPublicaciones.html?usuario=${idUsuario}`), 1000);

    } catch (e) {
      console.error(e);
      showMsg('Error al eliminar el vehículo.', 'danger');

    } finally {
      btnEliminar.disabled = false;
      btnEliminar.textContent = 'Eliminar vehículo';
    }
  });
  
}
