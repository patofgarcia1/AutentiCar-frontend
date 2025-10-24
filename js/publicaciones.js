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

  ensureClearButton();
  const btnClear = document.getElementById('btn-clear-filtros');

  const PLACEHOLDER = 'https://dummyimage.com/600x400/efefef/aaaaaa&text=Sin+foto';
  const SIMBOLOS = { PESOS: '$', DOLARES: 'U$D' };

  // Buckets
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

  // ===== State (multi-select) =====
  const state = {
    q: null,
    marcas:   [],   // strings
    colores:  [],   // strings
    anios:    [],   // numbers
    priceIds: [],   // ids de PRICE_BUCKETS
    kmIds:    []    // ids de KM_BUCKETS
  };

  // ===== Helpers =====
  const toggleIn = (arr, val) => {
    const i = arr.indexOf(val);
    if (i >= 0) arr.splice(i, 1); else arr.push(val);
  };
  const setActive = (el, on) => el?.classList.toggle('active', !!on);

  function refreshSelectionsUI() {
    chipsMarcas?.querySelectorAll('.brand-card')?.forEach(card => {
      setActive(card, state.marcas.includes(card.dataset.marca));
    });
    chipsColores?.querySelectorAll('button[data-color]')?.forEach(btn => {
      setActive(btn, state.colores.includes(btn.dataset.color));
    });
    chipsAnios?.querySelectorAll('button[data-anio]')?.forEach(btn => {
      setActive(btn, state.anios.includes(Number(btn.dataset.anio)));
    });
    chipsPrecio?.querySelectorAll('button[data-precio]')?.forEach(btn => {
      setActive(btn, state.priceIds.includes(btn.dataset.precio));
    });
    chipsKm?.querySelectorAll('button[data-km]')?.forEach(btn => {
      setActive(btn, state.kmIds.includes(btn.dataset.km));
    });
    if (inputQ) inputQ.value = state.q || '';

    refreshDropdownLabel('dropdownColor', state.colores, 'Color');
    refreshDropdownLabel('dropdownAnio', state.anios.map(String), 'Año');
    refreshDropdownLabel(
      'dropdownPrecio',
      state.priceIds.map(id => PRICE_BUCKETS.find(b => b.id === id)?.label || id),
      'Precio'
    );
    refreshDropdownLabel(
      'dropdownKm',
      state.kmIds.map(id => KM_BUCKETS.find(b => b.id === id)?.label || id),
      'Kilometraje'
    );
  }

  function refreshDropdownLabel(dropdownId, selectedArray, defaultLabel) {
    const btn = document.getElementById(dropdownId);
    if (!btn) return;
    if (selectedArray.length === 0) {
      btn.textContent = defaultLabel;
      btn.classList.remove('has-selection');
    } else {
      const joined = selectedArray.join(', ');
      btn.textContent = joined.length > 25 ? joined.substring(0, 25) + '…' : joined;
      btn.classList.add('has-selection');
    }
  }

  // Construye /publicaciones/filtro con parámetros repetidos
  function endpointFromState() {
    const p = new URLSearchParams();
    if (state.q) p.set('q', state.q);

    (state.marcas || []).forEach(m => p.append('marca', m));
    (state.colores || []).forEach(c => p.append('color', c));
    (state.anios   || []).forEach(a => p.append('anio', String(a)));

    // precio: por cada bucket seleccionado, agregar su par min/max
    (state.priceIds || []).forEach(id => {
      const b = PRICE_BUCKETS.find(x => x.id === id);
      if (!b) return;
      if (b.min != null) p.append('minPrecio', String(b.min));
      if (b.max != null) p.append('maxPrecio', String(b.max));
    });

    // km: igual que precio
    (state.kmIds || []).forEach(id => {
      const b = KM_BUCKETS.find(x => x.id === id);
      if (!b) return;
      if (b.min != null) p.append('minKm', String(b.min));
      if (b.max != null) p.append('maxKm', String(b.max));
    });

    const qs = p.toString();
    return qs ? `${URL_API}/publicaciones/filtro?${qs}` : `${URL_API}/publicaciones`;
  }

  // ===== Render listado =====
  const toThumb = (url) =>
    url ? url.replace('/upload/', '/upload/w_500,h_250,c_fill,f_auto,q_auto/') : null;

  const resolveVehiculoId = (pub) =>
    pub?.vehiculoId ?? pub?.vehiculo?.idVehiculo ?? pub?.idVehiculo ?? null;

  async function fetchPortadaVehiculo(vehiculoId) {
    try {
      const r = await fetch(`${URL_API}/vehiculos/${vehiculoId}`);
      if (!r.ok) return null;
      const v = await r.json();
      return toThumb(v.portadaUrl) || null;
    } catch { return null; }
  }

  async function renderPublicaciones(list) {
    if (!Array.isArray(list) || list.length === 0) {
      container.innerHTML = `<div class="alert alert-info">No hay publicaciones disponibles.</div>`;
      return;
    }
    const portadas = await Promise.all(
      list.map(async (pub) => {
        const vid = resolveVehiculoId(pub);
        return vid ? await fetchPortadaVehiculo(vid) : null;
      })
    );
    container.innerHTML = list.map((pub, i) => {
      const pubId = pub.idPublicacion ?? pub.id ?? '';
      const img   = portadas[i] || PLACEHOLDER;
      const symbol = SIMBOLOS[(pub.moneda || 'PESOS').toUpperCase()] || '$';
      const precioStr = (typeof pub.precio === 'number')
        ? pub.precio.toLocaleString('es-AR')
        : (pub.precio ?? '—');

      return `
        <div class="col">
          <div class="card card-auto h-100 border-0 shadow-sm">
            <a href="publicacionDetalle.html?id=${pubId}">
              <img src="${img}" class="card-img-top rounded-top" alt="Imagen del vehículo"
                   onerror="this.onerror=null;this.src='${PLACEHOLDER}'" />
            </a>
            <div class="card-body d-flex flex-column">
              <h5 class="card-title text-dark fw-bold">${pub.titulo ?? 'Publicación'}</h5>
              <p class="card-text text-muted small">${pub.descripcion ?? ''}</p>
              <p class="precio mt-auto mb-3">${symbol} ${precioStr}</p>
            </div>
          </div>
        </div>`;
    }).join('');
  }

  async function loadPublicaciones({ showLoading = true } = {}) {
    try {
      if (showLoading) container.innerHTML = `<div class="text-center py-5">Cargando...</div>`;
      const resp = await fetch(endpointFromState(), {
        headers: { 'Accept': 'application/json', 'Cache-Control': 'no-cache' },
        cache: 'no-store'
      });
      if (!resp.ok) {
        container.innerHTML = `<div class="alert alert-danger">${await resp.text() || 'Error de servidor'}</div>`;
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
    state.q = (inputQ?.value || '').trim() || null;
    loadPublicaciones({ showLoading: true });
    refreshSelectionsUI();
  });

  // ===== Chips =====
  async function drawChips() {
    try {
      // Marcas & Colores
      const [mResp, cResp] = await Promise.all([
        fetch(`${URL_API}/publicaciones/filtros/marcas`),
        fetch(`${URL_API}/publicaciones/filtros/colores`)
      ]);
      const marcas  = mResp.ok ? await mResp.json() : [];
      const colores = cResp.ok ? await cResp.json() : [];

      // Marcas
      if (chipsMarcas) {
        chipsMarcas.classList.add('brand-grid');
        chipsMarcas.innerHTML = marcas.map(m => {
          const safe = m.replace(/\s+/g, '').toLowerCase();
          return `
            <div class="brand-card" data-marca="${m}">
              <img src="img/${safe}.png" alt="${m}" onerror="this.src='img/default_brand.png'">
              <span>${m}</span>
            </div>`;
        }).join('');
        chipsMarcas.addEventListener('click', (e) => {
          const card = e.target.closest('.brand-card'); if (!card) return;
          toggleIn(state.marcas, card.dataset.marca);
          state.q = null; if (inputQ) inputQ.value = '';
          setActive(card, state.marcas.includes(card.dataset.marca));
          loadPublicaciones({ showLoading: true });
        });
      }

      // Colores
      if (chipsColores) {
        chipsColores.innerHTML = colores.map(c =>
          `<button class="chip chip-secondary" data-color="${c}">${c}</button>`
        ).join('');
        chipsColores.addEventListener('click', (e) => {
          const b = e.target.closest('button[data-color]'); if (!b) return;
          toggleIn(state.colores, b.dataset.color);
          state.q = null; if (inputQ) inputQ.value = '';
          setActive(b, state.colores.includes(b.dataset.color));
          loadPublicaciones({ showLoading: true });
        });
      }

      // Años
      if (chipsAnios) {
        const aResp = await fetch(`${URL_API}/publicaciones/filtros/anios`);
        const anios = aResp.ok ? await aResp.json() : [];
        chipsAnios.innerHTML = anios.map(a =>
          `<button class="chip" data-anio="${a}">${a}</button>`
        ).join('');
        chipsAnios.addEventListener('click', (e) => {
          const b = e.target.closest('button[data-anio]'); if (!b) return;
          const val = Number(b.dataset.anio);
          toggleIn(state.anios, val);
          state.q = null; if (inputQ) inputQ.value = '';
          setActive(b, state.anios.includes(val));
          loadPublicaciones({ showLoading: true });
        });
      }

      // Precio
      if (chipsPrecio) {
        chipsPrecio.innerHTML = PRICE_BUCKETS.map(b =>
          `<button class="chip chip-secondary" data-precio="${b.id}">${b.label}</button>`
        ).join('');
        chipsPrecio.addEventListener('click', (e) => {
          const b = e.target.closest('button[data-precio]'); if (!b) return;
          const id = b.dataset.precio;
          toggleIn(state.priceIds, id);
          state.q = null; if (inputQ) inputQ.value = '';
          setActive(b, state.priceIds.includes(id));
          loadPublicaciones({ showLoading: true });
        });
      }

      // Kilometraje
      if (chipsKm) {
        chipsKm.innerHTML = KM_BUCKETS.map(b =>
          `<button class="chip chip-secondary" data-km="${b.id}">${b.label}</button>`
        ).join('');
        chipsKm.addEventListener('click', (e) => {
          const b = e.target.closest('button[data-km]'); if (!b) return;
          const id = b.dataset.km;
          toggleIn(state.kmIds, id);
          state.q = null; if (inputQ) inputQ.value = '';
          setActive(b, state.kmIds.includes(id));
          loadPublicaciones({ showLoading: true });
        });
      }

      refreshSelectionsUI();
    } catch (err) {
      console.warn('No se pudieron cargar chips de filtros', err);
    }
  }

  // Limpiar filtros
  btnClear?.addEventListener('click', (ev) => {
    ev.preventDefault();
    state.q = null;
    state.marcas = [];
    state.colores = [];
    state.anios = [];
    state.priceIds = [];
    state.kmIds = [];
    if (inputQ) inputQ.value = '';

    // quitar activos
    document.querySelectorAll('.brand-card.active, .chip.active')
      .forEach(el => el.classList.remove('active'));

    loadPublicaciones({ showLoading: true });
  });

  // ===== Botón flotante (igual que antes) =====
  function ensureLimitModals() {
    if (document.getElementById('limitModal')) return;

    // Inserta ambos modales
    document.body.insertAdjacentHTML('beforeend', `
      <!-- Modal límite -->
      <div class="modal fade" id="limitModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title w-100 text-center">Límite alcanzado</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
            </div>
            <div class="modal-body text-center">
              <p>No podés realizar más publicaciones.</p>
              <p>Chequeá nuestras <a href="#" id="linkOfertas" class="link-primary">ofertas</a>.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal oferta -->
      <div class="modal fade" id="ofertasModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
            </div>
            <div class="modal-body">
              <div class="border rounded p-3 text-center">
                <h5 class="mb-1">Plan Premium Mensual</h5>
                <p class="text-muted mb-2">USD 10 por mes</p>
                <p class="mb-3">Incluye: <strong>Publicaciones ilimitadas</strong>.</p>
                <button class="btn btn-success w-100" id="btnComprarPlan">Comprar</button>
                <div id="mensajeCompra" class="mt-3 text-success fw-semibold" style="display:none;">
                  ¡Gracias! Te contactaremos pronto para completar la compra.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `);

    // ====== Eventos de las modales ======
    const limitEl = document.getElementById('limitModal');
    const ofertasEl = document.getElementById('ofertasModal');
    const btnComprar = document.getElementById('btnComprarPlan');
    const mensajeCompra = document.getElementById('mensajeCompra');
    const linkOfertas = document.getElementById('linkOfertas');

    // Link "ofertas" -> cierra la modal de límite y abre la de oferta
    linkOfertas?.addEventListener('click', (ev) => {
      ev.preventDefault();
      const m1 = bootstrap.Modal.getOrCreateInstance(limitEl);
      const m2 = bootstrap.Modal.getOrCreateInstance(ofertasEl, { backdrop: 'static' });
      m1.hide();
      setTimeout(() => m2.show(), 200);
    });

    // Botón comprar plan
    btnComprar?.addEventListener('click', async () => {
      try {
        const token = localStorage.getItem("token");
        const usuarioId = localStorage.getItem("usuarioId");
        const resp = await fetch(`${URL_API}/usuarios/${usuarioId}/oferta/toggle`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!resp.ok) {
          const err = await resp.text();
          alert('Error: ' + err);
          return;
        }

        const data = await resp.json(); 
        if (data?.quiereOferta === true) {
          btnComprar.disabled = true;
          mensajeCompra.style.display = 'block';
        } else {
          alert('La suscripción fue cancelada.');
        }
      } catch (err) {
        console.error('Error:', err);
        alert('Error al enviar la solicitud.');
      }
    });
  }

  const btnAdd = document.getElementById('btn-agregar-vehiculo');
  showIf(btnAdd, isAdmin() || isUser());
  ensureLimitModals();
  btnAdd?.addEventListener('click', async (e) => {
    e.preventDefault();
    const usuarioId = localStorage.getItem('usuarioId');
    if (!usuarioId) { window.location.href = 'login.html'; return; }
    try {
      const r = await fetch(`${URL_API}/usuarios/${usuarioId}/publicaciones/count`,
        { headers: { 'Accept':'application/json','Cache-Control':'no-cache' }, cache:'no-store' });

      if (!r.ok) { window.location.href = 'addVehiculo.html'; return; }
      const data = await r.json();
      const count = Number(data?.count), limit = Number(data?.limit ?? 5);
      const reached = (typeof data?.reached === 'boolean') ? data.reached : (count >= limit);
      if (Number.isNaN(count)) { window.location.href = 'addVehiculo.html'; return; }
      if (reached) bootstrap.Modal.getOrCreateInstance(document.getElementById('limitModal'),{backdrop:'static'}).show();
      else window.location.href = 'addVehiculo.html';
    } catch { window.location.href = 'addVehiculo.html'; }
  });

  // Inicial
  const urlParams = new URLSearchParams(window.location.search);
  const initialQ = urlParams.get('q');
  if (initialQ) state.q = initialQ.trim();
  await drawChips();
  refreshSelectionsUI();
  await loadPublicaciones({ showLoading: true });

  // Utils
  function ensureClearButton() {
    if (!document.getElementById('btn-clear-filtros')) {
      const btn = document.createElement('button');
      btn.id = 'btn-clear-filtros';
      btn.type = 'button';
      btn.className = 'btn btn-sm btn-outline-secondary mt-3';
      btn.textContent = 'Limpiar filtros';
      (document.querySelector('.search-section') || form)?.appendChild(btn);
    }
  }
});
