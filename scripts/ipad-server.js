import os from 'os';
import { spawn } from 'child_process';

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIp = getLocalIp();
const port = 5173;
const url = `http://${localIp}:${port}`;

console.log('\n================================================================');
console.log('       知微错题 - iPad (iPadOS) 极速连接服务已启动            ');
console.log('================================================================\n');
console.log('  📱 【请确保 iPad 与本电脑连接在同一个 Wi-Fi 局域网下】\n');
console.log('  👉  iPad 访问网址:  ' + url);
console.log('\n----------------------------------------------------------------');
console.log('  🌟 【如何将知微错题添加到 iPad 桌面（秒变独立原生 App）】：');
console.log('  1. 在 iPad 上打开 Safari 浏览器，访问上方网址：' + url);
console.log('  2. 点击 Safari 右上角的「分享」按钮（带向上箭头的方框）');
console.log('  3. 在弹出菜单中向下滑动，选择「添加到主屏幕」');
console.log('  4. 点击右上角「添加」，iPad 桌面即可生成「知微错题」专属高清图标！');
console.log('  5. 从桌面点击图标打开，即刻享受 100% 全屏手写、分屏做题与多页草稿！');
console.log('----------------------------------------------------------------\n');
console.log('  按 Ctrl+C 可停止连接服务。\n');

// Start Vite preview or dev on 0.0.0.0
const child = spawn('npx', ['vite', '--host', '0.0.0.0', '--port', String(port)], {
  stdio: 'inherit',
  shell: true
});

child.on('close', (code) => {
  process.exit(code);
});
