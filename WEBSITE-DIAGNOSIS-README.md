# 网站功能诊断测试 - Playwright 自动化测试

## 📋 概述

这是一个专门为 https://why.aifly.me/ 网站设计的 Playwright 自动化测试脚本，用于全面诊断知识卡片生成和AI图片下载功能的问题。

## 🎯 测试目标

### 主要功能测试
1. **页面加载检查** - 验证网站基本可访问性
2. **知识卡片生成** - 测试 `/api/generate-card` 接口
3. **AI图片下载** - 重点测试 `/api/generate-image` 接口
4. **网络请求监控** - 捕获所有API调用和响应
5. **错误诊断** - 分析失败原因并提供修复建议

### 重点排查问题
- AI图片生成失败，回退到本地截图的问题
- Vercel 函数配置缺失导致的 404/500 错误
- Gemini API 调用失败的具体原因
- 环境变量配置问题

## 🚀 快速开始

### 方法一：使用运行脚本（推荐）

```bash
# 给脚本执行权限
chmod +x run-diagnosis.sh

# 运行完整诊断
./run-diagnosis.sh
```

### 方法二：手动安装和运行

```bash
# 1. 安装依赖
npm install playwright@^1.40.0

# 2. 安装 Chromium 浏览器
npx playwright install chromium

# 3. 运行测试
node test-website-diagnosis.js
```

## 📊 测试报告

### 控制台输出
测试过程中会实时显示：
- 🔍 各个测试阶段的进度
- 📡 网络请求和响应状态
- ❌ 错误和警告信息
- 💡 修复建议

### JSON 报告文件
测试完成后会生成详细的 JSON 报告：
```
website-diagnosis-report-[timestamp].json
```

报告包含：
- 页面加载性能数据
- API 请求/响应详情
- 错误日志和分析
- 功能测试结果
- 修复建议列表

## 🔍 测试流程详解

### 1. 页面加载检查
```javascript
✅ 检查项目：
- 页面是否能正常访问
- 页面标题是否正确
- 关键UI元素是否存在（输入框、按钮等）
- 页面加载时间
```

### 2. 知识卡片生成测试
```javascript
📝 测试步骤：
1. 输入测试问题："彩虹是怎么形成的？"
2. 点击生成按钮
3. 监控 /api/generate-card 请求
4. 验证响应状态和内容
5. 检查卡片是否正确显示
```

### 3. AI图片下载测试
```javascript
🖼️ 测试步骤：
1. 点击"下载为PNG"按钮
2. 监控 /api/generate-image 请求
3. 分析API响应状态
4. 检查是否回退到本地截图
5. 捕获用户提示消息
```

### 4. 网络请求分析
```javascript
📡 监控内容：
- 所有 /api/* 请求的状态码
- 请求/响应时间
- 失败请求的错误详情
- API 调用频次统计
```

## 🐛 常见问题诊断

### 问题1：AI图片生成失败
**症状**：看到"已使用本地截图方式导出图片"提示

**可能原因**：
- ❌ `vercel.json` 缺少 `api/generate-image.js` 配置
- ❌ `GEMINI_API_KEY` 环境变量未设置
- ❌ Gemini API 配额不足或权限问题
- ❌ 函数超时（图片生成需要更长时间）

**修复建议**：
```json
// 在 vercel.json 中添加：
"functions": {
  "api/generate-card.js": { "maxDuration": 30 },
  "api/generate-image.js": { "maxDuration": 60 }  // 新增这行
}
```

### 问题2：API请求404错误
**症状**：`/api/generate-image` 返回 404

**原因**：Vercel 未正确部署该函数

**修复**：检查部署日志，确保所有 API 文件都被正确部署

### 问题3：API请求500错误
**症状**：服务器内部错误

**原因**：通常是环境变量或代码逻辑问题

**修复**：检查 Vercel 函数日志获取详细错误信息

## 📈 测试结果解读

### 成功指标
- ✅ 页面加载时间 < 3秒
- ✅ `/api/generate-card` 返回 200 状态码
- ✅ `/api/generate-image` 返回 200 状态码并包含图片数据
- ✅ 无控制台错误

### 失败指标
- ❌ API 请求返回 4xx/5xx 状态码
- ❌ 控制台出现错误信息
- ❌ 功能回退到本地截图方案

## 🛠️ 自定义配置

### 修改测试参数
```javascript
// 在 test-website-diagnosis.js 中修改：
const testQuestion = '你的测试问题';  // 自定义测试问题
const timeout = 30000;              // 调整超时时间
const headless = false;             // 是否显示浏览器界面
```

### 添加新的测试用例
```javascript
async testCustomFunction() {
  // 添加你的自定义测试逻辑
}
```

## 📞 技术支持

如果测试发现问题或需要帮助解读结果，请：

1. 查看生成的 JSON 报告文件
2. 检查控制台输出的详细日志
3. 根据修复建议进行相应调整
4. 重新运行测试验证修复效果

## 🔄 持续监控

建议定期运行此测试脚本：
- 部署新版本后
- 修改 API 配置后
- 发现功能异常时
- 定期健康检查

---

**注意**：此测试脚本会实际访问网站并执行功能操作，请确保在合适的环境中运行。
