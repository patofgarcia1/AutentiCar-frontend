import { URL_API } from '../constants/database.js';

const mensaje = document.getElementById("mensaje");
function showMsg(html, type='info') {
  if (!mensaje) return;
  mensaje.innerHTML = `<div class="alert alert-${type}">${html}</div>`;
}

document.addEventListener('DOMContentLoaded', async () => {
  const usuarioId = localStorage.getItem("usuarioId");
  const token = localStorage.getItem("token");
  const container = document.getElementById('usuario-detalle');

  if (!usuarioId) {
    container.innerHTML = `<div class="alert alert-warning">No se encontró un usuario logueado.</div>`;
    return;
  }
  if (!token) {
    container.innerHTML = `<div class="alert alert-warning">Sesión no válida. Iniciá sesión nuevamente.</div>`;
    // opcional: window.location.href = 'login.html';
    return;
  }

  try {
    const response = await fetch(`${URL_API}/usuarios/${usuarioId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (response.status === 401 || response.status === 403) {
      container.innerHTML = `<div class="alert alert-danger">No autorizado. Iniciá sesión nuevamente.</div>`;
      // opcional: window.location.href = 'login.html';
      return;
    }
    
    if (!response.ok) {
      const errorMsg = await response.text();
      container.innerHTML = `<div class="alert alert-danger">${errorMsg}</div>`;
      return;
    }

    const usuario = await response.json();

    // Render datos + botones
    container.innerHTML = `
      <p><strong>Nombre:</strong> ${usuario.nombre}</p>
      <p><strong>Apellido:</strong> ${usuario.apellido}</p>
      <p><strong>Email:</strong> ${usuario.mail}</p>
      <div class="mt-4">
        <button class="btn btn-outline-primary m-1" id="btn-compras">Mis Compras</button>
        <button class="btn btn-outline-secondary m-1" id="btn-ventas">Mis Ventas</button>
        <button class="btn btn-outline-success m-1" id="btn-vehiculos">Mis Vehículos</button>
        <button class="btn btn-outline-warning m-1" id="btn-publicaciones">Mis Publicaciones</button>
        <button class="btn btn-outline-info m-1" id="btn-eventos">Mis Eventos</button>
      </div>
      <div class="mt-4">
        <button class="btn btn-danger" id="btn-eliminar">Eliminar Cuenta</button>
      </div>
    `;

    // Navegación
    document.getElementById('btn-compras').addEventListener('click', () => {
      window.location.href = `misCompras.html?usuario=${usuarioId}`;
    });
    document.getElementById('btn-ventas').addEventListener('click', () => {
      window.location.href = `misVentas.html?usuario=${usuarioId}`;
    });
    document.getElementById('btn-vehiculos').addEventListener('click', () => {
      window.location.href = `misVehiculos.html?usuario=${usuarioId}`;
    });
    document.getElementById('btn-publicaciones').addEventListener('click', () => {
      window.location.href = `misPublicaciones.html?usuario=${usuarioId}`;
    });
    document.getElementById('btn-eventos').addEventListener('click', () => {
      window.location.href = `misEventos.html?usuario=${usuarioId}`;
    });

    // Eliminar cuenta
    const btnEliminar = document.getElementById('btn-eliminar');
    btnEliminar.addEventListener('click', async () => {
      const confirmDelete = confirm("¿Seguro quieres eliminar tu cuenta?");
      if (!confirmDelete) return;

      btnEliminar.textContent = "Eliminando...";
      btnEliminar.disabled = true;

      try {
        const deleteResp = await fetch(`${URL_API}/usuarios/${usuarioId}`, 
          { method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,   
              'Accept': 'application/json'
            } 
          });
        const txt = await deleteResp.text();           // <— lee SIEMPRE el body

        if (deleteResp.status === 401 || deleteResp.status === 403) {
          showMsg("No autorizado. Iniciá sesión nuevamente.", "danger");
          btnEliminar.textContent = "Eliminar Cuenta";
          btnEliminar.disabled = false;
          return;
        }

        if (!deleteResp.ok) {
            console.error('Eliminar cuenta falló:', txt);
            showMsg(txt || "Error al eliminar usuario", "danger");
            btnEliminar.textContent = "Eliminar Cuenta";
            btnEliminar.disabled = false;
            return;
        }

        showMsg("Usuario eliminado correctamente", "success");
        localStorage.removeItem("usuarioId");
        localStorage.removeItem("token");

        setTimeout(() => {
          window.location.href = "index.html";
        }, 2000);   

      } catch (err) {
        console.error("Error al eliminar usuario:", err);
        showMsg("Error de conexión con el servidor", "danger");
        btnEliminar.textContent = "Eliminar Cuenta";
        btnEliminar.disabled = false;
      }
    });

  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">Error al conectar con el servidor.</div>`;
    console.error("Error fetching user:", error);
  }
});
