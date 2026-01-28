import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import { quotaApi, QuotaStatus } from '../../services/apiClient';

const StatCard: React.FC<{ title: string; value: string | number; subtitle: string; icon: string; color: string }> = ({ title, value, subtitle, icon, color }) => (
  <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex-1 min-w-[150px]">
    <View className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl mb-4 ${color}`}>
      {icon}
    </View>
    <Text className="block text-gray-500 text-xs mb-1">{title}</Text>
    <Text className="block text-2xl font-black text-gray-900 mb-1">{value}</Text>
    <Text className="block text-[10px] text-gray-400">{subtitle}</Text>
  </View>
);

export default function Analytics() {
  const [stats, setStats] = useState<QuotaStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await quotaApi.getStatus();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="min-h-screen bg-gray-50 flex flex-col">
      <View className="p-6 bg-white border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900">数据分析</Text>
        <Text className="block text-xs text-gray-400 mt-1">实时监控您的创作与额度使用情况</Text>
      </View>

      <ScrollView scrollY className="flex-1 p-4">
        {isLoading ? (
          <View className="flex flex-col items-center justify-center pt-20">
            <View className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
          </View>
        ) : (
          <View className="space-y-6">
            {/* Usage Summary */}
            <View className="flex gap-4">
              <StatCard 
                title="已用额度" 
                value={stats?.usedQuota || 0} 
                subtitle="本月累计消耗" 
                icon="📊" 
                color="bg-blue-50 text-blue-500" 
              />
              <StatCard 
                title="剩余可用" 
                value={stats?.remainingQuota || 0} 
                subtitle="当前账号余额" 
                icon="💎" 
                color="bg-green-50 text-green-500" 
              />
            </View>

            {/* Detailed Stats */}
            <View className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <Text className="block font-bold text-gray-800 mb-6">活跃度分析</Text>
              
              <View className="space-y-6">
                <View>
                  <View className="flex justify-between text-xs mb-2">
                    <Text className="text-gray-500">今日消耗 (限制: {stats?.dailyLimit})</Text>
                    <Text className="font-bold text-gray-800">{stats?.dailyUsed}</Text>
                  </View>
                  <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <View 
                      className="h-full bg-blue-500 rounded-full" 
                      style={{ width: `${Math.min(100, ((stats?.dailyUsed || 0) / (stats?.dailyLimit || 1)) * 100)}%` }}
                    />
                  </View>
                </View>

                <View>
                  <View className="flex justify-between text-xs mb-2">
                    <Text className="text-gray-500">本月消耗 (限制: {stats?.monthlyLimit})</Text>
                    <Text className="font-bold text-gray-800">{stats?.monthlyUsed}</Text>
                  </View>
                  <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <View 
                      className="h-full bg-purple-500 rounded-full" 
                      style={{ width: `${Math.min(100, ((stats?.monthlyUsed || 0) / (stats?.monthlyLimit || 1)) * 100)}%` }}
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Tips Card */}
            <View className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-6 text-white shadow-xl">
              <Text className="block text-lg font-bold mb-2">💡 升级建议</Text>
              <Text className="block text-sm text-gray-400 leading-6 mb-6">
                您的月度额度消耗已达 {(stats?.monthlyUsed || 0) / (stats?.monthlyLimit || 1) * 100}%。
                建议升级至企业版以获得无限额度和更快的 DeepSeek 生成速度。
              </Text>
              <View className="bg-white/10 rounded-2xl p-4 flex justify-between items-center">
                <Text className="text-sm">当前计划: {stats?.plan.toUpperCase()}</Text>
                <Text className="text-xs text-green-400 font-bold">了解详情 →</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}