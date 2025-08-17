// 弹窗脚本 - 处理订阅信息表单和提交

class SubscriptionPopup {
  constructor() {
    this.extractedData = null;
    this.init();
  }
  
  async init() {
    console.log('Initializing popup');
    
    // 加载检测到的订阅数据
    await this.loadPendingSubscription();
    
    // 设置事件监听
    this.setupEventListeners();
    
    // 设置默认日期
    this.setDefaultDate();
  }
  
  async loadPendingSubscription() {
    try {
      const result = await chrome.storage.local.get(['pendingSubscription']);
      
      if (result.pendingSubscription) {
        this.extractedData = result.pendingSubscription;
        this.displaySubscriptionInfo();
      } else {
        this.showNoDetection();
      }
    } catch (error) {
      console.error('Error loading pending subscription:', error);
      this.showNoDetection();
    }
  }
  
  displaySubscriptionInfo() {
    document.getElementById('loading-status').style.display = 'none';
    document.getElementById('subscription-form').style.display = 'block';
    
    // 显示服务名称
    const serviceNameEl = document.getElementById('service-name');
    serviceNameEl.textContent = this.extractedData.serviceName || '未知服务';
    
    // 显示价格信息
    if (this.extractedData.prices && this.extractedData.prices.length > 0) {
      this.displayPriceInfo();
    }
    
    // 预填表单数据
    this.prefillForm();
  }
  
  displayPriceInfo() {
    const priceInfoEl = document.getElementById('price-info');
    priceInfoEl.style.display = 'block';
    
    const prices = this.extractedData.prices.slice(0, 3); // 显示最多3个价格
    const priceHtml = prices.map(price => `
      <div class="price-item">
        <span>${price.text}</span>
        <span>${price.period}</span>
      </div>
    `).join('');
    
    priceInfoEl.innerHTML = `
      <strong style="display: block; margin-bottom: 8px;">检测到的价格:</strong>
      ${priceHtml}
    `;
  }
  
  prefillForm() {
    // 预填计费周期
    if (this.extractedData.billingOptions && this.extractedData.billingOptions.length > 0) {
      const billingCycle = this.extractedData.billingOptions[0];
      document.getElementById('billing-cycle').value = billingCycle;
    }
    
    // 预填价格
    if (this.extractedData.prices && this.extractedData.prices.length > 0) {
      const price = this.extractedData.prices[0];
      document.getElementById('cost').value = price.amount;
      
      // 设置对应的计费周期
      if (price.period !== 'unknown') {
        document.getElementById('billing-cycle').value = price.period;
      }
    }
  }
  
  setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('payment-date').value = today;
  }
  
  showNoDetection() {
    document.getElementById('loading-status').style.display = 'none';
    document.getElementById('no-detection').style.display = 'block';
  }
  
  setupEventListeners() {
    // 表单提交
    document.getElementById('subscription-data-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleFormSubmit();
    });
    
    // 计费周期变化时更新费用标签
    document.getElementById('billing-cycle').addEventListener('change', (e) => {
      this.updateCostLabel(e.target.value);
    });
  }
  
  updateCostLabel(billingCycle) {
    const costLabel = document.querySelector('label[for="cost"]');
    if (billingCycle === 'yearly') {
      costLabel.textContent = '年费金额';
    } else if (billingCycle === 'monthly') {
      costLabel.textContent = '月费金额';
    } else {
      costLabel.textContent = '费用';
    }
  }
  
  async handleFormSubmit() {
    const submitBtn = document.getElementById('submit-btn');
    const errorEl = document.getElementById('error-message');
    const successEl = document.getElementById('success-message');
    
    // 隐藏之前的消息
    errorEl.style.display = 'none';
    successEl.style.display = 'none';
    
    // 禁用提交按钮
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="loading-spinner"></div>提交中...';
    
    try {
      // 收集表单数据
      const formData = this.collectFormData();
      
      // 验证数据
      if (!this.validateFormData(formData)) {
        throw new Error('请填写所有必需字段');
      }
      
      // 提交到主应用
      await this.submitToMainApp(formData);
      
      // 显示成功消息
      successEl.textContent = '订阅添加成功！';
      successEl.style.display = 'block';
      
      // 清理存储的数据
      await chrome.storage.local.remove(['pendingSubscription']);
      
      // 延迟关闭窗口
      setTimeout(() => {
        window.close();
      }, 1500);
      
    } catch (error) {
      console.error('Form submission error:', error);
      errorEl.textContent = error.message || '提交失败，请重试';
      errorEl.style.display = 'block';
    } finally {
      // 恢复提交按钮
      submitBtn.disabled = false;
      submitBtn.textContent = '添加订阅';
    }
  }
  
  collectFormData() {
    const cost = parseFloat(document.getElementById('cost').value);
    const billingCycle = document.getElementById('billing-cycle').value;
    
    return {
      serviceName: this.extractedData?.serviceName || '未知服务',
      category: this.extractedData?.category || 'Other',
      account: document.getElementById('account').value,
      cost: cost,
      billing_cycle: billingCycle,
      monthly_cost: billingCycle === 'yearly' ? cost / 12 : cost,
      payment_date: document.getElementById('payment-date').value,
      url: this.extractedData?.url,
      detectedAt: this.extractedData?.detectedAt
    };
  }
  
  validateFormData(data) {
    return data.account && 
           data.cost > 0 && 
           data.billing_cycle && 
           data.payment_date;
  }
  
  async submitToMainApp(data) {
    // 构造订阅数据
    const subscriptionData = {
      service_id: 'custom',
      service: {
        id: 'custom',
        name: data.serviceName,
        category: data.category
      },
      account: data.account,
      payment_date: data.payment_date,
      cost: data.cost,
      billing_cycle: data.billing_cycle,
      monthly_cost: data.monthly_cost
    };
    
    // 尝试发送到本地主应用
    try {
      const response = await fetch('http://localhost:5173/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriptionData)
      });
      
      if (!response.ok) {
        throw new Error('网络请求失败');
      }
      
      const result = await response.json();
      console.log('Subscription added successfully:', result);
      
    } catch (error) {
      console.log('Direct API call failed, trying alternative method:', error);
      
      // 如果直接API调用失败，尝试通过消息传递
      await this.submitViaMessage(subscriptionData);
    }
  }
  
  async submitViaMessage(subscriptionData) {
    // 存储数据供主应用读取
    await chrome.storage.local.set({
      'newSubscription': {
        ...subscriptionData,
        timestamp: Date.now()
      }
    });
    
    // 通知主应用有新订阅数据
    chrome.runtime.sendMessage({
      action: 'newSubscriptionAdded',
      data: subscriptionData
    });
  }
}

// 初始化弹窗
document.addEventListener('DOMContentLoaded', () => {
  new SubscriptionPopup();
});