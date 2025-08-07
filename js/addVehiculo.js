
import { URL_API } from '../constants/database.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-vehiculo');
  const mensaje = document.getElementById('mensaje');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const usuarioId = localStorage.getItem("usuarioId");
    if (!usuarioId) {
      mensaje.innerHTML = `<div class="alert alert-warning">Debés estar logueado para cargar un vehículo.</div>`;
      return;
    }

    const formData = new FormData(form);
    const datos = Object.fromEntries(formData.entries());

    const vehiculo = {
      ...datos,
      anio: parseInt(datos.anio),
      kilometraje: parseInt(datos.kilometraje),
      puertas: parseInt(datos.puertas),
      motor: parseFloat(datos.motor),
      usuarioId: parseInt(usuarioId),
    };

    try {
      const response = await fetch(`${URL_API}/vehiculos`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(vehiculo)
      });

      if (response.ok) {
        mensaje.innerHTML = `<div class="alert alert-success">Vehículo cargado con éxito.</div>`;
        form.reset();
      } else {
        const errorText = await response.text();
        mensaje.innerHTML = `<div class="alert alert-danger">${errorText}</div>`;
      }
    } catch (error) {
      mensaje.innerHTML = `<div class="alert alert-danger">Error al conectar con el servidor.</div>`;
    }
  });
});
