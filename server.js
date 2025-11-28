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
        res.status(500).json({ error: 'Proxy Error', details: err.message });
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