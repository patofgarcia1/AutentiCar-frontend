import { URL_API } from '../constants/database.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const btnSubmit = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const originalText = btnSubmit.textContent;
    btnSubmit.textContent = 'Ingresando...';
    btnSubmit.disabled = true;

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      const response = await fetch(`${URL_API}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mail: email,
          password
        })
      });

      const mensaje = document.getElementById('mensaje');

      // intentar parsear JSON; si viene texto, lo mostramos igual
      const readBody = async (res) => {
        const text = await res.text();
        try { return JSON.parse(text); } catch { return { ok: res.ok, mensaje: text }; }
      };
      const data = await readBody(response);

      if (response.ok && (data.ok === true || data.ok === undefined)) {
        mensaje.innerHTML = `<div class="alert alert-success">${data.mensaje || 'Fuiste logueado exitosamente'}</div>`;

        // --- Compatibilidad: exponer data.id para mantener tu línea intacta
        if (data.id == null) {
          const u = data.usuario || {};
          data.id = u.idUsuario ?? u.id ?? null;
        }

        // guarda el id como siempre
        localStorage.setItem('usuarioId', data.id);

        // (opcional) guardá el token para futuras requests
        if (data.token) {
          localStorage.setItem('token', data.token);
        }

        setTimeout(() => { window.location.href = 'index.html'; }, 1000);

      } else {
        const err = data?.mensaje || 'Credenciales inválidas';
        mensaje.innerHTML = `<div class="alert alert-danger">${err}</div>`;
      }

    } catch (error) {
      document.getElementById('mensaje').innerHTML =
        `<div class="alert alert-danger">Error al conectar con el servidor</div>`;
    } finally {
      if (!document.hidden) {
        btnSubmit.textContent = originalText;
        btnSubmit.disabled = false;
      }
    }
  });
});