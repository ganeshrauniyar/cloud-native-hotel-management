/* ═══════════════════════════════════════════════════════════════
   APP ORCHESTRATOR — Routing, Modal System, Toasts, Sidebar
   ═══════════════════════════════════════════════════════════════ */

const App = (() => {
  let currentPage = 'dashboard';

  // Module Mapping
  const pages = {
    dashboard: DashboardModule,
    rooms: RoomsModule,
    bookings: BookingsModule,
    guests: GuestsModule,
    checkinout: CheckInOutModule,
    billing: BillingModule,
    staff: StaffModule
  };

  // ── INIT APP ──
  async function init() {
    // Populate the header with the logged-in user
    if (window.Auth) Auth.renderUser();

    // Hydrate data from the backend before first render
    try {
      await HotelData.hydrate();
    } catch (err) {
      console.error(err);
      showToast('Could not load data from server', 'error');
    }

    // Setup Event Listeners
    setupListeners();

    // Check URL Hash for initial route
    const hash = window.location.hash.substring(1);
    const initialPage = pages[hash] ? hash : 'dashboard';
    navigate(initialPage);

    // Initial Badge Refresh
    updateBadges();
  }

  // ── LISTENERS ──
  function setupListeners() {
    // Sidebar Nav Clicks
    document.querySelectorAll('.sidebar-nav .nav-item[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        navigate(btn.dataset.page);
        // On mobile, close sidebar after clicking
        document.getElementById('sidebar').classList.remove('open');
      });
    });

    // Reset Data Button → now re-syncs from the server
    document.getElementById('btn-reset-data').addEventListener('click', () => {
      openModal('Refresh Data', `
        <div class="confirm-dialog">
          <div class="confirm-icon">🔄</div>
          <h4>Reload data from server?</h4>
          <p>This re-fetches the latest rooms, bookings, guests, and invoices from the database.</p>
          <div class="confirm-actions">
            <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="App.resetData()">Refresh</button>
          </div>
        </div>
      `, '');
    });

    // Mobile Menu Button
    document.getElementById('btn-mobile-menu').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });

    // Close Modal on Close Button click or click outside
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
      if (e.target.id === 'modal-overlay') closeModal();
    });

    // Hash change handler
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.substring(1);
      if (pages[hash] && hash !== currentPage) {
        navigate(hash, false);
      }
    });
  }

  // ── NAVIGATION ──
  function navigate(pageId, updateHash = true) {
    if (!pages[pageId]) return;

    currentPage = pageId;

    // Update active nav button
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.page === pageId);
    });

    // Update Top Header Title
    const titleEl = document.getElementById('page-title');
    titleEl.textContent = pageId.replace(/\b\w/g, l => l.toUpperCase()).replace('Checkinout', 'Check-In / Out');

    // Update URL hash
    if (updateHash) {
      window.location.hash = pageId;
    }

    // Render page content
    const contentEl = document.getElementById('page-content');
    contentEl.innerHTML = pages[pageId].render();

    // Call module lifecycle afterRender if exists
    if (pages[pageId].afterRender) {
      pages[pageId].afterRender();
    }

    // Sync state/badges
    updateBadges();
  }

  function refreshPage() {
    navigate(currentPage, false);
  }

  // ── UI STAT BADGES ──
  function updateBadges() {
    const stats = HotelData.stats;
    const badgeRooms = document.getElementById('badge-rooms');
    if (badgeRooms) {
      badgeRooms.textContent = stats.available;
      badgeRooms.className = 'nav-badge';
      if (stats.available > 15) {
        badgeRooms.style.background = 'var(--status-available)';
      } else if (stats.available > 5) {
        badgeRooms.style.background = 'var(--status-reserved)';
      } else {
        badgeRooms.style.background = 'var(--status-occupied)';
      }
    }
  }

  // ── MODAL UTILITIES ──
  function openModal(title, bodyHtml, footerHtml = '') {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHtml;
    
    const footer = document.getElementById('modal-footer');
    if (footerHtml) {
      footer.innerHTML = footerHtml;
      footer.classList.remove('hidden');
    } else {
      footer.innerHTML = '';
      footer.classList.add('hidden');
    }

    document.getElementById('modal-overlay').classList.add('active');
  }

  function closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
  }

  // ── TOAST NOTIFICATIONS ──
  function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = '✨';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'warning') icon = '⚠️';
    if (type === 'info') icon = 'ℹ️';

    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <span class="toast-message">${message}</span>
    `;

    container.appendChild(toast);

    // Auto-remove toast after 4 seconds
    setTimeout(() => {
      toast.classList.add('removing');
      toast.addEventListener('animationend', () => {
        toast.remove();
      });
    }, 4000);
  }

  // ── DATA ACTIONS ──
  async function resetData() {
    await HotelData.resetAll();
    closeModal();
    showToast('Data refreshed from server', 'info');
    navigate('dashboard');
  }

  // Public Interface
  return {
    init,
    navigate,
    refreshPage,
    openModal,
    closeModal,
    showToast,
    resetData
  };
})();

// Bootstrap App
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
