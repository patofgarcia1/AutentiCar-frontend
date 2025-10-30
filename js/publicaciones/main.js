import { initState } from './state.js';
import { drawChips, setupClearButton } from './filtros.js';
import { loadPublicaciones } from './api.js';
import { ensureModalsAndButton } from './modales.js';
import { refreshSelectionsUI } from './helpers.js';

document.addEventListener('DOMContentLoaded', async () => {
  const state = initState();       // inicializa estructura de filtros y query
  await drawChips(state);          // dibuja chips y listeners
  await loadPublicaciones(state);  // carga inicial
  refreshSelectionsUI(state);      // sincroniza UI
  setupClearButton(state);         // botón limpiar filtros
  ensureModalsAndButton();         // botón agregar + modales
});
