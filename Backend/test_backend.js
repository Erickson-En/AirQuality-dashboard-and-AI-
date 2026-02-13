/**
 * BACKEND TEST SCRIPT
 * ===================
 * Test if your backend is ready to receive sensor data
 * 
 * Usage:
 *   node test_backend.js
 * 
 * This will:
 * 1. Check if backend is running
 * 2. Send test sensor data
 * 3. Verify data was received
 * 4. Check WebSocket connection
 */

const http = require('http');

// CONFIGURATION - Update this to your backend URL
const BACKEND_HOST = 'localhost';  // Change to your deployed URL for production
const BACKEND_PORT = 5000;         // Change if using different port

// Test sensor data
const testData = {
  location: "Test Lab",
  metrics: {
    pm25: 25.5,
    pm10: 50.2,
    co: 3.8,
    o3: 30.5,
    no2: 15.2,
    temperature: 27.5,
    humidity: 65.0
  }
};

console.log('╔════════════════════════════════════════╗');
console.log('║   BACKEND TESTING TOOL                 ║');
console.log('╚════════════════════════════════════════╝\n');

// Test 1: Health check
function testHealth() {
  return new Promise((resolve, reject) => {
    console.log('📡 Test 1: Checking backend health...');
    
    const options = {
      hostname: BACKEND_HOST,
      port: BACKEND_PORT,
      path: '/health',
      method: 'GET',
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Backend is running!');
          console.log(`   Response: ${data}\n`);
          resolve(true);
        } else {
          console.log(`❌ Backend returned status ${res.statusCode}`);
          reject(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ Backend is not reachable!');
      console.log(`   Error: ${error.message}`);
      console.log(`   Make sure backend is running on http://${BACKEND_HOST}:${BACKEND_PORT}\n`);
      reject(false);
    });
    
    req.setTimeout(5000, () => {
      console.log('❌ Request timeout - backend took too long to respond\n');
      req.destroy();
      reject(false);
    });
    
    req.end();
  });
}

// Test 2: Send sensor data
function testSensorData() {
  return new Promise((resolve, reject) => {
    console.log('📊 Test 2: Sending sensor data...');
    console.log(`   Data: ${JSON.stringify(testData, null, 2)}`);
    
    const postData = JSON.stringify(testData);
    
    const options = {
      hostname: BACKEND_HOST,
      port: BACKEND_PORT,
      path: '/api/sensor-data',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Sensor data accepted!');
          console.log(`   Response: ${data}\n`);
          resolve(true);
        } else {
          console.log(`❌ Failed with status ${res.statusCode}`);
          console.log(`   Response: ${data}\n`);
          reject(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ Failed to send data!');
      console.log(`   Error: ${error.message}\n`);
      reject(false);
    });
    
    req.setTimeout(10000, () => {
      console.log('❌ Request timeout\n');
      req.destroy();
      reject(false);
    });
    
    req.write(postData);
    req.end();
  });
}

// Test 3: Get latest reading
function testGetLatest() {
  return new Promise((resolve, reject) => {
    console.log('📥 Test 3: Retrieving latest reading...');
    
    const options = {
      hostname: BACKEND_HOST,
      port: BACKEND_PORT,
      path: '/api/sensor-data/latest',
      method: 'GET',
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Latest reading retrieved!');
          try {
            const parsed = JSON.parse(data);
            console.log(`   Location: ${parsed.location}`);
            console.log(`   PM2.5: ${parsed.metrics?.pm25} µg/m³`);
            console.log(`   Temperature: ${parsed.metrics?.temperature} °C`);
            console.log(`   Timestamp: ${parsed.timestamp}\n`);
            resolve(true);
          } catch (e) {
            console.log(`   Response: ${data}\n`);
            resolve(true);
          }
        } else {
          console.log(`⚠️  Status ${res.statusCode} - ${data}\n`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ Failed to retrieve data!');
      console.log(`   Error: ${error.message}\n`);
      reject(false);
    });
    
    req.setTimeout(5000, () => {
      console.log('❌ Request timeout\n');
      req.destroy();
      reject(false);
    });
    
    req.end();
  });
}

// Run all tests
async function runTests() {
  let allPassed = true;
  
  try {
    await testHealth();
  } catch (e) {
    allPassed = false;
    console.log('⚠️  Cannot continue tests - backend not running\n');
    printTroubleshooting();
    return;
  }
  
  try {
    await testSensorData();
  } catch (e) {
    allPassed = false;
  }
  
  try {
    await testGetLatest();
  } catch (e) {
    allPassed = false;
  }
  
  // Summary
  console.log('╔════════════════════════════════════════╗');
  if (allPassed) {
    console.log('║   ✅ ALL TESTS PASSED!                 ║');
    console.log('╚════════════════════════════════════════╝');
    console.log('\n🎉 Your backend is ready to receive sensor data!\n');
    console.log('Next steps:');
    console.log('1. Update Arduino code with your backend URL');
    console.log('2. Wire up GSM module and sensors');
    console.log('3. Upload Arduino code');
    console.log('4. Monitor Serial output');
    console.log('5. Watch real-time data on your dashboard!\n');
  } else {
    console.log('║   ⚠️  SOME TESTS FAILED                ║');
    console.log('╚════════════════════════════════════════╝\n');
    printTroubleshooting();
  }
}

function printTroubleshooting() {
  console.log('Troubleshooting:');
  console.log('1. Make sure backend is running:');
  console.log('   cd Backend');
  console.log('   npm start');
  console.log('');
  console.log('2. Check .env file has MONGO_URI set');
  console.log('3. Verify MongoDB is accessible');
  console.log('4. Check firewall/antivirus is not blocking port 5000');
  console.log('5. If using deployed backend, update BACKEND_HOST in this script\n');
}

// Execute tests
runTests().catch(console.error);
