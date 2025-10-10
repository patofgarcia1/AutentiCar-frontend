import { URL_API } from '../constants/database.js';
import { isAdmin, isUser, showIf } from './roles.js';

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('lista-publicaciones');
  const inputQ = document.getElementById('search-q');
  const form = document.getElementById('search-form');
  const btnClear = document.getElementById('btn-clear');
  const chipsMarcas = document.getElementById('chips-marcas');
  const chipsColores = document.getElementById('chips-colores');

  const PLACEHOLDER = 'https://dummyimage.com/600x400/efefef/aaaaaa&text=Sin+foto';
  const SIMBOLOS = { PESOS: '$', DOLARES: 'U$D' };

  function ensureLimitModals() {
    if (!document.getElementById('limitModal')) {
      document.body.insertAdjacentHTML('beforeend', `
        <!-- Modal 1: aviso límite -->
        <div class="modal fade" id="limitModal" tabindex="-1" aria-hidden="true">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Límite alcanzado</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
              </div>
              <div class="modal-body">
                <p class="mb-0">
                  No podés realizar más publicaciones. 
                  Chequeá nuestras <a href="#" id="linkOfertas" class="link-primary">ofertas</a>.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal 2: ofertas -->
        <div class="modal fade" id="ofertasModal" tabindex="-1" aria-hidden="true">
          <div class="modal-dialog modal-lg modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Planes disponibles</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
              </div>
              <div class="modal-body">
                <div class="row g-3">
                  <div class="col-md-6">
                    <div class="border rounded p-3 h-100">
                      <h5 class="mb-1">Plan Premium Mensual</h5>
                      <p class="text-muted mb-2">usd 10</p>
                      <p class="mb-3">Incluye: <strong>Publicaciones ilimitadas</strong>.</p>
                      <button class="btn btn-primary w-100" id="btnPlanPlus">Suscribirme</button>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="border rounded p-3 h-100">
                      <h5 class="mb-1">Plan Premium Anual</h5>
                      <p class="text-muted mb-2">usd 110</p>
                      <p class="mb-3">Incluye: <strong>Publicaciones ilimitadas</strong>.</p>
                      <button class="btn btn-primary w-100" id="btnPlanPremium">Suscribirme</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `);

      // wire del link "ofertas": cerrar la primera y abrir la segunda
      document.getElementById('linkOfertas')?.addEventListener('click', (ev) => {
        ev.preventDefault();
        const m1 = bootstrap.Modal.getOrCreateInstance(document.getElementById('limitModal'));
        const m2 = bootstrap.Modal.getOrCreateInstance(document.getElementById('ofertasModal'), { backdrop: 'static' });
        m1.hide();
        // mostrar la segunda después de un pequeño delay para evitar solapado de backdrops
        setTimeout(() => m2.show(), 200);
      });
    }
  }

  const btnAdd = document.getElementById('btn-agregar-vehiculo');
  showIf(btnAdd, isAdmin() || isUser()); 

  ensureLimitModals();

  btnAdd?.addEventListener('click', async (e) => {
    e.preventDefault();

    const usuarioId = localStorage.getItem('usuarioId');
    if (!usuarioId) {
      window.location.href = 'login.html';
      return;
    }

    try {
      const resp = await fetch(`${URL_API}/usuarios/${usuarioId}/publicaciones/count`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        cache: 'no-store'
      });

      if (!resp.ok) {
        window.location.href = 'addVehiculo.html';
        return;
      }

      const data = await resp.json();
      const count  = Number(data?.count);
      const limit  = Number(data?.limit ?? 5);
      const reached = (typeof data?.reached === 'boolean') ? data.reached : (count >= limit);

      if (Number.isNaN(count)) {
        // respuesta rara => dejamos pasar
        window.location.href = 'addVehiculo.html';
        return;
      }

      if (reached) {
        // mostrar la modal de límite
        const modalEl = document.getElementById('limitModal');
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl, { backdrop: 'static' });
        modal.show();
      } else {
        window.location.href = 'addVehiculo.html';
      }
    } catch (err) {
      console.warn('Error al contar publicaciones:', err);
      // si hay error de red, dejamos pasar
      window.location.href = 'addVehiculo.html';
    }
  });


  const toThumb = (url) =>
    url ? url.replace('/upload/', '/upload/w_500,h_250,c_fill,f_auto,q_auto/') : null;

  const resolveVehiculoId = (pub) =>
    pub?.vehiculoId ?? pub?.vehiculo?.idVehiculo ?? pub?.idVehiculo ?? null;

  async function fetchPortadaVehiculo(vehiculoId) {
    try {
      const vResp = await fetch(`${URL_API}/vehiculos/${vehiculoId}`);
      if (!vResp.ok) return null;
      const v = await vResp.json();
      return toThumb(v.portadaUrl) || null;
    } catch {
      return null;
    }
  }

  // ---------- NUEVO: render separado ----------
  async function renderPublicaciones(publicaciones) {
    if (!Array.isArray(publicaciones) || publicaciones.length === 0) {
      container.innerHTML = `<div class="alert alert-info">No hay publicaciones disponibles.</div>`;
      return;
    }

    // Traer portadas en paralelo (si tu backend no las expone ya en el DTO)
    const portadas = await Promise.all(
      publicaciones.map(async (pub) => {
        const vehiculoId = resolveVehiculoId(pub);
        if (!vehiculoId) return null;
        return await fetchPortadaVehiculo(vehiculoId);
      })
    );

    container.innerHTML = publicaciones.map((pub, i) => {
      const vehiculoId = resolveVehiculoId(pub);
      const imgSrc = portadas[i] || PLACEHOLDER;
      const pubId = pub.idPublicacion ?? pub.id ?? '';
      const monedaKey = (pub.moneda || 'PESOS').toUpperCase();
      const simbolo = SIMBOLOS[monedaKey] || '$';
      const precioStr = (typeof pub.precio === 'number')
        ? pub.precio.toLocaleString('es-AR')
        : (pub.precio ?? '—');

      return `
        <div class="col-md-4">
          <div class="card h-100 shadow-sm" style="max-width: 400px; margin:auto">
            <a href="publicacionDetalle.html?id=${pubId}">
              <img
                src="${imgSrc}"
                class="card-img-top"
                alt="Imagen del vehículo"
                onerror="this.onerror=null;this.src='${PLACEHOLDER}'"
              >
            </a>
            <div class="card-body">
              <h5 class="card-title">${pub.titulo ?? 'Publicación'}</h5>
              <p class="card-text">${pub.descripcion ?? ''}</p>
              <p class="card-text"><strong>Precio:</strong> ${simbolo} ${precioStr}</p>
              <div class="d-flex gap-2">
                <a href="publicacionDetalle.html?id=${pubId}" class="btn btn-primary btn-sm">Ver detalle</a>
                ${vehiculoId ? `<a href="vehiculoDetalle.html?id=${vehiculoId}" class="btn btn-outline-secondary btn-sm">Vehículo</a>` : ``}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // ---------- NUEVO: función para cargar y renderizar con manejo de errores ----------
  async function loadPublicaciones(url, { showLoading = true } = {}) {
    try {
      if (showLoading) {
        container.innerHTML = `<div class="text-center py-5">Cargando...</div>`;
      }
      const resp = await fetch(url, { headers: { 'Accept': 'application/json', 'Cache-Control': 'no-cache' }, cache: 'no-store' });
      if (!resp.ok) {
        const errorMsg = await resp.text();
        container.innerHTML = `<div class="alert alert-danger">${errorMsg || 'Error de servidor'}</div>`;
        return;
      }
      const data = await resp.json();
      await renderPublicaciones(data);
    } catch (e) {
      console.error(e);
      container.innerHTML = `<div class="alert alert-danger">Error al conectar con el servidor.</div>`;
    }
  }

  // ---------- NUEVO: router de búsqueda ----------
  function endpointFromQuery(q) {
    const clean = (q || '').trim();
    if (!clean) return `${URL_API}/publicaciones`;                 // default: listado
    // Para texto libre, usamos /publicaciones/buscar?q=...
    return `${URL_API}/publicaciones/buscar?q=${encodeURIComponent(clean)}`;
  }

  // Submit del form
  form?.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const q = inputQ?.value || '';
    loadPublicaciones(endpointFromQuery(q), { showLoading: true });
  });

  // Botón limpiar
  btnClear?.addEventListener('click', () => {
    inputQ.value = '';
    loadPublicaciones(`${URL_API}/publicaciones`, { showLoading: true });
  });

  // Chips de Marcas y Colores ----------
  async function drawChips() {
    try {
      const [mResp, cResp] = await Promise.all([
        fetch(`${URL_API}/publicaciones/filtros/marcas`),
        fetch(`${URL_API}/publicaciones/filtros/colores`)
      ]);
      const marcas = mResp.ok ? await mResp.json() : [];
      const colores = cResp.ok ? await cResp.json() : [];

      chipsMarcas.innerHTML = marcas.map(m =>
        `<button class="btn btn-sm btn-outline-primary" data-marca="${m}">${m}</button>`
      ).join('');

      chipsColores.innerHTML = colores.map(c =>
        `<button class="btn btn-sm btn-outline-secondary" data-color="${c}">${c}</button>`
      ).join('');

      chipsMarcas.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-marca]');
        if (!b) return;
        const marca = b.dataset.marca;
        inputQ.value = ''; // limpiar query libre para que se entienda que está filtrando por chip
        loadPublicaciones(`${URL_API}/publicaciones/marca/${encodeURIComponent(marca)}`);
      });

      chipsColores.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-color]');
        if (!b) return;
        const color = b.dataset.color;
        inputQ.value = '';
        loadPublicaciones(`${URL_API}/publicaciones/color/${encodeURIComponent(color)}`);
      });

    } catch (err) {
      console.warn('No se pudieron cargar chips de filtros', err);
    }
  }

  // ---------- Carga inicial por defecto ----------
  // Si venís con ?q= en la URL, lo respeta; si no, lista general
  const urlParams = new URLSearchParams(window.location.search);
  const initialQ = urlParams.get('q');
  if (initialQ) {
    inputQ.value = initialQ;
    await loadPublicaciones(endpointFromQuery(initialQ), { showLoading: true });
  } else {
    await loadPublicaciones(`${URL_API}/publicaciones`, { showLoading: true });
  }

  // Cargar chips (opcional)
  drawChips();

  // ------- (Tu botón agregar vehículo se mantiene igual) -------
  const btnAddEl = document.getElementById('btn-agregar-vehiculo');
  btnAddEl?.addEventListener('click', async (e) => {
    /* ... tu lógica de límite, igual que ya tenías ... */
  });

});