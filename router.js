// ============================================
// KodNest Premium Build System - Router
// ============================================

// State management
let filteredJobs = [...jobsData].sort((a, b) => a.postedDaysAgo - b.postedDaysAgo);
let savedJobIds = JSON.parse(localStorage.getItem('savedJobs') || '[]');
let userPreferences = JSON.parse(localStorage.getItem('jobTrackerPreferences') || 'null');
let jobStatuses = JSON.parse(localStorage.getItem('jobTrackerStatus') || '{}');
let showOnlyMatches = false;

// Utility functions
function formatPostedDate(daysAgo) {
  if (daysAgo === 0) return 'Today';
  if (daysAgo === 1) return '1 day ago';
  return `${daysAgo} days ago`;
}

// Job Status Management
function getJobStatus(jobId) {
  return jobStatuses[jobId] || 'Not Applied';
}

function setJobStatus(jobId, status) {
  jobStatuses[jobId] = status;
  localStorage.setItem('jobTrackerStatus', JSON.stringify(jobStatuses));
  
  // Store status change history for digest
  const statusHistory = JSON.parse(localStorage.getItem('jobStatusHistory') || '[]');
  statusHistory.unshift({
    jobId,
    status,
    timestamp: new Date().toISOString()
  });
  // Keep only last 20 status changes
  localStorage.setItem('jobStatusHistory', JSON.stringify(statusHistory.slice(0, 20)));
  
  // Show toast notification
  showToast(`Status updated: ${status}`);
  
  // Re-render current page
  const currentRoute = window.location.hash.slice(1) || 'home';
  if (currentRoute === 'dashboard') renderDashboard();
  if (currentRoute === 'saved') renderSaved();
}

function getStatusBadgeClass(status) {
  switch(status) {
    case 'Applied': return 'status-badge--applied';
    case 'Rejected': return 'status-badge--rejected';
    case 'Selected': return 'status-badge--selected';
    default: return 'status-badge--not-applied';
  }
}

function showToast(message) {
  // Remove existing toast if any
  const existingToast = document.querySelector('.toast');
  if (existingToast) existingToast.remove();
  
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => toast.classList.add('toast--show'), 10);
  
  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove('toast--show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
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
  const status = document.getElementById('filterStatus')?.value || '';
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
    const matchStatus = !status || getJobStatus(job.id) === status;
    
    const passesFilters = matchKeyword && matchLocation && matchMode && matchExperience && matchSource && matchStatus;
    
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
    filteredJobs.sort((a, b) => {
      const companyA = a.company.toLowerCase();
      const companyB = b.company.toLowerCase();
      return companyA.localeCompare(companyB);
    });
  } else if (sort === 'match') {
    filteredJobs.sort((a, b) => calculateMatchScore(b) - calculateMatchScore(a));
  } else if (sort === 'salary') {
    filteredJobs.sort((a, b) => {
      const extractMaxSalary = (str) => {
        // Extract all numbers from salary string
        const numbers = str.match(/\d+/g);
        if (!numbers || numbers.length === 0) return 0;
        
        // For ranges like "10-18 LPA", take the max (18)
        // For internships like "₹25k-₹40k/month", take the max (40)
        const maxNum = Math.max(...numbers.map(n => parseInt(n)));
        
        // If it's in LPA (Lakhs Per Annum), multiply by 100 to compare with monthly
        if (str.includes('LPA')) {
          return maxNum * 100;
        }
        // If it's monthly internship (in thousands), keep as is
        return maxNum;
      };
      
      return extractMaxSalary(b.salaryRange) - extractMaxSalary(a.salaryRange);
    });
  }
  
  renderDashboard();
}

function toggleMatchFilter() {
  showOnlyMatches = !showOnlyMatches;
  applyFilters();
}

function clearFilters() {
  // Reset all filter values
  document.getElementById('filterKeyword').value = '';
  document.getElementById('filterLocation').value = '';
  document.getElementById('filterMode').value = '';
  document.getElementById('filterExperience').value = '';
  document.getElementById('filterSource').value = '';
  document.getElementById('filterStatus').value = '';
  document.getElementById('filterSort').value = 'latest';
  
  // Reset filtered jobs to all jobs
  filteredJobs = [...jobsData].sort((a, b) => a.postedDaysAgo - b.postedDaysAgo);
  
  // Re-render dashboard
  renderDashboard();
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
  
  // Preserve current filter values
  const currentFilters = {
    keyword: document.getElementById('filterKeyword')?.value || '',
    location: document.getElementById('filterLocation')?.value || '',
    mode: document.getElementById('filterMode')?.value || '',
    experience: document.getElementById('filterExperience')?.value || '',
    source: document.getElementById('filterSource')?.value || '',
    status: document.getElementById('filterStatus')?.value || '',
    sort: document.getElementById('filterSort')?.value || 'latest'
  };
  
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
      <input type="text" id="filterKeyword" class="input filter-input" placeholder="Search by title or company" value="${currentFilters.keyword}">
      
      <select id="filterLocation" class="input filter-select">
        <option value="">All Locations</option>
        ${uniqueLocations.map(loc => `<option value="${loc}" ${currentFilters.location === loc ? 'selected' : ''}>${loc}</option>`).join('')}
      </select>
      
      <select id="filterMode" class="input filter-select">
        <option value="">All Modes</option>
        <option value="Remote" ${currentFilters.mode === 'Remote' ? 'selected' : ''}>Remote</option>
        <option value="Hybrid" ${currentFilters.mode === 'Hybrid' ? 'selected' : ''}>Hybrid</option>
        <option value="Onsite" ${currentFilters.mode === 'Onsite' ? 'selected' : ''}>Onsite</option>
      </select>
      
      <select id="filterExperience" class="input filter-select">
        <option value="">All Experience</option>
        <option value="Fresher" ${currentFilters.experience === 'Fresher' ? 'selected' : ''}>Fresher</option>
        <option value="0-1" ${currentFilters.experience === '0-1' ? 'selected' : ''}>0-1 years</option>
        <option value="1-3" ${currentFilters.experience === '1-3' ? 'selected' : ''}>1-3 years</option>
        <option value="3-5" ${currentFilters.experience === '3-5' ? 'selected' : ''}>3-5 years</option>
      </select>
      
      <select id="filterSource" class="input filter-select">
        <option value="">All Sources</option>
        <option value="LinkedIn" ${currentFilters.source === 'LinkedIn' ? 'selected' : ''}>LinkedIn</option>
        <option value="Naukri" ${currentFilters.source === 'Naukri' ? 'selected' : ''}>Naukri</option>
        <option value="Indeed" ${currentFilters.source === 'Indeed' ? 'selected' : ''}>Indeed</option>
      </select>
      
      <select id="filterStatus" class="input filter-select">
        <option value="">All Status</option>
        <option value="Not Applied" ${currentFilters.status === 'Not Applied' ? 'selected' : ''}>Not Applied</option>
        <option value="Applied" ${currentFilters.status === 'Applied' ? 'selected' : ''}>Applied</option>
        <option value="Rejected" ${currentFilters.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
        <option value="Selected" ${currentFilters.status === 'Selected' ? 'selected' : ''}>Selected</option>
      </select>
      
      <select id="filterSort" class="input filter-select">
        <option value="latest" ${currentFilters.sort === 'latest' ? 'selected' : ''}>Latest First</option>
        ${hasPreferences ? `<option value="match" ${currentFilters.sort === 'match' ? 'selected' : ''}>Match Score</option>` : ''}
        <option value="salary" ${currentFilters.sort === 'salary' ? 'selected' : ''}>Salary (High to Low)</option>
        <option value="company" ${currentFilters.sort === 'company' ? 'selected' : ''}>Company A-Z</option>
      </select>
      
      <button type="button" class="btn btn-primary" onclick="applyFilters()">Apply Filters</button>
      <button type="button" class="btn btn-secondary" onclick="clearFilters()">Clear Filters</button>
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
        const currentStatus = getJobStatus(job.id);
        const statusBadgeClass = getStatusBadgeClass(currentStatus);
        
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
          
          <div class="job-card__status">
            <span class="status-badge ${statusBadgeClass}">${currentStatus}</span>
            <div class="status-buttons">
              <button type="button" class="status-btn ${currentStatus === 'Not Applied' ? 'status-btn--active' : ''}" onclick="setJobStatus(${job.id}, 'Not Applied')" title="Not Applied">Not Applied</button>
              <button type="button" class="status-btn status-btn--applied ${currentStatus === 'Applied' ? 'status-btn--active' : ''}" onclick="setJobStatus(${job.id}, 'Applied')" title="Applied">Applied</button>
              <button type="button" class="status-btn status-btn--rejected ${currentStatus === 'Rejected' ? 'status-btn--active' : ''}" onclick="setJobStatus(${job.id}, 'Rejected')" title="Rejected">Rejected</button>
              <button type="button" class="status-btn status-btn--selected ${currentStatus === 'Selected' ? 'status-btn--active' : ''}" onclick="setJobStatus(${job.id}, 'Selected')" title="Selected">Selected</button>
            </div>
          </div>
          
          <div class="job-card__footer">
            <span class="job-card__posted">${formatPostedDate(job.postedDaysAgo)}</span>
            <div class="job-card__actions">
              <button type="button" class="btn btn-secondary btn-sm" onclick="showJobModal(${job.id})">View</button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="saveJob(${job.id})">Save</button>
              <button type="button" class="btn btn-primary btn-sm" onclick="window.open('${job.applyUrl}', '_blank')">Apply</button>
            </div>
          </div>
        </div>
      `}).join('')}
    </div>
  `;
  
  // Only attach event listener for keyword search (live search)
  setTimeout(() => {
    const keywordInput = document.getElementById('filterKeyword');
    if (keywordInput) {
      keywordInput.addEventListener('input', () => {
        // Auto-apply only for keyword search
        applyFilters();
      });
    }
  }, 0);
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

function generateDigest() {
  if (!userPreferences) {
    alert('Please set your preferences first!');
    window.location.hash = 'settings';
    return;
  }
  
  console.log('🔍 Generating digest with preferences:', userPreferences);
  
  // Calculate match scores for all jobs
  const jobsWithScores = jobsData.map(job => {
    const score = calculateMatchScore(job);
    console.log(`${job.title} at ${job.company} (${job.location}, ${job.mode}): ${score}% match`);
    return {
      ...job,
      matchScore: score
    };
  });
  
  // Apply strict filtering based on user preferences
  let filteredJobs = jobsWithScores;
  
  // Filter by work mode if specified (STRICT)
  if (userPreferences.preferredMode && userPreferences.preferredMode.length > 0) {
    filteredJobs = filteredJobs.filter(job => userPreferences.preferredMode.includes(job.mode));
    console.log(`After mode filter (${userPreferences.preferredMode.join(', ')}): ${filteredJobs.length} jobs`);
  }
  
  // Filter by location if specified (STRICT)
  if (userPreferences.preferredLocations && userPreferences.preferredLocations.length > 0) {
    filteredJobs = filteredJobs.filter(job => userPreferences.preferredLocations.includes(job.location));
    console.log(`After location filter (${userPreferences.preferredLocations.join(', ')}): ${filteredJobs.length} jobs`);
  }
  
  // Filter by experience if specified (STRICT)
  if (userPreferences.experienceLevel && userPreferences.experienceLevel !== '') {
    filteredJobs = filteredJobs.filter(job => job.experience === userPreferences.experienceLevel);
    console.log(`After experience filter (${userPreferences.experienceLevel}): ${filteredJobs.length} jobs`);
  }
  
  // Only include jobs with match score > 0 (at least some keyword/skill match)
  const matchingJobs = filteredJobs.filter(job => job.matchScore > 0);
  console.log(`After score filter (>0%): ${matchingJobs.length} jobs`);
  
  // Further filter based on user's minimum threshold if set
  const minThreshold = userPreferences.minMatchScore || 0;
  const qualifiedJobs = matchingJobs.filter(job => job.matchScore >= minThreshold);
  console.log(`After threshold filter (>=${minThreshold}%): ${qualifiedJobs.length} jobs`);
  
  // Sort by match score (highest first) and take top 10
  const topJobs = qualifiedJobs
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 10);
  
  console.log(`Top ${topJobs.length} jobs for digest:`, topJobs.map(j => `${j.title} at ${j.company} (${j.mode}) - ${j.matchScore}%`));
  
  // Create digest object
  const digest = {
    date: new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    generatedAt: new Date().toISOString(),
    jobs: topJobs,
    totalMatching: matchingJobs.length,
    totalQualified: qualifiedJobs.length,
    appliedFilters: {
      mode: userPreferences.preferredMode,
      locations: userPreferences.preferredLocations,
      experience: userPreferences.experienceLevel,
      minScore: minThreshold
    }
  };
  
  // Save to localStorage
  localStorage.setItem('dailyDigest', JSON.stringify(digest));
  console.log('✅ Digest saved to localStorage');
  
  // Re-render digest page
  renderDigest();
}

function copyDigestToClipboard() {
  const savedDigest = JSON.parse(localStorage.getItem('dailyDigest') || 'null');
  if (!savedDigest) return;
  
  let textContent = `DAILY JOB DIGEST - ${savedDigest.date}\n`;
  
  if (savedDigest.jobs.length === 0) {
    textContent += `No matching roles found today\n\n`;
    textContent += `We searched through ${jobsData.length} jobs but couldn't find any that match your preferences.\n\n`;
    textContent += `Suggestions:\n`;
    textContent += `- Add more role keywords\n`;
    textContent += `- Include more locations\n`;
    textContent += `- Consider all work modes\n`;
    textContent += `- Lower your minimum match score\n\n`;
  } else {
    textContent += `Top ${savedDigest.jobs.length} matches based on your preferences\n\n`;
    
    savedDigest.jobs.forEach((job, index) => {
      textContent += `${index + 1}. ${job.title} at ${job.company}\n`;
      textContent += `   Location: ${job.location} | Mode: ${job.mode} | Experience: ${job.experience}\n`;
      textContent += `   Salary: ${job.salaryRange} | Match: ${job.matchScore}%\n`;
      textContent += `   Apply: ${job.applyUrl}\n\n`;
    });
  }
  
  textContent += `Generated by Job Notification Tracker\n`;
  textContent += `${window.location.origin}${window.location.pathname}`;
  
  navigator.clipboard.writeText(textContent).then(() => {
    alert('Digest copied to clipboard!');
  }).catch(() => {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = textContent;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    alert('Digest copied to clipboard!');
  });
}

function createEmailDraft() {
  const savedDigest = JSON.parse(localStorage.getItem('dailyDigest') || 'null');
  if (!savedDigest) return;
  
  const subject = `Daily Job Digest - ${savedDigest.date}`;
  let body = `Hi there!\n\nHere's your personalized job digest for ${savedDigest.date}:\n\n`;
  
  if (savedDigest.jobs.length === 0) {
    body += `Unfortunately, no jobs matched your preferences today.\n\n`;
    body += `We searched through ${jobsData.length} available positions, but none met your criteria.\n\n`;
    body += `Consider:\n`;
    body += `• Adding more role keywords\n`;
    body += `• Including additional locations\n`;
    body += `• Adjusting work mode preferences\n`;
    body += `• Lowering your minimum match score\n\n`;
    body += `Don't worry - new jobs are added regularly. Check back tomorrow!\n\n`;
  } else {
    savedDigest.jobs.forEach((job, index) => {
      body += `${index + 1}. ${job.title} at ${job.company}\n`;
      body += `   📍 ${job.location} | 💼 ${job.mode} | 📊 ${job.experience}\n`;
      body += `   💰 ${job.salaryRange} | ⭐ ${job.matchScore}% match\n`;
      body += `   🔗 Apply: ${job.applyUrl}\n\n`;
    });
  }
  
  body += `Best regards,\nJob Notification Tracker\n\n`;
  body += `Generated at: ${new Date(savedDigest.generatedAt).toLocaleString()}`;
  
  const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(mailtoLink);
}

function clearDigestCache() {
  localStorage.removeItem('dailyDigest');
  console.log('🗑️ Digest cache cleared');
  alert('Digest cache cleared! Generating new digest with current preferences...');
  generateDigest();
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
        ${savedJobs.map(job => {
          const currentStatus = getJobStatus(job.id);
          const statusBadgeClass = getStatusBadgeClass(currentStatus);
          
          return `
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
            
            <div class="job-card__status">
              <span class="status-badge ${statusBadgeClass}">${currentStatus}</span>
              <div class="status-buttons">
                <button type="button" class="status-btn ${currentStatus === 'Not Applied' ? 'status-btn--active' : ''}" onclick="setJobStatus(${job.id}, 'Not Applied')" title="Not Applied">Not Applied</button>
                <button type="button" class="status-btn status-btn--applied ${currentStatus === 'Applied' ? 'status-btn--active' : ''}" onclick="setJobStatus(${job.id}, 'Applied')" title="Applied">Applied</button>
                <button type="button" class="status-btn status-btn--rejected ${currentStatus === 'Rejected' ? 'status-btn--active' : ''}" onclick="setJobStatus(${job.id}, 'Rejected')" title="Rejected">Rejected</button>
                <button type="button" class="status-btn status-btn--selected ${currentStatus === 'Selected' ? 'status-btn--active' : ''}" onclick="setJobStatus(${job.id}, 'Selected')" title="Selected">Selected</button>
              </div>
            </div>
            
            <div class="job-card__footer">
              <span class="job-card__posted">${formatPostedDate(job.postedDaysAgo)}</span>
              <div class="job-card__actions">
                <button type="button" class="btn btn-secondary btn-sm" onclick="showJobModal(${job.id})">View</button>
                <button type="button" class="btn btn-warning btn-sm" onclick="unsaveJob(${job.id})">Remove</button>
                <button type="button" class="btn btn-primary btn-sm" onclick="window.open('${job.applyUrl}', '_blank')">Apply</button>
              </div>
            </div>
          </div>
        `}).join('')}
      </div>
    `}
  `;
}

function renderDigest() {
  const hasPreferences = userPreferences !== null;
  const savedDigest = JSON.parse(localStorage.getItem('dailyDigest') || 'null');
  const statusHistory = JSON.parse(localStorage.getItem('jobStatusHistory') || '[]');
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // Check if saved digest is from today
  const isDigestFromToday = savedDigest && savedDigest.date === today;
  
  // Get recent status updates (last 10)
  const recentUpdates = statusHistory.slice(0, 10).map(update => {
    const job = jobsData.find(j => j.id === update.jobId);
    if (!job) return null;
    return {
      ...update,
      job
    };
  }).filter(u => u !== null);
  
  routeContent.innerHTML = `
    <div class="page-header">
      <h1>Daily Digest</h1>
      <p class="text-secondary">Your personalized job matches delivered at 9AM</p>
    </div>
    
    ${!hasPreferences ? `
      <div class="preference-banner">
        <span>⚙️ Set your preferences to generate personalized digest.</span>
        <a href="#settings" class="btn btn-secondary btn-sm">Go to Settings</a>
      </div>
    ` : ''}
    
    ${recentUpdates.length > 0 ? `
      <div class="status-updates-section">
        <h2 class="section-title">Recent Status Updates</h2>
        <div class="status-updates-list">
          ${recentUpdates.map(update => {
            const statusBadgeClass = getStatusBadgeClass(update.status);
            const updateDate = new Date(update.timestamp);
            const formattedDate = updateDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const formattedTime = updateDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            
            return `
              <div class="status-update-item">
                <div class="status-update-content">
                  <h4 class="status-update-title">${update.job.title}</h4>
                  <div class="status-update-company">${update.job.company}</div>
                </div>
                <div class="status-update-meta">
                  <span class="status-badge ${statusBadgeClass}">${update.status}</span>
                  <span class="status-update-date">${formattedDate} at ${formattedTime}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    ` : ''}
    
    ${hasPreferences && !isDigestFromToday ? `
      <div class="digest-generator">
        <div class="card">
          <h3 class="card__title">Generate Today's Digest</h3>
          <div class="card__content">
            <p>Get your top 10 matched jobs for ${today}</p>
            <button type="button" class="btn btn-primary" onclick="generateDigest()">Generate Today's 9AM Digest</button>
          </div>
        </div>
      </div>
    ` : ''}
    
    ${hasPreferences && isDigestFromToday ? `
      <div class="digest-container">
        ${savedDigest.jobs.length === 0 ? `
          <div class="digest-card">
            <div class="digest-header">
              <h2>Daily Job Digest</h2>
              <div class="digest-date">${savedDigest.date}</div>
              <div class="digest-subtitle">No matching roles found</div>
            </div>
            
            <div class="digest-content">
              <div class="empty-state">
                <div class="empty-state__title">No matching roles today</div>
                <div class="empty-state__message">
                  ${savedDigest.totalMatching === 0 
                    ? 'No jobs match any of your criteria. Try broadening your preferences.' 
                    : `Found ${savedDigest.totalMatching} jobs with some matches, but none meet your ${userPreferences.minMatchScore}% threshold. Lower your minimum score in settings.`
                  }
                </div>
                <div class="digest-suggestions">
                  <p><strong>Suggestions:</strong></p>
                  <ul>
                    <li>Add more role keywords (e.g., "Analyst", "Associate", "Trainee")</li>
                    <li>Include more locations</li>
                    <li>Consider all work modes (Remote, Hybrid, Onsite)</li>
                    <li>Lower your minimum match score threshold</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div class="digest-actions">
              <a href="#settings" class="btn btn-secondary">Update Preferences</a>
              <button type="button" class="btn btn-primary" onclick="generateDigest()">Try Again</button>
            </div>
          </div>
        ` : `
          <div class="digest-card">
            <div class="digest-header">
              <h2>Daily Job Digest</h2>
              <div class="digest-date">${savedDigest.date}</div>
              <div class="digest-subtitle">Top ${savedDigest.jobs.length} matches based on your preferences</div>
            </div>
            
            <div class="digest-content">
              ${savedDigest.jobs.map((job, index) => `
                <div class="digest-job">
                  <div class="digest-job__rank">${index + 1}</div>
                  <div class="digest-job__content">
                    <h4 class="digest-job__title">${job.title}</h4>
                    <div class="digest-job__company">${job.company}</div>
                    <div class="digest-job__meta">
                      <span>${job.location}</span> • 
                      <span>${job.mode}</span> • 
                      <span>${job.experience}</span> • 
                      <span class="digest-job__score">${job.matchScore}% match</span>
                    </div>
                    <div class="digest-job__salary">${job.salaryRange}</div>
                  </div>
                </div>
              `).join('')}
            </div>
            
            <div class="digest-actions">
              <button type="button" class="btn btn-secondary" onclick="copyDigestToClipboard()">Copy Digest to Clipboard</button>
              <button type="button" class="btn btn-secondary" onclick="createEmailDraft()">Create Email Draft</button>
              <button type="button" class="btn btn-primary" onclick="generateDigest()">Regenerate Digest</button>
              <button type="button" class="btn btn-warning" onclick="clearDigestCache()">Clear Cache & Regenerate</button>
            </div>
          </div>
        `}
      </div>
    ` : ''}
    
    ${!hasPreferences || (!isDigestFromToday && !hasPreferences) ? `
      <div class="empty-state">
        <div class="empty-state__title">No digest available</div>
        <div class="empty-state__message">${!hasPreferences ? 'Set your preferences first to generate personalized digest' : 'Generate your first digest for today'}</div>
      </div>
    ` : ''}
  `;
}

function renderProof() {
  const testChecklist = JSON.parse(localStorage.getItem('testChecklist') || '{}');
  const proofData = JSON.parse(localStorage.getItem('proofData') || '{}');
  
  const tests = [
    { id: 'preferences-persist', label: 'Preferences persist after refresh', tooltip: 'Go to Settings, fill preferences, save, refresh page, check if values are still there' },
    { id: 'match-score', label: 'Match score calculates correctly', tooltip: 'Set preferences, check if job cards show match score badges with correct percentages' },
    { id: 'show-matches-toggle', label: '"Show only matches" toggle works', tooltip: 'Enable toggle on Dashboard, verify only jobs above threshold are shown' },
    { id: 'save-job-persist', label: 'Save job persists after refresh', tooltip: 'Click Save on a job, refresh page, check if job appears in Saved page' },
    { id: 'apply-new-tab', label: 'Apply opens in new tab', tooltip: 'Click Apply button on any job, verify it opens company career page in new tab' },
    { id: 'status-persist', label: 'Status update persists after refresh', tooltip: 'Change job status to Applied, refresh page, verify status is still Applied' },
    { id: 'status-filter', label: 'Status filter works correctly', tooltip: 'Set status filter to Applied, click Apply Filters, verify only Applied jobs show' },
    { id: 'digest-top-10', label: 'Digest generates top 10 by score', tooltip: 'Generate digest, verify it shows top 10 jobs sorted by match score' },
    { id: 'digest-persist', label: 'Digest persists for the day', tooltip: 'Generate digest, refresh page, verify same digest is still showing' },
    { id: 'no-console-errors', label: 'No console errors on main pages', tooltip: 'Open DevTools Console (F12), navigate through all pages, verify no red errors' }
  ];
  
  const steps = [
    { id: 1, name: 'KodNest Premium Design System', status: 'Completed' },
    { id: 2, name: 'Route Skeleton', status: 'Completed' },
    { id: 3, name: 'Landing Page & Navigation', status: 'Completed' },
    { id: 4, name: 'Job Data & Rendering', status: 'Completed' },
    { id: 5, name: 'Preferences & Match Scoring', status: 'Completed' },
    { id: 6, name: 'Daily Digest Engine', status: 'Completed' },
    { id: 7, name: 'Job Status Tracking', status: 'Completed' },
    { id: 8, name: 'Test Checklist System', status: 'Completed' }
  ];
  
  const checkedCount = tests.filter(test => testChecklist[test.id]).length;
  const allTestsPassed = checkedCount === tests.length;
  
  const hasLovableLink = proofData.lovableLink && isValidUrl(proofData.lovableLink);
  const hasGithubLink = proofData.githubLink && isValidUrl(proofData.githubLink);
  const hasDeployedUrl = proofData.deployedUrl && isValidUrl(proofData.deployedUrl);
  const allLinksProvided = hasLovableLink && hasGithubLink && hasDeployedUrl;
  
  const isShipped = allTestsPassed && allLinksProvided;
  const projectStatus = isShipped ? 'Shipped' : (allLinksProvided || checkedCount > 0 ? 'In Progress' : 'Not Started');
  
  routeContent.innerHTML = `
    <div class="page-header">
      <h1>Proof & Submission</h1>
      <p class="text-secondary">Finalize and submit your project</p>
    </div>
    
    <div class="proof-container">
      
      <!-- PROJECT STATUS -->
      <div class="card proof-status-card">
        <div class="proof-status">
          <div class="proof-status__header">
            <h2>Project 1 — Job Notification Tracker</h2>
            <span class="status-badge status-badge--${projectStatus.toLowerCase().replace(' ', '-')}">${projectStatus}</span>
          </div>
          ${isShipped ? `
            <div class="proof-shipped-message">
              ✅ Project 1 Shipped Successfully.
            </div>
          ` : ''}
        </div>
      </div>
      
      <!-- STEP COMPLETION SUMMARY -->
      <div class="card">
        <h3 class="card__title">Step Completion Summary</h3>
        <div class="card__content">
          <div class="steps-list">
            ${steps.map(step => `
              <div class="step-item step-item--${step.status.toLowerCase()}">
                <div class="step-item__number">${step.id}</div>
                <div class="step-item__name">${step.name}</div>
                <div class="step-item__status">${step.status}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
      
      <!-- TEST CHECKLIST -->
      <div class="card">
        <h3 class="card__title">Test Checklist</h3>
        <div class="test-summary ${allTestsPassed ? 'test-summary--complete' : 'test-summary--incomplete'}">
          <div class="test-summary__count">
            <span class="test-summary__number">${checkedCount}</span>
            <span class="test-summary__total">/ ${tests.length}</span>
          </div>
          <div class="test-summary__label">Tests Passed</div>
          ${!allTestsPassed ? `
            <div class="test-summary__warning">
              ⚠️ Complete all tests before shipping
            </div>
          ` : `
            <div class="test-summary__success">
              ✅ All tests passed
            </div>
          `}
        </div>
        
        <div class="test-actions">
          <button type="button" class="btn btn-secondary btn-sm" onclick="resetTestStatus()">Reset Test Status</button>
        </div>
        
        <div class="test-checklist">
          ${tests.map(test => `
            <div class="test-item ${testChecklist[test.id] ? 'test-item--checked' : ''}">
              <label class="test-item__label">
                <input 
                  type="checkbox" 
                  class="test-item__checkbox" 
                  ${testChecklist[test.id] ? 'checked' : ''}
                  onchange="toggleTestItem('${test.id}')"
                >
                <span class="test-item__text">${test.label}</span>
              </label>
              <button 
                type="button" 
                class="test-item__tooltip-btn" 
                onclick="showTestTooltip(this, '${test.tooltip.replace(/'/g, "&apos;")}')"
                title="How to test"
              >
                ?
              </button>
            </div>
          `).join('')}
        </div>
      </div>
      
      <!-- ARTIFACT COLLECTION -->
      <div class="card">
        <h3 class="card__title">Artifact Collection</h3>
        <div class="card__content">
          <form class="proof-form" onsubmit="return false;">
            <div class="form-group">
              <label class="form-label">Lovable Project Link</label>
              <input 
                type="url" 
                id="lovableLink" 
                class="input ${hasLovableLink ? 'input--valid' : ''}" 
                placeholder="https://lovable.dev/projects/..."
                value="${proofData.lovableLink || ''}"
                onblur="saveProofData()"
              >
              <small class="form-hint">Enter your Lovable project URL</small>
            </div>
            
            <div class="form-group">
              <label class="form-label">GitHub Repository Link</label>
              <input 
                type="url" 
                id="githubLink" 
                class="input ${hasGithubLink ? 'input--valid' : ''}" 
                placeholder="https://github.com/username/repo"
                value="${proofData.githubLink || ''}"
                onblur="saveProofData()"
              >
              <small class="form-hint">Enter your GitHub repository URL</small>
            </div>
            
            <div class="form-group">
              <label class="form-label">Deployed URL</label>
              <input 
                type="url" 
                id="deployedUrl" 
                class="input ${hasDeployedUrl ? 'input--valid' : ''}" 
                placeholder="https://your-project.vercel.app"
                value="${proofData.deployedUrl || ''}"
                onblur="saveProofData()"
              >
              <small class="form-hint">Enter your live deployment URL (Vercel, Netlify, GitHub Pages, etc.)</small>
            </div>
            
            ${!allLinksProvided ? `
              <div class="proof-warning">
                ⚠️ All 3 links are required for submission
              </div>
            ` : ''}
          </form>
        </div>
      </div>
      
      <!-- FINAL SUBMISSION -->
      <div class="card">
        <h3 class="card__title">Final Submission</h3>
        <div class="card__content">
          ${!isShipped ? `
            <div class="submission-requirements">
              <p><strong>Requirements to ship:</strong></p>
              <ul>
                <li>${allTestsPassed ? '✅' : '❌'} All 10 test checklist items passed</li>
                <li>${hasLovableLink ? '✅' : '❌'} Lovable Project Link provided</li>
                <li>${hasGithubLink ? '✅' : '❌'} GitHub Repository Link provided</li>
                <li>${hasDeployedUrl ? '✅' : '❌'} Deployed URL provided</li>
              </ul>
            </div>
          ` : ''}
          
          <div class="submission-actions">
            <button 
              type="button" 
              class="btn btn-primary" 
              onclick="copyFinalSubmission()"
              ${!isShipped ? 'disabled' : ''}
            >
              Copy Final Submission
            </button>
          </div>
        </div>
      </div>
      
    </div>
  `;
}

function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

function saveProofData() {
  const lovableLink = document.getElementById('lovableLink').value.trim();
  const githubLink = document.getElementById('githubLink').value.trim();
  const deployedUrl = document.getElementById('deployedUrl').value.trim();
  
  const proofData = {
    lovableLink,
    githubLink,
    deployedUrl
  };
  
  localStorage.setItem('proofData', JSON.stringify(proofData));
  
  // Re-render to update validation states
  renderProof();
}

function copyFinalSubmission() {
  const proofData = JSON.parse(localStorage.getItem('proofData') || '{}');
  
  const submissionText = `Job Notification Tracker — Final Submission

Lovable Project:
${proofData.lovableLink || '[Not provided]'}

GitHub Repository:
${proofData.githubLink || '[Not provided]'}

Live Deployment:
${proofData.deployedUrl || '[Not provided]'}

Core Features:
- Intelligent match scoring
- Daily digest simulation
- Status tracking
- Test checklist enforced

---
All requirements met. Project ready for review.`;

  navigator.clipboard.writeText(submissionText).then(() => {
    alert('Final submission copied to clipboard!');
  }).catch(() => {
    // Fallback
    const textArea = document.createElement('textarea');
    textArea.value = submissionText;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    alert('Final submission copied to clipboard!');
  });
}

function toggleTestItem(testId) {
  const testChecklist = JSON.parse(localStorage.getItem('testChecklist') || '{}');
  testChecklist[testId] = !testChecklist[testId];
  localStorage.setItem('testChecklist', JSON.stringify(testChecklist));
  renderProof();
}

function resetTestStatus() {
  if (confirm('Are you sure you want to reset all test status?')) {
    localStorage.removeItem('testChecklist');
    renderProof();
  }
}

function showTestTooltip(button, message) {
  // Remove existing tooltips
  document.querySelectorAll('.test-tooltip').forEach(t => t.remove());
  
  const tooltip = document.createElement('div');
  tooltip.className = 'test-tooltip';
  tooltip.textContent = message;
  
  const rect = button.getBoundingClientRect();
  tooltip.style.position = 'fixed';
  tooltip.style.top = (rect.bottom + 8) + 'px';
  tooltip.style.left = (rect.left - 150) + 'px';
  
  document.body.appendChild(tooltip);
  
  // Remove on click outside
  setTimeout(() => {
    document.addEventListener('click', function removeTooltip(e) {
      if (!tooltip.contains(e.target) && e.target !== button) {
        tooltip.remove();
        document.removeEventListener('click', removeTooltip);
      }
    });
  }, 100);
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
  
  // Close menu when clicking outside (but not on form elements)
  document.addEventListener('click', (e) => {
    // Ignore clicks on form elements
    if (e.target.matches('input, select, button, option, label, textarea')) {
      return;
    }
    
    if (!e.target.closest('.top-nav') && navLinksContainer.classList.contains('active')) {
      navLinksContainer.classList.remove('active');
      hamburger.classList.remove('active');
    }
  });
}

// Start the router
initRouter();
