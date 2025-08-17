# Subscription Manager Backend

A modern FastAPI-based backend service for managing subscription services with intelligent Natural Language Processing (NLP) capabilities, PostgreSQL database integration, and comprehensive analytics.

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- PostgreSQL 12+ (or use managed service like Neon)
- OpenRouter API key for NLP functionality

### Installation & Development

```bash
# Clone repository
git clone <repository-url>
cd subscription/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
python -c "import asyncio; from database import init_db; asyncio.run(init_db())"

# Start development server
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`
- API Documentation: `http://localhost:8000/docs`
- Alternative Docs: `http://localhost:8000/redoc`

## 🏗️ Project Structure

```
backend/
├── main.py                 # FastAPI application entry point
├── database.py             # Database configuration and session management
├── models.py               # SQLAlchemy database models
├── schemas.py              # Pydantic schemas for API validation
├── openrouter_client.py    # NLP integration with OpenRouter API
├── modal_app.py            # Modal deployment configuration
├── requirements.txt        # Python dependencies
├── Dockerfile             # Docker configuration
├── .env                   # Environment variables (local)
├── .env.example           # Environment variables template
└── subscriptions.db       # SQLite database (development fallback)
```

## 🗄️ Database Architecture

### Models

#### Service Model
```python
class Service(Base):
    __tablename__ = "services"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    icon_url = Column(String)
    category = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    subscriptions = relationship("Subscription", back_populates="service")
```

#### Subscription Model
```python
class Subscription(Base):
    __tablename__ = "subscriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    account = Column(String, nullable=False)
    payment_date = Column(DateTime, nullable=False)
    cost = Column(Float, nullable=False)  # Original cost
    billing_cycle = Column(Enum(BillingCycle), nullable=False, default=BillingCycle.monthly)
    monthly_cost = Column(Float, nullable=False)  # Normalized monthly cost
    
    # Trial period fields
    is_trial = Column(Boolean, default=False)
    trial_start_date = Column(DateTime, nullable=True)
    trial_end_date = Column(DateTime, nullable=True)
    trial_duration_days = Column(Integer, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    service = relationship("Service", back_populates="subscriptions")
```

### Database Configuration

**PostgreSQL (Production)**:
```python
DATABASE_URL = "postgresql+asyncpg://user:password@host:port/database"

engine = create_async_engine(
    DATABASE_URL, 
    echo=True,
    pool_size=20,
    max_overflow=0,
    pool_pre_ping=True,
    pool_recycle=300
)
```

**Features**:
- Async SQLAlchemy with asyncpg driver
- Connection pooling for performance
- Automatic table creation
- Migration support with Alembic

## 📡 API Endpoints

### Subscription Management

#### GET `/subscriptions`
**Description**: Retrieve all subscriptions with service information

**Response**:
```json
[
  {
    "id": "1",
    "service_id": "1",
    "account": "user@example.com",
    "payment_date": "2024-01-15T00:00:00",
    "cost": 19.99,
    "billing_cycle": "monthly",
    "monthly_cost": 19.99,
    "is_trial": false,
    "trial_start_date": null,
    "trial_end_date": null,
    "trial_duration_days": null,
    "created_at": "2024-01-01T00:00:00",
    "updated_at": "2024-01-01T00:00:00",
    "service": {
      "id": "1",
      "name": "Netflix",
      "icon_url": "",
      "category": "Streaming"
    }
  }
]
```

#### POST `/subscriptions`
**Description**: Create a new subscription

**Request Body**:
```json
{
  "service_id": 1,
  "account": "family@example.com",
  "payment_date": "2024-01-15",
  "cost": 19.99,
  "billing_cycle": "monthly",
  "monthly_cost": 19.99,
  "is_trial": true,
  "trial_start_date": "2024-01-01",
  "trial_end_date": "2024-01-31",
  "trial_duration_days": 30,
  "service": {
    "name": "Netflix",
    "category": "Streaming"
  }
}
```

#### PUT `/subscriptions/{subscription_id}`
**Description**: Update existing subscription

**Request Body**:
```json
{
  "account": "updated@example.com",
  "payment_date": "2024-02-15",
  "monthly_cost": 24.99
}
```

#### DELETE `/subscriptions/{subscription_id}`
**Description**: Delete subscription by ID

**Response**:
```json
{
  "message": "Subscription deleted successfully"
}
```

### Analytics

#### GET `/analytics`
**Description**: Get subscription analytics and insights

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
      "total": 49.99
    }
  ],
  "monthly_trend": [
    {
      "month": "Jan",
      "total": 85.50
    },
    {
      "month": "Feb",
      "total": 89.97
    }
  ],
  "service_count": 5
}
```

### Natural Language Processing

#### POST `/subscriptions/nlp`
**Description**: Create subscription from natural language input

**Request Body**:
```json
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
    "id": "123",
    "service_id": "456",
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

**Supported Input Examples**:
- English: "Subscribe to Netflix Premium for $19.99 per month"
- Chinese: "添加Spotify Premium订阅，每月9.99美元，10号扣费"
- Trial periods: "GitHub Pro with 30-day free trial, $7/month after"

## 🤖 NLP Integration

### OpenRouter Client

The backend integrates with OpenRouter API for natural language processing capabilities.

**Features**:
- Multi-language support (English, Chinese)
- Pattern-based fallback parsing
- Trial period detection
- Service categorization
- Cost extraction and normalization

**Configuration**:
```python
class OpenRouterClient:
    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        self.base_url = "https://openrouter.ai/api/v1"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
```

**Parsing Logic**:
1. **Pattern-based parsing**: Fast regex-based parsing for common services
2. **AI parsing**: OpenRouter API with GPT-3.5-turbo for complex inputs
3. **Validation**: Data normalization and validation
4. **Fallback**: Graceful degradation if AI parsing fails

### Supported Services
The NLP system has built-in recognition for:
- **Amazon Prime**: Various pricing and trial configurations
- **Netflix**: Multiple subscription tiers
- **Spotify**: Premium and family plans
- **GitHub**: Pro and team subscriptions
- **Microsoft**: Office 365 and Azure services

## 🔧 Configuration

### Environment Variables

Create `.env` file in the backend directory:

```env
# Database Configuration
DATABASE_URL=postgresql+asyncpg://user:password@host:port/database

# NLP Configuration
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here

# Application Configuration
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=info

# CORS Configuration
CORS_ORIGINS=http://localhost:5173,https://yourapp.com
```

### Database Setup

**Local PostgreSQL**:
```bash
# Install PostgreSQL
brew install postgresql  # macOS
sudo apt-get install postgresql postgresql-contrib  # Ubuntu

# Create database
createdb subscriptions

# Set DATABASE_URL
export DATABASE_URL=postgresql+asyncpg://user:password@localhost/subscriptions
```

**Managed PostgreSQL (Neon)**:
```env
DATABASE_URL=postgresql+asyncpg://user:password@ep-region-id.aws.neon.tech/database?ssl=require
```

### Dependencies

**Core Dependencies**:
- `fastapi==0.110.0`: Modern web framework
- `uvicorn[standard]==0.27.1`: ASGI server
- `sqlalchemy==2.0.27`: ORM with async support
- `asyncpg==0.29.0`: PostgreSQL async driver
- `pydantic==2.6.1`: Data validation
- `httpx==0.26.0`: HTTP client for API calls

**Optional Dependencies**:
- `alembic==1.13.1`: Database migrations
- `python-multipart==0.0.9`: File upload support
- `aiosqlite==0.21.0`: SQLite async support (development)

## 🚀 Deployment

### Local Development

```bash
# Start with auto-reload
uvicorn main:app --reload --port 8000

# Start with specific host
uvicorn main:app --host 0.0.0.0 --port 8000

# Start with workers (production)
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Docker Deployment

**Dockerfile**:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Build and Run**:
```bash
# Build image
docker build -t subscription-backend .

# Run container
docker run -p 8000:8000 --env-file .env subscription-backend
```

### Production Deployment

**Modal.com (Serverless)**:
```python
# modal_app.py
import modal

app = modal.App("subscription-backend")

image = modal.Image.debian_slim().pip_install_from_requirements("requirements.txt")

@app.function(
    image=image,
    env={"DATABASE_URL": modal.Secret.from_name("database-url").key}
)
@modal.asgi_app()
def fastapi_app():
    from main import app
    return app
```

**Deploy to Modal**:
```bash
modal deploy modal_app.py
```

**Other Deployment Options**:
- **Railway**: Direct GitHub integration
- **Render**: Auto-deploy from repository
- **Fly.io**: Global edge deployment
- **Heroku**: Traditional PaaS deployment

## 🔒 Security & Best Practices

### Security Features

1. **Environment Variables**: Sensitive data in environment variables
2. **CORS Configuration**: Controlled cross-origin requests
3. **Input Validation**: Pydantic schema validation
4. **SQL Injection Protection**: SQLAlchemy ORM parameterized queries
5. **Rate Limiting**: (Recommended) Add rate limiting middleware

### Authentication (Future)

```python
# Example JWT authentication implementation
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
import jwt

security = HTTPBearer()

async def get_current_user(token: str = Depends(security)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Protected endpoint
@app.get("/protected")
async def protected_route(current_user: str = Depends(get_current_user)):
    return {"user": current_user}
```

### Error Handling

```python
from fastapi import HTTPException

# Custom exception handler
@app.exception_handler(ValueError)
async def value_error_handler(request, exc):
    return JSONResponse(
        status_code=400,
        content={"detail": str(exc)}
    )

# Database error handling
try:
    result = await db.execute(query)
except SQLAlchemyError as e:
    raise HTTPException(
        status_code=500, 
        detail="Database operation failed"
    )
```

## 📊 Monitoring & Logging

### Logging Configuration

```python
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("app.log"),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# Log requests
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = datetime.now()
    response = await call_next(request)
    process_time = datetime.now() - start_time
    
    logger.info(
        f"{request.method} {request.url} - "
        f"Status: {response.status_code} - "
        f"Time: {process_time.total_seconds():.3f}s"
    )
    
    return response
```

### Health Check

```python
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }

@app.get("/health/db")
async def database_health(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("SELECT 1"))
        return {"database": "healthy"}
    except Exception as e:
        raise HTTPException(status_code=503, detail="Database unhealthy")
```

## 🧪 Testing

### Unit Testing

```python
import pytest
from httpx import AsyncClient
from main import app

@pytest.mark.asyncio
async def test_create_subscription():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.post(
            "/subscriptions",
            json={
                "service_id": 1,
                "account": "test@example.com",
                "payment_date": "2024-01-15",
                "cost": 19.99,
                "billing_cycle": "monthly",
                "monthly_cost": 19.99
            }
        )
    assert response.status_code == 200
    assert response.json()["account"] == "test@example.com"

@pytest.mark.asyncio
async def test_nlp_parsing():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.post(
            "/subscriptions/nlp",
            json={"text": "Netflix subscription $19.99 per month"}
        )
    assert response.status_code == 200
    assert response.json()["success"] is True
```

### Database Testing

```python
import pytest
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from database import Base

@pytest.fixture
async def test_db():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with AsyncSession(engine) as session:
        yield session
        
    await engine.dispose()
```

## 🔧 Development Tools

### API Documentation

FastAPI automatically generates interactive API documentation:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **OpenAPI JSON**: `http://localhost:8000/openapi.json`

### Database Migrations

```bash
# Initialize Alembic
alembic init alembic

# Create migration
alembic revision --autogenerate -m "Add trial period fields"

# Apply migrations
alembic upgrade head

# Rollback migrations
alembic downgrade -1
```

### Code Quality

```bash
# Format code
black .

# Sort imports
isort .

# Type checking
mypy .

# Linting
flake8 .
```

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Async Documentation](https://docs.sqlalchemy.org/en/14/orm/extensions/asyncio.html)
- [Pydantic Documentation](https://pydantic-docs.helpmanual.io/)
- [OpenRouter API Documentation](https://openrouter.ai/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## 🤝 Contributing

1. Follow PEP 8 style guidelines
2. Add type hints to all functions
3. Write tests for new features
4. Update documentation for API changes
5. Use descriptive commit messages

## 📄 License

This project is licensed under the MIT License.