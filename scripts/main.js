// 主应用程序类
class KnowledgeCardApp {
    constructor() {
        this.currentQuestion = '';
        this.currentCard = null;
        this.isGenerating = false;
        
        this.initializeElements();
        this.bindEvents();
    }
    
    // 初始化DOM元素引用
    initializeElements() {
        this.questionForm = document.getElementById('questionForm');
        this.questionInput = document.getElementById('questionInput');
        this.generateBtn = document.getElementById('generateBtn');
        this.btnText = this.generateBtn.querySelector('.btn-text');
        this.btnLoading = this.generateBtn.querySelector('.btn-loading');
        
        this.welcomeContent = document.getElementById('welcomeContent');
        this.loadingContent = document.getElementById('loadingContent');
        this.cardContent = document.getElementById('cardContent');
        this.knowledgeCard = document.getElementById('knowledgeCard');
        
        this.topicButtons = document.querySelectorAll('.topic-btn');
        this.regenerateBtn = document.getElementById('regenerateBtn');
        this.downloadPngBtn = document.getElementById('downloadPngBtn');
        this.downloadHtmlBtn = document.getElementById('downloadHtmlBtn');
        this.shareBtn = document.getElementById('shareBtn');
    }
    
    // 绑定事件监听器
    bindEvents() {
        // 表单提交事件
        this.questionForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleQuestionSubmit();
        });
        
        // 预设主题按钮事件
        this.topicButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const topic = btn.getAttribute('data-topic');
                this.questionInput.value = topic;
                this.handleQuestionSubmit();
            });
        });
        
        // 卡片操作按钮事件
        this.regenerateBtn.addEventListener('click', () => {
            this.regenerateCard();
        });
        
        this.downloadPngBtn.addEventListener('click', () => {
            this.downloadAsPng();
        });
        
        this.downloadHtmlBtn.addEventListener('click', () => {
            this.downloadAsHtml();
        });
        
        this.shareBtn.addEventListener('click', () => {
            this.shareCard();
        });
        
        // 输入框字符计数
        this.questionInput.addEventListener('input', () => {
            this.updateCharacterCount();
        });
    }
    
    // 处理问题提交
    async handleQuestionSubmit() {
        const question = this.questionInput.value.trim();
        
        if (!question) {
            this.showMessage('请输入你想了解的问题哦！', 'warning');
            return;
        }
        
        if (this.isGenerating) {
            return;
        }
        
        this.currentQuestion = question;
        await this.generateKnowledgeCard(question);
    }
    
    // 生成知识卡片
    async generateKnowledgeCard(question) {
        try {
            this.setGeneratingState(true);
            this.showLoadingState();
            
            // 调用后端API
            const response = await fetch('/api/generate-card', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ question: question })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                this.currentCard = data.card;
                this.displayKnowledgeCard(data.card);
            } else {
                throw new Error(data.error || '生成失败');
            }
            
        } catch (error) {
            console.error('生成知识卡片失败:', error);

            // 根据错误类型显示不同的消息
            let errorMessage = '抱歉，AI老师暂时有点忙，请稍后再试！';

            if (error.message.includes('429')) {
                errorMessage = '请求太频繁了，请稍等一分钟再试哦！';
            } else if (error.message.includes('400')) {
                errorMessage = '问题格式不正确，请重新输入！';
            } else if (error.message.includes('500')) {
                errorMessage = 'AI老师遇到了技术问题，请稍后再试！';
            } else if (error.message.includes('网络')) {
                errorMessage = '网络连接有问题，请检查网络后重试！';
            }

            this.showMessage(errorMessage, 'error');
            this.showWelcomeState();
        } finally {
            this.setGeneratingState(false);
        }
    }
    
    // 显示知识卡片
    displayKnowledgeCard(cardData) {
        this.knowledgeCard.innerHTML = this.formatCardContent(cardData);
        this.showCardState();
    }
    
    // 格式化卡片内容
    formatCardContent(cardData) {
        let html = '';

        // 主标题
        if (cardData.title) {
            html += `<h1 class="card-title">${this.highlightKeywords(cardData.title)}</h1>`;
        }

        // 引导语
        if (cardData.introduction) {
            html += `<div class="card-intro">${this.highlightKeywords(cardData.introduction)}</div>`;
        }

        // 知识点
        if (cardData.points && cardData.points.length > 0) {
            html += '<div class="knowledge-points">';
            cardData.points.forEach((point, index) => {
                html += `
                    <div class="knowledge-point">
                        <h3 class="point-title">${this.highlightKeywords(point.title)}</h3>
                        <p class="point-content">${this.highlightKeywords(point.content)}</p>
                    </div>
                `;
            });
            html += '</div>';
        }

        // 总结
        if (cardData.summary) {
            html += `
                <div class="card-summary">
                    <div class="summary-icon">💡</div>
                    <p class="summary-text">${this.highlightKeywords(cardData.summary)}</p>
                </div>
            `;
        }

        return html;
    }

    // 高亮关键词并添加图标
    highlightKeywords(text) {
        if (!text) return '';

        // 定义关键词和对应的图标
        const keywordIcons = {
            '恐龙': '🦕',
            '太阳系': '🪐',
            '行星': '🌍',
            '彩虹': '🌈',
            '科学': '🔬',
            '学习': '📚',
            '知识': '💡',
            '探索': '🔍',
            '发现': '🔎',
            '研究': '🧪',
            '实验': '⚗️',
            '观察': '👀',
            '思考': '🤔',
            '好奇': '❓',
            '智慧': '🧠',
            '成长': '🌱',
            '地球': '🌍',
            '宇宙': '🌌',
            '自然': '🌿',
            '动物': '🐾',
            '植物': '🌱',
            '环境': '🌍',
            '生命': '💫',
            '进化': '🔄',
            '太阳': '☀️',
            '月亮': '🌙',
            '星星': '⭐',
            '水': '💧',
            '火': '🔥',
            '空气': '💨',
            '森林': '🌲',
            '海洋': '🌊',
            '山': '⛰️',
            '花': '🌸',
            '树': '🌳'
        };

        let highlightedText = text;

        // 先处理关键词高亮和图标
        Object.entries(keywordIcons).forEach(([keyword, icon]) => {
            const regex = new RegExp(`(${keyword})`, 'gi');
            highlightedText = highlightedText.replace(regex,
                `<span class="highlight">${icon} $1</span>`);
        });

        // 处理其他重要词汇的高亮（不加图标）
        const otherKeywords = [
            '为什么', '怎么', '什么', '哪里', '什么时候', '多少',
            '重要', '有趣', '神奇', '美丽', '奇妙', '特别'
        ];

        otherKeywords.forEach(keyword => {
            const regex = new RegExp(`(${keyword})`, 'gi');
            highlightedText = highlightedText.replace(regex,
                '<span class="highlight">$1</span>');
        });

        return highlightedText;
    }

    // 为卡片添加装饰性图标
    addDecorativeIcons(content) {
        // 在句子末尾添加合适的表情
        content = content.replace(/([。！？])(\s|$)/g, (match, punctuation, space) => {
            const decorativeEmojis = ['✨', '🌟', '💫', '🎉', '🎊'];
            const randomEmoji = decorativeEmojis[Math.floor(Math.random() * decorativeEmojis.length)];
            return punctuation + ' ' + randomEmoji + space;
        });

        return content;
    }
    
    // 重新生成卡片
    async regenerateCard() {
        if (this.currentQuestion) {
            await this.generateKnowledgeCard(this.currentQuestion);
        }
    }
    
    // 下载为PNG
    async downloadAsPng() {
        try {
            if (!this.knowledgeCard || !this.currentCard) {
                this.showMessage('请先生成知识卡片', 'warning');
                return;
            }

            this.showMessage('正在生成图片，请稍候...', 'info');

            // 创建一个临时的容器用于截图
            const tempContainer = document.createElement('div');
            tempContainer.style.cssText = `
                position: fixed;
                top: -9999px;
                left: -9999px;
                width: 800px;
                background: white;
                padding: 40px;
                font-family: 'Microsoft YaHei', sans-serif;
                border-radius: 20px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            `;

            // 复制卡片内容到临时容器
            tempContainer.innerHTML = `
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #667eea; font-size: 24px; margin-bottom: 10px;">🎓 小朋友知识卡片</h1>
                    <p style="color: #6c757d; font-size: 14px;">AI老师为你制作的专属知识卡片</p>
                </div>
                ${this.knowledgeCard.innerHTML}
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px dashed #e9ecef;">
                    <p style="color: #6c757d; font-size: 12px;">
                        📅 生成时间：${new Date().toLocaleDateString('zh-CN')} |
                        🌐 xiaopenyou-knowledge-cards.vercel.app
                    </p>
                </div>
            `;

            document.body.appendChild(tempContainer);

            // 使用html2canvas生成图片
            const canvas = await html2canvas(tempContainer, {
                backgroundColor: '#ffffff',
                scale: 2, // 提高清晰度
                useCORS: true,
                allowTaint: true,
                width: 800,
                height: tempContainer.scrollHeight + 80
            });

            // 移除临时容器
            document.body.removeChild(tempContainer);

            // 创建下载链接
            const link = document.createElement('a');
            link.download = `知识卡片-${this.currentQuestion.substring(0, 10)}-${new Date().getTime()}.png`;
            link.href = canvas.toDataURL('image/png');

            // 触发下载
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            this.showMessage('图片下载成功！', 'success');

        } catch (error) {
            console.error('下载PNG失败:', error);
            this.showMessage('图片生成失败，请稍后再试', 'error');
        }
    }
    
    // 下载为HTML
    downloadAsHtml() {
        try {
            const htmlContent = this.generateHtmlFile();
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `知识卡片-${this.currentQuestion.substring(0, 10)}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showMessage('HTML文件下载成功！', 'success');
        } catch (error) {
            console.error('下载HTML失败:', error);
            this.showMessage('下载失败，请稍后再试', 'error');
        }
    }
    
    // 生成HTML文件内容
    generateHtmlFile() {
        const cardHtml = this.knowledgeCard.innerHTML;
        return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>知识卡片 - ${this.currentQuestion}</title>
    <style>
        body { font-family: 'Microsoft YaHei', sans-serif; padding: 20px; background: #f5f5f5; }
        .knowledge-card { background: white; padding: 30px; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        .card-title { color: #333; margin-bottom: 20px; }
        .card-intro { color: #666; margin-bottom: 25px; font-size: 16px; }
        .knowledge-point { margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 10px; }
        .point-title { color: #495057; margin-bottom: 10px; }
        .point-content { color: #6c757d; line-height: 1.6; }
        .card-summary { background: #e3f2fd; padding: 20px; border-radius: 10px; margin-top: 25px; text-align: center; }
        .summary-icon { font-size: 24px; margin-bottom: 10px; }
        .summary-text { color: #1976d2; font-weight: 600; }
    </style>
</head>
<body>
    <div class="knowledge-card">
        ${cardHtml}
    </div>
</body>
</html>`;
    }
    
    // 分享卡片
    shareCard() {
        try {
            if (!this.currentCard) {
                this.showMessage('请先生成知识卡片', 'warning');
                return;
            }

            // 创建分享文本
            const shareText = `🎓 我在"小朋友知识卡片"上学到了关于"${this.currentQuestion}"的知识！

${this.currentCard.title}

${this.currentCard.summary}

快来一起学习吧：${window.location.origin}`;

            // 检查是否支持Web Share API（主要是移动端）
            if (navigator.share) {
                navigator.share({
                    title: '小朋友知识卡片',
                    text: shareText,
                    url: window.location.origin
                }).then(() => {
                    this.showMessage('分享成功！', 'success');
                }).catch((error) => {
                    if (error.name !== 'AbortError') {
                        console.error('分享失败:', error);
                        this.fallbackShare(shareText);
                    }
                });
            } else {
                // 降级到复制链接
                this.fallbackShare(shareText);
            }
        } catch (error) {
            console.error('分享失败:', error);
            this.showMessage('分享失败，请稍后再试', 'error');
        }
    }

    // 降级分享方案
    fallbackShare(shareText) {
        try {
            // 尝试复制分享文本到剪贴板
            navigator.clipboard.writeText(shareText).then(() => {
                this.showMessage('分享内容已复制到剪贴板！', 'success');
            }).catch(() => {
                // 最终降级方案
                const textArea = document.createElement('textarea');
                textArea.value = shareText;
                textArea.style.position = 'fixed';
                textArea.style.opacity = '0';
                document.body.appendChild(textArea);
                textArea.select();

                try {
                    document.execCommand('copy');
                    this.showMessage('分享内容已复制到剪贴板！', 'success');
                } catch (err) {
                    this.showMessage('请手动复制链接分享：' + window.location.origin, 'info');
                }

                document.body.removeChild(textArea);
            });
        } catch (error) {
            console.error('降级分享失败:', error);
            this.showMessage('请手动复制链接分享：' + window.location.origin, 'info');
        }
    }
    
    // 设置生成状态
    setGeneratingState(isGenerating) {
        this.isGenerating = isGenerating;
        this.generateBtn.disabled = isGenerating;
        
        if (isGenerating) {
            this.btnText.style.display = 'none';
            this.btnLoading.style.display = 'inline';
        } else {
            this.btnText.style.display = 'inline';
            this.btnLoading.style.display = 'none';
        }
    }
    
    // 显示欢迎状态
    showWelcomeState() {
        this.welcomeContent.style.display = 'flex';
        this.loadingContent.style.display = 'none';
        this.cardContent.style.display = 'none';
    }
    
    // 显示加载状态
    showLoadingState() {
        this.welcomeContent.style.display = 'none';
        this.loadingContent.style.display = 'flex';
        this.cardContent.style.display = 'none';
    }
    
    // 显示卡片状态
    showCardState() {
        this.welcomeContent.style.display = 'none';
        this.loadingContent.style.display = 'none';
        this.cardContent.style.display = 'block';
    }
    
    // 显示消息提示
    showMessage(message, type = 'info') {
        // 简单的消息提示实现
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        // 根据类型设置背景色
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        messageDiv.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(messageDiv);
        
        // 3秒后自动移除
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }
    
    // 更新字符计数
    updateCharacterCount() {
        const length = this.questionInput.value.length;
        const maxLength = this.questionInput.getAttribute('maxlength');
        
        // 可以在这里添加字符计数显示
        if (length > maxLength * 0.9) {
            this.questionInput.style.borderColor = '#ffc107';
        } else {
            this.questionInput.style.borderColor = '#e9ecef';
        }
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new KnowledgeCardApp();
});

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .message {
        animation: slideIn 0.3s ease;
    }
`;
document.head.appendChild(style);
