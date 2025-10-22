import { URL_API } from '../constants/database.js';

const mensaje = document.getElementById("mensaje");
const avatar = document.querySelector('.profile-avatar-circle');
const userNombre = document.getElementById('user-nombre');
const userEmail = document.getElementById('user-email');
const userTel = document.getElementById('user-tel');
const nivelContainer = document.getElementById('nivel-container');
const accionesContainer = document.getElementById('acciones-container');
const btnSubirFoto = document.getElementById('btn-subir-foto');
const inputFoto = document.getElementById('file-fotoPerfil');

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

    if (usuario.profilePicUrl) {
      avatar.style.backgroundImage = `url("${usuario.profilePicUrl}")`;
    } else {
      avatar.style.backgroundImage = 'url("img/defaultProfile.jpg")';
    }

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

    const suscripcionWrapId = 'suscripcion-wrap';
const suscripcionWrap = document.createElement('div');
suscripcionWrap.id = suscripcionWrapId;
suscripcionWrap.className = 'mt-3';

if (usuario.quiereOferta === true) {
  suscripcionWrap.innerHTML = `
    <div class="d-flex align-items-center gap-2 p-2 rounded border bg-light-subtle">
      <span class="text-success fw-semibold">Plan mensual activo</span>
      <button id="btn-cancelar-oferta" class="btn btn-sm btn-outline-danger ms-auto">
        Cancelar suscripción
      </button>
    </div>
  `;
} else {
  suscripcionWrap.innerHTML = `
    <div class="d-flex align-items-center gap-2 p-2 rounded border" style="background:#f8f9fa;">
      <span class="text-muted small">Sin plan mensual activo</span>
    </div>
  `;
}

accionesContainer.insertAdjacentElement('afterend', suscripcionWrap);

// Listener del botón "Cancelar"
document.getElementById('btn-cancelar-oferta')?.addEventListener('click', async () => {
  const ok = confirm('¿Seguro querés cancelar la suscripción?');
  if (!ok) return;
  try {
    const token = localStorage.getItem("token");
    const usuarioId = localStorage.getItem("usuarioId");

    const resp = await fetch(`${URL_API}/usuarios/${usuarioId}/oferta/toggle`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!resp.ok) {
      const err = await resp.text();
      showMsg(err || 'No se pudo cancelar la suscripción', 'danger');
      return;
    }

    const data = await resp.json(); // { quiereOferta: false, message: ... }
    if (data?.quiereOferta === false) {
      // Refrescá solo el wrapper
      document.getElementById(suscripcionWrapId).innerHTML = `
        <div class="d-flex align-items-center gap-2 p-2 rounded border" style="background:#f8f9fa;">
          <span class="text-muted small">Suscripción cancelada</span>
        </div>
      `;
      showMsg('Suscripción cancelada correctamente', 'success');
    } else {
      showMsg('La suscripción siguió activa.', 'warning');
    }
  } catch (e) {
    console.error(e);
    showMsg('Error de conexión con el servidor', 'danger');
  }
});

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

    const editIcon = document.getElementById('avatar-edit');
    const avatarCircle = document.querySelector('.profile-avatar-circle');

    editIcon?.addEventListener('click', (e) => {
      e.preventDefault();
      inputFoto.click();
    });

    inputFoto?.addEventListener('change', async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append("file", file);

      try {
        showMsg("Subiendo foto de perfil...", "info");

        const uploadResponse = await fetch(`${URL_API}/usuarios/${usuarioId}/fotoPerfil`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });

        if (!uploadResponse.ok) {
          const errorMsg = await uploadResponse.text();
          showMsg(errorMsg || "Error al subir la foto de perfil.", "danger");
          return;
        }

        const nuevaUrl = await uploadResponse.text();
        avatarCircle.style.backgroundImage = `url("${nuevaUrl}")`;
        showMsg("Foto de perfil actualizada correctamente", "success");

      } catch (error) {
        console.error("Error al subir foto:", error);
        showMsg("Error de conexión con el servidor.", "danger");
      }
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
