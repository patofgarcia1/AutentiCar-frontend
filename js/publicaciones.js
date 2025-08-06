
document.addEventListener("DOMContentLoaded", () => {
  const publicaciones = [
    { id: 1, titulo: "Venta de Toyota Corolla", descripcion: "Excelente estado, único dueño." },
    { id: 2, titulo: "Ford Focus en venta", descripcion: "Recién hecho el service completo." },
    { id: 3, titulo: "Chevrolet Cruze", descripcion: "Muy buen auto para ciudad y ruta." }
  ];

  const contenedor = document.getElementById("publicaciones");
  publicaciones.forEach(pub => {
    const div = document.createElement("div");
    div.className = "card mb-3";
    div.innerHTML = `
      <div class="card-body">
        <h5 class="card-title">${pub.titulo}</h5>
        <p class="card-text">${pub.descripcion}</p>
        <a href="publicacion-detalle.html?id=${pub.id}" class="btn btn-primary">Ver detalle</a>
      </div>
    `;
    contenedor.appendChild(div);
  });
});
