
import { URL_API } from '../constants/database.js';

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const vehiculoId = params.get('id');
  const contenedor = document.getElementById('docs-lista');

  if (!vehiculoId) {
    contenedor.innerHTML = `<div class="alert alert-danger">ID de vehículo no especificado en la URL.</div>`;
    return;
  }

  try {
    const response = await fetch(`${URL_API}/vehiculos/${vehiculoId}/documentos`);
    if (!response.ok) {
      const errorMsg = await response.text();
      contenedor.innerHTML = `<div class="alert alert-danger">${errorMsg}</div>`;
      return;
    }

    const documentos = await response.json();

    if (documentos.length === 0) {
      contenedor.innerHTML = `<div class="alert alert-info">No hay documentos asociados a este vehículo.</div>`;
      return;
    }

    contenedor.innerHTML = documentos.map(doc => `
      <div class="col">
        <div class="card h-100 shadow-sm">
          <div class="card-body">
            <h5 class="card-title">${doc.nombre}</h5>
            <p><strong>Tipo:</strong> ${doc.tipoDoc}</p>
            <p><strong>Nivel de riesgo:</strong> ${doc.nivelRiesgo}</p>
            ${doc.urlDoc ? `<a href="${doc.urlDoc}" target="_blank" class="btn btn-outline-primary btn-sm">Ver documento</a>` : ''}
            <a href="docDetalle.html?id=${doc.idDocVehiculo}" class="btn btn-primary">Ver detalle</a>
          </div>
        </div>
      </div>
    `).join('');

  } catch (error) {
    console.error("Error al obtener documentos:", error);
    contenedor.innerHTML = `<div class="alert alert-danger">Error al conectar con el servidor.</div>`;
  }
});
