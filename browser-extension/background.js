// 背景脚本 - 处理插件生命周期和消息传递

// 订阅服务检测规则
const SUBSCRIPTION_PATTERNS = {
  // URL 模式
  urlPatterns: [
    /checkout|billing|subscribe|pricing|plans|payment/i,
    /netflix\.com\/signup/i,
    /spotify\.com\/premium/i,
    /github\.com\/pricing/i,
    /adobe\.com\/products/i,
    /microsoft\.com\/.*\/buy/i,
    /aws\.amazon\.com\/pricing/i,
    /cloud\.google\.com\/pricing/i
  ],
  
  // 支付软件和支付链接模式
  paymentPatterns: [
    // 支付服务商
    /stripe\.com\/checkout/i,
    /checkout\.stripe\.com/i,
    /paypal\.com\/checkout/i,
    /paypal\.com\/cgi-bin\/webscr/i,
    /square\.com\/checkout/i,
    /checkout\.square\.com/i,
    /razorpay\.com\/checkout/i,
    /checkout\.paddle\.com/i,
    /gumroad\.com\/l\//i,
    /lemonsqueezy\.com\/checkout/i,
    /chargebee\.com\/checkout/i,
    /recurly\.com\/checkout/i,
    /braintreepayments\.com/i,
    /checkout\.2checkout\.com/i,
    /fastspring\.com\/checkout/i,
    /cleverbridge\.com/i,
    
    // 中国支付平台
    /alipay\.com/i,
    /pay\.weixin\.qq\.com/i,
    /wxpay\.wxutil\.com/i,
    /unionpay\.com/i,
    
    // 平台内支付
    /apple\.com\/.*\/checkout/i,
    /store\.steampowered\.com\/checkout/i,
    /play\.google\.com\/store\/account/i,
    /amazon\.com\/gp\/buy/i,
    /microsoft\.com\/.*\/checkout/i,
    
    // 通用支付关键词
    /\/pay\//i,
    /\/payment\//i,
    /\/checkout\//i,
    /\/purchase\//i,
    /\/buy\//i,
    /\/order\//i,
    /\/cart\//i,
    /\/billing\//i
  ],
  
  // 页面内容关键词
  contentKeywords: [
    'subscribe', 'subscription', 'billing', 'payment',
    'monthly', 'yearly', 'annual', 'premium', 'pro',
    'upgrade', 'checkout', 'purchase', 'buy now',
    '订阅', '付费', '升级', '购买', '月费', '年费'
  ],
  
  // 价格匹配模式
  pricePatterns: [
    /\$\d+(?:\.\d{2})?[\s]*(?:\/(?:month|year|mo|yr))?/gi,
    /¥\d+(?:\.\d{2})?[\s]*(?:\/(?:月|年))?/gi,
    /€\d+(?:\.\d{2})?[\s]*(?:\/(?:month|year|mo|yr))?/gi
  ]
};

// 服务识别映射
const SERVICE_MAPPING = {
  'netflix.com': { name: 'Netflix', category: 'Entertainment' },
  'spotify.com': { name: 'Spotify', category: 'Entertainment' },
  'github.com': { name: 'GitHub', category: 'Development' },
  'adobe.com': { name: 'Adobe Creative Cloud', category: 'Development' },
  'microsoft.com': { name: 'Microsoft 365', category: 'Productivity' },
  'google.com': { name: 'Google Workspace', category: 'Productivity' },
  'aws.amazon.com': { name: 'Amazon Web Services', category: 'Cloud' },
  'cloud.google.com': { name: 'Google Cloud', category: 'Cloud' },
  'azure.microsoft.com': { name: 'Microsoft Azure', category: 'Cloud' },
  'digitalocean.com': { name: 'DigitalOcean', category: 'Cloud' },
  'heroku.com': { name: 'Heroku', category: 'Cloud' },
  'vercel.com': { name: 'Vercel', category: 'Cloud' },
  'slack.com': { name: 'Slack', category: 'Productivity' },
  'discord.com': { name: 'Discord', category: 'Productivity' },
  'notion.so': { name: 'Notion', category: 'Productivity' },
  'figma.com': { name: 'Figma', category: 'Development' },
  'jetbrains.com': { name: 'JetBrains', category: 'Development' },
  'apple.com': { name: 'Apple', category: 'Productivity' },
  'zoom.us': { name: 'Zoom', category: 'Productivity' },
  'dropbox.com': { name: 'Dropbox', category: 'Productivity' },
  'atlassian.com': { name: 'Atlassian', category: 'Development' },
  'coursera.org': { name: 'Coursera', category: 'Education' },
  'udemy.com': { name: 'Udemy', category: 'Education' },
  'skillshare.com': { name: 'Skillshare', category: 'Education' },
  'headspace.com': { name: 'Headspace', category: 'Health' },
  'duolingo.com': { name: 'Duolingo', category: 'Education' }
};

// 监听来自内容脚本的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);
  
  switch (request.action) {
    case 'detectSubscription':
      handleSubscriptionDetection(request.data, sender.tab);
      break;
      
    case 'paymentDetected':
      handlePaymentDetection(request.data, sender.tab);
      break;
      
    case 'subscriptionAction':
      handleSubscriptionAction(request.data, sender.tab);
      break;
      
    case 'extractedData':
      handleExtractedData(request.data, sender.tab);
      break;
      
    case 'showNotification':
      showNotification(request.title, request.message);
      break;
      
    case 'openPopup':
      openSubscriptionPopup(request.data);
      break;
  }
  
  return true; // 保持消息通道开放
});

// 监听标签页更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    checkIfSubscriptionPage(tab);
  }
});

// 检查是否为订阅服务页面
function checkIfSubscriptionPage(tab) {
  const url = new URL(tab.url);
  const domain = url.hostname;
  
  // 检查URL模式
  const isSubscriptionUrl = SUBSCRIPTION_PATTERNS.urlPatterns.some(pattern => 
    pattern.test(tab.url)
  );
  
  // 检查支付链接模式
  const isPaymentUrl = SUBSCRIPTION_PATTERNS.paymentPatterns.some(pattern => 
    pattern.test(tab.url)
  );
  
  // 检查是否为已知服务域名
  const isKnownService = Object.keys(SERVICE_MAPPING).some(serviceDomain => 
    domain.includes(serviceDomain)
  );
  
  if (isSubscriptionUrl || isPaymentUrl || isKnownService) {
    console.log('Detected potential subscription/payment page:', tab.url);
    
    // 注入内容脚本进行深度检测
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    }).catch(err => {
      console.log('Script already injected or error:', err);
    });
  }
}

// 处理订阅检测
function handleSubscriptionDetection(data, tab) {
  console.log('Processing subscription detection:', data);
  
  // 识别服务信息
  const serviceInfo = identifyService(tab.url, data.pageTitle);
  
  // 提取价格信息
  const priceInfo = extractPriceInfo(data.content);
  
  // 合并提取的信息
  const extractedInfo = {
    ...serviceInfo,
    ...priceInfo,
    url: tab.url,
    detectedAt: new Date().toISOString()
  };
  
  console.log('Extracted subscription info:', extractedInfo);
  
  // 显示通知
  showNotification(
    '检测到订阅服务',
    `发现 ${extractedInfo.serviceName} 订阅页面`
  );
  
  // 存储提取的信息
  chrome.storage.local.set({
    'pendingSubscription': extractedInfo
  });
}

// 识别服务信息
function identifyService(url, pageTitle) {
  const domain = new URL(url).hostname;
  
  // 查找匹配的服务
  for (const [serviceDomain, serviceInfo] of Object.entries(SERVICE_MAPPING)) {
    if (domain.includes(serviceDomain)) {
      return {
        serviceName: serviceInfo.name,
        category: serviceInfo.category,
        domain: domain
      };
    }
  }
  
  // 如果没有匹配的服务，尝试从页面标题提取
  const titleWords = pageTitle.split(/\s+/);
  const serviceName = titleWords[0] || domain.split('.')[0];
  
  return {
    serviceName: serviceName.charAt(0).toUpperCase() + serviceName.slice(1),
    category: 'Other',
    domain: domain
  };
}

// 提取价格信息
function extractPriceInfo(content) {
  const priceInfo = {};
  
  // 使用正则表达式提取价格
  SUBSCRIPTION_PATTERNS.pricePatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      // 分析价格和计费周期
      matches.forEach(match => {
        const price = parseFloat(match.replace(/[^\d.]/g, ''));
        const isYearly = /year|annual|yr|年/i.test(match);
        const isMonthly = /month|monthly|mo|月/i.test(match);
        
        if (isYearly) {
          priceInfo.yearlyPrice = price;
        } else if (isMonthly || (!isYearly && !isMonthly)) {
          priceInfo.monthlyPrice = price;
        }
      });
    }
  });
  
  return priceInfo;
}

// 显示通知
function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: title,
    message: message
  });
}

// 处理支付检测
function handlePaymentDetection(data, tab) {
  console.log('Processing payment detection:', data);
  
  // 识别服务信息
  const serviceInfo = identifyService(tab.url, data.pageTitle);
  
  // 提取支付相关信息
  const paymentInfo = extractPaymentInfo(data);
  
  // 合并提取的信息
  const extractedInfo = {
    ...serviceInfo,
    ...paymentInfo,
    url: tab.url,
    detectedAt: new Date().toISOString(),
    triggerType: 'payment'
  };
  
  console.log('Extracted payment info:', extractedInfo);
  
  // 显示通知
  showNotification(
    '🔔 检测到支付行为',
    `正在为 ${extractedInfo.serviceName} 付费，是否记录订阅？`
  );
  
  // 存储提取的信息
  chrome.storage.local.set({
    'pendingSubscription': extractedInfo
  });
  
  // 自动弹出订阅表单
  setTimeout(() => {
    openSubscriptionPopup(extractedInfo);
  }, 1000);
}

// 处理订阅行为
function handleSubscriptionAction(data, tab) {
  console.log('Processing subscription action:', data);
  
  // 识别服务信息
  const serviceInfo = identifyService(tab.url, data.pageTitle);
  
  // 合并信息
  const extractedInfo = {
    ...serviceInfo,
    ...data,
    url: tab.url,
    detectedAt: new Date().toISOString(),
    triggerType: 'subscription_action'
  };
  
  console.log('Extracted subscription action info:', extractedInfo);
  
  // 显示通知
  showNotification(
    '🎯 检测到订阅操作',
    `检测到 ${extractedInfo.serviceName} 订阅操作`
  );
  
  // 存储提取的信息
  chrome.storage.local.set({
    'pendingSubscription': extractedInfo
  });
  
  // 自动弹出订阅表单
  setTimeout(() => {
    openSubscriptionPopup(extractedInfo);
  }, 500);
}

// 提取支付相关信息
function extractPaymentInfo(data) {
  const paymentInfo = {
    isPaymentFlow: true
  };
  
  // 从页面内容提取金额
  if (data.content) {
    const priceMatches = data.content.match(/\$\d+(?:\.\d{2})?/g);
    if (priceMatches && priceMatches.length > 0) {
      paymentInfo.detectedPrice = priceMatches[0];
      paymentInfo.priceAmount = parseFloat(priceMatches[0].replace('$', ''));
    }
  }
  
  // 检测支付方式
  if (data.content) {
    const paymentMethods = [];
    if (/credit card|visa|mastercard|amex/i.test(data.content)) {
      paymentMethods.push('credit_card');
    }
    if (/paypal/i.test(data.content)) {
      paymentMethods.push('paypal');
    }
    if (/apple pay/i.test(data.content)) {
      paymentMethods.push('apple_pay');
    }
    if (/google pay/i.test(data.content)) {
      paymentMethods.push('google_pay');
    }
    if (/alipay|支付宝/i.test(data.content)) {
      paymentMethods.push('alipay');
    }
    if (/wechat|微信/i.test(data.content)) {
      paymentMethods.push('wechat_pay');
    }
    
    paymentInfo.paymentMethods = paymentMethods;
  }
  
  return paymentInfo;
}

// 打开订阅弹窗
function openSubscriptionPopup(data) {
  chrome.windows.create({
    url: chrome.runtime.getURL('popup.html'),
    type: 'popup',
    width: 400,
    height: 600
  });
}