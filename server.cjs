const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json({ limit: '20mb' }));

// Utility: Check Public IP for Whitelist
async function logPublicIP() {
    try {
        console.log("---------------------------------------------------------");
        console.log("[Server] 🔍 Checking Public IP for WeChat Whitelist...");
        
        // Check if fetch is available (Node.js 18+ or browser)
        if (typeof fetch === 'undefined') {
            console.warn("[Server] ⚠️  fetch is not available in this Node.js version. Please upgrade to Node.js 18+");
            console.log("---------------------------------------------------------");
            return;
        }
        
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        console.log(`[Server] 🌍 \x1b[32mCurrent Public IP: ${data.ip}\x1b[0m`);
        console.log(`[Server] ⚠️  Please ensure this IP is added to your WeChat Official Account Whitelist!`);
        console.log("---------------------------------------------------------");
    } catch (e) {
        console.warn("[Server] ⚠️  Could not determine public IP automatically.", e.message);
    }
}

// CORS Middleware - Add CORS headers for requests
// In production, requests come from the same origin (served by this server)
// This middleware handles cases where the browser might still send CORS preflight requests
const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000'
];

app.use((req, res, next) => {
    const origin = req.headers.origin;
    
    // Allow same-origin requests (no origin header) or requests from allowed origins
    if (!origin || allowedOrigins.includes(origin)) {
        if (origin) {
            res.header('Access-Control-Allow-Origin', origin);
        }
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    }
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Proxy Configuration
const wechatProxy = createProxyMiddleware({
    target: 'https://api.weixin.qq.com',
    changeOrigin: true,
    pathRewrite: {
        '^/api/wechat': '/cgi-bin', // Rewrite /api/wechat/token -> /cgi-bin/token
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`\n[Proxy] ➤ Outgoing Request: ${req.method} ${proxyReq.path}`);
    },
    onProxyRes: (proxyRes, req, res) => {
        console.log(`[Proxy] ◀ Received Response: ${proxyRes.statusCode} from ${req.url}`);
    },
    onError: (err, req, res) => {
        console.error(`[Proxy] 🔴 Proxy Error:`, err);
        console.error(`[Proxy] 🔴 Error Details: ${err.message}`);
        console.error(`[Proxy] 🔴 This could be caused by:`);
        console.error(`[Proxy]    1. Network connectivity issues`);
        console.error(`[Proxy]    2. DNS resolution failure for api.weixin.qq.com`);
        console.error(`[Proxy]    3. Firewall blocking outbound connections`);
        console.error(`[Proxy]    4. SSL/TLS certificate issues`);
        
        // Ensure the response hasn't been sent yet
        if (!res.headersSent) {
            res.status(502).json({ 
                error: 'Proxy Error', 
                details: err.message,
                suggestion: 'Check server logs for more details. Ensure network connectivity to api.weixin.qq.com is available.'
            });
        }
    }
});

// Use Proxy for API requests
app.use('/api/wechat', wechatProxy);

// Simple backend stitching service
const sanitizeDataUrl = (value = '') => {
    const trimmed = value.trim();
    const dataUrlPattern = /^data:image\/(?:png|jpeg|jpg|gif|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$/i;
    return dataUrlPattern.test(trimmed) ? trimmed : null;
};

app.post('/api/stitch-images', (req, res) => {
    try {
        const { images = [], width = '100%' } = req.body || {};
        const safeImages = Array.isArray(images) ? images.map(sanitizeDataUrl).filter(Boolean) : [];
        if (!safeImages.length) {
            return res.status(400).json({ error: 'No valid images provided' });
        }
        const safeWidth = typeof width === 'string' && /^([0-9]+%|[0-9]+px)$/i.test(width.trim()) ? width.trim() : '100%';
        const sections = safeImages.map((src, idx) => `
  <section style="margin-top: ${idx === 0 ? '0' : '-1px'}; line-height: 0; font-size: 0; background-color: transparent;">
    <img src="${src}" style="vertical-align: top; width: 100%; display: block;" />
  </section>`).join('');
        const html = `<section style="max-width: ${safeWidth}; margin: 0 auto; box-sizing: border-box;">${sections}</section>`;
        res.json({ html });
    } catch (e) {
        console.error('[Stitch] Error:', e);
        res.status(500).json({ error: 'Stitching failed', details: e.message });
    }
});

// Serve Static Files (Frontend)
app.use(express.static(path.join(__dirname, 'dist')));

// SPA Fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Function to start the server
function startServer() {
    return new Promise((resolve, reject) => {
        try {
            const server = app.listen(PORT, async () => {
                console.log(`\n✅ Server running on http://localhost:${PORT}`);
                await logPublicIP();
                resolve(server);
            });
            
            server.on('error', (err) => {
                console.error('[Server] Failed to start:', err);
                reject(err);
            });
        } catch (err) {
            console.error('[Server] Error starting server:', err);
            reject(err);
        }
    });
}

// Export for use in Electron
module.exports = { startServer, app };

// Auto-start when run directly (not required from Electron)
if (require.main === module) {
    startServer().catch((err) => {
        console.error('Failed to start server:', err);
        process.exit(1);
    });
}
