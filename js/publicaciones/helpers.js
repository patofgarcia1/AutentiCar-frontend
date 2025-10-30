
export const toggleIn = (arr, val) => {
  const i = arr.indexOf(val);
  if (i >= 0) arr.splice(i, 1);
  else arr.push(val);
};

export const setActive = (el, on) => {
  if (!el) return;
  el.classList.toggle('active', !!on);
};

export function refreshDropdownLabel(dropdownId, selectedArray, defaultLabel) {
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

export function refreshSelectionsUI(state) {
  const chipsMarcas  = document.getElementById('chips-marcas');
  const chipsColores = document.getElementById('chips-colores');
  const chipsAnios   = document.getElementById('chips-anios');
  const chipsPrecio  = document.getElementById('chips-precio');
  const chipsKm      = document.getElementById('chips-km');
  const chipsRol     = document.getElementById('chips-rol');
  const inputQ       = document.getElementById('search-q');

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
  chipsRol?.querySelectorAll('button[data-rol]')?.forEach(btn => {
    setActive(btn, state.roles.includes(btn.dataset.rol));
  });

  if (inputQ) inputQ.value = state.q || '';

  refreshDropdownLabel('dropdownColor', state.colores, 'Color');
  refreshDropdownLabel('dropdownAnio', state.anios.map(String), 'Año');
  refreshDropdownLabel('dropdownPrecio', state.priceIds, 'Precio');
  refreshDropdownLabel('dropdownKm', state.kmIds, 'Kilometraje');
}
