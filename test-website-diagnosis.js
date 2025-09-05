/**
 * Playwright 自动化测试脚本 - 网站功能诊断
 * 目标网站: https://why.aifly.me/
 * 功能: 全面检查知识卡片生成和图片下载功能
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

class WebsiteDiagnostics {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {
      pageLoad: {},
      functionality: {},
      networkRequests: [],
      errors: [],
      performance: {},
      summary: {}
    };
    this.startTime = Date.now();
  }

  async initialize() {
    console.log('🚀 启动 Playwright 浏览器...');
    this.browser = await chromium.launch({ 
      headless: false, // 设为 false 可以看到浏览器操作
      slowMo: 1000 // 减慢操作速度便于观察
    });
    
    this.page = await this.browser.newPage();
    
    // 设置视口大小
    await this.page.setViewportSize({ width: 1280, height: 720 });
    
    // 监听控制台消息
    this.page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      console.log(`📝 Console [${type}]: ${text}`);
      
      if (type === 'error' || type === 'warning') {
        this.testResults.errors.push({
          type: type,
          message: text,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    // 监听网络请求
    this.page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/')) {
        console.log(`🌐 Request: ${request.method()} ${url}`);
        this.testResults.networkRequests.push({
          type: 'request',
          method: request.method(),
          url: url,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    // 监听网络响应
    this.page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/')) {
        console.log(`📡 Response: ${response.status()} ${url}`);
        this.testResults.networkRequests.push({
          type: 'response',
          status: response.status(),
          url: url,
          statusText: response.statusText(),
          timestamp: new Date().toISOString()
        });
      }
    });
  }

  async testPageLoad() {
    console.log('\n🔍 测试 1: 页面加载检查');
    
    try {
      const loadStartTime = Date.now();
      
      // 导航到目标网站
      await this.page.goto('https://why.aifly.me/', { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      const loadTime = Date.now() - loadStartTime;
      
      // 检查页面标题
      const title = await this.page.title();
      console.log(`📄 页面标题: ${title}`);
      
      // 检查关键元素是否存在
      const elements = {
        questionInput: await this.page.locator('input[type="text"], textarea').count(),
        generateButton: await this.page.locator('button:has-text("生成"), button:has-text("提问")').count(),
        downloadButton: await this.page.locator('button:has-text("下载"), button:has-text("PNG")').count()
      };
      
      this.testResults.pageLoad = {
        success: true,
        loadTime: loadTime,
        title: title,
        elements: elements,
        url: this.page.url()
      };
      
      console.log(`✅ 页面加载成功 (${loadTime}ms)`);
      console.log(`📊 关键元素检查:`, elements);
      
    } catch (error) {
      console.log(`❌ 页面加载失败: ${error.message}`);
      this.testResults.pageLoad = {
        success: false,
        error: error.message
      };
    }
  }

  async testKnowledgeCardGeneration() {
    console.log('\n🔍 测试 2: 知识卡片生成功能');
    
    try {
      // 查找输入框
      const inputSelector = 'input[type="text"], textarea, input[placeholder*="问题"], input[placeholder*="输入"]';
      await this.page.waitForSelector(inputSelector, { timeout: 10000 });
      
      // 输入测试问题
      const testQuestion = '彩虹是怎么形成的？';
      console.log(`📝 输入测试问题: ${testQuestion}`);
      await this.page.fill(inputSelector, testQuestion);
      
      // 查找并点击生成按钮
      const generateButtonSelector = 'button:has-text("生成"), button:has-text("提问"), button:has-text("开始")';
      await this.page.click(generateButtonSelector);
      console.log('🔄 点击生成按钮...');
      
      // 等待响应 - 监听网络请求
      const apiRequestPromise = this.page.waitForResponse(
        response => response.url().includes('/api/generate-card'),
        { timeout: 30000 }
      );
      
      try {
        const response = await apiRequestPromise;
        const responseData = await response.json();
        
        console.log(`📡 API响应状态: ${response.status()}`);
        console.log(`📄 响应数据:`, JSON.stringify(responseData, null, 2));
        
        this.testResults.functionality.cardGeneration = {
          success: response.ok(),
          status: response.status(),
          responseData: responseData,
          question: testQuestion
        };
        
        if (response.ok()) {
          console.log('✅ 知识卡片生成成功');
          
          // 等待卡片内容显示
          await this.page.waitForTimeout(2000);
          
          // 检查卡片内容是否显示
          const cardContent = await this.page.locator('.card, .knowledge-card, [class*="card"]').count();
          console.log(`📋 检测到 ${cardContent} 个卡片元素`);
          
        } else {
          console.log(`❌ 知识卡片生成失败: ${response.status()}`);
        }
        
      } catch (timeoutError) {
        console.log('⏰ API请求超时，可能服务器响应慢');
        this.testResults.functionality.cardGeneration = {
          success: false,
          error: 'API请求超时'
        };
      }
      
    } catch (error) {
      console.log(`❌ 知识卡片生成测试失败: ${error.message}`);
      this.testResults.functionality.cardGeneration = {
        success: false,
        error: error.message
      };
    }
  }

  async testImageDownload() {
    console.log('\n🔍 测试 3: 图片下载功能');
    
    try {
      // 查找下载按钮
      const downloadButtonSelector = 'button:has-text("下载"), button:has-text("PNG"), button:has-text("图片")';
      
      // 等待下载按钮出现
      await this.page.waitForSelector(downloadButtonSelector, { timeout: 10000 });
      console.log('🔍 找到下载按钮');
      
      // 监听下载事件
      const downloadPromise = this.page.waitForEvent('download', { timeout: 30000 });
      
      // 监听 generate-image API 调用
      const imageApiPromise = this.page.waitForResponse(
        response => response.url().includes('/api/generate-image'),
        { timeout: 30000 }
      ).catch(() => null); // 不强制要求，因为可能回退到本地截图
      
      // 点击下载按钮
      await this.page.click(downloadButtonSelector);
      console.log('🖱️ 点击下载按钮...');
      
      // 等待 API 响应或下载
      const [imageResponse] = await Promise.all([
        imageApiPromise,
        this.page.waitForTimeout(5000) // 给足够时间处理
      ]);
      
      if (imageResponse) {
        console.log(`📡 图片生成API响应: ${imageResponse.status()}`);
        
        if (imageResponse.ok()) {
          const responseData = await imageResponse.json();
          console.log('✅ AI图片生成成功');
          
          this.testResults.functionality.imageDownload = {
            success: true,
            method: 'AI生成',
            status: imageResponse.status(),
            hasImageData: !!responseData.image?.base64Data
          };
        } else {
          console.log(`❌ AI图片生成失败: ${imageResponse.status()}`);
          console.log('🔄 应该回退到本地截图方案');
          
          this.testResults.functionality.imageDownload = {
            success: false,
            method: '回退到本地截图',
            status: imageResponse.status(),
            fallback: true
          };
        }
      } else {
        console.log('⚠️ 未检测到 /api/generate-image 调用，可能直接使用本地截图');
        
        this.testResults.functionality.imageDownload = {
          success: true,
          method: '本地截图',
          noApiCall: true
        };
      }
      
      // 检查是否有成功/失败提示消息
      await this.page.waitForTimeout(2000);
      const messages = await this.page.locator('.message, .toast, .notification, [class*="message"]').allTextContents();
      if (messages.length > 0) {
        console.log('📢 页面提示消息:', messages);
        this.testResults.functionality.imageDownload.messages = messages;
      }
      
    } catch (error) {
      console.log(`❌ 图片下载测试失败: ${error.message}`);
      this.testResults.functionality.imageDownload = {
        success: false,
        error: error.message
      };
    }
  }

  async generateReport() {
    console.log('\n📊 生成测试报告...');
    
    const endTime = Date.now();
    const totalTime = endTime - this.startTime;
    
    // 分析网络请求
    const apiRequests = this.testResults.networkRequests.filter(req => req.type === 'request');
    const apiResponses = this.testResults.networkRequests.filter(req => req.type === 'response');
    const failedRequests = apiResponses.filter(res => res.status >= 400);
    
    this.testResults.summary = {
      totalTime: totalTime,
      pageLoadSuccess: this.testResults.pageLoad.success,
      cardGenerationSuccess: this.testResults.functionality.cardGeneration?.success,
      imageDownloadSuccess: this.testResults.functionality.imageDownload?.success,
      totalApiRequests: apiRequests.length,
      failedApiRequests: failedRequests.length,
      totalErrors: this.testResults.errors.length
    };
    
    // 生成报告文件
    const reportData = {
      timestamp: new Date().toISOString(),
      website: 'https://why.aifly.me/',
      testDuration: totalTime,
      results: this.testResults
    };
    
    const reportPath = path.join(__dirname, `website-diagnosis-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    
    console.log(`📄 详细报告已保存到: ${reportPath}`);
    
    // 打印摘要
    this.printSummary();
    
    return reportData;
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 测试结果摘要');
    console.log('='.repeat(60));
    
    const { summary } = this.testResults;
    
    console.log(`⏱️  总测试时间: ${summary.totalTime}ms`);
    console.log(`🌐 页面加载: ${summary.pageLoadSuccess ? '✅ 成功' : '❌ 失败'}`);
    console.log(`📝 卡片生成: ${summary.cardGenerationSuccess ? '✅ 成功' : '❌ 失败'}`);
    console.log(`🖼️  图片下载: ${summary.imageDownloadSuccess ? '✅ 成功' : '❌ 失败'}`);
    console.log(`📡 API请求总数: ${summary.totalApiRequests}`);
    console.log(`❌ 失败请求数: ${summary.failedApiRequests}`);
    console.log(`🐛 错误总数: ${summary.totalErrors}`);
    
    // 详细问题分析
    if (summary.failedApiRequests > 0 || summary.totalErrors > 0) {
      console.log('\n🔍 发现的问题:');
      
      const failedRequests = this.testResults.networkRequests.filter(req => 
        req.type === 'response' && req.status >= 400
      );
      
      failedRequests.forEach(req => {
        console.log(`❌ ${req.url} - 状态码: ${req.status}`);
      });
      
      this.testResults.errors.forEach(error => {
        console.log(`🐛 ${error.type}: ${error.message}`);
      });
    }
    
    console.log('='.repeat(60));
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log('🔚 浏览器已关闭');
    }
  }
}

// 主执行函数
async function runDiagnostics() {
  const diagnostics = new WebsiteDiagnostics();

  try {
    await diagnostics.initialize();
    await diagnostics.testPageLoad();
    await diagnostics.testKnowledgeCardGeneration();
    await diagnostics.testImageDownload();
    await diagnostics.testDetailedNetworkAnalysis();
    await diagnostics.diagnoseImageGenerationIssue();
    await diagnostics.generateDetailedRecommendations();
    await diagnostics.generateReport();

  } catch (error) {
    console.error('❌ 测试执行失败:', error);
  } finally {
    await diagnostics.cleanup();
  }
}

// 检查是否直接运行此脚本
if (require.main === module) {
  runDiagnostics().catch(console.error);
}

  async testDetailedNetworkAnalysis() {
    console.log('\n🔍 测试 4: 详细网络分析');

    // 分析所有网络请求
    const requests = this.testResults.networkRequests;
    const generateCardRequests = requests.filter(req => req.url.includes('/api/generate-card'));
    const generateImageRequests = requests.filter(req => req.url.includes('/api/generate-image'));

    console.log(`📊 /api/generate-card 请求数: ${generateCardRequests.length}`);
    console.log(`📊 /api/generate-image 请求数: ${generateImageRequests.length}`);

    // 检查具体的失败原因
    const failedResponses = requests.filter(req =>
      req.type === 'response' && req.status >= 400
    );

    for (const failedReq of failedResponses) {
      console.log(`❌ 失败请求详情:`);
      console.log(`   URL: ${failedReq.url}`);
      console.log(`   状态: ${failedReq.status} ${failedReq.statusText}`);

      // 尝试获取错误响应内容
      try {
        const response = await this.page.waitForResponse(
          res => res.url() === failedReq.url,
          { timeout: 1000 }
        );
        const errorText = await response.text();
        console.log(`   错误内容: ${errorText}`);
      } catch (e) {
        console.log(`   无法获取错误详情`);
      }
    }

    this.testResults.networkAnalysis = {
      totalRequests: requests.length,
      generateCardRequests: generateCardRequests.length,
      generateImageRequests: generateImageRequests.length,
      failedRequests: failedResponses.length,
      failedDetails: failedResponses
    };
  }

  async diagnoseImageGenerationIssue() {
    console.log('\n🔍 专项诊断: AI图片生成问题');

    // 检查环境变量相关错误
    const envErrors = this.testResults.errors.filter(error =>
      error.message.includes('GEMINI_API_KEY') ||
      error.message.includes('环境变量') ||
      error.message.includes('API Key')
    );

    if (envErrors.length > 0) {
      console.log('🔑 发现API Key相关错误:');
      envErrors.forEach(error => console.log(`   ${error.message}`));
    }

    // 检查Vercel函数相关错误
    const vercelErrors = this.testResults.errors.filter(error =>
      error.message.includes('Function') ||
      error.message.includes('timeout') ||
      error.message.includes('502') ||
      error.message.includes('503')
    );

    if (vercelErrors.length > 0) {
      console.log('⚡ 发现Vercel函数相关错误:');
      vercelErrors.forEach(error => console.log(`   ${error.message}`));
    }

    // 检查Gemini API相关错误
    const geminiErrors = this.testResults.errors.filter(error =>
      error.message.includes('Gemini') ||
      error.message.includes('generativelanguage') ||
      error.message.includes('image generation')
    );

    if (geminiErrors.length > 0) {
      console.log('🤖 发现Gemini API相关错误:');
      geminiErrors.forEach(error => console.log(`   ${error.message}`));
    }

    this.testResults.imageGenerationDiagnosis = {
      envErrors: envErrors.length,
      vercelErrors: vercelErrors.length,
      geminiErrors: geminiErrors.length,
      totalImageRelatedErrors: envErrors.length + vercelErrors.length + geminiErrors.length
    };
  }

  async generateDetailedRecommendations() {
    console.log('\n💡 生成修复建议');

    const recommendations = [];

    // 基于测试结果生成建议
    if (!this.testResults.functionality.cardGeneration?.success) {
      recommendations.push({
        issue: '知识卡片生成失败',
        priority: 'HIGH',
        suggestions: [
          '检查 GEMINI_API_KEY 环境变量是否正确设置',
          '验证 Gemini API 配额和权限',
          '检查 /api/generate-card 接口的错误日志'
        ]
      });
    }

    if (!this.testResults.functionality.imageDownload?.success) {
      recommendations.push({
        issue: 'AI图片生成失败',
        priority: 'HIGH',
        suggestions: [
          '在 vercel.json 中添加 api/generate-image.js 函数配置',
          '增加函数超时时间到 60 秒（图片生成需要更长时间）',
          '检查 Gemini API 是否支持图片生成功能',
          '验证 models/gemini-2.5-flash-image-preview 模型可用性'
        ]
      });
    }

    const failedRequests = this.testResults.networkRequests.filter(req =>
      req.type === 'response' && req.status >= 400
    );

    if (failedRequests.length > 0) {
      recommendations.push({
        issue: 'API请求失败',
        priority: 'MEDIUM',
        suggestions: [
          '检查服务器日志获取详细错误信息',
          '验证所有环境变量在部署环境中正确设置',
          '检查 Vercel 函数部署状态'
        ]
      });
    }

    this.testResults.recommendations = recommendations;

    // 打印建议
    recommendations.forEach((rec, index) => {
      console.log(`\n${index + 1}. 问题: ${rec.issue} [${rec.priority}]`);
      rec.suggestions.forEach(suggestion => {
        console.log(`   • ${suggestion}`);
      });
    });
  }
}

module.exports = { WebsiteDiagnostics, runDiagnostics };
