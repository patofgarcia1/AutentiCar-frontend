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
      const response = await fetch(`${URL_API}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mail: email,
          password: password
        })
      });

      const mensaje = document.getElementById('mensaje');

      if (response.ok) {
        const data = await response.json();
        // console.log("Respuesta del backend:", data); 
        // console.log("ID del usuario:", data.id);  
        mensaje.innerHTML = `<div class="alert alert-success">${data.mensaje}</div>`;
        localStorage.setItem("usuarioId", data.id);
        setTimeout(() => {
            window.location.href = "index.html";
        }, 1000); // 1000 milisegundos = 1 segundo

      } else {
        const error = await response.text();
        mensaje.innerHTML = `<div class="alert alert-danger">${error}</div>`;
      }
    } catch (error) {
      document.getElementById('mensaje').innerHTML = `<div class="alert alert-danger">Error al conectar con el servidor</div>`;
    } finally {
      if (!document.hidden) {
        btnSubmit.textContent = originalText;
        btnSubmit.disabled = false;
      }
    }
  });
});
