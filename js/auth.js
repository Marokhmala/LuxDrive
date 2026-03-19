/* ============================================================
   LuxeDrive — Auth Module
   Session stored in sessionStorage (tab-scoped).
   If "Remember me" is checked, also persisted in localStorage.
============================================================ */

const Session = {
  KEY: 'luxedrive_session',

  save(data, persist = false) {
    const payload = JSON.stringify(data);
    sessionStorage.setItem(this.KEY, payload);
    if (persist) localStorage.setItem(this.KEY, payload);
  },

  load() {
    const raw = sessionStorage.getItem(this.KEY) || localStorage.getItem(this.KEY);
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  clear() {
    sessionStorage.removeItem(this.KEY);
    localStorage.removeItem(this.KEY);
  },

  isLoggedIn() {
    const s = this.load();
    if (!s) return false;
    if (s.expiresAt && Date.now() > s.expiresAt) {
      this.clear();
      return false;
    }
    return true;
  },
  
  getUser() {
    const s = this.load();
    return s ? s.user : null;
  }
};

function logoutUser() {
  Session.clear();
  window.location.href = 'index.html';
}


document.addEventListener('DOMContentLoaded', () => {
    const isLoggedIn = Session.isLoggedIn();
    const currentPage = document.body.dataset.page;

    // Redirect logged-in users away from auth pages
    if (isLoggedIn && (currentPage === 'login' || currentPage === 'register')) {
        window.location.href = 'index.html';
        return;
    }

    if (isLoggedIn) {
        const user = Session.getUser();
        const navbarActions = document.querySelector('.navbar-actions');
        
        if (navbarActions) {
            const userName = user?.firstName || 'User';
            
            navbarActions.innerHTML = `
                <div class="messages-dropdown">
                    <button class="messages-dropdown-btn" title="Messages">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                        <span class="messages-badge" id="nav-messages-badge" style="display:none;">0</span>
                    </button>
                    <div class="messages-dropdown-menu">
                        <div class="dropdown-header">
                            <strong>Messages</strong>
                        </div>
                        <div class="messages-list" id="nav-messages-list">
                            <div class="dropdown-item text-muted" style="font-size:0.8rem; padding:20px; text-align:center;">
                                Loading messages...
                            </div>
                        </div>
                    </div>
                </div>

                <div class="user-dropdown">
                    <button class="user-dropdown-btn">
                        <span class="user-avatar">${userName.charAt(0).toUpperCase()}</span>
                        <span class="user-name">${userName}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </button>
                    <div class="user-dropdown-menu">
                        <div class="dropdown-header">
                            <strong>${user?.firstName || ''} ${user?.lastName || ''}</strong>
                            <span>${user?.email || ''}</span>
                        </div>
                        <hr class="dropdown-divider">
                        <a href="dashboard.html" class="dropdown-item">
                            <span>Dashboard</span>
                        </a>
                        <a href="addRental.html" class="dropdown-item">
                            <span>Add Rental</span>
                        </a>
                        <button onclick="logoutUser()" class="dropdown-item text-danger">
                            <span>Log out</span>
                        </button>
                    </div>
                </div>
            `;
            
            if (window.lucide) lucide.createIcons();
            
            // Setup dropdown toggle
            const dropdownBtn = navbarActions.querySelector('.user-dropdown-btn');
            const dropdownMenu = navbarActions.querySelector('.user-dropdown-menu');
            
            if (dropdownBtn && dropdownMenu) {
                dropdownBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    navbarActions.querySelector('.messages-dropdown-menu')?.classList.remove('active');
                    dropdownMenu.classList.toggle('active');
                });
            }

            // Setup messages toggle
            const msgBtn = navbarActions.querySelector('.messages-dropdown-btn');
            const msgMenu = navbarActions.querySelector('.messages-dropdown-menu');

            if (msgBtn && msgMenu) {
                msgBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    dropdownMenu?.classList.remove('active');
                    msgMenu.classList.toggle('active');
                    if (msgMenu.classList.contains('active')) {
                        loadNavbarMessages(user?.phone);
                    }
                });
            }
                
            // Close when clicking outside
            document.addEventListener('click', () => {
                dropdownMenu?.classList.remove('active');
                msgMenu?.classList.remove('active');
            });

            // Initial message count check
            if (user?.phone) {
                updateMessageBadge(user.phone);
            }
        }
    }
});

async function updateMessageBadge(phone) {
    try {
        const res = await fetch(`https://rentcar.stepprojects.ge/Message/Messages?phoneNumber=${encodeURIComponent(phone)}`);
        if (res.ok) {
            const messages = await res.json();
            const badge = document.getElementById('nav-messages-badge');
            if (badge) {
                if (messages.length > 0) {
                    badge.textContent = messages.length;
                    badge.style.display = 'flex';
                } else {
                    badge.style.display = 'none';
                }
            }
        }
    } catch (err) {
        console.error("Failed to update message badge:", err);
    }
}

async function loadNavbarMessages(phone) {
    const list = document.getElementById('nav-messages-list');
    if (!list) return;

    try {
        const res = await fetch(`https://rentcar.stepprojects.ge/Message/Messages?phoneNumber=${encodeURIComponent(phone)}`);
        if (res.ok) {
            const messages = await res.json();
            renderNavbarMessages(messages);
        } else {
            list.innerHTML = `<div class="dropdown-item text-muted" style="font-size:0.8rem; padding:20px; text-align:center;">Failed to load messages.</div>`;
        }
    } catch (err) {
        console.error("Failed to load navbar messages:", err);
        list.innerHTML = `<div class="dropdown-item text-muted" style="font-size:0.8rem; padding:20px; text-align:center;">Error loading messages.</div>`;
    }
}

function renderNavbarMessages(messages) {
    const list = document.getElementById('nav-messages-list');
    if (!list) return;

    if (messages.length === 0) {
        list.innerHTML = `<div class="dropdown-item text-muted" style="font-size:0.8rem; padding:20px; text-align:center;">No messages found.</div>`;
        return;
    }

    list.innerHTML = messages.map((msg, index) => {
        // Handle both object and string format
        const text = typeof msg === 'string' ? msg : (msg.messageText || 'No content');
        const id = typeof msg === 'string' ? (index + 1) : (msg.id || (index + 1));
        
        return `
            <div class="dropdown-item message-item" style="flex-direction:column; align-items:flex-start; gap:4px; padding:12px 16px; border-bottom:1px solid var(--border);">
                <div style="font-weight:600; font-size:0.85rem; color:var(--text);">${id ? 'Message #' + id : 'Notification'}</div>
                <div style="font-size:0.8rem; color:var(--text-secondary); line-height:1.4;">${text}</div>
            </div>
        `;
    }).join('');
}

/* ============================================================
   SHARED FEATURES
============================================================ */
async function toggleFavorite(event, carId) {
  event.preventDefault();
  event.stopPropagation();

  if (!Session.isLoggedIn()) {
    alert("Please sign in to add cars to your favorites.");
    window.location.href = `login.html?return=${encodeURIComponent(window.location.pathname)}`;
    return;
  }

  const user = Session.getUser();
  const phone = user?.phone;

  if (!phone) {
    alert("User phone number missing. Try logging in again.");
    return;
  }

  const btn = event.currentTarget;

  try {
    const res = await fetch(`https://rentcar.stepprojects.ge/api/Users/${encodeURIComponent(phone)}/favorites/${carId}`, {
      method: "POST",
      headers: { "accept": "*/*" }
    });

    if (res.ok) {
      btn.classList.add("active");
      console.log(`Car ${carId} added to favorites.`);
    } else {
      const err = await res.text();
      console.error("Failed to favorite:", err);
      // alert("Could not add to favorites. It might already be in your list.");
      btn.classList.add("active"); // Still show active if it's already favorited
    }
  } catch (err) {
    console.error("Error favoriting:", err);
  }
}

/* ============================================================
   MOBILE MENU LOGIC
============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".navbar-toggle");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");

  if (toggle && sidebar && overlay) {
    toggle.addEventListener("click", () => {
      toggle.classList.toggle("active");
      sidebar.classList.toggle("active");
      overlay.classList.toggle("active");
    });

    overlay.addEventListener("click", () => {
      toggle.classList.remove("active");
      sidebar.classList.remove("active");
      overlay.classList.remove("active");
    });

    const links = sidebar.querySelectorAll("a");
    links.forEach(link => {
      link.addEventListener("click", () => {
        toggle.classList.remove("active");
        sidebar.classList.remove("active");
        overlay.classList.remove("active");
      });
    });
  }
});
