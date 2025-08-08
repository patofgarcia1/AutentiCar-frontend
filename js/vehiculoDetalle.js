import { URL_API } from '../constants/database.js';

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const vehiculoId = params.get('id');
  const titulo = document.getElementById('titulo');
  const info = document.getElementById('info');

  if (!vehiculoId) {
    titulo.textContent = "Error";
    info.innerHTML = `<div class="alert alert-danger">ID de vehículo no especificado en la URL.</div>`;
    return;
  }

  try {
    const response = await fetch(`${URL_API}/vehiculos/${vehiculoId}`);
    if (!response.ok) {
      const errorMsg = await response.text();
      titulo.textContent = "Vehículo no encontrado";
      info.innerHTML = `<div class="alert alert-danger">${errorMsg}</div>`;
      return;
    }

    const v = await response.json();

    titulo.textContent = `${v.marca} ${v.modelo} (${v.anio})`;

    info.innerHTML = `
      <p><strong>VIN:</strong> ${v.vin}</p>
      <p><strong>Kilometraje:</strong> ${v.kilometraje} km</p>
      <p><strong>Puertas:</strong> ${v.puertas}</p>
      <p><strong>Motor:</strong> ${v.motor}L</p>
      <p><strong>Color:</strong> ${v.color}</p>
      <p><strong>Combustible:</strong> ${v.tipoCombustible}</p>
      <p><strong>Transmisión:</strong> ${v.tipoTransmision}</p>
      <p><strong>Fecha de alta:</strong> ${v.fechaAlta}</p>
      <p><strong>Estado:</strong> ${v.estado}</p>
      <a href="docsVehiculo.html?id=${v.idVehiculo}" class="btn btn-primary">Ver documentos</a>
      <a href="eventosVehiculo.html?id=${v.idVehiculo}" class="btn btn-primary">Ver eventos</a>
      <a href="addDocumento.html?id=${v.idVehiculo}" class="btn btn-primary">Agregar documentos</a>
    `;

  } catch (error) {
    console.error(error);
    titulo.textContent = "Error";
    info.innerHTML = `<div class="alert alert-danger">No se pudo conectar con el servidor.</div>`;
  }
});
