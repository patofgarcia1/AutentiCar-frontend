// js/components/imagenes.js
import { URL_API } from '../../constants/database.js';

export function initGaleriaImagenes({
  root,           
  vehiculoId,     
  allowUpload,    // boolean (true: muestra botón/selector y sube)
  allowDelete,    // boolean (true: muestra ícono de borrar)
  titulo = 'Imágenes',
  onChange,       // callback opcional cuando cambian (p.ej, tras subir/borrar)
  authHeaders     // <<< OPCIONAL: { Authorization: 'Bearer <token>' }
}) {
  if (!root) throw new Error('root es requerido');
  if (!vehiculoId) throw new Error('vehiculoId es requerido');

  // Si no te pasan headers, intento tomar el token del localStorage
  const resolvedAuthHeaders = (() => {
    if (authHeaders && typeof authHeaders === 'object') return authHeaders;
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  })();


  // Estado interno
  let imagenes = [];
  let indiceActual = 0;

  // Estructura base
  root.innerHTML = `
    <section class="mt-4 text-center">
      <p id="galeriaLeyenda" class="text-gray-700 mb-1">Sube aquí las fotos del vehículo.</p>
      <p id="imagenesEstado" class="text-gray-500 text-sm mb-3">0/30 imágenes</p>

      ${allowUpload ? `
        <input id="fileInput" type="file" accept="image/*" multiple hidden />
        <button id="btnSubir" class="btn btn-outline-primary btn-sm">Agregar imágenes</button>
      ` : ``}

      <div id="galeria" class="row g-2 mt-4"></div>
    </section>

    <div id="slideshow" class="position-fixed top-0 start-0 w-100 h-100 d-none"
         style="background: rgba(0,0,0,.85); z-index: 1055; align-items:center; justify-content:center;">
      <button type="button" class="btn btn-light position-absolute top-0 end-0 m-3" id="btnCerrar">✕</button>
      <button type="button" class="btn btn-light position-absolute start-0 ms-3" id="btnPrev">‹</button>
      <img id="imagen-slideshow" class="img-fluid" alt="Imagen vehículo" style="max-height: 90vh;"/>
      <button type="button" class="btn btn-light position-absolute end-0 me-3" id="btnNext">›</button>
    </div>
  `;

  // Refs
  const galeria = root.querySelector('#galeria');
  const estado = root.querySelector('#imagenesEstado');
  const overlay = root.querySelector('#slideshow');
  const imgSlide = root.querySelector('#imagen-slideshow');
  const btnPrev = root.querySelector('#btnPrev');
  const btnNext = root.querySelector('#btnNext');
  const btnCerrar = root.querySelector('#btnCerrar');
  const btnSubir = root.querySelector('#btnSubir');
  const fileInput = root.querySelector('#fileInput');

  // --- API calls ---
  async function getImagenes() {
    const res = await fetch(`${URL_API}/vehiculos/${vehiculoId}/imagenes`);
    if (!res.ok) return [];
    return res.json();
  }

  async function postImagenes(files) {
    const fd = new FormData();
    files.forEach(f => fd.append('files', f));
    const res = await fetch(`${URL_API}/vehiculos/${vehiculoId}/imagenes`, {
      method: 'POST',
      headers: {
        ...resolvedAuthHeaders 
      },
      body: fd
    });
    if (res.status === 401 || res.status === 403) {
      throw new Error('No autorizado. Iniciá sesión nuevamente.');
    }
    if (!res.ok) {
      throw new Error(await res.text());
    }
    return res.json();
  }

  async function deleteImagen(imagenId) {
    const res = await fetch(`${URL_API}/vehiculos/imagenes/${imagenId}`, {
      method: 'DELETE',
      headers: {
        ...resolvedAuthHeaders 
      },
    });
    if (res.status === 401 || res.status === 403) {
      throw new Error('No autorizado. Iniciá sesión nuevamente.');
    }
    if (!res.ok) throw new Error(await res.text());
  }

  // --- Render ---
  function renderGrid() {
    galeria.innerHTML = '';
    const leyenda = root.querySelector('#galeriaLeyenda');
    const estado = root.querySelector('#imagenesEstado');
    const contenedor = root.querySelector('section.mt-4');

    if (!imagenes.length) {
     leyenda.style.display = 'block';
      estado.textContent = `0/30 imágenes`;
      contenedor.appendChild(document.querySelector('#btnSubir'));
      return;
    }

    leyenda.style.display = 'none';

    imagenes.forEach((img, i) => {
      const col = document.createElement('div');
      col.className = 'col-6 col-md-4 col-lg-3';

      const wrap = document.createElement('div');
      wrap.className = 'gal-item';

      // (opcional) transformación de Cloudinary para thumbs
      const thumbUrl = toThumb(img.urlImagen, 400, 300); // w=400,h=300,c_fill

      const imgtag = document.createElement('img');
      imgtag.src = thumbUrl;
      imgtag.alt = `Imagen ${i + 1}`;
      imgtag.addEventListener('click', () => abrirSlideshow(i));
      wrap.appendChild(imgtag);

      if (allowDelete) {
        const b = document.createElement('button');
        b.className = 'btn-del';
        b.title = 'Eliminar';
        b.textContent = '🗑';
        b.addEventListener('click', async (ev) => {
          ev.stopPropagation();
          if (!confirm('¿Eliminar imagen?')) return;
          try {
            await deleteImagen(img.idImagen);
            await cargarImagenes();
            onChange?.(imagenes);
          } catch (e) {
            alert(e.message || 'No se pudo eliminar');
          }
        });
        wrap.appendChild(b);
      }

      col.appendChild(wrap);
      galeria.appendChild(col);
    });
    estado.textContent = `${imagenes.length}/30 imágenes`;

    contenedor.appendChild(estado);
    contenedor.appendChild(document.querySelector('#btnSubir'));
  }

  // --- Slideshow ---
  function abrirSlideshow(i) {
    indiceActual = i;
    mostrarImagen();
    overlay.classList.remove('d-none');
    overlay.classList.add('d-flex');
  }
  function cerrarSlideshow() {
    overlay.classList.add('d-none');
    overlay.classList.remove('d-flex');
  }
  function cambiarImagen(n) {
    if (!imagenes.length) return;
    indiceActual = (indiceActual + n + imagenes.length) % imagenes.length;
    mostrarImagen();
  }
  function mostrarImagen() {
    if (!imagenes.length) return;
    imgSlide.src = imagenes[indiceActual].urlImagen; // original
  }

  btnPrev?.addEventListener('click', () => cambiarImagen(-1));
  btnNext?.addEventListener('click', () => cambiarImagen(1));
  btnCerrar?.addEventListener('click', cerrarSlideshow);
  overlay?.addEventListener('click', (e) => { if (e.target === overlay) cerrarSlideshow(); });

  // --- Upload ---
  btnSubir?.addEventListener('click', () => fileInput.click());
  fileInput?.addEventListener('change', async () => {
    const files = Array.from(fileInput.files || []);
    if (!files.length) return;

    if (imagenes.length + files.length > 30) {
      alert(`Podés subir ${30 - imagenes.length} imagen(es) como máximo.`);
      fileInput.value = '';
      return;
    }

    btnSubir.disabled = true;
    btnSubir.textContent = 'Subiendo...';
    try {
      await postImagenes(files);
      await cargarImagenes();
      onChange?.(imagenes);
    } catch (e) {
      alert(e.message || 'Error al subir');
    } finally {
      btnSubir.disabled = false;
      btnSubir.textContent = 'Agregar imágenes';
      fileInput.value = '';
    }
  });

  // --- Public helpers ---
  async function cargarImagenes() {
    try {
      imagenes = await getImagenes();
    } catch {
      imagenes = [];
    }
    renderGrid();
    return imagenes;
  }

  // helper: generar thumbnail de Cloudinary sin re-subir
  function toThumb(url, w, h) {
    try {
      // reemplaza /upload/ por /upload/w_400,h_300,c_fill/
      return url.replace('/upload/', `/upload/w_${w},h_${h},c_fill/`);
    } catch { return url; }
  }

  // init
  cargarImagenes();

  return {
    reload: cargarImagenes,
    getImagenes: () => [...imagenes],
  };
}
