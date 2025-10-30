import { URL_API } from '../../constants/database.js';


export async function renderTalleresAsignados(usuarioId, token, contenedorDerecha) {
  const card = document.createElement('div');
  card.className = 'card card-autoplat p-4 mt-3 card-talleres-asignados';
  card.innerHTML = `
    <h6 class="fw-bold mb-3 text-primary">Talleres asignados</h6>
    <div class="talleres-lista text-center text-muted small mt-2">Cargando talleres...</div>
  `;
  contenedorDerecha.appendChild(card);

  const listaContenedor = card.querySelector('.talleres-lista');

  async function cargarTalleres() {
    listaContenedor.innerHTML = '<div class="text-muted small mt-2">Cargando talleres...</div>';

    try {
      const resp = await fetch(`${URL_API}/usuarios/${usuarioId}/talleres`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!resp.ok) throw new Error(await resp.text());
      const talleres = await resp.json();

      if (!talleres || talleres.length === 0) {
        listaContenedor.innerHTML = '<p class="text-muted small">No hay talleres asignados.</p>';
        return;
      }

      const talleresConDomicilio = await Promise.all(
        talleres.map(async (t) => {
          try {
            const respDomicilio = await fetch(`${URL_API}/concesionariaTallerVerif/${t.idUsuario}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!respDomicilio.ok) throw new Error();
            const data = await respDomicilio.json();
            return { ...t, domicilio: data?.domicilio || 'Domicilio no especificado' };
          } catch {
            return { ...t, domicilio: 'Domicilio no disponible' };
          }
        })
      );

      listaContenedor.innerHTML = '';
      talleresConDomicilio.forEach((t) => {
        const item = document.createElement('div');
        item.className = 'card card-taller p-2 mb-2 shadow-sm border-0 d-flex flex-row justify-content-between align-items-center';

        item.innerHTML = `
          <div>
            <p class="fw-bold mb-1">${t.nombre || ''} ${t.apellido || ''}</p>
            <p class="text-muted small mb-0">${t.domicilio}</p>
          </div>
          <button class="btn btn-sm btn-outline-danger btn-eliminar-taller" title="Eliminar taller asignado">❌</button>
        `;

        const btnEliminar = item.querySelector('.btn-eliminar-taller');
        btnEliminar.addEventListener('click', async () => {
          if (!confirm(`¿Seguro que querés quitar el taller "${t.nombre}" de tu cuenta?`)) return;

          btnEliminar.disabled = true;
          btnEliminar.textContent = '...';

          try {
            const resp = await fetch(`${URL_API}/usuarios/${usuarioId}/talleres/${t.idUsuario}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });

            if (!resp.ok) throw new Error(await resp.text());
            mostrarMensajeTemporal(listaContenedor, 'Taller eliminado correctamente.', 'success');
            await cargarTalleres(); 
          } catch (err) {
            console.error(err);
            mostrarMensajeTemporal(listaContenedor, 'Error al eliminar el taller.', 'danger');
          } finally {
            btnEliminar.disabled = false;
            btnEliminar.textContent = '❌';
          }
        });

        listaContenedor.appendChild(item);
      });
    } catch (err) {
      console.error('Error al cargar talleres asignados:', err);
      listaContenedor.innerHTML = `<p class="text-danger small">Error al cargar los talleres asignados.</p>`;
    }
  }

  function mostrarMensajeTemporal(contenedor, texto, tipo) {
    const alerta = document.createElement('div');
    alerta.className = `alert alert-${tipo} mt-3 py-2 small`;
    alerta.textContent = texto;
    contenedor.prepend(alerta);
    setTimeout(() => alerta.remove(), 3000);
  }


  await cargarTalleres();
}
