#!/usr/bin/env node

/**
 * 部署诊断脚本
 * 检查移动端布局优化是否正确部署
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 开始部署诊断检查...\n');

// 检查Git状态
console.log('📋 Git状态检查:');
console.log('最新提交应该是: cfb0f82 (移动端UI布局优化)');

// 检查CSS文件内容
console.log('\n🎨 CSS文件检查:');

try {
    const cssContent = fs.readFileSync('styles/main.css', 'utf8');
    
    // 检查基础布局设置
    const hasCardContent = cssContent.includes('.card-content {');
    const hasFlexDirection = cssContent.includes('flex-direction: column;');
    const hasOrderPC = cssContent.includes('order: 1; /* PC端：按钮在上方 */');
    
    console.log(`✅ .card-content 容器: ${hasCardContent ? '存在' : '❌ 缺失'}`);
    console.log(`✅ flex-direction: column: ${hasFlexDirection ? '存在' : '❌ 缺失'}`);
    console.log(`✅ PC端 order 设置: ${hasOrderPC ? '存在' : '❌ 缺失'}`);
    
    // 检查移动端媒体查询
    const hasMobileQuery = cssContent.includes('@media (max-width: 768px)');
    const hasMobileOrder = cssContent.includes('order: 3; /* 移动端：按钮组移到卡片内容下方 */');
    const hasBorderTop = cssContent.includes('border-top: 2px dashed #e9ecef;');
    
    console.log(`✅ 768px 媒体查询: ${hasMobileQuery ? '存在' : '❌ 缺失'}`);
    console.log(`✅ 移动端 order: 3: ${hasMobileOrder ? '存在' : '❌ 缺失'}`);
    console.log(`✅ 分隔线样式: ${hasBorderTop ? '存在' : '❌ 缺失'}`);
    
    // 检查小屏媒体查询
    const hasSmallQuery = cssContent.includes('@media (max-width: 480px)');
    const hasSmallOrder = cssContent.includes('order: 3; /* 小屏移动端：按钮组在卡片内容下方 */');
    
    console.log(`✅ 480px 媒体查询: ${hasSmallQuery ? '存在' : '❌ 缺失'}`);
    console.log(`✅ 小屏 order: 3: ${hasSmallOrder ? '存在' : '❌ 缺失'}`);
    
} catch (error) {
    console.log('❌ 无法读取CSS文件:', error.message);
}

// 检查HTML结构
console.log('\n📄 HTML结构检查:');

try {
    const htmlContent = fs.readFileSync('index.html', 'utf8');
    
    const hasCardContentDiv = htmlContent.includes('<div id="cardContent" class="card-content"');
    const hasCardActions = htmlContent.includes('<div class="card-actions">');
    const hasKnowledgeCard = htmlContent.includes('<div id="knowledgeCard" class="knowledge-card">');
    
    console.log(`✅ card-content 容器: ${hasCardContentDiv ? '存在' : '❌ 缺失'}`);
    console.log(`✅ card-actions 容器: ${hasCardActions ? '存在' : '❌ 缺失'}`);
    console.log(`✅ knowledge-card 容器: ${hasKnowledgeCard ? '存在' : '❌ 缺失'}`);
    
    // 检查结构顺序
    const cardActionsIndex = htmlContent.indexOf('<div class="card-actions">');
    const knowledgeCardIndex = htmlContent.indexOf('<div id="knowledgeCard" class="knowledge-card">');
    
    if (cardActionsIndex !== -1 && knowledgeCardIndex !== -1) {
        const correctOrder = cardActionsIndex < knowledgeCardIndex;
        console.log(`✅ HTML结构顺序: ${correctOrder ? '正确 (actions在前)' : '❌ 错误'}`);
    }
    
} catch (error) {
    console.log('❌ 无法读取HTML文件:', error.message);
}

// 生成测试HTML片段
console.log('\n🧪 生成移动端测试代码:');

const testCSS = `
<style>
/* 测试移动端布局的CSS */
.test-container {
    max-width: 375px; /* iPhone SE宽度 */
    margin: 20px auto;
    border: 2px solid #ccc;
    padding: 20px;
}

.card-content {
    display: flex;
    flex-direction: column;
}

.card-actions {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    flex-wrap: wrap;
    order: 3; /* 移动端：按钮在下方 */
    margin-top: 20px;
    padding-top: 20px;
    border-top: 2px dashed #e9ecef;
    justify-content: center;
}

.knowledge-card {
    order: 2; /* 移动端：内容在上方 */
    background: #f8f9fa;
    padding: 20px;
    border-radius: 10px;
    margin-bottom: 0;
}

.action-btn {
    background: white;
    border: 2px solid #e9ecef;
    padding: 8px 15px;
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;
}
</style>

<div class="test-container">
    <h3>移动端布局测试 (375px宽度)</h3>
    <div class="card-content">
        <div class="card-actions">
            <button class="action-btn">🔄 重新生成</button>
            <button class="action-btn">📷 下载PNG</button>
            <button class="action-btn">📄 下载HTML</button>
            <button class="action-btn">🔗 分享</button>
        </div>
        <div class="knowledge-card">
            <h4>🦕 恐龙的神秘世界</h4>
            <p>这是知识卡片内容。在移动端，这个内容应该显示在按钮上方。</p>
            <p>如果布局正确，你应该先看到这段文字，然后在下方看到操作按钮。</p>
        </div>
    </div>
</div>
`;

// 保存测试文件
fs.writeFileSync('mobile-layout-test.html', `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>移动端布局测试</title>
    ${testCSS}
</head>
<body>
    <h1>移动端布局诊断测试</h1>
    <p>这个页面用于测试移动端布局是否正确。</p>
    ${testCSS.match(/<div class="test-container">[\s\S]*<\/div>/)[0]}
    
    <div style="margin: 20px; padding: 20px; background: #fff3cd; border-radius: 10px;">
        <h3>📱 测试说明:</h3>
        <ul>
            <li><strong>正确布局</strong>: 内容在上方，按钮在下方（有分隔线）</li>
            <li><strong>错误布局</strong>: 按钮在上方，内容在下方</li>
            <li><strong>测试方法</strong>: 在移动设备或浏览器开发者工具中查看</li>
        </ul>
    </div>
</body>
</html>
`);

console.log('✅ 已生成 mobile-layout-test.html 测试文件');

// 提供解决方案
console.log('\n🔧 可能的解决方案:');
console.log('1. 清除浏览器缓存: Ctrl+F5 或 Cmd+Shift+R');
console.log('2. 检查Vercel部署状态: vercel ls');
console.log('3. 重新部署: vercel --prod');
console.log('4. 检查CSS文件是否正确上传到CDN');
console.log('5. 使用浏览器开发者工具检查CSS是否加载');

console.log('\n📱 移动端测试步骤:');
console.log('1. 打开 mobile-layout-test.html');
console.log('2. 使用浏览器开发者工具切换到移动设备模式');
console.log('3. 选择iPhone SE (375px) 或类似设备');
console.log('4. 确认内容在上方，按钮在下方');

console.log('\n🌐 在线测试:');
console.log('1. 访问部署的网站');
console.log('2. 生成一个知识卡片');
console.log('3. 在移动设备或开发者工具中检查布局');
console.log('4. 确认按钮是否在卡片内容下方');

console.log('\n✨ 诊断完成！');
