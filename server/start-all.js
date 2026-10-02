import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('\x1b[36m====================================================\x1b[0m');
console.log('\x1b[1m\x1b[32m     NOVAPOS - RETAIL POINT OF SALE TERMINAL        \x1b[0m');
console.log('\x1b[36m====================================================\x1b[0m');
console.log('⚡ Starting SQLite Backend & Vue 2 POS Terminal...\n');

const isWin = process.platform === 'win32';
const nodeDir = path.dirname(process.execPath);

// Ensure nodeDir is in PATH
const currentPath = process.env.PATH || '';
const newPath = currentPath.includes(nodeDir) ? currentPath : `${nodeDir};${currentPath}`;
const env = { ...process.env, PATH: newPath };

// 1. Start SQLite Backend Server (Port 3001)
const backendProcess = spawn(process.execPath, ['server/index.js'], {
  cwd: rootDir,
  stdio: 'inherit',
  env
});

// 2. Start Vite Dev Server (Port 3000)
let npmCmd = 'npm';
if (isWin) {
  const directNpm = path.join(nodeDir, 'npm.cmd');
  npmCmd = fs.existsSync(directNpm) ? `"${directNpm}"` : 'npm.cmd';
}

const frontendProcess = spawn(npmCmd, ['run', 'dev'], {
  cwd: rootDir,
  stdio: 'inherit',
  env,
  shell: true
});

// 3. Open browser after servers spin up
setTimeout(() => {
  const url = 'http://localhost:3000';
  console.log(`\n🚀 Opening POS Terminal in browser at ${url}...\n`);
  const openCmd = isWin ? 'start' : (process.platform === 'darwin' ? 'open' : 'xdg-open');
  spawn(openCmd, [url], { shell: true, stdio: 'ignore' });
}, 2500);

function shutdown() {
  console.log('\n🛑 Stopping NovaPOS services...');
  try { backendProcess.kill(); } catch (e) {}
  try { frontendProcess.kill(); } catch (e) {}
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
