import { Router } from 'express';
import { proxyGet, proxyPostJson } from '../controllers/wechatProxyController.js';
import multer from 'multer';
import { logger } from '../utils/logger.js';
import fs from 'fs';

const router = Router();
const upload = multer({ dest: 'uploads/' });

// Media Upload Proxy (Specific route first)
router.post('/material/add_material', upload.single('media'), async (req, res) => {
    try {
        if (!req.file) throw new Error('No file uploaded');
        
        const { access_token, type } = req.query;
        const url = `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${access_token}&type=${type}`;
        
        logger.info(`Proxying Upload to: ${url}`);

        const formData = new FormData();
        const fileBuffer = fs.readFileSync(req.file.path);
        const blob = new Blob([fileBuffer], { type: req.file.mimetype });
        formData.append('media', blob, req.file.originalname);

        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        // Cleanup temp file
        fs.unlinkSync(req.file.path);
        
        res.json(data);
    } catch (error: any) {
        logger.error('Upload Proxy Error', error);
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ error: error.message });
    }
});

// Generic POST proxy (JSON)
router.post('/draft/add', proxyPostJson);
router.post('/freepublish/submit', proxyPostJson);

// Generic GET proxy (Wildcard last)
router.get('/*', proxyGet);

export default router;
