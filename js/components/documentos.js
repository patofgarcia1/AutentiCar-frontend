// js/components/documentos.js
import { URL_API } from '../../constants/database.js';

export function initDocumentos({
  root,
  vehiculoId,
  allowDelete = true,
  titulo = 'Documentos',
}) {
  if (!root) throw new Error('root es requerido');
  if (!vehiculoId) throw new Error('vehiculoId es requerido');

  root.innerHTML = `
    <div class="row g-3" id="docsGrid"></div>
    <div class="text-muted small mt-2" id="docsEstado"></div>
    <style>
      .doc-card { position: relative; border: 1px solid #eee; border-radius: .5rem; overflow: hidden; }
      .doc-thumb { width: 100%; height: 180px; object-fit: cover; background: #f7f7f7; }
      .doc-body { padding: .5rem .75rem; }
      .doc-del  { position:absolute; top:8px; right:8px; background: rgba(0,0,0,.55); color:#fff; border:none; border-radius:6px; padding:4px 8px; cursor:pointer; }
    </style>
  `;

  const grid = root.querySelector('#docsGrid');
  const estado = root.querySelector('#docsEstado');

  async function fetchDocs() {
    const res = await fetch(`${URL_API}/vehiculos/${vehiculoId}/documentos`);
    if (!res.ok) return [];
    return res.json();
  }

  async function deleteDoc(id) {
    const res = await fetch(`${URL_API}/vehiculos/documentos/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(await res.text());
  }

  function cloudThumb(url, mime) {
  if (mime && mime.startsWith('image/')) {
    // thumbnail de imágenes
    return url.replace('/upload/', '/upload/w_400,h_300,c_fill,f_auto,q_auto/');
  }
  if (mime === 'application/pdf') {
    // miniatura de la página 1 del PDF
    return url.replace('/upload/', '/upload/pg_1,w_400,h_300,c_fill,f_auto,q_auto/');
  }
  // otros tipos (raw) → sin preview
  return null;
    }

  function render(docs) {
    grid.innerHTML = '';
    if (!docs.length) {
      grid.innerHTML = `<div class="text-muted">Aún no hay documentos.</div>`;
      estado.textContent = `0 documentos`;
      return;
    }
    docs.forEach(d => {
      const col = document.createElement('div');
      col.className = 'col-12 col-sm-6 col-md-4 col-lg-3';

      const card = document.createElement('div');
      card.className = 'doc-card';

      const thumbUrl = cloudThumb(d.urlDoc, d.mimeType);
      const placeholder = 'https://dummyimage.com/600x400/efefef/aaaaaa&text=Documento';
      
      const img = document.createElement('img');
      img.className = 'doc-thumb';
      img.alt = d.nombre || 'Documento';
      
      // si hay thumb la usamos; si no, placeholder
      img.src = thumbUrl || placeholder;
      
      // si la miniatura falla (p.ej. 401 por access control), mostramos placeholder
      img.onerror = () => { img.src = placeholder; };
      
      img.addEventListener('click', () => window.open(d.urlDoc, '_blank'));

      const body = document.createElement('div');
      body.className = 'doc-body';
      body.innerHTML = `
        <div class="fw-semibold text-truncate" title="${d.nombre || ''}">${d.nombre || '(sin nombre)'}</div>
        <div class="small text-muted text-truncate" title="${d.tipoDoc || ''}">${d.tipoDoc || ''}</div>
      `;

      card.appendChild(img);
      card.appendChild(body);

      if (allowDelete) {
        const del = document.createElement('button');
        del.className = 'doc-del';
        del.textContent = '🗑';
        del.title = 'Eliminar';
        del.addEventListener('click', async (ev) => {
          ev.stopPropagation();
          if (!confirm('¿Eliminar documento?')) return;
          try {
            await deleteDoc(d.idDocumento || d.id || d.documentoId);
            await reload();
          } catch (e) {
            alert(e.message || 'No se pudo eliminar');
          }
        });
        card.appendChild(del);
      }

      col.appendChild(card);
      grid.appendChild(col);
    });
    estado.textContent = `${docs.length} documento(s)`;
  }

  async function reload() {
    const docs = await fetchDocs();
    render(docs);
    return docs;
  }

  // init
  reload();

  return { reload };
}
