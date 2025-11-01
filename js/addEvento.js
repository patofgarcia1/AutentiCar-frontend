import { URL_API } from '../constants/database.js';

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const vehiculoId = params.get('id'); 
  const token = localStorage.getItem("token");

  const form = document.getElementById('form-evento');
  const mensaje = document.getElementById('mensaje');
  const btnSubmit = form.querySelector('button[type="submit"]');

  if (!token) {
    mensaje.innerHTML = `<div class="alert alert-warning">Sesión no válida. Iniciá sesión nuevamente.</div>`;   
    return;
  }

  let rol = 'ROL_USER';
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    rol = payload?.rol || 'ROL_USER';
  } catch {}

  const grpReg = document.getElementById('grp-usuario-registrador');
  if (grpReg) grpReg.classList.toggle('d-none', rol !== 'ROL_ADMIN');


  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const originalText = btnSubmit.textContent;
    btnSubmit.textContent = 'Guardando...';
    btnSubmit.disabled = true;

    if (!vehiculoId) {
      mensaje.innerHTML = `<div class="alert alert-danger">No se detectó el ID del vehículo (parámetro <code>?id</code>).</div>`;
      const originalText = btnSubmit.textContent;
      btnSubmit.disabled = false;
      return;
    }

    const formData = new FormData(form);
    const datos = Object.fromEntries(formData.entries());

    const payload = {
      titulo: datos.titulo,
      descripcion: datos.descripcion,
      kilometrajeEvento: parseInt(datos.kilometrajeEvento, 10),
      tipoEvento: String(datos.tipoEvento).toUpperCase(), 
      vehiculoId: parseInt(vehiculoId, 10),
    };

    if (rol === 'ROL_ADMIN') {
      const str = (document.getElementById('usuarioRegistradorId')?.value || '').trim();
      if (str) {
        const idNum = Number(str);
        if (!Number.isNaN(idNum) && idNum > 0) {
          payload.usuarioId = idNum;  
        } else {
          mensaje.innerHTML = `<div class="alert alert-danger">El ID de usuario registrador no es válido.</div>`;
          btnSubmit.textContent = originalText;
          btnSubmit.disabled = false;
          return;
        }
      }
    }

    try {
      const resp = await fetch(`${URL_API}/eventos`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          "Authorization": `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
      });

      if (resp.status === 401 || resp.status === 403) {
        mensaje.innerHTML = `<div class="alert alert-danger">No autorizado. Iniciá sesión nuevamente.</div>`;
        return;
      }

      if (!resp.ok) {
        const txt = await resp.text();
        mensaje.innerHTML = `<div class="alert alert-danger">${txt}</div>`;
        return;
      }

      const data = await resp.json();

      mensaje.innerHTML = `<div class="alert alert-success">Evento creado con éxito.</div>`;

      const idEvento = data?.idEvento ?? data?.id;
      setTimeout(() => {
          window.location.href = `eventoDetalle.html?id=${idEvento}`;
      }, 900);

    } catch (error) {
      console.error('Error creando evento:', error);
      mensaje.innerHTML = `<div class="alert alert-danger">Error al conectar con el servidor.</div>`;
    } finally {
      btnSubmit.textContent = originalText;
      btnSubmit.disabled = false;
    }
    
  });
});
