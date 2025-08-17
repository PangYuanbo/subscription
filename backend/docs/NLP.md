# NLP Integration Documentation

This document provides comprehensive information about the Natural Language Processing (NLP) capabilities of the Subscription Manager backend, including OpenRouter integration, parsing logic, and customization options.

## 🧠 NLP Overview

The Subscription Manager uses advanced Natural Language Processing to convert human-readable text into structured subscription data. This feature allows users to add subscriptions using natural language instead of filling out forms.

### Key Features

- **Multi-language Support**: English and Chinese input
- **Pattern-based Fallback**: Fast regex parsing for common services
- **AI-powered Parsing**: OpenRouter API with GPT-3.5-turbo
- **Trial Period Detection**: Automatic identification of free trial periods
- **Service Recognition**: Built-in recognition for popular services
- **Error Recovery**: Graceful degradation when parsing fails

## 🔗 OpenRouter Integration

### Configuration

```python
# openrouter_client.py
class OpenRouterClient:
    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        if not self.api_key:
            raise ValueError("OPENROUTER_API_KEY environment variable is required")
        
        self.base_url = "https://openrouter.ai/api/v1"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
```

### Environment Setup

```bash
# .env file
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
```

**Getting an API Key**:
1. Visit [OpenRouter.ai](https://openrouter.ai/)
2. Create an account
3. Navigate to API Keys section
4. Generate a new API key
5. Add credits to your account for usage

### API Usage

The OpenRouter client uses GPT-3.5-turbo for natural language understanding:

```python
async def parse_subscription_text(self, text: str) -> Optional[Dict]:
    prompt = f"""
Parse the following natural language text into structured subscription service data. Return JSON format with the following fields:
- service_name: Service name
- service_category: Service category (e.g., "Streaming", "Software", "Cloud", "Music", "Gaming", "Other")
- account: Account information
- monthly_cost: Monthly cost (number)
- payment_date: Next payment date (YYYY-MM-DD format)
- is_trial: Whether there is a trial period (true/false)
- trial_duration_days: Trial period duration in days

Notes:
1. If keywords like "free", "trial", "免费", "试用" are mentioned, set is_trial to true
2. If "first few months free" is mentioned, calculate trial_duration_days accordingly
3. Monthly cost should be the regular cost after trial period
4. If information is incomplete or cannot be parsed, use null for the respective fields

User input: {text}

Return only JSON, no other explanation.
"""
```

## 🎯 Parsing Logic

### Dual Parsing Strategy

The NLP system uses a two-tier approach for maximum reliability:

1. **Pattern-based Parsing** (Fast, Local)
2. **AI Parsing** (Comprehensive, External API)

```python
async def parse_subscription_text(self, text: str) -> Optional[Dict]:
    # Try pattern-based parsing first for common cases
    fallback_result = self._try_pattern_based_parsing(text)
    if fallback_result:
        return fallback_result
        
    # If pattern-based parsing fails, try OpenRouter
    # ... AI parsing logic ...
    
    # Return fallback if AI parsing also fails
    return fallback_result
```

### Pattern-based Parsing

For common services and patterns, the system uses regex-based parsing for speed and reliability:

```python
def _try_pattern_based_parsing(self, text: str) -> Optional[Dict]:
    """Try to parse common subscription patterns using regex"""
    text_lower = text.lower()
    
    # Amazon Prime pattern
    if "amazon" in text_lower and "prime" in text_lower:
        # Extract price
        price_match = re.search(r'(\d+\.?\d*)', text)
        monthly_cost = float(price_match.group(1)) if price_match else 6.99
        
        # Check for trial period
        is_trial = False
        trial_days = 0
        if any(word in text_lower for word in ["免费", "试用", "trial", "free"]):
            is_trial = True
            # Look for duration
            if "三个月" in text or "3个月" in text or "3 个月" in text:
                trial_days = 90
            elif "一个月" in text or "1个月" in text or "1 个月" in text:
                trial_days = 30
            elif "两个月" in text or "2个月" in text or "2 个月" in text:
                trial_days = 60
        
        return {
            "service_name": "Amazon Prime",
            "service_category": "Streaming",
            "account": "Default Account",
            "monthly_cost": monthly_cost,
            "payment_date": self._get_default_payment_date(),
            "is_trial": is_trial,
            "trial_duration_days": trial_days
        }
    
    return None
```

### Data Validation and Normalization

```python
def _validate_and_normalize(self, data: Dict) -> Dict:
    """Validate and normalize the parsed data"""
    normalized = {
        "service_name": data.get("service_name", "").strip() if data.get("service_name") else None,
        "service_category": data.get("service_category", "Other"),
        "account": data.get("account", "").strip() if data.get("account") else "Default Account",
        "monthly_cost": None,
        "payment_date": None,
        "is_trial": data.get("is_trial", False),
        "trial_duration_days": data.get("trial_duration_days", 0)
    }
    
    # Validate monthly_cost
    try:
        if data.get("monthly_cost") is not None:
            normalized["monthly_cost"] = float(data["monthly_cost"])
    except (ValueError, TypeError):
        pass
    
    # Validate payment_date
    try:
        if data.get("payment_date"):
            # Try to parse the date to validate format
            datetime.fromisoformat(data["payment_date"])
            normalized["payment_date"] = data["payment_date"]
    except (ValueError, TypeError):
        # If no valid date provided, use next month's first day
        next_month = datetime.now().replace(day=1)
        if next_month.month == 12:
            next_month = next_month.replace(year=next_month.year + 1, month=1)
        else:
            next_month = next_month.replace(month=next_month.month + 1)
        normalized["payment_date"] = next_month.strftime("%Y-%m-%d")
    
    return normalized
```

## 📝 Supported Input Formats

### English Examples

#### Basic Subscriptions
```
"Subscribe to Netflix Premium for $19.99 per month"
"Add Spotify Premium subscription, $9.99/month"
"GitHub Pro subscription for $7 monthly"
"Microsoft Office 365, $99.99 yearly"
```

#### With Account Information
```
"Netflix subscription for family@example.com, $15.99 monthly"
"Add GitHub Pro for dev@company.com, $7/month, billing on 1st"
"Spotify family plan for music@family.com, $14.99 per month"
```

#### With Trial Periods
```
"Amazon Prime with 3 months free trial, then $6.99/month"
"GitHub Pro with 14-day free trial, then $7/month"
"Adobe Photoshop, first month free, then $20.99/month"
"Netflix Premium with 30-day trial, $19.99 monthly after"
```

#### Complex Descriptions
```
"Subscribe to Microsoft Office 365 Business Premium for office@company.com, $22/month per user, with 30-day free trial, billing on the 15th of each month"
"Add Adobe Creative Cloud All Apps subscription, designer@studio.com account, $52.99/month, annual plan with monthly billing"
```

### Chinese Examples

#### Basic Subscriptions
```
"添加Netflix订阅，每月19.99美元"
"订阅Spotify Premium，月费9.99美元"
"GitHub Pro订阅，每月7美元"
"Microsoft Office，年费99.99美元"
```

#### With Account Information
```
"Netflix家庭账户订阅，family@example.com，每月15.99美元"
"添加Spotify家庭版，music@family.com账户，月费14.99美元"
"GitHub Pro开发者订阅，dev@company.com，每月7美元，1号扣费"
```

#### With Trial Periods
```
"添加amazon prime 服务 一个月6.99 前三个月免费"
"GitHub Pro订阅，14天免费试用，之后每月7美元"
"Adobe Photoshop订阅，首月免费，之后每月20.99美元"
"Netflix Premium，30天试用期，试用后月费19.99美元"
```

#### Mixed Language
```
"Subscribe to 网飞 Premium，每月$19.99"
"添加Spotify订阅 for family account，月费$14.99"
"GitHub Pro subscription，开发者账户，月费¥50"
```

## 🎯 Service Recognition

### Built-in Service Patterns

The system has built-in recognition for popular services:

#### Streaming Services
- **Netflix**: "netflix", "网飞"
- **Amazon Prime**: "amazon prime", "prime video"
- **Disney+**: "disney", "disney plus", "disney+"
- **Hulu**: "hulu"
- **HBO Max**: "hbo", "hbo max"

#### Software Services
- **GitHub**: "github", "github pro"
- **Adobe**: "adobe", "photoshop", "creative cloud"
- **Microsoft**: "microsoft", "office", "office 365"
- **JetBrains**: "jetbrains", "intellij", "pycharm"

#### Cloud Services
- **AWS**: "aws", "amazon web services"
- **Google Cloud**: "gcp", "google cloud"
- **Azure**: "azure", "microsoft azure"
- **Heroku**: "heroku"

#### Music Services
- **Spotify**: "spotify", "spotify premium"
- **Apple Music**: "apple music"
- **YouTube Music**: "youtube music"

### Service Categorization

Services are automatically categorized:

```python
CATEGORY_MAPPING = {
    "netflix": "Streaming",
    "spotify": "Music",
    "github": "Software",
    "aws": "Cloud",
    "adobe": "Software",
    "microsoft": "Software",
    "amazon prime": "Streaming",
    "google cloud": "Cloud",
    # ... more mappings
}
```

## 🔄 Trial Period Processing

### Trial Detection Keywords

The system recognizes various trial-related keywords:

**English**:
- "free trial", "trial period", "free month", "trial version"
- "first month free", "30-day trial", "14-day free"
- "complimentary", "no charge", "trial offer"

**Chinese**:
- "免费试用", "试用期", "免费月", "试用版本"
- "前一个月免费", "30天试用", "14天免费"
- "免费体验", "体验期", "试用优惠"

### Trial Duration Parsing

```python
def parse_trial_duration(text: str) -> int:
    """Extract trial duration from text"""
    text_lower = text.lower()
    
    # Day patterns
    day_patterns = [
        (r'(\d+)\s*天', lambda m: int(m.group(1))),
        (r'(\d+)\s*day', lambda m: int(m.group(1))),
        (r'(\d+)-day', lambda m: int(m.group(1))),
    ]
    
    # Month patterns  
    month_patterns = [
        (r'(\d+)\s*个?月', lambda m: int(m.group(1)) * 30),
        (r'(\d+)\s*month', lambda m: int(m.group(1)) * 30),
        (r'(\d+)-month', lambda m: int(m.group(1)) * 30),
    ]
    
    # Chinese number patterns
    chinese_numbers = {
        '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
        '六': 6, '七': 7, '八': 8, '九': 9, '十': 10
    }
    
    for pattern, converter in day_patterns + month_patterns:
        match = re.search(pattern, text)
        if match:
            return converter(match)
    
    return 0
```

### Trial Date Calculation

```python
def calculate_trial_dates(trial_duration_days: int) -> tuple:
    """Calculate trial start and end dates"""
    if trial_duration_days <= 0:
        return None, None
        
    trial_start_date = datetime.now()
    trial_end_date = trial_start_date + timedelta(days=trial_duration_days)
    
    return trial_start_date, trial_end_date
```

## 🛠️ Integration with Backend

### API Endpoint Integration

```python
# main.py
@app.post("/subscriptions/nlp", response_model=NLPSubscriptionResponse)
async def create_subscription_from_nlp(
    request: NLPSubscriptionRequest,
    db: AsyncSession = Depends(get_db)
):
    try:
        parsed_data = await openrouter_client.parse_subscription_text(request.text)
        
        if not parsed_data or not parsed_data.get("service_name"):
            return NLPSubscriptionResponse(
                success=False,
                message="无法解析订阅信息，请提供更详细的信息",
                parsed_data=parsed_data
            )
        
        if not parsed_data.get("monthly_cost"):
            return NLPSubscriptionResponse(
                success=False,
                message="无法确定月费用，请明确指定费用金额",
                parsed_data=parsed_data
            )
        
        # Create or get service
        service_result = await db.execute(
            select(Service).where(Service.name == parsed_data["service_name"])
        )
        service = service_result.scalar_one_or_none()
        
        if not service:
            service = Service(
                name=parsed_data["service_name"],
                icon_url="",
                category=parsed_data["service_category"]
            )
            db.add(service)
            await db.flush()
        
        # Calculate trial dates if trial is present
        trial_start_date = None
        trial_end_date = None
        if parsed_data.get("is_trial") and parsed_data.get("trial_duration_days", 0) > 0:
            trial_start_date = datetime.now()
            trial_end_date = trial_start_date + timedelta(days=parsed_data["trial_duration_days"])
        
        # Create subscription
        db_subscription = Subscription(
            service_id=service.id,
            account=parsed_data["account"],
            payment_date=datetime.fromisoformat(parsed_data["payment_date"]),
            cost=parsed_data["monthly_cost"],
            billing_cycle="monthly",
            monthly_cost=parsed_data["monthly_cost"],
            is_trial=parsed_data.get("is_trial", False),
            trial_start_date=trial_start_date,
            trial_end_date=trial_end_date,
            trial_duration_days=parsed_data.get("trial_duration_days", 0)
        )
        
        db.add(db_subscription)
        await db.commit()
        await db.refresh(db_subscription)
        
        # Return success response
        return NLPSubscriptionResponse(
            success=True,
            message="订阅信息已成功添加",
            subscription=subscription_response,
            parsed_data=parsed_data
        )
        
    except Exception as e:
        print(f"Error creating subscription from NLP: {e}")
        return NLPSubscriptionResponse(
            success=False,
            message=f"处理请求时发生错误: {str(e)}",
            parsed_data=None
        )
```

## 🧪 Testing NLP Functionality

### Unit Tests

```python
import pytest
from openrouter_client import OpenRouterClient

@pytest.mark.asyncio
async def test_pattern_based_parsing():
    client = OpenRouterClient()
    
    # Test Amazon Prime parsing
    text = "添加amazon prime 服务 一个月6.99 前三个月免费"
    result = await client.parse_subscription_text(text)
    
    assert result is not None
    assert result["service_name"] == "Amazon Prime"
    assert result["service_category"] == "Streaming"
    assert result["monthly_cost"] == 6.99
    assert result["is_trial"] == True
    assert result["trial_duration_days"] == 90

@pytest.mark.asyncio 
async def test_english_input():
    client = OpenRouterClient()
    
    text = "Subscribe to Netflix Premium for $19.99 per month"
    result = await client.parse_subscription_text(text)
    
    assert result is not None
    assert "netflix" in result["service_name"].lower()
    assert result["monthly_cost"] == 19.99

@pytest.mark.asyncio
async def test_trial_period_detection():
    client = OpenRouterClient()
    
    text = "GitHub Pro with 14-day free trial, then $7/month"
    result = await client.parse_subscription_text(text)
    
    assert result is not None
    assert result["is_trial"] == True
    assert result["trial_duration_days"] == 14
```

### Integration Tests

```python
import httpx
import pytest

@pytest.mark.asyncio
async def test_nlp_endpoint():
    async with httpx.AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.post(
            "/subscriptions/nlp",
            json={"text": "Netflix subscription $19.99 per month"}
        )
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert data["subscription"] is not None

@pytest.mark.asyncio
async def test_chinese_input():
    async with httpx.AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.post(
            "/subscriptions/nlp",
            json={"text": "添加Spotify Premium订阅，每月9.99美元"}
        )
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
```

### Manual Testing

```bash
# Test with curl
curl -X POST "http://localhost:8000/subscriptions/nlp" \
  -H "Content-Type: application/json" \
  -d '{"text": "Subscribe to Netflix Premium for $19.99 per month"}'

# Test Chinese input
curl -X POST "http://localhost:8000/subscriptions/nlp" \
  -H "Content-Type: application/json" \
  -d '{"text": "添加Spotify Premium订阅，每月9.99美元，10号扣费"}'

# Test trial period
curl -X POST "http://localhost:8000/subscriptions/nlp" \
  -H "Content-Type: application/json" \
  -d '{"text": "Amazon Prime with 3 months free trial, then $6.99/month"}'
```

## ⚡ Performance Optimization

### Caching Strategy

```python
from functools import lru_cache
import asyncio

class OpenRouterClient:
    def __init__(self):
        self.cache = {}
        self.cache_ttl = 3600  # 1 hour
    
    async def parse_subscription_text(self, text: str) -> Optional[Dict]:
        # Check cache first
        cache_key = hashlib.md5(text.encode()).hexdigest()
        if cache_key in self.cache:
            cached_result, timestamp = self.cache[cache_key]
            if time.time() - timestamp < self.cache_ttl:
                return cached_result
        
        # Parse text
        result = await self._parse_text(text)
        
        # Cache result
        self.cache[cache_key] = (result, time.time())
        
        return result
```

### Rate Limiting

```python
import asyncio
from datetime import datetime, timedelta

class RateLimiter:
    def __init__(self, max_requests: int, time_window: int):
        self.max_requests = max_requests
        self.time_window = time_window
        self.requests = []
    
    async def acquire(self):
        now = datetime.now()
        # Remove old requests
        self.requests = [req_time for req_time in self.requests 
                        if now - req_time < timedelta(seconds=self.time_window)]
        
        if len(self.requests) >= self.max_requests:
            wait_time = self.time_window - (now - self.requests[0]).total_seconds()
            await asyncio.sleep(wait_time)
        
        self.requests.append(now)

# Usage
nlp_rate_limiter = RateLimiter(max_requests=20, time_window=60)  # 20 requests per minute

async def parse_with_rate_limit(text: str):
    await nlp_rate_limiter.acquire()
    return await openrouter_client.parse_subscription_text(text)
```

## 🔧 Customization and Extension

### Adding New Service Patterns

```python
def _try_pattern_based_parsing(self, text: str) -> Optional[Dict]:
    text_lower = text.lower()
    
    # Existing Amazon Prime pattern...
    
    # Add new Netflix pattern
    if "netflix" in text_lower:
        price_match = re.search(r'(\d+\.?\d*)', text)
        monthly_cost = float(price_match.group(1)) if price_match else 15.99
        
        # Detect plan type
        if "premium" in text_lower:
            plan_type = "Premium"
            default_cost = 19.99
        elif "standard" in text_lower:
            plan_type = "Standard" 
            default_cost = 15.99
        elif "basic" in text_lower:
            plan_type = "Basic"
            default_cost = 8.99
        else:
            plan_type = "Standard"
            default_cost = 15.99
        
        return {
            "service_name": f"Netflix {plan_type}",
            "service_category": "Streaming",
            "account": self._extract_account(text),
            "monthly_cost": monthly_cost or default_cost,
            "payment_date": self._extract_payment_date(text),
            "is_trial": self._detect_trial(text),
            "trial_duration_days": self._extract_trial_duration(text)
        }
    
    # Add Spotify pattern
    if "spotify" in text_lower:
        # ... similar pattern for Spotify
    
    return None
```

### Custom Parsing Rules

```python
class CustomParsingRules:
    def __init__(self):
        self.rules = []
    
    def add_rule(self, pattern: str, service_name: str, category: str, default_cost: float):
        self.rules.append({
            "pattern": pattern,
            "service_name": service_name,
            "category": category,
            "default_cost": default_cost
        })
    
    def apply_rules(self, text: str) -> Optional[Dict]:
        text_lower = text.lower()
        
        for rule in self.rules:
            if rule["pattern"] in text_lower:
                price_match = re.search(r'(\d+\.?\d*)', text)
                monthly_cost = float(price_match.group(1)) if price_match else rule["default_cost"]
                
                return {
                    "service_name": rule["service_name"],
                    "service_category": rule["category"],
                    "account": "Default Account",
                    "monthly_cost": monthly_cost,
                    "payment_date": self._get_default_payment_date(),
                    "is_trial": False,
                    "trial_duration_days": 0
                }
        
        return None

# Usage
custom_rules = CustomParsingRules()
custom_rules.add_rule("notion", "Notion", "Software", 8.00)
custom_rules.add_rule("figma", "Figma", "Software", 12.00)
custom_rules.add_rule("canva", "Canva Pro", "Software", 12.99)
```

### Multi-language Support Extension

```python
def detect_language(text: str) -> str:
    """Detect input language"""
    chinese_chars = re.findall(r'[\u4e00-\u9fff]', text)
    if len(chinese_chars) > len(text) * 0.3:  # 30% threshold
        return "zh"
    return "en"

def get_localized_prompt(text: str, language: str) -> str:
    """Get appropriate prompt based on language"""
    if language == "zh":
        return f"""
将以下中文文本解析为订阅服务的结构化数据。返回JSON格式：
- service_name: 服务名称
- service_category: 服务类别
- account: 账户信息
- monthly_cost: 月费用
- payment_date: 下次付款日期 (YYYY-MM-DD格式)
- is_trial: 是否有试用期
- trial_duration_days: 试用期天数

用户输入: {text}

只返回JSON，不要其他解释。
"""
    else:
        return f"""
Parse the following English text into structured subscription data. Return JSON format:
- service_name: Service name
- service_category: Service category
- account: Account information  
- monthly_cost: Monthly cost
- payment_date: Next payment date (YYYY-MM-DD)
- is_trial: Whether there is a trial period
- trial_duration_days: Trial duration in days

User input: {text}

Return only JSON, no other explanation.
"""
```

## 📊 Monitoring and Analytics

### NLP Usage Tracking

```python
class NLPAnalytics:
    def __init__(self):
        self.usage_stats = {
            "total_requests": 0,
            "successful_parses": 0,
            "failed_parses": 0,
            "pattern_based_success": 0,
            "ai_based_success": 0,
            "languages": {"en": 0, "zh": 0, "other": 0}
        }
    
    def track_request(self, text: str, success: bool, method: str):
        self.usage_stats["total_requests"] += 1
        
        if success:
            self.usage_stats["successful_parses"] += 1
            if method == "pattern":
                self.usage_stats["pattern_based_success"] += 1
            else:
                self.usage_stats["ai_based_success"] += 1
        else:
            self.usage_stats["failed_parses"] += 1
        
        # Track language
        language = self.detect_language(text)
        self.usage_stats["languages"][language] += 1
    
    def get_success_rate(self) -> float:
        if self.usage_stats["total_requests"] == 0:
            return 0.0
        return self.usage_stats["successful_parses"] / self.usage_stats["total_requests"]

# Usage
nlp_analytics = NLPAnalytics()

async def parse_with_analytics(text: str):
    try:
        result = await openrouter_client.parse_subscription_text(text)
        success = result is not None and result.get("service_name") is not None
        method = "pattern" if result and "pattern_based" in str(result) else "ai"
        nlp_analytics.track_request(text, success, method)
        return result
    except Exception as e:
        nlp_analytics.track_request(text, False, "error")
        raise
```

### Error Logging

```python
import logging

logger = logging.getLogger("nlp_processing")

async def parse_subscription_text(self, text: str) -> Optional[Dict]:
    logger.info(f"NLP parsing request: {text[:100]}...")
    
    try:
        # Try pattern-based parsing
        result = self._try_pattern_based_parsing(text)
        if result:
            logger.info(f"Pattern-based parsing successful for: {result['service_name']}")
            return result
        
        # Try AI parsing
        result = await self._ai_parse(text)
        if result:
            logger.info(f"AI parsing successful for: {result.get('service_name', 'Unknown')}")
        else:
            logger.warning(f"AI parsing failed for text: {text[:50]}...")
        
        return result
        
    except Exception as e:
        logger.error(f"NLP parsing error: {str(e)}, Text: {text[:50]}...")
        return None
```

## 🚨 Error Handling and Recovery

### Graceful Degradation

```python
async def parse_with_fallback(text: str) -> Dict:
    """Parse with multiple fallback strategies"""
    
    # Strategy 1: Pattern-based parsing
    try:
        result = openrouter_client._try_pattern_based_parsing(text)
        if result and result.get("service_name"):
            return {"success": True, "data": result, "method": "pattern"}
    except Exception as e:
        logger.warning(f"Pattern parsing failed: {e}")
    
    # Strategy 2: AI parsing
    try:
        result = await openrouter_client._ai_parse(text)
        if result and result.get("service_name"):
            return {"success": True, "data": result, "method": "ai"}
    except Exception as e:
        logger.warning(f"AI parsing failed: {e}")
    
    # Strategy 3: Manual extraction
    try:
        result = extract_basic_info(text)
        if result:
            return {"success": True, "data": result, "method": "manual"}
    except Exception as e:
        logger.warning(f"Manual extraction failed: {e}")
    
    # Strategy 4: Return template for manual completion
    return {
        "success": False,
        "data": {
            "service_name": None,
            "service_category": "Other",
            "account": "Default Account",
            "monthly_cost": None,
            "payment_date": get_default_payment_date(),
            "is_trial": False,
            "trial_duration_days": 0
        },
        "method": "template",
        "message": "无法自动解析，请手动补充信息"
    }

def extract_basic_info(text: str) -> Dict:
    """Extract basic information using simple regex"""
    # Extract cost
    cost_match = re.search(r'[\$¥€£]?(\d+\.?\d*)', text)
    monthly_cost = float(cost_match.group(1)) if cost_match else None
    
    # Extract potential service name (first capitalized word)
    service_match = re.search(r'\b([A-Z][a-z]+)\b', text)
    service_name = service_match.group(1) if service_match else None
    
    # Extract email (potential account)
    email_match = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text)
    account = email_match.group(0) if email_match else "Default Account"
    
    if service_name and monthly_cost:
        return {
            "service_name": service_name,
            "service_category": "Other",
            "account": account,
            "monthly_cost": monthly_cost,
            "payment_date": get_default_payment_date(),
            "is_trial": "trial" in text.lower() or "free" in text.lower(),
            "trial_duration_days": 30 if "trial" in text.lower() else 0
        }
    
    return None
```

This comprehensive NLP documentation provides everything needed to understand, customize, and extend the natural language processing capabilities of the Subscription Manager backend.