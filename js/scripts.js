
document.addEventListener("DOMContentLoaded", function () {
  const lista = document.getElementById("vehiculos-lista");
  if (lista) {
    const autos = [
      { id: 1, marca: "Toyota", modelo: "Corolla", anio: 2020 },
      { id: 2, marca: "Ford", modelo: "Focus", anio: 2019 },
      { id: 3, marca: "Chevrolet", modelo: "Cruze", anio: 2021 },
    ];

    autos.forEach(auto => {
      const card = document.createElement("div");
      card.className = "col";
      card.innerHTML = `
        <div class="card h-100">
          <img src="assets/img/default.jpg" class="card-img-top" alt="auto">
          <div class="card-body">
            <h5 class="card-title">${auto.marca} ${auto.modelo}</h5>
            <p class="card-text">Año: ${auto.anio}</p>
          </div>
        </div>
      `;
      lista.appendChild(card);
    });
  }
});
