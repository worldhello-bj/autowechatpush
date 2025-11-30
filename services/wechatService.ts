import { WeChatCredentials, WechatPayload } from '../types';
import { loggers } from './logger';

const logger = loggers.wechat;

// Use local proxy path to handle CORS and logging on the server side
// The server (server.js or Vite) will rewrite this to https://api.weixin.qq.com/cgi-bin
const BASE_API = '/api/wechat';

/**
 * Helper function to handle HTTP response and throw appropriate errors
 */
async function handleResponse(response: Response, context: string): Promise<any> {
  if (!response.ok) {
    const errorText = await response.text();
    logger.error(`HTTP Error: ${response.status} - ${errorText}`);
    throw new Error(`${context} HTTP Error (${response.status}): ${errorText || 'Server error'}`);
  }
  
  const data = await response.json();
  logger.debug('Response Body:', data);
  return data;
}

/**
 * Helper function to handle and format errors consistently
 */
function formatError(error: unknown, context: string, defaultMessage: string): Error {
  logger.error(`${context}:`, error);
  
  if (error instanceof Error) {
    // Check for network-related errors
    if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('Failed to fetch')) {
      return new Error(`Network Error: Cannot connect to server. Please ensure the server is running and try again.`);
    }
    
    // If it's already a formatted error (contains context), re-throw it
    if (error.message.includes('Error') && error.message.includes('(')) {
      return error;
    }
    
    return new Error(`${context}: ${error.message}. Check server logs for details.`);
  }
  
  return new Error(defaultMessage);
}

/**
 * Get Access Token
 * Doc: https://developers.weixin.qq.com/doc/offiaccount/Basic_Information/Get_access_token.html
 */
export const getAccessToken = async (creds: WeChatCredentials): Promise<string> => {
  const url = `${BASE_API}/token?grant_type=client_credential&appid=${creds.appId}&secret=${creds.appSecret}`;
  
  logger.info('Requesting Access Token...');
  logger.debug('URL:', url);

  try {
    const response = await fetch(url);
    logger.debug('Status:', response.status);
    
    const data = await handleResponse(response, 'Access Token');
    
    if (data.errcode) {
      logger.error(`API Error: ${data.errcode} - ${data.errmsg}`);
      throw new Error(`WeChat API Error (${data.errcode}): ${data.errmsg}`);
    }
    
    logger.info('Access Token obtained successfully');
    return data.access_token;
  } catch (error: unknown) {
    throw formatError(error, 'Access Token Error', 'Network/CORS Error: Unable to connect to WeChat API. Check server logs.');
  }
};

/**
 * Upload Permanent Material (Image)
 * Doc: https://developers.weixin.qq.com/doc/offiaccount/Asset_Management/Adding_Permanent_Assets.html
 */
export const uploadImage = async (token: string, imageBlob: Blob): Promise<string> => {
    const url = `${BASE_API}/material/add_material?access_token=${token}&type=image`;
    
    logger.info('Uploading Image...');
    logger.debug('URL:', url);
    logger.debug('Image Size:', imageBlob.size, 'bytes');

    const formData = new FormData();
    formData.append('media', imageBlob, 'cover.jpg');

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });

        logger.debug('Status:', response.status);
        
        const data = await handleResponse(response, 'Image Upload');
        
        if (data.errcode) {
             throw new Error(`Image Upload Error (${data.errcode}): ${data.errmsg}`);
        }
        
        logger.info('Image uploaded successfully, media_id:', data.media_id);
        return data.media_id;
    } catch (error: unknown) {
        throw formatError(error, 'Image Upload Failed', 'Image Upload Failed: Network error. Check server logs.');
    }
};

/**
 * Save Draft
 * Doc: https://developers.weixin.qq.com/doc/offiaccount/Draft_Box/Add_draft.html
 */
export const saveDraft = async (token: string, payload: WechatPayload): Promise<any> => {
  const url = `${BASE_API}/draft/add?access_token=${token}`;
  
  logger.info('Saving Draft...');
  logger.debug('URL:', url);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    logger.debug('Status:', response.status);
    
    const data = await handleResponse(response, 'Draft Save');

    if (data.errcode && data.errcode !== 0) {
      throw new Error(`WeChat Draft Error (${data.errcode}): ${data.errmsg}`);
    }
    
    logger.info('Draft saved successfully');
    return data;
  } catch (error: unknown) {
    throw formatError(error, 'Draft Save Failed', 'Draft Save Failed: Network error. Check server logs.');
  }
};