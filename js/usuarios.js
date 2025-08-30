import { URL_API } from '../constants/database.js';

document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem("token");
  const contenedor = document.getElementById('usuarios-container');

  if (!token) {
    contenedor.innerHTML = `<div class="alert alert-warning">Sesión no válida. Iniciá sesión nuevamente.</div>`;
    // opcional: window.location.href = 'login.html';
    return;
  }

  try {
    const response = await fetch(`${URL_API}/usuarios`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (response.status === 401 || response.status === 403) {
      contenedor.innerHTML = `<div class="alert alert-danger">No autorizado. Iniciá sesión nuevamente.</div>`;
      // opcional: window.location.href = 'login.html';
      return;
    }
    
    if (!response.ok) {
      const errorMsg = await response.text();
      contenedor.innerHTML = `<div class="alert alert-danger">${errorMsg}</div>`;
      return;
    }

    const usuarios = await response.json();

    if (!usuarios.length) {
      contenedor.innerHTML = `<div class="alert alert-info">No tenés usuarios cargados aún.</div>`;
      return;
    }

    contenedor.innerHTML = usuarios.map(u => {
      return `
        <div class="col">
          <div class="card h-100 shadow-sm">
            <div class="card-body">
              <h5 class="card-title">${u.nombre} ${u.apellido}</h5>
              <p class="card-text"><strong>Mail:</strong> ${u.mail}</p>
              <a href="usuarioDetalle.html?" class="btn btn-primary">Ver detalle</a>
            </div>
          </div>
        </div>
      `;
    }).join('');

  } catch (error) {
    console.error(error);
    contenedor.innerHTML = `<div class="alert alert-danger">Error al conectar con el servidor.</div>`;
  }
});
