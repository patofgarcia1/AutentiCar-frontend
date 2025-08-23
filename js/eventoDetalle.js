import { URL_API } from '../constants/database.js';

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const eventoId = params.get('id');
  const titulo = document.getElementById('titulo');
  const info = document.getElementById('info');
  const mensaje = document.getElementById('mensaje');
  const token = localStorage.getItem("token");

  if (!token) {
    mensaje.innerHTML = `<div class="alert alert-warning">Sesión no válida. Iniciá sesión nuevamente.</div>`;
    // opcional: window.location.href = 'login.html';
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

    // // 2) Traer usuario (vendedor/creador) si viene idUsuario
    // let usuarioNombre = 'No disponible';
    // if (ev.idUsuario != null) {
    //   try {
    //     const uResp = await fetch(`${URL_API}/usuarios/${ev.idUsuario}`);
    //     if (uResp.ok) {
    //       const u = await uResp.json();
    //       usuarioNombre = `${u.nombre ?? ''} ${u.apellido ?? ''}`.trim() || 'No disponible';
    //     }
    //   } catch {
    //     // si falla, dejamos "No disponible"
    //   }
    // }

    // 2) Obtener datos del usuario
    const usuarioResp = await fetch(`${URL_API}/usuarios/publico/${ev.idUsuario}`);
    const usuario = usuarioResp.ok ? await usuarioResp.json() : null;

    // 3) Render
    titulo.textContent = ev.titulo || 'Evento';

    info.innerHTML = `
      <p><strong>Descripción:</strong> ${ev.descripcion || '—'}</p>
      <p><strong>Kilometraje:</strong> ${ev.kilometrajeEvento ?? '—'}</p>
      <p><strong>Tipo de evento:</strong> ${ev.tipoEvento ?? '—'}</p>
      <p><strong>Validado por tercero:</strong> ${ev.validadoPorTercero ? 'Sí' : 'No'}</p>
      <p><strong>Fecha del evento:</strong> ${ev.fechaEvento ?? '—'}</p>
      <hr/>

      <p><strong>Usuario (que registro el evento):</strong> ${usuario ? `
        <p>${usuario.nombre || ''} ${usuario.apellido || ''}</p>
      ` : `<p class="text-muted">No se pudo cargar información del dueño.</p>`} </p>
      
      <hr/>
      <a href="addDocumento.html?id=${ev.idVehiculo}&evento=${ev.idEvento}" class="btn btn-primary">
        Agregar Documentos
      </a>
      <button id="btnEliminarEvento" class="btn btn-danger ms-2">Eliminar evento</button>
    `;

    // 4) Handler: eliminar evento
    const btnEliminar = document.getElementById('btnEliminarEvento');
    btnEliminar.addEventListener('click', async () => {
      if (!confirm('¿Seguro que querés eliminar este evento? Esta acción es permanente.')) return;

      btnEliminar.disabled = true;
      const originalText = btnEliminar.textContent;
      btnEliminar.textContent = 'Eliminando...';

      try {
        const resp = await fetch(`${URL_API}/eventos/${ev.idEvento}`, 
          { method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,   
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
    
  } catch (err) {
    console.error('eventoDetalle error:', err);
    titulo.textContent = "Error";
    info.innerHTML = `<div class="alert alert-danger">Error al conectar con el servidor.</div>`;
  }
});
