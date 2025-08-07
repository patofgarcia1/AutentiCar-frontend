
import { URL_API } from '../constants/database.js';

document.addEventListener('DOMContentLoaded', async () => {
    const usuarioId = localStorage.getItem("usuarioId");
  const container = document.getElementById('publicaciones-lista');

  try {
    const response = await fetch(`${URL_API}/usuarios/${usuarioId}/publicaciones`);
    if (!response.ok) {
      const errorMsg = await response.text();
      container.innerHTML = `<div class="alert alert-danger">${errorMsg}</div>`;
      return;
    }

    const publicaciones = await response.json();

    if (publicaciones.length === 0) {
      container.innerHTML = `<div class="alert alert-info">No hay publicaciones disponibles.</div>`;
      return;
    }

    container.innerHTML = publicaciones.map(pub => `
      <div class="col">
        <div class="card h-100 shadow-sm">
          <div class="card-body">
            <h5 class="card-title">${pub.titulo}</h5>
            <p class="card-text">${pub.descripcion}</p>
            <p class="card-text"><strong>Precio:</strong> $${pub.precio}</p>
            <a href="publicacionDetalle.html?id=${pub.idPublicacion}" class="btn btn-primary">Ver detalle</a>
          </div>
        </div>
      </div>
    `).join('');

  } catch (error) {
    console.error("Error al obtener publicaciones:", error);
    container.innerHTML = `<div class="alert alert-danger">Error al conectar con el servidor.</div>`;
  }
});
