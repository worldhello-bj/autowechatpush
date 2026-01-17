import React from 'react';
import { WeChatAccount } from '../../../types';
import { wechatAccountService } from '../../../services/wechatAccountService';

interface NewAccountForm {
  name: string;
  appId: string;
  appSecret: string;
  isDefault: boolean;
}

interface AccountManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  wechatAccounts: WeChatAccount[];
  currentWeChatAccount: WeChatAccount | null;
  newAccountForm: NewAccountForm;
  updateNewAccountForm: (updates: Partial<NewAccountForm>) => void;
  handleAddWeChatAccount: () => void;
  handleDeleteWeChatAccount: (id: string) => void;
  handleSelectWeChatAccount: (id: string) => void;
  handleSetDefaultWeChatAccount: (id: string) => void;
  handleTestWeChatAccount: (id: string) => void;
  isTestingAccount: boolean;
  accountTestResult: Record<string, boolean>;
  loadWeChatAccounts: () => void;
}

const AccountManagerModal: React.FC<AccountManagerModalProps> = ({
  isOpen,
  onClose,
  wechatAccounts,
  currentWeChatAccount,
  newAccountForm,
  updateNewAccountForm,
  handleAddWeChatAccount,
  handleDeleteWeChatAccount,
  handleSelectWeChatAccount,
  handleSetDefaultWeChatAccount,
  handleTestWeChatAccount,
  isTestingAccount,
  accountTestResult,
  loadWeChatAccounts,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center gap-2">
            <span className="material-icons text-green-600">account_circle</span>
            <span className="font-bold text-lg text-gray-800">微信账号管理</span>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              {wechatAccounts.length}个账号
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition"
          >
            <span className="material-icons text-gray-500">close</span>
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {/* Current Account Info */}
          {currentWeChatAccount && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="material-icons text-green-600">check_circle</span>
                  <span className="font-medium text-gray-800">当前使用账号</span>
                </div>
                {currentWeChatAccount.isDefault && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">默认</span>
                )}
              </div>
              <div className="text-sm">
                <div className="font-medium text-gray-700">{currentWeChatAccount.name}</div>
                <div className="text-gray-500 text-xs mt-1">AppID: {currentWeChatAccount.appId.substring(0, 8)}...{currentWeChatAccount.appId.substring(currentWeChatAccount.appId.length - 4)}</div>
                <div className="text-gray-500 text-xs">创建时间: {new Date(currentWeChatAccount.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
          )}

          {/* Add New Account Form */}
          <div className="mb-6 p-4 border border-gray-200 rounded-lg">
            <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
              <span className="material-icons text-blue-600 text-sm">add_circle</span>
              添加新账号
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">账号名称</label>
                <input
                  type="text"
                  value={newAccountForm.name}
                  onChange={(e) => updateNewAccountForm({ name: e.target.value })}
                  placeholder="例如：公司公众号"
                  className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">AppID</label>
                <input
                  type="text"
                  value={newAccountForm.appId}
                  onChange={(e) => updateNewAccountForm({ appId: e.target.value })}
                  placeholder="微信公众号AppID"
                  className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">AppSecret</label>
                <input
                  type="password"
                  value={newAccountForm.appSecret}
                  onChange={(e) => updateNewAccountForm({ appSecret: e.target.value })}
                  placeholder="微信公众号AppSecret"
                  className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={newAccountForm.isDefault}
                    onChange={(e) => updateNewAccountForm({ isDefault: e.target.checked })}
                    className="rounded text-green-600 focus:ring-green-500"
                  />
                  设为默认账号
                </label>
                <button
                  onClick={handleAddWeChatAccount}
                  className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition"
                >
                  添加账号
                </button>
              </div>
            </div>
          </div>

          {/* Account List */}
          <div>
            <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
              <span className="material-icons text-gray-600 text-sm">list</span>
              账号列表
            </h3>
            {wechatAccounts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <span className="material-icons text-gray-300 text-4xl mb-2">account_circle</span>
                <p className="text-sm">暂无微信账号，请添加一个</p>
              </div>
            ) : (
              <div className="space-y-3">
                {wechatAccounts.map((account) => (
                  <div
                    key={account.id}
                    className={`p-3 border rounded-lg ${account.id === currentWeChatAccount?.id ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="material-icons text-gray-600 text-sm">account_circle</span>
                        <span className="font-medium text-gray-800">{account.name}</span>
                        {account.isDefault && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">默认</span>
                        )}
                        {account.id === currentWeChatAccount?.id && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">当前</span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleTestWeChatAccount(account.id)}
                          disabled={isTestingAccount}
                          className="p-1 text-xs text-gray-500 hover:text-blue-600 transition"
                          title="测试账号有效性"
                        >
                          {isTestingAccount ? '测试中...' : '测试'}
                        </button>
                        <button
                          onClick={() => handleDeleteWeChatAccount(account.id)}
                          className="p-1 text-xs text-gray-500 hover:text-red-600 transition"
                          title="删除账号"
                        >
                          删除
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 space-y-1">
                      <div>AppID: {account.appId.substring(0, 8)}...{account.appId.substring(account.appId.length - 4)}</div>
                      <div>创建时间: {new Date(account.createdAt).toLocaleDateString()}</div>
                      {account.lastUsed && (
                        <div>最后使用: {new Date(account.lastUsed).toLocaleDateString()}</div>
                      )}
                    </div>

                    {/* Test Result */}
                    {accountTestResult[account.id] !== undefined && (
                      <div className={`mt-2 text-xs px-2 py-1 rounded ${accountTestResult[account.id] ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {accountTestResult[account.id] ? '✓ 账号有效' : '✗ 账号无效'}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-3">
                      {!account.isDefault && (
                        <button
                          onClick={() => handleSetDefaultWeChatAccount(account.id)}
                          className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
                        >
                          设为默认
                        </button>
                      )}
                      {account.id !== currentWeChatAccount?.id && (
                        <button
                          onClick={() => handleSelectWeChatAccount(account.id)}
                          className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                        >
                          切换到此账号
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Backup/Restore Section */}
          {wechatAccounts.length > 0 && (
            <div className="mt-6 p-4 border border-gray-200 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                <span className="material-icons text-amber-600 text-sm">backup</span>
                备份与恢复
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const backupData = wechatAccountService.exportAccounts();
                    navigator.clipboard.writeText(backupData);
                    alert('账号备份数据已复制到剪贴板');
                  }}
                  className="flex-1 px-3 py-2 bg-amber-100 text-amber-700 text-sm rounded hover:bg-amber-200 transition"
                >
                  导出备份
                </button>
                <button
                  onClick={() => {
                    const backupData = prompt('请输入备份数据：');
                    if (backupData) {
                      const success = wechatAccountService.importAccounts(backupData);
                      if (success) {
                        loadWeChatAccounts();
                        alert('账号恢复成功');
                      } else {
                        alert('账号恢复失败，请检查备份数据格式');
                      }
                    }
                  }}
                  className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 text-sm rounded hover:bg-blue-200 transition"
                >
                  导入恢复
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                注意：备份数据包含所有账号信息，请妥善保管
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountManagerModal;
