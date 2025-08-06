
import { URL_API } from '../constants/database.js';

document.addEventListener('DOMContentLoaded', async () => {
  const usuarioId = localStorage.getItem("usuarioId");
  const contenedor = document.getElementById('vehiculos-lista');

  if (!usuarioId) {
    contenedor.innerHTML = `<div class="alert alert-warning">Debés iniciar sesión para ver tus vehículos.</div>`;
    return;
  }

  try {
    const response = await fetch(`${URL_API}/usuarios/${usuarioId}/vehiculos`);
    if (!response.ok) {
      const errorMsg = await response.text();
      contenedor.innerHTML = `<div class="alert alert-danger">${errorMsg}</div>`;
      return;
    }

    const vehiculos = await response.json();

    if (vehiculos.length === 0) {
      contenedor.innerHTML = `<div class="alert alert-info">No tenés vehículos cargados aún.</div>`;
      return;
    }

    // Renderizamos solo marca, modelo y año por vehículo
    contenedor.innerHTML = vehiculos.map(v => `
      <div class="col">
        <div class="card h-100 shadow-sm">
          <div class="card-body">
            <h5 class="card-title">${v.marca} ${v.modelo}</h5>
            <p class="card-text"><strong>Año:</strong> ${v.anio}</p>
            <a href="vehiculoDetalle.html?id=${v.idVehiculo}" class="btn btn-primary">Ver detalle</a>
          </div>
        </div>
      </div>
    `).join('');

  } catch (error) {
    console.error(error);
    contenedor.innerHTML = `<div class="alert alert-danger">Error al conectar con el servidor.</div>`;
  }
});
