// js/inicioConcesionario.js
import { initState } from './publicaciones/state.js';
import { drawChips, setupClearButton } from './publicaciones/filtros.js';
import { loadPublicaciones } from './publicaciones/api.js';
import { ensureModalsAndButton } from './publicaciones/modales.js';
import { refreshSelectionsUI } from './publicaciones/helpers.js';

document.addEventListener('DOMContentLoaded', async () => {
  const state = initState();
  ensureModalsAndButton();

  const reloadConcesionarioPubs = (currentState) => loadPublicaciones(currentState, { context: 'concesionario' });

  await drawChips(state, reloadConcesionarioPubs);
  refreshSelectionsUI(state);
  setupClearButton(state, reloadConcesionarioPubs);

  const usuarioId = localStorage.getItem('usuarioId');
  if (!usuarioId) {
    window.location.href = 'login.html';
    return;
  }
  await loadPage();

  async function loadPage() {
    await loadPublicaciones(state, { context: 'concesionario' });
    refreshSelectionsUI(state);
  }
});
