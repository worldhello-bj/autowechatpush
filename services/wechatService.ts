import { WeChatCredentials, WechatPayload } from '../types';
import { loggers } from './logger';
import { wechatAccountService } from './wechatAccountService';

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
 * Get Access Token using credentials object
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
 * Get Access Token using account ID from account manager
 */
export const getAccessTokenByAccountId = async (accountId?: string): Promise<string> => {
  let targetAccountId = accountId;
  
  // 如果没有指定账号ID，使用当前账号
  if (!targetAccountId) {
    const currentAccount = wechatAccountService.getCurrentAccount();
    if (!currentAccount) {
      throw new Error('No WeChat account configured. Please add a WeChat account first.');
    }
    targetAccountId = currentAccount.id;
  }
  
  // 从账号管理器获取账号信息
  const account = wechatAccountService.getAllAccounts().find(acc => acc.id === targetAccountId);
  if (!account) {
    throw new Error(`WeChat account not found: ${targetAccountId}`);
  }
  
  logger.info(`Requesting Access Token for account: ${account.name} (${account.appId})`);
  
  const url = `${BASE_API}/token?grant_type=client_credential&appid=${account.appId}&secret=${account.appSecret}`;
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
    
    // 更新账号的最后使用时间
    account.lastUsed = new Date().toISOString();
    
    return data.access_token;
  } catch (error: unknown) {
    throw formatError(error, 'Access Token Error', 'Network/CORS Error: Unable to connect to WeChat API. Check server logs.');
  }
};

/**
 * Get current WeChat account credentials
 */
export const getCurrentAccountCredentials = (): WeChatCredentials | null => {
  const account = wechatAccountService.getCurrentAccount();
  if (!account) return null;
  
  return {
    appId: account.appId,
    appSecret: account.appSecret
  };
};

/**
 * Get all available WeChat accounts
 */
export const getWeChatAccounts = () => {
  return wechatAccountService.getAllAccounts();
};

/**
 * Set current WeChat account
 */
export const setCurrentWeChatAccount = (accountId: string): boolean => {
  return wechatAccountService.setCurrentAccount(accountId);
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
 * Upload image using current account
 */
export const uploadImageWithCurrentAccount = async (imageBlob: Blob, accountId?: string): Promise<string> => {
  const token = await getAccessTokenByAccountId(accountId);
  return uploadImage(token, imageBlob);
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

/**
 * Save draft using current account
 */
export const saveDraftWithCurrentAccount = async (payload: WechatPayload, accountId?: string): Promise<any> => {
  const token = await getAccessTokenByAccountId(accountId);
  return saveDraft(token, payload);
};
