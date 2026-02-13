// ============================================
// KodNest Premium Build System - Router
// ============================================

// Route definitions
const routes = {
  dashboard: {
    title: 'Dashboard',
    subtitle: 'This section will be built in the next step.'
  },
  saved: {
    title: 'Saved',
    subtitle: 'This section will be built in the next step.'
  },
  digest: {
    title: 'Digest',
    subtitle: 'This section will be built in the next step.'
  },
  settings: {
    title: 'Settings',
    subtitle: 'This section will be built in the next step.'
  },
  proof: {
    title: 'Proof',
    subtitle: 'This section will be built in the next step.'
  }
};

// Get DOM elements
const routeContent = document.getElementById('routeContent');
const navLinks = document.querySelectorAll('.top-nav__link');
const hamburger = document.getElementById('hamburger');
const navLinksContainer = document.getElementById('navLinks');

// Render placeholder page
function renderPlaceholder(route) {
  const routeData = routes[route];
  
  if (!routeData) {
    routeContent.innerHTML = `
      <div class="placeholder-page">
        <h1 class="placeholder-page__title">404</h1>
        <p class="placeholder-page__subtitle">Page not found</p>
      </div>
    `;
    return;
  }

  routeContent.innerHTML = `
    <div class="placeholder-page">
      <h1 class="placeholder-page__title">${routeData.title}</h1>
      <p class="placeholder-page__subtitle">${routeData.subtitle}</p>
    </div>
  `;
}

// Update active link
function updateActiveLink(route) {
  navLinks.forEach(link => {
    if (link.dataset.route === route) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// Navigate to route
function navigateTo(route) {
  renderPlaceholder(route);
  updateActiveLink(route);
  
  // Close mobile menu if open
  if (navLinksContainer.classList.contains('active')) {
    navLinksContainer.classList.remove('active');
    hamburger.classList.remove('active');
  }
  
  // Scroll to top
  window.scrollTo(0, 0);
}

// Handle hash change
function handleRouteChange() {
  const hash = window.location.hash.slice(1) || 'dashboard';
  navigateTo(hash);
}

// Initialize router
function initRouter() {
  // Handle hash changes
  window.addEventListener('hashchange', handleRouteChange);
  
  // Handle initial load
  handleRouteChange();
  
  // Handle navigation clicks
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const route = link.dataset.route;
      window.location.hash = route;
    });
  });
  
  // Handle hamburger menu
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinksContainer.classList.toggle('active');
  });
  
  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.top-nav') && navLinksContainer.classList.contains('active')) {
      navLinksContainer.classList.remove('active');
      hamburger.classList.remove('active');
    }
  });
}

// Start the router
initRouter();
