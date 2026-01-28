import Taro from '@tarojs/taro';
import { wechatOpenPlatformApi } from './apiClient';
import { loggers } from './logger';

const logger = loggers.wechat;

/**
 * 微信开放平台（第三方平台）授权服务 (方案 B)
 * 预留接口，用于实现无需 AppSecret 的扫码授权发文
 */
class WeChatOpenPlatformService {
  /**
   * 获取授权跳转 URL
   * 用户点击后将跳转到微信官方授权页面进行扫码
   * @param redirectUri 授权成功后的回调地址
   */
  async getAuthUrl(redirectUri?: string): Promise<string> {
    try {
      const response = await wechatOpenPlatformApi.getPreAuthUrl(redirectUri);
      if (response.success && response.data?.url) {
        return response.data.url;
      }
      throw new Error(response.error?.message || '获取授权地址失败');
    } catch (error) {
      logger.error('Failed to get pre-auth URL:', error);
      throw error;
    }
  }

  /**
   * 处理授权回调
   * 在回调页面获取 auth_code 后调用此接口，完成绑定
   * @param authCode 微信回调带回的授权码
   */
  async handleCallback(authCode: string): Promise<any> {
    try {
      const response = await wechatOpenPlatformApi.bindAccount(authCode);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error?.message || '绑定公众号失败');
    } catch (error) {
      logger.error('Failed to handle auth callback:', error);
      throw error;
    }
  }

  /**
   * 获取当前用户已授权的公众号列表
   */
  async getAuthorizedAccounts(): Promise<any[]> {
    try {
      const response = await wechatOpenPlatformApi.listAccounts();
      if (response.success) {
        return response.data || [];
      }
      return [];
    } catch (error) {
      logger.error('Failed to list authorized accounts:', error);
      return [];
    }
  }

  /**
   * 检查授权状态
   * @param appId 公众号 AppID
   */
  async checkAuthStatus(appId: string): Promise<boolean> {
    try {
      const response = await wechatOpenPlatformApi.getStatus(appId);
      return !!(response.success && response.data?.isAuthorized);
    } catch (error) {
      return false;
    }
  }
}

export const wechatOpenPlatformService = new WeChatOpenPlatformService();
