import { URL_API } from '../constants/database.js';

document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('fileDorso');
  const btnSubirArchivo = document.getElementById('btnSubirArchivo');
  const dorsoEstado = document.getElementById('dorsoEstado');
  const mensaje = document.getElementById('mensaje');
  const btnEnviar = document.getElementById('btnEnviar');
  const inputDomicilio = document.getElementById('domicilio');

  const usuarioId = localStorage.getItem("usuarioId");
  const token = localStorage.getItem("token");

  if (!token || !usuarioId) {
    showMsg('Sesión no válida. Iniciá sesión nuevamente.', 'warning');
    return;
  }

  function showMsg(html, type = 'info') {
    if (!mensaje) return;
    mensaje.innerHTML = `<div class="alert alert-${type} mt-2">${html}</div>`;
  }

  function clearMsg() {
    if (mensaje) mensaje.innerHTML = '';
  }

  function setEstado(el, text, tone = 'secondary') {
    if (!el) return;
    el.innerHTML = `<span class="badge bg-${tone}">${text}</span>`;
  }

  const MAX_BYTES = 15 * 1024 * 1024; 
  function validarArchivo(file) {
    if (!file) { showMsg('Seleccioná un archivo.', 'warning'); return false; }
    if (file.size > MAX_BYTES) { showMsg('El archivo supera 15MB.', 'danger'); return false; }
    const okType = file.type.startsWith('image/') || file.type === 'application/pdf';
    if (!okType) { showMsg('Formato no soportado. Subí imagen o PDF.', 'warning'); return false; }
    return true;
  }

  initEstadoActual();

  async function initEstadoActual() {
    try {
      const resp = await fetch(`${URL_API}/usuarios/validacion/${usuarioId}/archivo`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });

      if (resp.ok) {
        const data = await resp.json().catch(() => ({}));
        if (data?.url) setEstado(dorsoEstado, 'Archivo cargado', 'success');
      }
    } catch (e) {
      console.warn('No se pudo consultar archivo existente', e);
    }
  }

  btnSubirArchivo?.addEventListener('click', async () => {
    clearMsg();
    const file = fileInput?.files?.[0];
    if (!validarArchivo(file)) return;

    const fd = new FormData();
    fd.append('file', file);

    const originalText = btnSubirArchivo.textContent;
    btnSubirArchivo.disabled = true;
    btnSubirArchivo.textContent = 'Subiendo...';

    try {
      const resp = await fetch(`${URL_API}/usuarios/validacion/archivo/${usuarioId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd
      });

      const txt = await resp.text().catch(() => '');
      if (resp.status === 401 || resp.status === 403) {
        showMsg('No autorizado. Iniciá sesión nuevamente.', 'danger');
        return;
      }
      if (!resp.ok) {
        showMsg(txt || 'No se pudo subir el archivo.', 'danger');
        return;
      }

      setEstado(dorsoEstado, 'Archivo cargado', 'success');
      showMsg('Archivo subido correctamente.', 'success');
    } catch (e) {
      console.error(e);
      showMsg('Error de conexión con el servidor.', 'danger');
    } finally {
      btnSubirArchivo.disabled = false;
      btnSubirArchivo.textContent = originalText;
    }
  });

  btnEnviar?.addEventListener('click', async () => {
    clearMsg();
    const domicilio = inputDomicilio?.value?.trim();
    if (!domicilio) {
      showMsg('Debés completar el domicilio antes de enviar.', 'warning');
      return;
    }

    btnEnviar.disabled = true;
    btnEnviar.textContent = 'Enviando...';

    try {
      const resp = await fetch(`${URL_API}/usuarios/validacion/enviarValidacion/${usuarioId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ domicilio })
      });

      const txt = await resp.text().catch(() => '');
      if (!resp.ok) {
        showMsg(txt || 'No se pudo enviar la validación.', 'danger');
        return;
      }

      showMsg('Validación enviada. Quedó en estado PENDIENTE.', 'success');
      setTimeout(() => {
        window.location.href = `usuarioDetalle.html?id=${usuarioId}`;
      }, 1500);
    } catch (e) {
      console.error(e);
      showMsg('Error de conexión con el servidor.', 'danger');
    } finally {
      btnEnviar.disabled = false;
      btnEnviar.textContent = 'Enviar para validar';
    }
  });
});
