# Deployment Documentation

This document provides comprehensive deployment instructions for the Subscription Manager backend across different platforms and environments.

## 🚀 Deployment Overview

### Supported Platforms

- **Local Development**: uvicorn server
- **Docker**: Containerized deployment
- **Modal.com**: Serverless deployment
- **Railway**: Git-based deployment
- **Render**: Auto-deploy from GitHub
- **Fly.io**: Global edge deployment
- **Heroku**: Traditional PaaS
- **AWS**: EC2, ECS, Lambda
- **Google Cloud**: Cloud Run, App Engine
- **Azure**: Container Instances, App Service

### Prerequisites

- Python 3.9+
- PostgreSQL database (or managed database service)
- OpenRouter API key for NLP functionality
- Git repository access

## 🐳 Docker Deployment

### Dockerfile

```dockerfile
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        postgresql-client \
        gcc \
        python3-dev \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# Create non-root user
RUN adduser --disabled-password --gecos '' appuser
RUN chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE $PORT

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:$PORT/health || exit 1

# Run the application
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port $PORT"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+asyncpg://postgres:password@db:5432/subscriptions
      - OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
      - ENVIRONMENT=production
    depends_on:
      - db
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=subscriptions
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

volumes:
  postgres_data:
```

### Build and Run

```bash
# Build the image
docker build -t subscription-backend .

# Run with environment file
docker run -p 8000:8000 --env-file .env subscription-backend

# Or use docker-compose
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

### Production Docker Setup

```dockerfile
# Dockerfile.production
FROM python:3.11-slim as builder

WORKDIR /app
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

FROM python:3.11-slim

# Copy Python dependencies
COPY --from=builder /root/.local /root/.local

# Set environment variables
ENV PATH=/root/.local/bin:$PATH
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app
COPY . .

# Create non-root user
RUN adduser --disabled-password --gecos '' appuser
RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

## ☁️ Modal.com Deployment

### Modal Configuration

```python
# modal_app.py
import modal

# Create Modal app
app = modal.App("subscription-backend")

# Define the container image
image = (
    modal.Image.debian_slim()
    .pip_install_from_requirements("requirements.txt")
    .env({"PYTHONPATH": "/app"})
)

# Define secrets
secrets = [
    modal.Secret.from_name("database-url"),
    modal.Secret.from_name("openrouter-api-key")
]

@app.function(
    image=image,
    secrets=secrets,
    container_idle_timeout=300,
    timeout=900,
    allow_concurrent_inputs=100,
)
@modal.asgi_app()
def fastapi_app():
    from main import app as fastapi_app
    return fastapi_app

# Database initialization function
@app.function(
    image=image,
    secrets=secrets,
    timeout=300,
)
async def init_database():
    from database import init_db
    await init_db()
    print("Database initialized successfully")

# CLI function for database setup
@app.local_entrypoint()
def setup_db():
    init_database.remote()

if __name__ == "__main__":
    app.deploy()
```

### Deploy to Modal

```bash
# Install Modal CLI
pip install modal

# Login to Modal
modal auth

# Create secrets
modal secret create database-url DATABASE_URL="postgresql+asyncpg://..."
modal secret create openrouter-api-key OPENROUTER_API_KEY="sk-or-v1-..."

# Deploy the app
modal deploy modal_app.py

# Initialize database
modal run modal_app.py::setup_db

# View logs
modal logs subscription-backend

# Update deployment
modal deploy modal_app.py --name subscription-backend-v2
```

### Modal Environment Configuration

```python
# modal_config.py
import os
from modal import Image, Secret, App

def get_modal_image():
    return (
        Image.debian_slim()
        .pip_install(
            "fastapi==0.110.0",
            "uvicorn[standard]==0.27.1",
            "sqlalchemy==2.0.27",
            "asyncpg==0.29.0",
            "python-dotenv==1.0.1",
            "pydantic==2.6.1",
            "httpx==0.26.0",
        )
        .env({
            "PYTHONPATH": "/app",
            "ENVIRONMENT": "production"
        })
    )

def get_modal_secrets():
    return [
        Secret.from_name("database-credentials"),
        Secret.from_name("api-keys"),
    ]
```

## 🚂 Railway Deployment

### Railway Configuration

```json
// railway.json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "uvicorn main:app --host 0.0.0.0 --port $PORT",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Environment Variables (Railway)

```bash
# Railway environment variables
DATABASE_URL=postgresql://username:password@host:port/database
OPENROUTER_API_KEY=sk-or-v1-your-key
PORT=8000
ENVIRONMENT=production
PYTHONPATH=/app
```

### Deploy to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Link to existing project (optional)
railway link

# Set environment variables
railway variables set DATABASE_URL="postgresql://..."
railway variables set OPENROUTER_API_KEY="sk-or-v1-..."

# Deploy
railway up

# View logs
railway logs

# Open in browser
railway open
```

## 🎨 Render Deployment

### render.yaml

```yaml
# render.yaml
services:
  - type: web
    name: subscription-backend
    env: python
    region: oregon
    plan: starter
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
    healthCheckPath: /health
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: OPENROUTER_API_KEY
        sync: false
      - key: ENVIRONMENT
        value: production
      - key: PYTHONPATH
        value: /opt/render/project/src

databases:
  - name: subscription-db
    databaseName: subscriptions
    user: subscription_user
    region: oregon
    plan: starter
```

### Deploy to Render

1. **Connect GitHub Repository**:
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Service**:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Health Check Path: `/health`

3. **Set Environment Variables**:
   - `DATABASE_URL`: PostgreSQL connection string
   - `OPENROUTER_API_KEY`: Your OpenRouter API key
   - `ENVIRONMENT`: production

4. **Deploy**: Render automatically deploys on git push

## ✈️ Fly.io Deployment

### fly.toml

```toml
# fly.toml
app = "subscription-backend"
primary_region = "sea"

[build]
  image = "subscription-backend:latest"

[env]
  PORT = "8000"
  ENVIRONMENT = "production"

[http_service]
  internal_port = 8000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 1
  processes = ["app"]

[[http_service.checks]]
  grace_period = "10s"
  interval = "30s"
  method = "GET"
  timeout = "5s"
  path = "/health"

[vm]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 512

[[statics]]
  guest_path = "/app/static"
  url_prefix = "/static/"
```

### Deploy to Fly.io

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Initialize app
fly launch

# Set secrets
fly secrets set DATABASE_URL="postgresql://..."
fly secrets set OPENROUTER_API_KEY="sk-or-v1-..."

# Deploy
fly deploy

# View status
fly status

# View logs
fly logs

# Scale app
fly scale count 2

# Open in browser
fly open
```

## 🐍 Heroku Deployment

### Procfile

```
web: uvicorn main:app --host 0.0.0.0 --port $PORT
release: python -c "import asyncio; from database import init_db; asyncio.run(init_db())"
```

### runtime.txt

```
python-3.11.0
```

### Deploy to Heroku

```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login

# Create app
heroku create subscription-backend

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set OPENROUTER_API_KEY="sk-or-v1-..."
heroku config:set ENVIRONMENT=production

# Deploy
git push heroku main

# Run database migrations
heroku run python -c "import asyncio; from database import init_db; asyncio.run(init_db())"

# View logs
heroku logs --tail

# Open app
heroku open
```

## ☁️ AWS Deployment

### AWS Lambda with Mangum

```python
# lambda_handler.py
from mangum import Mangum
from main import app

# Wrap FastAPI app for Lambda
handler = Mangum(app, lifespan="off")
```

### AWS ECS Deployment

```json
{
  "family": "subscription-backend",
  "taskRoleArn": "arn:aws:iam::account:role/ecsTaskRole",
  "executionRoleArn": "arn:aws:iam::account:role/ecsExecutionRole",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "subscription-backend",
      "image": "your-account.dkr.ecr.region.amazonaws.com/subscription-backend:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "ENVIRONMENT",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:database-url"
        },
        {
          "name": "OPENROUTER_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:openrouter-key"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/subscription-backend",
          "awslogs-region": "us-west-2",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### Deploy to AWS

```bash
# Build and push to ECR
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin account.dkr.ecr.us-west-2.amazonaws.com

docker build -t subscription-backend .
docker tag subscription-backend:latest account.dkr.ecr.us-west-2.amazonaws.com/subscription-backend:latest
docker push account.dkr.ecr.us-west-2.amazonaws.com/subscription-backend:latest

# Deploy to ECS
aws ecs register-task-definition --cli-input-json file://task-definition.json
aws ecs update-service --cluster subscription-cluster --service subscription-backend --task-definition subscription-backend
```

## 🐙 Google Cloud Deployment

### Cloud Run

```yaml
# cloudrun.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: subscription-backend
  annotations:
    run.googleapis.com/ingress: all
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/maxScale: "10"
        run.googleapis.com/cpu-throttling: "false"
    spec:
      containerConcurrency: 80
      containers:
      - image: gcr.io/project-id/subscription-backend
        ports:
        - containerPort: 8000
        env:
        - name: ENVIRONMENT
          value: production
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-url
              key: url
        - name: OPENROUTER_API_KEY
          valueFrom:
            secretKeyRef:
              name: openrouter-key
              key: key
        resources:
          limits:
            memory: 1Gi
            cpu: 1000m
```

### Deploy to Google Cloud

```bash
# Configure gcloud
gcloud auth login
gcloud config set project your-project-id

# Build and push to Container Registry
gcloud builds submit --tag gcr.io/your-project-id/subscription-backend

# Deploy to Cloud Run
gcloud run deploy subscription-backend \
  --image gcr.io/your-project-id/subscription-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8000 \
  --memory 1Gi \
  --cpu 1 \
  --max-instances 10

# Set environment variables
gcloud run services update subscription-backend \
  --set-env-vars ENVIRONMENT=production \
  --set-secrets DATABASE_URL=database-url:latest \
  --set-secrets OPENROUTER_API_KEY=openrouter-key:latest
```

## 🔵 Azure Deployment

### Azure Container Instances

```json
{
  "apiVersion": "2019-12-01",
  "type": "Microsoft.ContainerInstance/containerGroups",
  "name": "subscription-backend",
  "location": "East US",
  "properties": {
    "containers": [
      {
        "name": "subscription-backend",
        "properties": {
          "image": "your-registry.azurecr.io/subscription-backend:latest",
          "ports": [
            {
              "port": 8000,
              "protocol": "TCP"
            }
          ],
          "environmentVariables": [
            {
              "name": "ENVIRONMENT",
              "value": "production"
            }
          ],
          "resources": {
            "requests": {
              "cpu": 1,
              "memoryInGB": 1
            }
          }
        }
      }
    ],
    "osType": "Linux",
    "ipAddress": {
      "type": "Public",
      "ports": [
        {
          "port": 8000,
          "protocol": "TCP"
        }
      ]
    }
  }
}
```

## 🔧 Environment Configuration

### Production Environment Variables

```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/db?ssl=require

# NLP Service
OPENROUTER_API_KEY=sk-or-v1-your-key-here

# Application
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=info

# Security
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Performance
WORKERS=4
MAX_CONNECTIONS=20
POOL_SIZE=20
POOL_MAX_OVERFLOW=10

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
DATADOG_API_KEY=your-datadog-key
```

### Development Environment

```bash
# Database (local)
DATABASE_URL=postgresql+asyncpg://localhost/subscriptions_dev

# NLP Service
OPENROUTER_API_KEY=sk-or-v1-your-dev-key

# Application
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=debug

# CORS (allow all for development)
CORS_ORIGINS=*
```

## 📊 Health Checks and Monitoring

### Health Check Endpoint

```python
# main.py
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "development")
    }

@app.get("/health/detailed")
async def detailed_health_check(db: AsyncSession = Depends(get_db)):
    checks = {
        "database": "unknown",
        "nlp_service": "unknown",
        "memory_usage": "unknown"
    }
    
    # Database check
    try:
        await db.execute(text("SELECT 1"))
        checks["database"] = "healthy"
    except Exception as e:
        checks["database"] = f"unhealthy: {str(e)}"
    
    # NLP service check
    try:
        # Simple test of OpenRouter connection
        async with httpx.AsyncClient() as client:
            response = await client.get("https://openrouter.ai", timeout=5)
            checks["nlp_service"] = "healthy" if response.status_code == 200 else "degraded"
    except Exception:
        checks["nlp_service"] = "unhealthy"
    
    # Memory usage
    import psutil
    memory_percent = psutil.virtual_memory().percent
    checks["memory_usage"] = f"{memory_percent}%"
    
    return {
        "status": "healthy" if all("healthy" in v for v in checks.values()) else "degraded",
        "checks": checks,
        "timestamp": datetime.utcnow().isoformat()
    }
```

### Monitoring Setup

```python
# monitoring.py
import logging
import time
from fastapi import Request
from prometheus_client import Counter, Histogram, generate_latest

# Metrics
REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint', 'status'])
REQUEST_DURATION = Histogram('http_request_duration_seconds', 'HTTP request duration')

@app.middleware("http")
async def monitoring_middleware(request: Request, call_next):
    start_time = time.time()
    
    response = await call_next(request)
    
    duration = time.time() - start_time
    REQUEST_DURATION.observe(duration)
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=str(request.url.path),
        status=response.status_code
    ).inc()
    
    return response

@app.get("/metrics")
async def metrics():
    return Response(generate_latest(), media_type="text/plain")
```

## 🔐 Security Considerations

### Production Security Checklist

- [ ] **Environment Variables**: All secrets in environment variables, not code
- [ ] **HTTPS**: Force HTTPS in production
- [ ] **CORS**: Restrict CORS origins to your domains
- [ ] **Rate Limiting**: Implement rate limiting middleware
- [ ] **Input Validation**: Validate all inputs with Pydantic
- [ ] **SQL Injection**: Use SQLAlchemy ORM (automatic protection)
- [ ] **Dependencies**: Keep dependencies updated
- [ ] **Logging**: Don't log sensitive information
- [ ] **Error Handling**: Don't expose internal errors to users

### Security Configuration

```python
# security.py
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware

def configure_security(app):
    # HTTPS redirect in production
    if os.getenv("ENVIRONMENT") == "production":
        app.add_middleware(HTTPSRedirectMiddleware)
    
    # Trusted hosts
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=os.getenv("ALLOWED_HOSTS", "*").split(",")
    )
    
    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["*"],
    )
```

## 🚨 Troubleshooting

### Common Deployment Issues

1. **Database Connection Errors**:
```bash
# Check connection string format
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/db

# For SSL connections
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/db?ssl=require
```

2. **Port Configuration**:
```python
# Use PORT environment variable
port = int(os.getenv("PORT", 8000))
uvicorn.run(app, host="0.0.0.0", port=port)
```

3. **Memory Issues**:
```dockerfile
# Increase memory in Docker
docker run -m 1g subscription-backend
```

4. **OpenRouter API Issues**:
```python
# Check API key format
OPENROUTER_API_KEY=sk-or-v1-...

# Add timeout and retry logic
async with httpx.AsyncClient(timeout=30) as client:
    response = await client.post(url, json=data)
```

### Debugging Production Issues

```python
# Enhanced logging
import structlog

logger = structlog.get_logger()

@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    logger.info("Request started", 
                method=request.method, 
                url=str(request.url))
    
    try:
        response = await call_next(request)
        logger.info("Request completed", 
                    status_code=response.status_code)
        return response
    except Exception as e:
        logger.error("Request failed", 
                     error=str(e), 
                     exc_info=True)
        raise
```

This deployment documentation covers all major deployment scenarios and provides the configuration needed for each platform. Choose the deployment method that best fits your infrastructure requirements and scale needs.