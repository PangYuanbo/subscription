# API Documentation

This document provides comprehensive documentation for the Subscription Manager backend API endpoints, request/response formats, and integration guidelines.

## API Overview

### Base Information

- **Base URL**: `http://localhost:8000` (development) / `https://your-api-domain.com` (production)
- **Protocol**: HTTP/HTTPS
- **Format**: JSON
- **Framework**: FastAPI with automatic OpenAPI documentation

### Interactive Documentation

- **Swagger UI**: `GET /docs` - Interactive API exploration
- **ReDoc**: `GET /redoc` - Alternative documentation format
- **OpenAPI Schema**: `GET /openapi.json` - Machine-readable API specification

### Response Format

All API responses follow a consistent format:

**Success Response**:
```json
{
  "data": {}, // Response data
  "status": "success"
}
```

**Error Response**:
```json
{
  "detail": "Error message",
  "error_code": "VALIDATION_ERROR",
  "status_code": 400
}
```

## Core Endpoints

### Health Check

#### GET `/`
**Description**: Basic health check endpoint

**Response**:
```json
{
  "message": "Subscription Manager API",
  "status": "running"
}
```

**Status Codes**:
- `200`: API is running

---

## Subscription Management

### Get All Subscriptions

#### GET `/subscriptions`
**Description**: Retrieve all subscriptions with their associated service information

**Query Parameters**: None

**Response**:
```json
[
  {
    "id": "1",
    "service_id": "1",
    "account": "family@example.com",
    "payment_date": "2024-01-15T00:00:00",
    "cost": 19.99,
    "billing_cycle": "monthly",
    "monthly_cost": 19.99,
    "is_trial": false,
    "trial_start_date": null,
    "trial_end_date": null,
    "trial_duration_days": null,
    "created_at": "2024-01-01T12:00:00Z",
    "updated_at": "2024-01-01T12:00:00Z",
    "service": {
      "id": "1",
      "name": "Netflix",
      "icon_url": "",
      "category": "Streaming"
    }
  }
]
```

**Status Codes**:
- `200`: Success
- `500`: Internal server error

**Example Request**:
```bash
curl -X GET "http://localhost:8000/subscriptions" \
  -H "Accept: application/json"
```

### Create Subscription

#### POST `/subscriptions`
**Description**: Create a new subscription entry

**Request Body**:
```json
{
  "service_id": 1,
  "account": "user@example.com",
  "payment_date": "2024-01-15",
  "cost": 19.99,
  "billing_cycle": "monthly",
  "monthly_cost": 19.99,
  "is_trial": false,
  "trial_start_date": null,
  "trial_end_date": null,
  "trial_duration_days": null,
  "service": {
    "name": "Netflix",
    "icon_url": "",
    "category": "Streaming"
  }
}
```

**Required Fields**:
- `service_id`: Integer
- `account`: String (1-255 characters)
- `payment_date`: String (YYYY-MM-DD format)
- `cost`: Float (> 0)
- `billing_cycle`: Enum ("monthly" | "yearly")
- `monthly_cost`: Float (> 0)

**Optional Fields**:
- `is_trial`: Boolean (default: false)
- `trial_start_date`: String (YYYY-MM-DD format)
- `trial_end_date`: String (YYYY-MM-DD format)
- `trial_duration_days`: Integer (> 0)
- `service`: Object (auto-creates service if not exists)

**Response**: Same format as GET `/subscriptions` single item

**Status Codes**:
- `200`: Successfully created
- `400`: Invalid request data
- `422`: Validation error

**Example Request**:
```bash
curl -X POST "http://localhost:8000/subscriptions" \
  -H "Content-Type: application/json" \
  -d '{
    "service_id": 1,
    "account": "test@example.com",
    "payment_date": "2024-02-15",
    "cost": 15.99,
    "billing_cycle": "monthly",
    "monthly_cost": 15.99,
    "service": {
      "name": "Spotify",
      "category": "Music"
    }
  }'
```

### Update Subscription

#### PUT `/subscriptions/{subscription_id}`
**Description**: Update an existing subscription

**Path Parameters**:
- `subscription_id`: String - ID of the subscription to update

**Request Body** (all fields optional):
```json
{
  "account": "updated@example.com",
  "payment_date": "2024-02-20",
  "cost": 24.99,
  "billing_cycle": "yearly",
  "monthly_cost": 2.08,
  "is_trial": true,
  "trial_start_date": "2024-01-01",
  "trial_end_date": "2024-01-31",
  "trial_duration_days": 30
}
```

**Response**: Updated subscription object (same format as GET)

**Status Codes**:
- `200`: Successfully updated
- `404`: Subscription not found
- `400`: Invalid request data
- `422`: Validation error

**Example Request**:
```bash
curl -X PUT "http://localhost:8000/subscriptions/1" \
  -H "Content-Type: application/json" \
  -d '{
    "account": "newemail@example.com",
    "monthly_cost": 21.99
  }'
```

### Delete Subscription

#### DELETE `/subscriptions/{subscription_id}`
**Description**: Delete a subscription by ID

**Path Parameters**:
- `subscription_id`: String - ID of the subscription to delete

**Response**:
```json
{
  "message": "Subscription deleted successfully"
}
```

**Status Codes**:
- `200`: Successfully deleted
- `404`: Subscription not found

**Example Request**:
```bash
curl -X DELETE "http://localhost:8000/subscriptions/1"
```

---

## Analytics

### Get Analytics Data

#### GET `/analytics`
**Description**: Retrieve comprehensive analytics about subscriptions

**Response**:
```json
{
  "total_monthly_cost": 89.97,
  "total_annual_cost": 1079.64,
  "category_breakdown": [
    {
      "category": "Streaming",
      "total": 39.98
    },
    {
      "category": "Software",
      "total": 29.99
    },
    {
      "category": "Cloud",
      "total": 20.00
    }
  ],
  "monthly_trend": [
    {
      "month": "Sep",
      "total": 72.15
    },
    {
      "month": "Oct",
      "total": 76.32
    },
    {
      "month": "Nov",
      "total": 81.47
    },
    {
      "month": "Dec",
      "total": 85.20
    },
    {
      "month": "Jan",
      "total": 87.95
    },
    {
      "month": "Feb",
      "total": 89.97
    }
  ],
  "service_count": 5
}
```

**Response Fields**:
- `total_monthly_cost`: Float - Sum of all monthly costs
- `total_annual_cost`: Float - Monthly cost * 12
- `category_breakdown`: Array - Spending breakdown by service category
- `monthly_trend`: Array - Historical spending trend (last 6 months)
- `service_count`: Integer - Total number of active subscriptions

**Status Codes**:
- `200`: Success
- `500`: Internal server error

**Example Request**:
```bash
curl -X GET "http://localhost:8000/analytics" \
  -H "Accept: application/json"
```

---

## Natural Language Processing

### Parse Natural Language Input

#### POST `/subscriptions/nlp`
**Description**: Create subscription from natural language text input

**Request Body**:
```json
{
  "text": "Add Amazon Prime service, $6.99 monthly with 3 months free"
}
```

**Request Fields**:
- `text`: String - Natural language description of the subscription

**Response** (Success):
```json
{
  "success": true,
  "message": "Subscription information successfully added",
  "subscription": {
    "id": "123",
    "service_id": "456",
    "account": "Default Account",
    "payment_date": "2025-09-01",
    "cost": 6.99,
    "billing_cycle": "monthly",
    "monthly_cost": 6.99,
    "is_trial": true,
    "trial_start_date": "2025-08-16T00:00:00",
    "trial_end_date": "2025-11-16T00:00:00",
    "trial_duration_days": 90,
    "created_at": "2025-08-16T10:30:00Z",
    "updated_at": "2025-08-16T10:30:00Z",
    "service": {
      "id": "456",
      "name": "Amazon Prime",
      "icon_url": "",
      "category": "Streaming"
    }
  },
  "parsed_data": {
    "service_name": "Amazon Prime",
    "service_category": "Streaming",
    "account": "Default Account",
    "monthly_cost": 6.99,
    "payment_date": "2025-09-01",
    "is_trial": true,
    "trial_duration_days": 90
  }
}
```

**Response** (Failure):
```json
{
  "success": false,
  "message": "Unable to parse subscription information, please provide more details",
  "subscription": null,
  "parsed_data": {
    "service_name": null,
    "service_category": "Other",
    "account": "Default Account",
    "monthly_cost": null,
    "payment_date": "2025-09-01",
    "is_trial": false,
    "trial_duration_days": 0
  }
}
```

**Supported Input Formats**:

1. **English Examples**:
   - "Subscribe to Netflix Premium for $19.99 per month"
   - "Add GitHub Pro subscription, dev@company.com account, $7/month"
   - "Microsoft Office 365 yearly subscription for $99.99 with 30-day trial"

2. **Chinese Examples**:
   - "Add Spotify Premium subscription, $9.99 monthly, billing on 10th"
   - "Subscribe to Adobe Creative Cloud, $599 annually, designer account"
   - "Netflix Standard subscription, family account, $15.99 monthly"

3. **Trial Period Examples**:
   - "Amazon Prime for $6.99/month with 3 months free trial"
   - "GitHub Pro with 14-day free trial, then $7/month"
   - "Adobe Photoshop, first month free, then $20.99/month"

**Status Codes**:
- `200`: Always returned (check `success` field in response)
- `400`: Invalid request format
- `422`: Validation error

**Example Requests**:

```bash
# English input
curl -X POST "http://localhost:8000/subscriptions/nlp" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Subscribe to Spotify Premium for $9.99 per month, billing on 10th"
  }'

# Chinese input
curl -X POST "http://localhost:8000/subscriptions/nlp" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Add Netflix Standard subscription, $15.99 monthly, family account"
  }'

# Trial period input
curl -X POST "http://localhost:8000/subscriptions/nlp" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "GitHub Pro subscription with 14-day free trial, then $7/month for dev@company.com"
  }'
```

---

## Data Schemas

### Service Schema

```typescript
interface Service {
  id: string;
  name: string;
  icon_url?: string;
  category: string;
}
```

**Categories**:
- `Streaming`: Video/TV streaming services
- `Software`: Development tools, productivity software
- `Cloud`: Cloud hosting and infrastructure
- `Music`: Music streaming services
- `Gaming`: Gaming platforms and services
- `Other`: Uncategorized services

### Subscription Schema

```typescript
interface Subscription {
  id: string;
  service_id: string;
  account: string;
  payment_date: string;           // ISO date string
  cost: number;                   // Original cost (monthly or yearly)
  billing_cycle: "monthly" | "yearly";
  monthly_cost: number;           // Normalized monthly cost
  is_trial?: boolean;
  trial_start_date?: string;      // ISO date string
  trial_end_date?: string;        // ISO date string
  trial_duration_days?: number;
  created_at?: string;            // ISO datetime string
  updated_at?: string;            // ISO datetime string
  service?: Service;
}
```

### Analytics Schema

```typescript
interface Analytics {
  total_monthly_cost: number;
  total_annual_cost: number;
  category_breakdown: CategoryBreakdown[];
  monthly_trend: MonthlyTrend[];
  service_count: number;
}

interface CategoryBreakdown {
  category: string;
  total: number;
}

interface MonthlyTrend {
  month: string;    // Three-letter month abbreviation
  total: number;
}
```

### NLP Request/Response Schema

```typescript
interface NLPRequest {
  text: string;
}

interface NLPResponse {
  success: boolean;
  message: string;
  subscription?: Subscription;
  parsed_data?: {
    service_name?: string;
    service_category?: string;
    account?: string;
    monthly_cost?: number;
    payment_date?: string;
    is_trial?: boolean;
    trial_duration_days?: number;
  };
}
```

---

## Error Handling

### HTTP Status Codes

- `200`: Success
- `400`: Bad Request - Invalid request format
- `404`: Not Found - Resource not found
- `422`: Unprocessable Entity - Validation error
- `500`: Internal Server Error - Server-side error

### Error Response Format

```json
{
  "detail": "Validation error description",
  "error_code": "VALIDATION_ERROR",
  "field_errors": {
    "cost": ["Cost must be greater than 0"],
    "payment_date": ["Invalid date format"]
  }
}
```

### Common Error Scenarios

1. **Validation Errors** (422):
```json
{
  "detail": "Validation failed",
  "error_code": "VALIDATION_ERROR",
  "field_errors": {
    "cost": ["ensure this value is greater than 0"],
    "payment_date": ["invalid datetime format"]
  }
}
```

2. **Not Found Errors** (404):
```json
{
  "detail": "Subscription not found",
  "error_code": "NOT_FOUND"
}
```

3. **Database Errors** (500):
```json
{
  "detail": "Database connection failed",
  "error_code": "DATABASE_ERROR"
}
```

---

## Rate Limiting

### General Endpoints
- **Limit**: 100 requests per minute per IP
- **Headers**: 
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining in current window
  - `X-RateLimit-Reset`: Unix timestamp when limit resets

### NLP Endpoint
- **Limit**: 20 requests per minute per IP (due to AI processing costs)
- **Reason**: OpenRouter API calls are rate-limited and costly

### Rate Limit Response

When rate limit is exceeded:
```json
{
  "detail": "Rate limit exceeded",
  "error_code": "RATE_LIMIT_EXCEEDED",
  "retry_after": 60
}
```

**Status Code**: 429 Too Many Requests

---

## Authentication (Future)

Currently, the API does not require authentication. For production use, implement:

### JWT Authentication

```bash
# Login to get token
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# Use token in requests
curl -X GET "http://localhost:8000/subscriptions" \
  -H "Authorization: Bearer your-jwt-token"
```

### API Key Authentication

```bash
curl -X GET "http://localhost:8000/subscriptions" \
  -H "X-API-Key: your-api-key"
```

---

## Testing the API

### Using curl

```bash
# Health check
curl http://localhost:8000/

# Get all subscriptions
curl http://localhost:8000/subscriptions

# Create subscription
curl -X POST http://localhost:8000/subscriptions \
  -H "Content-Type: application/json" \
  -d @subscription.json

# Update subscription
curl -X PUT http://localhost:8000/subscriptions/1 \
  -H "Content-Type: application/json" \
  -d '{"monthly_cost": 24.99}'

# Delete subscription
curl -X DELETE http://localhost:8000/subscriptions/1

# Get analytics
curl http://localhost:8000/analytics

# NLP parsing
curl -X POST http://localhost:8000/subscriptions/nlp \
  -H "Content-Type: application/json" \
  -d '{"text": "Netflix subscription $15.99 monthly"}'
```

### Using httpie

```bash
# Install httpie
pip install httpie

# Test endpoints
http GET localhost:8000/subscriptions
http POST localhost:8000/subscriptions < subscription.json
http PUT localhost:8000/subscriptions/1 monthly_cost:=24.99
http DELETE localhost:8000/subscriptions/1
```

### Using Python requests

```python
import requests

BASE_URL = "http://localhost:8000"

# Get subscriptions
response = requests.get(f"{BASE_URL}/subscriptions")
subscriptions = response.json()

# Create subscription
subscription_data = {
    "service_id": 1,
    "account": "test@example.com",
    "payment_date": "2024-02-15",
    "cost": 19.99,
    "billing_cycle": "monthly",
    "monthly_cost": 19.99,
    "service": {
        "name": "Netflix",
        "category": "Streaming"
    }
}

response = requests.post(
    f"{BASE_URL}/subscriptions",
    json=subscription_data
)

# NLP parsing
nlp_response = requests.post(
    f"{BASE_URL}/subscriptions/nlp",
    json={"text": "Add Spotify Premium for $9.99 per month"}
)
```

---

## Integration Examples

### Frontend Integration

```javascript
// API client example
class SubscriptionAPI {
  constructor(baseURL = 'http://localhost:8000') {
    this.baseURL = baseURL;
  }

  async getSubscriptions() {
    const response = await fetch(`${this.baseURL}/subscriptions`);
    return response.json();
  }

  async createSubscription(data) {
    const response = await fetch(`${this.baseURL}/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async parseNLP(text) {
    const response = await fetch(`${this.baseURL}/subscriptions/nlp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });
    return response.json();
  }
}

// Usage
const api = new SubscriptionAPI();
const subscriptions = await api.getSubscriptions();
const nlpResult = await api.parseNLP("Netflix Premium $19.99/month");
```

### Mobile App Integration

```swift
// iOS Swift example
struct SubscriptionAPI {
    static let baseURL = "http://localhost:8000"
    
    static func getSubscriptions() async throws -> [Subscription] {
        let url = URL(string: "\(baseURL)/subscriptions")!
        let (data, _) = try await URLSession.shared.data(from: url)
        return try JSONDecoder().decode([Subscription].self, from: data)
    }
    
    static func createSubscription(_ subscription: CreateSubscriptionRequest) async throws -> Subscription {
        let url = URL(string: "\(baseURL)/subscriptions")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(subscription)
        
        let (data, _) = try await URLSession.shared.data(for: request)
        return try JSONDecoder().decode(Subscription.self, from: data)
    }
}
```

### Third-party Integration

```python
# Webhook integration example
import requests
from typing import Dict, Any

class SubscriptionWebhook:
    def __init__(self, api_base_url: str):
        self.api_base_url = api_base_url
    
    def handle_stripe_webhook(self, webhook_data: Dict[str, Any]):
        """Handle Stripe subscription webhook"""
        if webhook_data['type'] == 'customer.subscription.created':
            subscription_data = {
                'service_id': self.get_or_create_service('Stripe Subscription'),
                'account': webhook_data['data']['object']['customer'],
                'payment_date': webhook_data['data']['object']['current_period_end'],
                'cost': webhook_data['data']['object']['plan']['amount'] / 100,
                'billing_cycle': 'monthly' if webhook_data['data']['object']['plan']['interval'] == 'month' else 'yearly',
                'monthly_cost': self.calculate_monthly_cost(
                    webhook_data['data']['object']['plan']['amount'] / 100,
                    webhook_data['data']['object']['plan']['interval']
                )
            }
            
            response = requests.post(
                f"{self.api_base_url}/subscriptions",
                json=subscription_data
            )
            return response.json()
    
    def calculate_monthly_cost(self, cost: float, interval: str) -> float:
        return cost if interval == 'month' else cost / 12
```

---

## Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:password@host:port/database

# NLP
OPENROUTER_API_KEY=sk-or-v1-your-api-key

# CORS
CORS_ORIGINS=http://localhost:5173,https://yourdomain.com

# Rate limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_GENERAL=100
RATE_LIMIT_NLP=20
```

### CORS Configuration

```python
# main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

This API documentation provides comprehensive information for integrating with the Subscription Manager backend. For additional support or feature requests, please refer to the project repository or contact the development team.