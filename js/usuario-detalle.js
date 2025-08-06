// Simulación de usuarios cargados
const usuarios = [
  { id: 1, nombre: "Juan Pérez", email: "juan@example.com", rol: "Administrador" },
  { id: 2, nombre: "María Gómez", email: "maria@example.com", rol: "Cliente" },
  { id: 3, nombre: "Carlos López", email: "carlos@example.com", rol: "Cliente" }
];

// Obtener ID desde los parámetros de la URL
const params = new URLSearchParams(window.location.search);
const usuarioId = parseInt(params.get('id'));

// Buscar usuario por ID
const usuario = usuarios.find(u => u.id === usuarioId);

// Mostrar en pantalla
const contenedor = document.getElementById('usuario-detalle');

if (usuario) {
  contenedor.innerHTML = `
    <h3>${usuario.nombre}</h3>
    <p><strong>Email:</strong> ${usuario.email}</p>
    <p><strong>Rol:</strong> ${usuario.rol}</p>
  `;
} else {
  contenedor.innerHTML = `<p class="text-danger">Usuario no encontrado.</p>`;
}
