
import { URL_API } from '../../constants/database.js';
import { isAdmin, isUser, showIf } from '../roles.js';

export function ensureModalsAndButton() {
  const btnAdd = document.getElementById('btn-agregar-vehiculo');
  showIf(btnAdd, isAdmin() || isUser());
  ensureLimitModals();
  setupAddVehicle(btnAdd);
}

function ensureLimitModals() {
  if (document.getElementById('limitModal')) return;

  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal fade" id="limitModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title w-100 text-center">Límite alcanzado</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body text-center">
            <p>No podés realizar más publicaciones.</p>
            <p>Chequeá nuestras <a href="#" id="linkOfertas" class="link-primary">ofertas</a>.</p>
          </div>
        </div>
      </div>
    </div>

    <div class="modal fade" id="ofertasModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body text-center">
            <div class="border rounded p-3">
              <h5 class="mb-1">Plan Premium Mensual</h5>
              <p class="text-muted mb-2">USD 10 por mes</p>
              <p class="mb-3">Incluye: <strong>Publicaciones ilimitadas</strong>.</p>
              <button class="btn btn-success w-100" id="btnComprarPlan">Comprar</button>
              <div id="mensajeCompra" class="mt-3 text-success fw-semibold d-none">
                ¡Gracias! Te contactaremos pronto.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `);

  const limitEl = document.getElementById('limitModal');
  const ofertasEl = document.getElementById('ofertasModal');
  const btnComprar = document.getElementById('btnComprarPlan');
  const linkOfertas = document.getElementById('linkOfertas');
  const mensajeCompra = document.getElementById('mensajeCompra');

  linkOfertas?.addEventListener('click', (e) => {
    e.preventDefault();
    const m1 = bootstrap.Modal.getOrCreateInstance(limitEl);
    const m2 = bootstrap.Modal.getOrCreateInstance(ofertasEl, { backdrop: 'static' });
    m1.hide();
    setTimeout(() => m2.show(), 200);
  });

  btnComprar?.addEventListener('click', async () => {
    try {
      const token = localStorage.getItem("token");
      const usuarioId = localStorage.getItem("usuarioId");
      const resp = await fetch(`${URL_API}/usuarios/${usuarioId}/oferta/toggle`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      if (!resp.ok) throw new Error(await resp.text());
      const data = await resp.json();
      if (data?.quiereOferta) {
        btnComprar.disabled = true;
        mensajeCompra.classList.remove('d-none');
      }
    } catch (err) {
      alert('Error al procesar la solicitud: ' + err.message);
    }
  });
}

function setupAddVehicle(btnAdd) {
  btnAdd?.addEventListener('click', async (e) => {
    e.preventDefault();
    const usuarioId = localStorage.getItem('usuarioId');
    const token = localStorage.getItem('token');
    if (!usuarioId) return (window.location.href = 'login.html');

    try {
      const countResp = await fetch(`${URL_API}/usuarios/${usuarioId}/publicaciones/count`, {
        headers: { 'Accept': 'application/json', 'Cache-Control': 'no-cache' }, cache: 'no-store'
      });

      const data = countResp.ok ? await countResp.json() : {};
      const count = Number(data?.count);
      const limit = Number(data?.limit ?? 5);
      const reached = data?.reached ?? count >= limit;

      const userResp = await fetch(`${URL_API}/usuarios/${usuarioId}`, {
        headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` }
      });
      const usuario = userResp.ok ? await userResp.json() : null;

      if (reached && !usuario?.quiereOferta) {
        const modal = document.getElementById('limitModal');
        bootstrap.Modal.getOrCreateInstance(modal, { backdrop: 'static' }).show();
      } else {
        window.location.href = 'addVehiculo.html';
      }
    } catch {
      window.location.href = 'addVehiculo.html';
    }
  });
}
