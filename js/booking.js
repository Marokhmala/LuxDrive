/* ============================================================
   LuxeDrive — Booking Page
   Reads ?id=, ?pickup=, ?return= from the URL, fetches the
   car, populates the summary, then renders a PayPal button.
   On successful payment → POST to the purchase API.
============================================================ */

const PURCHASE_API = "https://rentcar.stepprojects.ge/purchase/purchase";
const CAR_API = "https://rentcar.stepprojects.ge/api/Car";

document.addEventListener("DOMContentLoaded", async () => {

  /* ── 1. Parse URL params ────────────────────────────── */
  const params = new URLSearchParams(window.location.search);
  const carId = params.get("id");
  const pickupIn = params.get("pickup");
  const returnIn = params.get("return");

  if (!carId) {
    showBookingError("No car selected. Please go back and choose a car.");
    return;
  }

  /* ── 2. Fetch car data ──────────────────────────────── */
  let car;
  try {
    const res = await fetch(`${CAR_API}/${carId}`);
    if (!res.ok) throw new Error(`Car fetch failed (${res.status})`);
    car = await res.json();
  } catch (err) {
    showBookingError("Could not load car details. Please try again.");
    return;
  }

  /* ── 3. Populate sidebar summary ───────────────────── */
  populateSummary(car, pickupIn, returnIn);

  /* ── 4. Pre-fill driver info from localStorage ──────── */
  prefillDriver();

  /* ── 5. Compute days & total for PayPal ─────────────── */
  const days = calcDays(pickupIn, returnIn);
  const totalAmount = (days * car.price).toFixed(2);

  /* ── 6. Render PayPal button ─────────────────────────── */
  if (typeof paypal === "undefined") {
    document.getElementById("paypal-button-container").innerHTML =
      `<p style="color:var(--text-secondary);text-align:center;">
         PayPal failed to load. Check your internet connection.
       </p>`;
    return;
  }

  paypal.Buttons({

    style: {
      layout: "vertical",
      color: "blue",
      shape: "rect",
      label: "pay"
    },

    /* ── createOrder: build the PayPal order ─────────── */
    createOrder: (data, actions) => {
      const phone = document.getElementById("booking-phone")?.value?.trim();
      const name = document.getElementById("booking-name")?.value?.trim();
      if (!phone) {
        alert("Please enter your phone number before paying.");
        return null;
      }
      if (!name) {
        alert("Please enter your full name before paying.");
        return null;
      }
      return actions.order.create({
        purchase_units: [{
          description: `LuxeDrive — ${car.brand} ${car.model} (${days} day${days !== 1 ? "s" : ""})`,
          amount: {
            currency_code: "USD",
            value: totalAmount
          }
        }]
      });
    },

    /* ── onApprove: capture then hit purchase API ─────── */
    onApprove: async (data, actions) => {
      try {
        showProcessingOverlay(true);

        await actions.order.capture();

        const phone = document.getElementById("booking-phone")?.value?.trim();

        const url = `${PURCHASE_API}?phoneNumber=${encodeURIComponent(phone)}&carId=${parseInt(carId, 10)}&multiplier=${days}`;

        const purchaseRes = await fetch(url, {
          method: "POST",
          headers: { "Accept": "application/json" }
        });

        if (!purchaseRes.ok) {
          const errText = await purchaseRes.text();
          throw new Error(`Purchase API error (${purchaseRes.status}): ${errText}`);
        }

        const purchase = await purchaseRes.json();
        console.log("Purchase confirmed:", purchase);

        // ── NEW: Notify car owner via Message API ──────────
        try {
          const ownerPhone = car.ownerPhoneNumber || car.phoneNumber;
          if (ownerPhone) {
            const msgUrl = `https://rentcar.stepprojects.ge/Message/Message?phoneNumber=${encodeURIComponent(ownerPhone)}&CarId=${parseInt(carId, 10)}`;
            console.log("Notifying owner at:", ownerPhone);
            await fetch(msgUrl, { method: "POST" });
          }
        } catch (msgErr) {
          console.error("Failed to notify owner:", msgErr);
          // Non-blocking error: we don't want to crash the success overlay if messaging fails
        }

        showProcessingOverlay(false);
        showSuccessOverlay(car, days, totalAmount);

        setTimeout(() => { window.location.href = "cars.html"; }, 4000);

      } catch (err) {
        showProcessingOverlay(false);
        console.error("Payment/Purchase error:", err);
        alert("Payment was captured but we encountered an error registering your booking.\n\nError: " + err.message);
      }
    },

    /* ── onError ────────────────────────────────────────── */
    onError: (err) => {
      console.error("PayPal error:", err);
      alert("Something went wrong with PayPal. Please try again.");
    },

    /* ── onCancel ────────────────────────────────────────── */
    onCancel: () => {
      console.log("PayPal payment cancelled.");
    }

  }).render("#paypal-button-container");
});

/* ============================================================
   Helpers
============================================================ */

function calcDays(pickup, ret) {
  if (!pickup || !ret) return 1;
  const d = Math.round((new Date(ret) - new Date(pickup)) / 86400000);
  return Math.max(1, d);
}

function populateSummary(car, pickup, ret) {
  const days = calcDays(pickup, ret);
  const subtotal = days * car.price;
  const tax = (subtotal * 0.1).toFixed(2);
  const total = (subtotal + parseFloat(tax)).toFixed(2);

  /* Car name / specs */
  const nameEl = document.getElementById("booking-car-name");
  const specsEl = document.getElementById("booking-car-specs");
  const imgEl = document.getElementById("booking-car-img");
  const emojiEl = document.getElementById("booking-car-emoji");

  if (nameEl) nameEl.textContent = `${car.brand} ${car.model}`;
  if (specsEl) specsEl.textContent = `${car.year} • ${car.transmission} • ${car.city}`;

  // Show actual car image in summary
  const imgSrc = car.imageUrl1 || car.imageUrl2 || car.imageUrl3;
  if (imgEl && imgSrc) {
    imgEl.src = imgSrc;
    imgEl.alt = `${car.brand} ${car.model}`;
    imgEl.style.display = "block";
    if (emojiEl) emojiEl.style.display = "none";
  }

  /* Dates */
  const fmt = d => d ? new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
  setText("booking-pickup", fmt(pickup));
  setText("booking-return", fmt(ret));
  setText("booking-days", `${days} day${days !== 1 ? "s" : ""}`);
  setText("booking-daily-rate", `$${car.price}`);
  setText("booking-subtotal", `$${subtotal.toFixed(2)}`);
  setText("booking-tax", `$${tax}`);
  setText("booking-total", `$${total}`);
}

function prefillDriver() {
  try {
    const user = JSON.parse(localStorage.getItem("luxedrive_user") || "{}");
    if (user.name) setVal("booking-name", user.name);
    if (user.phone) setVal("booking-phone", user.phone);
    if (user.email) setVal("booking-email", user.email);
  } catch (_) { }
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

function showProcessingOverlay(show) {
  let el = document.getElementById("processing-overlay");
  if (!el) {
    el = document.createElement("div");
    el.id = "processing-overlay";
    el.innerHTML = `
      <div class="processing-box">
        <div class="spinner"></div>
        <p>Processing your payment…</p>
      </div>`;
    el.style.cssText = `
      position:fixed;inset:0;background:rgba(0,0,0,.65);
      display:flex;align-items:center;justify-content:center;
      z-index:9999;`;
    el.querySelector(".processing-box").style.cssText = `
      background:var(--surface,#1a1a2e);border-radius:16px;
      padding:48px 56px;text-align:center;color:#fff;`;
    el.querySelector(".spinner").style.cssText = `
      width:48px;height:48px;border:4px solid rgba(255,255,255,.2);
      border-top-color:#c9a227;border-radius:50%;
      animation:spin .8s linear infinite;margin:0 auto 20px;`;
    const style = document.createElement("style");
    style.textContent = `@keyframes spin{to{transform:rotate(360deg)}}`;
    document.head.appendChild(style);
    document.body.appendChild(el);
  }
  el.style.display = show ? "flex" : "none";
}

function showSuccessOverlay(car, days, total) {
  const el = document.createElement("div");
  el.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,.75);
    display:flex;align-items:center;justify-content:center;z-index:9999;`;

  el.innerHTML = `
    <div style="
      background:var(--surface,#1a1a2e);border-radius:20px;
      padding:56px 64px;text-align:center;color:#fff;max-width:480px;width:90%;
      box-shadow:0 24px 80px rgba(0,0,0,.6);animation:fadeInUp .5s ease;">
      <div style="font-size:4rem;margin-bottom:16px;"><i data-lucide="check-circle" style="width:64px;height:64px;color:#c9a227;"></i></div>
      <h2 style="font-family:var(--font-display,'serif');font-size:1.8rem;margin-bottom:12px;color:#c9a227;">
        Booking Confirmed!
      </h2>
      <p style="color:rgba(255,255,255,.75);margin-bottom:8px;line-height:1.6;">
        Your <strong>${car.brand} ${car.model}</strong> is reserved for 
        <strong>${days} day${days !== 1 ? "s" : ""}</strong>.
      </p>
      <p style="color:rgba(255,255,255,.5);font-size:.9rem;">
        Total charged: <strong style="color:#c9a227;">$${total}</strong>
      </p>
      <p style="color:rgba(255,255,255,.4);font-size:.8rem;margin-top:24px;">
        Redirecting to the fleet page in a few seconds…
      </p>
    </div>`;
  
  if (window.lucide) lucide.createIcons();

  const style = document.createElement("style");
  style.textContent = `@keyframes fadeInUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}`;
  document.head.appendChild(style);
  document.body.appendChild(el);
}

function showBookingError(msg) {
  const section = document.querySelector(".booking-section");
  if (section) {
    section.innerHTML = `
      <div class="container" style="text-align:center;padding:80px 0;">
        <div style="font-size:3.5rem;margin-bottom:16px;"><i data-lucide="alert-triangle" style="width:56px;height:56px;"></i></div>
        <p style="font-size:1.1rem;color:var(--text-secondary);">${msg}</p>
        <a href="cars.html" class="btn btn-primary" style="margin-top:24px;"><i data-lucide="arrow-left" style="width:18px;height:18px;vertical-align:middle;"></i> Back to Fleet</a>
      </div>`;
    if (window.lucide) lucide.createIcons();
  }
}
