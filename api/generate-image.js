// Vercel Serverless Function for AI image generation via Gemini

import { getGeminiClient } from './lib/gemini-client.js';

// 简单的 Rate Limit（与 generate-card.js 一致）
const rateLimitStore = new Map();
function cleanupRateLimit() {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.resetTime > 60000) rateLimitStore.delete(key);
  }
}
function checkRateLimit(ip) {
  cleanupRateLimit();
  const now = Date.now();
  const key = `rate_limit_img_${ip}`;
  const limit = rateLimitStore.get(key);
  if (!limit) {
    rateLimitStore.set(key, { count: 1, resetTime: now });
    return { allowed: true, remaining: 9 };
  }
  if (now - limit.resetTime > 60000) {
    rateLimitStore.set(key, { count: 1, resetTime: now });
    return { allowed: true, remaining: 9 };
  }
  if (limit.count >= 10) return { allowed: false, remaining: 0 };
  limit.count++;
  return { allowed: true, remaining: 10 - limit.count };
}
function getClientIP(req) {
  return (
    req.headers['x-forwarded-for'] ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    '127.0.0.1'
  );
}

function validateCard(card) {
  if (!card || typeof card !== 'object') return { valid: false, error: '卡片内容不能为空' };
  return { valid: true };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: '只支持POST请求' });
  }

  try {
    const clientIP = getClientIP(req);
    const rateLimit = checkRateLimit(clientIP);

    res.setHeader('X-RateLimit-Limit', '10');
    res.setHeader('X-RateLimit-Remaining', rateLimit.remaining.toString());
    res.setHeader('X-RateLimit-Reset', new Date(Date.now() + 60000).toISOString());

    if (!rateLimit.allowed) {
      return res.status(429).json({ success: false, error: '请求过于频繁，请稍后再试' });
    }

    if (!req.body || !req.body.card) {
      return res.status(400).json({ success: false, error: '请求体缺少 card 字段' });
    }

    const validation = validateCard(req.body.card);
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: validation.error });
    }

    console.log(`[${new Date().toISOString()}] 开始生成AI图片，卡片标题: "${req.body.card?.title}"`);

    const gemini = getGeminiClient();
    const { mimeType, base64Data } = await gemini.generateImageFromCard(req.body.card);

    console.log(`[${new Date().toISOString()}] AI图片生成成功，类型: ${mimeType}, 数据长度: ${base64Data?.length || 0}`);

    res.status(200).json({
      success: true,
      image: { mimeType, base64Data },
      metadata: { timestamp: new Date().toISOString(), source: 'gemini-api' },
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] 生成AI图片错误:`, error);
    console.error('错误详情:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    // 根据错误类型返回更具体的错误信息
    let errorMessage = '服务器内部错误，请稍后再试';
    if (error.message.includes('GEMINI_API_KEY')) {
      errorMessage = 'API配置错误';
    } else if (error.message.includes('timeout')) {
      errorMessage = '请求超时，请稍后再试';
    } else if (error.message.includes('Gemini')) {
      errorMessage = 'AI服务暂时不可用';
    }

    res.status(500).json({ success: false, error: errorMessage, details: error.message });
  }
}

