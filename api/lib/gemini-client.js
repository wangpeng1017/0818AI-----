// Gemini API 客户端（文本 + 图片生成）
// 文本与图片分别使用不同模型：文本 models/gemini-2.5-flash，图片 models/gemini-2.5-flash-image-preview

const GEMINI_CONFIG = {
  apiBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  textModel: 'models/gemini-2.5-flash',
  imageModel: 'models/gemini-2.5-flash-image-preview',
  timeout: 30000,
};

/**
 * 儿童友好的知识卡片提示词模板
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

class GeminiClient {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY 环境变量未设置');
    }
  }

  get textEndpoint() {
    return `${GEMINI_CONFIG.apiBaseUrl}/${GEMINI_CONFIG.textModel}:generateContent?key=${this.apiKey}`;
  }

  get imageEndpoint() {
    return `${GEMINI_CONFIG.apiBaseUrl}/${GEMINI_CONFIG.imageModel}:generateContent?key=${this.apiKey}`;
  }

  async generateKnowledgeCard(question) {
    const prompt = CHILD_FRIENDLY_PROMPT.replace('{question}', question);
    const body = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 2048,
      },
    };

    const res = await this._postJson(this.textEndpoint, body);
    const text = this._extractText(res);
    const json = this._safeParseJson(text);
    return this._validateAndCleanCard(json);
  }

  /**
   * 基于知识卡片文本生成多面板涂鸦风格教育海报，返回 { mimeType, base64Data }
   * 生成类似PowerPoint教育卡片的多面板布局，包含边框、标题和图解说明
   */
  async generateImageFromCard(card) {
    const prompt = this._buildImagePromptFromCard(card);
    const body = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      // 指定图像生成功能
      tools: [{ image_generation: {} }],
      generationConfig: {
        temperature: 0.6,
      },
    };

    const res = await this._postJson(this.imageEndpoint, body);
    const imagePart = this._extractFirstImagePart(res);
    if (!imagePart) {
      throw new Error('Gemini 未返回图片数据');
    }
    const mimeType = imagePart.inlineData?.mimeType || imagePart.inline_data?.mime_type || 'image/png';
    const base64Data = imagePart.inlineData?.data || imagePart.inline_data?.data;
    if (!base64Data) {
      throw new Error('未找到图片base64数据');
    }
    return { mimeType, base64Data };
  }

  _buildImagePromptFromCard(card) {
    const pointsText = (card.points || [])
      .map((p, index) => `${index + 1}. ${p.title}: ${p.content}`)
      .join('\n');

    // 提取主题关键词用于生成
    const topic = card.title.replace(/[🌟🎓📚🔬🧠💡⭐🌈🦕🪐]/g, '').trim();

    return (
      `Create an educational doodle-style infographic card about "${topic}" with the following exact specifications:\n\n` +

      `LAYOUT STRUCTURE:\n` +
      `- Design as a single educational poster with multiple bordered sections\n` +
      `- Top section: Large title panel with rounded rectangle border\n` +
      `- Middle section: 2-3 information panels arranged horizontally or in grid\n` +
      `- Each panel should have thick black borders with rounded corners\n` +
      `- Use bright solid background colors (yellow, orange, light blue, light green)\n` +
      `- Leave white space between panels for clarity\n\n` +

      `VISUAL STYLE:\n` +
      `- Hand-drawn doodle style with thick black outlines (3-4px)\n` +
      `- Colorful pencil/marker coloring with slight texture\n` +
      `- Simple cartoon illustrations and icons\n` +
      `- Consistent rounded, friendly shapes\n` +
      `- High contrast colors for readability\n\n` +

      `CONTENT TO INCLUDE:\n` +
      `Title Panel: "${card.title}" in large, bold, hand-lettered style\n` +
      `Introduction Panel: "${card.introduction}" with supporting doodle icons\n` +
      `Key Points Panels: Visualize these concepts with simple diagrams:\n${pointsText}\n` +
      `Summary Panel: "${card.summary}" with concluding visual elements\n\n` +

      `TEXT REQUIREMENTS:\n` +
      `- All text in English with clear, readable hand-lettered font\n` +
      `- Use both Chinese and English for key terms if helpful\n` +
      `- Include labels, arrows, and explanatory text\n` +
      `- Text should be large enough for middle school students (12-16pt equivalent)\n\n` +

      `TECHNICAL SPECS:\n` +
      `- 1024x1024 square format or 16:9 landscape\n` +
      `- Educational poster style similar to classroom materials\n` +
      `- Avoid clutter - maximum 4-5 main visual elements\n` +
      `- Ensure high contrast and readability\n` +
      `- Child-friendly, positive, and engaging design\n`
    );
  }

  _extractText(apiResponse) {
    try {
      const parts = apiResponse?.candidates?.[0]?.content?.parts || [];
      const allText = parts.map((p) => p.text || '').join('\n').trim();
      return allText;
    } catch (e) {
      throw new Error('解析Gemini文本响应失败');
    }
  }

  _extractFirstImagePart(apiResponse) {
    try {
      const parts = apiResponse?.candidates?.[0]?.content?.parts || [];
      return parts.find((p) => p.inlineData?.data || p.inline_data?.data);
    } catch (e) {
      return null;
    }
  }

  _safeParseJson(text) {
    try {
      const cleaned = text
        .replace(/^```(json)?/gi, '')
        .replace(/```$/g, '')
        .trim();
      return JSON.parse(cleaned);
    } catch (e) {
      throw new Error('Gemini返回的内容不是有效的JSON');
    }
  }

  _ensureLength(text, maxChars) {
    if (!text) return '';
    if (text.length <= maxChars) return text;
    return text.slice(0, maxChars);
  }

  _hasEmoji(s) {
    return /[\u{1F300}-\u{1FAFF}]/u.test(s);
  }

  _cleanText(s) {
    return String(s || '').replace(/\s+/g, ' ').trim();
  }

  _validateAndCleanCard(card) {
    let title = this._cleanText(card.title || '🌟 有趣的知识');
    if (!this._hasEmoji(title)) title = '🌟 ' + title;
    title = this._ensureLength(title, 15);

    let introduction = this._cleanText(card.introduction || '让我们一起学习新知识吧！');
    if (!/小朋友|让我们|一起/.test(introduction)) introduction = '小朋友，' + introduction;
    introduction = this._ensureLength(introduction, 60);

    const points = Array.isArray(card.points)
      ? card.points.slice(0, 3).map((p) => ({
          title: this._ensureLength(this._cleanText(p.title || '📚 知识要点'), 12),
          content: this._ensureLength(this._cleanText(p.content || ''), 140),
        }))
      : [];

    let summary = this._cleanText(card.summary || '保持好奇心，你会发现更多有趣的秘密！');
    if (!this._hasEmoji(summary)) summary = '💡 ' + summary;
    summary = this._ensureLength(summary, 40);

    return { title, introduction, points, summary, source: 'gemini-api' };
  }

  async _postJson(url, body) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), GEMINI_CONFIG.timeout);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Gemini API错误: ${res.status} ${res.statusText} - ${text}`);
      }
      return await res.json();
    } finally {
      clearTimeout(t);
    }
  }
}

export function getGeminiClient() {
  return new GeminiClient();
}

