import { URL_API } from '../constants/database.js';

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const docId = params.get('id');
  const titulo = document.getElementById('titulo');
  const info = document.getElementById('info');

  if (!docId) {
    titulo.textContent = "Error";
    info.innerHTML = `<div class="alert alert-danger">ID de documento no especificado en la URL.</div>`;
    return;
  }

  try {
    const url = `${URL_API}/documentos/${docId}`; // <-- usa docId (antes tenías documentoId)
    const response = await fetch(url);

    if (!response.ok) {
      const errorMsg = await response.text();
      titulo.textContent = "Documento no encontrado";
      info.innerHTML = `<div class="alert alert-danger">${errorMsg}</div>`;
      return;
    }

    const doc = await response.json();

    // Título: nombre del documento
    titulo.textContent = doc.nombre || "Documento sin nombre";

    // Botón "Ver Evento" solo si hay idEventoVehicular
    const botonEvento = doc.idEventoVehicular
      ? `<a href="eventoDetalle.html?id=${doc.idEventoVehicular}" class="btn btn-warning me-2">Ver Evento</a>`
      : "";

    // Botón "Ver documento" si hay URL
    const botonVerDoc = doc.urlDoc
      ? `<a href="${doc.urlDoc}" target="_blank" class="btn btn-outline-primary btn-sm">Ver documento</a>`
      : "";

    // Render
    info.innerHTML = `
      <p><strong>Tipo de documento:</strong> ${doc.tipoDoc}</p>
      <p><strong>Nivel de riesgo:</strong> ${doc.nivelRiesgo}</p>
      <p><strong>Fecha de subida:</strong> ${doc.fechaSubida ?? '—'}</p>
      <p><strong>Validado por IA:</strong> ${doc.validadoIA ? 'Sí' : 'No'}</p>
      <div class="mt-3">
        ${botonEvento}
        ${botonVerDoc}
      </div>
    `;
  } catch (error) {
    console.error("docDetalle error:", error);
    titulo.textContent = "Error";
    info.innerHTML = `<div class="alert alert-danger">No se pudo conectar con el servidor.</div>`;
  }
});
