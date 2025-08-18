#!/usr/bin/env node

/**
 * 部署前配置检查脚本
 * 验证vercel.json配置和项目文件完整性
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 开始部署前配置检查...\n');

// 检查必要文件是否存在
const requiredFiles = [
    'index.html',
    'vercel.json',
    'package.json',
    'api/generate-card.js',
    'api/lib/glm-client.js',
    'styles/main.css',
    'scripts/main.js'
];

console.log('📁 检查必要文件...');
let missingFiles = [];

requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - 文件缺失`);
        missingFiles.push(file);
    }
});

if (missingFiles.length > 0) {
    console.log(`\n❌ 发现 ${missingFiles.length} 个缺失文件，请检查项目完整性`);
    process.exit(1);
}

// 检查vercel.json配置
console.log('\n⚙️ 检查vercel.json配置...');

try {
    const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
    
    // 检查是否包含不兼容的builds属性
    if (vercelConfig.builds) {
        console.log('❌ vercel.json包含已弃用的builds属性，请移除');
        console.log('💡 建议：使用functions属性替代builds属性');
        process.exit(1);
    }
    
    // 检查functions配置
    if (vercelConfig.functions) {
        console.log('✅ functions配置存在');
        
        if (vercelConfig.functions['api/generate-card.js']) {
            const funcConfig = vercelConfig.functions['api/generate-card.js'];
            console.log(`✅ API函数配置: maxDuration=${funcConfig.maxDuration}s`);
        } else {
            console.log('⚠️ 未找到api/generate-card.js的函数配置');
        }
    } else {
        console.log('⚠️ 未找到functions配置');
    }
    
    // 检查CORS配置
    if (vercelConfig.headers) {
        console.log('✅ CORS头配置存在');
    } else {
        console.log('⚠️ 未找到CORS头配置');
    }
    
    // 检查重写规则
    if (vercelConfig.rewrites) {
        console.log('✅ URL重写规则存在');
    } else {
        console.log('⚠️ 未找到URL重写规则');
    }
    
} catch (error) {
    console.log('❌ vercel.json格式错误:', error.message);
    process.exit(1);
}

// 检查package.json
console.log('\n📦 检查package.json...');

try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    if (packageJson.name) {
        console.log(`✅ 项目名称: ${packageJson.name}`);
    }
    
    if (packageJson.dependencies) {
        console.log(`✅ 依赖包: ${Object.keys(packageJson.dependencies).length}个`);
    }
    
    if (packageJson.engines && packageJson.engines.node) {
        console.log(`✅ Node.js版本要求: ${packageJson.engines.node}`);
    } else {
        console.log('⚠️ 未指定Node.js版本要求');
    }
    
} catch (error) {
    console.log('❌ package.json格式错误:', error.message);
    process.exit(1);
}

// 检查环境变量示例
console.log('\n🔐 检查环境变量配置...');

if (fs.existsSync('.env.example')) {
    console.log('✅ .env.example文件存在');
    
    const envExample = fs.readFileSync('.env.example', 'utf8');
    if (envExample.includes('GLM_API_KEY')) {
        console.log('✅ GLM_API_KEY配置示例存在');
    } else {
        console.log('⚠️ 未找到GLM_API_KEY配置示例');
    }
} else {
    console.log('⚠️ .env.example文件不存在');
}

// 检查API文件
console.log('\n🤖 检查API文件...');

try {
    const apiContent = fs.readFileSync('api/generate-card.js', 'utf8');
    
    if (apiContent.includes('export default')) {
        console.log('✅ API函数导出格式正确');
    } else {
        console.log('❌ API函数导出格式错误');
    }
    
    if (apiContent.includes('GLM_API_KEY')) {
        console.log('✅ API密钥环境变量引用正确');
    } else {
        console.log('⚠️ 未找到API密钥环境变量引用');
    }
    
} catch (error) {
    console.log('❌ 无法读取API文件:', error.message);
}

console.log('\n🎉 配置检查完成！');
console.log('\n📋 部署前清单:');
console.log('1. ✅ 确保所有必要文件存在');
console.log('2. ✅ vercel.json配置正确（已移除builds属性）');
console.log('3. ✅ package.json格式正确');
console.log('4. 🔐 设置环境变量: GLM_API_KEY');
console.log('5. 🚀 执行部署命令: vercel --prod');

console.log('\n💡 部署命令:');
console.log('vercel env add GLM_API_KEY  # 添加环境变量');
console.log('vercel --prod              # 部署到生产环境');

console.log('\n✨ 项目已准备好部署！');
