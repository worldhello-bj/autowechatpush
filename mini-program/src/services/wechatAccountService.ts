import Taro from '@tarojs/taro';
import { WeChatAccount } from '@shared/types';

const STORAGE_KEY = 'wechat_accounts';

/**
 * 微信账号管理服务
 * 负责管理用户的多微信公众号账号，密钥存储在本地
 */
class WeChatAccountService {
  private accounts: WeChatAccount[] = [];
  private currentAccountId: string | null = null;

  constructor() {
    this.loadAccounts();
  }

  /**
   * 从存储加载账号
   */
  private loadAccounts(): void {
    try {
      const stored = Taro.getStorageSync(STORAGE_KEY);
      if (stored) {
        this.accounts = typeof stored === 'string' ? JSON.parse(stored) : stored;
        
        // 查找默认账号
        const defaultAccount = this.accounts.find(acc => acc.isDefault);
        if (defaultAccount) {
          this.currentAccountId = defaultAccount.id;
        } else if (this.accounts.length > 0) {
          this.currentAccountId = this.accounts[0].id;
        }
      }
    } catch (error) {
      console.error('Failed to load WeChat accounts:', error);
      this.accounts = [];
    }
  }

  /**
   * 保存账号到存储
   */
  private saveAccounts(): void {
    try {
      Taro.setStorageSync(STORAGE_KEY, this.accounts);
    } catch (error) {
      console.error('Failed to save WeChat accounts:', error);
    }
  }

  /**
   * 获取所有账号
   */
  getAllAccounts(): WeChatAccount[] {
    return [...this.accounts];
  }

  /**
   * 获取当前选中的账号
   */
  getCurrentAccount(): WeChatAccount | null {
    if (!this.currentAccountId) return null;
    return this.accounts.find(acc => acc.id === this.currentAccountId) || null;
  }

  /**
   * 设置当前账号
   */
  setCurrentAccount(accountId: string): boolean {
    const account = this.accounts.find(acc => acc.id === accountId);
    if (account) {
      this.currentAccountId = accountId;
      account.lastUsed = new Date().toISOString();
      this.saveAccounts();
      return true;
    }
    return false;
  }

  /**
   * 添加新账号（密钥模式 - 方案 A）
   */
  addAccount(name: string, appId: string, appSecret: string, isDefault: boolean = false): WeChatAccount {
    const newAccount: WeChatAccount = {
      id: `acc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name,
      appId,
      appSecret,
      authType: 'credentials',
      isDefault,
      createdAt: new Date().toISOString(),
    };

    if (isDefault) {
      this.accounts.forEach(acc => acc.isDefault = false);
      this.currentAccountId = newAccount.id;
    }

    this.accounts.push(newAccount);
    this.saveAccounts();

    return newAccount;
  }

  /**
   * 添加已授权账号（授权模式 - 方案 B）
   */
  addAuthorizedAccount(accountData: { name: string, appId: string, authorization: any }, isDefault: boolean = false): WeChatAccount {
    const newAccount: WeChatAccount = {
      id: `auth_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: accountData.name,
      appId: accountData.appId,
      authorization: accountData.authorization,
      authType: 'authorization',
      isDefault,
      createdAt: new Date().toISOString(),
    };

    if (isDefault) {
      this.accounts.forEach(acc => acc.isDefault = false);
      this.currentAccountId = newAccount.id;
    }

    this.accounts.push(newAccount);
    this.saveAccounts();

    return newAccount;
  }

  /**
   * 更新账号信息
   */
  updateAccount(accountId: string, updates: Partial<Omit<WeChatAccount, 'id' | 'createdAt'>>): WeChatAccount | null {
    const index = this.accounts.findIndex(acc => acc.id === accountId);
    if (index === -1) return null;

    const account = this.accounts[index];
    
    if (updates.isDefault === true) {
      this.accounts.forEach(acc => acc.isDefault = false);
      this.currentAccountId = accountId;
    }

    this.accounts[index] = {
      ...account,
      ...updates,
      id: account.id,
      createdAt: account.createdAt,
    };

    this.saveAccounts();
    return this.accounts[index];
  }

  /**
   * 删除账号
   */
  deleteAccount(accountId: string): boolean {
    const index = this.accounts.findIndex(acc => acc.id === accountId);
    if (index === -1) return false;

    const wasCurrent = this.currentAccountId === accountId;
    this.accounts.splice(index, 1);

    if (wasCurrent) {
      if (this.accounts.length > 0) {
        const defaultAccount = this.accounts.find(acc => acc.isDefault);
        this.currentAccountId = defaultAccount ? defaultAccount.id : this.accounts[0].id;
      } else {
        this.currentAccountId = null;
      }
    }

    this.saveAccounts();
    return true;
  }

  /**
   * 测试账号有效性
   */
  async testAccount(accountId: string): Promise<boolean> {
    const account = this.accounts.find(acc => acc.id === accountId);
    if (!account) return false;

    try {
      const response = await Taro.request({
        url: `https://www.aiwxcreator.cloud/api/wechat/token?grant_type=client_credential&appid=${account.appId}&secret=${account.appSecret}`
      });
      
      return !!(response.data as any).access_token;
    } catch (error) {
      console.error('Failed to test WeChat account:', error);
      return false;
    }
  }

  /**
   * 清除所有账号
   */
  clearAllAccounts(): void {
    this.accounts = [];
    this.currentAccountId = null;
    Taro.removeStorageSync(STORAGE_KEY);
  }
}

export const wechatAccountService = new WeChatAccountService();