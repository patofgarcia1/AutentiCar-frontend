import { URL_API } from '../../constants/database.js';

const RECOMENDADOS = [
  { tipo: 'VTV',     label: 'VTV vigente' },
  { tipo: 'INFORME', label: 'Informe de dominio' },
  { tipo: 'TITULO',  label: 'Título de propiedad' },
  { tipo: 'SEGURO',  label: 'Seguro vigente' },
  { tipo: 'SERVICE', label: 'Comprobante / informe de último service' },
];


export async function initDocumentosRecomendados(vehiculoId) {
  const resumenEl = document.getElementById('doc-recomendados-resumen');
  if (!resumenEl || !vehiculoId) return;

  const token = localStorage.getItem('token') || null;
  const headers = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  try {
    const resp = await fetch(`${URL_API}/vehiculos/${vehiculoId}/documentos`, { headers });
    if (!resp.ok) {
      resumenEl.textContent = 'No se pudo obtener el estado de los documentos recomendados.';
      return;
    }

    const docs = await resp.json();
    const tiposPresentes = new Set(
      (docs || [])
        .map(d => (d.tipoDoc || '').toString().toUpperCase())
    );

    const total = RECOMENDADOS.length;
    const cargados = RECOMENDADOS.filter(r => tiposPresentes.has(r.tipo)).length;

    resumenEl.innerHTML = `
      <span class="fw-semibold">${cargados} de ${total}</span> documentos recomendados cargados.
      <button type="button" class="btn btn-link p-0 align-baseline" id="btn-docs-recomendados">
        Ver documentos recomendados
      </button>
    `;

    createDocsRecomendadosModal({ vehiculoId, tiposPresentes });

  } catch (e) {
    console.error('Error al cargar documentos recomendados:', e);
    resumenEl.textContent = 'No se pudo obtener el estado de los documentos recomendados.';
  }
}

function createDocsRecomendadosModal({ vehiculoId, tiposPresentes }) {
  if (document.getElementById('modalDocsRecomendados')) return;

  const modal = document.createElement('div');
  modal.id = 'modalDocsRecomendados';
  modal.className = 'modal fade';
  modal.tabIndex = -1;
  modal.setAttribute('aria-hidden', 'true');

  const itemsHTML = RECOMENDADOS.map(rec => {
    const presente = tiposPresentes.has(rec.tipo);
    const badgeClass = presente ? 'bg-success' : 'bg-danger';
    const text = presente ? 'Cargado' : 'No cargado';

    return `
      <li class="list-group-item d-flex justify-content-between align-items-center">
        <span>${rec.label}</span>
        <span class="badge ${badgeClass}">${text}</span>
      </li>
    `;
  }).join('');

  modal.innerHTML = `
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Documentos recomendados</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
        </div>
        <div class="modal-body">
          <p class="small text-muted">
            Se recomienda que el historial del vehículo cuente, como mínimo, con los siguientes documentos:
          </p>
          <ul class="list-group mb-3">
            ${itemsHTML}
          </ul>
          <p class="small text-muted mb-2">
            Podés agregar nuevos eventos y adjuntar documentación desde la pantalla de eventos del vehículo.
          </p>
          <a href="eventosVehiculo.html?id=${vehiculoId}" class="btn btn-primary w-100">
            Agregar evento
          </a>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Listener para el botón/link "Ver documentos recomendados"
  const btn = document.getElementById('btn-docs-recomendados');
  if (btn) {
    btn.addEventListener('click', () => {
      const bsModal = new bootstrap.Modal(modal);
      bsModal.show();
    });
  }
}
