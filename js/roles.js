
export function getSession() {
  return {
    token: localStorage.getItem('token') || '',
    userId: parseInt(localStorage.getItem('usuarioId') || '0', 10) || null,
    rol: localStorage.getItem('rol') || '' // "ADMIN" | "TALLER" | "PARTICULAR" | "CONCESIONARIO" | ''
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

// “Usuario final”: PARTICULAR o CONCESIONARIO
export function isUser() {
  const r = getSession().rol;
  return r === 'PARTICULAR' || r === 'CONCESIONARIO';
}

export function isVisitor() {
  // sin token o sin rol => visitante
  const { token, rol } = getSession();
  return !token || !rol;
}

// helper visual rápido
export function showIf(el, cond) {
  if (!el) return;
  el.classList.toggle('d-none', !cond);
}
