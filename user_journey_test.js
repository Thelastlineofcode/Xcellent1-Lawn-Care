#!/usr/bin/env node
/**
 * User Journey Test for Xcellent1 Lawn Care
 * Tests key user flows across the site
 */

const http = require('http');
const https = require('https');

const BASE_URL = 'https://xcellent1-lawn-care-rpneaa.fly.dev';

// Test scenarios
const tests = [
  {
    name: 'Homepage loads',
    path: '/',
    expectedStatus: 200,
    checks: ['XCELLENT1', 'Services', 'Featured', 'lawn care']
  },
  {
    name: 'Shop page loads',
    path: '/shop.html',
    expectedStatus: 200,
    checks: ['Shop', 'Amazon', 'Mowers', 'Trimmers']
  },
  {
    name: 'Careers page loads',
    path: '/careers.html',
    expectedStatus: 200,
    checks: ['Join Our Crew', 'Lawn Care Technician', 'Apply Now']
  },
  {
    name: 'Login page loads',
    path: '/login.html',
    expectedStatus: 200,
    checks: ['Sign in', 'Email Address', 'Password']
  },
  {
    name: 'Owner dashboard accessible',
    path: '/owner.html',
    expectedStatus: 200,
    checks: ['Owner Dashboard', 'Revenue', 'Metrics']
  },
  {
    name: 'Client dashboard accessible',
    path: '/client.html',
    expectedStatus: 200,
    checks: ['Client Portal', 'Services', 'Invoice']
  },
  {
    name: 'Crew dashboard accessible',
    path: '/crew.html',
    expectedStatus: 200,
    checks: ['Crew Portal', 'Jobs', 'Schedule']
  }
];

// Utility function to make HTTP requests (with redirect following)
function testPage(url, expectedStatus, checks, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    const makeRequest = (currentUrl, redirectCount = 0) => {
      if (redirectCount > maxRedirects) {
        reject(new Error('Too many redirects'));
        return;
      }
      
      const protocol = currentUrl.startsWith('https') ? https : http;
      
      protocol.get(currentUrl, (res) => {
        let data = '';
        
        // Handle redirects (3xx)
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const redirectUrl = res.headers.location.startsWith('http') 
            ? res.headers.location 
            : new URL(res.headers.location, currentUrl).href;
          makeRequest(redirectUrl, redirectCount + 1);
          return;
        }
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          const result = {
            status: res.statusCode,
            statusOk: res.statusCode === expectedStatus || res.statusCode === 200,
            checks: []
          };
          
          // Check for expected content
          checks.forEach(check => {
            const found = data.includes(check);
            result.checks.push({
              text: check,
              found: found
            });
          });
          
          resolve(result);
        });
      }).on('error', reject);
    };
    
    makeRequest(url);
  });
}

// Run all tests
async function runTests() {
  console.log('\n🧪 XCELLENT1 LAWN CARE - USER JOURNEY TEST\n');
  console.log(`Testing: ${BASE_URL}\n`);
  console.log('═'.repeat(60));
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const url = BASE_URL + test.path;
    console.log(`\n📄 ${test.name}`);
    console.log(`   URL: ${test.path}`);
    
    try {
      const result = await testPage(url, test.expectedStatus, test.checks);
      
      console.log(`   Status: ${result.status} ${result.statusOk ? '✅' : '❌'}`);
      
      let allChecksPass = true;
      test.checks.forEach((check, i) => {
        const checkResult = result.checks[i];
        const icon = checkResult.found ? '✅' : '❌';
        console.log(`   Content: "${check}" ${icon}`);
        if (!checkResult.found) allChecksPass = false;
      });
      
      const hasContentChecks = result.checks.filter(c => c.found).length > 0;
      if (result.statusOk && (allChecksPass || hasContentChecks)) {
        passed++;
        console.log(`   Result: ✅ PASS`);
      } else {
        failed++;
        console.log(`   Result: ❌ FAIL`);
      }
    } catch (error) {
      failed++;
      console.log(`   Status: ERROR`);
      console.log(`   Error: ${error.message}`);
      console.log(`   Result: ❌ FAIL`);
    }
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log(`\n📊 Test Summary`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   Total: ${tests.length}`);
  console.log(`   Success Rate: ${Math.round((passed / tests.length) * 100)}%\n`);
  
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
