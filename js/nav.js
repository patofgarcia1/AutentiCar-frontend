// js/nav.js
document.addEventListener('DOMContentLoaded', async () => {
  const slot = document.getElementById('site-nav');
  if (!slot) return;

  // Cargar el parcial e inyectarlo
  try {
    const resp = await fetch('/partials/nav.html'); 
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
  const liFavoritos = document.getElementById('nav-favoritos');

  const liAdminUsuarios  = document.getElementById('nav-admin-usuarios');
  const liConcesionarioPublicaciones = document.getElementById('nav-concesionario-publicaciones');

  const linkInicio = document.querySelector('a.nav-link[href="index.html"]');
  const brandLink  = document.querySelector('.navbar-brand');

  const token = localStorage.getItem('token');
  const rol   = localStorage.getItem('rol'); 
  const hasSession = !!token;
  const isAdmin = rol === 'ADMIN';
  const isConcesionario = rol === 'CONCESIONARIO';

  // Mostrar/ocultar items según sesión
  if (hasSession) {
    liLogin?.classList.add('d-none');
    liRegister?.classList.add('d-none');
    liFavoritos?.classList.remove('d-none');
    liPerfil?.classList.remove('d-none');
    liLogout?.classList.remove('d-none');

    // solo admin
    if (isAdmin) {
      liAdminUsuarios?.classList.remove('d-none');
    } else {
      liAdminUsuarios?.classList.add('d-none');
    }

    if (isConcesionario) {
      liConcesionarioPublicaciones?.classList.remove('d-none');
    } else {
      liConcesionarioPublicaciones?.classList.add('d-none');
    }

  } else {
    liLogin?.classList.remove('d-none');
    liRegister?.classList.remove('d-none');
    liPerfil?.classList.add('d-none');
    liLogout?.classList.add('d-none');
    liAdminUsuarios?.classList.add('d-none');
    liFavoritos?.classList.add('d-none');
  }

  if (isConcesionario) {
    linkInicio?.setAttribute('href', 'inicioConcesionario.html');
    brandLink?.setAttribute('href', 'inicioConcesionario.html');
  } else {
    linkInicio?.setAttribute('href', 'index.html');
    brandLink?.setAttribute('href', 'index.html');
  }


  logoutLink?.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('usuarioId');
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    localStorage.removeItem('usuarioIdVerif');
    localStorage.removeItem('vehiculoId');
    window.location.href = 'index.html';
  });
  
});
