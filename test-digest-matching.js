// Test Digest Matching Logic
console.log('🔍 Testing Digest Matching Logic...\n');

// Test Case 1: Business Analyst preferences (should match very few jobs)
const businessAnalystPrefs = {
  roleKeywords: ['Business Analyst', 'Analyst', 'BA'],
  preferredLocations: ['Mumbai', 'Delhi'],
  preferredMode: ['Remote'],
  experienceLevel: '1-3',
  skills: ['Excel', 'SQL', 'Analytics'],
  minMatchScore: 40
};

console.log('TEST 1: Business Analyst Preferences');
console.log('Keywords:', businessAnalystPrefs.roleKeywords);
console.log('Locations:', businessAnalystPrefs.preferredLocations);
console.log('Mode:', businessAnalystPrefs.preferredMode);
console.log('Experience:', businessAnalystPrefs.experienceLevel);
console.log('Skills:', businessAnalystPrefs.skills);
console.log('Min Score:', businessAnalystPrefs.minMatchScore);

// Mock calculate function for testing
function mockCalculateMatchScore(job, prefs) {
  let score = 0;
  
  // +25 if any roleKeyword appears in job.title
  if (prefs.roleKeywords && prefs.roleKeywords.length > 0) {
    const titleLower = job.title.toLowerCase();
    const hasKeywordInTitle = prefs.roleKeywords.some(keyword => 
      titleLower.includes(keyword.toLowerCase().trim())
    );
    if (hasKeywordInTitle) score += 25;
  }
  
  // +15 if any roleKeyword appears in job.description
  if (prefs.roleKeywords && prefs.roleKeywords.length > 0) {
    const descLower = job.description.toLowerCase();
    const hasKeywordInDesc = prefs.roleKeywords.some(keyword => 
      descLower.includes(keyword.toLowerCase().trim())
    );
    if (hasKeywordInDesc) score += 15;
  }
  
  // +15 if job.location matches preferredLocations
  if (prefs.preferredLocations && prefs.preferredLocations.length > 0) {
    if (prefs.preferredLocations.includes(job.location)) {
      score += 15;
    }
  }
  
  // +10 if job.mode matches preferredMode
  if (prefs.preferredMode && prefs.preferredMode.length > 0) {
    if (prefs.preferredMode.includes(job.mode)) {
      score += 10;
    }
  }
  
  // +10 if job.experience matches experienceLevel
  if (prefs.experienceLevel && prefs.experienceLevel === job.experience) {
    score += 10;
  }
  
  // +15 if overlap between job.skills and user.skills
  if (prefs.skills && prefs.skills.length > 0) {
    const userSkillsLower = prefs.skills.map(s => s.toLowerCase().trim());
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
  
  return Math.min(score, 100);
}

// Test with sample jobs
const sampleJobs = [
  {
    title: "SDE Intern",
    company: "Amazon",
    location: "Bangalore",
    mode: "Hybrid",
    experience: "Fresher",
    skills: ["Java", "Data Structures"],
    source: "LinkedIn",
    postedDaysAgo: 1,
    description: "Join Amazon's engineering team"
  },
  {
    title: "Business Analyst",
    company: "Deloitte",
    location: "Mumbai",
    mode: "Remote",
    experience: "1-3",
    skills: ["Excel", "SQL", "Analytics"],
    source: "LinkedIn",
    postedDaysAgo: 0,
    description: "Analyze business requirements and data"
  },
  {
    title: "Data Analyst Intern",
    company: "Swiggy",
    location: "Bangalore",
    mode: "Remote",
    experience: "Fresher",
    skills: ["SQL", "Python", "Excel"],
    source: "LinkedIn",
    postedDaysAgo: 4,
    description: "Analyze food delivery data"
  }
];

console.log('\nJob Matching Results:');
sampleJobs.forEach((job, index) => {
  const score = mockCalculateMatchScore(job, businessAnalystPrefs);
  const meetsThreshold = score >= businessAnalystPrefs.minMatchScore;
  
  console.log(`\n${index + 1}. ${job.title} at ${job.company}`);
  console.log(`   Location: ${job.location} | Mode: ${job.mode} | Experience: ${job.experience}`);
  console.log(`   Match Score: ${score}% | Meets Threshold (${businessAnalystPrefs.minMatchScore}%): ${meetsThreshold ? '✅ YES' : '❌ NO'}`);
  
  // Show scoring breakdown
  let breakdown = [];
  if (businessAnalystPrefs.roleKeywords.some(k => job.title.toLowerCase().includes(k.toLowerCase()))) {
    breakdown.push('Title match (+25)');
  }
  if (businessAnalystPrefs.roleKeywords.some(k => job.description.toLowerCase().includes(k.toLowerCase()))) {
    breakdown.push('Description match (+15)');
  }
  if (businessAnalystPrefs.preferredLocations.includes(job.location)) {
    breakdown.push('Location match (+15)');
  }
  if (businessAnalystPrefs.preferredMode.includes(job.mode)) {
    breakdown.push('Mode match (+10)');
  }
  if (businessAnalystPrefs.experienceLevel === job.experience) {
    breakdown.push('Experience match (+10)');
  }
  if (businessAnalystPrefs.skills.some(s => job.skills.some(js => js.toLowerCase().includes(s.toLowerCase())))) {
    breakdown.push('Skill match (+15)');
  }
  if (job.postedDaysAgo <= 2) {
    breakdown.push('Recent post (+5)');
  }
  if (job.source === 'LinkedIn') {
    breakdown.push('LinkedIn (+5)');
  }
  
  console.log(`   Breakdown: ${breakdown.join(', ') || 'No matches'}`);
});

console.log('\n' + '='.repeat(60));
console.log('EXPECTED DIGEST BEHAVIOR:');
console.log('='.repeat(60));

const qualifiedJobs = sampleJobs.filter(job => 
  mockCalculateMatchScore(job, businessAnalystPrefs) >= businessAnalystPrefs.minMatchScore
);

if (qualifiedJobs.length === 0) {
  console.log('✅ CORRECT: Should show "No matching roles today" message');
  console.log('✅ CORRECT: Should provide suggestions to broaden criteria');
  console.log('✅ CORRECT: Should NOT show any job listings');
} else {
  console.log(`❌ INCORRECT: Should show ${qualifiedJobs.length} qualified jobs`);
  qualifiedJobs.forEach(job => {
    console.log(`   - ${job.title} at ${job.company}`);
  });
}

console.log('\n' + '='.repeat(60));
console.log('TEST SUMMARY:');
console.log('='.repeat(60));
console.log('• Business Analyst preferences should match very few jobs');
console.log('• Only jobs with matching keywords, location, mode, etc. should appear');
console.log('• If no jobs meet the threshold, show helpful empty state');
console.log('• Never show irrelevant jobs (like Software Intern for Business Analyst)');