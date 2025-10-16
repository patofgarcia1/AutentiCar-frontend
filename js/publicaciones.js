import { URL_API } from '../constants/database.js';
import { isAdmin, isUser, showIf } from './roles.js';

document.addEventListener('DOMContentLoaded', async () => {
  const container    = document.getElementById('lista-publicaciones');
  const inputQ       = document.getElementById('search-q');
  const form         = document.getElementById('search-form');

  const chipsMarcas  = document.getElementById('chips-marcas');
  const chipsColores = document.getElementById('chips-colores');
  const chipsAnios   = document.getElementById('chips-anios');
  const chipsPrecio  = document.getElementById('chips-precio');
  const chipsKm      = document.getElementById('chips-km');

  // (Se inyecta el botón si no está en el HTML)
  ensureClearButton();

  const btnClear     = document.getElementById('btn-clear-filtros');

  const PLACEHOLDER = 'https://dummyimage.com/600x400/efefef/aaaaaa&text=Sin+foto';
  const SIMBOLOS = { PESOS: '$', DOLARES: 'U$D' };

  // Buckets locales (ARS y KM)
  const PRICE_BUCKETS = [
    { id: 'hasta-15', label: 'Hasta 15 M', min: null,      max: 15000000 },
    { id: '15-35',    label: '15 a 35 M', min: 15000000,   max: 35000000 },
    { id: '35-55',    label: '35 a 55 M', min: 35000000,   max: 55000000 },
    { id: 'mas-55',   label: 'Más de 55 M', min: 55000000, max: null }
  ];

  const KM_BUCKETS = [
    { id: 'hasta-25', label: '≤ 25.000 km', min: null,   max: 25000 },
    { id: '25-50',    label: '25-50 mil',   min: 25000,  max: 50000 },
    { id: '50-80',    label: '50-80 mil',   min: 50000,  max: 80000 },
    { id: '80-100',   label: '80-100 mil',  min: 80000,  max: 100000 },
    { id: 'mas-100',  label: '≥ 100.000',   min: 100000, max: null }
  ];

  // ===== Estado global de filtros =====
  const state = {
    q: null,
    marca: null,
    color: null,
    anio: null,
    minPrecio: null,
    maxPrecio: null,
    minKm: null,
    maxKm: null,
    // auxiliares para "toggle" de bucket seleccionado
    _precioId: null,
    _kmId: null
  };

  // ===== Helpers visuales =====
  function setActive(el, active) {
    if (!el) return;
    el.classList.toggle('active', !!active);
  }

  function clearAllActive(containerEl, selector) {
    if (!containerEl) return;
    containerEl.querySelectorAll(selector).forEach(el => el.classList.remove('active'));
  }

  // Reflejar el estado en UI (marca/color/año/precio/km)
  function refreshSelectionsUI() {
    // Marca (brand-card)
    if (chipsMarcas) {
      chipsMarcas.querySelectorAll('.brand-card').forEach(card => {
        const val = card.dataset.marca;
        setActive(card, state.marca === val);
      });
    }

    // Color (button[data-color])
    if (chipsColores) {
      chipsColores.querySelectorAll('button[data-color]').forEach(btn => {
        const val = btn.dataset.color;
        setActive(btn, state.color === val);
      });
    }

    // Año
    if (chipsAnios) {
      chipsAnios.querySelectorAll('button[data-anio]').forEach(btn => {
        const val = Number(btn.dataset.anio);
        setActive(btn, state.anio === val);
      });
    }

    // Precio
    if (chipsPrecio) {
      chipsPrecio.querySelectorAll('button[data-precio]').forEach(btn => {
        const id = btn.dataset.precio;
        setActive(btn, state._precioId === id);
      });
    }

    // Kilometraje
    if (chipsKm) {
      chipsKm.querySelectorAll('button[data-km]').forEach(btn => {
        const id = btn.dataset.km;
        setActive(btn, state._kmId === id);
      });
    }

    // Buscar (input)
    if (inputQ) inputQ.value = state.q || '';
  }

  // ===== URL builder para /publicaciones/filtro =====
  function endpointFromState() {
    const params = new URLSearchParams();
    if (state.q) params.set('q', state.q);
    if (state.marca) params.set('marca', state.marca);
    if (state.color) params.set('color', state.color);
    if (state.anio != null) params.set('anio', String(state.anio));
    if (state.minPrecio != null) params.set('minPrecio', String(state.minPrecio));
    if (state.maxPrecio != null) params.set('maxPrecio', String(state.maxPrecio));
    if (state.minKm != null) params.set('minKm', String(state.minKm));
    if (state.maxKm != null) params.set('maxKm', String(state.maxKm));

    const qs = params.toString();
    return qs
      ? `${URL_API}/publicaciones/filtro?${qs}`
      : `${URL_API}/publicaciones`;
  }

  // ===== Carga/render =====
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

  async function renderPublicaciones(publicaciones) {
    if (!Array.isArray(publicaciones) || publicaciones.length === 0) {
      container.innerHTML = `<div class="alert alert-info">No hay publicaciones disponibles.</div>`;
      return;
    }

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
        <div class="col">
          <div class="card card-auto h-100 border-0 shadow-sm">
            <a href="publicacionDetalle.html?id=${pubId}">
              <img src="${imgSrc}" class="card-img-top rounded-top" alt="Imagen del vehículo"
                onerror="this.onerror=null;this.src='${PLACEHOLDER}'" />
            </a>
            <div class="card-body d-flex flex-column">
              <h5 class="card-title text-dark fw-bold">${pub.titulo ?? 'Publicación'}</h5>
              <p class="card-text text-muted small">${pub.descripcion ?? ''}</p>
              <p class="precio mt-auto mb-3">${simbolo} ${precioStr}</p>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  async function loadPublicaciones({ showLoading = true } = {}) {
    try {
      if (showLoading) container.innerHTML = `<div class="text-center py-5">Cargando...</div>`;
      const url = endpointFromState();
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

  // ===== Buscador =====
  form?.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const clean = (inputQ?.value || '').trim();
    state.q = clean || null;
    loadPublicaciones({ showLoading: true });
    refreshSelectionsUI();
  });

  // ===== Chips (carga y listeners) =====
  async function drawChips() {
    try {
      // Marcas & Colores
      const [mResp, cResp] = await Promise.all([
        fetch(`${URL_API}/publicaciones/filtros/marcas`),
        fetch(`${URL_API}/publicaciones/filtros/colores`)
      ]);
      const marcas  = mResp.ok ? await mResp.json() : [];
      const colores = cResp.ok ? await cResp.json() : [];

      // Marcas como brand-cards
      if (chipsMarcas) {
        chipsMarcas.classList.add('brand-grid');
        chipsMarcas.innerHTML = marcas.map(m => {
          const safeName = m.replace(/\s+/g, '').toLowerCase();
          const imgSrc = `img/${safeName}.png`;
          return `
            <div class="brand-card" data-marca="${m}">
              <img src="${imgSrc}" alt="${m}" onerror="this.src='img/default_brand.png'">
              <span>${m}</span>
            </div>
          `;
        }).join('');
        chipsMarcas.addEventListener('click', (e) => {
          const card = e.target.closest('.brand-card');
          if (!card) return;
          const val = card.dataset.marca;
          const selected = (state.marca === val) ? null : val;
          state.marca = selected;
          state.q = null; if (inputQ) inputQ.value = '';
          // feedback instantáneo:
          chipsMarcas.querySelectorAll('.brand-card').forEach(c => c.classList.remove('active'));
          if (selected) card.classList.add('active');

          loadPublicaciones({ showLoading: true });
        });
      }

      // Colores como chips
      if (chipsColores) {
        chipsColores.innerHTML = colores.map(c =>
          `<button class="chip chip-secondary" data-color="${c}">${c}</button>`
        ).join('');
        chipsColores.addEventListener('click', (e) => {
          const b = e.target.closest('button[data-color]');
          if (!b) return;
          const val = b.dataset.color;
          const selected = (state.color === val) ? null : val;
          state.color = selected;
          state.q = null; if (inputQ) inputQ.value = '';
          // feedback instantáneo:
          chipsColores.querySelectorAll('button[data-color]').forEach(x => x.classList.remove('active'));
          if (selected) b.classList.add('active');

          loadPublicaciones({ showLoading: true });
        });
      }

      // Años
      if (chipsAnios) {
        const aResp = await fetch(`${URL_API}/publicaciones/filtros/anios`);
        const anios = aResp.ok ? await aResp.json() : [];
        const aniosShown = anios; // o .slice(0,12)
        chipsAnios.innerHTML = aniosShown.map(a =>
          `<button class="chip" data-anio="${a}">${a}</button>`
        ).join('');
        chipsAnios.addEventListener('click', (e) => {
          const b = e.target.closest('button[data-anio]');
          if (!b) return;
          const val = Number(b.dataset.anio);
          const selected = (state.anio === val) ? null : val;
          state.anio = selected;
          state.q = null; if (inputQ) inputQ.value = '';
          // feedback instantáneo:
          chipsAnios.querySelectorAll('button[data-anio]').forEach(x => x.classList.remove('active'));
          if (selected != null) b.classList.add('active');

          loadPublicaciones({ showLoading: true });
        });
      }

      // Precio (buckets locales)
      if (chipsPrecio) {
        chipsPrecio.innerHTML = PRICE_BUCKETS
          .map(b => `<button class="chip chip-secondary" data-precio="${b.id}">${b.label}</button>`)
          .join('');

        chipsPrecio.addEventListener('click', (e) => {
          const b = e.target.closest('button[data-precio]');
          if (!b) return;
          const id = b.dataset.precio;
          const bucket = PRICE_BUCKETS.find(x => x.id === id);
          const isSame = (state._precioId === id);
          if (isSame) {
            state._precioId = null; state.minPrecio = null; state.maxPrecio = null;
          } else {
            state._precioId = id; state.minPrecio = bucket.min ?? null; state.maxPrecio = bucket.max ?? null;
          }
          state.q = null; if (inputQ) inputQ.value = '';
          // feedback instantáneo:
          chipsPrecio.querySelectorAll('button[data-precio]').forEach(x => x.classList.remove('active'));
          if (!isSame) b.classList.add('active');

          loadPublicaciones({ showLoading: true });
        });
      }

      // Kilometraje (buckets locales)
      if (chipsKm) {
        chipsKm.innerHTML = KM_BUCKETS.map(b =>
          `<button class="chip chip-secondary" data-km="${b.id}">${b.label}</button>`
        ).join('');
        chipsKm.addEventListener('click', (e) => {
          const b = e.target.closest('button[data-km]');
          if (!b) return;
          const id = b.dataset.km;
          const bucket = KM_BUCKETS.find(x => x.id === id);
          const isSame = (state._kmId === id);
          if (isSame) {
            state._kmId = null; state.minKm = null; state.maxKm = null;
          } else {
            state._kmId = id; state.minKm = bucket.min ?? null; state.maxKm = bucket.max ?? null;
          }
          state.q = null; if (inputQ) inputQ.value = '';
          // feedback instantáneo:
          chipsKm.querySelectorAll('button[data-km]').forEach(x => x.classList.remove('active'));
          if (!isSame) b.classList.add('active');

          loadPublicaciones({ showLoading: true });
        });
      }

      // Sincronizar UI con el estado actual
      refreshSelectionsUI();

    } catch (err) {
      console.warn('No se pudieron cargar chips de filtros', err);
    }
  }

  // ===== Botón “Limpiar filtros” =====
  btnClear?.addEventListener('click', (ev) => {
    ev.preventDefault();
    // reset state
    state.q = null;
    state.marca = null;
    state.color = null;
    state.anio = null;
    state.minPrecio = null; state.maxPrecio = null; state._precioId = null;
    state.minKm = null;     state.maxKm = null;     state._kmId = null;

    if (inputQ) inputQ.value = '';
    // limpiar clases activas
    clearAllActive(chipsMarcas , '.brand-card');
    clearAllActive(chipsColores, 'button[data-color]');
    clearAllActive(chipsAnios  , 'button[data-anio]');
    clearAllActive(chipsPrecio , 'button[data-precio]');
    clearAllActive(chipsKm     , 'button[data-km]');

    loadPublicaciones({ showLoading: true });
  });

  // ===== Botón flotante "agregar vehículo" (tu lógica original) =====
  function ensureLimitModals() {
    if (!document.getElementById('limitModal')) {
      document.body.insertAdjacentHTML('beforeend', `
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

      document.getElementById('linkOfertas')?.addEventListener('click', (ev) => {
        ev.preventDefault();
        const m1 = bootstrap.Modal.getOrCreateInstance(document.getElementById('limitModal'));
        const m2 = bootstrap.Modal.getOrCreateInstance(document.getElementById('ofertasModal'), { backdrop: 'static' });
        m1.hide();
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
        window.location.href = 'addVehiculo.html';
        return;
      }

      if (reached) {
        const modalEl = document.getElementById('limitModal');
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl, { backdrop: 'static' });
        modal.show();
      } else {
        window.location.href = 'addVehiculo.html';
      }
    } catch (err) {
      console.warn('Error al contar publicaciones:', err);
      window.location.href = 'addVehiculo.html';
    }
  });

  // ===== Carga inicial =====
  const urlParams = new URLSearchParams(window.location.search);
  const initialQ = urlParams.get('q');
  if (initialQ) state.q = initialQ.trim();

  await drawChips();
  refreshSelectionsUI();
  await loadPublicaciones({ showLoading: true });

  // ===== Utils =====
  function ensureClearButton() {
    // intenta ubicar un contenedor razonable
    // – si tenés una sección con clase .search-section, lo inyecta ahí
    const searchSection = document.querySelector('.search-section');
    if (!document.getElementById('btn-clear-filtros')) {
      const btn = document.createElement('button');
      btn.id = 'btn-clear-filtros';
      btn.type = 'button';
      btn.className = 'btn btn-sm btn-outline-secondary mt-3';
      btn.textContent = 'Limpiar filtros';
      // si hay sección, lo ponemos ahí; sino, antes del grid
      if (searchSection) {
        searchSection.appendChild(btn);
      } else {
        form?.insertAdjacentElement('afterend', btn);
      }
    }
  }
});
