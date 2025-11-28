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
    
    const data = await response.json();
    console.log(`[WeChat Client] Response Body:`, data);
    
    if (data.errcode) {
      console.error(`[WeChat Client] 🔴 API Error: ${data.errcode} - ${data.errmsg}`);
      throw new Error(`WeChat API Error (${data.errcode}): ${data.errmsg}`);
    }
    
    return data.access_token;
  } catch (error) {
    console.error("[WeChat Client] 🔴 Network/System Error:", error);
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
        const data = await response.json();
        console.log(`[WeChat Client] Response Body:`, data);
        
        if (data.errcode) {
             throw new Error(`Image Upload Error (${data.errcode}): ${data.errmsg}`);
        }
        
        return data.media_id;
    } catch (error) {
        console.error("[WeChat Client] 🔴 Image upload failed:", error);
        throw error;
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
    const data = await response.json();
    console.log(`[WeChat Client] Response Body:`, data);

    if (data.errcode && data.errcode !== 0) {
      throw new Error(`WeChat Draft Error (${data.errcode}): ${data.errmsg}`);
    }
    return data;
  } catch (error) {
    console.error("[WeChat Client] 🔴 Failed to save draft", error);
    throw error;
  }
};