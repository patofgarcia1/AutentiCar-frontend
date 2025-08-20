// js/formVerificacion.js
import { URL_API } from '../constants/database.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('verificacionForm');
  const mensaje = document.getElementById('mensaje');
  const btnSubmit = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const originalText = btnSubmit.textContent;
    btnSubmit.textContent = 'Enviando...';
    btnSubmit.disabled = true;

    const usuarioId = Number(localStorage.getItem('usuarioIdVerif'));
    if (!usuarioId) {
      mensaje.innerHTML = `<div class="alert alert-warning">No se encontró el usuario. Volvé a registrarte.</div>`;
      btnSubmit.textContent = originalText; btnSubmit.disabled = false;
      return;
    }

    // 👇 Leer directamente por id (no FormData)
    const razonSocial = document.getElementById('razonSocial').value;
    const cuit        = document.getElementById('cuit').value;
    const notas       = document.getElementById('notas').value;

    const payload = {
      razonSocial: razonSocial,
      cuit: Number(cuit),   // el DTO espera long
      notas: notas || null, // opcional
      usuarioId: usuarioId
    };

    try {
      const resp = await fetch(`${URL_API}/concesionariaVerif`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (resp.ok) {
        const txt = await resp.text().catch(() => '');
        mensaje.innerHTML = `<div class="alert alert-success">${txt || 'Solicitud de verificación enviada.'}</div>`;
        localStorage.removeItem('usuarioIdVerif');
        setTimeout(() => { window.location.href = 'login.html'; }, 1000);
      } else {
        const err = await resp.text();
        mensaje.innerHTML = `<div class="alert alert-danger">${err || 'No se pudo enviar la verificación.'}</div>`;
      }
    } catch {
      mensaje.innerHTML = `<div class="alert alert-danger">Error al conectar con el servidor.</div>`;
    } finally {
      btnSubmit.textContent = originalText;
      btnSubmit.disabled = false;
    }
  });
});
