# Job Notification Tracker - Testing Verification

## Test Checklist

### ✅ Test 1: Preference Persistence
**Steps:**
1. Open `app.html` in browser
2. Navigate to Settings (#settings)
3. Fill in preferences:
   - Role Keywords: `Developer, Engineer, Intern`
   - Preferred Locations: Select `Bangalore, Hyderabad` (Ctrl+Click)
   - Work Mode: Check `Remote` and `Hybrid`
   - Experience Level: Select `Fresher`
   - Skills: `React, JavaScript, Python, Java`
   - Min Match Score: Set to `50`
4. Click "Save Preferences"
5. Refresh the page (F5)
6. Navigate back to Settings

**Expected Result:** All fields should be prefilled with saved values

---

### ✅ Test 2: Match Score Badges
**Steps:**
1. After setting preferences (Test 1), go to Dashboard
2. Look at job cards

**Expected Result:** 
- Each job card shows a match score badge (e.g., "72%")
- Badges are positioned in top-right corner
- Scores range from 0-100%

---

### ✅ Test 3: Color-Coded Match Scores
**Steps:**
1. On Dashboard, observe match score badge colors

**Expected Result:**
- 80-100%: Green background (Excellent Match)
- 60-79%: Amber/Orange background (Good Match)
- 40-59%: Neutral/Grey background (Fair Match)
- <40%: Light grey background (Low Match)

**Example Jobs to Check:**
- Amazon SDE Intern (Bangalore, Hybrid, Fresher) → Should score 80-85% (Green)
- Google SDE (Bangalore, Onsite, 0-1) → Should score 60-70% (Amber)
- Jobs without keyword matches → Should score <40% (Grey)

---

### ✅ Test 4: Show Only Matches Toggle
**Steps:**
1. On Dashboard with preferences set
2. Note the total number of jobs displayed
3. Check the "Show only jobs above my threshold (50%)" checkbox
4. Observe filtered results

**Expected Result:**
- Only jobs with match score ≥ 50% are displayed
- Job count decreases
- Unchecking shows all jobs again

---

### ✅ Test 5: Multiple Filters (AND Logic)
**Steps:**
1. On Dashboard, apply multiple filters:
   - Location: `Bangalore`
   - Mode: `Remote`
   - Experience: `Fresher`
2. Click "Apply Filters"

**Expected Result:**
- Only jobs matching ALL criteria are shown
- Example: Should show "Frontend Developer Intern" at Razorpay (Bangalore, Remote, Fresher)
- Should NOT show Bangalore jobs that are Onsite or Hybrid

---

### ✅ Test 6: Sort Options
**Steps:**
1. On Dashboard, test each sort option:
   - **Latest First**: Jobs sorted by postedDaysAgo (0 days → 10 days)
   - **Match Score**: Jobs sorted by match % (100% → 0%)
   - **Salary (High to Low)**: Jobs sorted by salary range
   - **Company A-Z**: Jobs sorted alphabetically

**Expected Result:**
- Each sort option reorders jobs correctly
- "Match Score" option only appears when preferences are set

---

### ✅ Test 7: Clear Preferences Banner
**Steps:**
1. On Dashboard, go to Settings
2. Click "Clear Preferences" button
3. Confirm the action
4. Return to Dashboard

**Expected Result:**
- Orange banner appears at top: "⚙️ Set your preferences to activate intelligent matching."
- Banner has "Go to Settings" button
- Match score badges disappear from job cards
- "Show only matches" toggle disappears
- "Match Score" sort option disappears

---

## Match Score Calculation Examples

### Example 1: High Match (85%)
**Job:** Amazon SDE Intern
- Location: Bangalore ✓ (+15)
- Mode: Hybrid ✓ (+10)
- Experience: Fresher ✓ (+10)
- Title contains "Intern" ✓ (+25)
- Description contains "Engineer" ✓ (+15)
- Posted 1 day ago ✓ (+5)
- Source: LinkedIn ✓ (+5)
- **Total: 85%** → Green Badge

### Example 2: Good Match (65%)
**Job:** React Developer at PhonePe
- Location: Bangalore ✓ (+15)
- Mode: Hybrid ✓ (+10)
- Experience: 1-3 ✗ (0)
- Title contains "Developer" ✓ (+25)
- Skills: React, JavaScript ✓ (+15)
- Posted today ✓ (+5)
- Source: LinkedIn ✓ (+5)
- **Total: 75%** → Amber Badge

### Example 3: Low Match (25%)
**Job:** iOS Developer at Dunzo
- Location: Bangalore ✓ (+15)
- Mode: Onsite ✗ (0)
- Experience: 1-3 ✗ (0)
- Title contains "Developer" ✓ (+25)
- Skills: Swift (no match) ✗ (0)
- Posted 3 days ago ✗ (0)
- Source: LinkedIn ✓ (+5)
- **Total: 45%** → Neutral Badge

---

## Browser Console Check
Open browser console (F12) and verify:
- No JavaScript errors
- No warnings about undefined variables
- localStorage contains `jobTrackerPreferences` after saving

---

## Performance Check
- Page loads smoothly
- Filtering is instant (no lag)
- Sorting is instant
- No UI flickering when toggling filters
