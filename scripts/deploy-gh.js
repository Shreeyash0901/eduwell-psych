import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');

console.log('Starting deployment to GitHub Pages...');

// Ensure dist exists
if (!fs.existsSync(distDir)) {
  console.log('Building dist...');
  execSync('npm run build', { stdio: 'inherit' });
}

// Ensure 404.html exists in dist
const dist404 = path.join(distDir, '404.html');
const distIndex = path.join(distDir, 'index.html');
if (fs.existsSync(distIndex) && !fs.existsSync(dist404)) {
  fs.copyFileSync(distIndex, dist404);
}

const gitDir = path.join(distDir, '.git');
if (fs.existsSync(gitDir)) {
  fs.rmSync(gitDir, { recursive: true, force: true });
}

try {
  execSync('git init', { cwd: distDir, stdio: 'inherit' });
  execSync('git checkout -b gh-pages', { cwd: distDir, stdio: 'inherit' });
  execSync('git add -A', { cwd: distDir, stdio: 'inherit' });
  execSync('git commit -m "Deploy to GitHub Pages"', { cwd: distDir, stdio: 'inherit' });
  execSync('git remote add origin https://github.com/Shreeyash0901/eduwell-psych.git', { cwd: distDir, stdio: 'inherit' });
  execSync('git push -f origin gh-pages', { cwd: distDir, stdio: 'inherit' });
  console.log('Successfully deployed to GitHub Pages (gh-pages branch)!');
} catch (error) {
  console.error('Deployment error:', error);
  process.exit(1);
} finally {
  if (fs.existsSync(gitDir)) {
    fs.rmSync(gitDir, { recursive: true, force: true });
  }
}
