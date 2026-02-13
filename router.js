// ============================================
// KodNest Premium Build System - Router
// ============================================

// State management
let filteredJobs = [...jobsData].sort((a, b) => a.postedDaysAgo - b.postedDaysAgo);
let savedJobIds = JSON.parse(localStorage.getItem('savedJobs') || '[]');
let userPreferences = JSON.parse(localStorage.getItem('jobTrackerPreferences') || 'null');
let showOnlyMatches = false;

// Utility functions
function formatPostedDate(daysAgo) {
  if (daysAgo === 0) return 'Today';
  if (daysAgo === 1) return '1 day ago';
  return `${daysAgo} days ago`;
}

// Match Score Engine
function calculateMatchScore(job) {
  if (!userPreferences) return 0;
  
  let score = 0;
  
  // +25 if any roleKeyword appears in job.title (case-insensitive)
  if (userPreferences.roleKeywords && userPreferences.roleKeywords.length > 0) {
    const titleLower = job.title.toLowerCase();
    const hasKeywordInTitle = userPreferences.roleKeywords.some(keyword => 
      titleLower.includes(keyword.toLowerCase().trim())
    );
    if (hasKeywordInTitle) score += 25;
  }
  
  // +15 if any roleKeyword appears in job.description
  if (userPreferences.roleKeywords && userPreferences.roleKeywords.length > 0) {
    const descLower = job.description.toLowerCase();
    const hasKeywordInDesc = userPreferences.roleKeywords.some(keyword => 
      descLower.includes(keyword.toLowerCase().trim())
    );
    if (hasKeywordInDesc) score += 15;
  }
  
  // +15 if job.location matches preferredLocations
  if (userPreferences.preferredLocations && userPreferences.preferredLocations.length > 0) {
    if (userPreferences.preferredLocations.includes(job.location)) {
      score += 15;
    }
  }
  
  // +10 if job.mode matches preferredMode
  if (userPreferences.preferredMode && userPreferences.preferredMode.length > 0) {
    if (userPreferences.preferredMode.includes(job.mode)) {
      score += 10;
    }
  }
  
  // +10 if job.experience matches experienceLevel
  if (userPreferences.experienceLevel && userPreferences.experienceLevel === job.experience) {
    score += 10;
  }
  
  // +15 if overlap between job.skills and user.skills (any match)
  if (userPreferences.skills && userPreferences.skills.length > 0) {
    const userSkillsLower = userPreferences.skills.map(s => s.toLowerCase().trim());
    const jobSkillsLower = job.skills.map(s => s.toLowerCase().trim());
    const hasSkillMatch = userSkillsLower.some(skill => 
      jobSkillsLower.some(jobSkill => jobSkill.includes(skill) || skill.includes(jobSkill))
    );
    if (hasSkillMatch) score += 15;
  }
  
  // +5 if postedDaysAgo <= 2
  if (job.postedDaysAgo <= 2) {
    score += 5;
  }
  
  // +5 if source is LinkedIn
  if (job.source === 'LinkedIn') {
    score += 5;
  }
  
  // Cap score at 100
  return Math.min(score, 100);
}

function getMatchScoreBadgeClass(score) {
  if (score >= 80) return 'match-badge--excellent';
  if (score >= 60) return 'match-badge--good';
  if (score >= 40) return 'match-badge--neutral';
  return 'match-badge--low';
}

function getMatchScoreLabel(score) {
  if (score >= 80) return 'Excellent Match';
  if (score >= 60) return 'Good Match';
  if (score >= 40) return 'Fair Match';
  return 'Low Match';
}

function saveJob(jobId) {
  if (!savedJobIds.includes(jobId)) {
    savedJobIds.push(jobId);
    localStorage.setItem('savedJobs', JSON.stringify(savedJobIds));
    alert('Job saved successfully!');
    if (window.location.hash.slice(1) === 'dashboard') {
      renderDashboard();
    }
  } else {
    alert('Job already saved!');
  }
}

function unsaveJob(jobId) {
  savedJobIds = savedJobIds.filter(id => id !== jobId);
  localStorage.setItem('savedJobs', JSON.stringify(savedJobIds));
  renderSaved();
}

function showJobModal(jobId) {
  const job = jobsData.find(j => j.id === jobId);
  if (!job) return;
  
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>${job.title}</h2>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
      </div>
      <div class="modal-body">
        <div class="modal-meta">
          <span class="modal-company">${job.company}</span>
          <span class="modal-location">${job.location} • ${job.mode}</span>
        </div>
        <div class="modal-section">
          <h3>Description</h3>
          <p>${job.description}</p>
        </div>
        <div class="modal-section">
          <h3>Required Skills</h3>
          <div class="skills-list">
            ${job.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
          </div>
        </div>
        <div class="modal-section">
          <div class="modal-details">
            <div><strong>Experience:</strong> ${job.experience}</div>
            <div><strong>Salary:</strong> ${job.salaryRange}</div>
            <div><strong>Source:</strong> ${job.source}</div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
        <button class="btn btn-primary" onclick="window.open('${job.applyUrl}', '_blank')">Apply Now</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

function applyFilters() {
  const keyword = document.getElementById('filterKeyword')?.value.toLowerCase() || '';
  const location = document.getElementById('filterLocation')?.value || '';
  const mode = document.getElementById('filterMode')?.value || '';
  const experience = document.getElementById('filterExperience')?.value || '';
  const source = document.getElementById('filterSource')?.value || '';
  const sort = document.getElementById('filterSort')?.value || 'latest';
  
  filteredJobs = jobsData.filter(job => {
    // Apply standard filters (AND logic)
    const matchKeyword = !keyword || 
      job.title.toLowerCase().includes(keyword) || 
      job.company.toLowerCase().includes(keyword);
    const matchLocation = !location || job.location === location;
    const matchMode = !mode || job.mode === mode;
    const matchExperience = !experience || job.experience === experience;
    const matchSource = !source || job.source === source;
    
    const passesFilters = matchKeyword && matchLocation && matchMode && matchExperience && matchSource;
    
    // Apply match threshold filter if enabled
    if (showOnlyMatches && userPreferences) {
      const minScore = userPreferences.minMatchScore || 40;
      const jobScore = calculateMatchScore(job);
      return passesFilters && jobScore >= minScore;
    }
    
    return passesFilters;
  });
  
  // Sort
  if (sort === 'latest') {
    filteredJobs.sort((a, b) => a.postedDaysAgo - b.postedDaysAgo);
  } else if (sort === 'company') {
    filteredJobs.sort((a, b) => a.company.localeCompare(b.company));
  } else if (sort === 'match') {
    filteredJobs.sort((a, b) => calculateMatchScore(b) - calculateMatchScore(a));
  } else if (sort === 'salary') {
    filteredJobs.sort((a, b) => {
      const extractNum = (str) => {
        const match = str.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
      };
      return extractNum(b.salaryRange) - extractNum(a.salaryRange);
    });
  }
  
  renderDashboard();
}

function toggleMatchFilter() {
  showOnlyMatches = !showOnlyMatches;
  applyFilters();
}

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
  const uniqueLocations = [...new Set(jobsData.map(j => j.location))].sort();
  const hasPreferences = userPreferences !== null;
  const minScore = userPreferences?.minMatchScore || 40;
  
  routeContent.innerHTML = `
    <div class="page-header">
      <h1>Dashboard</h1>
      <p class="text-secondary">Discover your next opportunity</p>
    </div>
    
    ${!hasPreferences ? `
      <div class="preference-banner">
        <span>⚙️ Set your preferences to activate intelligent matching.</span>
        <a href="#settings" class="btn btn-secondary btn-sm">Go to Settings</a>
      </div>
    ` : ''}
    
    ${hasPreferences ? `
      <div class="match-toggle">
        <label class="toggle-label">
          <input type="checkbox" id="matchToggle" ${showOnlyMatches ? 'checked' : ''} onchange="toggleMatchFilter()">
          <span>Show only jobs above my threshold (${minScore}%)</span>
        </label>
      </div>
    ` : ''}
    
    <div class="filter-bar">
      <input type="text" id="filterKeyword" class="input filter-input" placeholder="Search by title or company">
      
      <select id="filterLocation" class="input filter-select">
        <option value="">All Locations</option>
        ${uniqueLocations.map(loc => `<option value="${loc}">${loc}</option>`).join('')}
      </select>
      
      <select id="filterMode" class="input filter-select">
        <option value="">All Modes</option>
        <option value="Remote">Remote</option>
        <option value="Hybrid">Hybrid</option>
        <option value="Onsite">Onsite</option>
      </select>
      
      <select id="filterExperience" class="input filter-select">
        <option value="">All Experience</option>
        <option value="Fresher">Fresher</option>
        <option value="0-1">0-1 years</option>
        <option value="1-3">1-3 years</option>
        <option value="3-5">3-5 years</option>
      </select>
      
      <select id="filterSource" class="input filter-select">
        <option value="">All Sources</option>
        <option value="LinkedIn">LinkedIn</option>
        <option value="Naukri">Naukri</option>
        <option value="Indeed">Indeed</option>
      </select>
      
      <select id="filterSort" class="input filter-select">
        <option value="latest">Latest First</option>
        ${hasPreferences ? '<option value="match">Match Score</option>' : ''}
        <option value="salary">Salary (High to Low)</option>
        <option value="company">Company A-Z</option>
      </select>
      
      <button class="btn btn-primary" onclick="applyFilters()">Apply Filters</button>
    </div>
    
    <div class="jobs-grid">
      ${filteredJobs.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state__title">${showOnlyMatches ? 'No roles match your criteria' : 'No jobs found'}</div>
          <div class="empty-state__message">${showOnlyMatches ? 'Adjust filters or lower threshold in settings' : 'Try adjusting your filters'}</div>
        </div>
      ` : filteredJobs.map(job => {
        const matchScore = hasPreferences ? calculateMatchScore(job) : 0;
        const badgeClass = getMatchScoreBadgeClass(matchScore);
        
        return `
        <div class="job-card">
          <div class="job-card__header">
            <div>
              <h3 class="job-card__title">${job.title}</h3>
              <div class="job-card__company">${job.company}</div>
            </div>
            <div class="job-card__badges">
              ${hasPreferences ? `<span class="match-badge ${badgeClass}">${matchScore}%</span>` : ''}
              <span class="source-badge source-badge--${job.source.toLowerCase()}">${job.source}</span>
            </div>
          </div>
          
          <div class="job-card__meta">
            <span>${job.location}</span>
            <span>•</span>
            <span>${job.mode}</span>
            <span>•</span>
            <span>${job.experience}</span>
          </div>
          
          <div class="job-card__salary">${job.salaryRange}</div>
          
          <div class="job-card__footer">
            <span class="job-card__posted">${formatPostedDate(job.postedDaysAgo)}</span>
            <div class="job-card__actions">
              <button class="btn btn-secondary btn-sm" onclick="showJobModal(${job.id})">View</button>
              <button class="btn btn-secondary btn-sm" onclick="saveJob(${job.id})">Save</button>
              <button class="btn btn-primary btn-sm" onclick="window.open('${job.applyUrl}', '_blank')">Apply</button>
            </div>
          </div>
        </div>
      `}).join('')}
    </div>
  `;
  
  // Attach event listeners
  document.getElementById('filterKeyword')?.addEventListener('input', applyFilters);
}

function renderSettings() {
  const prefs = userPreferences || {};
  const uniqueLocations = [...new Set(jobsData.map(j => j.location))].sort();
  
  routeContent.innerHTML = `
    <div class="page-header">
      <h1>Settings</h1>
      <p class="text-secondary">Configure your job tracking preferences</p>
    </div>
    
    <div class="settings-container">
      <div class="card">
        <h3 class="card__title">Job Preferences</h3>
        <div class="card__content">
          <form class="settings-form" id="preferencesForm">
            <div class="form-group">
              <label class="form-label">Role Keywords (comma-separated)</label>
              <input type="text" id="roleKeywords" class="input" placeholder="e.g. Developer, Engineer, Intern" value="${(prefs.roleKeywords || []).join(', ')}">
              <small class="form-hint">Keywords to match in job titles and descriptions</small>
            </div>
            
            <div class="form-group">
              <label class="form-label">Preferred Locations</label>
              <select id="preferredLocations" class="input" multiple size="5">
                ${uniqueLocations.map(loc => `
                  <option value="${loc}" ${(prefs.preferredLocations || []).includes(loc) ? 'selected' : ''}>${loc}</option>
                `).join('')}
              </select>
              <small class="form-hint">Hold Ctrl/Cmd to select multiple</small>
            </div>
            
            <div class="form-group">
              <label class="form-label">Work Mode</label>
              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" name="preferredMode" value="Remote" ${(prefs.preferredMode || []).includes('Remote') ? 'checked' : ''}>
                  <span>Remote</span>
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" name="preferredMode" value="Hybrid" ${(prefs.preferredMode || []).includes('Hybrid') ? 'checked' : ''}>
                  <span>Hybrid</span>
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" name="preferredMode" value="Onsite" ${(prefs.preferredMode || []).includes('Onsite') ? 'checked' : ''}>
                  <span>Onsite</span>
                </label>
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">Experience Level</label>
              <select id="experienceLevel" class="input">
                <option value="">Any</option>
                <option value="Fresher" ${prefs.experienceLevel === 'Fresher' ? 'selected' : ''}>Fresher</option>
                <option value="0-1" ${prefs.experienceLevel === '0-1' ? 'selected' : ''}>0-1 years</option>
                <option value="1-3" ${prefs.experienceLevel === '1-3' ? 'selected' : ''}>1-3 years</option>
                <option value="3-5" ${prefs.experienceLevel === '3-5' ? 'selected' : ''}>3-5 years</option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">Skills (comma-separated)</label>
              <input type="text" id="skills" class="input" placeholder="e.g. React, Python, Java" value="${(prefs.skills || []).join(', ')}">
              <small class="form-hint">Skills you have or want to work with</small>
            </div>
            
            <div class="form-group">
              <label class="form-label">Minimum Match Score: <span id="minScoreValue">${prefs.minMatchScore || 40}</span>%</label>
              <input type="range" id="minMatchScore" class="slider" min="0" max="100" value="${prefs.minMatchScore || 40}" oninput="document.getElementById('minScoreValue').textContent = this.value">
              <small class="form-hint">Only show jobs with match score above this threshold</small>
            </div>
            
            <div class="form-actions">
              <button type="button" class="btn btn-primary" onclick="savePreferences()">Save Preferences</button>
              <button type="button" class="btn btn-secondary" onclick="window.location.hash='dashboard'">Cancel</button>
              ${Object.keys(prefs).length > 0 ? '<button type="button" class="btn btn-warning" onclick="clearPreferences()">Clear Preferences</button>' : ''}
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}

function savePreferences() {
  const roleKeywords = document.getElementById('roleKeywords').value
    .split(',')
    .map(k => k.trim())
    .filter(k => k.length > 0);
  
  const preferredLocations = Array.from(document.getElementById('preferredLocations').selectedOptions)
    .map(opt => opt.value);
  
  const preferredMode = Array.from(document.querySelectorAll('input[name="preferredMode"]:checked'))
    .map(cb => cb.value);
  
  const experienceLevel = document.getElementById('experienceLevel').value;
  
  const skills = document.getElementById('skills').value
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  const minMatchScore = parseInt(document.getElementById('minMatchScore').value);
  
  userPreferences = {
    roleKeywords,
    preferredLocations,
    preferredMode,
    experienceLevel,
    skills,
    minMatchScore
  };
  
  localStorage.setItem('jobTrackerPreferences', JSON.stringify(userPreferences));
  
  alert('Preferences saved successfully!');
  window.location.hash = 'dashboard';
}

function clearPreferences() {
  if (confirm('Are you sure you want to clear all preferences?')) {
    localStorage.removeItem('jobTrackerPreferences');
    userPreferences = null;
    showOnlyMatches = false;
    alert('Preferences cleared successfully!');
    window.location.hash = 'dashboard';
  }
}

function renderSaved() {
  const savedJobs = jobsData.filter(job => savedJobIds.includes(job.id));
  
  routeContent.innerHTML = `
    <div class="page-header">
      <h1>Saved Jobs</h1>
      <p class="text-secondary">Jobs you've bookmarked for later review</p>
    </div>
    
    ${savedJobs.length === 0 ? `
      <div class="empty-state">
        <div class="empty-state__title">No saved jobs yet</div>
        <div class="empty-state__message">Jobs you save will appear here for easy access</div>
      </div>
    ` : `
      <div class="jobs-grid">
        ${savedJobs.map(job => `
          <div class="job-card">
            <div class="job-card__header">
              <div>
                <h3 class="job-card__title">${job.title}</h3>
                <div class="job-card__company">${job.company}</div>
              </div>
              <span class="source-badge source-badge--${job.source.toLowerCase()}">${job.source}</span>
            </div>
            
            <div class="job-card__meta">
              <span>${job.location}</span>
              <span>•</span>
              <span>${job.mode}</span>
              <span>•</span>
              <span>${job.experience}</span>
            </div>
            
            <div class="job-card__salary">${job.salaryRange}</div>
            
            <div class="job-card__footer">
              <span class="job-card__posted">${formatPostedDate(job.postedDaysAgo)}</span>
              <div class="job-card__actions">
                <button class="btn btn-secondary btn-sm" onclick="showJobModal(${job.id})">View</button>
                <button class="btn btn-warning btn-sm" onclick="unsaveJob(${job.id})">Remove</button>
                <button class="btn btn-primary btn-sm" onclick="window.open('${job.applyUrl}', '_blank')">Apply</button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `}
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
