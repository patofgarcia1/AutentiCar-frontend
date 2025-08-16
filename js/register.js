import { URL_API } from '../constants/database.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registerForm');
    const btnSubmit = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        btnSubmit.textContent = 'Creando...';
        btnSubmit.disabled = true;

        const nombre = document.getElementById('nombre').value;
        const apellido = document.getElementById('apellido').value;
        const dni = document.getElementById('dni').value;
        const mail = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const rol = document.getElementById('rol').value;

        try {
            const response = await fetch(`${URL_API}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nombre: nombre,
                    apellido: apellido,
                    dni: parseInt(dni),
                    mail: mail,
                    password: password,
                    rol: rol
                })
            });

            const mensaje = document.getElementById('mensaje');

            if (response.ok) {
                const data = await response.text();
                mensaje.innerHTML = `<div class="alert alert-success">${data}</div>`;

                setTimeout(() => {
                    window.location.href = "login.html";
                }, 2000);
            } else {
                const error = await response.text();
                mensaje.innerHTML = `<div class="alert alert-danger">${error}</div>`;
            }
        } catch (error) {
            document.getElementById('mensaje').innerHTML = `<div class="alert alert-danger">Error al conectar con el servidor</div>`;
        }
    });
});
