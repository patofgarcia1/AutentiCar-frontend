const usuarios = [
  {
    id: 1,
    nombre: "Juan Pérez",
    email: "juan.perez@example.com",
    telefono: "123456789",
  },
  {
    id: 2,
    nombre: "María López",
    email: "maria.lopez@example.com",
    telefono: "987654321",
  }
];

const container = document.getElementById("usuarios-container");

usuarios.forEach(usuario => {
  const col = document.createElement("div");
  col.className = "col-md-4";
  col.innerHTML = `
    <div class="card h-100 shadow-sm">
      <div class="card-body">
        <h5 class="card-title">${usuario.nombre}</h5>
        <p class="card-text"><strong>Email:</strong> ${usuario.email}</p>
        <p class="card-text"><strong>Teléfono:</strong> ${usuario.telefono}</p>
        <a href="usuario-detalle.html?id=${usuario.id}" class="btn btn-primary">Ver detalle</a>
      </div>
    </div>
  `;
  container.appendChild(col);
});
