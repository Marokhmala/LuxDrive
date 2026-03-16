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

// Toast notification system
const App = {
  showToast: function (type, title, message) {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector(".toast-container");
    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.className = "toast-container";
      toastContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 10px;
      `;
      document.body.appendChild(toastContainer);
    }

    // Create toast element
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
      background: ${type === "success" ? "#10b981" : type === "error" ? "#ef4444" : "#f59e0b"};
      color: white;
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      display: flex;
      align-items: flex-start;
      gap: 12px;
      min-width: 300px;
      max-width: 400px;
      animation: slideIn 0.3s ease-out;
      font-family: 'Inter', sans-serif;
    `;

    toast.innerHTML = `
      <div style="font-size: 1.2rem; margin-top: 2px;">
        ${type === "success" ? "✓" : type === "error" ? "✕" : "⚠"}
      </div>
      <div style="flex: 1;">
        <div style="font-weight: 600; margin-bottom: 4px;">${title}</div>
        <div style="font-size: 0.9rem; opacity: 0.9;">${message}</div>
      </div>
      <button onclick="this.parentElement.remove()" style="
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        font-size: 1.2rem;
        opacity: 0.7;
        padding: 0;
        margin-left: 8px;
      ">×</button>
    `;

    // Add slide-in animation
    const style = document.createElement("style");
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    toastContainer.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.animation = "slideOut 0.3s ease-in forwards";
        setTimeout(() => toast.remove(), 300);
      }
    }, 5000);

    // Add slide-out animation
    style.textContent += `
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
  },
};
