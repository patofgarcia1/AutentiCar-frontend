import { URL_API } from '../constants/database.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

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
        const data = await response.text();
        mensaje.innerHTML = `<div class="alert alert-success">${data}</div>`;
        setTimeout(() => {
            window.location.href = "index.html";
        }, 1000); // 1000 milisegundos = 1 segundo

        // localStorage.setItem("user", JSON.stringify(data));

      } else {
        const error = await response.text();
        mensaje.innerHTML = `<div class="alert alert-danger">${error}</div>`;
      }
    } catch (error) {
      document.getElementById('mensaje').innerHTML = `<div class="alert alert-danger">Error al conectar con el servidor</div>`;
    }
  });
});
