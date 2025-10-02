import { URL_API } from '../constants/database.js';

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const docId = params.get('id');

  const msg = document.getElementById('msg');
  const summary = document.getElementById('summary');
  const pagesEl = document.getElementById('pages');
  const charsEl = document.getElementById('chars');
  const timeEl  = document.getElementById('time');
  const flagsEl = document.getElementById('flags');
  const reasonsEl = document.getElementById('reasons');

  if (!docId) {
    msg.innerHTML = `<div class="alert alert-danger">Falta ?id</div>`;
    return;
  }

  try {
    const resp = await fetch(`${URL_API}/documentos/${docId}/analisisIA`);
    if (!resp.ok) {
      const txt = await resp.text();
      msg.innerHTML = `<div class="alert alert-danger">${txt}</div>`;
      return;
    }
    const data = await resp.json();

    const score = typeof data.risk_score === 'number' ? data.risk_score.toFixed(2) : '-';
    const labelRaw = (data.risk_label || '').toUpperCase();
    const labelClass = labelRaw === 'LOW' ? 'risk-low' :
        labelRaw === 'MEDIUM' ? 'risk-medium' : 'risk-high';

    summary.innerHTML = `
        <div class="card">
            <div class="card-body d-flex flex-wrap align-items-center gap-3">
            <div class="d-flex align-items-baseline gap-3">
                <div class="display-5 m-0">${score}</div>
                <span class="risk-badge ${labelClass}">${labelRaw || '-'}</span>
            </div>
            </div>
        </div>
        `;

    // Debug OCR
    const o = data.debug?.ocr_stats || {};
    pagesEl.textContent = o.pages ?? '-';
    charsEl.textContent = o.total_chars ?? '-';
    timeEl.textContent  = (o.time_ms != null ? `${o.time_ms} ms` : '-');
    // Nota: o.time_ms es el tiempo de OCR (render PDF + Tesseract).
    // El análisis total puede tardar un poco más por metadatos, features y reglas.

    // Flags del text_summary
    const t = data.debug?.text_summary || {};
    const flag = (label, val) => `
        <li class="list-group-item flag-item">
            <span>${label}</span>
            <span class="badge ${val ? 'text-bg-success' : 'text-bg-secondary'}">${val ? 'Sí' : 'No'}</span>
        </li>
    `;
    flagsEl.innerHTML = [
        flag('Fecha encontrada', t.has_date),
        flag('Patente encontrada', t.has_patente),
        flag('VIN encontrado', t.has_vin),
        flag('CUIT encontrado', t.has_cuit),
        flag('Vigencia encontrada', t.has_vencimiento),
        flag('Entidad emisora encontrada', t.has_entidad_emisora)
    ].join('');

    // Metadatos (metadata_summary)
    const m = data.debug?.metadata_summary || {};
    const metaRow = (k, v) => `
        <tr><th class="fw-normal text-muted" style="width:180px">${k}</th>
            <td>${(v === null || v === undefined || v === '') ? '—' : v}</td></tr>`;
    document.getElementById('metadata').innerHTML = `
        <div class="card">
            <div class="card-body p-0">
            <div class="table-responsive">
                <table class="table table-sm mb-0">
                <tbody>
                    ${metaRow('Producer', m.Producer)}
                    ${metaRow('Creator', m.Creator)}
                    ${metaRow('ModifyDate', m.ModifyDate)}
                    ${metaRow('CreateDate', m.CreateDate)}
                </tbody>
                </table>
            </div>
            </div>
        </div>
    `;

    // Reasons
    const reasons = data.reasons || [];
    reasonsEl.innerHTML = reasons.length
        ? reasons.map(r => `
            <li class="list-group-item d-flex justify-content-between">
                <div>
                <div class="fw-semibold">${r.msg || 'msg'}</div>
                
                </div>
                <span class="badge text-bg-info">${(r.weight ?? '')}</span>
            </li>
            `).join('')
        : `<li class="list-group-item text-muted">Sin razones.</li>`;

  } catch (e) {
    console.error(e);
    msg.innerHTML = `<div class="alert alert-danger">No se pudo cargar el análisis.</div>`;
  }
  
});
