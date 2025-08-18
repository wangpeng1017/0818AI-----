// Vercel Serverless Function for generating knowledge cards
// 使用GLM-4.5V API生成儿童友好的知识卡片

// 速率限制存储 (简单内存存储，生产环境建议使用Redis)
const rateLimitStore = new Map();

// 清理过期的速率限制记录
function cleanupRateLimit() {
    const now = Date.now();
    for (const [key, data] of rateLimitStore.entries()) {
        if (now - data.resetTime > 60000) { // 1分钟后清理
            rateLimitStore.delete(key);
        }
    }
}

// 检查速率限制
function checkRateLimit(ip) {
    cleanupRateLimit();

    const now = Date.now();
    const key = `rate_limit_${ip}`;
    const limit = rateLimitStore.get(key);

    if (!limit) {
        rateLimitStore.set(key, {
            count: 1,
            resetTime: now
        });
        return { allowed: true, remaining: 9 };
    }

    // 每分钟最多10次请求
    if (now - limit.resetTime > 60000) {
        rateLimitStore.set(key, {
            count: 1,
            resetTime: now
        });
        return { allowed: true, remaining: 9 };
    }

    if (limit.count >= 10) {
        return { allowed: false, remaining: 0 };
    }

    limit.count++;
    return { allowed: true, remaining: 10 - limit.count };
}

// 获取客户端IP地址
function getClientIP(req) {
    return req.headers['x-forwarded-for'] ||
           req.headers['x-real-ip'] ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           '127.0.0.1';
}

// 验证问题内容
function validateQuestion(question) {
    if (!question || typeof question !== 'string') {
        return { valid: false, error: '问题不能为空' };
    }

    const trimmed = question.trim();
    if (trimmed.length === 0) {
        return { valid: false, error: '问题不能为空' };
    }

    if (trimmed.length > 200) {
        return { valid: false, error: '问题长度不能超过200个字符' };
    }

    // 简单的内容过滤
    const forbiddenWords = ['暴力', '色情', '政治', '赌博'];
    const lowerQuestion = trimmed.toLowerCase();
    for (const word of forbiddenWords) {
        if (lowerQuestion.includes(word)) {
            return { valid: false, error: '问题内容不适合儿童，请重新输入' };
        }
    }

    return { valid: true, question: trimmed };
}

export default async function handler(req, res) {
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400');

    // 处理预检请求
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // 只允许POST请求
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: '只支持POST请求'
        });
    }

    try {
        // 获取客户端IP并检查速率限制
        const clientIP = getClientIP(req);
        const rateLimit = checkRateLimit(clientIP);

        // 设置速率限制响应头
        res.setHeader('X-RateLimit-Limit', '10');
        res.setHeader('X-RateLimit-Remaining', rateLimit.remaining.toString());
        res.setHeader('X-RateLimit-Reset', new Date(Date.now() + 60000).toISOString());

        if (!rateLimit.allowed) {
            return res.status(429).json({
                success: false,
                error: '请求过于频繁，请稍后再试'
            });
        }

        // 验证请求体
        if (!req.body) {
            return res.status(400).json({
                success: false,
                error: '请求体不能为空'
            });
        }

        const { question } = req.body;

        // 验证问题内容
        const validation = validateQuestion(question);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                error: validation.error
            });
        }

        console.log(`[${new Date().toISOString()}] 收到问题请求: "${validation.question}" from IP: ${clientIP}`);

        let cardData;

        // 尝试使用GLM API生成知识卡片
        try {
            const { getGLMClient } = await import('./lib/glm-client.js');
            const glmClient = getGLMClient();
            cardData = await glmClient.generateKnowledgeCard(validation.question);
            console.log(`[${new Date().toISOString()}] GLM API生成成功 for: "${validation.question}"`);
        } catch (glmError) {
            console.warn(`[${new Date().toISOString()}] GLM API失败，使用降级方案:`, glmError.message);
            // 降级到模拟数据
            cardData = generateMockCard(validation.question);
        }

        console.log(`[${new Date().toISOString()}] 成功生成知识卡片 for: "${validation.question}"`);

        res.status(200).json({
            success: true,
            card: cardData,
            metadata: {
                timestamp: new Date().toISOString(),
                question: validation.question,
                source: cardData.source || 'glm-api'
            }
        });

    } catch (error) {
        console.error(`[${new Date().toISOString()}] 生成知识卡片错误:`, error);
        res.status(500).json({
            success: false,
            error: '服务器内部错误，请稍后再试'
        });
    }
}

// 生成模拟知识卡片数据
function generateMockCard(question) {
    const templates = {
        '恐龙': {
            title: '🦕 恐龙的神秘世界',
            introduction: '小朋友，恐龙是地球上曾经生活过的神奇生物！让我们一起探索它们的秘密吧！',
            points: [
                {
                    title: '🌍 恐龙的时代',
                    content: '恐龙生活在很久很久以前，大约2.3亿年前到6500万年前。那时候地球的样子和现在很不一样呢！'
                },
                {
                    title: '🦴 恐龙的种类',
                    content: '恐龙有很多种类，有吃植物的温和恐龙，也有吃肉的凶猛恐龙。最大的恐龙比现在的大象还要大很多倍！'
                },
                {
                    title: '🔍 恐龙的消失',
                    content: '科学家认为，可能是因为一颗巨大的陨石撞击地球，改变了环境，恐龙就慢慢消失了。'
                }
            ],
            summary: '虽然恐龙消失了，但通过化石，我们仍然可以了解这些神奇的生物！',
            source: 'mock-data'
        },
        '太阳系': {
            title: '🪐 太阳系的奇妙之旅',
            introduction: '小朋友，太阳系是我们地球的家！让我们一起去看看太阳系里都有什么吧！',
            points: [
                {
                    title: '☀️ 太阳 - 我们的恒星',
                    content: '太阳是太阳系的中心，它非常非常大，能发出光和热。没有太阳，地球上就不会有生命！'
                },
                {
                    title: '🌍 八大行星',
                    content: '太阳系有八颗行星：水星、金星、地球、火星、木星、土星、天王星、海王星。地球是我们的家！'
                },
                {
                    title: '🌙 月亮和其他',
                    content: '除了行星，太阳系还有很多月亮、小行星和彗星。月亮是地球的好朋友，每天晚上陪伴着我们！'
                }
            ],
            summary: '太阳系就像一个大家庭，每个成员都有自己的特点和作用！',
            source: 'mock-data'
        },
        '彩虹': {
            title: '🌈 彩虹的美丽秘密',
            introduction: '小朋友，你见过雨后的彩虹吗？让我们一起了解彩虹是怎么形成的吧！',
            points: [
                {
                    title: '💧 阳光和水滴',
                    content: '彩虹需要两个好朋友：阳光和小水滴。当阳光照射到空气中的小水滴时，就可能出现彩虹！'
                },
                {
                    title: '🎨 七种颜色',
                    content: '彩虹有七种美丽的颜色：红、橙、黄、绿、蓝、靛、紫。这些颜色按顺序排列，非常漂亮！'
                },
                {
                    title: '🔬 光的分解',
                    content: '其实白色的阳光里包含了所有颜色！当光线通过水滴时，就像通过三棱镜一样，把颜色分开了。'
                }
            ],
            summary: '彩虹是大自然送给我们的美丽礼物，提醒我们世界充满了奇妙的科学！',
            source: 'mock-data'
        }
    };

    // 根据问题关键词选择模板
    const lowerQuestion = question.toLowerCase();
    for (const [keyword, template] of Object.entries(templates)) {
        if (lowerQuestion.includes(keyword)) {
            return template;
        }
    }

    // 默认通用模板
    return {
        title: `🌟 关于"${question}"的知识`,
        introduction: '小朋友，这是一个很棒的问题！让我来为你解答吧！',
        points: [
            {
                title: '📚 基础认识',
                content: '首先，我们来了解一下这个问题的基本概念。每个新知识都有它有趣的地方！'
            },
            {
                title: '🔍 深入探索',
                content: '接下来，让我们更深入地了解这个话题。科学家们通过研究发现了很多有趣的事实！'
            },
            {
                title: '🎯 生活应用',
                content: '这些知识在我们的日常生活中也有很多应用，让我们的生活变得更美好！'
            }
        ],
        summary: '学习新知识让我们变得更聪明，保持好奇心是最重要的！',
        source: 'mock-data'
    };
}
