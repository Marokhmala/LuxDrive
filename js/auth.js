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
                        <button onclick="logoutUser()" class="dropdown-item text-danger">
                            <span>Log out</span>
                        </button>
                    </div>
                </div>
            `;
            
            // Setup dropdown toggle
            const dropdownBtn = navbarActions.querySelector('.user-dropdown-btn');
            const dropdownMenu = navbarActions.querySelector('.user-dropdown-menu');
            
            if (dropdownBtn && dropdownMenu) {
                dropdownBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    dropdownMenu.classList.toggle('active');
                });
                
                // Close when clicking outside
                document.addEventListener('click', () => {
                    dropdownMenu.classList.remove('active');
                });
            }
        }
    }
});
