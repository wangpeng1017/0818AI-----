# 开发指南 📖

本文档详细说明了"小朋友知识卡片"项目的开发流程、代码规范和最佳实践。

## 🎯 开发目标

根据PRD文档，本项目的核心目标是：
- **快速上线**: 最短时间内完成MVP功能
- **极致简约**: 界面设计追求简洁易用
- **儿童友好**: 内容和交互适合5-10岁儿童
- **跨平台**: 支持PC和移动端访问

## 🏗️ 架构设计原则

### 1. 前后端分离
- 前端：纯静态HTML/CSS/JS
- 后端：Vercel Serverless Functions
- API：RESTful接口设计

### 2. 安全优先
- API Key绝不暴露在前端
- 后端中间层保护敏感信息
- 实施速率限制防止滥用

### 3. 性能优化
- 最小化资源文件
- 优化加载速度
- 响应式设计

## 📝 代码规范

### HTML规范
```html
<!-- 使用语义化标签 -->
<header class="header">
    <h1>页面标题</h1>
</header>

<!-- 完整的SEO标签 -->
<meta name="description" content="页面描述">
<meta name="keywords" content="关键词1,关键词2">

<!-- 无障碍访问 -->
<img src="image.jpg" alt="图片描述">
<button aria-label="按钮功能描述">
```

### CSS规范
```css
/* BEM命名规范 */
.knowledge-card {}
.knowledge-card__title {}
.knowledge-card__content {}
.knowledge-card--featured {}

/* 响应式设计 */
@media (max-width: 768px) {
    .container {
        flex-direction: column;
    }
}

/* CSS变量使用 */
:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
}
```

### JavaScript规范
```javascript
// 使用ES6+语法
class KnowledgeCardApp {
    constructor() {
        this.initializeElements();
        this.bindEvents();
    }
    
    // 使用async/await处理异步操作
    async generateCard(question) {
        try {
            const response = await fetch('/api/generate-card', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question })
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('生成失败:', error);
            throw error;
        }
    }
}

// 错误处理
function handleError(error, userMessage) {
    console.error('详细错误:', error);
    showUserMessage(userMessage);
}
```

## 🔧 开发流程

### 1. 环境准备
```bash
# 安装Node.js (18+)
node --version

# 安装Vercel CLI
npm install -g vercel

# 克隆项目
git clone <repository>
cd xiaopenyou-knowledge-cards

# 安装依赖
npm install
```

### 2. 本地开发
```bash
# 启动开发服务器
npm run dev

# 访问应用
open http://localhost:3000
```

### 3. 环境变量配置
```bash
# 创建.env.local文件
echo "GLM_API_KEY=your_api_key" > .env.local
echo "GLM_API_URL=https://open.bigmodel.cn/api/paas/v4/chat/completions" >> .env.local
```

### 4. 测试流程
```bash
# 功能测试
- 测试问题输入和提交
- 测试预设主题按钮
- 测试AI内容生成
- 测试下载功能
- 测试分享功能

# 响应式测试
- PC端：1920x1080, 1366x768
- 平板：768x1024
- 手机：375x667, 414x896

# 浏览器兼容性测试
- Chrome (最新版)
- Firefox (最新版)
- Safari (最新版)
- 微信内置浏览器
```

## 🎨 UI/UX设计指南

### 色彩方案
```css
/* 主色调 */
--primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
--background-light: #f8f9fa;
--text-primary: #495057;
--text-secondary: #6c757d;

/* 状态色彩 */
--success-color: #28a745;
--error-color: #dc3545;
--warning-color: #ffc107;
--info-color: #17a2b8;
```

### 字体规范
```css
/* 字体族 */
font-family: 'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', sans-serif;

/* 字体大小 */
--font-size-h1: 24px;
--font-size-h2: 18px;
--font-size-h3: 16px;
--font-size-body: 14px;
--font-size-small: 12px;
```

### 间距规范
```css
/* 间距系统 */
--spacing-xs: 5px;
--spacing-sm: 10px;
--spacing-md: 15px;
--spacing-lg: 20px;
--spacing-xl: 30px;
```

## 🔌 API设计规范

### 请求格式
```javascript
// POST /api/generate-card
{
    "question": "恐龙为什么会灭绝？"
}
```

### 响应格式
```javascript
// 成功响应
{
    "success": true,
    "card": {
        "title": "🦕 恐龙灭绝的秘密",
        "introduction": "小朋友，让我们一起探索恐龙消失的原因吧！",
        "points": [
            {
                "title": "🌍 环境变化",
                "content": "6500万年前，地球环境发生了巨大变化..."
            }
        ],
        "summary": "恐龙虽然消失了，但它们的故事永远激励着我们探索自然的奥秘！"
    }
}

// 错误响应
{
    "success": false,
    "error": "问题不能为空"
}
```

## 🛠️ 调试技巧

### 前端调试
```javascript
// 开发模式日志
if (process.env.NODE_ENV === 'development') {
    console.log('调试信息:', data);
}

// 错误边界处理
window.addEventListener('error', (event) => {
    console.error('全局错误:', event.error);
});
```

### 后端调试
```javascript
// Vercel Functions日志
export default async function handler(req, res) {
    console.log('请求参数:', req.body);
    
    try {
        // 业务逻辑
    } catch (error) {
        console.error('API错误:', error);
        res.status(500).json({ error: error.message });
    }
}
```

## 📊 性能监控

### 关键指标
- **首屏加载时间**: < 2秒
- **API响应时间**: < 5秒
- **页面大小**: < 1MB
- **移动端适配**: 100%

### 优化策略
```javascript
// 图片懒加载
const images = document.querySelectorAll('img[data-src]');
const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            imageObserver.unobserve(img);
        }
    });
});

// 防抖处理
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
```

## 🚀 部署指南

### Vercel部署
```bash
# 首次部署
vercel

# 生产环境部署
vercel --prod

# 环境变量设置
vercel env add GLM_API_KEY
```

### 域名配置
```bash
# 添加自定义域名
vercel domains add yourdomain.com
```

## 📋 检查清单

### 开发完成检查
- [ ] 功能完整性测试
- [ ] 响应式设计验证
- [ ] 浏览器兼容性测试
- [ ] 性能指标达标
- [ ] SEO标签完整
- [ ] 错误处理完善
- [ ] 代码注释充分

### 上线前检查
- [ ] 环境变量配置
- [ ] API Key安全性
- [ ] 域名解析正确
- [ ] HTTPS证书有效
- [ ] 监控告警设置

---

**遵循这些指南，确保项目高质量交付！** ✨
