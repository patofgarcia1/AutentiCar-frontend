// js/publicaciones/api.js
import { URL_API } from '../../constants/database.js';
import { renderPublicaciones } from './render.js';

/**
 * Construye la URL de endpoint de publicaciones a partir del estado actual
 */
function endpointFromState(state) {
  const params = new URLSearchParams();

  // búsqueda por texto
  if (state.q) params.set('q', state.q);

  // filtros múltiples
  (state.marcas || []).forEach(m => params.append('marca', m));
  (state.colores || []).forEach(c => params.append('color', c));
  (state.anios || []).forEach(a => params.append('anio', String(a)));
  (state.roles || []).forEach(r => params.append('rol', r));

  // Filtros de precio y km (por ID de bucket)
  (state.priceIds || []).forEach(id => params.append('precioId', id));
  (state.kmIds || []).forEach(id => params.append('kmId', id));

  const query = params.toString();
  return query
    ? `${URL_API}/publicaciones/filtro?${query}`
    : `${URL_API}/publicaciones`;
}

export async function loadPublicaciones(state, { showLoading = true, silent = false } = {}) {
  const container = document.getElementById('lista-publicaciones');
  if (!container) return;

  if (showLoading) {
    container.innerHTML = `
      <div class="text-center py-5">
        <div class="spinner-border text-primary mb-3" role="status"></div>
        <p class="text-muted mb-0">Cargando publicaciones...</p>
      </div>`;
  }

  try {
    const endpoint = endpointFromState(state);
    const resp = await fetch(endpoint, {
      headers: { 'Accept': 'application/json', 'Cache-Control': 'no-cache' },
      cache: 'no-store'
    });

    if (!resp.ok) throw new Error(await resp.text());
    const data = await resp.json();

    // Si el backend devuelve un array vacío, lo manejamos desde render.js
    await renderPublicaciones(data);
  } catch (err) {
    console.error('Error al cargar publicaciones:', err);
    if (!silent) {
      container.innerHTML = `
        <div class="alert alert-danger mt-4" role="alert">
          <strong>Error:</strong> No se pudieron cargar las publicaciones.<br>
          <small>${err.message || 'Intente nuevamente más tarde.'}</small>
        </div>`;
    }
  }
}

/**
 * Carga una publicación individual (para detalle)
 */
export async function getPublicacionById(id) {
  try {
    const resp = await fetch(`${URL_API}/publicaciones/${id}`, {
      headers: { 'Accept': 'application/json' }
    });
    return resp.ok ? await resp.json() : null;
  } catch (err) {
    console.error('Error al obtener publicación', err);
    return null;
  }
}

/**
 * Crea una nueva publicación (para el formulario de alta)
 */
export async function crearPublicacion(payload, token) {
  try {
    const resp = await fetch(`${URL_API}/publicaciones`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    if (!resp.ok) throw new Error(await resp.text());
    return await resp.json();
  } catch (err) {
    console.error('Error al crear publicación', err);
    throw err;
  }
}

/**
 * Elimina una publicación por ID (solo admin o dueño)
 */
export async function eliminarPublicacion(id, token) {
  try {
    const resp = await fetch(`${URL_API}/publicaciones/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return resp.ok;
  } catch (err) {
    console.error('Error al eliminar publicación', err);
    return false;
  }
}

export async function loadPublicacionesPorUsuario(usuarioIdParam) {
  const container = document.getElementById('lista-publicaciones');
  if (!container) return;

  const usuarioId = usuarioIdParam || localStorage.getItem('usuarioId');
  const token = localStorage.getItem('token');

  if (!usuarioId || !token) {
    // Sin sesión válida → mandamos a login (o podés mostrar un mensaje)
    window.location.href = 'login.html';
    return;
  }

  container.innerHTML = `
    <div class="text-center py-5">
      <div class="spinner-border text-primary mb-3" role="status"></div>
      <p class="text-muted mb-0">Cargando publicaciones del concesionario...</p>
    </div>`;

  try {
    const resp = await fetch(`${URL_API}/usuarios/${usuarioId}/publicaciones`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Cache-Control': 'no-cache'
      },
      cache: 'no-store'
    });

    if (resp.status === 401 || resp.status === 403) {
      container.innerHTML = `<div class="alert alert-danger">No autorizado. Iniciá sesión nuevamente.</div>`;
      return;
    }

    if (!resp.ok) {
      const errTxt = await resp.text();
      throw new Error(errTxt || 'Error de servidor');
    }

    const data = await resp.json();
    await renderPublicaciones(data);
  } catch (err) {
    console.error('Error al cargar publicaciones del usuario:', err);
    container.innerHTML = `
      <div class="alert alert-danger mt-4" role="alert">
        <strong>Error:</strong> No se pudieron cargar las publicaciones del concesionario.<br>
        <small>${err.message || 'Intente nuevamente.'}</small>
      </div>`;
  }
}

export async function loadPublicacionesPorTaller(usuarioIdParam) {
  const container = document.getElementById('lista-publicaciones');
  if (!container) return;

  const usuarioId = usuarioIdParam || localStorage.getItem('usuarioId');
  const token = localStorage.getItem('token');

  if (!usuarioId || !token) {
    window.location.href = 'login.html';
    return;
  }

  container.innerHTML = `
    <div class="text-center py-5">
      <div class="spinner-border text-primary mb-3" role="status"></div>
      <p class="text-muted mb-0">Cargando publicaciones asignadas al taller...</p>
    </div>`;

  try {
    const resp = await fetch(`${URL_API}/usuarios/${usuarioId}/publicacionesTaller`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Cache-Control': 'no-cache'
      },
      cache: 'no-store'
    });

    if (resp.status === 401 || resp.status === 403) {
      container.innerHTML = `<div class="alert alert-danger">No autorizado. Iniciá sesión nuevamente.</div>`;
      return;
    }

    if (!resp.ok) {
      const errTxt = await resp.text();
      throw new Error(errTxt || 'Error del servidor');
    }

    const data = await resp.json();

    if (!data || data.length === 0) {
      container.innerHTML = `
        <div class="alert alert-info mt-4" role="alert">
          <strong>Sin publicaciones asignadas.</strong><br>
          Todavía no tenés vehículos asignados a tu taller.
        </div>`;
      return;
    }

    await renderPublicaciones(data);
  } catch (err) {
    console.error('Error al cargar publicaciones del taller:', err);
    container.innerHTML = `
      <div class="alert alert-danger mt-4" role="alert">
        <strong>Error:</strong> No se pudieron cargar las publicaciones del taller.<br>
        <small>${err.message || 'Intente nuevamente.'}</small>
      </div>`;
  }
}