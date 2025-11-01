
import { renderTalleresAsignados } from './listarTalleres.js';

export function initModalTalleresAsignados() {
  if (document.getElementById('modalTalleresAsignados')) return;

  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal fade" id="modalTalleresAsignados" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-body">
            <div id="contenedor-talleres-asignados" class="pt-1"></div>
          </div>
          <div class="modal-footer border-0 d-flex justify-content-end">
            <button type="button" id="btn-agregar-taller" class="btn btn-outline-primary">
              Agregar taller
            </button>
          </div>
        </div>
      </div>
    </div>
  `);


    const btnAgregar = document.getElementById('btn-agregar-taller');
    btnAgregar.addEventListener('click', async () => {
      const { abrirBuscarTaller } = await import('../components/agregarTaller.js');
      const usuarioId = Number(localStorage.getItem('usuarioId'));
      const token = localStorage.getItem('token');

      const modalEl = document.getElementById('modalTalleresAsignados');
      const modalInstance = bootstrap.Modal.getInstance(modalEl);
      modalInstance?.hide();

      setTimeout(() => {
        abrirBuscarTaller?.(usuarioId, token);
      }, 300);
    });

}

export async function abrirModalTalleresAsignados() {
  const usuarioId = Number(localStorage.getItem('usuarioId'));
  const token = localStorage.getItem('token');
  if (!usuarioId || !token) {
    window.location.href = 'login.html';
    return;
  }

  initModalTalleresAsignados();

  const modalEl = document.getElementById('modalTalleresAsignados');
  const contenedor = document.getElementById('contenedor-talleres-asignados');
  contenedor.innerHTML = '';

  await renderTalleresAsignados(usuarioId, token, contenedor);

  const onAgregado = async () => {
    contenedor.innerHTML = '';
    await renderTalleresAsignados(usuarioId, token, contenedor);
  };

  window.removeEventListener('taller:agregado', onAgregado);
  window.addEventListener('taller:agregado', onAgregado, { once: true });

  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
  modal.show();
}
