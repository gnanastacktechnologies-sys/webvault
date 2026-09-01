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
  let frontendDist = path.resolve('frontend/dist');
  if (!fs.existsSync(frontendDist) && fs.existsSync(path.resolve('dist'))) {
    frontendDist = path.resolve('dist');
  }

  console.log('Postbuild using dist directory:', frontendDist);

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

    const rootDir = fs.existsSync(path.resolve('frontend')) ? path.resolve('.') : path.resolve('..');
    copyDir(frontendDist, path.join(rootDir, 'dist'));
    copyDir(frontendDist, path.join(rootDir, 'public'));
    console.log('✅ Successfully generated static route entry points & synced assets for Vercel');
  } else {
    console.error('Postbuild warning: dist directory not found at', frontendDist);
  }
} catch (e) {
  console.error('Postbuild copy warning:', e.message);
}
