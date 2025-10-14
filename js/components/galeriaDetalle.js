// js/components/galeriaDetalle.js
import { URL_API } from '../../constants/database.js';

export function initGaleriaDetalle({
  root,
  vehiculoId,
  allowUpload = false,
  authHeaders,
  onChange,
}) {
  if (!root) throw new Error('root es requerido');
  if (!vehiculoId) throw new Error('vehiculoId es requerido');

  const resolvedAuthHeaders = (() => {
    if (authHeaders && typeof authHeaders === 'object') return authHeaders;
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  })();

  let imagenes = [];
  let indiceActual = 0;

  root.innerHTML = `
    <div class="galeria-detalle text-center">
      <img id="imgPortada" class="img-fluid rounded shadow-sm portada-galeria" style="cursor:pointer; max-height:500px; object-fit:cover;" alt="Portada vehículo"/>
    </div>

    <div id="slideshowDetalle" class="position-fixed top-0 start-0 w-100 h-100 d-none"
        style="background: rgba(0,0,0,.9); z-index: 1055; align-items:center; justify-content:center;">
      <button type="button" class="btn btn-light position-absolute top-0 end-0 m-3" id="btnCerrarSlide">✕</button>
      <button type="button" class="btn btn-light position-absolute start-0 ms-3" id="btnPrevSlide">‹</button>
      <img id="imagen-slide" class="img-fluid" alt="Imagen vehículo" style="max-height: 90vh; max-width:90vw;"/>
      <button type="button" class="btn btn-light position-absolute end-0 me-3" id="btnNextSlide">›</button>
    </div>
  `;

  const portada = root.querySelector('#imgPortada');
  const overlay = root.querySelector('#slideshowDetalle');
  const imgSlide = root.querySelector('#imagen-slide');
  const btnPrev = root.querySelector('#btnPrevSlide');
  const btnNext = root.querySelector('#btnNextSlide');
  const btnCerrar = root.querySelector('#btnCerrarSlide');

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
      headers: { ...resolvedAuthHeaders },
      body: fd
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  function renderPortada() {
    if (!imagenes.length) {
      portada.src = 'img/defaultCar.jpg';
      return;
    }
    portada.src = imagenes[0].urlImagen;
  }

  function abrirSlide(i) {
    if (!imagenes.length) return;
    indiceActual = i;
    mostrarSlide();
    overlay.classList.remove('d-none');
    overlay.classList.add('d-flex');
  }

  function cerrarSlide() {
    overlay.classList.add('d-none');
    overlay.classList.remove('d-flex');
  }

  function cambiarSlide(n) {
    if (!imagenes.length) return;
    indiceActual = (indiceActual + n + imagenes.length) % imagenes.length;
    mostrarSlide();
  }

  function mostrarSlide() {
    imgSlide.src = imagenes[indiceActual].urlImagen;
  }

  portada.addEventListener('click', () => abrirSlide(0));
  btnPrev.addEventListener('click', () => cambiarSlide(-1));
  btnNext.addEventListener('click', () => cambiarSlide(1));
  btnCerrar.addEventListener('click', cerrarSlide);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) cerrarSlide(); });

  async function cargarImagenes() {
    try {
      imagenes = await getImagenes();
    } catch {
      imagenes = [];
    }
    renderPortada();
    return imagenes;
  }

  // Subida pública
  async function subir(files) {
    await postImagenes(files);
    await cargarImagenes();
    onChange?.(imagenes);
  }

  cargarImagenes();

  return {
    reload: cargarImagenes,
    upload: subir,
    getImagenes: () => [...imagenes],
  };
}
