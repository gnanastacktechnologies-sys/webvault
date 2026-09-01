import fs from 'fs';
import path from 'path';

const copyDir = (src, dest) => {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
};

try {
  const frontendDist = path.resolve('frontend/dist');
  if (fs.existsSync(frontendDist)) {
    copyDir(frontendDist, path.resolve('dist'));
    copyDir(frontendDist, path.resolve('public'));
    console.log('✅ Successfully synced built assets to ./dist and ./public for Vercel');
  }
} catch (e) {
  console.error('Postbuild copy warning:', e.message);
}
