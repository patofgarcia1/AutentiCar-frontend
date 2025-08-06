import { URL_API } from '../constants/database.js';

document.addEventListener('DOMContentLoaded', async () => {
    const usuarioId = localStorage.getItem("usuarioId");
    const container = document.getElementById('usuario-detalle');

    if (!usuarioId) {
        container.innerHTML = `<div class="alert alert-warning">No se encontró un usuario logueado.</div>`;
        return;
    }

    try {
        const response = await fetch(`${URL_API}/usuarios/${usuarioId}`);
        if (!response.ok) {
            const errorMsg = await response.text();
            container.innerHTML = `<div class="alert alert-danger">${errorMsg}</div>`;
            return;
        }

        const usuario = await response.json();
        console.log(usuario);
        // Renderizar los datos
        container.innerHTML = `
            <p><strong>Nombre:</strong> ${usuario.nombre}</p>
            <p><strong>Apellido:</strong> ${usuario.apellido}</p>
            <p><strong>Email:</strong> ${usuario.mail}</p>
            <div class="mt-4">
                <button class="btn btn-outline-primary m-1" id="btn-compras">Mis Compras</button>
                <button class="btn btn-outline-secondary m-1" id="btn-ventas">Mis Ventas</button>
                <button class="btn btn-outline-success m-1" id="btn-vehiculos">Mis Vehículos</button>
                <button class="btn btn-outline-warning m-1" id="btn-publicaciones">Mis Publicaciones</button>
            </div>
        `;

        // Listeners de ejemplo (para redirección o abrir otra página)
        document.getElementById('btn-compras').addEventListener('click', () => {
            window.location.href = `compras.html?usuario=${usuarioId}`;
        });
        document.getElementById('btn-ventas').addEventListener('click', () => {
            window.location.href = `ventas.html?usuario=${usuarioId}`;
        });
        document.getElementById('btn-vehiculos').addEventListener('click', () => {
            window.location.href = `vehiculos.html?usuario=${usuarioId}`;
        });
        document.getElementById('btn-publicaciones').addEventListener('click', () => {
            window.location.href = `publicaciones.html?usuario=${usuarioId}`;
        });

    } catch (error) {
        container.innerHTML = `<div class="alert alert-danger">Error al conectar con el servidor.</div>`;
        console.error("Error fetching user:", error);
    }
});
