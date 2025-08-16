import { URL_API } from '../constants/database.js';
import { initGaleriaImagenes } from './components/imagenes.js';

document.addEventListener('DOMContentLoaded', () => {
  const usuarioId = localStorage.getItem('usuarioId');
  const vehiculoId = localStorage.getItem('vehiculoId');
  const aviso = document.getElementById('aviso-ids');
  const form = document.getElementById('form-publicacion');
  const mensaje = document.getElementById('mensaje');
  const btnSubmit = form.querySelector('button[type="submit"]');

  if (!usuarioId || !vehiculoId) {
    aviso.innerHTML = `<div class="alert alert-warning">
      Faltan IDs requeridos. usuarioId: ${usuarioId ?? '—'} | vehiculoId: ${vehiculoId ?? '—'}.<br>
      Asegurate de haber iniciado sesión y de venir desde la carga de vehículo.
    </div>`;
  }

  const root = document.getElementById('imagenes-root');
  const galeria = initGaleriaImagenes({
    root,
    vehiculoId: Number(vehiculoId),
    allowUpload: true,
    allowDelete: true, // o false si no querés borrar acá
    titulo: 'Imágenes para la publicación',
    onChange: (imgs) => {
      // opcional: feedback, contador, etc.
      console.log('imagenes ahora:', imgs.length);
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    btnSubmit.textContent = 'Publicando...';
    btnSubmit.disabled = true;

    if (!usuarioId || !vehiculoId) {
      mensaje.innerHTML = `<div class="alert alert-danger">Faltan datos para crear la publicación.</div>`;
      return;
    }

    const formData = new FormData(form);
    const datos = Object.fromEntries(formData.entries());

    const payload = {
      titulo: datos.titulo,
      descripcion: datos.descripcion,
      precio: parseInt(datos.precio, 10),
      usuarioId: parseInt(usuarioId, 10),
      vehiculoId: parseInt(vehiculoId, 10),
    };

    try {
      const resp = await fetch(`${URL_API}/publicaciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const txt = await resp.text();
        mensaje.innerHTML = `<div class="alert alert-danger">${txt}</div>`;
        return;
      }

      let data = null;
      try { data = await resp.json(); } catch { /* puede devolver solo texto */ }

      mensaje.innerHTML = `<div class="alert alert-success">Publicación creada con éxito.</div>`;

      // Limpio el vehiculoId si ya no lo vas a usar (opcional)
      // localStorage.removeItem('vehiculoId');

      // Redireccion
      const idPub = data?.idPublicacion ?? data?.id;
      setTimeout(() => {
        if (idPub) {
          window.location.href = `publicacionDetalle.html?id=${idPub}`;
        } else {
          window.location.href = 'publicaciones.html';
        }
      }, 800);
    } catch (err) {
      console.error(err);
      mensaje.innerHTML = `<div class="alert alert-danger">Error al conectar con el servidor.</div>`;
    }
  });
});
