/* ============================================================
   LuxeDrive — Cars Page
   Uses paginated API + full client-side filtering & sorting
   on the current page load.
============================================================ */

const API_BASE = "https://rentcar.stepprojects.ge/api/Car";
const PAGE_SIZE = 24; // Larger page gives richer filter results

/* ---------- State ---------- */
let allCars = []; // raw cars from the current API page
let filteredCars = []; // after applying filters

let currentApiPage = 1;
let totalApiPages = 1;
let totalApiItems = 0;

/* ============================================================
   BOOTSTRAP
============================================================ */
document.addEventListener("DOMContentLoaded", async () => {
  await loadCars(1);
  bindFilterListeners();
});

/* ============================================================
   API LOAD
============================================================ */
async function loadCars(page) {
  showGridLoading();

  try {
    const res = await fetch(
      `${API_BASE}/paginated?pageIndex=${page}&pageSize=${PAGE_SIZE}`,
    );
    const json = await res.json();

    // Get user-added cars from localStorage
    const userCars = JSON.parse(localStorage.getItem("userCars") || "[]");

    // Merge user cars with API cars, putting user cars first
    allCars = [...userCars, ...json.data];

    currentApiPage = json.currentPage;
    totalApiPages = json.totalPages;
    totalApiItems = json.totalItems + userCars.length; // Include user cars in total

    populateBrandFilter(allCars);
    populateCityFilter(allCars);

    applyFilters(); // renders + pagination
  } catch (err) {
    console.error("Failed to load cars:", err);
    document.getElementById("cars-grid").innerHTML =
      `<p style="color:var(--danger)">Failed to load cars. Please try again.</p>`;
  }
}

/* ============================================================
   FILTER HELPERS
============================================================ */
function getFilters() {
  const search =
    document.getElementById("filter-search")?.value.trim().toLowerCase() || "";

  const maxPrice = parseInt(
    document.getElementById("price-range")?.value || 500,
  );

  const brands = [...document.querySelectorAll(".filter-brand:checked")].map(
    (el) => el.value.toLowerCase(),
  );

  const transmissions = [
    ...document.querySelectorAll(".filter-transmission:checked"),
  ].map((el) => el.value);

  const capacityEl = document.querySelector(".filter-capacity:checked");
  const minCapacity = parseInt(capacityEl?.value || 0);

  const city = document.getElementById("filter-city")?.value || "";

  const sort = document.getElementById("sort-select")?.value || "default";

  return { search, maxPrice, brands, transmissions, minCapacity, city, sort };
}

function applyFilters() {
  const { search, maxPrice, brands, transmissions, minCapacity, city, sort } =
    getFilters();

  filteredCars = allCars.filter((car) => {
    const fullName = `${car.brand} ${car.model}`.toLowerCase();

    if (search && !fullName.includes(search)) return false;
    if (car.price > maxPrice) return false;
    if (brands.length && !brands.includes(car.brand.toLowerCase()))
      return false;
    if (transmissions.length && !transmissions.includes(car.transmission))
      return false;
    if (car.capacity < minCapacity) return false;
    if (city && car.city !== city) return false;

    return true;
  });

  // Sort
  filteredCars = [...filteredCars].sort((a, b) => {
    switch (sort) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "name":
        return `${a.brand}${a.model}`.localeCompare(`${b.brand}${b.model}`);
      case "capacity-high":
        return b.capacity - a.capacity;
      default:
        return 0;
    }
  });

  renderCars(filteredCars);
  renderApiPagination();
}

/* ============================================================
   RENDER CARS
============================================================ */
function renderCars(cars) {
  const grid = document.getElementById("cars-grid");
  const count = document.getElementById("cars-count");

  grid.innerHTML = "";

  if (!cars.length) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px 0;color:var(--text-secondary);">
        <div style="font-size:3rem;margin-bottom:12px;">🔍</div>
        <p style="font-size:1.1rem;">No cars match your filters.</p>
        <button class="btn btn-outline btn-sm" style="margin-top:16px;" id="no-result-reset">Clear Filters</button>
      </div>`;
    document
      .getElementById("no-result-reset")
      ?.addEventListener("click", resetFilters);
    if (count) count.textContent = "No results";
    return;
  }

  if (count) {
    count.textContent = `Showing ${cars.length} of ${totalApiItems} cars (page ${currentApiPage}/${totalApiPages})`;
  }

  cars.forEach((car) => {
    const card = document.createElement("div");
    card.className = "car-card";

    const transmissionLabel =
      car.transmission === "ავტომატიკა"
        ? "Automatic"
        : car.transmission === "მექანიკა"
          ? "Manual"
          : car.transmission;

    // Handle user-added cars vs API cars
    const isUserCar = car.userAdded;
    const imageSrc = isUserCar
      ? car.images && car.images[0]
        ? car.images[0]
        : "/images/placeholder-car.jpg"
      : car.imageUrl1 || car.imageUrl2 || car.imageUrl3;

    const carLink = isUserCar
      ? `javascript:void(0)" onclick="showCarManagementMenu('${car.addedAt || car.id}', event)`
      : `car-details.html?id=${car.id}`;

    card.innerHTML = `
      <div class="car-image">
        <img src="${imageSrc}"
             alt="${car.brand} ${car.model}"
             loading="lazy">
        ${isUserCar ? '<div class="user-car-badge">Your Car</div>' : ""}
      </div>
      <div class="car-content">
        <h3>${car.brand} ${car.model} <small style="color:var(--text-muted);font-size:0.8rem;">${car.year}</small></h3>
        <div class="car-specs">
          <span>👥 ${car.capacity} seats</span>
          <span>⚙️ ${transmissionLabel}</span>
          <span>📍 ${car.city}</span>
        </div>
        <div class="car-bottom">
          <div class="car-price">$${car.price} <span>/day</span></div>
          <a href="${carLink}" class="btn btn-primary btn-sm">${isUserCar ? "Manage" : "Rent"}</a>
        </div>
      </div>`;

    grid.appendChild(card);
  });
}

/* ============================================================
   PAGINATION (API pages)
============================================================ */
function renderApiPagination() {
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";

  if (totalApiPages <= 1) return;

  const delta = 2;
  const range = [];
  for (
    let i = Math.max(1, currentApiPage - delta);
    i <= Math.min(totalApiPages, currentApiPage + delta);
    i++
  )
    range.push(i);

  function makeBtn(label, page, disabled = false) {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.className = "page-btn" + (page === currentApiPage ? " active" : "");
    btn.disabled = disabled;
    if (!disabled) btn.onclick = () => loadCars(page);
    return btn;
  }

  // Prev
  if (currentApiPage > 1)
    pagination.appendChild(makeBtn("←", currentApiPage - 1));

  // First + ellipsis
  if (range[0] > 1) {
    pagination.appendChild(makeBtn("1", 1));
    if (range[0] > 2) {
      const el = document.createElement("span");
      el.textContent = "…";
      el.className = "page-btn";
      el.style.pointerEvents = "none";
      pagination.appendChild(el);
    }
  }

  range.forEach((i) => pagination.appendChild(makeBtn(i, i)));

  // Last + ellipsis
  const last = range[range.length - 1];
  if (last < totalApiPages) {
    if (last < totalApiPages - 1) {
      const el = document.createElement("span");
      el.textContent = "…";
      el.className = "page-btn";
      el.style.pointerEvents = "none";
      pagination.appendChild(el);
    }
    pagination.appendChild(makeBtn(totalApiPages, totalApiPages));
  }

  // Next
  if (currentApiPage < totalApiPages)
    pagination.appendChild(makeBtn("→", currentApiPage + 1));
}

/* ============================================================
   DYNAMIC SIDEBAR POPULATION
============================================================ */
function populateBrandFilter(cars) {
  const list = document.getElementById("brand-filter-list");
  if (!list) return;

  const brands = [...new Set(cars.map((c) => c.brand))].sort();
  // Preserve currently checked state
  const checked = [...list.querySelectorAll(".filter-brand:checked")].map(
    (el) => el.value,
  );

  list.innerHTML = brands
    .map(
      (brand) => `
    <label class="checkbox-item">
      <input type="checkbox" class="filter-brand" value="${brand}"
             ${checked.includes(brand) ? "checked" : ""}>
      <span class="checkmark"></span> ${brand}
    </label>`,
    )
    .join("");

  // Re-bind listeners for newly created checkboxes
  list
    .querySelectorAll(".filter-brand")
    .forEach((el) => el.addEventListener("change", applyFilters));
}

function populateCityFilter(cars) {
  const select = document.getElementById("filter-city");
  if (!select) return;

  const current = select.value;
  const cities = [...new Set(cars.map((c) => c.city))].sort();

  // Rebuild options but keep first "All cities" option
  select.innerHTML =
    `<option value="">All cities</option>` +
    cities
      .map(
        (c) =>
          `<option value="${c}" ${c === current ? "selected" : ""}>${c}</option>`,
      )
      .join("");
}

/* ============================================================
   EVENT LISTENERS
============================================================ */
function bindFilterListeners() {
  // Search input — debounced
  let debounce;
  document.getElementById("filter-search")?.addEventListener("input", () => {
    clearTimeout(debounce);
    debounce = setTimeout(applyFilters, 220);
  });

  // Price slider
  document
    .getElementById("price-range")
    ?.addEventListener("input", function () {
      const val = parseInt(this.value);
      const label = val >= 500 ? "$500+" : `$${val}`;
      document.getElementById("price-value").textContent = label;
      applyFilters();
    });

  // Transmission checkboxes
  document
    .querySelectorAll(".filter-transmission")
    .forEach((el) => el.addEventListener("change", applyFilters));

  // Capacity radios
  document
    .querySelectorAll(".filter-capacity")
    .forEach((el) => el.addEventListener("change", applyFilters));

  // City dropdown
  document
    .getElementById("filter-city")
    ?.addEventListener("change", applyFilters);

  // Sort
  document
    .getElementById("sort-select")
    ?.addEventListener("change", applyFilters);

  // Reset all
  document
    .getElementById("reset-filters-btn")
    ?.addEventListener("click", resetFilters);
}

function resetFilters() {
  document.getElementById("filter-search").value = "";
  document.getElementById("price-range").value = 500;
  document.getElementById("price-value").textContent = "$500+";
  document
    .querySelectorAll(".filter-brand")
    .forEach((el) => (el.checked = false));
  document
    .querySelectorAll(".filter-transmission")
    .forEach((el) => (el.checked = false));
  const anyCapacity = document.querySelector(".filter-capacity[value='0']");
  if (anyCapacity) anyCapacity.checked = true;
  document.getElementById("filter-city").value = "";
  document.getElementById("sort-select").value = "default";
  applyFilters();
}

/* ============================================================
   UTILITY
============================================================ */
function showGridLoading() {
  const grid = document.getElementById("cars-grid");
  if (grid) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px 0;color:var(--text-secondary);">
        <div style="font-size:2rem;margin-bottom:8px;animation:spin 1s linear infinite;display:inline-block;">⟳</div>
        <p>Loading cars…</p>
      </div>`;
  }
}

/* ============================================================
   USER CAR MANAGEMENT
============================================================ */
function showCarManagementMenu(carIdentifier, event) {
  event.preventDefault();
  event.stopPropagation();

  // Remove any existing menus
  document
    .querySelectorAll(".car-management-menu")
    .forEach((menu) => menu.remove());

  // Create menu
  const menu = document.createElement("div");
  menu.className = "car-management-menu";
  menu.innerHTML = `
    <button onclick="editUserCar('${carIdentifier}')">✏️ Edit</button>
    <button onclick="deleteUserCar('${carIdentifier}')" class="delete-btn">🗑️ Delete</button>
  `;

  // Position menu near the clicked button
  const button = event.target;
  const rect = button.getBoundingClientRect();
  menu.style.position = "fixed";
  menu.style.top = `${rect.bottom + 5}px`;
  menu.style.left = `${rect.left}px`;
  menu.style.zIndex = "1000";

  document.body.appendChild(menu);

  // Close menu when clicking outside
  document.addEventListener("click", function closeMenu(e) {
    if (!menu.contains(e.target)) {
      menu.remove();
      document.removeEventListener("click", closeMenu);
    }
  });
}

function editUserCar(carIdentifier) {
  // Close any open menus
  document
    .querySelectorAll(".car-management-menu")
    .forEach((menu) => menu.remove());

  // Get user cars from localStorage
  const userCars = JSON.parse(localStorage.getItem("userCars") || "[]");

  // Find the car by addedAt timestamp or id
  const carIndex = userCars.findIndex(
    (car) => car.addedAt === carIdentifier || car.id === carIdentifier,
  );

  if (carIndex === -1) {
    alert("Car not found!");
    return;
  }

  // Store the car index for editing
  localStorage.setItem("editingCarIndex", carIndex);

  // Redirect to add rental page with edit mode
  window.location.href = "addRental.html?edit=true";
}

function deleteUserCar(carIdentifier) {
  // Close any open menus
  document
    .querySelectorAll(".car-management-menu")
    .forEach((menu) => menu.remove());

  if (
    !confirm(
      "Are you sure you want to delete this car? This action cannot be undone.",
    )
  ) {
    return;
  }

  // Get user cars from localStorage
  const userCars = JSON.parse(localStorage.getItem("userCars") || "[]");

  // Find and remove the car
  const carIndex = userCars.findIndex(
    (car) => car.addedAt === carIdentifier || car.id === carIdentifier,
  );

  if (carIndex === -1) {
    alert("Car not found!");
    return;
  }

  userCars.splice(carIndex, 1);
  localStorage.setItem("userCars", JSON.stringify(userCars));

  // Reload the page to update the display
  location.reload();

  alert("Car deleted successfully!");
}
