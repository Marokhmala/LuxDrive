const API_BASE = "https://rentcar.stepprojects.ge/api/Car";

let allCars = [];

async function fetchCars() {
  try {
    // Fetch first 50 cars from the paginated endpoint for locations + stats
    const response = await fetch(
      `${API_BASE}/paginated?pageIndex=1&pageSize=50`,
    );
    const json = await response.json();
    const cars = json.data;

    allCars = cars;
    populateLocations();

    renderFeaturedCars(cars.slice(0, 6));
    startHeroStats(json.totalItems);
  } catch (error) {
    console.error("Failed to fetch cars:", error);
  }
}

function renderFeaturedCars(cars) {
  const grid = document.getElementById("featured-cars-grid");

  if (!grid) return;

  grid.innerHTML = "";

  cars.forEach((car) => {
    const card = document.createElement("div");
    card.className = "car-card";

    card.innerHTML = `
      <div class="car-image">
        <img src="${car.imageUrl1 || car.imageUrl2 || car.imageUrl3}"
             alt="${car.brand} ${car.model}" 
             style="width:100%; border-radius:10px;">
      </div>

      <div class="car-content">
        <h3>${car.brand} ${car.model}</h3>

        <span>👥 ${car.capacity} seats</span>
        <span>⚙️ ${car.transmission}</span>
        <span>📍 ${car.city}</span>

        <h4>$${car.price} / day</h4>

        <a href="cars.html" class="btn btn-primary btn-sm">
          Rent Now
        </a>
      </div>
    `;

    grid.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", fetchCars);

function populateLocations() {
  const select = document.getElementById("location-select");
  if (!select) return;

  const cities = [...new Set(allCars.map((car) => car.city))];

  cities.forEach((city) => {
    const option = document.createElement("option");

    option.value = city;
    option.textContent = city;

    select.appendChild(option);
  });
}

document.getElementById("search-form").addEventListener("submit", function (e) {
  e.preventDefault();

  const selectedCity = document.getElementById("location-select").value;

  if (!selectedCity) return;

  const filteredCars = allCars.filter((car) => car.city === selectedCity);

  renderFeaturedCars(filteredCars.slice(0, 6));
});

// HERO STATS LOGIC

function startHeroStats(totalItems) {
  // --- Luxury Cars (from API total) ---
  const carCounter = document.getElementById("car-count");
  if (carCounter) {
    carCounter.textContent = totalItems + "+";
  }

  // --- Happy Clients (live increasing number) ---
  const clientCounter = document.getElementById("happy-clients");

  if (clientCounter) {
    let value = Math.floor(Math.random() * 4000) + 11000;

    clientCounter.textContent = value.toLocaleString();

    function increaseClients() {
      value += Math.floor(Math.random() * 4) + 1;

      clientCounter.textContent = value.toLocaleString();

      const next = Math.random() * 7000 + 4000;

      setTimeout(increaseClients, next);
    }

    increaseClients();
  }

  // --- Satisfaction animation ---
  const satisfaction = document.getElementById("satisfaction");

  if (satisfaction) {
    let value = 0;
    const target = 98;

    const interval = setInterval(() => {
      value++;

      satisfaction.textContent = value + "%";

      if (value >= target) {
        clearInterval(interval);
      }
    }, 30);
  }
}

const toggle = document.querySelector(".navbar-toggle");
const sidebar = document.querySelector(".sidebar");
const overlay = document.querySelector(".overlay");

toggle.addEventListener("click", () => {
  toggle.classList.toggle("active");
  sidebar.classList.toggle("open");
  overlay.classList.toggle("show");
});

overlay.addEventListener("click", () => {
  toggle.classList.remove("active");
  sidebar.classList.remove("open");
  overlay.classList.remove("show");
});
