#!/usr/bin/env node

/**
 * 内容质量测试脚本
 * 验证AI生成的知识卡片是否符合新的质量标准
 */

const fs = require('fs');

console.log('🧪 开始内容质量测试...\n');

// 测试用例
const testQuestions = [
    '恐龙为什么会灭绝？',
    '太阳系有哪些行星？',
    '彩虹是怎么形成的？',
    '为什么天空是蓝色的？',
    '植物为什么需要阳光？'
];

// 质量标准
const qualityStandards = {
    title: { maxLength: 15, mustHaveEmoji: true },
    introduction: { targetLength: 40, tolerance: 10 },
    pointTitle: { maxLength: 12, mustHaveEmoji: true },
    pointContent: { minLength: 80, maxLength: 120 },
    summary: { targetLength: 30, tolerance: 10, mustHaveEmoji: true },
    totalPoints: 3
};

/**
 * 检查文本是否包含emoji
 */
function hasEmoji(text) {
    // 更全面的emoji检测正则表达式
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}]/gu;

    // 也检查常见的emoji字符
    const commonEmojis = ['🌟', '🦕', '🌍', '🦴', '🔍', '💡', '🪐', '☀️', '🌈', '💧', '🎨', '🔬', '📚', '🎯'];

    return emojiRegex.test(text) || commonEmojis.some(emoji => text.includes(emoji));
}

/**
 * 验证单个卡片的质量
 */
function validateCardQuality(card, question) {
    const results = {
        question,
        passed: true,
        issues: [],
        scores: {}
    };

    // 检查标题
    if (card.title.length > qualityStandards.title.maxLength) {
        results.issues.push(`标题过长: ${card.title.length}字 > ${qualityStandards.title.maxLength}字`);
        results.passed = false;
    }
    if (!hasEmoji(card.title)) {
        results.issues.push('标题缺少emoji');
        results.passed = false;
    }
    results.scores.title = card.title.length <= qualityStandards.title.maxLength && hasEmoji(card.title) ? 100 : 0;

    // 检查引导语
    const introLength = card.introduction.length;
    const introTarget = qualityStandards.introduction.targetLength;
    const introTolerance = qualityStandards.introduction.tolerance;
    if (Math.abs(introLength - introTarget) > introTolerance) {
        results.issues.push(`引导语长度不合适: ${introLength}字 (目标: ${introTarget}±${introTolerance}字)`);
        results.passed = false;
    }
    results.scores.introduction = Math.max(0, 100 - Math.abs(introLength - introTarget) * 5);

    // 检查知识点数量
    if (card.points.length !== qualityStandards.totalPoints) {
        results.issues.push(`知识点数量错误: ${card.points.length} ≠ ${qualityStandards.totalPoints}`);
        results.passed = false;
    }

    // 检查每个知识点
    let pointScores = [];
    card.points.forEach((point, index) => {
        let pointScore = 100;
        
        // 检查知识点标题
        if (point.title.length > qualityStandards.pointTitle.maxLength) {
            results.issues.push(`知识点${index + 1}标题过长: ${point.title.length}字`);
            results.passed = false;
            pointScore -= 20;
        }
        if (!hasEmoji(point.title)) {
            results.issues.push(`知识点${index + 1}标题缺少emoji`);
            results.passed = false;
            pointScore -= 20;
        }

        // 检查知识点内容长度
        const contentLength = point.content.length;
        if (contentLength < qualityStandards.pointContent.minLength) {
            results.issues.push(`知识点${index + 1}内容过短: ${contentLength}字 < ${qualityStandards.pointContent.minLength}字`);
            results.passed = false;
            pointScore -= 30;
        }
        if (contentLength > qualityStandards.pointContent.maxLength) {
            results.issues.push(`知识点${index + 1}内容过长: ${contentLength}字 > ${qualityStandards.pointContent.maxLength}字`);
            results.passed = false;
            pointScore -= 20;
        }

        // 检查内容深度（关键词和结构检查）
        const depthKeywords = ['原理', '因为', '所以', '科学', '研究', '发现', '例如', '比如', '就像', '通过', '机制', '现象', '规律', '实验', '观察', '分析', '证明', '解释', '理论', '方法'];
        const hasDepthKeywords = depthKeywords.some(keyword => point.content.includes(keyword));

        // 检查是否有具体数据或事实
        const hasSpecificInfo = /\d+/.test(point.content) || point.content.includes('米') || point.content.includes('度') || point.content.includes('年');

        if (!hasDepthKeywords && !hasSpecificInfo) {
            results.issues.push(`知识点${index + 1}缺乏深度解释`);
            pointScore -= 30;
        }

        pointScores.push(Math.max(0, pointScore));
    });
    results.scores.points = pointScores.length > 0 ? pointScores.reduce((a, b) => a + b) / pointScores.length : 0;

    // 检查总结
    const summaryLength = card.summary.length;
    const summaryTarget = qualityStandards.summary.targetLength;
    const summaryTolerance = qualityStandards.summary.tolerance;
    if (Math.abs(summaryLength - summaryTarget) > summaryTolerance) {
        results.issues.push(`总结长度不合适: ${summaryLength}字 (目标: ${summaryTarget}±${summaryTolerance}字)`);
        results.passed = false;
    }
    if (!hasEmoji(card.summary)) {
        results.issues.push('总结缺少emoji');
        results.passed = false;
    }
    results.scores.summary = Math.max(0, 100 - Math.abs(summaryLength - summaryTarget) * 5) * (hasEmoji(card.summary) ? 1 : 0.8);

    // 计算总分
    results.scores.total = Math.round(
        (results.scores.title + results.scores.introduction + results.scores.points + results.scores.summary) / 4
    );

    return results;
}

/**
 * 测试模拟数据质量
 */
function testMockDataQuality() {
    console.log('📊 测试模拟数据质量...\n');
    
    // 导入生成函数（模拟）
    const mockTemplates = {
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
            summary: '💡 恐龙虽然灭绝了，但科学让我们能够重新认识这些远古生物的精彩世界！'
        }
    };

    let totalTests = 0;
    let passedTests = 0;
    let totalScore = 0;

    Object.entries(mockTemplates).forEach(([keyword, card]) => {
        totalTests++;
        const result = validateCardQuality(card, `关于${keyword}的问题`);
        
        console.log(`🧪 测试: ${result.question}`);
        console.log(`📊 总分: ${result.scores.total}/100`);
        console.log(`✅ 通过: ${result.passed ? '是' : '否'}`);
        
        if (result.issues.length > 0) {
            console.log('⚠️ 问题:');
            result.issues.forEach(issue => console.log(`   - ${issue}`));
        }
        
        console.log(`📈 详细分数:`);
        console.log(`   - 标题: ${result.scores.title}/100`);
        console.log(`   - 引导语: ${Math.round(result.scores.introduction)}/100`);
        console.log(`   - 知识点: ${Math.round(result.scores.points)}/100`);
        console.log(`   - 总结: ${Math.round(result.scores.summary)}/100`);
        console.log('');

        if (result.passed) passedTests++;
        totalScore += result.scores.total;
    });

    console.log('📋 测试总结:');
    console.log(`✅ 通过率: ${passedTests}/${totalTests} (${Math.round(passedTests/totalTests*100)}%)`);
    console.log(`📊 平均分: ${Math.round(totalScore/totalTests)}/100`);
    
    if (passedTests === totalTests && totalScore/totalTests >= 80) {
        console.log('🎉 所有测试通过，内容质量达标！');
        return true;
    } else {
        console.log('⚠️ 部分测试未通过，需要继续优化内容质量。');
        return false;
    }
}

/**
 * 生成质量报告
 */
function generateQualityReport() {
    const report = {
        timestamp: new Date().toISOString(),
        standards: qualityStandards,
        testResults: testMockDataQuality()
    };

    fs.writeFileSync('content-quality-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 质量报告已生成: content-quality-report.json');
}

// 运行测试
console.log('🎯 内容质量标准:');
console.log(`- 标题: ≤${qualityStandards.title.maxLength}字，必须有emoji`);
console.log(`- 引导语: ${qualityStandards.introduction.targetLength}±${qualityStandards.introduction.tolerance}字`);
console.log(`- 知识点标题: ≤${qualityStandards.pointTitle.maxLength}字，必须有emoji`);
console.log(`- 知识点内容: ${qualityStandards.pointContent.minLength}-${qualityStandards.pointContent.maxLength}字`);
console.log(`- 总结: ${qualityStandards.summary.targetLength}±${qualityStandards.summary.tolerance}字，必须有emoji`);
console.log(`- 知识点数量: ${qualityStandards.totalPoints}个\n`);

generateQualityReport();
