// Content script - runs in web pages, detects subscription services and extracts information

class SubscriptionDetector {
  constructor() {
    this.paymentDetected = false;
    this.subscriptionActionDetected = false;
    this.init();
  }
  
  init() {
    // Wait for page to load before starting detection
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.startDetection());
    } else {
      this.startDetection();
    }
    
    // Immediately start monitoring payment and subscription behavior
    this.startPaymentMonitoring();
    this.startSubscriptionActionMonitoring();
  }
  
  startDetection() {
    console.log('Starting subscription detection on:', window.location.href);
    
    // Detect subscription-related content
    const detectionResult = this.detectSubscriptionContent();
    
    if (detectionResult.isSubscriptionPage) {
      console.log('Subscription page detected:', detectionResult);
      
      // Extract detailed information
      const extractedData = this.extractSubscriptionData();
      
      // Send to background script
      chrome.runtime.sendMessage({
        action: 'detectSubscription',
        data: {
          ...detectionResult,
          ...extractedData
        }
      });
      
      // Show extension prompt interface
      this.showSubscriptionPrompt(extractedData);
    }
    
    // Monitor page changes (SPA applications)
    this.observePageChanges();
  }
  
  detectSubscriptionContent() {
    const pageText = document.body.innerText.toLowerCase();
    const pageTitle = document.title;
    const url = window.location.href;
    
    // Check URL keywords
    const urlKeywords = ['subscribe', 'billing', 'checkout', 'pricing', 'plans', 'payment', 'premium', 'pro'];
    const hasUrlKeyword = urlKeywords.some(keyword => url.toLowerCase().includes(keyword));
    
    // Check page content keywords
    const contentKeywords = [
      'subscribe', 'subscription', 'billing', 'payment', 'monthly', 'yearly', 
      'annual', 'premium', 'pro', 'upgrade', 'checkout', 'purchase', 'buy now',
      'subscription', 'payment', 'upgrade', 'purchase', 'monthly fee', 'annual fee', 'membership'
    ];
    const keywordMatches = contentKeywords.filter(keyword => pageText.includes(keyword));
    
    // Check price information
    const pricePatterns = [
      /\$\d+(?:\.\d{2})?[\s]*(?:\/(?:month|year|mo|yr))?/gi,
      /¥\d+(?:\.\d{2})?[\s]*(?:\/(?:month|year))?/gi,
      /€\d+(?:\.\d{2})?[\s]*(?:\/(?:month|year|mo|yr))?/gi
    ];
    const hasPricing = pricePatterns.some(pattern => pattern.test(pageText));
    
    // Check for subscription-related forms
    const hasSubscriptionForm = this.hasSubscriptionForm();
    
    // Determine if this is a subscription page
    const isSubscriptionPage = hasUrlKeyword || 
                              (keywordMatches.length >= 2) || 
                              hasPricing || 
                              hasSubscriptionForm;
    
    return {
      isSubscriptionPage,
      confidence: this.calculateConfidence(hasUrlKeyword, keywordMatches.length, hasPricing, hasSubscriptionForm),
      pageTitle,
      url,
      content: pageText.substring(0, 5000), // Limit content length
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
    // Check for subscription-related forms or buttons
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
    // Try to extract service name from page title
    const title = document.title;
    const titleParts = title.split(/[-|–—]/);
    
    // Try to extract from logo or brand elements
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
    
    // Extract domain from URL as fallback
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
    
    return [...new Set(planNames)]; // Remove duplicates
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
    
    return features.slice(0, 10); // Limit number of features
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
    // Check if prompt has already been shown
    if (document.querySelector('#subscription-tracker-prompt')) {
      return;
    }
    
    // Create prompt interface
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
            🎯 Subscription Service Detected
          </h3>
          <p style="margin: 0; font-size: 14px; color: #666;">
            Found subscription information for "${data.serviceName}"
          </p>
        </div>
        
        <div style="padding: 16px;">
          ${data.prices.length > 0 ? `
            <div style="margin-bottom: 12px;">
              <strong style="font-size: 14px; color: #333;">Detected prices:</strong>
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
            ">Add Subscription</button>
            
            <button id="dismiss-prompt-btn" style="
              background: #f3f4f6;
              color: #374151;
              border: none;
              padding: 8px 12px;
              border-radius: 6px;
              font-size: 14px;
              cursor: pointer;
            ">Dismiss</button>
          </div>
        </div>
      </div>
    `;
    
    // Add to page
    document.body.insertAdjacentHTML('beforeend', promptHtml);
    
    // Add event listeners
    document.getElementById('add-subscription-btn').addEventListener('click', () => {
      this.openSubscriptionForm(data);
    });
    
    document.getElementById('dismiss-prompt-btn').addEventListener('click', () => {
      document.getElementById('subscription-tracker-prompt').remove();
    });
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      const prompt = document.getElementById('subscription-tracker-prompt');
      if (prompt) {
        prompt.style.opacity = '0.7';
      }
    }, 5000);
  }
  
  openSubscriptionForm(data) {
    // Send message to background script to open form
    chrome.runtime.sendMessage({
      action: 'openPopup',
      data: data
    });
    
    // Remove prompt
    document.getElementById('subscription-tracker-prompt').remove();
  }
  
  observePageChanges() {
    // Monitor SPA route changes
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        setTimeout(() => this.startDetection(), 1000); // Delayed detection
      }
    }).observe(document, { subtree: true, childList: true });
  }
  
  // Start payment behavior monitoring
  startPaymentMonitoring() {
    console.log('Starting payment monitoring');
    
    // Monitor payment-related link clicks
    this.monitorPaymentLinks();
    
    // Monitor payment form submissions
    this.monitorPaymentForms();
    
    // Monitor payment button clicks
    this.monitorPaymentButtons();
    
    // Detect payment page redirects
    this.detectPaymentRedirects();
  }
  
  // Monitor payment links
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
  
  // Monitor payment forms
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
  
  // Monitor payment buttons
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
  
  // Detect payment page redirects
  detectPaymentRedirects() {
    const currentUrl = window.location.href;
    
    // Check if current URL is a payment page
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
  
  // Start subscription behavior monitoring
  startSubscriptionActionMonitoring() {
    console.log('Starting subscription action monitoring');
    
    // Monitor subscription button clicks
    this.monitorSubscriptionButtons();
    
    // Monitor plan selection
    this.monitorPlanSelection();
    
    // Monitor billing cycle changes
    this.monitorBillingCycleChanges();
  }
  
  // Monitor subscription buttons
  monitorSubscriptionButtons() {
    const subscriptionButtonSelectors = [
      'button[class*="subscribe"]',
      'button[class*="upgrade"]',
      'a[class*="subscribe"]',
      'a[class*="upgrade"]',
      'button:contains("Subscribe")',
      'button:contains("Upgrade")',
      'button:contains("Subscribe")',
      'button:contains("Upgrade")',
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
  
  // Monitor plan selection
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
  
  // Monitor billing cycle changes
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
  
  // Handle payment link clicks
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
  
  // Handle payment form submissions
  handlePaymentFormSubmit(form) {
    const extractedData = {
      action: 'payment_form_submit',
      formAction: form.action,
      pageTitle: document.title,
      content: document.body.innerText.substring(0, 2000)
    };
    
    this.sendPaymentDetection(extractedData);
  }
  
  // Handle payment button clicks
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
  
  // Handle payment page detection
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
  
  // Handle subscription button clicks
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
  
  // Handle plan selection
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
  
  // Handle billing cycle changes
  handleBillingCycleChange(element) {
    const extractedData = {
      action: 'billing_cycle_changed',
      cycleValue: element.value || element.checked,
      pageTitle: document.title,
      ...this.extractSubscriptionContext(element)
    };
    
    this.sendSubscriptionAction(extractedData);
  }
  
  // Determine if this is a subscription action
  isSubscriptionAction(element) {
    const text = element.textContent.toLowerCase();
    const subscriptionKeywords = [
      'subscribe', 'upgrade', 'get started', 'choose plan',
      'select plan', 'subscribe', 'upgrade', 'choose plan'
    ];
    
    return subscriptionKeywords.some(keyword => text.includes(keyword));
  }
  
  // Extract subscription context information
  extractSubscriptionContext(element) {
    const context = {};
    
    // Find nearby price information
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
    
    // Detect billing cycle
    const contextText = element.closest('.pricing-card, .plan-card')?.textContent.toLowerCase() || '';
    if (contextText.includes('month')) {
      context.billingCycle = 'monthly';
    } else if (contextText.includes('year') || contextText.includes('annual')) {
      context.billingCycle = 'yearly';
    }
    
    return context;
  }
  
  // Extract plan name
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
  
  // Extract plan price
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
  
  // Send payment detection message
  sendPaymentDetection(data) {
    chrome.runtime.sendMessage({
      action: 'paymentDetected',
      data: data
    });
  }
  
  // Send subscription action message
  sendSubscriptionAction(data) {
    chrome.runtime.sendMessage({
      action: 'subscriptionAction',
      data: data
    });
  }
}

// Initialize detector
if (!window.subscriptionDetector) {
  window.subscriptionDetector = new SubscriptionDetector();
}