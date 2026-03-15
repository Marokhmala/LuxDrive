/* ============================================================
   LuxeDrive — Auth Module
   Session stored in sessionStorage (tab-scoped).
   If "Remember me" is checked, also persisted in localStorage.
============================================================ */

const Session = {
  KEY: "luxedrive_session",

  save(data, persist = false) {
    const payload = JSON.stringify(data);
    sessionStorage.setItem(this.KEY, payload);
    if (persist) localStorage.setItem(this.KEY, payload);
  },

  load() {
    const raw =
      sessionStorage.getItem(this.KEY) || localStorage.getItem(this.KEY);
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
  },
};

function logoutUser() {
  Session.clear();
  window.location.href = "index.html";
}

document.addEventListener("DOMContentLoaded", () => {
  const isLoggedIn = Session.isLoggedIn();
  const currentPage = document.body.dataset.page;

  // Redirect logged-in users away from auth pages
  if (isLoggedIn && (currentPage === "login" || currentPage === "register")) {
    window.location.href = "index.html";
    return;
  }

  if (isLoggedIn) {
    const user = Session.getUser();
    const navbarActions = document.querySelector(".navbar-actions");

    if (navbarActions) {
      const userName = user?.firstName || "User";

      navbarActions.innerHTML = `
                <button class="messages-btn" id="messages-btn" title="Messages">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21.2 8.4c.5.38.8.97.8 1.6v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10a2 2 0 0 1 .8-1.6l8-6a2 2 0 0 1 2.4 0l8 6Z"/>
                        <path d="m22 10-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 10"/>
                    </svg>
                    <span class="messages-dot" id="messages-dot" style="display: none;"></span>
                </button>
                <div class="user-dropdown">
                    <button class="user-dropdown-btn">
                        <span class="user-avatar">${userName.charAt(0).toUpperCase()}</span>
                        <span class="user-name">${userName}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </button>
                    <div class="user-dropdown-menu">
                        <div class="dropdown-header">
                            <strong>${user?.firstName || ""} ${user?.lastName || ""}</strong>
                            <span>${user?.email || ""}</span>
                        </div>
                        <hr class="dropdown-divider">
                        <a href="dashboard.html" class="dropdown-item">
                            <span>Dashboard</span>
                        </a>
                        <button onclick="logoutUser()" class="dropdown-item text-danger">
                            <span>Log out</span>
                        </button>
                    </div>
                </div>
            `;

      // Setup messages button
      const messagesBtn = navbarActions.querySelector("#messages-btn");
      if (messagesBtn) {
        messagesBtn.addEventListener("click", () => {
          // For now, just show an alert. This can be replaced with actual messages modal
          alert("Messages feature coming soon!");
        });
      }

      // Check for new messages (placeholder - replace with actual API call)
      checkForNewMessages();

      // Setup dropdown toggle
      const dropdownBtn = navbarActions.querySelector(".user-dropdown-btn");
      const dropdownMenu = navbarActions.querySelector(".user-dropdown-menu");

      if (dropdownBtn && dropdownMenu) {
        dropdownBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          dropdownMenu.classList.toggle("active");
        });

        // Close when clicking outside
        document.addEventListener("click", () => {
          dropdownMenu.classList.remove("active");
        });
      }
    }
  }

  // Auto-fill booking form if logged in
  if (isLoggedIn && currentPage === "booking") {
    const user = Session.getUser();
    if (user) {
      const nameField = document.getElementById("booking-name");
      const emailField = document.getElementById("booking-email");
      const phoneField = document.getElementById("booking-phone");

      if (nameField) {
        nameField.value =
          `${user.firstName || ""} ${user.lastName || ""}`.trim();
      }
      if (emailField) {
        emailField.value = user.email || "";
      }
      if (phoneField) {
        phoneField.value = user.phone || "";
      }
    }
  }

  // Update dashboard user info if logged in
  if (isLoggedIn && currentPage === "dashboard") {
    const user = Session.getUser();
    if (user) {
      const avatar = document.querySelector(".dashboard-avatar");
      const name = document.querySelector(".dashboard-user h3");
      const email = document.querySelector(".dashboard-user p");

      if (avatar) {
        avatar.textContent = (user.firstName || "U").charAt(0).toUpperCase();
      }
      if (name) {
        name.textContent =
          `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User";
      }
      if (email) {
        email.textContent = user.email || "";
      }
    }
  }
});

// Function to check for new messages
function checkForNewMessages() {
  // Placeholder: Simulate checking for messages
  // In a real app, this would make an API call to check for unread messages
  const hasNewMessages = Math.random() > 0.7; // 30% chance of having messages for demo

  const messagesDot = document.getElementById("messages-dot");
  if (messagesDot) {
    messagesDot.style.display = hasNewMessages ? "block" : "none";
  }

  // In production, replace with actual API call:
  // fetch('/api/messages/unread')
  //   .then(response => response.json())
  //   .then(data => {
  //     messagesDot.style.display = data.count > 0 ? "block" : "none";
  //   });
}
