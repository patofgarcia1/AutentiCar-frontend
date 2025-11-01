import { initState } from './state.js';
import { drawChips, setupClearButton } from './filtros.js';
import { loadPublicaciones } from './api.js';
import { ensureModalsAndButton } from './modales.js';
import { refreshSelectionsUI } from './helpers.js';

document.addEventListener('DOMContentLoaded', async () => {
  const state = initState();       

  const reloadGeneralPubs = (currentState) => loadPublicaciones(currentState, { context: 'general' });

  await drawChips(state, reloadGeneralPubs);        
  await reloadGeneralPubs(state);  
  refreshSelectionsUI(state);     
  setupClearButton(state, reloadGeneralPubs);       
  ensureModalsAndButton();        
});
