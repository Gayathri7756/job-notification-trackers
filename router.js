// ============================================
// KodNest Premium Build System - Router
// ============================================

// Route definitions
const routes = {
  home: {
    render: renderHome
  },
  dashboard: {
    render: renderDashboard
  },
  saved: {
    render: renderSaved
  },
  digest: {
    render: renderDigest
  },
  settings: {
    render: renderSettings
  },
  proof: {
    render: renderProof
  }
};

// Get DOM elements
const routeContent = document.getElementById('routeContent');
const navLinks = document.querySelectorAll('.top-nav__link');
const hamburger = document.getElementById('hamburger');
const navLinksContainer = document.getElementById('navLinks');

// Route render functions
function renderHome() {
  routeContent.innerHTML = `
    <div class="landing-page">
      <div class="landing-page__content">
        <h1 class="landing-page__headline">Stop Missing The Right Jobs.</h1>
        <p class="landing-page__subtext">Precision-matched job discovery delivered daily at 9AM.</p>
        <a href="#settings" class="btn btn-primary btn-large">Start Tracking</a>
      </div>
    </div>
  `;
}

function renderDashboard() {
  routeContent.innerHTML = `
    <div class="page-header">
      <h1>Dashboard</h1>
    </div>
    <div class="empty-state">
      <div class="empty-state__title">No jobs yet</div>
      <div class="empty-state__message">In the next step, you will load a realistic dataset.</div>
    </div>
  `;
}

function renderSettings() {
  routeContent.innerHTML = `
    <div class="page-header">
      <h1>Settings</h1>
      <p class="text-secondary">Configure your job tracking preferences</p>
    </div>
    
    <div class="settings-container">
      <div class="card">
        <h3 class="card__title">Job Preferences</h3>
        <div class="card__content">
          <form class="settings-form">
            <div class="form-group">
              <label class="form-label">Role Keywords</label>
              <input type="text" class="input" placeholder="e.g. Product Manager, Senior Designer">
            </div>
            
            <div class="form-group">
              <label class="form-label">Preferred Locations</label>
              <input type="text" class="input" placeholder="e.g. San Francisco, Remote">
            </div>
            
            <div class="form-group">
              <label class="form-label">Work Mode</label>
              <select class="input">
                <option value="">Select mode</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">Onsite</option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">Experience Level</label>
              <select class="input">
                <option value="">Select level</option>
                <option value="entry">Entry Level (0-2 years)</option>
                <option value="mid">Mid Level (3-5 years)</option>
                <option value="senior">Senior Level (6-10 years)</option>
                <option value="lead">Lead/Principal (10+ years)</option>
              </select>
            </div>
            
            <div class="form-actions">
              <button type="button" class="btn btn-primary">Save Preferences</button>
              <button type="button" class="btn btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}

function renderSaved() {
  routeContent.innerHTML = `
    <div class="page-header">
      <h1>Saved Jobs</h1>
      <p class="text-secondary">Jobs you've bookmarked for later review</p>
    </div>
    <div class="empty-state">
      <div class="empty-state__title">No saved jobs yet</div>
      <div class="empty-state__message">Jobs you save will appear here for easy access</div>
    </div>
  `;
}

function renderDigest() {
  routeContent.innerHTML = `
    <div class="page-header">
      <h1>Daily Digest</h1>
      <p class="text-secondary">Your personalized job matches delivered at 9AM</p>
    </div>
    <div class="empty-state">
      <div class="empty-state__title">No digest available</div>
      <div class="empty-state__message">Your first digest will arrive tomorrow at 9AM</div>
    </div>
  `;
}

function renderProof() {
  routeContent.innerHTML = `
    <div class="page-header">
      <h1>Proof</h1>
      <p class="text-secondary">Track your progress and collect artifacts</p>
    </div>
    <div class="empty-state">
      <div class="empty-state__title">Artifact collection</div>
      <div class="empty-state__message">This section will be built in the next step</div>
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
  
  // Hide nav on home page, show on other pages
  const topNav = document.querySelector('.top-nav');
  if (route === 'home') {
    topNav.style.display = 'none';
  } else {
    topNav.style.display = 'block';
  }
}

// Navigate to route
function navigateTo(route) {
  const routeData = routes[route];
  
  if (!routeData) {
    routeContent.innerHTML = `
      <div class="placeholder-page">
        <h1 class="placeholder-page__title">404</h1>
        <p class="placeholder-page__subtitle">Page not found</p>
      </div>
    `;
  } else {
    routeData.render();
  }
  
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
  const hash = window.location.hash.slice(1) || 'home';
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
