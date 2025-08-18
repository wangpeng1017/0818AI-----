// GLM-4.5V API客户端
// 负责与智谱AI API进行安全通信

/**
 * GLM API配置
 */
const GLM_CONFIG = {
    apiUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    model: 'glm-4-flash', // 使用更快的模型版本
    maxTokens: 2000,
    temperature: 0.7,
    timeout: 30000 // 30秒超时
};

/**
 * 为儿童优化的提示词模板
 */
const CHILD_FRIENDLY_PROMPT = `你是一位温柔耐心的AI老师，专门为5-10岁的小朋友解答问题。请根据孩子的问题，生成一张有趣的知识卡片。

重要要求：
1. 🗣️ 语言：使用简单的词汇，避免专业术语，就像和小朋友面对面聊天一样
2. 📚 内容：科学准确但不复杂，用生活中的例子来解释
3. 😊 语气：亲切友好，充满鼓励，让孩子感到学习很有趣
4. 🎨 表达：多用emoji和比喻，让内容生动有趣
5. 🛡️ 安全：避免任何可能让儿童害怕的内容（如死亡、暴力、灾难等）
6. 🎯 结构：每个知识点控制在50字以内，总体内容适合儿童注意力

请严格按照以下JSON格式返回，不要添加任何其他文字：
{
  "title": "🌟 有趣的标题（必须包含emoji，控制在15字以内）",
  "introduction": "小朋友，让我来为你解答这个有趣的问题吧！（用亲切的语气介绍，控制在40字以内）",
  "points": [
    {
      "title": "📚 知识点1（包含emoji，控制在12字以内）",
      "content": "用简单的话解释，可以举生活中的例子（控制在50字以内）"
    },
    {
      "title": "🔍 知识点2（包含emoji，控制在12字以内）",
      "content": "继续用简单的话解释，让孩子容易理解（控制在50字以内）"
    },
    {
      "title": "🎯 知识点3（包含emoji，控制在12字以内）",
      "content": "总结性的解释，可以联系孩子的日常生活（控制在50字以内）"
    }
  ],
  "summary": "💡 一句话总结，鼓励孩子继续保持好奇心和学习热情（控制在30字以内）"
}

孩子的问题是：{question}

请生成适合儿童的知识卡片内容：`;

/**
 * GLM API客户端类
 */
class GLMClient {
    constructor() {
        this.apiKey = process.env.GLM_API_KEY;
        if (!this.apiKey) {
            throw new Error('GLM_API_KEY环境变量未设置');
        }
    }

    /**
     * 调用GLM API生成知识卡片
     * @param {string} question - 用户问题
     * @returns {Promise<Object>} 知识卡片数据
     */
    async generateKnowledgeCard(question) {
        try {
            console.log(`[GLM] 开始生成知识卡片，问题: "${question}"`);
            
            const prompt = CHILD_FRIENDLY_PROMPT.replace('{question}', question);
            
            const requestBody = {
                model: GLM_CONFIG.model,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: GLM_CONFIG.maxTokens,
                temperature: GLM_CONFIG.temperature,
                stream: false
            };

            console.log('[GLM] 发送API请求...');
            
            const response = await this.makeRequest(requestBody);
            
            if (!response.choices || response.choices.length === 0) {
                throw new Error('API返回数据格式错误：缺少choices');
            }

            const content = response.choices[0].message?.content;
            if (!content) {
                throw new Error('API返回数据格式错误：缺少content');
            }

            console.log('[GLM] 解析API响应...');
            const cardData = this.parseCardContent(content);
            
            console.log('[GLM] 知识卡片生成成功');
            return cardData;

        } catch (error) {
            console.error('[GLM] 生成知识卡片失败:', error);
            throw new Error(`知识卡片生成失败: ${error.message}`);
        }
    }

    /**
     * 发送HTTP请求到GLM API
     * @param {Object} requestBody - 请求体
     * @returns {Promise<Object>} API响应
     */
    async makeRequest(requestBody) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), GLM_CONFIG.timeout);

        try {
            const response = await fetch(GLM_CONFIG.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[GLM] API请求失败: ${response.status} ${response.statusText}`, errorText);
                
                if (response.status === 401) {
                    throw new Error('API密钥无效');
                } else if (response.status === 429) {
                    throw new Error('API请求频率超限，请稍后再试');
                } else if (response.status >= 500) {
                    throw new Error('API服务暂时不可用，请稍后再试');
                } else {
                    throw new Error(`API请求失败: ${response.status}`);
                }
            }

            const data = await response.json();
            return data;

        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error('API请求超时，请稍后再试');
            }
            
            throw error;
        }
    }

    /**
     * 解析API返回的内容为知识卡片格式
     * @param {string} content - API返回的文本内容
     * @returns {Object} 解析后的卡片数据
     */
    parseCardContent(content) {
        try {
            // 尝试直接解析JSON
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const jsonStr = jsonMatch[0];
                const parsed = JSON.parse(jsonStr);
                
                // 验证必要字段
                if (parsed.title && parsed.introduction && parsed.points && parsed.summary) {
                    return this.validateAndCleanCard(parsed);
                }
            }
            
            // 如果JSON解析失败，使用文本解析
            console.log('[GLM] JSON解析失败，使用文本解析');
            return this.parseTextContent(content);
            
        } catch (error) {
            console.error('[GLM] 内容解析错误:', error);
            // 返回降级的卡片内容
            return this.createFallbackCard(content);
        }
    }

    /**
     * 验证和清理卡片数据
     * @param {Object} card - 原始卡片数据
     * @returns {Object} 清理后的卡片数据
     */
    validateAndCleanCard(card) {
        // 确保标题包含emoji
        let title = this.cleanText(card.title || '🌟 有趣的知识');
        if (!this.hasEmoji(title)) {
            title = '🌟 ' + title;
        }

        // 确保引导语亲切友好
        let introduction = this.cleanText(card.introduction || '让我们一起学习新知识吧！');
        if (!introduction.includes('小朋友') && !introduction.includes('让我们')) {
            introduction = '小朋友，' + introduction;
        }

        // 处理知识点，确保每个都有emoji
        const points = (card.points || []).slice(0, 5).map((point, index) => {
            let pointTitle = this.cleanText(point.title || `📚 知识点${index + 1}`);
            if (!this.hasEmoji(pointTitle)) {
                const emojis = ['📚', '🔍', '🎯', '🌟', '💡'];
                pointTitle = emojis[index % emojis.length] + ' ' + pointTitle;
            }

            return {
                title: pointTitle,
                content: this.cleanText(point.content || '这是一个有趣的知识点。')
            };
        });

        // 确保总结包含鼓励性语言
        let summary = this.cleanText(card.summary || '学习让我们变得更聪明！');
        if (!this.hasEmoji(summary)) {
            summary = '💡 ' + summary;
        }

        return {
            title,
            introduction,
            points,
            summary
        };
    }

    /**
     * 检查文本是否包含emoji
     * @param {string} text - 要检查的文本
     * @returns {boolean} 是否包含emoji
     */
    hasEmoji(text) {
        const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
        return emojiRegex.test(text);
    }

    /**
     * 文本内容解析（降级方案）
     * @param {string} content - 文本内容
     * @returns {Object} 卡片数据
     */
    parseTextContent(content) {
        const lines = content.split('\n').filter(line => line.trim());
        
        return {
            title: '🌟 ' + (lines[0] || '有趣的知识'),
            introduction: '小朋友，让我来为你解答这个问题！',
            points: [
                {
                    title: '📚 基础知识',
                    content: lines.slice(1, 3).join(' ') || '这是一个很有趣的话题。'
                },
                {
                    title: '🔍 深入了解',
                    content: lines.slice(3, 5).join(' ') || '让我们更深入地了解一下。'
                },
                {
                    title: '🎯 总结',
                    content: lines.slice(-2).join(' ') || '这些知识很有用。'
                }
            ],
            summary: '学习新知识让我们变得更聪明！'
        };
    }

    /**
     * 创建降级卡片（最后的备选方案）
     * @param {string} content - 原始内容
     * @returns {Object} 降级卡片数据
     */
    createFallbackCard(content) {
        return {
            title: '🌟 知识小课堂',
            introduction: '小朋友，虽然AI老师遇到了一点小问题，但还是为你准备了一些知识！',
            points: [
                {
                    title: '📚 学习提示',
                    content: '遇到不懂的问题时，可以问老师、家长或查阅书籍。'
                },
                {
                    title: '🔍 探索精神',
                    content: '保持好奇心，勇敢地提出问题，这是学习的好方法。'
                },
                {
                    title: '🎯 持续学习',
                    content: '每天学一点新知识，你会变得越来越聪明！'
                }
            ],
            summary: '虽然这次遇到了小问题，但学习的脚步永远不会停止！'
        };
    }

    /**
     * 清理文本内容
     * @param {string} text - 原始文本
     * @returns {string} 清理后的文本
     */
    cleanText(text) {
        if (typeof text !== 'string') return '';
        
        return text
            .trim()
            .replace(/\*\*/g, '') // 移除markdown粗体标记
            .replace(/\*/g, '')   // 移除markdown斜体标记
            .replace(/#{1,6}\s*/g, '') // 移除markdown标题标记
            .substring(0, 500); // 限制长度
    }
}

// 导出单例实例
let glmClientInstance = null;

export function getGLMClient() {
    if (!glmClientInstance) {
        glmClientInstance = new GLMClient();
    }
    return glmClientInstance;
}

export default GLMClient;
