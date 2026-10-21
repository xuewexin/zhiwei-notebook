import { spawn, execSync } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function waitPort(port, timeout = 15000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const req = http.get(`http://localhost:${port}/`, () => {
        resolve();
      });
      req.on('error', () => {
        if (Date.now() - start > timeout) {
          reject(new Error(`Timeout waiting for port ${port}`));
        } else {
          setTimeout(check, 500);
        }
      });
    };
    check();
  });
}

async function main() {
  console.log('1. Starting API server (port 3001)...');
  const server = spawn('node', ['server/index.js'], { stdio: 'pipe' });
  server.stdout.on('data', d => process.stdout.write('[server] ' + d));

  console.log('2. Starting Vite (port 5173)...');
  const vite = spawn('node', ['./node_modules/vite/bin/vite.js', '--port', '5173'], { stdio: 'pipe' });
  vite.stdout.on('data', d => process.stdout.write('[vite] ' + d));

  try {
    await waitPort(3001);
    await waitPort(5173);
    console.log('Servers are ready!');

    await new Promise(r => setTimeout(r, 2000));
    fs.mkdirSync('docs/images', { recursive: true });

    // Output paths
    const outDesktop = path.resolve('docs/images/desktop-showcase.png');
    const outDetail = path.resolve('docs/images/desktop-detail-view.png');
    const outReview = path.resolve('docs/images/review-showcase.png');
    const outMobile1 = path.resolve('docs/images/mobile-showcase.png');
    const outMobile2 = path.resolve('docs/images/mobile-profile.png');
    const outMobileReview = path.resolve('docs/images/mobile-review.png');

    // 1. Desktop Main View
    console.log('Capturing Desktop Main View...');
    execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=1440,900 --virtual-time-budget=6000 --screenshot="${outDesktop}" http://localhost:5173/`, { timeout: 30000 });

    // 2. Desktop Question Detail View
    console.log('Capturing Question Detail View...');
    execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=1440,900 --virtual-time-budget=6000 --screenshot="${outDetail}" http://localhost:5173/?question=seed-q1`, { timeout: 30000 });

    // 3. Desktop Review & Calendar View
    console.log('Capturing Review & Calendar View...');
    execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=1440,900 --virtual-time-budget=6000 --screenshot="${outReview}" http://localhost:5173/?tab=review`, { timeout: 30000 });

    // 4. Mobile Folders View
    console.log('Capturing Mobile Folders View...');
    execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=430,920 --virtual-time-budget=6000 --screenshot="${outMobile1}" http://localhost:5173/?tab=folders`, { timeout: 30000 });

    // 5. Mobile Review & Streak View
    console.log('Capturing Mobile Review View...');
    execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=430,920 --virtual-time-budget=6000 --screenshot="${outMobileReview}" http://localhost:5173/?tab=review`, { timeout: 30000 });

    // 6. Mobile Profile View
    console.log('Capturing Mobile Profile View...');
    execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=430,920 --virtual-time-budget=6000 --screenshot="${outMobile2}" http://localhost:5173/?tab=profile`, { timeout: 30000 });

    console.log('All screenshots captured successfully!');
  } catch (err) {
    console.error('Capture error:', err);
  } finally {
    console.log('Cleaning up servers...');
    try { server.kill(); } catch {}
    try { vite.kill(); } catch {}
  }
}

main();
