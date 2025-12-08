
export function renderHistorialCard({ puedeVer, isLogged, soloValidados, vehiculoId }) {
  if (puedeVer) {
    return `
      <div class="card card-autoplat p-4">
        <h6 class="fw-bold">Historial del Vehículo</h6>
        <p class="text-muted small mb-2">
          Incluye registros de documentos y eventos del vehículo.
        </p>
        <a href="docsVehiculo.html?id=${vehiculoId}" class="btn btn-outline-primary w-100 mb-2">Ver Documentos</a>
        <a href="eventosVehiculo.html?id=${vehiculoId}" class="btn btn-outline-primary w-100">Ver Eventos</a>

        <p id="doc-recomendados-resumen" class="text-muted small mb-3">
          Cargando estado de documentos recomendados...
        </p>
      </div>
    `;
  }

  if (isLogged && soloValidados && !puedeVer) {
    return `
      <div class="card card-autoplat p-4 text-center">
        <h6 class="fw-bold mb-2">Historial del Vehículo</h6>
        <p class="text-muted small mb-3">El historial está disponible solo para usuarios validados.</p>
        <a href="validacionUsuario.html" class="btn btn-outline-primary w-100">Validate acá</a>
      </div>
    `;
  }

  if (!isLogged) {
    return `
      <div class="card card-autoplat p-4 text-center">
        <h6 class="fw-bold mb-2">Historial del Vehículo</h6>
        <p class="text-muted small mb-3">Para ver el historial necesitás iniciar sesión.</p>
        <a href="login.html" class="btn btn-outline-primary w-100">Iniciá sesión acá</a>
      </div>
    `;
  }

  return '';
}
