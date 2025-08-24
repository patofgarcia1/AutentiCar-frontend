
import { URL_API } from '../constants/database.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-vehiculo');
  const mensaje = document.getElementById('mensaje');
  const btnSubmit = form.querySelector('button[type="submit"]');

  const token = localStorage.getItem("token");
  const usuarioId = localStorage.getItem("usuarioId");
  const originalText = btnSubmit.textContent;

  if (!usuarioId || !token) {
    mensaje.innerHTML = `<div class="alert alert-warning">Debés estar logueado para cargar un vehículo.</div>`;
    btnSubmit.textContent = originalText;
    btnSubmit.disabled = false;
    return;
  }

  let esAdmin = false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    esAdmin = payload?.rol === 'ROL_ADMIN';
  } catch {}
  const grpDestino = document.getElementById('grp-usuario-destino');
  if (grpDestino) grpDestino.classList.toggle('d-none', !esAdmin);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    btnSubmit.textContent = 'Guardando...';
    btnSubmit.disabled = true;


    const formData = new FormData(form);
    const datos = Object.fromEntries(formData.entries());

    // Armá el payload base (sin usuarioId)
    const vehiculo = {
      vin: datos.vin,
      marca: datos.marca,
      modelo: datos.modelo,
      anio: parseInt(datos.anio, 10),
      kilometraje: parseInt(datos.kilometraje, 10),
      puertas: parseInt(datos.puertas, 10),
      motor: parseFloat(datos.motor),
      color: datos.color,
      tipoCombustible: datos.tipoCombustible,
      tipoTransmision: datos.tipoTransmision
      // NO ponemos usuarioId acá por defecto
    };

    // Si es ADMIN y completó usuario destino, lo incluimos
    if (esAdmin) {
      const usuarioIdDestinoStr = (document.getElementById('usuarioIdDestino')?.value || '').trim();
      if (usuarioIdDestinoStr) {
        const usuarioIdDestino = Number(usuarioIdDestinoStr);
        if (!Number.isNaN(usuarioIdDestino) && usuarioIdDestino > 0) {
          vehiculo.usuarioId = usuarioIdDestino; // el back solo lo usará si sos ADMIN
        } else {
          mensaje.innerHTML = `<div class="alert alert-danger">El ID de usuario destino no es válido.</div>`;
          btnSubmit.textContent = originalText;
          btnSubmit.disabled = false;
          return;
        }
      }
    }
    // Si NO es admin, no mandamos usuarioId. El back asigna al dueño = id del token.

    try {
      const response = await fetch(`${URL_API}/vehiculos`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(vehiculo)
      });

      if (response.status === 401 || response.status === 403) {
        mensaje.innerHTML = `<div class="alert alert-danger">No autorizado. Iniciá sesión nuevamente.</div>`;
        return;
      }

      if (response.status === 409) {
        const txt = await response.text();
        mensaje.innerHTML = `<div class="alert alert-warning">${txt || 'Conflicto: posiblemente VIN duplicado.'}</div>`;
        return;
      }

      if (!response.ok) {
        const txt = await response.text();
        mensaje.innerHTML = `<div class="alert alert-danger">${txt || 'Error al guardar el vehículo.'}</div>`;
        return;
      }

      const data = await response.json().catch(() => ({}));
      mensaje.innerHTML = `<div class="alert alert-success">Vehículo cargado con éxito.</div>`;
      form.reset();
      localStorage.setItem("vehiculoId", data.id ?? data.idVehiculo ?? '');
      setTimeout(() => { window.location.href = "addPublicacion.html"; }, 1000);
      
    } catch (error) {
      console.error(error);
      mensaje.innerHTML = `<div class="alert alert-danger">Error al conectar con el servidor.</div>`;
    } finally {
      btnSubmit.textContent = originalText;
      btnSubmit.disabled = false;
    }
  });
});
