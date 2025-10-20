import { URL_API } from '../constants/database.js';

document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem("token");
  const contenedor = document.getElementById('usuarios-container');

  if (!token) {
    contenedor.innerHTML = `<div class="alert alert-warning text-center mt-4">Sesión no válida. Iniciá sesión nuevamente.</div>`;
    return;
  }

  // Deja la modal como está
  ensureValidacionModal();

  try {
    const response = await fetch(`${URL_API}/usuarios`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
      cache: 'no-store'
    });

    if (response.status === 401 || response.status === 403) {
      contenedor.innerHTML = `<div class="alert alert-danger text-center mt-4">No autorizado. Iniciá sesión nuevamente.</div>`;
      return;
    }

    if (!response.ok) {
      const errorMsg = await response.text();
      contenedor.innerHTML = `<div class="alert alert-danger text-center mt-4">${errorMsg}</div>`;
      return;
    }

    const usuarios = await response.json();

    if (!usuarios.length) {
      contenedor.innerHTML = `<div class="alert alert-info text-center mt-4">No hay usuarios registrados aún.</div>`;
      return;
    }

    contenedor.innerHTML = usuarios.map(u => {
    const estado = (u.nivelUsuario || '—').toString().toUpperCase();
    const estadoClass = estadoColorClass(estado);
    const fotoPerfil = u.profilePicUrl || u.fotoPerfilUrl || 'img/defaultProfile.jpg';

    return `
      <div class="col">
        <div class="card card-autoplat-usuario usuario-card h-100 shadow-sm">
          <div class="card-body p-3">
            <div class="d-flex align-items-center usuario-head">
              <img src="${fotoPerfil}" alt="Foto de perfil" class="usuario-foto me-3 border rounded-circle">
              <div class="flex-grow-1">
                <h6 class="fw-bold mb-1">${u.nombre ?? ''} ${u.apellido ?? ''}</h6>
                <p class="text-muted mb-0 small">${u.mail ?? ''}</p>
              </div>
            </div>

            <div class="d-flex align-items-center justify-content-between usuario-actions">
              <p class="mb-0 small">
                <strong class="text-secondary">Estado:</strong>
                <span class="estado-usuario fw-semibold ${estadoClass}" data-user-id="${u.idUsuario}">
                  ${estado}
                </span>
              </p>
              <button class="btn btn-sm btn-primary ver-validacion" data-user-id="${u.idUsuario}">
                Ver validación
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');


    // Abrir modal
    contenedor.addEventListener('click', async (e) => {
      const btn = e.target.closest('.ver-validacion');
      if (!btn) return;
      const userId = btn.getAttribute('data-user-id');
      if (!userId) return;
      await abrirModalValidacion(Number(userId), token);
    });

  } catch (error) {
    console.error(error);
    contenedor.innerHTML = `<div class="alert alert-danger text-center mt-4">Error al conectar con el servidor.</div>`;
  }
});

/* ===== Helper: color por estado ===== */
function estadoColorClass(estadoUpper) {
  switch (estadoUpper) {
    case 'REGISTRADO': return 'text-primary';
    case 'VALIDADO':   return 'text-success';
    case 'RECHAZADO':  return 'text-danger';
    case 'PENDIENTE':  return 'text-warning';
    default:           return 'text-secondary';
  }
}

/* ============ Modal & acciones (igual que ya tenías) ============ */

function ensureValidacionModal() {
  if (document.getElementById('validacionModal')) return;

  const modalHtml = `
  <div class="modal fade" id="validacionModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Validación de usuario</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
        </div>
        <div class="modal-body">
          <div id="val-msg" class="mb-2"></div>
          <div class="row g-3">
            <div class="col-md-6">
              <a id="linkFrente" href="#" target="_blank" rel="noopener" class="dni-preview-link">
                <img id="imgFrente" alt="Frente del DNI" class="dni-preview-img">
              </a>
              <div class="small text-muted mt-2">Frente</div>
            </div>
            <div class="col-md-6">
              <a id="linkDorso" href="#" target="_blank" rel="noopener" class="dni-preview-link">
                <img id="imgDorso" alt="Dorso del DNI" class="dni-preview-img">              
              </a>
              <div class="small text-muted mt-2">Dorso</div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button id="btnRechazar" type="button" class="btn btn-danger">Rechazar</button>
          <button id="btnValidar"  type="button" class="btn btn-success">Validar</button>
        </div>
      </div>
    </div>
  </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

async function abrirModalValidacion(userId, token) {
  const modalEl = document.getElementById('validacionModal');
  const modal   = bootstrap.Modal.getOrCreateInstance(modalEl, { backdrop: 'static' });

  const msg = document.getElementById('val-msg');
  const imgFrente = document.getElementById('imgFrente');
  const imgDorso  = document.getElementById('imgDorso');
  const linkFrente = document.getElementById('linkFrente');
  const linkDorso  = document.getElementById('linkDorso');
  const btnValidar = document.getElementById('btnValidar');
  const btnRechazar= document.getElementById('btnRechazar');

  msg.innerHTML = '';
  setImg(linkFrente, imgFrente, null);
  setImg(linkDorso,  imgDorso,  null);
  btnValidar.disabled = true;
  btnRechazar.disabled = true;

  modal.show();

  try {
    const resp = await fetch(`${URL_API}/usuarios/validacion/${userId}/dni`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
      cache: 'no-store'
    });

    if (resp.status === 401 || resp.status === 403) {
      msg.innerHTML = `<div class="alert alert-danger">No autorizado. Iniciá sesión nuevamente.</div>`;
      return;
    }
    if (!resp.ok) {
      const txt = await resp.text();
      msg.innerHTML = `<div class="alert alert-danger">Error: ${txt || 'No se pudo obtener la validación.'}</div>`;
      return;
    }

    const data = await resp.json();
    const frente = orNull(data?.frenteUrl);
    const dorso  = orNull(data?.dorsoUrl);

    setImg(linkFrente, imgFrente, frente);
    setImg(linkDorso,  imgDorso,  dorso);

    // btnValidar.disabled  = !(frente && dorso);
    // btnRechazar.disabled = false;

    if (!(frente && dorso)) {
      btnValidar.disabled = true;
      btnRechazar.disabled = true;
    } else {
      btnValidar.disabled = false;
      btnRechazar.disabled = false;
    }

    const estadoEl = document.querySelector(`.estado-usuario[data-user-id="${userId}"]`);
    const estadoUsuario = estadoEl ? estadoEl.textContent.trim().toUpperCase() : null;

    if (estadoUsuario === 'VALIDADO') {
      btnValidar.disabled = true;
      btnRechazar.disabled = true;
    }

    btnValidar.onclick = () => accionAdmin('validar', userId, token, modal, msg);
    btnRechazar.onclick = () => accionAdmin('rechazar', userId, token, modal, msg);

  } catch (e) {
    console.error(e);
    msg.innerHTML = `<div class="alert alert-danger">Error de conexión con el servidor.</div>`;
  }
}

function setImg(anchorEl, imgEl, url) {
  const PLACEHOLDER = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="480">
      <rect width="100%" height="100%" fill="#f1f3f5"/>
      <text x="50%" y="50%" font-size="20" text-anchor="middle" fill="#adb5bd">Sin imagen</text>
    </svg>`
  );
  if (url) {
    const noCacheUrl = appendNoCache(url);
    anchorEl.href = noCacheUrl;
    imgEl.src = noCacheUrl;
  } else {
    anchorEl.href = '#';
    imgEl.src = PLACEHOLDER;
  }
}

function appendNoCache(u) {
  try {
    const url = new URL(u);
    url.searchParams.set('_t', Date.now().toString());
    return url.toString();
  } catch {
    const sep = u.includes('?') ? '&' : '?';
    return `${u}${sep}_t=${Date.now()}`;
  }
}

function orNull(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

async function accionAdmin(tipo, userId, token, modal, msg) {
  const btnValidar  = document.getElementById('btnValidar');
  const btnRechazar = document.getElementById('btnRechazar');
  btnValidar.disabled = true;
  btnRechazar.disabled = true;

  const endpoint = tipo === 'validar'
    ? `${URL_API}/usuarios/validacion/${userId}/validar`
    : `${URL_API}/usuarios/validacion/${userId}/rechazar`;

  try {
    const r = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    const txt = await r.text().catch(() => '');
    if (r.status === 401 || r.status === 403) {
      msg.innerHTML = `<div class="alert alert-danger">No autorizado. Iniciá sesión nuevamente.</div>`;
      btnValidar.disabled = false;
      btnRechazar.disabled = false;
      return;
    }
    if (!r.ok) {
      msg.innerHTML = `<div class="alert alert-danger">Error: ${txt || 'No se pudo completar la acción.'}</div>`;
      btnValidar.disabled = false;
      btnRechazar.disabled = false;
      return;
    }

    const nuevoEstado = (tipo === 'validar') ? 'VALIDADO' : 'RECHAZADO';
    const badge = document.querySelector(`.estado-usuario[data-user-id="${userId}"]`);
    if (badge) {
      badge.textContent = nuevoEstado;
      badge.className = `estado-usuario fw-semibold ${estadoColorClass(nuevoEstado)}`;
    }

    msg.innerHTML = `<div class="alert alert-success">Nuevo estado: ${nuevoEstado}.</div>`;
    setTimeout(() => modal.hide(), 800);

  } catch (e) {
    console.error(e);
    msg.innerHTML = `<div class="alert alert-danger">Error de conexión con el servidor.</div>`;
    btnValidar.disabled = false;
    btnRechazar.disabled = false;
  }
}
