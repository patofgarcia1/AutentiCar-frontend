
import { initState } from './publicaciones/state.js';
import { drawChips, setupClearButton } from './publicaciones/filtros.js';
import { loadPublicacionesPorTaller } from './publicaciones/api.js';
import { ensureModalsAndButton } from './publicaciones/modales.js';
import { refreshSelectionsUI } from './publicaciones/helpers.js';

document.addEventListener('DOMContentLoaded', async () => {
  const state = initState();
  ensureModalsAndButton();
  await drawChips(state, loadPage);
  refreshSelectionsUI(state);
  setupClearButton(state, loadPage);

  const usuarioId = localStorage.getItem('usuarioId');
  if (!usuarioId) {
    window.location.href = 'login.html';
    return;
  }
  await loadPage();

  async function loadPage() {
    await loadPublicacionesPorTaller(usuarioId, state);
    refreshSelectionsUI(state);
  }
});
