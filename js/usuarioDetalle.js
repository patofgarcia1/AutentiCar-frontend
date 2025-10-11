import { URL_API } from '../constants/database.js';

const mensaje = document.getElementById("mensaje");
const avatar = document.querySelector('.profile-avatar-circle');
const userNombre = document.getElementById('user-nombre');
const userEmail = document.getElementById('user-email');
const userTel = document.getElementById('user-tel');
const nivelContainer = document.getElementById('nivel-container');
const accionesContainer = document.getElementById('acciones-container');

function showMsg(html, type = 'info') {
  if (!mensaje) return;
  mensaje.innerHTML = `<div class="alert alert-${type}">${html}</div>`;
}

document.addEventListener('DOMContentLoaded', async () => {
  const usuarioId = localStorage.getItem("usuarioId");
  const token = localStorage.getItem("token");

  if (!usuarioId) {
    showMsg("No se encontró un usuario logueado.", "warning");
    return;
  }
  if (!token) {
    showMsg("Sesión no válida. Iniciá sesión nuevamente.", "warning");
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
      showMsg("No autorizado. Iniciá sesión nuevamente.", "danger");
      return;
    }

    if (!response.ok) {
      const errorMsg = await response.text();
      showMsg(errorMsg || "Error al obtener datos del usuario", "danger");
      return;
    }

    const usuario = await response.json();

    const nivel = (usuario.nivelUsuario || 'REGISTRADO').toUpperCase();
    const rol = (localStorage.getItem('rol') || '').toUpperCase();
    const esTaller = rol === 'TALLER';

    // Mostrar datos
    userNombre.textContent = `${usuario.nombre} ${usuario.apellido}`;
    userEmail.textContent = usuario.mail;
    if (usuario.telefonoCelular) {
      userTel.textContent = usuario.telefonoCelular;
    }

    // Imagen (placeholder, por ahora)
    avatar.style.backgroundImage = 'url("img/avatar-placeholder.png")'; // imagen de prueba

    // Mostrar nivel de usuario
    if (nivel === 'REGISTRADO') {
      nivelContainer.innerHTML = `
        <div class="alert alert-warning mt-3" role="alert">
          Usuario no validado. Valídate <a href="validacionUsuario.html" class="alert-link">acá</a>.
        </div>
      `;
    } else if (nivel === 'PENDIENTE') {
      nivelContainer.innerHTML = `<div class="alert alert-info mt-3">Tu verificación está en revisión.</div>`;
    } else if (nivel === 'VALIDADO') {
      nivelContainer.innerHTML = `<div class="alert alert-success mt-3">Usuario validado.</div>`;
    } else if (nivel === 'RECHAZADO') {
      nivelContainer.innerHTML = `
        <div class="alert alert-danger mt-3">
          Usuario rechazado. Valídate nuevamente <a href="validacionUsuario.html" class="alert-link">acá</a>.
        </div>
      `;
    }

    // Botones dinámicos
    const botonesHTML = esTaller
      ? `
        <button id="btn-eventos" class="btn-primary-full">Mis Eventos</button>
      `
      : `
        <button id="btn-vehiculos" class="btn-primary-full">Mis Vehículos</button>
        <button id="btn-publicaciones" class="btn-primary-full">Mis Publicaciones</button>
        <button id="btn-eventos" class="btn-primary-full">Mis Eventos</button>
      `;
    accionesContainer.innerHTML = botonesHTML;

    // Listeners
    document.getElementById('btn-vehiculos')?.addEventListener('click', () => {
      window.location.href = `misVehiculos.html?usuario=${usuarioId}`;
    });
    document.getElementById('btn-publicaciones')?.addEventListener('click', () => {
      window.location.href = `misPublicaciones.html?usuario=${usuarioId}`;
    });
    document.getElementById('btn-eventos')?.addEventListener('click', () => {
      window.location.href = `misEventos.html?usuario=${usuarioId}`;
    });

    // Eliminar cuenta
    const btnEliminar = document.getElementById('btn-eliminar');
    btnEliminar.addEventListener('click', async () => {
      const confirmDelete = confirm("¿Seguro querés eliminar tu cuenta?");
      if (!confirmDelete) return;

      btnEliminar.textContent = "Eliminando...";
      btnEliminar.disabled = true;

      try {
        const deleteResp = await fetch(`${URL_API}/usuarios/${usuarioId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        const txt = await deleteResp.text();

        if (deleteResp.status === 401 || deleteResp.status === 403) {
          showMsg("No autorizado. Iniciá sesión nuevamente.", "danger");
          btnEliminar.textContent = "Eliminar cuenta";
          btnEliminar.disabled = false;
          return;
        }

        if (!deleteResp.ok) {
          showMsg(txt || "Error al eliminar usuario", "danger");
          btnEliminar.textContent = "Eliminar cuenta";
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
        btnEliminar.textContent = "Eliminar cuenta";
        btnEliminar.disabled = false;
      }
    });

  } catch (error) {
    console.error("Error fetching user:", error);
    showMsg("Error al conectar con el servidor.", "danger");
  }
});
