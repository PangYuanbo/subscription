// Background script - handles extension lifecycle and message passing

// Subscription service detection rules
const SUBSCRIPTION_PATTERNS = {
  // URL patterns
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
  
  // Payment software and payment link patterns
  paymentPatterns: [
    // Payment service providers
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
    
    // Chinese payment platforms
    /alipay\.com/i,
    /pay\.weixin\.qq\.com/i,
    /wxpay\.wxutil\.com/i,
    /unionpay\.com/i,
    
    // Platform internal payments
    /apple\.com\/.*\/checkout/i,
    /store\.steampowered\.com\/checkout/i,
    /play\.google\.com\/store\/account/i,
    /amazon\.com\/gp\/buy/i,
    /microsoft\.com\/.*\/checkout/i,
    
    // General payment keywords
    /\/pay\//i,
    /\/payment\//i,
    /\/checkout\//i,
    /\/purchase\//i,
    /\/buy\//i,
    /\/order\//i,
    /\/cart\//i,
    /\/billing\//i
  ],
  
  // Page content keywords
  contentKeywords: [
    'subscribe', 'subscription', 'billing', 'payment',
    'monthly', 'yearly', 'annual', 'premium', 'pro',
    'upgrade', 'checkout', 'purchase', 'buy now',
    'subscription', 'payment', 'upgrade', 'purchase', 'monthly fee', 'annual fee'
  ],
  
  // Price matching patterns
  pricePatterns: [
    /\$\d+(?:\.\d{2})?[\s]*(?:\/(?:month|year|mo|yr))?/gi,
    /¥\d+(?:\.\d{2})?[\s]*(?:\/(?:month|year))?/gi,
    /€\d+(?:\.\d{2})?[\s]*(?:\/(?:month|year|mo|yr))?/gi
  ]
};

// Service identification mapping
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

// Listen for messages from content scripts
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
  
  return true; // Keep message channel open
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    checkIfSubscriptionPage(tab);
  }
});

// Check if this is a subscription service page
function checkIfSubscriptionPage(tab) {
  const url = new URL(tab.url);
  const domain = url.hostname;
  
  // Check URL patterns
  const isSubscriptionUrl = SUBSCRIPTION_PATTERNS.urlPatterns.some(pattern => 
    pattern.test(tab.url)
  );
  
  // Check payment link patterns
  const isPaymentUrl = SUBSCRIPTION_PATTERNS.paymentPatterns.some(pattern => 
    pattern.test(tab.url)
  );
  
  // Check if this is a known service domain
  const isKnownService = Object.keys(SERVICE_MAPPING).some(serviceDomain => 
    domain.includes(serviceDomain)
  );
  
  if (isSubscriptionUrl || isPaymentUrl || isKnownService) {
    console.log('Detected potential subscription/payment page:', tab.url);
    
    // Inject content script for deep detection
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    }).catch(err => {
      console.log('Script already injected or error:', err);
    });
  }
}

// Handle subscription detection
function handleSubscriptionDetection(data, tab) {
  console.log('Processing subscription detection:', data);
  
  // Identify service information
  const serviceInfo = identifyService(tab.url, data.pageTitle);
  
  // Extract price information
  const priceInfo = extractPriceInfo(data.content);
  
  // Merge extracted information
  const extractedInfo = {
    ...serviceInfo,
    ...priceInfo,
    url: tab.url,
    detectedAt: new Date().toISOString()
  };
  
  console.log('Extracted subscription info:', extractedInfo);
  
  // Show notification
  showNotification(
    'Detected subscription service',
    `Found ${extractedInfo.serviceName} subscription page`
  );
  
  // Store extracted information
  chrome.storage.local.set({
    'pendingSubscription': extractedInfo
  });
}

// Identify service information
function identifyService(url, pageTitle) {
  const domain = new URL(url).hostname;
  
  // Find matching service
  for (const [serviceDomain, serviceInfo] of Object.entries(SERVICE_MAPPING)) {
    if (domain.includes(serviceDomain)) {
      return {
        serviceName: serviceInfo.name,
        category: serviceInfo.category,
        domain: domain
      };
    }
  }
  
  // If no matching service found, try to extract from page title
  const titleWords = pageTitle.split(/\s+/);
  const serviceName = titleWords[0] || domain.split('.')[0];
  
  return {
    serviceName: serviceName.charAt(0).toUpperCase() + serviceName.slice(1),
    category: 'Other',
    domain: domain
  };
}

// Extract price information
function extractPriceInfo(content) {
  const priceInfo = {};
  
  // Use regular expressions to extract prices
  SUBSCRIPTION_PATTERNS.pricePatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      // Analyze price and billing cycle
      matches.forEach(match => {
        const price = parseFloat(match.replace(/[^\d.]/g, ''));
        const isYearly = /year|annual|yr/i.test(match);
        const isMonthly = /month|monthly|mo/i.test(match);
        
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

// Show notification
function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: title,
    message: message
  });
}

// Handle payment detection
function handlePaymentDetection(data, tab) {
  console.log('Processing payment detection:', data);
  
  // Identify service information
  const serviceInfo = identifyService(tab.url, data.pageTitle);
  
  // Extract payment-related information
  const paymentInfo = extractPaymentInfo(data);
  
  // Merge extracted information
  const extractedInfo = {
    ...serviceInfo,
    ...paymentInfo,
    url: tab.url,
    detectedAt: new Date().toISOString(),
    triggerType: 'payment'
  };
  
  console.log('Extracted payment info:', extractedInfo);
  
  // Show notification
  showNotification(
    '🔔 Payment activity detected',
    `Making payment for ${extractedInfo.serviceName}, record subscription?`
  );
  
  // Store extracted information
  chrome.storage.local.set({
    'pendingSubscription': extractedInfo
  });
  
  // Automatically show subscription form
  setTimeout(() => {
    openSubscriptionPopup(extractedInfo);
  }, 1000);
}

// Handle subscription action
function handleSubscriptionAction(data, tab) {
  console.log('Processing subscription action:', data);
  
  // Identify service information
  const serviceInfo = identifyService(tab.url, data.pageTitle);
  
  // Merge information
  const extractedInfo = {
    ...serviceInfo,
    ...data,
    url: tab.url,
    detectedAt: new Date().toISOString(),
    triggerType: 'subscription_action'
  };
  
  console.log('Extracted subscription action info:', extractedInfo);
  
  // Show notification
  showNotification(
    '🎯 Subscription action detected',
    `Detected ${extractedInfo.serviceName} subscription action`
  );
  
  // Store extracted information
  chrome.storage.local.set({
    'pendingSubscription': extractedInfo
  });
  
  // Automatically show subscription form
  setTimeout(() => {
    openSubscriptionPopup(extractedInfo);
  }, 500);
}

// Extract payment-related information
function extractPaymentInfo(data) {
  const paymentInfo = {
    isPaymentFlow: true
  };
  
  // Extract amount from page content
  if (data.content) {
    const priceMatches = data.content.match(/\$\d+(?:\.\d{2})?/g);
    if (priceMatches && priceMatches.length > 0) {
      paymentInfo.detectedPrice = priceMatches[0];
      paymentInfo.priceAmount = parseFloat(priceMatches[0].replace('$', ''));
    }
  }
  
  // Detect payment methods
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
    if (/alipay/i.test(data.content)) {
      paymentMethods.push('alipay');
    }
    if (/wechat/i.test(data.content)) {
      paymentMethods.push('wechat_pay');
    }
    
    paymentInfo.paymentMethods = paymentMethods;
  }
  
  return paymentInfo;
}

// Open subscription popup
function openSubscriptionPopup(data) {
  chrome.windows.create({
    url: chrome.runtime.getURL('popup.html'),
    type: 'popup',
    width: 400,
    height: 600
  });
}