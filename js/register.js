import { URL_API } from '../constants/database.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registerForm');
    const btnSubmit = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const originalText = btnSubmit.textContent;
        btnSubmit.textContent = 'Creando...';
        btnSubmit.disabled = true;

        const nombre = document.getElementById('nombre').value;
        const apellido = document.getElementById('apellido').value;
        const dni = document.getElementById('dni').value;
        const mail = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const rol = document.getElementById('rol').value;
        const telefonoCelular = document.getElementById('telefonoCelular').value;

        const mensaje = document.getElementById('mensaje');

        try {
            const response = await fetch(`${URL_API}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre,
                    apellido,
                    dni: parseInt(dni, 10),
                    mail,
                    password,
                    telefonoCelular,
                    rol
                })
            });

            const readBody = async (res) => {
                const text = await res.text();
                try { return JSON.parse(text); } catch { return { ok: res.ok, mensaje: text }; }
            };

            const data = await readBody(response);

            if (response.ok && (data.ok === true || data.ok === undefined)) {
                mensaje.innerHTML = `<div class="alert alert-success">${data.mensaje || 'Usuario registrado con éxito'}</div>`;

                const usuario = data.usuario || {};
                const idUsuario = usuario.idUsuario;

                // en tu DTO viene esConcesionaria; como fallback, miramos rol
                const esConcesionaria = (typeof usuario.esConcesionaria === 'boolean')
                    ? usuario.esConcesionaria
                    : (usuario.rol === 'CONCESIONARIO' || rol === 'CONCESIONARIO');

                if (esConcesionaria === true && idUsuario != null) {
                    localStorage.setItem('usuarioIdVerif', String(idUsuario));
                    setTimeout(() => { window.location.href = 'formVerificacion.html'; }, 1000);
                } else {
                    setTimeout(() => { window.location.href = 'login.html'; }, 1000);
                }

            } else {
                const errMsg = data?.mensaje || 'Error en el registro';
                mensaje.innerHTML = `<div class="alert alert-danger">${errMsg}</div>`;
            }

        } catch (error) {
            mensaje.innerHTML = `<div class="alert alert-danger">Error al conectar con el servidor</div>`;
        } finally {
            if (!document.hidden) {
                btnSubmit.textContent = originalText;
                btnSubmit.disabled = false;
            }
        }
    });
});