import { Request, Response } from 'express';
import { logger } from '../utils/logger.js';

// Handler for GET requests (Token, etc.)
export const proxyGet = async (req: Request, res: Response) => {
  try {
    // req.path is relative to the router mount point. 
    // If mounted at /api/v1/wechat, and requested /api/v1/wechat/token, req.path is /token
    const targetUrl = new URL(`https://api.weixin.qq.com/cgi-bin${req.path}`);
    
    Object.keys(req.query).forEach(key => {
        targetUrl.searchParams.append(key, req.query[key] as string);
    });

    logger.info(`Proxying GET to: ${targetUrl.toString()}`);

    const response = await fetch(targetUrl.toString());
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    logger.error('WeChat GET Proxy Error', error);
    res.status(500).json({ error: error.message });
  }
};

// Handler for POST JSON requests (Drafts, etc.)
export const proxyPostJson = async (req: Request, res: Response) => {
  try {
    const targetUrl = `https://api.weixin.qq.com/cgi-bin${req.path}`;
    const query = new URLSearchParams(req.query as any).toString();
    const url = `${targetUrl}?${query}`;

    logger.info(`Proxying POST to: ${url}`);

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    logger.error('WeChat POST Proxy Error', error);
    res.status(500).json({ error: error.message });
  }
};
