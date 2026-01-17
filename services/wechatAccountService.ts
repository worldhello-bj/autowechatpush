import { WeChatAccount } from '../types';

const STORAGE_KEY = 'wechat_accounts';

/**
 * 微信账号管理服务
 * 负责管理用户的多微信公众号账号，密钥存储在localStorage中
 * 使用Base64编码进行简单混淆，不发送到后端
 */
class WeChatAccountService {
  private accounts: WeChatAccount[] = [];
  private currentAccountId: string | null = null;

  constructor() {
    this.loadAccounts();
  }

  /**
   * 从localStorage加载账号
   */
  private loadAccounts(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        // 解码Base64存储的数据
        const decoded = this.safeAtob(stored);
        if (decoded) {
          this.accounts = JSON.parse(decoded);
          
          // 查找默认账号
          const defaultAccount = this.accounts.find(acc => acc.isDefault);
          if (defaultAccount) {
            this.currentAccountId = defaultAccount.id;
          } else if (this.accounts.length > 0) {
            this.currentAccountId = this.accounts[0].id;
          }
        }
      }
    } catch (error) {
      console.error('Failed to load WeChat accounts:', error);
      this.accounts = [];
    }
  }

  /**
   * 保存账号到localStorage
   */
  private saveAccounts(): void {
    try {
      // 使用Base64编码进行简单混淆
      const encoded = this.safeBtoa(JSON.stringify(this.accounts));
      if (encoded) {
        localStorage.setItem(STORAGE_KEY, encoded);
      }
    } catch (error) {
      console.error('Failed to save WeChat accounts:', error);
    }
  }

  /**
   * 安全的Base64编码（处理非ASCII字符）
   */
  private safeBtoa(str: string): string {
    try {
      // 先转换为UTF-8字节数组
      const utf8Bytes = new TextEncoder().encode(str);
      // 将字节数组转换为Base64
      let binary = '';
      const len = utf8Bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(utf8Bytes[i]);
      }
      return btoa(binary);
    } catch (error) {
      console.error('Base64 encoding error:', error);
      // 回退到简单的btoa（可能对非ASCII字符失败）
      return btoa(unescape(encodeURIComponent(str)));
    }
  }

  /**
   * 安全的Base64解码
   */
  private safeAtob(encoded: string): string {
    try {
      const binary = atob(encoded);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new TextDecoder().decode(bytes);
    } catch (error) {
      console.error('Base64 decoding error:', error);
      // 回退到简单的atob
      return decodeURIComponent(escape(atob(encoded)));
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
      // 更新最后使用时间
      account.lastUsed = new Date().toISOString();
      this.saveAccounts();
      return true;
    }
    return false;
  }

  /**
   * 添加新账号
   */
  addAccount(name: string, appId: string, appSecret: string, isDefault: boolean = false): WeChatAccount {
    const newAccount: WeChatAccount = {
      id: `account_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      appId,
      appSecret,
      isDefault,
      createdAt: new Date().toISOString(),
    };

    // 如果设置为默认账号，清除其他账号的默认状态
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
    
    // 如果设置为默认账号，清除其他账号的默认状态
    if (updates.isDefault === true) {
      this.accounts.forEach(acc => acc.isDefault = false);
      this.currentAccountId = accountId;
    }

    // 更新账号信息
    this.accounts[index] = {
      ...account,
      ...updates,
      id: account.id, // 保持ID不变
      createdAt: account.createdAt, // 保持创建时间不变
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
    const wasDefault = this.accounts[index].isDefault;

    this.accounts.splice(index, 1);

    // 如果删除了当前账号，重新选择当前账号
    if (wasCurrent) {
      if (this.accounts.length > 0) {
        // 优先选择默认账号，否则选择第一个
        const defaultAccount = this.accounts.find(acc => acc.isDefault);
        this.currentAccountId = defaultAccount ? defaultAccount.id : this.accounts[0].id;
      } else {
        this.currentAccountId = null;
      }
    }

    // 如果删除了默认账号且还有其他账号，设置第一个为默认
    if (wasDefault && this.accounts.length > 0 && !this.accounts.some(acc => acc.isDefault)) {
      this.accounts[0].isDefault = true;
      this.currentAccountId = this.accounts[0].id;
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
      // 通过后端代理尝试获取access token来验证账号
      const response = await fetch(`/api/wechat/token?grant_type=client_credential&appid=${account.appId}&secret=${account.appSecret}`);
      
      if (!response.ok) {
        console.error('Failed to test WeChat account:', response.status, response.statusText);
        return false;
      }
      
      const data = await response.json();
      
      // 如果返回access_token，说明账号有效
      return !!data.access_token;
    } catch (error) {
      console.error('Failed to test WeChat account:', error);
      return false;
    }
  }

  /**
   * 获取账号的访问令牌（access token）
   * 注意：这个函数会实际调用微信API，需要谨慎使用
   */
  async getAccessToken(accountId: string): Promise<string | null> {
    const account = this.accounts.find(acc => acc.id === accountId);
    if (!account) return null;

    try {
      const response = await fetch(`/api/wechat/token?grant_type=client_credential&appid=${account.appId}&secret=${account.appSecret}`);
      
      if (!response.ok) {
        console.error('Failed to get WeChat access token:', response.status, response.statusText);
        return null;
      }
      
      const data = await response.json();
      
      if (data.access_token) {
        // 更新最后使用时间
        account.lastUsed = new Date().toISOString();
        this.saveAccounts();
        return data.access_token;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get WeChat access token:', error);
      return null;
    }
  }

  /**
   * 导出所有账号（用于备份）
   */
  exportAccounts(): string {
    return this.safeBtoa(JSON.stringify(this.accounts));
  }

  /**
   * 导入账号（从备份恢复）
   */
  importAccounts(encodedData: string): boolean {
    try {
      const decoded = this.safeAtob(encodedData);
      if (!decoded) return false;
      
      const importedAccounts: WeChatAccount[] = JSON.parse(decoded);
      
      // 验证导入的数据格式
      if (!Array.isArray(importedAccounts)) return false;
      
      // 为导入的账号生成新的ID（避免冲突）
      const newAccounts = importedAccounts.map(acc => ({
        ...acc,
        id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      }));

      // 合并现有账号和导入的账号
      this.accounts = [...this.accounts, ...newAccounts];
      this.saveAccounts();
      return true;
    } catch (error) {
      console.error('Failed to import WeChat accounts:', error);
      return false;
    }
  }

  /**
   * 清除所有账号
   */
  clearAllAccounts(): void {
    this.accounts = [];
    this.currentAccountId = null;
    localStorage.removeItem(STORAGE_KEY);
  }
}

// 创建单例实例
export const wechatAccountService = new WeChatAccountService();
