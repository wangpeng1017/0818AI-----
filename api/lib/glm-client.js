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
const CHILD_FRIENDLY_PROMPT = `你是一位既温柔又博学的AI科学老师，专门为5-10岁的小朋友解答问题。请根据孩子的问题，生成一张既有趣又有深度的科学知识卡片。

核心要求：
1. 🔬 科学准确性：确保所有信息都是科学正确的，不能为了简化而歪曲事实
2. 🧠 内容深度：每个知识点要包含【基本概念 + 科学原理 + 生活例证】三个层次
3. 🗣️ 儿童语言：用5-10岁孩子能理解的词汇，避免专业术语，多用比喻和类比
4. 🎨 生动表达：使用emoji、比喻、拟人等手法，让抽象概念变得具体可感
5. 🌟 逻辑清晰：先说"是什么"，再说"为什么"，最后说"怎么样"
6. 🛡️ 内容安全：避免恐怖、暴力内容，用积极正面的方式解释自然现象

内容结构要求：
- 引导语：40字左右，激发好奇心
- 每个知识点：80-120字，包含完整的科学解释
- 总结：30字左右，鼓励继续探索

写作技巧：
✅ 用比喻：把复杂概念比作孩子熟悉的事物
✅ 举例子：用生活中的具体例子说明抽象原理
✅ 讲故事：用拟人化的方式描述自然现象
✅ 问问题：引导孩子思考，增加互动性

请严格按照以下JSON格式返回，不要添加任何其他文字：
{
  "title": "🌟 有趣且准确的标题（必须包含emoji，控制在15字以内）",
  "introduction": "小朋友，这是一个很棒的问题！让我们一起来探索其中的科学奥秘吧！（用亲切的语气介绍，控制在40字以内）",
  "points": [
    {
      "title": "📚 基础认知（包含emoji，控制在12字以内）",
      "content": "先解释基本概念，然后说明科学原理，最后举一个生活中的具体例子。要确保科学准确，用孩子能理解的语言。（80-120字）"
    },
    {
      "title": "🔍 深入探索（包含emoji，控制在12字以内）",
      "content": "进一步解释背后的科学机制，用比喻或类比的方式让孩子理解复杂的原理，并联系到他们的日常经验。（80-120字）"
    },
    {
      "title": "🎯 实际应用（包含emoji，控制在12字以内）",
      "content": "说明这个知识在现实生活中的应用或意义，让孩子明白学习这个知识的价值，激发进一步探索的兴趣。（80-120字）"
    }
  ],
  "summary": "💡 科学让我们更好地理解世界，保持好奇心，你会发现更多有趣的秘密！（控制在30字以内）"
}

孩子的问题是：{question}

请生成既有深度又适合儿童的科学知识卡片：`;

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
     * 验证和清理卡片数据（优化版本，确保内容质量）
     * @param {Object} card - 原始卡片数据
     * @returns {Object} 清理后的卡片数据
     */
    validateAndCleanCard(card) {
        // 确保标题包含emoji且长度适中
        let title = this.cleanText(card.title || '🌟 有趣的知识');
        if (!this.hasEmoji(title)) {
            title = '🌟 ' + title;
        }
        title = this.ensureLength(title, 15, '标题');

        // 确保引导语亲切友好且长度适中（40字左右）
        let introduction = this.cleanText(card.introduction || '让我们一起学习新知识吧！');
        if (!introduction.includes('小朋友') && !introduction.includes('让我们') && !introduction.includes('一起')) {
            introduction = '小朋友，' + introduction;
        }
        introduction = this.ensureLength(introduction, 40, '引导语');

        // 处理知识点，确保质量和深度
        const points = (card.points || []).slice(0, 3).map((point, index) => {
            let pointTitle = this.cleanText(point.title || `📚 知识点${index + 1}`);
            if (!this.hasEmoji(pointTitle)) {
                const emojis = ['📚', '🔍', '🎯'];
                pointTitle = emojis[index % emojis.length] + ' ' + pointTitle;
            }
            pointTitle = this.ensureLength(pointTitle, 12, '知识点标题');

            let pointContent = this.cleanText(point.content || '这是一个有趣的知识点。');
            // 确保知识点内容有足够的深度（80-120字）
            pointContent = this.validateContentDepth(pointContent, index);

            return {
                title: pointTitle,
                content: pointContent
            };
        });

        // 确保总结包含鼓励性语言且长度适中
        let summary = this.cleanText(card.summary || '学习让我们变得更聪明！');
        if (!this.hasEmoji(summary)) {
            summary = '💡 ' + summary;
        }
        summary = this.ensureLength(summary, 30, '总结');

        return {
            title,
            introduction,
            points,
            summary
        };
    }

    /**
     * 确保文本长度适中
     * @param {string} text - 原始文本
     * @param {number} maxLength - 最大长度
     * @param {string} type - 文本类型
     * @returns {string} 处理后的文本
     */
    ensureLength(text, maxLength, type) {
        if (text.length > maxLength) {
            console.log(`[GLM] ${type}过长，进行截取: ${text.length} -> ${maxLength}`);
            return text.substring(0, maxLength - 3) + '...';
        }
        return text;
    }

    /**
     * 验证内容深度，确保知识点有足够的信息量
     * @param {string} content - 知识点内容
     * @param {number} index - 知识点索引
     * @returns {string} 验证后的内容
     */
    validateContentDepth(content, index) {
        // 检查内容长度，如果太短则补充
        if (content.length < 60) {
            console.log(`[GLM] 知识点${index + 1}内容过短，使用补充内容`);
            const supplements = [
                '这个现象背后有着有趣的科学原理。科学家们通过长期观察和研究，发现了其中的奥秘。',
                '在我们的日常生活中，可以观察到很多类似的例子。这些现象都遵循着相同的科学规律。',
                '这个知识不仅有趣，还很实用。了解了这个原理，我们就能更好地理解周围的世界。'
            ];
            content += supplements[index % supplements.length];
        }

        // 确保内容不超过120字
        if (content.length > 120) {
            content = content.substring(0, 117) + '...';
        }

        return content;
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
     * 文本内容解析（降级方案，确保内容深度）
     * @param {string} content - 文本内容
     * @returns {Object} 卡片数据
     */
    parseTextContent(content) {
        const lines = content.split('\n').filter(line => line.trim());

        return {
            title: '🌟 ' + (lines[0] || '有趣的知识'),
            introduction: '小朋友，让我来为你解答这个问题！虽然内容可能不够完整，但我们一起来学习吧！',
            points: [
                {
                    title: '📚 基础认知',
                    content: this.expandContent(lines.slice(1, 3).join(' ') || '这是一个很有趣的话题。', '基础')
                },
                {
                    title: '🔍 深入探索',
                    content: this.expandContent(lines.slice(3, 5).join(' ') || '让我们更深入地了解一下。', '探索')
                },
                {
                    title: '🎯 实际应用',
                    content: this.expandContent(lines.slice(-2).join(' ') || '这些知识很有用。', '应用')
                }
            ],
            summary: '💡 学习新知识让我们变得更聪明，保持好奇心很重要！'
        };
    }

    /**
     * 扩展内容，确保达到最低质量标准
     * @param {string} originalContent - 原始内容
     * @param {string} type - 内容类型
     * @returns {string} 扩展后的内容
     */
    expandContent(originalContent, type) {
        const expansions = {
            '基础': '这个概念很重要，它帮助我们理解世界的运作方式。科学家们通过仔细观察和研究，发现了其中的规律。',
            '探索': '深入了解这个现象，我们会发现更多有趣的细节。就像拼图一样，每个小知识都是完整图画的一部分。',
            '应用': '这些知识在我们的生活中很有用。了解了原理，我们就能更好地解释身边发生的事情。'
        };

        let content = originalContent;
        if (content.length < 80) {
            content += expansions[type] || '这是一个值得深入思考的有趣话题。';
        }

        return content.length > 120 ? content.substring(0, 117) + '...' : content;
    }

    /**
     * 创建高质量降级卡片（最后的备选方案）
     * @param {string} content - 原始内容
     * @returns {Object} 降级卡片数据
     */
    createFallbackCard(content) {
        return {
            title: '🌟 知识探索小课堂',
            introduction: '小朋友，虽然AI老师遇到了技术问题，但学习的热情不能停！让我们一起探索知识的奥秘吧！',
            points: [
                {
                    title: '📚 学习方法',
                    content: '遇到不懂的问题时，可以问老师、家长或查阅书籍。每个问题都是学习的好机会，通过多种方式寻找答案，我们会学到更多知识。记住，没有愚蠢的问题，只有不问问题的遗憾！'
                },
                {
                    title: '🔍 探索精神',
                    content: '保持好奇心是学习最重要的品质。世界上有无数有趣的现象等待我们去发现。就像科学家一样，我们要勇敢地提出问题，仔细观察周围的事物，用心思考其中的原理。'
                },
                {
                    title: '🎯 持续成长',
                    content: '每天学一点新知识，就像小树苗每天长高一点点。知识会让我们的大脑变得更聪明，帮助我们更好地理解这个美妙的世界。学习是一场永不结束的冒险！'
                }
            ],
            summary: '💡 虽然这次遇到了小问题，但学习的脚步永远不会停止！保持好奇心，继续探索吧！'
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
