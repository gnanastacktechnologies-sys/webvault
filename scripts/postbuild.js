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

const routes = ['login', 'dashboard', 'categories', 'websites', 'favorites'];

try {
  const frontendDist = path.resolve('frontend/dist');
  if (fs.existsSync(frontendDist)) {
    const indexPath = path.join(frontendDist, 'index.html');
    
    if (fs.existsSync(indexPath)) {
      // 404.html fallback
      fs.copyFileSync(indexPath, path.join(frontendDist, '404.html'));
      
      // Static route folders
      for (const route of routes) {
        const routeDir = path.join(frontendDist, route);
        fs.mkdirSync(routeDir, { recursive: true });
        fs.copyFileSync(indexPath, path.join(routeDir, 'index.html'));
      }
    }

    copyDir(frontendDist, path.resolve('dist'));
    copyDir(frontendDist, path.resolve('public'));
    console.log('✅ Successfully generated static route entry points & synced assets for Vercel');
  }
} catch (e) {
  console.error('Postbuild copy warning:', e.message);
}
