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
    // Copy index.html to 404.html for universal SPA fallback routing
    const indexPath = path.join(frontendDist, 'index.html');
    const fourOhFourPath = path.join(frontendDist, '404.html');
    if (fs.existsSync(indexPath)) {
      fs.copyFileSync(indexPath, fourOhFourPath);
    }

    copyDir(frontendDist, path.resolve('dist'));
    copyDir(frontendDist, path.resolve('public'));
    console.log('✅ Successfully synced built assets & 404.html fallback for Vercel');
  }
} catch (e) {
  console.error('Postbuild copy warning:', e.message);
}
