
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  const publicaciones = [
    { id: 1, titulo: "Venta de Toyota Corolla", descripcion: "Excelente estado, único dueño." },
    { id: 2, titulo: "Ford Focus en venta", descripcion: "Recién hecho el service completo." },
    { id: 3, titulo: "Chevrolet Cruze", descripcion: "Muy buen auto para ciudad y ruta." }
  ];

  const pub = publicaciones.find(p => p.id == id);
  const contenedor = document.getElementById("detalle-publicacion");

  if (pub) {
    contenedor.innerHTML = `
      <div class="card">
        <div class="card-body">
          <h5 class="card-title">${pub.titulo}</h5>
          <p class="card-text">${pub.descripcion}</p>
        </div>
      </div>
    `;
  } else {
    contenedor.innerHTML = "<p>No se encontró la publicación.</p>";
  }
});
