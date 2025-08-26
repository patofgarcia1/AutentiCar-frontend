// js/nav.js
document.addEventListener('DOMContentLoaded', async () => {
  const slot = document.getElementById('site-nav');
  if (!slot) return;

  // 1) Cargar el parcial e inyectarlo
  try {
    const resp = await fetch('partials/nav.html'); // ajustá la ruta si tu HTML está en subcarpetas
    const html = await resp.text();
    slot.innerHTML = html;
  } catch (e) {
    console.error('No se pudo cargar el nav:', e);
    return;
  }

  // 2) Ahora sí, consultamos los elementos dentro del nav inyectado
  const liLogin    = document.getElementById('nav-login');
  const liRegister = document.getElementById('nav-register');
  const liPerfil   = document.getElementById('nav-perfil');
  const liLogout   = document.getElementById('nav-logout');
  const logoutLink = document.getElementById('logoutLink');

  const token = localStorage.getItem('token');
  const hasSession = !!(token && token.trim().length);

  // 3) Mostrar/ocultar items según sesión
  if (hasSession) {
    liLogin?.classList.add('d-none');
    liRegister?.classList.add('d-none');
    liPerfil?.classList.remove('d-none');
    liLogout?.classList.remove('d-none');
  } else {
    liLogin?.classList.remove('d-none');
    liRegister?.classList.remove('d-none');
    liPerfil?.classList.add('d-none');
    liLogout?.classList.add('d-none');
  }

  // 4) Logout
  logoutLink?.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('usuarioId');
    localStorage.removeItem('token');
    localStorage.removeItem('usuarioIdVerif');
    localStorage.removeItem('vehiculoId');
    window.location.href = 'index.html';
  });
});
