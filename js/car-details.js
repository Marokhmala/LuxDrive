/* ============================================================
   LuxeDrive — Car Details Page
   Reads ?id= from the URL, fetches that car from the API,
   and populates all fields + the image gallery.
============================================================ */

const API_BASE_DETAILS = "https://rentcar.stepprojects.ge/api/Car";

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const carId  = params.get("id");

  if (!carId) {
    showError("No car ID specified.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE_DETAILS}/${carId}`);
    if (!res.ok) throw new Error(`Car not found (${res.status})`);
    const car = await res.json();
    populatePage(car);
  } catch (err) {
    showError(err.message || "Failed to load car details.");
  }
});

function populatePage(car) {
  /* ---------- Gallery images ---------- */
  const images = [car.imageUrl1, car.imageUrl2, car.imageUrl3].filter(Boolean);
  const mainImg = document.getElementById("gallery-main-img");

  if (mainImg && images.length) {
    mainImg.src = images[0];
    mainImg.alt = `${car.brand} ${car.model}`;
  }

  images.forEach((url, i) => {
    const thumb = document.getElementById(`thumb-${i}`);
    if (thumb) {
      thumb.src = url;
      thumb.alt = `${car.brand} ${car.model} view ${i + 1}`;
    }
  });

  // Hide unused thumbnail slots
  for (let i = images.length; i < 3; i++) {
    const slot = document.querySelector(`[data-index="${i}"]`);
    if (slot) slot.style.display = "none";
  }

  // Thumbnail click → update main image
  document.querySelectorAll(".gallery-thumb").forEach(thumb => {
    thumb.addEventListener("click", () => {
      const idx = parseInt(thumb.dataset.index);
      if (images[idx] && mainImg) {
        mainImg.src = images[idx];
        document.querySelectorAll(".gallery-thumb").forEach(t => t.classList.remove("active"));
        thumb.classList.add("active");
      }
    });
  });

  /* ---------- Car name & page title ---------- */
  const fullName = `${car.brand} ${car.model}`;
  document.title = `${fullName} — LuxeDrive`;

  document.querySelectorAll("#detail-car-name").forEach(el => {
    el.textContent = fullName;
  });

  /* ---------- Year ---------- */
  const yearEl = document.getElementById("detail-car-year");
  if (yearEl) yearEl.textContent = car.year;

  /* ---------- Specs ---------- */
  const transmissionLabel =
    car.transmission === "ავტომატიკა" ? "Automatic" :
    car.transmission === "მექანიკა"   ? "Manual"    :
    car.transmission;

  const transmissionEl = document.getElementById("detail-transmission");
  if (transmissionEl) transmissionEl.textContent = transmissionLabel;

  const seatsEl = document.getElementById("detail-seats");
  if (seatsEl) seatsEl.textContent = car.capacity;

  // Fuel capacity (L) shown in the "Fuel Type" field since API has no fuel type
  const fuelEl = document.getElementById("detail-fuel");
  if (fuelEl) {
    fuelEl.textContent = car.fuelCapacity ? `${car.fuelCapacity}L tank` : "N/A";
    // Update the label too
    const label = fuelEl.closest(".spec-item")?.querySelector("label");
    if (label) label.textContent = "Fuel Capacity";
  }

  // Color field repurposed for City
  const colorEl = document.getElementById("detail-color");
  if (colorEl) {
    colorEl.textContent = car.city || "N/A";
    const label = colorEl.closest(".spec-item")?.querySelector("label");
    if (label) label.textContent = "City";
    const icon = colorEl.closest(".spec-item")?.querySelector(".spec-item-icon");
    if (icon) icon.textContent = "📍";
  }

  /* ---------- Badge ---------- */
  const badge = document.getElementById("detail-car-badge");
  if (badge) badge.textContent = car.brand;

  /* ---------- Price ---------- */
  const priceEl = document.getElementById("detail-car-price");
  if (priceEl) priceEl.textContent = `$${car.price}`;

  /* ---------- Description ---------- */
  const descEl = document.getElementById("detail-description");
  if (descEl) {
    descEl.textContent =
      `The ${car.year} ${car.brand} ${car.model} is available for rent in ${car.city}. ` +
      `It features ${transmissionLabel.toLowerCase()} transmission, seats up to ${car.capacity} passengers, ` +
      `and has a ${car.fuelCapacity}L fuel capacity. Priced at $${car.price}/day for an exceptional driving experience.`;
  }

  /* ---------- Features list ---------- */
  const featuresList = document.getElementById("detail-features");
  if (featuresList) {
    const features = [
      `${transmissionLabel} transmission`,
      `${car.capacity} passenger seats`,
      `${car.fuelCapacity}L fuel tank`,
      `Available in ${car.city}`,
      "24/7 roadside assistance",
      "Full insurance coverage",
      "Free cancellation (48h notice)",
      "GPS navigation",
    ];
    featuresList.innerHTML = features
      .map(f => `<li style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);color:var(--text-secondary);font-size:0.9rem;">
                   <span style="color:var(--accent);font-size:1rem;">✓</span> ${f}
                 </li>`)
      .join("");
  }

  /* ---------- Date picker & total ---------- */
  const pickup = document.getElementById("detail-pickup");
  const ret    = document.getElementById("detail-return");

  function updateTotal() {
    const days = document.getElementById("detail-days");
    const total = document.getElementById("detail-total");
    if (!pickup?.value || !ret?.value) { 
      if (days) days.textContent = "—";
      if (total) total.textContent = "$0";
      return;
    }
    const d = Math.max(0, Math.round((new Date(ret.value) - new Date(pickup.value)) / 86400000));
    if (days) days.textContent = d === 1 ? "1 day" : `${d} days`;
    if (total) total.textContent = `$${d * car.price}`;
  }

  pickup?.addEventListener("change", updateTotal);
  ret?.addEventListener("change", updateTotal);

  // Set min dates to today
  const today = new Date().toISOString().split("T")[0];
  if (pickup) pickup.min = today;
  if (ret)    ret.min    = today;

  /* ---------- Book Now button ---------- */
  const bookBtn = document.getElementById("book-now-btn");
  if (bookBtn) {
    bookBtn.addEventListener("click", () => {
      if (!pickup?.value || !ret?.value) {
        alert("Please select pickup and return dates.");
        return;
      }
      window.location.href =
        `booking.html?id=${car.id}&pickup=${pickup.value}&return=${ret.value}`;
    });
  }
}

function showError(msg) {
  const grid = document.querySelector(".car-details-grid");
  if (grid) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px 0;color:var(--text-secondary);">
        <div style="font-size:3rem;margin-bottom:12px;">⚠️</div>
        <p style="font-size:1.1rem;">${msg}</p>
        <a href="cars.html" class="btn btn-outline btn-sm" style="margin-top:16px;">← Back to Fleet</a>
      </div>`;
  }
}
