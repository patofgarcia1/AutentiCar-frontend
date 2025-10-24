import { URL_API } from '../../constants/database.js';

/**
 * Inicializa el flujo de transferencia de titularidad.
 * @param {number} vehiculoId - ID del vehículo actual
 * @param {string} token - Token JWT del usuario autenticado
 */
export function initTransferirTitularidad(vehiculoId, token) {
  // Insertar botón "Vendí mi auto" dentro del panel de acciones del dueño
  const cardAcciones = document.querySelector('.card-autoplat.p-4.mt-3 .d-flex');
  if (!cardAcciones) return;

  const btnTransferir = document.createElement('button');
  btnTransferir.className = 'btn btn-success w-100';
  btnTransferir.id = 'btnTransferirTitular';
  btnTransferir.textContent = 'Vendí mi auto';
  cardAcciones.appendChild(btnTransferir);

  // === Evento click ===
  btnTransferir.addEventListener('click', () => {
    mostrarModalTransferencia(vehiculoId, token);
  });
}

/**
 * Crea y muestra la modal de búsqueda del nuevo titular.
 */
function mostrarModalTransferencia(vehiculoId, token) {
  // Crear overlay/modal básico
  const modal = document.createElement('div');
  modal.className = 'modal fade show';
  modal.style.display = 'block';
  modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
  modal.innerHTML = `
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content p-3">
        <div class="modal-header border-0 pb-0">
          <h5 class="modal-title text-success fw-bold">¡Felicitaciones!</h5>
          <button type="button" class="btn-close" id="btnCerrarModal"></button>
        </div>
        <div class="modal-body">
          <p>Indica a quién se lo vendiste:</p>
          <input type="text" class="form-control mb-2" id="inputBusquedaUsuario" placeholder="Buscar por nombre o apellido...">
          <div id="listaResultados" class="list-group"></div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const inputBusqueda = modal.querySelector('#inputBusquedaUsuario');
  const listaResultados = modal.querySelector('#listaResultados');
  const btnCerrar = modal.querySelector('#btnCerrarModal');

  btnCerrar.addEventListener('click', () => modal.remove());

  let timeout = null;

  // Buscar mientras el usuario escribe
  inputBusqueda.addEventListener('input', () => {
    const query = inputBusqueda.value.trim();
    clearTimeout(timeout);

    if (query.length < 2) {
      listaResultados.innerHTML = '';
      return;
    }

    listaResultados.innerHTML = '<div class="text-muted small mt-2">Buscando...</div>';

    timeout = setTimeout(async () => {
      try {
        const resp = await fetch(`${URL_API}/usuarios/buscar?q=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!resp.ok) throw new Error(await resp.text());
        const usuarios = await resp.json();
        renderResultados(usuarios, listaResultados, vehiculoId, token, modal);
      } catch (err) {
        console.error(err);
        listaResultados.innerHTML = `<div class="text-danger small mt-2">No se encontraron coincidencias</div>`;
      }
    }, 400);
  });
}

/**
 * Renderiza los resultados de búsqueda.
 */
function renderResultados(usuarios, contenedor, vehiculoId, token, modal) {
  contenedor.innerHTML = '';

  if (!usuarios || usuarios.length === 0) {
    contenedor.innerHTML = '<p class="text-muted small">Sin resultados.</p>';
    return;
  }

  usuarios.forEach(u => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'list-group-item list-group-item-action';
    item.innerHTML = `
      <div><strong>${u.nombre} ${u.apellido}</strong></div>
      <div class="small text-muted">${u.mail || ''}</div>
    `;

    item.addEventListener('click', async () => {
      if (!confirm(`¿Confirmás que le vendiste el auto a ${u.nombre} ${u.apellido}?`)) return;
      await transferirTitularidad(vehiculoId, u.idUsuario, token, modal);
    });

    contenedor.appendChild(item);
  });
}

/**
 * Llama al endpoint del backend para transferir titularidad.
 */
async function transferirTitularidad(vehiculoId, nuevoTitularId, token, modal) {
  try {
    const resp = await fetch(`${URL_API}/vehiculos/${vehiculoId}/transferir?nuevoTitularId=${nuevoTitularId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!resp.ok) throw new Error(await resp.text());

    mostrarModalExito('¡El vehículo fue transferido correctamente!');
    modal.remove();
    setTimeout(() => window.location.reload(), 1800);
  } catch (err) {
    console.error(err);
    alert('Error al transferir titularidad: ' + (err.message || ''));
  }

  function mostrarModalExito(mensaje) {
    const modalExito = document.createElement('div');
    modalExito.className = 'modal fade show';
    modalExito.style.display = 'block';
    modalExito.style.backgroundColor = 'rgba(0,0,0,0.4)';
    modalExito.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-success border-3 p-4 text-center">
            <h5 class="text-success fw-bold mb-2">¡Éxito!</h5>
            <p class="mb-0">${mensaje}</p>
        </div>
        </div>
    `;
    document.body.appendChild(modalExito);

    setTimeout(() => {
        modalExito.classList.remove('show');
        modalExito.remove();
    }, 3000);
    }
}
