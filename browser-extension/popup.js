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
    
    // Show NLP button if no specific data was detected
    if (!this.extractedData.prices || this.extractedData.prices.length === 0) {
      document.getElementById('nlp-btn').style.display = 'inline-block';
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
    
    // Toggle trial details visibility
    document.getElementById('is-trial').addEventListener('change', (e) => {
      this.toggleTrialDetails(e.target.checked);
    });
    
    // NLP section navigation
    document.getElementById('nlp-btn')?.addEventListener('click', () => {
      this.showNLPSection();
    });
    
    document.getElementById('back-to-form-btn')?.addEventListener('click', () => {
      this.showFormSection();
    });
    
    // NLP form submission
    document.getElementById('nlp-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleNLPSubmit();
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
  
  toggleTrialDetails(isVisible) {
    const trialDetails = document.getElementById('trial-details');
    trialDetails.style.display = isVisible ? 'block' : 'none';
    
    if (isVisible) {
      // Set default trial start date to today
      const today = new Date().toISOString().split('T')[0];
      document.getElementById('trial-start-date').value = today;
      
      // Set default trial duration to 30 days
      document.getElementById('trial-duration').value = 30;
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
    const isTrial = document.getElementById('is-trial').checked;
    
    const data = {
      serviceName: this.extractedData?.serviceName || 'Unknown Service',
      category: this.extractedData?.category || 'Other',
      account: document.getElementById('account').value,
      cost: cost,
      billing_cycle: billingCycle,
      monthly_cost: billingCycle === 'yearly' ? cost / 12 : cost,
      payment_date: document.getElementById('payment-date').value,
      url: this.extractedData?.url,
      detectedAt: this.extractedData?.detectedAt,
      is_trial: isTrial
    };
    
    // Add trial-specific data if applicable
    if (isTrial) {
      const trialDuration = document.getElementById('trial-duration').value;
      const trialStartDate = document.getElementById('trial-start-date').value;
      
      if (trialDuration) {
        data.trial_duration_days = parseInt(trialDuration);
      }
      
      if (trialStartDate) {
        data.trial_start_date = trialStartDate;
        
        // Calculate trial end date
        const startDate = new Date(trialStartDate);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + (parseInt(trialDuration) || 30));
        data.trial_end_date = endDate.toISOString().split('T')[0];
      }
    }
    
    return data;
  }
  
  validateFormData(data) {
    return data.account && 
           data.cost > 0 && 
           data.billing_cycle && 
           data.payment_date;
  }
  
  async submitToMainApp(data) {
    // Construct subscription data with new structure
    const subscriptionData = {
      service_id: 'custom',
      service: {
        name: data.serviceName,
        category: data.category,
        icon_url: this.extractedData?.iconUrl || ''
      },
      account: data.account,
      payment_date: data.payment_date,
      cost: data.cost,
      billing_cycle: data.billing_cycle,
      monthly_cost: data.monthly_cost,
      is_trial: data.is_trial || false
    };
    
    // Add trial fields if applicable
    if (data.is_trial) {
      if (data.trial_start_date) subscriptionData.trial_start_date = data.trial_start_date;
      if (data.trial_end_date) subscriptionData.trial_end_date = data.trial_end_date;
      if (data.trial_duration_days) subscriptionData.trial_duration_days = data.trial_duration_days;
    }
    
    // Get stored auth token if available
    const authData = await this.getStoredAuthData();
    
    // Try multiple endpoints in order of preference
    const endpoints = [
      'https://subscription-tracker-backend.modal.run/subscriptions',
      'http://localhost:8000/subscriptions',
      'http://localhost:5173/api/subscriptions'
    ];
    
    let lastError = null;
    
    for (const endpoint of endpoints) {
      try {
        const headers = {
          'Content-Type': 'application/json',
        };
        
        // Add auth header if available
        if (authData && authData.access_token) {
          headers['Authorization'] = `Bearer ${authData.access_token}`;
        }
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(subscriptionData)
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('Subscription added successfully:', result);
          return; // Success, exit function
        } else {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
      } catch (error) {
        console.log(`Failed to submit to ${endpoint}:`, error);
        lastError = error;
        continue; // Try next endpoint
      }
    }
    
    // If all endpoints failed, try alternative method
    console.log('All direct API calls failed, trying alternative method');
    await this.submitViaMessage(subscriptionData);
  }
  
  async getStoredAuthData() {
    try {
      const result = await chrome.storage.local.get(['authData']);
      return result.authData || null;
    } catch (error) {
      console.error('Error getting stored auth data:', error);
      return null;
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
  
  showNLPSection() {
    document.getElementById('subscription-form').style.display = 'none';
    document.getElementById('nlp-section').style.display = 'block';
  }
  
  showFormSection() {
    document.getElementById('subscription-form').style.display = 'block';
    document.getElementById('nlp-section').style.display = 'none';
  }
  
  async handleNLPSubmit() {
    const submitBtn = document.getElementById('nlp-submit-btn');
    const errorEl = document.getElementById('nlp-error');
    const successEl = document.getElementById('nlp-success');
    
    // Hide previous messages
    errorEl.style.display = 'none';
    successEl.style.display = 'none';
    
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="loading-spinner"></div>Processing...';
    
    try {
      const text = document.getElementById('nlp-text').value.trim();
      if (!text) {
        throw new Error('Please enter a subscription description');
      }
      
      // Submit to NLP API
      await this.submitNLPRequest(text);
      
      // Show success message
      successEl.textContent = 'Subscription parsed and added successfully!';
      successEl.style.display = 'block';
      
      // Clean up stored data
      await chrome.storage.local.remove(['pendingSubscription']);
      
      // Delay window close
      setTimeout(() => {
        window.close();
      }, 1500);
      
    } catch (error) {
      console.error('NLP submission error:', error);
      errorEl.textContent = error.message || 'Failed to process description, please try again';
      errorEl.style.display = 'block';
    } finally {
      // Restore submit button
      submitBtn.disabled = false;
      submitBtn.textContent = '🤖 Parse & Add';
    }
  }
  
  async submitNLPRequest(text) {
    const authData = await this.getStoredAuthData();
    
    const endpoints = [
      'https://subscription-tracker-backend.modal.run/subscriptions/nlp',
      'http://localhost:8000/subscriptions/nlp'
    ];
    
    const requestData = { text: text };
    
    for (const endpoint of endpoints) {
      try {
        const headers = {
          'Content-Type': 'application/json',
        };
        
        // Add auth header if available
        if (authData && authData.access_token) {
          headers['Authorization'] = `Bearer ${authData.access_token}`;
        }
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(requestData)
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('NLP subscription processed successfully:', result);
          return; // Success, exit function
        } else {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
      } catch (error) {
        console.log(`Failed to submit NLP to ${endpoint}:`, error);
        if (endpoint === endpoints[endpoints.length - 1]) {
          // Last endpoint failed, throw error
          throw new Error('Unable to process subscription description. Please check your connection and try again.');
        }
        continue; // Try next endpoint
      }
    }
  }
}

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  new SubscriptionPopup();
});