// js/nav.js
document.addEventListener('DOMContentLoaded', async () => {
  const slot = document.getElementById('site-nav');
  if (!slot) return;

  // Cargar el parcial e inyectarlo
  try {
    const resp = await fetch('partials/nav.html'); 
    slot.innerHTML = await resp.text();
  } catch (e) {
    console.error('No se pudo cargar el nav:', e);
    return;
  }

  // consultamos los elementos dentro del nav inyectado
  const liLogin    = document.getElementById('nav-login');
  const liRegister = document.getElementById('nav-register');
  const liPerfil   = document.getElementById('nav-perfil');
  const liLogout   = document.getElementById('nav-logout');
  const logoutLink = document.getElementById('logoutLink');

  const liAdminUsuarios  = document.getElementById('nav-admin-usuarios');
  const liAdminVehiculos = document.getElementById('nav-admin-vehiculos');

  const token = localStorage.getItem('token');
  const rol   = localStorage.getItem('rol'); 
  const hasSession = !!token;
  const isAdmin = rol === 'ADMIN' || rol === 'ROL_ADMIN';

  // Mostrar/ocultar items según sesión
  if (hasSession) {
    liLogin?.classList.add('d-none');
    liRegister?.classList.add('d-none');
    liPerfil?.classList.remove('d-none');
    liLogout?.classList.remove('d-none');

    // solo admin
    if (isAdmin) {
      liAdminUsuarios?.classList.remove('d-none');
      liAdminVehiculos?.classList.remove('d-none');
    } else {
      liAdminUsuarios?.classList.add('d-none');
      liAdminVehiculos?.classList.add('d-none');
    }
  } else {
    liLogin?.classList.remove('d-none');
    liRegister?.classList.remove('d-none');
    liPerfil?.classList.add('d-none');
    liLogout?.classList.add('d-none');
    liAdminUsuarios?.classList.add('d-none');
    liAdminVehiculos?.classList.add('d-none');
  }

  // Logout
  logoutLink?.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('usuarioId');
    localStorage.removeItem('token');
    localStorage.removeItem('usuarioIdVerif');
    localStorage.removeItem('vehiculoId');
    window.location.href = 'index.html';
  });
});
