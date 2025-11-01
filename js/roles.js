
export function getSession() {
  return {
    token: localStorage.getItem('token') || '',
    userId: parseInt(localStorage.getItem('usuarioId') || '0', 10) || null,
    rol: localStorage.getItem('rol') || '' 
  };
}

export function isLogged() {
  return !!getSession().token;
}

export function isAdmin() {
  return getSession().rol === 'ADMIN';
}

export function isTaller() {
  return getSession().rol === 'TALLER';
}

export function isUser() {
  const r = getSession().rol;
  return r === 'PARTICULAR' || r === 'CONCESIONARIO';
}

export function isVisitor() {
  const { token, rol } = getSession();
  return !token || !rol;
}

export function showIf(el, cond) {
  if (!el) return;
  el.classList.toggle('d-none', !cond);
}
