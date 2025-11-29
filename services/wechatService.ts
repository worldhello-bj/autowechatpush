import { WeChatCredentials, WechatPayload } from '../types';

// Use local proxy path to handle CORS and logging on the server side
// The server (server.js or Vite) will rewrite this to https://api.weixin.qq.com/cgi-bin
const BASE_API = '/api/wechat';

/**
 * Get Access Token
 * Doc: https://developers.weixin.qq.com/doc/offiaccount/Basic_Information/Get_access_token.html
 */
export const getAccessToken = async (creds: WeChatCredentials): Promise<string> => {
  const url = `${BASE_API}/token?grant_type=client_credential&appid=${creds.appId}&secret=${creds.appSecret}`;
  
  console.log(`[WeChat Client] 🔵 Requesting Access Token...`);
  console.log(`[WeChat Client] URL: ${url}`);

  try {
    const response = await fetch(url);
    console.log(`[WeChat Client] Status: ${response.status}`);
    
    // Handle HTTP error status codes
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[WeChat Client] 🔴 HTTP Error: ${response.status} - ${errorText}`);
      throw new Error(`Server Error (${response.status}): ${errorText || 'Unable to connect to WeChat API'}`);
    }
    
    const data = await response.json();
    console.log(`[WeChat Client] Response Body:`, data);
    
    if (data.errcode) {
      console.error(`[WeChat Client] 🔴 API Error: ${data.errcode} - ${data.errmsg}`);
      throw new Error(`WeChat API Error (${data.errcode}): ${data.errmsg}`);
    }
    
    return data.access_token;
  } catch (error: unknown) {
    console.error("[WeChat Client] 🔴 Network/System Error:", error);
    
    // Provide more specific error messages based on error type
    if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('network'))) {
      throw new Error("Network Error: Cannot connect to server. Please ensure the server is running and try again.");
    }
    
    if (error instanceof Error) {
      // If it's already a formatted error from above, re-throw it
      if (error.message.startsWith('WeChat API Error') || 
          error.message.startsWith('Server Error') ||
          error.message.startsWith('Network Error')) {
        throw error;
      }
      throw new Error(`Connection Error: ${error.message}. Check server logs for details.`);
    }
    
    throw new Error("Network/CORS Error: Unable to connect to WeChat API. Check server logs.");
  }
};

/**
 * Upload Permanent Material (Image)
 * Doc: https://developers.weixin.qq.com/doc/offiaccount/Asset_Management/Adding_Permanent_Assets.html
 */
export const uploadImage = async (token: string, imageBlob: Blob): Promise<string> => {
    const url = `${BASE_API}/material/add_material?access_token=${token}&type=image`;
    
    console.log(`[WeChat Client] 🔵 Uploading Image...`);
    console.log(`[WeChat Client] URL: ${url}`);
    console.log(`[WeChat Client] Image Size: ${imageBlob.size} bytes`);

    const formData = new FormData();
    formData.append('media', imageBlob, 'cover.jpg');

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });

        console.log(`[WeChat Client] Status: ${response.status}`);
        
        // Handle HTTP error status codes
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[WeChat Client] 🔴 HTTP Error: ${response.status} - ${errorText}`);
            throw new Error(`Image Upload HTTP Error (${response.status}): ${errorText || 'Server error'}`);
        }
        
        const data = await response.json();
        console.log(`[WeChat Client] Response Body:`, data);
        
        if (data.errcode) {
             throw new Error(`Image Upload Error (${data.errcode}): ${data.errmsg}`);
        }
        
        return data.media_id;
    } catch (error: unknown) {
        console.error("[WeChat Client] 🔴 Image upload failed:", error);
        
        if (error instanceof Error) {
            // If it's already a formatted error, re-throw it
            if (error.message.startsWith('Image Upload')) {
                throw error;
            }
            throw new Error(`Image Upload Failed: ${error.message}`);
        }
        
        throw new Error("Image Upload Failed: Network error. Check server logs.");
    }
};

/**
 * Save Draft
 * Doc: https://developers.weixin.qq.com/doc/offiaccount/Draft_Box/Add_draft.html
 */
export const saveDraft = async (token: string, payload: WechatPayload): Promise<any> => {
  const url = `${BASE_API}/draft/add?access_token=${token}`;
  
  console.log(`[WeChat Client] 🔵 Saving Draft...`);
  console.log(`[WeChat Client] URL: ${url}`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    console.log(`[WeChat Client] Status: ${response.status}`);
    
    // Handle HTTP error status codes
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[WeChat Client] 🔴 HTTP Error: ${response.status} - ${errorText}`);
      throw new Error(`Draft Save HTTP Error (${response.status}): ${errorText || 'Server error'}`);
    }
    
    const data = await response.json();
    console.log(`[WeChat Client] Response Body:`, data);

    if (data.errcode && data.errcode !== 0) {
      throw new Error(`WeChat Draft Error (${data.errcode}): ${data.errmsg}`);
    }
    return data;
  } catch (error: unknown) {
    console.error("[WeChat Client] 🔴 Failed to save draft", error);
    
    if (error instanceof Error) {
      // If it's already a formatted error, re-throw it
      if (error.message.startsWith('WeChat Draft Error') || 
          error.message.startsWith('Draft Save HTTP Error')) {
        throw error;
      }
      throw new Error(`Draft Save Failed: ${error.message}`);
    }
    
    throw new Error("Draft Save Failed: Network error. Check server logs.");
  }
};