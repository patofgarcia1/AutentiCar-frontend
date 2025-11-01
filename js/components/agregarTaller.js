import { URL_API } from '../../constants/database.js';

export function abrirBuscarTaller(usuarioId, token) {
  mostrarModalAgregarTaller(usuarioId, token); 
}

export function initAgregarTaller(usuarioId, token) {
  const cardAcciones = document.querySelector('.card-autoplat.p-4.mt-3 .d-flex');
  if (!cardAcciones) return;

  const btnAgregarTaller = document.createElement('button');
  btnAgregarTaller.className = 'btn btn-primary w-100';
  btnAgregarTaller.id = 'btnAgregarTaller';
  btnAgregarTaller.textContent = 'Agregar Taller';
  cardAcciones.appendChild(btnAgregarTaller);

  btnAgregarTaller.addEventListener('click', () => {
    mostrarModalAgregarTaller(usuarioId, token);
  });
}

function mostrarModalAgregarTaller(usuarioId, token) {
  const modal = document.createElement('div');
  modal.className = 'modal fade show';
  modal.style.display = 'block';
  modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
  modal.innerHTML = `
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content p-3">
        <div class="modal-header border-0 pb-0">
          <h5 class="modal-title text-primary fw-bold">Agregar Taller</h5>
          <button type="button" class="btn-close" id="btnCerrarModal"></button>
        </div>
        <div class="modal-body">
          <p>Buscá el taller por nombre, mail o teléfono:</p>
          <input type="text" class="form-control mb-2" id="inputBusquedaTaller">
          <div id="listaResultadosTaller" class="list-group"></div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const inputBusqueda = modal.querySelector('#inputBusquedaTaller');
  const listaResultados = modal.querySelector('#listaResultadosTaller');
  const btnCerrar = modal.querySelector('#btnCerrarModal');

  btnCerrar.addEventListener('click', () => modal.remove());

  let timeout = null;

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
        const resp = await fetch(`${URL_API}/usuarios/talleres/buscar?q=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!resp.ok) throw new Error(await resp.text());
        const talleres = await resp.json();
        renderResultadosTaller(talleres, listaResultados, usuarioId, token, modal);
      } catch (err) {
        console.error(err);
        listaResultados.innerHTML = `<div class="text-danger small mt-2">No se encontraron coincidencias</div>`;
      }
    }, 400);
  });
}


function renderResultadosTaller(talleres, contenedor, usuarioId, token, modal) {
  contenedor.innerHTML = '';

  if (!talleres || talleres.length === 0) {
    contenedor.innerHTML = '<p class="text-muted small">Sin resultados.</p>';
    return;
  }

  talleres.forEach(t => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'list-group-item list-group-item-action';
    item.innerHTML = `
      <div><strong>${t.nombre}</strong></div>
      <div class="small text-muted">${t.mail || ''}</div>
      <div class="small">${t.telefonoCelular || ''}</div>
    `;

    item.addEventListener('click', async () => {
      if (!confirm(`¿Querés asignar el taller "${t.nombre}" a tu cuenta?`)) return;
      await agregarTaller(usuarioId, t.idUsuario, token, modal);
    });

    contenedor.appendChild(item);
  });
}

async function agregarTaller(usuarioId, tallerId, token, modal) {
  
  const cuerpoModal = modal.querySelector('.modal-body');
  let alertaError = cuerpoModal.querySelector('.alert-error');

  if (alertaError) alertaError.remove();

  try {
    const resp = await fetch(`${URL_API}/usuarios/${usuarioId}/talleres/${tallerId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!resp.ok) {
      const texto = await resp.text();
      throw new Error(texto);
    }

    mostrarModalExito('¡El taller fue agregado correctamente!');
    modal.remove();
    window.dispatchEvent(new CustomEvent('taller:agregado'));
  } catch (err) {
    alertaError = document.createElement('div');
    alertaError.className = 'alert alert-danger alert-error mt-3';
    alertaError.innerHTML = `
      <strong>${err.message || 'No se pudo agregar el taller.'}
    `;
    cuerpoModal.appendChild(alertaError);
    setTimeout(() => alertaError.remove(), 4000);
  }
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

export function abrirModalAgregarTaller() {
  const modal = bootstrap.Modal.getOrCreateInstance(
    document.getElementById('modalAgregarTaller')
  );
  modal.show();
}
