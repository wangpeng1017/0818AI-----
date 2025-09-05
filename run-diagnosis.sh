#!/bin/bash

# 网站诊断自动化测试运行脚本
# 目标网站: https://why.aifly.me/

echo "🚀 网站功能诊断测试 - https://why.aifly.me/"
echo "=================================================="

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

echo "✅ Node.js 版本: $(node -v)"

# 检查是否存在 node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖包..."
    npm install --package-lock-only
    npm install playwright@^1.40.0
    
    echo "🎭 安装 Playwright 浏览器..."
    npx playwright install chromium
else
    echo "✅ 依赖包已存在"
fi

# 创建测试结果目录
mkdir -p test-results
echo "📁 创建测试结果目录: test-results/"

# 运行测试
echo ""
echo "🔍 开始执行网站诊断测试..."
echo "⏱️  预计测试时间: 2-3 分钟"
echo ""

node test-website-diagnosis.js

# 检查测试结果
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 测试执行完成！"
    echo ""
    echo "📊 测试报告文件:"
    ls -la website-diagnosis-report-*.json 2>/dev/null || echo "   未找到报告文件"
    echo ""
    echo "💡 建议:"
    echo "   1. 查看控制台输出的详细测试结果"
    echo "   2. 检查生成的 JSON 报告文件"
    echo "   3. 根据修复建议解决发现的问题"
else
    echo ""
    echo "❌ 测试执行失败，请检查错误信息"
fi

echo ""
echo "🔚 测试完成"
