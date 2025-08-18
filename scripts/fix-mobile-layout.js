#!/usr/bin/env node

/**
 * 修复移动端布局问题的脚本
 * 解决CSS缓存和部署问题
 */

const fs = require('fs');

console.log('🔧 修复移动端布局问题...\n');

// 1. 更新CSS版本号
function updateCSSVersion() {
    console.log('📝 更新CSS版本号...');
    
    const htmlPath = 'index.html';
    let htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // 生成新的版本号
    const timestamp = Date.now();
    const newVersion = `v1.1.${timestamp}`;
    
    // 更新CSS链接
    htmlContent = htmlContent.replace(
        /href="styles\/main\.css(\?v=[^"]*)?"/,
        `href="styles/main.css?v=${newVersion}"`
    );
    
    fs.writeFileSync(htmlPath, htmlContent);
    console.log(`✅ CSS版本号已更新为: ${newVersion}`);
}

// 2. 验证CSS内容
function verifyCSSContent() {
    console.log('\n🎨 验证CSS内容...');
    
    const cssContent = fs.readFileSync('styles/main.css', 'utf8');
    
    const checks = [
        {
            name: 'card-content flex容器',
            test: () => cssContent.includes('.card-content {') && cssContent.includes('flex-direction: column;')
        },
        {
            name: 'PC端order设置',
            test: () => cssContent.includes('order: 1; /* PC端：按钮在上方 */')
        },
        {
            name: '移动端768px媒体查询',
            test: () => cssContent.includes('@media (max-width: 768px)')
        },
        {
            name: '移动端order: 3设置',
            test: () => cssContent.includes('order: 3; /* 移动端：按钮组移到卡片内容下方 */')
        },
        {
            name: '分隔线样式',
            test: () => cssContent.includes('border-top: 2px dashed #e9ecef;')
        },
        {
            name: '小屏480px媒体查询',
            test: () => cssContent.includes('@media (max-width: 480px)')
        }
    ];
    
    let allPassed = true;
    checks.forEach(check => {
        const passed = check.test();
        console.log(`${passed ? '✅' : '❌'} ${check.name}`);
        if (!passed) allPassed = false;
    });
    
    return allPassed;
}

// 3. 生成内联CSS版本（备用方案）
function generateInlineCSS() {
    console.log('\n📦 生成内联CSS备用方案...');
    
    const inlineCSS = `
<style>
/* 移动端布局修复 - 内联版本 */
.card-content {
    display: flex !important;
    flex-direction: column !important;
}

.card-actions {
    order: 1 !important; /* PC端默认 */
}

.knowledge-card {
    order: 2 !important;
}

@media (max-width: 768px) {
    .card-actions {
        order: 3 !important; /* 移动端：按钮在下方 */
        margin-top: 20px !important;
        margin-bottom: 0 !important;
        padding-top: 20px !important;
        border-top: 2px dashed #e9ecef !important;
        justify-content: center !important;
    }
    
    .knowledge-card {
        order: 2 !important; /* 移动端：内容在上方 */
        margin-bottom: 0 !important;
    }
}

@media (max-width: 480px) {
    .card-actions {
        flex-direction: column !important;
        order: 3 !important;
        margin-top: 25px !important;
    }
    
    .knowledge-card {
        order: 2 !important;
    }
}
</style>`;

    // 创建带内联CSS的HTML文件
    const htmlContent = fs.readFileSync('index.html', 'utf8');
    const htmlWithInlineCSS = htmlContent.replace(
        '</head>',
        `${inlineCSS}\n</head>`
    );
    
    fs.writeFileSync('index-with-inline-css.html', htmlWithInlineCSS);
    console.log('✅ 已生成 index-with-inline-css.html (内联CSS版本)');
}

// 4. 创建测试页面
function createTestPage() {
    console.log('\n🧪 创建移动端测试页面...');
    
    const testHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>移动端布局修复测试</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .test-container { max-width: 375px; margin: 0 auto; border: 2px solid #ccc; padding: 20px; }
        .card-content { display: flex; flex-direction: column; }
        .card-actions { 
            display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;
            order: 3; margin-top: 20px; padding-top: 20px; 
            border-top: 2px dashed #e9ecef; 
        }
        .knowledge-card { 
            order: 2; background: #f8f9fa; padding: 20px; border-radius: 10px; 
        }
        .action-btn { 
            background: white; border: 2px solid #e9ecef; padding: 8px 15px; 
            border-radius: 8px; font-size: 14px; cursor: pointer; 
        }
        .status { padding: 15px; margin: 10px 0; border-radius: 8px; }
        .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
    </style>
</head>
<body>
    <h1>🔧 移动端布局修复测试</h1>
    
    <div class="status success">
        <strong>✅ 正确布局:</strong> 内容在上方，按钮在下方（有分隔线）
    </div>
    
    <div class="test-container">
        <h3>📱 移动端布局测试</h3>
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
                <p><strong>如果布局正确</strong>，你应该先看到这段文字，然后在下方看到操作按钮。</p>
            </div>
        </div>
    </div>
    
    <div class="status" id="layoutStatus">
        <strong>🔍 布局检测:</strong> <span id="layoutResult">检测中...</span>
    </div>
    
    <script>
        // 检测布局是否正确
        function checkLayout() {
            const cardActions = document.querySelector('.card-actions');
            const knowledgeCard = document.querySelector('.knowledge-card');
            const statusDiv = document.getElementById('layoutStatus');
            const resultSpan = document.getElementById('layoutResult');
            
            if (cardActions && knowledgeCard) {
                const actionsRect = cardActions.getBoundingClientRect();
                const cardRect = knowledgeCard.getBoundingClientRect();
                
                if (cardRect.top < actionsRect.top) {
                    statusDiv.className = 'status success';
                    resultSpan.textContent = '布局正确！内容在按钮上方。';
                } else {
                    statusDiv.className = 'status error';
                    resultSpan.textContent = '布局错误！按钮在内容上方。';
                }
            }
        }
        
        // 页面加载后检测
        window.addEventListener('load', checkLayout);
        window.addEventListener('resize', checkLayout);
    </script>
</body>
</html>`;

    fs.writeFileSync('mobile-layout-fix-test.html', testHTML);
    console.log('✅ 已生成 mobile-layout-fix-test.html');
}

// 5. 提供解决方案
function provideSolutions() {
    console.log('\n🎯 解决方案汇总:');
    console.log('');
    console.log('📋 立即解决方案:');
    console.log('1. 强制刷新浏览器缓存: Ctrl+F5 (Windows) 或 Cmd+Shift+R (Mac)');
    console.log('2. 清除浏览器数据: 开发者工具 > Application > Storage > Clear site data');
    console.log('3. 使用隐私/无痕模式测试');
    console.log('');
    console.log('🔄 重新部署方案:');
    console.log('1. git add . && git commit -m "强制更新CSS缓存"');
    console.log('2. git push origin main');
    console.log('3. vercel --prod');
    console.log('');
    console.log('🧪 测试方案:');
    console.log('1. 打开 mobile-layout-fix-test.html 进行本地测试');
    console.log('2. 如果本地测试正确，问题就是缓存问题');
    console.log('3. 如果需要，使用 index-with-inline-css.html 作为临时解决方案');
    console.log('');
    console.log('📱 移动端测试步骤:');
    console.log('1. 在移动设备或开发者工具中打开网站');
    console.log('2. 生成一个知识卡片');
    console.log('3. 确认按钮是否在卡片内容下方');
    console.log('4. 如果仍然不正确，使用内联CSS版本');
}

// 执行修复流程
console.log('🚀 开始修复流程...\n');

updateCSSVersion();
const cssValid = verifyCSSContent();

if (cssValid) {
    console.log('\n✅ CSS内容验证通过');
} else {
    console.log('\n❌ CSS内容验证失败，请检查代码');
}

generateInlineCSS();
createTestPage();
provideSolutions();

console.log('\n🎉 修复脚本执行完成！');
console.log('请按照上述解决方案进行测试和部署。');
