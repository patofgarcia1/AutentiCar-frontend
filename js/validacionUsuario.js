
import { URL_API } from '../constants/database.js';

document.addEventListener('DOMContentLoaded', () => {
  const fileFrente      = document.getElementById('fileFrente');
  const btnSubirFrente  = document.getElementById('btnSubirFrente');
  const frenteEstado    = document.getElementById('frenteEstado');
  const fileDorso       = document.getElementById('fileDorso');
  const btnSubirDorso   = document.getElementById('btnSubirDorso');
  const dorsoEstado     = document.getElementById('dorsoEstado');
  const mensaje         = document.getElementById('mensaje');
  const usuarioId = localStorage.getItem("usuarioId");
  const token = localStorage.getItem('token');

  if (!token) {
    showMsg('Sesión no válida. Iniciá sesión nuevamente.', 'warning');
    return;
  }

  function showMsg(html, type='info') {
    if (!mensaje) return;
    mensaje.innerHTML = `<div class="alert alert-${type}">${html}</div>`;
  }

  function clearMsg() {
    if (mensaje) mensaje.innerHTML = '';
  }

  function setEstado(el, text, tone='secondary') {
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

      const f = await fetch(`${URL_API}/usuarios/validacion/frente-url`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      if (f.ok) {
        const data = await f.json().catch(() => ({}));
        if (data?.url) setEstado(frenteEstado, 'Frente cargado', 'success');
      }

      const d = await fetch(`${URL_API}/usuarios/validacion/dorso-url`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      if (d.ok) {
        const data = await d.json().catch(() => ({}));
        if (data?.url) setEstado(dorsoEstado, 'Dorso cargado', 'success');
      }
    } catch (e) {
      console.warn('No se pudo consultar estado inicial de DNI', e);
    }
  }

  async function subirArchivo(endpoint, file, btn, estadoEl, etiquetaOk) {
    clearMsg();
    if (!validarArchivo(file)) return;

    const fd = new FormData();
    fd.append('file', file);

    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Subiendo...';

    try {
      const resp = await fetch(`${URL_API}${endpoint}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
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

      setEstado(estadoEl, etiquetaOk, 'success');
      showMsg('Archivo subido con éxito.', 'success');
    } catch (e) {
      console.error(e);
      showMsg('Error de conexión con el servidor.', 'danger');
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  }

  btnSubirFrente?.addEventListener('click', async () => {
    const file = fileFrente?.files?.[0];
    await subirArchivo('/usuarios/validacion/frente', file, btnSubirFrente, frenteEstado, 'Frente cargado');
  });

  btnSubirDorso?.addEventListener('click', async () => {
    const file = fileDorso?.files?.[0];
    await subirArchivo('/usuarios/validacion/dorso', file, btnSubirDorso, dorsoEstado, 'Dorso cargado');
  });

  const btnEnviar = document.getElementById('btnEnviar');
  btnEnviar?.addEventListener('click', async () => {
    clearMsg();
    btnEnviar.disabled = true;
    btnEnviar.textContent = 'Enviando...';
    try {
      const resp = await fetch(`${URL_API}/usuarios/validacion/enviar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const txt = await resp.text().catch(() => '');
      if (!resp.ok) {
        showMsg(txt || 'No se pudo enviar la validación.', 'danger');
        return;
      }
      showMsg('Enviado para validación. Quedó en estado PENDIENTE.', 'success');
      setTimeout(() => { 
        window.location.href = `usuarioDetalle.html?id=${usuarioId}`;
      }, 1000);
    } catch (e) {
      showMsg('Error de conexión con el servidor.', 'danger');
    } finally {
      btnEnviar.disabled = false;
      btnEnviar.textContent = 'Enviar para validar';
    }
  });
});
