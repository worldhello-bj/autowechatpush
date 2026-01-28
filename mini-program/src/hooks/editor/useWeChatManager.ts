import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { WeChatCredentials, WeChatAccount } from '@shared/types';
import { wechatAccountService } from '../../services/wechatAccountService';

interface UseWeChatManagerReturn {
  // State
  wechatCreds: WeChatCredentials;
  showWeChatAccountManager: boolean;
  wechatAccounts: WeChatAccount[];
  currentWeChatAccount: WeChatAccount | null;
  isTestingAccount: boolean;
  accountTestResult: { [key: string]: boolean };
  newAccountForm: {
    name: string;
    appId: string;
    appSecret: string;
    isDefault: boolean;
  };

  // Actions
  openWeChatAccountManager: () => void;
  closeWeChatAccountManager: () => void;
  loadWeChatAccounts: () => void;
  handleAddWeChatAccount: () => void;
  handleDeleteWeChatAccount: (accountId: string) => void;
  handleSetDefaultWeChatAccount: (accountId: string) => void;
  handleTestWeChatAccount: (accountId: string) => Promise<void>;
  handleSelectWeChatAccount: (accountId: string) => void;
  updateNewAccountForm: (updates: Partial<{
    name: string;
    appId: string;
    appSecret: string;
    isDefault: boolean;
  }>) => void;
}

export const useWeChatManager = (onError: (msg: string) => void): UseWeChatManagerReturn => {
  // State
  const [wechatCreds, setWechatCreds] = useState<WeChatCredentials>({ appId: '', appSecret: '' });
  const [showWeChatAccountManager, setShowWeChatAccountManager] = useState(false);
  const [wechatAccounts, setWechatAccounts] = useState<WeChatAccount[]>([]);
  const [currentWeChatAccount, setCurrentWeChatAccount] = useState<WeChatAccount | null>(null);
  const [isTestingAccount, setIsTestingAccount] = useState(false);
  const [accountTestResult, setAccountTestResult] = useState<{ [key: string]: boolean }>({});
  const [newAccountForm, setNewAccountForm] = useState({
    name: '',
    appId: '',
    appSecret: '',
    isDefault: false
  });

  // Load WeChat accounts
  const loadWeChatAccounts = () => {
    const accounts = wechatAccountService.getAllAccounts();
    setWechatAccounts(accounts);
    const current = wechatAccountService.getCurrentAccount();
    setCurrentWeChatAccount(current);
    if (current) {
      setWechatCreds({
        appId: current.appId,
        appSecret: current.appSecret
      });
    }
  };

  // Actions
  const openWeChatAccountManager = () => {
    loadWeChatAccounts();
    setShowWeChatAccountManager(true);
  };

  const closeWeChatAccountManager = () => {
    setShowWeChatAccountManager(false);
  };

  const updateNewAccountForm = (updates: Partial<typeof newAccountForm>) => {
    setNewAccountForm(prev => ({ ...prev, ...updates }));
  };

  const handleAddWeChatAccount = () => {
    if (!newAccountForm.name.trim() || !newAccountForm.appId.trim() || !newAccountForm.appSecret.trim()) {
      onError('请填写完整的账号信息');
      return;
    }

    const account = wechatAccountService.addAccount(
      newAccountForm.name,
      newAccountForm.appId,
      newAccountForm.appSecret,
      newAccountForm.isDefault
    );

    loadWeChatAccounts();

    // Reset form
    setNewAccountForm({
      name: '',
      appId: '',
      appSecret: '',
      isDefault: false
    });

    if (newAccountForm.isDefault) {
      setCurrentWeChatAccount(account);
      setWechatCreds({
        appId: account.appId,
        appSecret: account.appSecret
      });
    }
  };

  const handleDeleteWeChatAccount = async (accountId: string) => {
    const res = await Taro.showModal({
      title: '确认删除',
      content: '确定要删除这个微信账号吗？',
    });
    
    if (res.confirm) {
      wechatAccountService.deleteAccount(accountId);
      loadWeChatAccounts();
    }
  };

  const handleSetDefaultWeChatAccount = (accountId: string) => {
    wechatAccountService.updateAccount(accountId, { isDefault: true });
    loadWeChatAccounts();
  };

  const handleTestWeChatAccount = async (accountId: string) => {
    setIsTestingAccount(true);
    try {
      const isValid = await wechatAccountService.testAccount(accountId);
      setAccountTestResult(prev => ({
        ...prev,
        [accountId]: isValid
      }));

      if (isValid) {
        wechatAccountService.setCurrentAccount(accountId);
        loadWeChatAccounts();
      }
    } catch (error) {
      console.error('Failed to test account:', error);
      setAccountTestResult(prev => ({
        ...prev,
        [accountId]: false
      }));
    } finally {
      setIsTestingAccount(false);
    }
  };

  const handleSelectWeChatAccount = (accountId: string) => {
    wechatAccountService.setCurrentAccount(accountId);
    loadWeChatAccounts();
  };

  // Initialize on mount
  useEffect(() => {
    loadWeChatAccounts();
  }, []);

  return {
    wechatCreds,
    showWeChatAccountManager,
    wechatAccounts,
    currentWeChatAccount,
    isTestingAccount,
    accountTestResult,
    newAccountForm,
    openWeChatAccountManager,
    closeWeChatAccountManager,
    loadWeChatAccounts,
    handleAddWeChatAccount,
    handleDeleteWeChatAccount,
    handleSetDefaultWeChatAccount,
    handleTestWeChatAccount,
    handleSelectWeChatAccount,
    updateNewAccountForm,
  };
};