// Test Sorting Logic
console.log('Testing Salary Sorting...\n');

const testSalaries = [
  { title: 'Job 1', salaryRange: '3–5 LPA' },
  { title: 'Job 2', salaryRange: '₹25k–₹40k/month Internship' },
  { title: 'Job 3', salaryRange: '15–25 LPA' },
  { title: 'Job 4', salaryRange: '10–18 LPA' },
  { title: 'Job 5', salaryRange: '₹40k–₹60k/month Internship' },
  { title: 'Job 6', salaryRange: '6–10 LPA' },
  { title: 'Job 7', salaryRange: '₹15k–₹30k/month Internship' }
];

const extractMaxSalary = (str) => {
  const numbers = str.match(/\d+/g);
  if (!numbers || numbers.length === 0) return 0;
  
  const maxNum = Math.max(...numbers.map(n => parseInt(n)));
  
  if (str.includes('LPA')) {
    return maxNum * 100;
  }
  return maxNum;
};

console.log('Before sorting:');
testSalaries.forEach(job => {
  const value = extractMaxSalary(job.salaryRange);
  console.log(`${job.title}: ${job.salaryRange} → ${value}`);
});

testSalaries.sort((a, b) => extractMaxSalary(b.salaryRange) - extractMaxSalary(a.salaryRange));

console.log('\nAfter sorting (High to Low):');
testSalaries.forEach((job, index) => {
  const value = extractMaxSalary(job.salaryRange);
  console.log(`${index + 1}. ${job.title}: ${job.salaryRange} → ${value}`);
});

console.log('\n✅ Expected order:');
console.log('1. Job 3: 15–25 LPA (2500)');
console.log('2. Job 4: 10–18 LPA (1800)');
console.log('3. Job 6: 6–10 LPA (1000)');
console.log('4. Job 1: 3–5 LPA (500)');
console.log('5. Job 5: ₹40k–₹60k/month (60)');
console.log('6. Job 2: ₹25k–₹40k/month (40)');
console.log('7. Job 7: ₹15k–₹30k/month (30)');

console.log('\n' + '='.repeat(50));
console.log('Testing Company Sorting...\n');

const testCompanies = [
  { company: 'Zomato' },
  { company: 'Amazon' },
  { company: 'IBM' },
  { company: 'Accenture' },
  { company: 'Wipro' },
  { company: 'TCS' },
  { company: 'Infosys' }
];

console.log('Before sorting:');
testCompanies.forEach(job => console.log(job.company));

testCompanies.sort((a, b) => {
  const companyA = a.company.toLowerCase();
  const companyB = b.company.toLowerCase();
  return companyA.localeCompare(companyB);
});

console.log('\nAfter sorting (A-Z):');
testCompanies.forEach((job, index) => {
  console.log(`${index + 1}. ${job.company}`);
});

console.log('\n✅ Expected order:');
console.log('1. Accenture');
console.log('2. Amazon');
console.log('3. IBM');
console.log('4. Infosys');
console.log('5. TCS');
console.log('6. Wipro');
console.log('7. Zomato');
