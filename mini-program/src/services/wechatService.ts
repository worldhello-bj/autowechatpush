import { WeChatCredentials, WechatPayload } from '@shared/types';
import { loggers } from './logger';
import { wechatAccountService } from './wechatAccountService';

const logger = loggers.wechat;

// Use configured API base
const BASE_API = process.env.TARO_APP_API_BASE || 'https://www.aiwxcreator.cloud/api/v1';

/**
 * Helper function to handle HTTP response and throw appropriate errors
 */
async function handleResponse(response: Taro.request.SuccessCallbackResult<any>, context: string): Promise<any> {
  if (response.statusCode >= 400) {
    const errorText = JSON.stringify(response.data);
    logger.error(`HTTP Error: ${response.statusCode} - ${errorText}`);
    throw new Error(`${context} HTTP Error (${response.statusCode}): ${errorText || 'Server error'}`);
  }
  
  const data = response.data;
  logger.debug('Response Body:', data);
  return data;
}

/**
 * Helper function to handle and format errors consistently
 */
function formatError(error: unknown, context: string, defaultMessage: string): Error {
  logger.error(`${context}:`, error);
  
  if (error instanceof Error) {
    return new Error(`${context}: ${error.message}`);
  }
  
  return new Error(defaultMessage);
}

/**
 * Get Access Token using credentials object
 */
export const getAccessToken = async (creds: WeChatCredentials): Promise<string> => {
  const url = `${BASE_API}/wechat/token?grant_type=client_credential&appid=${creds.appId}&secret=${creds.appSecret}`;
  
  logger.info('Requesting Access Token...');

  try {
    const response = await Taro.request({ url });
    const data = await handleResponse(response, 'Access Token');
    
    if (data.errcode) {
      throw new Error(`WeChat API Error (${data.errcode}): ${data.errmsg}`);
    }
    
    return data.access_token;
  } catch (error: unknown) {
    throw formatError(error, 'Access Token Error', 'Network Error');
  }
};

/**
 * Get Access Token using account ID
 */
export const getAccessTokenByAccountId = async (accountId?: string): Promise<string> => {
  let targetAccountId = accountId;
  
  if (!targetAccountId) {
    const currentAccount = wechatAccountService.getCurrentAccount();
    if (!currentAccount) {
      throw new Error('No WeChat account configured.');
    }
    targetAccountId = currentAccount.id;
  }
  
  const account = wechatAccountService.getAllAccounts().find(acc => acc.id === targetAccountId);
  if (!account) {
    throw new Error(`WeChat account not found: ${targetAccountId}`);
  }
  
  const url = `${BASE_API}/wechat/token?grant_type=client_credential&appid=${account.appId}&secret=${account.appSecret}`;

  try {
    const response = await Taro.request({ url });
    const data = await handleResponse(response, 'Access Token');
    
    if (data.errcode) {
      throw new Error(`WeChat API Error (${data.errcode}): ${data.errmsg}`);
    }
    
    account.lastUsed = new Date().toISOString();
    return data.access_token;
  } catch (error: unknown) {
    throw formatError(error, 'Access Token Error', 'Network Error');
  }
};

// ... (keep credential helpers) ...

/**
 * Upload Permanent Material (Image)
 */
export const uploadImage = async (token: string, imagePath: string): Promise<string> => {
    const url = `${BASE_API}/wechat/material/add_material?access_token=${token}&type=image`;
    
    logger.info('Uploading Image...');

    try {
        const response = await Taro.uploadFile({
            url,
            filePath: imagePath,
            name: 'media',
        });

        const data = JSON.parse(response.data);
        
        if (data.errcode) {
             throw new Error(`Image Upload Error (${data.errcode}): ${data.errmsg}`);
        }
        
        logger.info('Image uploaded successfully, media_id:', data.media_id);
        return data.media_id;
    } catch (error: unknown) {
        throw formatError(error, 'Image Upload Failed', 'Network error');
    }
};

/**
 * Upload image using current account
 */
export const uploadImageWithCurrentAccount = async (imagePath: string, accountId?: string): Promise<string> => {
  const token = await getAccessTokenByAccountId(accountId);
  return uploadImage(token, imagePath);
};

/**
 * Save Draft
 */
export const saveDraft = async (token: string, payload: WechatPayload): Promise<any> => {
  const url = `${BASE_API}/wechat/draft/add?access_token=${token}`;
  
  logger.info('Saving Draft...');

  try {
    const response = await Taro.request({
      url,
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      },
      data: payload
    });
    
    const data = await handleResponse(response, 'Draft Save');

    if (data.errcode && data.errcode !== 0) {
      throw new Error(`WeChat Draft Error (${data.errcode}): ${data.errmsg}`);
    }
    
    return data;
  } catch (error: unknown) {
    throw formatError(error, 'Draft Save Failed', 'Network error');
  }
};
