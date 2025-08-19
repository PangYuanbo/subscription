// Popup script - handles subscription information form and submission

class SubscriptionPopup {
  constructor() {
    this.extractedData = null;
    this.init();
  }
  
  async init() {
    console.log('Initializing popup');
    
    // Load detected subscription data
    await this.loadPendingSubscription();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Set default date
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
    
    // Display service name
    const serviceNameEl = document.getElementById('service-name');
    serviceNameEl.textContent = this.extractedData.serviceName || 'Unknown Service';
    
    // Display price information
    if (this.extractedData.prices && this.extractedData.prices.length > 0) {
      this.displayPriceInfo();
    }
    
    // Pre-fill form data
    this.prefillForm();
  }
  
  displayPriceInfo() {
    const priceInfoEl = document.getElementById('price-info');
    priceInfoEl.style.display = 'block';
    
    const prices = this.extractedData.prices.slice(0, 3); // Display up to 3 prices
    const priceHtml = prices.map(price => `
      <div class="price-item">
        <span>${price.text}</span>
        <span>${price.period}</span>
      </div>
    `).join('');
    
    priceInfoEl.innerHTML = `
      <strong style="display: block; margin-bottom: 8px;">Detected prices:</strong>
      ${priceHtml}
    `;
  }
  
  prefillForm() {
    // Pre-fill billing cycle
    if (this.extractedData.billingOptions && this.extractedData.billingOptions.length > 0) {
      const billingCycle = this.extractedData.billingOptions[0];
      document.getElementById('billing-cycle').value = billingCycle;
    }
    
    // Pre-fill price
    if (this.extractedData.prices && this.extractedData.prices.length > 0) {
      const price = this.extractedData.prices[0];
      document.getElementById('cost').value = price.amount;
      
      // Set corresponding billing cycle
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
    // Form submission
    document.getElementById('subscription-data-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleFormSubmit();
    });
    
    // Update cost label when billing cycle changes
    document.getElementById('billing-cycle').addEventListener('change', (e) => {
      this.updateCostLabel(e.target.value);
    });
  }
  
  updateCostLabel(billingCycle) {
    const costLabel = document.querySelector('label[for="cost"]');
    if (billingCycle === 'yearly') {
      costLabel.textContent = 'Annual Amount';
    } else if (billingCycle === 'monthly') {
      costLabel.textContent = 'Monthly Amount';
    } else {
      costLabel.textContent = 'Cost';
    }
  }
  
  async handleFormSubmit() {
    const submitBtn = document.getElementById('submit-btn');
    const errorEl = document.getElementById('error-message');
    const successEl = document.getElementById('success-message');
    
    // Hide previous messages
    errorEl.style.display = 'none';
    successEl.style.display = 'none';
    
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="loading-spinner"></div>Submitting...';
    
    try {
      // Collect form data
      const formData = this.collectFormData();
      
      // Validate data
      if (!this.validateFormData(formData)) {
        throw new Error('Please fill in all required fields');
      }
      
      // Submit to main application
      await this.submitToMainApp(formData);
      
      // Show success message
      successEl.textContent = 'Subscription added successfully!';
      successEl.style.display = 'block';
      
      // Clean up stored data
      await chrome.storage.local.remove(['pendingSubscription']);
      
      // Delay window close
      setTimeout(() => {
        window.close();
      }, 1500);
      
    } catch (error) {
      console.error('Form submission error:', error);
      errorEl.textContent = error.message || 'Submission failed, please try again';
      errorEl.style.display = 'block';
    } finally {
      // Restore submit button
      submitBtn.disabled = false;
      submitBtn.textContent = 'Add Subscription';
    }
  }
  
  collectFormData() {
    const cost = parseFloat(document.getElementById('cost').value);
    const billingCycle = document.getElementById('billing-cycle').value;
    
    return {
      serviceName: this.extractedData?.serviceName || 'Unknown Service',
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
    // Construct subscription data
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
    
    // Try to send to local main application
    try {
      const response = await fetch('http://localhost:5173/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriptionData)
      });
      
      if (!response.ok) {
        throw new Error('Network request failed');
      }
      
      const result = await response.json();
      console.log('Subscription added successfully:', result);
      
    } catch (error) {
      console.log('Direct API call failed, trying alternative method:', error);
      
      // If direct API call fails, try alternative method via message passing
      await this.submitViaMessage(subscriptionData);
    }
  }
  
  async submitViaMessage(subscriptionData) {
    // Store data for main application to read
    await chrome.storage.local.set({
      'newSubscription': {
        ...subscriptionData,
        timestamp: Date.now()
      }
    });
    
    // Notify main application of new subscription data
    chrome.runtime.sendMessage({
      action: 'newSubscriptionAdded',
      data: subscriptionData
    });
  }
}

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  new SubscriptionPopup();
});