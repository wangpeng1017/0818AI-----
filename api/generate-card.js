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
            introduction: '小朋友，恐龙是地球历史上最神奇的生物！让我们一起探索这些远古巨兽的科学秘密吧！',
            points: [
                {
                    title: '🌍 远古时代',
                    content: '恐龙生活在中生代，距今约2.3亿到6500万年前。那时地球气候温暖湿润，到处都是茂密的森林。恐龙就像现在的鸟类和哺乳动物一样，是当时地球的主人。想象一下，如果你能穿越时空，会看到巨大的蕨类植物和在其中穿行的各种恐龙！'
                },
                {
                    title: '🦴 多样物种',
                    content: '恐龙有1000多种，大小差别很大。最小的恐龙只有鸡那么大，最大的长颈龙身长可达35米！有些恐龙吃植物，牙齿像磨盘一样平；有些吃肉，牙齿像锯子一样尖。科学家通过研究恐龙化石的牙齿形状，就能知道它们吃什么食物。'
                },
                {
                    title: '🔍 灭绝之谜',
                    content: '6500万年前，一颗直径10公里的小行星撞击地球，引发了巨大的爆炸和火灾。大量尘埃遮住了阳光，植物无法进行光合作用，食物链断裂，恐龙因此灭绝。但是，恐龙并没有完全消失，鸟类就是恐龙的后代！'
                }
            ],
            summary: '💡 恐龙虽然灭绝了，但科学让我们能够重新认识这些远古生物的精彩世界！',
            source: 'mock-data'
        },
        '太阳系': {
            title: '🪐 太阳系的奇妙之旅',
            introduction: '小朋友，太阳系是我们在宇宙中的家！让我们一起探索这个神奇的天体家族吧！',
            points: [
                {
                    title: '☀️ 太阳中心',
                    content: '太阳是一颗巨大的恒星，直径是地球的109倍！它的内部温度高达1500万度，通过核聚变反应不断产生光和热。太阳的引力就像一只无形的大手，牢牢抓住所有行星，让它们围绕自己转动。如果没有太阳，地球就会变成一个冰冷黑暗的星球。'
                },
                {
                    title: '🌍 行星家族',
                    content: '太阳系有八颗行星，按距离太阳远近排列：水星、金星、地球、火星、木星、土星、天王星、海王星。每颗行星都有自己的特点：水星最热，海王星最冷，木星最大，地球最适合生命。它们都在各自的轨道上有规律地运行，就像宇宙中的舞蹈。'
                },
                {
                    title: '🌙 其他成员',
                    content: '除了行星，太阳系还有许多其他成员：月亮是地球的卫星，帮助稳定地球的自转；小行星带位于火星和木星之间，像一条石头项链；彗星来自太阳系边缘，拖着美丽的尾巴划过天空。每个成员都在万有引力的作用下和谐共存。'
                }
            ],
            summary: '💡 太阳系是一个精密的天体机器，每个成员都在引力的指挥下有序运行！',
            source: 'mock-data'
        },
        '彩虹': {
            title: '🌈 彩虹的光学奇迹',
            introduction: '小朋友，彩虹是大自然最美丽的光学现象！让我们一起揭开这个七彩奇迹的科学秘密吧！',
            points: [
                {
                    title: '💧 形成条件',
                    content: '彩虹需要三个条件：阳光、水滴和观察者。当太阳在你背后，前方有雨滴或水雾时，就可能看到彩虹。水滴就像无数个小小的三棱镜，当阳光射入水滴时，会发生折射和反射。这就是为什么彩虹总是出现在雨后有阳光的时候。'
                },
                {
                    title: '🎨 光的分解',
                    content: '白色阳光其实包含了所有颜色的光。当光线进入水滴时，不同颜色的光会以不同角度折射，就像通过三棱镜一样被分开。红光折射角度最小，紫光折射角度最大，所以彩虹总是红色在外圈，紫色在内圈。这个现象叫做光的色散。'
                },
                {
                    title: '🔬 科学应用',
                    content: '科学家利用光的色散原理发明了光谱仪，可以分析星星的成分。医生用彩色光线治疗某些疾病。我们在生活中也能看到类似现象：肥皂泡、CD光盘表面都会显示彩色光芒，原理都是光的干涉和衍射。'
                }
            ],
            summary: '💡 彩虹展示了光学的神奇力量，科学让我们理解自然之美的奥秘！',
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

    // 默认通用模板（高质量版本）
    return {
        title: `🌟 探索"${question}"的奥秘`,
        introduction: '小朋友，这是一个很棒的问题！让我们一起用科学的眼光来探索这个有趣的话题吧！',
        points: [
            {
                title: '📚 基础认知',
                content: '首先，我们来了解这个现象的基本概念和定义。每个科学概念都有它独特的特征和规律。通过观察和思考，我们可以发现其中的奥秘。就像拼图一样，每个小知识都是完整图画的重要组成部分，帮助我们更好地理解世界。'
            },
            {
                title: '🔍 科学原理',
                content: '接下来，让我们深入了解背后的科学原理。科学家们通过长期的观察、实验和研究，发现了许多有趣的规律和机制。这些发现不仅增加了我们的知识，还帮助我们解释生活中遇到的各种现象。科学就像一把神奇的钥匙，为我们打开知识的大门。'
            },
            {
                title: '🎯 实际应用',
                content: '最后，让我们看看这些知识在现实生活中的应用和意义。科学知识不仅有趣，还很实用。它们帮助我们解决问题，改善生活，甚至创造新的发明。了解了这些原理，我们就能更好地观察和理解周围的世界，成为小小的科学家！'
            }
        ],
        summary: '💡 科学让我们更好地理解世界，保持好奇心和探索精神，你会发现更多精彩！',
        source: 'mock-data'
    };
}
