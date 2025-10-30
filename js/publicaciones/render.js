
import { URL_API } from '../../constants/database.js';

const PLACEHOLDER = 'https://dummyimage.com/600x400/efefef/aaaaaa&text=Sin+foto';
const SIMBOLOS = { PESOS: '$', DOLARES: 'U$D' };

const ROL_LABEL = {
  CONCESIONARIO: 'Concesionario',
  PARTICULAR: 'Particular',
  TALLER: 'Taller',
  ADMIN: 'Admin'
};

const toThumb = (url) =>
  url ? url.replace('/upload/', '/upload/w_500,h_250,c_fill,f_auto,q_auto/') : null;

const resolveUsuarioId = (pub) =>
  pub?.usuarioId ?? pub?.usuario?.idUsuario ?? pub?.usuario?.id ?? null;

const resolveVehiculoId = (pub) =>
  pub?.vehiculoId ?? pub?.vehiculo?.idVehiculo ?? pub?.idVehiculo ?? null;

async function fetchUsuarioPublico(usuarioId) {
  try {
    const r = await fetch(`${URL_API}/usuarios/publico/${usuarioId}`, {
      headers: { 'Accept': 'application/json', 'Cache-Control': 'no-cache' },
      cache: 'no-store'
    });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}

async function fetchVehiculoInfo(vehiculoId) {
  try {
    const r = await fetch(`${URL_API}/vehiculos/${vehiculoId}`);
    if (!r.ok) return null;
    const v = await r.json();
    return {
      portada: toThumb(v.portadaUrl) || null,
      anio: v.anio ?? null,
      kilometraje: v.kilometraje ?? null
    };
  } catch {
    return null;
  }
}

export async function renderPublicaciones(list) {
  const container = document.getElementById('lista-publicaciones');
  if (!Array.isArray(list) || list.length === 0) {
    container.innerHTML = `<div class="alert alert-info">No hay publicaciones disponibles.</div>`;
    return;
  }

  const vehiculosInfo = await Promise.all(
    list.map(async (pub) => {
      const vid = resolveVehiculoId(pub);
      return vid ? await fetchVehiculoInfo(vid) : {};
    })
  );

  const usuariosInfo = await Promise.all(
    list.map(async (pub) => {
      const uid = resolveUsuarioId(pub);
      return uid ? await fetchUsuarioPublico(uid) : null;
    })
  );

  container.innerHTML = list.map((pub, i) => {
    const pubId = pub.idPublicacion;
    const info = vehiculosInfo[i] || {};
    const uinfo = usuariosInfo[i] || null;
    const img = info.portada || PLACEHOLDER;
    const anio = info.anio ?? '—';
    const km = info.kilometraje ? info.kilometraje.toLocaleString('es-AR') : '—';
    const symbol = SIMBOLOS[(pub.moneda || 'PESOS').toUpperCase()] || '$';
    const precioStr = (typeof pub.precio === 'number')
      ? pub.precio.toLocaleString('es-AR')
      : (pub.precio ?? '—');
    const rol = uinfo?.rol || null;
    const rolLabel = rol ? (ROL_LABEL[rol] || rol) : '—';

    return `
      <div class="col">
        <div class="card card-auto h-100 border-0 shadow-sm">
          <a href="publicacionDetalle.html?id=${pubId}">
            <img src="${img}" class="card-img-top rounded-top" alt="Imagen del vehículo"
              onerror="this.onerror=null;this.src='${PLACEHOLDER}'" />
          </a>
          <div class="card-body d-flex flex-column">
            <h5 class="card-title text-dark fw-bold">${pub.titulo ?? 'Publicación'}</h5>
            <p class="text-muted mb-2">${anio} | ${km} km</p>
            <p class="text-muted small mb-2"><span class="fw-semibold">Vendido por:</span> ${rolLabel}</p>
            <p class="precio mt-auto mb-3">${symbol} ${precioStr}</p>
          </div>
        </div>
      </div>`;
  }).join('');
}
