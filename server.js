import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM environment helpers
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Utility: Check Public IP for Whitelist
async function logPublicIP() {
    try {
        console.log("---------------------------------------------------------");
        console.log("[Server] 🔍 Checking Public IP for WeChat Whitelist...");
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

// Serve Static Files (Frontend)
app.use(express.static(path.join(__dirname, 'dist')));

// SPA Fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start Server
app.listen(PORT, async () => {
    console.log(`\n✅ Server running on http://localhost:${PORT}`);
    await logPublicIP();
});