import { URL_API } from '../constants/database.js';
import { isAdmin, isUser, isTaller, getSession } from './roles.js';

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const eventoId = params.get('id');
  const titulo = document.getElementById('titulo');
  const info = document.getElementById('info');
  const mensaje = document.getElementById('mensaje');
  const tipoTag = document.getElementById('tipoEventoTag');

  if (!info) {
    console.error('Elemento #info no encontrado');
    return;
  }

  function showMsg(html, type = 'info') {
    if (!mensaje) return;
    mensaje.innerHTML = `<div class="alert alert-${type}">${html}</div>`;
  }

  if (!eventoId) {
    titulo.textContent = "Error";
    info.innerHTML = `<div class="alert alert-danger">ID de evento no especificado en la URL.</div>`;
    return;
  }

  try {
    // 1) Traer detalle del evento
    const evResp = await fetch(`${URL_API}/eventos/${eventoId}`);
    if (!evResp.ok) {
      const msg = await evResp.text();
      titulo.textContent = "Evento no encontrado";
      info.innerHTML = `<div class="alert alert-danger">${msg}</div>`;
      return;
    }
    const ev = await evResp.json();

    // 2) Traer usuario público (creador), opcional
    let usuario = null;
    try {
      const usuarioResp = await fetch(`${URL_API}/usuarios/publico/${ev.idUsuario}`);
      usuario = usuarioResp.ok ? await usuarioResp.json() : null;
    } catch {}

    // 3) Traer vehículo (para saber dueño)
    let veh = null;
    try {
      const vResp = await fetch(`${URL_API}/vehiculos/${ev.idVehiculo}`);
      veh = vResp.ok ? await vResp.json() : null;
    } catch {}

    if (tipoTag) tipoTag.textContent = ev.tipoEvento ?? '—';

    // 3) Render
    titulo.textContent = ev.titulo || 'Evento';
    info.innerHTML = `
      <div class="evento-info-item">
        <img src="img/docIcono.png" alt="Descripción">
        <div>
          <p class="evento-info-label">Descripción</p>
          <p class="evento-info-value">${ev.descripcion || '—'}</p>
        </div>
      </div>
      <div class="evento-info-item">
        <img src="img/kilometrajeIcono.png" alt="Kilometraje">
        <div>
          <p class="evento-info-label">Kilometraje</p>
          <p class="evento-info-value">${ev.kilometrajeEvento ?? '—'} km</p>
        </div>
      </div>
      <div class="evento-info-item">
        <img src="img/calendarioIcono.png" alt="Fecha">
        <div>
          <p class="evento-info-label">Fecha</p>
          <p class="evento-info-value">${ev.fechaEvento ?? '—'}</p>
        </div>
      </div>
      <div class="evento-info-item">
        <img src="img/usuarioIcono.png" alt="Usuario">
        <div>
          <p class="evento-info-label">Registrado por</p>
          <p class="evento-info-value">${usuario ? `${usuario.nombre ?? ''} ${usuario.apellido ?? ''}` : '—'}</p>
        </div>
      </div>
    `;

    // dueño del vehículo (según tu DTO de VehiculosDTO: idUsuario)
    const ownerId = (veh?.idUsuario != null) ? Number(veh.idUsuario) : null;
    // creador del evento
    const creadorId = (ev?.idUsuario != null) ? Number(ev.idUsuario) : null;

    // Sesión
    const sess = getSession();                // { isLogged, userId, token, rol }
    const loggedId = (sess?.userId != null) ? Number(sess.userId) : null;
    const authToken = sess?.token || null;

    // Reglas
    const puedeEliminar =
      !!authToken && (
        isAdmin() ||
        (isTaller() && creadorId != null && loggedId === creadorId) ||
        (isUser()   && ownerId  != null && loggedId === ownerId)
      );
    
    const puedeAdjuntar = puedeEliminar;

    const btnAddDocs = document.getElementById('btnAddDocs');
    const btnEliminar = document.getElementById('btnEliminarEvento');
    const btnVerDocs = document.getElementById('btnVerDocs');

    // asignar href correcto
    if (btnVerDocs) btnVerDocs.href = `docsEvento.html?id=${ev.idEvento}`;
    if (btnAddDocs) btnAddDocs.href = `addDocumento.html?id=${ev.idVehiculo}&evento=${ev.idEvento}`;

    if (!puedeAdjuntar && btnAddDocs) btnAddDocs.style.display = 'none';
    if (!puedeEliminar && btnEliminar) btnEliminar.style.display = 'none';

    // const acciones = document.getElementById('acciones-evento');
    // acciones.innerHTML = [
    //   (puedeAdjuntar
    //     ? `<a href="addDocumento.html?id=${ev.idVehiculo}&evento=${ev.idEvento}" class="btn btn-success me-2">Agregar Documentos</a>`
    //     : ''),
    //   (puedeEliminar
    //     ? `<button id="btnEliminarEvento" class="btn btn-danger">Eliminar evento</button>`
    //     : '')
    // ].join('');


    // 4) Handler: eliminar evento
    if (puedeEliminar) {
      const btnEliminar = document.getElementById('btnEliminarEvento');
      btnEliminar.addEventListener('click', async () => {
        if (!confirm('¿Seguro que querés eliminar este evento?')) return;

        btnEliminar.disabled = true;
        const originalText = btnEliminar.textContent;
        btnEliminar.textContent = 'Eliminando...';

        if (!authToken) {
          showMsg("Sesión no válida. Iniciá sesión nuevamente.", "warning");
          btnEliminar.disabled = false;
          btnEliminar.textContent = originalText;
          return;
        }

        try {
          const resp = await fetch(`${URL_API}/eventos/${ev.idEvento}`, 
            { method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${authToken}`,   
                'Accept': 'application/json'
              } 
          });

          if (resp.status === 401 || resp.status === 403) {
            showMsg("No autorizado. Iniciá sesión nuevamente.", "danger");
            btnEliminar.textContent = originalText;
            btnEliminar.disabled = false;
            return;
          }
          
          if (!resp.ok) {
            const txt = await resp.text();
            showMsg(`Error al eliminar: ${txt}`, 'danger');
            return;
          }

          showMsg('Evento eliminado', 'success');
          setTimeout(() => {
            window.location.href = `eventosVehiculo.html?id=${ev.idVehiculo}`;
          }, 1000);
        } catch (e) {
          console.error(e);
          showMsg('No se pudo eliminar el evento', 'danger');
        } finally {
          btnEliminar.disabled = false;
          btnEliminar.textContent = originalText;
        }
      });
  }
    
  } catch (err) {
    console.error('eventoDetalle error:', err);
    titulo.textContent = "Error";
    info.innerHTML = `<div class="alert alert-danger">Error al conectar con el servidor.</div>`;
  }
});
