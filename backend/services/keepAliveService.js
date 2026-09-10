import https from 'https';
import http from 'http';

/**
 * 24/7 Keep-Alive Service for Render Free Tier
 * Automatically pings the server URL every 10 minutes to prevent Render 15-minute inactivity sleep.
 */
export const startKeepAlive = () => {
  const targetUrl = process.env.RENDER_EXTERNAL_URL || 'https://webvault-0ixp.onrender.com/api';
  const PING_INTERVAL = 10 * 60 * 1000; // 10 minutes (600,000 ms)

  console.log(`[Keep-Alive] Service initialized. Target ping URL: ${targetUrl}`);

  const pingServer = () => {
    try {
      const isHttps = targetUrl.startsWith('https');
      const httpModule = isHttps ? https : http;

      const req = httpModule.get(targetUrl, (res) => {
        console.log(`[Keep-Alive] Self-ping status: ${res.statusCode} at ${new Date().toISOString()}`);
      });

      req.on('error', (err) => {
        console.warn(`[Keep-Alive] Self-ping warning: ${err.message}`);
      });

      req.setTimeout(10000, () => {
        req.destroy();
      });
    } catch (err) {
      console.warn(`[Keep-Alive] Ping execution error: ${err.message}`);
    }
  };

  // Perform initial ping after 1 minute of startup
  setTimeout(pingServer, 60 * 1000);

  // Repeat ping every 10 minutes indefinitely
  setInterval(pingServer, PING_INTERVAL);
};

export default startKeepAlive;
