/* ============================================================
   LuxeDrive — Dashboard Page
   Handles user profile, bookings, and favorite cars.
============================================================ */

document.addEventListener("DOMContentLoaded", async () => {
  if (!Session.isLoggedIn()) {
    window.location.href = "login.html?return=dashboard.html";
    return;
  }

  const user = Session.getUser();
  const phone = user?.phone;

  if (!phone) {
    console.error("No phone number found in session.");
    return;
  }

  initTabs();
  await loadDashboardData(phone);
});

/* ============================================================
   TAB SYSTEM
============================================================ */
function initTabs() {
  const navLinks = document.querySelectorAll(".dashboard-nav a[data-tab]");
  const tabs = document.querySelectorAll(".dashboard-tab");

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const tabName = link.dataset.tab;

      navLinks.forEach((l) => l.classList.remove("active"));
      link.classList.add("active");

      tabs.forEach((tab) => {
        tab.style.display = tab.dataset.tab === tabName ? "block" : "none";
      });
    });
  });
}

/* ============================================================
   DATA LOADING
============================================================ */
async function loadDashboardData(phone) {
  try {
    // 1. Load Profile
    const profileRes = await fetch(`https://rentcar.stepprojects.ge/api/Users/${encodeURIComponent(phone)}`);
    if (profileRes.ok) {
      const userData = await profileRes.json();
      populateProfile(userData);
    }

    // 2. Load Favorites
    const favsRes = await fetch(`https://rentcar.stepprojects.ge/api/Users/${encodeURIComponent(phone)}/favorite-cars`);
    let favorites = [];
    if (favsRes.ok) {
      favorites = await favsRes.json();
      
      // Filter out duplicate cars by ID
      const uniqueFavs = [];
      const seenFavIds = new Set();
      favorites.forEach(car => {
        if (car && car.id && !seenFavIds.has(car.id)) {
          uniqueFavs.push(car);
          seenFavIds.add(car.id);
        }
      });
      renderFavorites(uniqueFavs);
      const favsCount = document.getElementById("stat-favorites-count");
      if (favsCount) favsCount.textContent = uniqueFavs.length;
    }

    // 3. Load Bookings (Purchases)
    const bookingsRes = await fetch(`https://rentcar.stepprojects.ge/purchase/${encodeURIComponent(phone)}`);
    if (bookingsRes.ok) {
      const bookings = await bookingsRes.json();
      renderBookings(bookings);
      const bookingsCount = document.getElementById("stat-bookings-count");
      if (bookingsCount) bookingsCount.textContent = bookings.length;
    }

    // 4. Load My Listings (Cars by Phone)
    const listingsRes = await fetch(`https://rentcar.stepprojects.ge/api/Car/byPhone?PhoneNumber=${encodeURIComponent(phone)}`);
    if (listingsRes.ok) {
      const listings = await listingsRes.json();
      renderMyListings(listings);
      const listingsCount = document.getElementById("stat-listings-count");
      if (listingsCount) listingsCount.textContent = listings.length;
    }

  } catch (err) {
    console.error("Error loading dashboard data:", err);
  }
}

function populateProfile(user) {
  // Update sidebar
  const sidebarName = document.querySelector(".dashboard-user h3");
  const sidebarEmail = document.querySelector(".dashboard-user p");
  const sidebarAvatar = document.querySelector(".dashboard-avatar");

  if (sidebarName) sidebarName.textContent = `${user.firstName} ${user.lastName}`;
  if (sidebarEmail) sidebarEmail.textContent = user.email;
  if (sidebarAvatar) sidebarAvatar.textContent = user.firstName.charAt(0) + user.lastName.charAt(0);

  // Update inputs
  document.getElementById("profile-first-name").value = user.firstName || "";
  document.getElementById("profile-last-name").value = user.lastName || "";
  document.getElementById("profile-email").value = user.email || "";
  document.getElementById("profile-phone").value = user.phoneNumber || "";
  document.getElementById("profile-role").value = user.role || "User";
}

function renderFavorites(cars) {
  const list = document.getElementById("favorites-list");
  if (!list) return;

  if (cars.length === 0) {
    list.innerHTML = `<p class="text-muted">You haven't added any favorites yet.</p>`;
    return;
  }

  list.innerHTML = cars.map(car => {
    const transmissionLabel =
      car.transmission === "ავტომატიკა" ? "Automatic" :
      car.transmission === "მექანიკა"   ? "Manual"    :
      car.transmission;

    return `
      <div class="car-card" style="margin-bottom:20px;">
        <div class="car-image">
          <img src="${car.imageUrl1 || car.imageUrl2 || car.imageUrl3}" alt="${car.brand} ${car.model}">
        </div>
        <div class="car-content">
          <h3>${car.brand} ${car.model}</h3>
          <div class="car-specs">
            <span><i data-lucide="users" style="width:14px;height:14px;vertical-align:middle;"></i> ${car.capacity} seats</span>
            <span><i data-lucide="settings" style="width:14px;height:14px;vertical-align:middle;"></i> ${transmissionLabel}</span>
            <span><i data-lucide="map-pin" style="width:14px;height:14px;vertical-align:middle;"></i> ${car.city}</span>
          </div>
          <div class="car-bottom">
            <div class="car-price">$${car.price} <span>/day</span></div>
            <a href="car-details.html?id=${car.id}" class="btn btn-primary btn-sm">Rent</a>
          </div>
        </div>
      </div>
    `;
  }).join("");

  if (window.lucide) lucide.createIcons();
}

function renderBookings(bookings) {
  const list = document.getElementById("bookings-list");
  if (!list) return;

  if (bookings.length === 0) {
    list.innerHTML = `<p class="text-muted">No bookings found.</p>`;
    return;
  }

  list.innerHTML = bookings.map(b => `
    <div class="booking-card" style="margin-bottom:16px;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div style="display:flex; gap:16px;">
          <div style="width:80px; height:60px; border-radius:8px; overflow:hidden; background:#222; display:flex; align-items:center; justify-content:center; color:var(--accent); font-weight:bold;">
             <i data-lucide="car"></i>
          </div>
          <div>
            <h4 style="margin:0">${b.carBrand} ${b.carModel}</h4>
            <p class="text-muted" style="font-size:0.85rem; margin:4px 0;">Location: ${b.city}</p>
            <span class="badge badge-success">Booked (${b.multiplier} days)</span>
          </div>
        </div>
        <div style="text-align:right">
          <div style="font-weight:700; color:var(--accent);">$${b.pricePaid}</div>
          <small class="text-muted">Paid</small>
        </div>
      </div>
    </div>
  `).join("");

  if (window.lucide) lucide.createIcons();
}

function renderMyListings(cars) {
  const list = document.getElementById("listings-list");
  if (!list) return;

  if (cars.length === 0) {
    list.innerHTML = `
      <div style="text-align:center; padding:40px; color:var(--text-muted);">
        <p>You haven't listed any cars yet.</p>
        <a href="addRental.html" class="btn btn-outline btn-sm" style="margin-top:12px;">List Your First Car</a>
      </div>`;
    return;
  }

  list.innerHTML = cars.map(car => {
    const transmissionLabel =
      car.transmission === "ავტომატიკა" ? "Automatic" :
      car.transmission === "მექანიკა"   ? "Manual"    :
      car.transmission;

    return `
      <div class="car-card" style="margin-bottom:20px;">
        <div class="car-image">
          <img src="${car.imageUrl1 || car.imageUrl2 || car.imageUrl3}" alt="${car.brand} ${car.model}">
        </div>
        <div class="car-content">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <h3>${car.brand} ${car.model}</h3>
            <span class="badge" style="background:var(--accent); color:#fff; font-size:0.7rem;">Active</span>
          </div>
          <div class="car-specs">
            <span><i data-lucide="users" style="width:14px;height:14px;vertical-align:middle;"></i> ${car.capacity} seats</span>
            <span><i data-lucide="settings" style="width:14px;height:14px;vertical-align:middle;"></i> ${transmissionLabel}</span>
            <span><i data-lucide="map-pin" style="width:14px;height:14px;vertical-align:middle;"></i> ${car.city}</span>
          </div>
          <div class="car-bottom">
            <div class="car-price">$${car.price} <span>/day</span></div>
            <div style="display:flex; gap:8px;">
              <a href="car-details.html?id=${car.id}" class="btn btn-outline btn-sm">View</a>
              <!-- Edit/Delete could be added here if endpoints existed -->
            </div>
          </div>
        </div>
      </div>
    `;
  }).join("");

  if (window.lucide) lucide.createIcons();
}
