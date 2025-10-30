
import { URL_API } from '../../constants/database.js';
import { toggleIn, setActive, refreshSelectionsUI } from './helpers.js';
import { loadPublicaciones } from './api.js';

const PRICE_BUCKETS = [
  { id: 'hasta-15', label: 'Hasta 15 M', min: null, max: 15000000 },
  { id: '15-35', label: '15 a 35 M', min: 15000000, max: 35000000 },
  { id: '35-55', label: '35 a 55 M', min: 35000000, max: 55000000 },
  { id: 'mas-55', label: 'Más de 55 M', min: 55000000, max: null }
];

const KM_BUCKETS = [
  { id: 'hasta-25', label: '≤ 25.000 km', min: null, max: 25000 },
  { id: '25-50', label: '25-50 mil', min: 25000, max: 50000 },
  { id: '50-80', label: '50-80 mil', min: 50000, max: 80000 },
  { id: '80-100', label: '80-100 mil', min: 80000, max: 100000 },
  { id: 'mas-100', label: '≥ 100.000', min: 100000, max: null }
];

export async function drawChips(state) {
  const chipsMarcas  = document.getElementById('chips-marcas');
  const chipsColores = document.getElementById('chips-colores');
  const chipsAnios   = document.getElementById('chips-anios');
  const chipsPrecio  = document.getElementById('chips-precio');
  const chipsKm      = document.getElementById('chips-km');
  const chipsRol     = document.getElementById('chips-rol');
  const inputQ       = document.getElementById('search-q');

  try {
    const [mResp, cResp, aResp] = await Promise.all([
      fetch(`${URL_API}/publicaciones/filtros/marcas`),
      fetch(`${URL_API}/publicaciones/filtros/colores`),
      fetch(`${URL_API}/publicaciones/filtros/anios`)
    ]);
    const marcas  = mResp.ok ? await mResp.json() : [];
    const colores = cResp.ok ? await cResp.json() : [];
    const anios   = aResp.ok ? await aResp.json() : [];

    // === Marcas ===
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
        loadPublicaciones(state);
      });
    }

    // === Colores ===
    if (chipsColores) {
      chipsColores.innerHTML = colores.map(c =>
        `<button class="chip chip-secondary" data-color="${c}">${c}</button>`
      ).join('');
      chipsColores.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-color]'); if (!b) return;
        toggleIn(state.colores, b.dataset.color);
        state.q = null; if (inputQ) inputQ.value = '';
        setActive(b, state.colores.includes(b.dataset.color));
        loadPublicaciones(state);
      });
    }

    // === Años ===
    if (chipsAnios) {
      chipsAnios.innerHTML = anios.map(a =>
        `<button class="chip" data-anio="${a}">${a}</button>`
      ).join('');
      chipsAnios.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-anio]'); if (!b) return;
        const val = Number(b.dataset.anio);
        toggleIn(state.anios, val);
        state.q = null; if (inputQ) inputQ.value = '';
        setActive(b, state.anios.includes(val));
        loadPublicaciones(state);
      });
    }

    // === Precio ===
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
        loadPublicaciones(state);
      });
    }

    // === Kilometraje ===
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
        loadPublicaciones(state);
      });
    }

    // === Rol ===
    if (chipsRol) {
      chipsRol.innerHTML = `
        <button class="chip chip-secondary" data-rol="CONCESIONARIO">Concesionarios</button>
        <button class="chip chip-secondary" data-rol="PARTICULAR">Particulares</button>`;
      chipsRol.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-rol]'); if (!b) return;
        const val = b.dataset.rol;
        toggleIn(state.roles, val);
        state.q = null; if (inputQ) inputQ.value = '';
        setActive(b, state.roles.includes(val));
        loadPublicaciones(state);
      });
    }

    refreshSelectionsUI(state);
  } catch (err) {
    console.warn('Error al cargar filtros', err);
  }
}

export function setupClearButton(state) {
  const btnClear = document.getElementById('btn-clear-filtros');
  btnClear?.addEventListener('click', (e) => {
    e.preventDefault();
    Object.assign(state, { q: null, marcas: [], colores: [], anios: [], priceIds: [], kmIds: [], roles: [] });
    document.querySelectorAll('.brand-card.active, .chip.active').forEach(el => el.classList.remove('active'));
    const inputQ = document.getElementById('search-q');
    if (inputQ) inputQ.value = '';
    loadPublicaciones(state);
  });
}
