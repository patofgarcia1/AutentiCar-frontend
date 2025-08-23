
import { URL_API } from '../constants/database.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-vehiculo');
  const mensaje = document.getElementById('mensaje');
  const btnSubmit = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const originalText = btnSubmit.textContent;
    btnSubmit.textContent = 'Guardando...';
    btnSubmit.disabled = true;

    const token = localStorage.getItem("token");
    const usuarioId = localStorage.getItem("usuarioId");
    if (!usuarioId || !token) {
      mensaje.innerHTML = `<div class="alert alert-warning">Debés estar logueado para cargar un vehículo.</div>`;
      btnSubmit.textContent = originalText;
      btnSubmit.disabled = false;
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
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(vehiculo)
      });

      if (response.ok) {
        const data = await response.json();
        mensaje.innerHTML = `<div class="alert alert-success">Vehículo cargado con éxito.</div>`;
        form.reset();
        localStorage.setItem("vehiculoId", data.id ?? data.idVehiculo ?? '');
        setTimeout(() => {
            window.location.href = "addPublicacion.html";
        }, 1000); 
      } else if (response.status === 401 || response.status === 403){
        mensaje.innerHTML = `<div class="alert alert-danger">No autorizado. Iniciá sesión nuevamente.</div>`;
      }else{
        const errorText = await response.text();
        mensaje.innerHTML = `<div class="alert alert-danger">${errorText}</div>`;
      }
    } catch (error) {
      mensaje.innerHTML = `<div class="alert alert-danger">Error al conectar con el servidor.</div>`;
    } finally {
      btnSubmit.textContent = originalText;
      btnSubmit.disabled = false;
    }
  });
});
