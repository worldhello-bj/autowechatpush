# Performance Testing Guide

## 性能测试指南 (Performance Testing Guide)

本指南介绍如何对后端服务器进行性能测试和基准测试。

This guide explains how to perform performance testing and benchmarking for the backend server.

## 前置要求 (Prerequisites)

```bash
# 安装性能测试工具
npm install -g autocannon clinic
```

## 基准测试 (Benchmarking)

### 1. 健康检查端点 (Health Check Endpoint)

```bash
# 基础测试 - 100并发，持续30秒
autocannon -c 100 -d 30 http://localhost:3001/api/v1/health

# 高并发测试 - 500并发，持续60秒
autocannon -c 500 -d 60 http://localhost:3001/api/v1/health

# 预期结果:
# - Requests/sec: > 5000
# - Latency p50: < 10ms
# - Latency p99: < 50ms
```

### 2. 认证端点 (Authentication Endpoint)

```bash
# 登录测试
autocannon -c 50 -d 30 \
  -m POST \
  -H "Content-Type: application/json" \
  -b '{"usernameOrEmail":"test","password":"123456"}' \
  http://localhost:3001/api/v1/auth/token

# 预期结果:
# - Requests/sec: > 500
# - Latency p99: < 200ms
```

### 3. 压缩效果测试 (Compression Test)

```bash
# 测试无压缩
curl -H "x-no-compression: 1" http://localhost:3001/api/v1/health -w "\nSize: %{size_download} bytes\n"

# 测试有压缩
curl -H "Accept-Encoding: gzip" http://localhost:3001/api/v1/health --compressed -w "\nSize: %{size_download} bytes\n"

# 预期: 压缩后大小减少 70-80%
```

## 性能分析 (Performance Profiling)

### 使用 Clinic.js

```bash
# 1. CPU 分析
clinic doctor -- node dist/index.js

# 运行一些请求后按 Ctrl+C 停止
# 会生成 HTML 报告

# 2. 事件循环延迟分析
clinic bubbleprof -- node dist/index.js

# 3. 堆分析
clinic heapprofiler -- node dist/index.js
```

### 使用 Node.js Inspector

```bash
# 启动服务器并开启 inspector
node --inspect dist/index.js

# 在 Chrome 浏览器访问:
# chrome://inspect

# 使用 DevTools 进行:
# - CPU Profiling
# - Memory Profiling
# - Network Analysis
```

## 内存泄漏检测 (Memory Leak Detection)

### 长时间运行测试

```bash
# 启动服务器
npm run dev &

# 运行长时间负载测试 (12小时)
autocannon -c 100 -d 43200 http://localhost:3001/api/v1/health

# 监控内存使用
watch -n 5 'ps aux | grep node | grep -v grep'

# 预期: 内存使用应该稳定，不持续增长
```

### 使用 memory-usage 脚本

创建 `scripts/monitor-memory.js`:

```javascript
const http = require('http');

setInterval(() => {
  http.get('http://localhost:3001/api/v1/admin/stats', (res) => {
    const mem = process.memoryUsage();
    console.log({
      timestamp: new Date().toISOString(),
      rss: `${(mem.rss / 1024 / 1024).toFixed(2)} MB`,
      heapUsed: `${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB`,
    });
  });
}, 5000);
```

## 负载测试场景 (Load Testing Scenarios)

### 场景 1: 正常负载

```bash
# 模拟 50 个并发用户，持续 10 分钟
autocannon -c 50 -d 600 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/v1/user/quota
```

### 场景 2: 峰值负载

```bash
# 模拟 200 个并发用户，持续 5 分钟
autocannon -c 200 -d 300 \
  http://localhost:3001/api/v1/health
```

### 场景 3: 压力测试

```bash
# 逐步增加负载直到系统崩溃
for c in 50 100 200 400 800; do
  echo "Testing with $c connections..."
  autocannon -c $c -d 60 http://localhost:3001/api/v1/health
  sleep 10
done
```

## 性能指标目标 (Performance Targets)

### API 响应时间 (API Response Time)

| 端点类型 | P50 | P95 | P99 |
|---------|-----|-----|-----|
| 健康检查 | < 10ms | < 20ms | < 50ms |
| 认证 | < 100ms | < 200ms | < 500ms |
| 用户数据 | < 50ms | < 100ms | < 200ms |
| AI 生成 | < 2000ms | < 5000ms | < 10000ms |

### 吞吐量 (Throughput)

| 端点类型 | 目标 RPS |
|---------|---------|
| 健康检查 | > 5000 |
| 认证 | > 500 |
| 用户数据 | > 1000 |
| AI 生成 | > 50 |

### 资源使用 (Resource Usage)

| 指标 | 目标 |
|------|------|
| 内存 | < 512 MB (单实例) |
| CPU | < 50% (正常负载) |
| 网络 | < 100 Mbps |

## 优化前后对比 (Before/After Comparison)

### 测试方法

```bash
# 1. 在优化前的分支运行测试
git checkout main
npm run build
autocannon -c 100 -d 30 http://localhost:3001/api/v1/health > before.txt

# 2. 在优化后的分支运行测试
git checkout copilot/check-server-performance-issues
npm run build
autocannon -c 100 -d 30 http://localhost:3001/api/v1/health > after.txt

# 3. 比较结果
diff before.txt after.txt
```

### 预期改进 (Expected Improvements)

| 指标 | 优化前 | 优化后 | 改进 |
|------|--------|--------|------|
| 响应时间 P99 | ~200ms | ~100ms | 50% ⬇️ |
| 吞吐量 | ~3000 rps | ~5000 rps | 67% ⬆️ |
| 响应大小 | ~2KB | ~500B | 75% ⬇️ |
| 内存使用 | ~800MB | ~500MB | 37% ⬇️ |

## 监控和告警 (Monitoring & Alerting)

### 推荐工具

1. **Prometheus + Grafana** - 开源监控方案
2. **New Relic** - 商业 APM 方案
3. **DataDog** - 商业监控方案
4. **PM2** - Node.js 进程管理和监控

### 关键指标

- 请求延迟分布
- 吞吐量 (RPS)
- 错误率
- 内存使用
- CPU 使用
- 活跃连接数
- Rate limiting 触发次数

## 常见问题排查 (Troubleshooting)

### 高 CPU 使用

```bash
# 使用 clinic flame 生成火焰图
clinic flame -- node dist/index.js

# 检查是否有 CPU 密集型操作:
# - JSON 序列化/反序列化
# - 加密操作
# - 正则表达式匹配
```

### 高内存使用

```bash
# 生成堆快照
node --inspect dist/index.js
# 在 Chrome DevTools 中生成堆快照

# 检查:
# - 大对象存储
# - 内存泄漏
# - 缓存未清理
```

### 响应时间慢

```bash
# 添加详细日志
export DEBUG=*
npm run dev

# 检查:
# - 数据库查询时间
# - 外部 API 调用时间
# - 文件 I/O 操作
```

## 总结 (Summary)

定期进行性能测试，确保:
1. ✅ 响应时间在可接受范围内
2. ✅ 没有内存泄漏
3. ✅ 系统能处理预期负载
4. ✅ 优化措施有效

建议每次发布前都运行完整的性能测试套件。
