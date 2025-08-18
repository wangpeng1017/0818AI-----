#!/bin/bash

# 小朋友知识卡片 - 快速部署脚本
# 自动执行部署前检查和Vercel部署

echo "🚀 小朋友知识卡片 - 快速部署脚本"
echo "=================================="

# 检查Node.js版本
echo "📋 检查环境..."
node_version=$(node -v 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ Node.js版本: $node_version"
else
    echo "❌ 未安装Node.js，请先安装Node.js 18+"
    exit 1
fi

# 检查Vercel CLI
vercel_version=$(vercel -v 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ Vercel CLI版本: $vercel_version"
else
    echo "⚠️ 未安装Vercel CLI，正在安装..."
    npm install -g vercel
fi

# 运行部署前检查
echo ""
echo "🔍 运行部署前检查..."
node scripts/deploy-check.js
if [ $? -ne 0 ]; then
    echo "❌ 部署前检查失败，请修复问题后重试"
    exit 1
fi

echo ""
echo "✅ 部署前检查通过！"

# 检查环境变量
echo ""
echo "🔐 检查环境变量配置..."
echo "请确保已设置GLM_API_KEY环境变量："
echo "vercel env add GLM_API_KEY"
echo ""
read -p "是否已设置环境变量？(y/n): " env_set

if [ "$env_set" != "y" ] && [ "$env_set" != "Y" ]; then
    echo "请先设置环境变量："
    echo "vercel env add GLM_API_KEY"
    echo "API密钥: c86f3e09702947fcb3b1d65b5c4d349a.KIQaMpAZlWdKrzsg"
    exit 1
fi

# 开始部署
echo ""
echo "🚀 开始部署到Vercel..."
vercel --prod

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 部署成功！"
    echo ""
    echo "📋 部署后检查清单："
    echo "1. 访问部署的URL，确认页面正常加载"
    echo "2. 测试问题输入和AI生成功能"
    echo "3. 验证下载和分享功能"
    echo "4. 检查移动端响应式设计"
    echo ""
    echo "🌟 项目已成功上线！"
else
    echo ""
    echo "❌ 部署失败，请检查错误信息"
    exit 1
fi
