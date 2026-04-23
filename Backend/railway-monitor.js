/**
 * RAILWAY HEALTH MONITOR
 * ======================
 * 
 * Purpose:
 * - Continuously monitors Railway proxy health
 * - Alerts if Railway is down
 * - Recommends activating fallback server
 * 
 * Usage:
 *   node railway-monitor.js
 * 
 * Configure via environment:
 *   RAILWAY_PROXY_URL=https://your-railway-url
 *   CHECK_INTERVAL=300000  (milliseconds, default: 5 min)
 */

const http = require('http');
const https = require('https');

const RAILWAY_URL = process.env.RAILWAY_PROXY_URL || 'https://air-quality-railway.up.railway.app';
const CHECK_INTERVAL = Number(process.env.CHECK_INTERVAL || 300000); // 5 minutes default
const FALLBACK_PORT = process.env.FALLBACK_PORT || 8080;

let checkCount = 0;
let lastStatus = null;
let consecutiveFailures = 0;

console.log('\n╔════════════════════════════════════════════════════╗');
console.log('║   🔍 RAILWAY HEALTH MONITOR                        ║');
console.log('╚════════════════════════════════════════════════════╝\n');

function checkRailwayHealth() {
  checkCount++;
  const protocol = RAILWAY_URL.startsWith('https') ? https : http;
  const timestamp = new Date().toLocaleTimeString();

  protocol
    .get(RAILWAY_URL + '/health', { timeout: 10000 }, (res) => {
      const isHealthy = res.statusCode >= 200 && res.statusCode < 300;

      if (isHealthy) {
        consecutiveFailures = 0;
        if (lastStatus !== 'healthy') {
          console.log(`✅ [${timestamp}] Railway proxy is HEALTHY (HTTP ${res.statusCode})`);
          console.log(`   Status: Connected to Render backend via Railway\n`);
          lastStatus = 'healthy';
        } else {
          process.stdout.write('.');
        }
      } else {
        consecutiveFailures++;
        console.log(`⚠️  [${timestamp}] Railway returned HTTP ${res.statusCode}`);
        console.log(`   Consecutive failures: ${consecutiveFailures}\n`);
        lastStatus = 'degraded';
      }

      // Consume response data
      res.on('data', () => {});
    })
    .on('error', (err) => {
      consecutiveFailures++;

      if (consecutiveFailures === 1) {
        console.log(`\n🚨 [${timestamp}] RAILWAY OFFLINE DETECTED`);
        console.log(`   Error: ${err.message}`);
        console.log(`   → Consecutive failures: ${consecutiveFailures}`);
      } else {
        console.log(`🚨 [${timestamp}] Still offline (${consecutiveFailures} failures)\n`);
      }

      if (consecutiveFailures >= 2) {
        console.log(`\n⚠️  ACTION REQUIRED:`);
        console.log(`   1. Railway proxy is not responding`);
        console.log(`   2. Arduino GSM data cannot reach Render backend`);
        console.log(`   3. START FALLBACK SERVER in another terminal:`);
        console.log(`      cd Backend && node http-fallback-server.js`);
        console.log(`   4. Configure Arduino to send to fallback: http://<IP>:${FALLBACK_PORT}/api/sensor-data\n`);
      }

      lastStatus = 'down';
    });
}

// Run initial check immediately
console.log(`🔗 Monitoring: ${RAILWAY_URL}`);
console.log(`⏱️  Check interval: ${CHECK_INTERVAL / 1000 / 60} minutes`);
console.log(`🔄 Starting checks...\n`);

checkRailwayHealth();

// Schedule periodic checks
const interval = setInterval(checkRailwayHealth, CHECK_INTERVAL);

// Print summary periodically
setInterval(() => {
  console.log(
    `\n📊 Health Check Summary: ${checkCount} checks | Status: ${lastStatus} | Consecutive failures: ${consecutiveFailures}\n`
  );
}, CHECK_INTERVAL * 3);

// Graceful shutdown
process.on('SIGINT', () => {
  clearInterval(interval);
  console.log('\n\n👋 Monitor stopped');
  console.log(`   Total checks: ${checkCount}`);
  console.log(`   Last status: ${lastStatus}`);
  process.exit(0);
});

process.on('SIGHUP', () => {
  console.log('\n🔄 Resetting failure counter on SIGHUP');
  consecutiveFailures = 0;
});
