# 小朋友知识卡片 🎓

一款面向儿童的AI驱动在线教育工具，能根据孩子们提出的任何问题，快速生成图文并茂、通俗易懂的知识卡片。

## 🌟 项目特色

- **AI驱动**: 使用GLM-4.5V模型生成儿童友好的内容
- **即时生成**: 快速响应，实时生成知识卡片
- **响应式设计**: 完美适配PC端和移动端
- **简约界面**: 极致简约的用户体验
- **SEO优化**: 针对儿童教育关键词优化

## 🏗️ 技术架构

### 前端技术栈
- **HTML5**: 语义化标签，完整的SEO meta标签
- **CSS3**: 响应式设计，支持PC和移动端
- **原生JavaScript**: 轻量级，无框架依赖
- **Flexbox布局**: 现代化的布局方案

### 后端技术栈
- **Vercel Serverless Functions**: 无服务器架构
- **Node.js**: 运行时环境
- **GLM-4.5V API**: AI内容生成

### 部署方案
- **平台**: Vercel
- **CDN**: 全球加速
- **域名**: 支持自定义域名绑定

## 📁 项目结构

```
xiaopenyou-knowledge-cards/
├── index.html              # 主页面
├── styles/
│   └── main.css            # 主样式文件
├── scripts/
│   └── main.js             # 主JavaScript文件
├── api/
│   └── generate-card.js    # Serverless Function
├── vercel.json             # Vercel配置
├── package.json            # 项目配置
├── .gitignore             # Git忽略文件
├── README.md              # 项目文档
└── prd.md                 # 产品需求文档
```

## 🚀 快速开始

### 本地开发

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd xiaopenyou-knowledge-cards
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   ```

4. **访问应用**
   打开浏览器访问 `http://localhost:3000`

### 环境变量配置

创建 `.env.local` 文件：
```env
GLM_API_KEY=your_glm_api_key_here
GLM_API_URL=https://open.bigmodel.cn/api/paas/v4/chat/completions
```

### 部署到Vercel

**重要更新** ✅：已修复Vercel配置错误，移除了已弃用的`builds`属性

1. **安装Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **登录Vercel**
   ```bash
   vercel login
   ```

3. **部署前检查**
   ```bash
   node scripts/deploy-check.js
   ```

4. **设置环境变量**
   ```bash
   vercel env add GLM_API_KEY
   # 输入API密钥
   ```

5. **部署项目**
   ```bash
   vercel --prod
   ```

6. **快速部署（可选）**
   ```bash
   chmod +x scripts/quick-deploy.sh
   ./scripts/quick-deploy.sh
   ```

## 🎨 功能特性

### 核心功能
- ✅ 问题输入和提交
- ✅ 预设主题快速选择
- ✅ AI知识卡片生成
- ✅ 响应式界面设计
- 🔄 重新生成卡片
- 📷 下载PNG图片
- 📄 下载HTML文件
- 🔗 分享功能

### 界面特性
- **PC端**: 左右两栏布局
- **移动端**: 单栏响应式布局
- **加载状态**: 友好的等待提示
- **错误处理**: 完善的错误反馈

## 🔧 开发指南

### 代码规范
- 使用中文注释
- 遵循语义化HTML
- CSS采用BEM命名规范
- JavaScript使用ES6+语法

### 性能优化
- 图片懒加载
- CSS/JS文件压缩
- CDN加速
- 缓存策略

### SEO优化
- 完整的meta标签
- 语义化HTML结构
- 结构化数据
- 移动端友好

## 🛡️ 安全考虑

- API Key通过环境变量保护
- 后端中间层防止直接暴露
- 速率限制防止滥用
- CORS配置

## 📱 浏览器兼容性

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
- 微信内置浏览器

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证

MIT License

## 📞 联系我们

如有问题或建议，请通过以下方式联系：
- 邮箱: support@xiaopenyou.com
- 微信: xiaopenyou_support

---

**让每个孩子都能享受AI带来的学习乐趣！** 🌈
