/**
 * 🔍 LIVE SENSOR DATA MONITOR
 * Connects to backend via WebSocket and displays incoming sensor data in real-time
 */

const io = require('socket.io-client');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

console.clear();
console.log('\n╔════════════════════════════════════════╗');
console.log('║  🔍 LIVE SENSOR DATA MONITOR           ║');
console.log('╚════════════════════════════════════════╝\n');
console.log(`Connecting to: ${BACKEND_URL}\n`);

const socket = io(BACKEND_URL, {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
});

let readingCount = 0;
let startTime = Date.now();

socket.on('connect', () => {
  console.log('✅ Connected to backend\n');
  console.log('Waiting for sensor data...\n');
});

socket.on('sensorData', (data) => {
  readingCount++;
  
  // Clear last few lines for update effect
  console.clear();
  
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  📊 LIVE SENSOR DATA MONITOR           ║');
  console.log('╚════════════════════════════════════════╝\n');
  
  console.log(`📍 Location: ${data.location || 'Unknown'}`);
  console.log(`⏰ Timestamp: ${new Date(data.timestamp).toLocaleString()}`);
  console.log(`📈 Total Readings: ${readingCount} | Uptime: ${uptime}s\n`);
  
  const metrics = data.metrics || {};
  
  // Particulate Matter
  console.log('─ PARTICULATE MATTER ─');
  console.log(`  PM1:   ${(metrics.pm1?.toFixed(2) || 'N/A')} µg/m³`);
  console.log(`  PM2.5: ${(metrics.pm25?.toFixed(2) || 'N/A')} µg/m³ ${getPM25Status(metrics.pm25)}`);
  console.log(`  PM10:  ${(metrics.pm10?.toFixed(2) || 'N/A')} µg/m³`);
  
  // Gases
  console.log('\n─ GASES ─');
  console.log(`  CO:    ${(metrics.co?.toFixed(2) || 'N/A')} ppm`);
  console.log(`  CO2:   ${(metrics.co2?.toFixed(0) || 'N/A')} ppm`);
  console.log(`  O3:    ${(metrics.o3?.toFixed(2) || 'N/A')} ppb`);
  console.log(`  NO2:   ${(metrics.no2?.toFixed(2) || 'N/A')} ppb`);
  
  // Environmental
  console.log('\n─ ENVIRONMENTAL ─');
  console.log(`  Temperature: ${(metrics.temperature?.toFixed(1) || 'N/A')}°C`);
  console.log(`  Humidity:    ${(metrics.humidity?.toFixed(1) || 'N/A')}%`);
  
  // Indices
  console.log('\n─ AIR QUALITY INDICES ─');
  console.log(`  VOC Index: ${metrics.voc_index || 'N/A'}`);
  console.log(`  NOx Index: ${metrics.nox_index || 'N/A'}`);
  
  console.log('\n─────────────────────────────────────────');
  console.log('Press Ctrl+C to stop monitoring\n');
});

socket.on('disconnect', () => {
  console.log('\n⚠️  Disconnected from backend');
});

socket.on('error', (error) => {
  console.error(`\n❌ Connection error: ${error}`);
});

process.on('SIGINT', () => {
  console.log('\n\n👋 Monitor stopped');
  console.log(`Total readings captured: ${readingCount}`);
  console.log(`Duration: ${Math.floor((Date.now() - startTime) / 1000)}s\n`);
  process.exit(0);
});

// Helper to show PM2.5 status
function getPM25Status(value) {
  if (!value) return '';
  if (value <= 12) return '✅ Good';
  if (value <= 35.4) return '⚠️  Moderate';
  if (value <= 55.4) return '⚠️  Unhealthy for Sensitive Groups';
  if (value <= 150.4) return '🔴 Unhealthy';
  return '🔴 Very Unhealthy';
}
