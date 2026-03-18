/* ============================================================
   LuxeDrive — Cars Page
   Uses paginated API + full client-side filtering & sorting
   on the current page load.
============================================================ */

const API_BASE = "https://rentcar.stepprojects.ge/api/Car";
const PAGE_SIZE = 24; // Larger page gives richer filter results

/* ---------- State ---------- */
let allCars = [];          // cars from the current API page
let currentApiPage = 1;
let totalApiPages  = 1;
let totalApiItems  = 0;

/* ============================================================
   BOOTSTRAP
============================================================ */
document.addEventListener("DOMContentLoaded", async () => {
  await fetchGlobalFilters(); // Populate dropdowns once
  await loadCars(1);          // Load first page
  bindFilterListeners();
});

// GEORGIAN_CITIES removed in favor of /api/Car/cities

/* ============================================================
   GLOBAL FILTERS SOURCE
   Fetch a large batch once to find all Brands and Cities
============================================================ */
async function fetchGlobalFilters() {
  try {
    // 1. Fetch cities from official endpoint
    const cityRes = await fetch(`${API_BASE}/cities`);
    const cities = await cityRes.json();
    populateCityFilter(cities.sort(), true);

    // 2. Fetch brands from a large batch (cap at 1000)
    const firstRes = await fetch(`${API_BASE}/paginated?pageIndex=1&pageSize=1`);
    const firstJson = await firstRes.json();
    const total = firstJson.totalItems || 500;

    const res = await fetch(`${API_BASE}/paginated?pageIndex=1&pageSize=${Math.min(total, 1000)}`);
    const json = await res.json();
    populateBrandFilter(json.data || []);
    
  } catch (err) {
    console.error("Failed to fetch global filters:", err);
  }
}

/* ============================================================
   API LOAD
============================================================ */
async function loadCars(page = 1) {
  showGridLoading();
  const filters = getFilters();

  const params = new URLSearchParams();
  if (filters.minCapacity) params.append("capacity", filters.minCapacity);
  if (filters.city) params.append("city", filters.city);
  if (filters.yearStart) params.append("startYear", filters.yearStart);
  if (filters.yearEnd) params.append("endYear", filters.yearEnd);
  
  params.append("pageIndex", page);
  params.append("pageSize", PAGE_SIZE);

  try {
    const res = await fetch(`${API_BASE}/filter?${params.toString()}`);
    const json = await res.json();

    // Check if the response is an array or a paginated object
    if (Array.isArray(json)) {
      allCars = json;
      totalApiItems = json.length;
      totalApiPages = 1; // Array-only response doesn't provide total count
      currentApiPage = page;
    } else {
      allCars = json.data || [];
      currentApiPage = json.currentPage || 1;
      totalApiPages = json.totalPages || 1;
      totalApiItems = json.totalItems || 0;
    }

    applyLocalFiltersAndRender();

  } catch (err) {
    console.error("Failed to load cars:", err);
    document.getElementById("cars-grid").innerHTML =
      `<p style="grid-column:1/-1;text-align:center;padding:40px;color:var(--danger)">Failed to load cars. Please try again.</p>`;
  }
}

/* ============================================================
   FILTER HELPERS
============================================================ */
function getFilters() {
  const search = document.getElementById("filter-search")?.value.trim().toLowerCase() || "";
  const maxPrice = parseInt(document.getElementById("price-range")?.value || 500);
  const brands = [...document.querySelectorAll(".filter-brand:checked")].map(el => el.value.toLowerCase());
  const transmissions = [...document.querySelectorAll(".filter-transmission:checked")].map(el => el.value);
  const minCapacity = parseInt(document.querySelector(".filter-capacity:checked")?.value || 0);
  const city = document.getElementById("filter-city")?.value || "";
  const yearStart = parseInt(document.getElementById("filter-year-start")?.value || 0);
  const yearEnd = parseInt(document.getElementById("filter-year-end")?.value || 0);
  const sort = document.getElementById("sort-select")?.value || "default";

  return { search, maxPrice, brands, transmissions, minCapacity, city, yearStart, yearEnd, sort };
}

/**
 * Filter change event listener - trigger a new server-side fetch
 */
function applyFilters() {
  loadCars(1);
}

/**
 * Local-only filters (Price, Brand, Transmission, Search)
 * applied to the results of the server-side filter.
 */
function applyLocalFiltersAndRender() {
  const { search, maxPrice, brands, transmissions, sort } = getFilters();

  let results = allCars.filter(car => {
    const fullName = `${car.brand} ${car.model}`.toLowerCase();

    if (search && !fullName.includes(search)) return false;
    if (car.price > maxPrice) return false;
    if (brands.length && !brands.includes(car.brand.toLowerCase())) return false;
    if (transmissions.length && !transmissions.includes(car.transmission)) return false;

    return true;
  });

  // Sort
  results.sort((a, b) => {
    switch (sort) {
      case "price-low":      return a.price - b.price;
      case "price-high":     return b.price - a.price;
      case "name":           return `${a.brand}${a.model}`.localeCompare(`${b.brand}${b.model}`);
      case "capacity-high":  return b.capacity - a.capacity;
      default:               return 0;
    }
  });

  renderCars(results);
  renderApiPagination();
}

/* ============================================================
   RENDER CARS
============================================================ */
function renderCars(cars) {
  const grid  = document.getElementById("cars-grid");
  const count = document.getElementById("cars-count");

  grid.innerHTML = "";

  if (!cars.length) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px 0;color:var(--text-secondary);">
        <div style="font-size:3rem;margin-bottom:12px;"><i data-lucide="search" style="width:48px;height:48px;"></i></div>
        <p style="font-size:1.1rem;">No cars match your filters.</p>
        <button class="btn btn-outline btn-sm" style="margin-top:16px;" id="no-result-reset">Clear Filters</button>
      </div>`;
    document.getElementById("no-result-reset")?.addEventListener("click", resetFilters);
    if (count) count.textContent = "No results";
    return;
  }

  if (count) {
    count.textContent = `Showing ${cars.length} of ${totalApiItems} cars (page ${currentApiPage}/${totalApiPages})`;
  }

  cars.forEach(car => {
    const card = document.createElement("div");
    card.className = "car-card";

    const transmissionLabel =
      car.transmission === "ავტომატიკა" ? "Automatic" :
      car.transmission === "მექანიკა"   ? "Manual"    :
      car.transmission;

    card.innerHTML = `
      <div class="car-image">
        <button class="car-card-favorite" onclick="toggleFavorite(event, ${car.id})" title="Add to Favorites">
          <span class="heart-icon"><i data-lucide="heart" style="width:16px;height:16px;"></i></span>
        </button>
        <img src="${car.imageUrl1 || car.imageUrl2 || car.imageUrl3}"
             alt="${car.brand} ${car.model}"
             loading="lazy">
      </div>
      <div class="car-content">
        <h3>${car.brand} ${car.model} <small style="color:var(--text-muted);font-size:0.8rem;">${car.year}</small></h3>
        <div class="car-specs">
          <span><i data-lucide="users" style="width:14px;height:14px;vertical-align:middle;"></i> ${car.capacity} seats</span>
          <span><i data-lucide="settings" style="width:14px;height:14px;vertical-align:middle;"></i> ${transmissionLabel}</span>
          <span><i data-lucide="map-pin" style="width:14px;height:14px;vertical-align:middle;"></i> ${car.city}</span>
        </div>
        <div class="car-bottom">
          <div class="car-price">$${car.price} <span>/day</span></div>
          <a href="car-details.html?id=${car.id}" class="btn btn-primary btn-sm">Rent</a>
        </div>
      </div>`;

    grid.appendChild(card);
  });

  if (window.lucide) {
    lucide.createIcons();
  }
}

/* ============================================================
   FAVORITES LOGIC
============================================================ */
// toggleFavorite moved to auth.js

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
  ) range.push(i);

  function makeBtn(label, page, disabled = false) {
    const btn = document.createElement("button");
    if (typeof label === "string" || typeof label === "number") {
      btn.textContent = label;
    } else {
      btn.appendChild(label);
    }
    btn.className = "page-btn" + (page === currentApiPage ? " active" : "");
    btn.disabled = disabled;
    if (!disabled) btn.onclick = () => loadCars(page);
    return btn;
  }

  // Prev
  if (currentApiPage > 1)
    pagination.appendChild(makeBtn(document.createRange().createContextualFragment('<i data-lucide="chevron-left" style="width:16px;height:16px;"></i>'), currentApiPage - 1));

  // First + ellipsis
  if (range[0] > 1) {
    pagination.appendChild(makeBtn("1", 1));
    if (range[0] > 2) {
      const el = document.createElement("span");
      el.textContent = "…"; el.className = "page-btn";
      el.style.pointerEvents = "none";
      pagination.appendChild(el);
    }
  }

  range.forEach(i => pagination.appendChild(makeBtn(i, i)));

  // Last + ellipsis
  const last = range[range.length - 1];
  if (last < totalApiPages) {
    if (last < totalApiPages - 1) {
      const el = document.createElement("span");
      el.textContent = "…"; el.className = "page-btn";
      el.style.pointerEvents = "none";
      pagination.appendChild(el);
    }
    pagination.appendChild(makeBtn(totalApiPages, totalApiPages));
  }

  // Next
  if (currentApiPage < totalApiPages)
    pagination.appendChild(makeBtn(document.createRange().createContextualFragment('<i data-lucide="chevron-right" style="width:16px;height:16px;"></i>'), currentApiPage + 1));

  if (window.lucide) {
    lucide.createIcons();
  }
}

/* ============================================================
   DYNAMIC SIDEBAR POPULATION
============================================================ */
function populateBrandFilter(cars) {
  const list = document.getElementById("brand-filter-list");
  if (!list) return;

  const brands = [...new Set(cars.map(c => c.brand))].sort();
  // Preserve currently checked state
  const checked = [...list.querySelectorAll(".filter-brand:checked")].map(el => el.value);

  list.innerHTML = brands.map(brand => `
    <label class="checkbox-item">
      <input type="checkbox" class="filter-brand" value="${brand}"
             ${checked.includes(brand) ? "checked" : ""}>
      <span class="checkmark"></span> ${brand}
    </label>`).join("");

  // Re-bind listeners for newly created checkboxes
  list.querySelectorAll(".filter-brand").forEach(el =>
    el.addEventListener("change", applyFilters)
  );
}

function populateCityFilter(data, isDirectList = false) {
  const select = document.getElementById("filter-city");
  if (!select) return;

  const current = select.value;
  const cities = isDirectList ? data : [...new Set(data.map(c => c.city))].sort();

  // Rebuild options but keep first "All cities" option
  select.innerHTML = `<option value="">All cities</option>` +
    cities.map(c => `<option value="${c}" ${c === current ? "selected" : ""}>${c}</option>`).join("");
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
  document.getElementById("price-range")?.addEventListener("input", function () {
    const val = parseInt(this.value);
    const label = val >= 500 ? "$500+" : `$${val}`;
    document.getElementById("price-value").textContent = label;
    applyFilters();
  });

  // Transmission checkboxes
  document.querySelectorAll(".filter-transmission").forEach(el =>
    el.addEventListener("change", applyFilters)
  );

  // Capacity radios
  document.querySelectorAll(".filter-capacity").forEach(el =>
    el.addEventListener("change", applyFilters)
  );

  // City dropdown
  document.getElementById("filter-city")?.addEventListener("change", applyFilters);

  // Year Range
  let yearDebounce;
  document.getElementById("filter-year-start")?.addEventListener("input", () => {
    clearTimeout(yearDebounce);
    yearDebounce = setTimeout(applyFilters, 500);
  });
  document.getElementById("filter-year-end")?.addEventListener("input", () => {
    clearTimeout(yearDebounce);
    yearDebounce = setTimeout(applyFilters, 500);
  });

  // Sort
  document.getElementById("sort-select")?.addEventListener("change", () => {
    applyLocalFiltersAndRender(); // Sort is local
  });

  // Reset all
  document.getElementById("reset-filters-btn")?.addEventListener("click", resetFilters);
}

function resetFilters() {
  document.getElementById("filter-search").value = "";
  document.getElementById("price-range").value = 500;
  document.getElementById("price-value").textContent = "$500+";
  document.getElementById("filter-year-start").value = "";
  document.getElementById("filter-year-end").value = "";
  document.querySelectorAll(".filter-brand").forEach(el => el.checked = false);
  document.querySelectorAll(".filter-transmission").forEach(el => el.checked = false);
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
        <div style="font-size:2rem;margin-bottom:8px;animation:spin 1s linear infinite;display:inline-block;"><i data-lucide="refresh-cw"></i></div>
        <p>Loading cars…</p>
      </div>`;
  }
}