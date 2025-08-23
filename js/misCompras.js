import { URL_API } from '../constants/database.js';

document.addEventListener('DOMContentLoaded', async () => {
  const usuarioId = localStorage.getItem("usuarioId");
  const token = localStorage.getItem("token");
  const contenedor = document.getElementById('compras-lista');

  if (!usuarioId) {
    contenedor.innerHTML = `<div class="alert alert-warning">Debés iniciar sesión para ver tus compras.</div>`;
    return;
  }
  if (!token) {
    contenedor.innerHTML = `<div class="alert alert-warning">Sesión no válida. Iniciá sesión nuevamente.</div>`;
    // opcional: window.location.href = 'login.html';
    return;
  }

  try {
    const response = await fetch(`${URL_API}/usuarios/${usuarioId}/comprasRealizadas`, {
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

    const compras = await response.json();

    if (compras.length === 0) {
      contenedor.innerHTML = `<div class="alert alert-info">No tenés compras aún.</div>`;
      return;
    }

    // Procesar cada venta individualmente
    for (const venta of compras) {
      let html = `<div class="col"><div class="card h-100 shadow-sm"><div class="card-body">`;

      // 1. Obtener la publicación
      const pubResp = await fetch(`${URL_API}/publicaciones/${venta.idPublicacion}`);
      const publicacion = pubResp.ok ? await pubResp.json() : null;

      // 2. Obtener el vehículo
      let vehiculo = null;
      if (publicacion && publicacion.vehiculoId) {
        const vehiculoResp = await fetch(`${URL_API}/vehiculos/${publicacion.vehiculoId}`);
        vehiculo = vehiculoResp.ok ? await vehiculoResp.json() : null;
      }

      // 3. Obtener el vendedor
      let vendedor = null;
      const vendResp = await fetch(`${URL_API}/usuarios/${venta.idVendedor}`);
      vendedor = vendResp.ok ? await vendResp.json() : null;

      // 4. Armar HTML
      html += `
        <h5 class="card-title">${vehiculo ? vehiculo.marca + ' ' + vehiculo.modelo : 'Vehículo no disponible'}</h5>
        <p><strong>Precio de venta:</strong> $${venta.precio}</p>
        <p><strong>Fecha de venta:</strong> ${venta.fechaVenta}</p>
        <hr/>
        <h6>Datos del Vehículo</h6>
        ${vehiculo ? `
          <ul>
            <li><strong>Marca:</strong> ${vehiculo.marca}</li>
            <li><strong>Modelo:</strong> ${vehiculo.modelo}</li>
            <li><strong>Año:</strong> ${vehiculo.anio}</li>
            <li><strong>VIN:</strong> ${vehiculo.vin}</li>
            <li><strong>Kilometraje:</strong> ${vehiculo.kilometraje} km</li>
            <li><strong>Motor:</strong> ${vehiculo.motor}L</li>
            <li><strong>Color:</strong> ${vehiculo.color}</li>
            <li><strong>Combustible:</strong> ${vehiculo.tipoCombustible}</li>
            <li><strong>Transmisión:</strong> ${vehiculo.tipoTransmision}</li>
          </ul>
        ` : `<p class="text-muted">Datos del vehículo no disponibles.</p>`}
        <hr/>
        <h6>Vendedor</h6>
        <p>${vendedor ? vendedor.nombre + ' ' + vendedor.apellido : 'No disponible'}</p>
        <a href="publicacionDetalle.html?id=${venta.idPublicacion}" class="btn btn-outline-primary mt-2">Ver Publicación</a>
      `;

      html += `</div></div></div>`;
      contenedor.innerHTML += html;
    }

  } catch (error) {
    console.error("Error al traer compras:", error);
    contenedor.innerHTML = `<div class="alert alert-danger">Error al conectar con el servidor.</div>`;
  }
});
