# API Documentation

This document describes the frontend API client and the backend endpoints used by the Subscription Manager application.

## API Client (`src/api/client.ts`)

The frontend uses a centralized API client to communicate with the backend. All API calls are made through this client to ensure consistency and proper error handling.

### Base Configuration

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

## Subscription API

### Get All Subscriptions

```typescript
subscriptionApi.getAll(): Promise<Subscription[]>
```

**Endpoint**: `GET /subscriptions`

**Description**: Fetches all user subscriptions with their associated service information.

**Response**:
```typescript
interface SubscriptionResponse {
  id: string;
  service_id: string;
  account: string;
  payment_date: string;
  cost: number;
  billing_cycle: 'monthly' | 'yearly';
  monthly_cost: number;
  is_trial?: boolean;
  trial_start_date?: string;
  trial_end_date?: string;
  trial_duration_days?: number;
  created_at?: string;
  updated_at?: string;
  service?: {
    id: string;
    name: string;
    icon_url?: string;
    category: string;
  };
}
```

### Create Subscription

```typescript
subscriptionApi.create(data: SubscriptionCreateRequest): Promise<Subscription>
```

**Endpoint**: `POST /subscriptions`

**Description**: Creates a new subscription entry.

**Request Body**:
```typescript
interface SubscriptionCreateRequest {
  service_id: string;
  account: string;
  payment_date: string;
  cost: number;
  billing_cycle: 'monthly' | 'yearly';
  monthly_cost: number;
  is_trial?: boolean;
  trial_start_date?: string;
  trial_end_date?: string;
  trial_duration_days?: number;
  service?: {
    name: string;
    icon_url?: string;
    category: string;
  };
}
```

### Update Subscription

```typescript
subscriptionApi.update(id: string, data: SubscriptionUpdateRequest): Promise<Subscription>
```

**Endpoint**: `PUT /subscriptions/{id}`

**Description**: Updates an existing subscription.

**Request Body**:
```typescript
interface SubscriptionUpdateRequest {
  account?: string;
  payment_date?: string;
  monthly_cost?: number;
}
```

### Delete Subscription

```typescript
subscriptionApi.delete(id: string): Promise<void>
```

**Endpoint**: `DELETE /subscriptions/{id}`

**Description**: Deletes a subscription by ID.

## Analytics API

### Get Analytics Data

```typescript
subscriptionApi.getAnalytics(): Promise<Analytics>
```

**Endpoint**: `GET /analytics`

**Description**: Fetches analytics data including spending totals, category breakdown, and trends.

**Response**:
```typescript
interface Analytics {
  total_monthly_cost: number;
  total_annual_cost: number;
  category_breakdown: {
    category: string;
    total: number;
  }[];
  monthly_trend: {
    month: string;
    total: number;
  }[];
  service_count: number;
}
```

## NLP API

### Parse Natural Language Input

```typescript
subscriptionApi.parseNLP(text: string): Promise<NLPResponse>
```

**Endpoint**: `POST /subscriptions/nlp`

**Description**: Parses natural language text to extract subscription information.

**Request Body**:
```typescript
interface NLPRequest {
  text: string;
}
```

**Response**:
```typescript
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

**Example Requests**:
```javascript
// English input
await subscriptionApi.parseNLP("Subscribe to Netflix Premium for $19.99 per month, billing on 15th");

// Chinese input
await subscriptionApi.parseNLP("添加amazon prime 服务 一个月6.99 前三个月免费");

// Complex input with trial
await subscriptionApi.parseNLP("Add GitHub Pro subscription, dev@company.com account, $7/month with 30-day free trial");
```

## Error Handling

The API client includes comprehensive error handling for common scenarios:

### Network Errors
```typescript
try {
  const subscriptions = await subscriptionApi.getAll();
} catch (error) {
  if (error.code === 'NETWORK_ERROR') {
    // Handle network connectivity issues
    console.error('Network error:', error.message);
  }
}
```

### HTTP Errors
```typescript
try {
  await subscriptionApi.create(subscriptionData);
} catch (error) {
  if (error.response?.status === 400) {
    // Handle validation errors
    console.error('Validation error:', error.response.data.detail);
  } else if (error.response?.status === 500) {
    // Handle server errors
    console.error('Server error');
  }
}
```

### Error Response Format
```typescript
interface ErrorResponse {
  detail: string;
  error_code?: string;
  field_errors?: {
    [field: string]: string[];
  };
}
```

## Request/Response Examples

### Creating a Subscription

**Request**:
```json
POST /subscriptions
{
  "service_id": "netflix-001",
  "account": "family@example.com",
  "payment_date": "2024-01-15",
  "cost": 19.99,
  "billing_cycle": "monthly",
  "monthly_cost": 19.99,
  "service": {
    "name": "Netflix",
    "category": "Streaming"
  }
}
```

**Response**:
```json
{
  "id": "123",
  "service_id": "netflix-001",
  "account": "family@example.com",
  "payment_date": "2024-01-15",
  "cost": 19.99,
  "billing_cycle": "monthly",
  "monthly_cost": 19.99,
  "created_at": "2024-01-01T00:00:00Z",
  "service": {
    "id": "netflix-001",
    "name": "Netflix",
    "category": "Streaming",
    "icon_url": ""
  }
}
```

### NLP Parsing

**Request**:
```json
POST /subscriptions/nlp
{
  "text": "添加amazon prime 服务 一个月6.99 前三个月免费"
}
```

**Response**:
```json
{
  "success": true,
  "message": "订阅信息已成功添加",
  "subscription": {
    "id": "124",
    "service_id": "amazon-prime-001",
    "account": "Default Account",
    "payment_date": "2025-09-01",
    "cost": 6.99,
    "billing_cycle": "monthly",
    "monthly_cost": 6.99,
    "is_trial": true,
    "trial_start_date": "2025-08-16",
    "trial_end_date": "2025-11-16",
    "trial_duration_days": 90,
    "service": {
      "name": "Amazon Prime",
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

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **General endpoints**: 100 requests per minute per IP
- **NLP endpoint**: 20 requests per minute per IP (due to AI processing costs)

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1640995200
```

## Authentication

Currently, the API does not require authentication. In a production environment, you would implement:

1. **JWT Token Authentication**
2. **API Key Authentication**
3. **OAuth 2.0 Integration**

Future authentication implementation would modify the API client to include authorization headers:

```typescript
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getAuthToken()}`,
  },
});
```

## Environment Configuration

### Development
```env
VITE_API_URL=http://localhost:8000
```

### Production
```env
VITE_API_URL=https://api.subscriptions.yourapp.com
```

### Testing
```env
VITE_API_URL=http://localhost:8000
VITE_MOCK_API=true  # Use mock data instead of real API
```

## TypeScript Types

All API types are defined in `src/types/index.ts` and exported for use throughout the application. This ensures type safety and better developer experience with IDE autocompletion and error checking.