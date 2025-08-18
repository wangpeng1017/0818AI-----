# 部署指南 🚀

本文档详细说明了如何将"小朋友知识卡片"项目部署到Vercel平台。

## 📋 部署前准备

### 1. 环境要求
- Node.js 18+ 
- Git
- Vercel账号
- GLM-4.5V API密钥

### 2. 获取API密钥
1. 访问 [智谱AI开放平台](https://open.bigmodel.cn/)
2. 注册并登录账号
3. 创建API密钥
4. 记录API密钥：`c86f3e09702947fcb3b1d65b5c4d349a.KIQaMpAZlWdKrzsg`

## 🚀 Vercel部署步骤

### 方法一：通过Vercel CLI部署

1. **安装Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **登录Vercel**
   ```bash
   vercel login
   ```

3. **初始化项目**
   ```bash
   cd xiaopenyou-knowledge-cards
   vercel
   ```

4. **配置环境变量**
   ```bash
   vercel env add GLM_API_KEY
   # 输入API密钥：c86f3e09702947fcb3b1d65b5c4d349a.KIQaMpAZlWdKrzsg
   ```

5. **部署到生产环境**
   ```bash
   vercel --prod
   ```

### 方法二：通过GitHub集成部署

1. **推送代码到GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **在Vercel中导入项目**
   - 访问 [Vercel Dashboard](https://vercel.com/dashboard)
   - 点击 "New Project"
   - 选择GitHub仓库
   - 导入项目

3. **配置环境变量**
   - 在项目设置中添加环境变量
   - 变量名：`GLM_API_KEY`
   - 变量值：`c86f3e09702947fcb3b1d65b5c4d349a.KIQaMpAZlWdKrzsg`

4. **部署**
   - Vercel会自动部署
   - 每次推送到main分支都会触发自动部署

## 🌐 域名配置

### 使用Vercel默认域名
- 部署完成后，Vercel会提供一个默认域名
- 格式：`https://xiaopenyou-knowledge-cards.vercel.app`

### 配置自定义域名（可选）
1. **购买域名**
   - 推荐使用已备案的域名（国内访问更稳定）

2. **在Vercel中添加域名**
   ```bash
   vercel domains add yourdomain.com
   ```

3. **配置DNS**
   - 添加CNAME记录指向Vercel
   - 或按照Vercel提供的DNS配置说明操作

## 🔧 部署配置文件

### vercel.json 配置说明
```json
{
  "version": 2,
  "name": "xiaopenyou-knowledge-cards",
  "builds": [
    {
      "src": "api/**/*.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "functions": {
    "api/generate-card.js": {
      "maxDuration": 30
    }
  }
}
```

### 环境变量配置
```bash
# 生产环境
GLM_API_KEY=c86f3e09702947fcb3b1d65b5c4d349a.KIQaMpAZlWdKrzsg

# 可选配置
NODE_ENV=production
```

## 🧪 部署后测试

### 1. 功能测试
- [ ] 页面正常加载
- [ ] 问题输入和提交
- [ ] AI内容生成
- [ ] 卡片显示
- [ ] 下载功能
- [ ] 分享功能
- [ ] 响应式设计

### 2. 性能测试
- [ ] 首屏加载时间 < 3秒
- [ ] API响应时间 < 10秒
- [ ] 移动端适配正常

### 3. SEO测试
- [ ] 页面标题正确
- [ ] Meta描述完整
- [ ] 结构化数据有效
- [ ] robots.txt可访问
- [ ] sitemap.xml可访问

## 📊 监控和维护

### 1. Vercel Analytics
- 在Vercel Dashboard中启用Analytics
- 监控页面访问量和性能

### 2. 错误监控
- 查看Vercel Functions日志
- 监控API调用失败率

### 3. 成本控制
- 监控API调用次数
- 设置使用量警报

## 🔒 安全注意事项

### 1. API密钥安全
- ✅ API密钥存储在环境变量中
- ✅ 不在前端代码中暴露
- ✅ 使用后端中间层调用

### 2. 速率限制
- ✅ 实现IP级别的速率限制
- ✅ 防止API滥用
- ✅ 错误处理完善

### 3. 内容安全
- ✅ 输入内容过滤
- ✅ 儿童友好内容检查
- ✅ 防止恶意输入

## 🚨 故障排除

### 常见问题

1. **API调用失败**
   - 检查环境变量是否正确设置
   - 验证API密钥是否有效
   - 查看Vercel Functions日志

2. **页面加载缓慢**
   - 检查网络连接
   - 优化静态资源
   - 使用CDN加速

3. **移动端显示异常**
   - 检查CSS媒体查询
   - 测试不同设备和浏览器
   - 验证响应式设计

### 日志查看
```bash
# 查看部署日志
vercel logs

# 查看函数日志
vercel logs --follow
```

## 📈 性能优化建议

1. **静态资源优化**
   - 压缩CSS和JavaScript
   - 优化图片大小
   - 启用Gzip压缩

2. **API优化**
   - 实现请求缓存
   - 优化提示词长度
   - 使用更快的模型版本

3. **用户体验优化**
   - 添加加载动画
   - 优化错误提示
   - 改进交互反馈

---

**部署成功后，记得在中国大陆网络环境下进行测试！** 🇨🇳
