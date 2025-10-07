
import { URL_API } from '../constants/database.js';

document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem("token");
  const contenedor = document.getElementById('usuarios-container');

  if (!token) {
    contenedor.innerHTML = `<div class="alert alert-warning">Sesión no válida. Iniciá sesión nuevamente.</div>`;
    return;
  }

  // Inserta la modal si no existe
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
      contenedor.innerHTML = `<div class="alert alert-danger">No autorizado. Iniciá sesión nuevamente.</div>`;
      return;
    }
    
    if (!response.ok) {
      const errorMsg = await response.text();
      contenedor.innerHTML = `<div class="alert alert-danger">${errorMsg}</div>`;
      return;
    }

    const usuarios = await response.json();

    if (!usuarios.length) {
      contenedor.innerHTML = `<div class="alert alert-info">No tenés usuarios cargados aún.</div>`;
      return;
    }

    // Render cards (con botón Ver validación y un span identificable para el estado)
    contenedor.innerHTML = usuarios.map(u => {
      const estado = (u.nivelUsuario || '—');
      return `
        <div class="col">
          <div class="card h-100 shadow-sm">
            <div class="card-body">
              <h5 class="card-title">${u.nombre ?? ''} ${u.apellido ?? ''}</h5>
              <p class="card-text"><strong>Mail:</strong> ${u.mail ?? ''}</p>
              <p class="card-text">
                <strong>Estado:</strong> 
                <span class="estado-usuario" data-user-id="${u.idUsuario}">${estado}</span>
              </p>
              <button class="btn btn-sm btn-primary ver-validacion" data-user-id="${u.idUsuario}">
                Ver validación
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Delegación de eventos para el botón "Ver validación"
    contenedor.addEventListener('click', async (e) => {
      const btn = e.target.closest('.ver-validacion');
      if (!btn) return;

      const userId = btn.getAttribute('data-user-id');
      if (!userId) return;

      await abrirModalValidacion(Number(userId), token);
    });

  } catch (error) {
    console.error(error);
    contenedor.innerHTML = `<div class="alert alert-danger">Error al conectar con el servidor.</div>`;
  }
});

/* ============ Modal & acciones ============ */

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
          <button id="btnRechazar" type="button" class="btn btn-outline-danger">Rechazar</button>
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

  // UI refs
  const msg = document.getElementById('val-msg');
  const imgFrente = document.getElementById('imgFrente');
  const imgDorso  = document.getElementById('imgDorso');
  const linkFrente = document.getElementById('linkFrente');
  const linkDorso  = document.getElementById('linkDorso');
  const btnValidar = document.getElementById('btnValidar');
  const btnRechazar= document.getElementById('btnRechazar');

  // Reset UI
  msg.innerHTML = '';
  setImg(linkFrente, imgFrente, null);
  setImg(linkDorso,  imgDorso,  null);
  btnValidar.disabled = true;
  btnRechazar.disabled = true;

  modal.show();

  try {
    // Traer URLs de validación
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

    const data = await resp.json(); // { frenteUrl, dorsoUrl }
    const frente = orNull(data?.frenteUrl);
    const dorso  = orNull(data?.dorsoUrl);

    // Render side-by-side (solo imágenes simples, clic abre en nueva pestaña)
    setImg(linkFrente, imgFrente, frente);
    setImg(linkDorso,  imgDorso,  dorso);

    // Habilitar acciones si hay al menos una imagen (podés exigir ambas)
    btnValidar.disabled  = !(frente && dorso);
    btnRechazar.disabled = false;

    // Wire actions
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
    // si es una URL sin protocolo válido, igual agregamos ?_t=...
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

    // Éxito → actualizar estado en la card correspondiente
    const nuevoEstado = (tipo === 'validar') ? 'VALIDADO' : 'RECHAZADO';
    const badge = document.querySelector(`.estado-usuario[data-user-id="${userId}"]`);
    if (badge) badge.textContent = nuevoEstado;

    msg.innerHTML = `<div class="alert alert-success">Nuevo estado:  ${nuevoEstado}.</div>`;
    setTimeout(() => modal.hide(), 800);

  } catch (e) {
    console.error(e);
    msg.innerHTML = `<div class="alert alert-danger">Error de conexión con el servidor.</div>`;
    btnValidar.disabled = false;
    btnRechazar.disabled = false;
  }
}
