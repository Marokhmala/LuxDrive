const API_BASE = "https://rentcar.stepprojects.ge/api/Car";

let allCars = [];

async function fetchCars() {
  try {
    // Fetch first 50 cars from the paginated endpoint for locations + stats
    const response = await fetch(`${API_BASE}/paginated?pageIndex=1&pageSize=50`);
    const json = await response.json();
    const cars = json.data;

    allCars = cars;
    await populateLocations();

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
      <div class="car-image" style="position:relative;">
        <button class="car-card-favorite" onclick="toggleFavorite(event, ${car.id})" title="Add to Favorites">
          <i data-lucide="heart" style="width:16px;height:16px;"></i>
        </button>
        <img src="${car.imageUrl1 || car.imageUrl2 || car.imageUrl3}"
             alt="${car.brand} ${car.model}" 
             style="width:100%; border-radius:10px;">
      </div>

      <div class="car-content">
        <h3>${car.brand} ${car.model}</h3>

        <span><i data-lucide="users" style="width:14px;height:14px;vertical-align:middle;"></i> ${car.capacity} seats</span>
        <span><i data-lucide="settings" style="width:14px;height:14px;vertical-align:middle;"></i> ${car.transmission}</span>
        <span><i data-lucide="map-pin" style="width:14px;height:14px;vertical-align:middle;"></i> ${car.city}</span>

        <h4>$${car.price} / day</h4>

        <div style="display:flex; gap:10px; align-items:center;">
          <a href="car-details.html?id=${car.id}" class="btn btn-primary btn-sm">
            Rent Now
          </a>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });

  if (window.lucide) {
    lucide.createIcons();
  }
}

document.addEventListener("DOMContentLoaded", fetchCars);

async function populateLocations() {
  const select = document.getElementById("location-select");
  if (!select) return;

  try {
    const res = await fetch(`${API_BASE}/cities`);
    const cities = await res.json();

    cities.sort().forEach((city) => {
      const option = document.createElement("option");
      option.value = city;
      option.textContent = city;
      select.appendChild(option);
    });
  } catch (err) {
    console.error("Failed to fetch cities:", err);
    // Fallback if needed
  }
}


const searchForm = document.getElementById("search-form");
if (searchForm) {
  searchForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const selectedCity = document.getElementById("location-select").value;

    if (!selectedCity) return;

    const filteredCars = allCars.filter((car) => car.city === selectedCity);

    renderFeaturedCars(filteredCars.slice(0, 6));
  });
}


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