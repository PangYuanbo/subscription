// 内容脚本 - 在网页中运行，检测订阅服务并提取信息

class SubscriptionDetector {
  constructor() {
    this.paymentDetected = false;
    this.subscriptionActionDetected = false;
    this.init();
  }
  
  init() {
    // 等待页面加载完成后开始检测
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.startDetection());
    } else {
      this.startDetection();
    }
    
    // 立即开始监听支付和订阅行为
    this.startPaymentMonitoring();
    this.startSubscriptionActionMonitoring();
  }
  
  startDetection() {
    console.log('Starting subscription detection on:', window.location.href);
    
    // 检测订阅相关内容
    const detectionResult = this.detectSubscriptionContent();
    
    if (detectionResult.isSubscriptionPage) {
      console.log('Subscription page detected:', detectionResult);
      
      // 提取详细信息
      const extractedData = this.extractSubscriptionData();
      
      // 发送到背景脚本
      chrome.runtime.sendMessage({
        action: 'detectSubscription',
        data: {
          ...detectionResult,
          ...extractedData
        }
      });
      
      // 显示插件提示界面
      this.showSubscriptionPrompt(extractedData);
    }
    
    // 监听页面变化（SPA应用）
    this.observePageChanges();
  }
  
  detectSubscriptionContent() {
    const pageText = document.body.innerText.toLowerCase();
    const pageTitle = document.title;
    const url = window.location.href;
    
    // 检查URL关键词
    const urlKeywords = ['subscribe', 'billing', 'checkout', 'pricing', 'plans', 'payment', 'premium', 'pro'];
    const hasUrlKeyword = urlKeywords.some(keyword => url.toLowerCase().includes(keyword));
    
    // 检查页面内容关键词
    const contentKeywords = [
      'subscribe', 'subscription', 'billing', 'payment', 'monthly', 'yearly', 
      'annual', 'premium', 'pro', 'upgrade', 'checkout', 'purchase', 'buy now',
      '订阅', '付费', '升级', '购买', '月费', '年费', '会员'
    ];
    const keywordMatches = contentKeywords.filter(keyword => pageText.includes(keyword));
    
    // 检查价格信息
    const pricePatterns = [
      /\$\d+(?:\.\d{2})?[\s]*(?:\/(?:month|year|mo|yr))?/gi,
      /¥\d+(?:\.\d{2})?[\s]*(?:\/(?:月|年))?/gi,
      /€\d+(?:\.\d{2})?[\s]*(?:\/(?:month|year|mo|yr))?/gi
    ];
    const hasPricing = pricePatterns.some(pattern => pattern.test(pageText));
    
    // 检查订阅相关表单
    const hasSubscriptionForm = this.hasSubscriptionForm();
    
    // 判断是否为订阅页面
    const isSubscriptionPage = hasUrlKeyword || 
                              (keywordMatches.length >= 2) || 
                              hasPricing || 
                              hasSubscriptionForm;
    
    return {
      isSubscriptionPage,
      confidence: this.calculateConfidence(hasUrlKeyword, keywordMatches.length, hasPricing, hasSubscriptionForm),
      pageTitle,
      url,
      content: pageText.substring(0, 5000), // 限制内容长度
      keywordMatches
    };
  }
  
  calculateConfidence(hasUrlKeyword, keywordCount, hasPricing, hasForm) {
    let confidence = 0;
    if (hasUrlKeyword) confidence += 40;
    if (keywordCount >= 3) confidence += 30;
    else if (keywordCount >= 1) confidence += 15;
    if (hasPricing) confidence += 25;
    if (hasForm) confidence += 20;
    
    return Math.min(confidence, 100);
  }
  
  hasSubscriptionForm() {
    // 检查是否有订阅相关的表单或按钮
    const subscriptionSelectors = [
      'form[action*="subscribe"]',
      'form[action*="billing"]',
      'form[action*="checkout"]',
      'button[class*="subscribe"]',
      'button[class*="upgrade"]',
      'button[class*="buy"]',
      'button[class*="purchase"]',
      'a[href*="subscribe"]',
      'a[href*="billing"]',
      'a[href*="checkout"]',
      '.subscription-form',
      '.billing-form',
      '.checkout-form',
      '.pricing-card',
      '.plan-card'
    ];
    
    return subscriptionSelectors.some(selector => document.querySelector(selector));
  }
  
  extractSubscriptionData() {
    const data = {
      serviceName: this.extractServiceName(),
      prices: this.extractPrices(),
      planNames: this.extractPlanNames(),
      features: this.extractFeatures(),
      billingOptions: this.extractBillingOptions()
    };
    
    console.log('Extracted subscription data:', data);
    return data;
  }
  
  extractServiceName() {
    // 尝试从页面标题提取服务名
    const title = document.title;
    const titleParts = title.split(/[-|–—]/);
    
    // 尝试从logo或品牌元素提取
    const logoSelectors = [
      '.logo img[alt]',
      '.brand img[alt]',
      '.header img[alt]',
      'h1',
      '.company-name',
      '.brand-name'
    ];
    
    for (const selector of logoSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.alt || element.textContent;
        if (text && text.trim().length > 0 && text.trim().length < 50) {
          return text.trim();
        }
      }
    }
    
    // 从URL提取域名作为fallback
    const hostname = window.location.hostname;
    const domain = hostname.replace(/^www\./, '').split('.')[0];
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  }
  
  extractPrices() {
    const prices = [];
    const priceSelectors = [
      '[class*="price"]',
      '[class*="cost"]',
      '[class*="amount"]',
      '[data-price]',
      '.pricing-card',
      '.plan-price'
    ];
    
    priceSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        const text = element.textContent;
        const priceMatches = text.match(/\$\d+(?:\.\d{2})?/g);
        if (priceMatches) {
          priceMatches.forEach(match => {
            const price = parseFloat(match.replace('$', ''));
            const context = element.textContent.toLowerCase();
            const isYearly = /year|annual|yr|annually/i.test(context);
            const isMonthly = /month|monthly|mo/i.test(context);
            
            prices.push({
              amount: price,
              period: isYearly ? 'yearly' : (isMonthly ? 'monthly' : 'unknown'),
              text: match,
              context: context.substring(0, 100)
            });
          });
        }
      });
    });
    
    return prices;
  }
  
  extractPlanNames() {
    const planNames = [];
    const planSelectors = [
      '.plan-name',
      '.tier-name',
      '[class*="plan"] h2',
      '[class*="plan"] h3',
      '.pricing-card h2',
      '.pricing-card h3'
    ];
    
    planSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        const text = element.textContent.trim();
        if (text.length > 0 && text.length < 50) {
          planNames.push(text);
        }
      });
    });
    
    return [...new Set(planNames)]; // 去重
  }
  
  extractFeatures() {
    const features = [];
    const featureSelectors = [
      '.feature-list li',
      '.benefits li',
      '[class*="feature"] li',
      '.plan-features li'
    ];
    
    featureSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        const text = element.textContent.trim();
        if (text.length > 0 && text.length < 200) {
          features.push(text);
        }
      });
    });
    
    return features.slice(0, 10); // 限制特性数量
  }
  
  extractBillingOptions() {
    const options = [];
    const text = document.body.textContent.toLowerCase();
    
    if (text.includes('monthly') || text.includes('month')) {
      options.push('monthly');
    }
    if (text.includes('yearly') || text.includes('annually') || text.includes('annual')) {
      options.push('yearly');
    }
    
    return options;
  }
  
  showSubscriptionPrompt(data) {
    // 检查是否已经显示过提示
    if (document.querySelector('#subscription-tracker-prompt')) {
      return;
    }
    
    // 创建提示界面
    const promptHtml = `
      <div id="subscription-tracker-prompt" style="
        position: fixed;
        top: 20px;
        right: 20px;
        width: 320px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.15);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
        border: 1px solid #e1e5e9;
      ">
        <div style="padding: 16px; border-bottom: 1px solid #e1e5e9;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1a1a1a;">
            🎯 检测到订阅服务
          </h3>
          <p style="margin: 0; font-size: 14px; color: #666;">
            发现 "${data.serviceName}" 的订阅信息
          </p>
        </div>
        
        <div style="padding: 16px;">
          ${data.prices.length > 0 ? `
            <div style="margin-bottom: 12px;">
              <strong style="font-size: 14px; color: #333;">检测到价格:</strong>
              <div style="font-size: 13px; color: #666; margin-top: 4px;">
                ${data.prices.slice(0, 2).map(p => `${p.text}/${p.period}`).join(', ')}
              </div>
            </div>
          ` : ''}
          
          <div style="display: flex; gap: 8px;">
            <button id="add-subscription-btn" style="
              flex: 1;
              background: #10b981;
              color: white;
              border: none;
              padding: 8px 12px;
              border-radius: 6px;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
            ">添加订阅</button>
            
            <button id="dismiss-prompt-btn" style="
              background: #f3f4f6;
              color: #374151;
              border: none;
              padding: 8px 12px;
              border-radius: 6px;
              font-size: 14px;
              cursor: pointer;
            ">忽略</button>
          </div>
        </div>
      </div>
    `;
    
    // 添加到页面
    document.body.insertAdjacentHTML('beforeend', promptHtml);
    
    // 添加事件监听
    document.getElementById('add-subscription-btn').addEventListener('click', () => {
      this.openSubscriptionForm(data);
    });
    
    document.getElementById('dismiss-prompt-btn').addEventListener('click', () => {
      document.getElementById('subscription-tracker-prompt').remove();
    });
    
    // 5秒后自动隐藏
    setTimeout(() => {
      const prompt = document.getElementById('subscription-tracker-prompt');
      if (prompt) {
        prompt.style.opacity = '0.7';
      }
    }, 5000);
  }
  
  openSubscriptionForm(data) {
    // 发送消息到背景脚本打开表单
    chrome.runtime.sendMessage({
      action: 'openPopup',
      data: data
    });
    
    // 移除提示
    document.getElementById('subscription-tracker-prompt').remove();
  }
  
  observePageChanges() {
    // 监听SPA路由变化
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        setTimeout(() => this.startDetection(), 1000); // 延迟检测
      }
    }).observe(document, { subtree: true, childList: true });
  }
  
  // 开始支付行为监听
  startPaymentMonitoring() {
    console.log('Starting payment monitoring');
    
    // 监听支付相关链接点击
    this.monitorPaymentLinks();
    
    // 监听支付表单提交
    this.monitorPaymentForms();
    
    // 监听支付按钮点击
    this.monitorPaymentButtons();
    
    // 检测支付页面跳转
    this.detectPaymentRedirects();
  }
  
  // 监听支付链接
  monitorPaymentLinks() {
    const paymentLinkSelectors = [
      'a[href*="checkout"]',
      'a[href*="payment"]',
      'a[href*="billing"]',
      'a[href*="subscribe"]',
      'a[href*="buy"]',
      'a[href*="purchase"]',
      'a[href*="pay"]',
      'a[href*="stripe.com"]',
      'a[href*="paypal.com"]',
      'a[href*="alipay.com"]'
    ];
    
    paymentLinkSelectors.forEach(selector => {
      document.addEventListener('click', (e) => {
        const target = e.target.closest(selector);
        if (target) {
          console.log('Payment link clicked:', target.href);
          this.handlePaymentLinkClick(target);
        }
      });
    });
  }
  
  // 监听支付表单
  monitorPaymentForms() {
    const paymentFormSelectors = [
      'form[action*="checkout"]',
      'form[action*="payment"]',
      'form[action*="billing"]',
      'form[action*="subscribe"]',
      'form[class*="payment"]',
      'form[class*="checkout"]',
      'form[class*="billing"]'
    ];
    
    paymentFormSelectors.forEach(selector => {
      const forms = document.querySelectorAll(selector);
      forms.forEach(form => {
        form.addEventListener('submit', (e) => {
          console.log('Payment form submitted:', form);
          this.handlePaymentFormSubmit(form);
        });
      });
    });
  }
  
  // 监听支付按钮
  monitorPaymentButtons() {
    const paymentButtonSelectors = [
      'button[class*="checkout"]',
      'button[class*="payment"]',
      'button[class*="pay-now"]',
      'button[class*="buy-now"]',
      'button[class*="subscribe"]',
      'button[class*="purchase"]',
      'input[type="submit"][value*="pay"]',
      'input[type="submit"][value*="buy"]',
      'input[type="submit"][value*="subscribe"]',
      '[data-stripe]',
      '[data-paypal]'
    ];
    
    paymentButtonSelectors.forEach(selector => {
      document.addEventListener('click', (e) => {
        const target = e.target.closest(selector);
        if (target) {
          console.log('Payment button clicked:', target);
          this.handlePaymentButtonClick(target);
        }
      });
    });
  }
  
  // 检测支付页面跳转
  detectPaymentRedirects() {
    const currentUrl = window.location.href;
    
    // 检查当前URL是否为支付页面
    const paymentUrlPatterns = [
      /checkout\.stripe\.com/i,
      /paypal\.com\/checkout/i,
      /checkout\.square\.com/i,
      /pay\.google\.com/i,
      /apple\.com\/.*checkout/i,
      /\/checkout\//i,
      /\/payment\//i,
      /\/billing\//i
    ];
    
    const isPaymentPage = paymentUrlPatterns.some(pattern => pattern.test(currentUrl));
    
    if (isPaymentPage && !this.paymentDetected) {
      console.log('Payment page detected:', currentUrl);
      this.handlePaymentPageDetection();
    }
  }
  
  // 开始订阅行为监听
  startSubscriptionActionMonitoring() {
    console.log('Starting subscription action monitoring');
    
    // 监听订阅按钮点击
    this.monitorSubscriptionButtons();
    
    // 监听套餐选择
    this.monitorPlanSelection();
    
    // 监听计费周期切换
    this.monitorBillingCycleChanges();
  }
  
  // 监听订阅按钮
  monitorSubscriptionButtons() {
    const subscriptionButtonSelectors = [
      'button[class*="subscribe"]',
      'button[class*="upgrade"]',
      'a[class*="subscribe"]',
      'a[class*="upgrade"]',
      'button:contains("Subscribe")',
      'button:contains("Upgrade")',
      'button:contains("订阅")',
      'button:contains("升级")',
      '[data-plan]',
      '.pricing-button',
      '.plan-button',
      '.subscribe-btn'
    ];
    
    subscriptionButtonSelectors.forEach(selector => {
      document.addEventListener('click', (e) => {
        const target = e.target.closest(selector);
        if (target && this.isSubscriptionAction(target)) {
          console.log('Subscription button clicked:', target);
          this.handleSubscriptionButtonClick(target);
        }
      });
    });
  }
  
  // 监听套餐选择
  monitorPlanSelection() {
    const planSelectors = [
      '.pricing-card',
      '.plan-card',
      '.subscription-plan',
      '[data-plan]',
      '.tier'
    ];
    
    planSelectors.forEach(selector => {
      document.addEventListener('click', (e) => {
        const target = e.target.closest(selector);
        if (target) {
          console.log('Plan selected:', target);
          this.handlePlanSelection(target);
        }
      });
    });
  }
  
  // 监听计费周期变化
  monitorBillingCycleChanges() {
    const billingToggleSelectors = [
      'input[type="radio"][name*="billing"]',
      'input[type="radio"][name*="cycle"]',
      'input[type="checkbox"][class*="billing"]',
      '.billing-toggle',
      '.cycle-toggle'
    ];
    
    billingToggleSelectors.forEach(selector => {
      document.addEventListener('change', (e) => {
        const target = e.target.closest(selector);
        if (target) {
          console.log('Billing cycle changed:', target);
          this.handleBillingCycleChange(target);
        }
      });
    });
  }
  
  // 处理支付链接点击
  handlePaymentLinkClick(link) {
    const extractedData = {
      action: 'payment_link_click',
      url: link.href,
      text: link.textContent.trim(),
      pageTitle: document.title,
      content: document.body.innerText.substring(0, 2000)
    };
    
    this.sendPaymentDetection(extractedData);
  }
  
  // 处理支付表单提交
  handlePaymentFormSubmit(form) {
    const extractedData = {
      action: 'payment_form_submit',
      formAction: form.action,
      pageTitle: document.title,
      content: document.body.innerText.substring(0, 2000)
    };
    
    this.sendPaymentDetection(extractedData);
  }
  
  // 处理支付按钮点击
  handlePaymentButtonClick(button) {
    const extractedData = {
      action: 'payment_button_click',
      buttonText: button.textContent.trim(),
      buttonClass: button.className,
      pageTitle: document.title,
      content: document.body.innerText.substring(0, 2000)
    };
    
    this.sendPaymentDetection(extractedData);
  }
  
  // 处理支付页面检测
  handlePaymentPageDetection() {
    this.paymentDetected = true;
    
    const extractedData = {
      action: 'payment_page_detected',
      pageTitle: document.title,
      content: document.body.innerText.substring(0, 2000),
      url: window.location.href
    };
    
    this.sendPaymentDetection(extractedData);
  }
  
  // 处理订阅按钮点击
  handleSubscriptionButtonClick(button) {
    const extractedData = {
      action: 'subscription_button_click',
      buttonText: button.textContent.trim(),
      buttonClass: button.className,
      pageTitle: document.title,
      ...this.extractSubscriptionContext(button)
    };
    
    this.sendSubscriptionAction(extractedData);
  }
  
  // 处理套餐选择
  handlePlanSelection(planElement) {
    const extractedData = {
      action: 'plan_selected',
      planName: this.extractPlanName(planElement),
      planPrice: this.extractPlanPrice(planElement),
      pageTitle: document.title,
      ...this.extractSubscriptionContext(planElement)
    };
    
    this.sendSubscriptionAction(extractedData);
  }
  
  // 处理计费周期变化
  handleBillingCycleChange(element) {
    const extractedData = {
      action: 'billing_cycle_changed',
      cycleValue: element.value || element.checked,
      pageTitle: document.title,
      ...this.extractSubscriptionContext(element)
    };
    
    this.sendSubscriptionAction(extractedData);
  }
  
  // 判断是否为订阅操作
  isSubscriptionAction(element) {
    const text = element.textContent.toLowerCase();
    const subscriptionKeywords = [
      'subscribe', 'upgrade', 'get started', 'choose plan',
      'select plan', '订阅', '升级', '选择套餐'
    ];
    
    return subscriptionKeywords.some(keyword => text.includes(keyword));
  }
  
  // 提取订阅上下文信息
  extractSubscriptionContext(element) {
    const context = {};
    
    // 查找最近的价格信息
    const priceElement = element.closest('.pricing-card, .plan-card') || 
                        element.querySelector('.price, [class*="price"]');
    if (priceElement) {
      const priceText = priceElement.textContent;
      const priceMatch = priceText.match(/\$\d+(?:\.\d{2})?/);
      if (priceMatch) {
        context.detectedPrice = priceMatch[0];
        context.priceAmount = parseFloat(priceMatch[0].replace('$', ''));
      }
    }
    
    // 检测计费周期
    const contextText = element.closest('.pricing-card, .plan-card')?.textContent.toLowerCase() || '';
    if (contextText.includes('month')) {
      context.billingCycle = 'monthly';
    } else if (contextText.includes('year') || contextText.includes('annual')) {
      context.billingCycle = 'yearly';
    }
    
    return context;
  }
  
  // 提取套餐名称
  extractPlanName(planElement) {
    const nameSelectors = [
      '.plan-name',
      '.tier-name',
      'h2',
      'h3',
      '.title'
    ];
    
    for (const selector of nameSelectors) {
      const nameElement = planElement.querySelector(selector);
      if (nameElement) {
        return nameElement.textContent.trim();
      }
    }
    
    return 'Unknown Plan';
  }
  
  // 提取套餐价格
  extractPlanPrice(planElement) {
    const priceSelectors = [
      '.price',
      '.cost',
      '.amount',
      '[class*="price"]'
    ];
    
    for (const selector of priceSelectors) {
      const priceElement = planElement.querySelector(selector);
      if (priceElement) {
        const priceMatch = priceElement.textContent.match(/\$\d+(?:\.\d{2})?/);
        if (priceMatch) {
          return {
            text: priceMatch[0],
            amount: parseFloat(priceMatch[0].replace('$', ''))
          };
        }
      }
    }
    
    return null;
  }
  
  // 发送支付检测消息
  sendPaymentDetection(data) {
    chrome.runtime.sendMessage({
      action: 'paymentDetected',
      data: data
    });
  }
  
  // 发送订阅行为消息
  sendSubscriptionAction(data) {
    chrome.runtime.sendMessage({
      action: 'subscriptionAction',
      data: data
    });
  }
}

// 初始化检测器
if (!window.subscriptionDetector) {
  window.subscriptionDetector = new SubscriptionDetector();
}