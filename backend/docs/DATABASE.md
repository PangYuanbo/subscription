# Database Documentation

This document provides comprehensive information about the database architecture, models, relationships, and operations for the Subscription Manager backend.

## 🗄️ Database Architecture

### Technology Stack

- **Database Engine**: PostgreSQL 12+ (Production) / SQLite (Development)
- **ORM**: SQLAlchemy 2.0 with async support
- **Driver**: asyncpg (PostgreSQL) / aiosqlite (SQLite)
- **Migration Tool**: Alembic (optional)
- **Connection Pooling**: SQLAlchemy async engine with connection pool

### Database Configuration

```python
# database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://user:password@localhost/subscriptions")

# PostgreSQL URL format conversion for compatibility
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)

# Async engine configuration
engine = create_async_engine(
    DATABASE_URL, 
    echo=True,              # Log SQL queries (disable in production)
    pool_size=20,           # Connection pool size
    max_overflow=0,         # No overflow connections
    pool_pre_ping=True,     # Validate connections before use
    pool_recycle=300        # Recycle connections every 5 minutes
)

# Session factory
AsyncSessionLocal = async_sessionmaker(
    engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

Base = declarative_base()
```

## 📊 Database Models

### Service Model

**Purpose**: Stores information about subscription services (Netflix, Spotify, etc.)

```python
class Service(Base):
    __tablename__ = "services"
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Service information
    name = Column(String, nullable=False)           # e.g., "Netflix", "Spotify"
    icon_url = Column(String)                       # URL to service icon
    category = Column(String, nullable=False)       # e.g., "Streaming", "Software"
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    subscriptions = relationship("Subscription", back_populates="service")
```

**Table Structure**:
```sql
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    icon_url VARCHAR,
    category VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX ix_services_id ON services (id);
```

**Categories**:
- `Streaming`: Netflix, Hulu, Disney+, Amazon Prime
- `Software`: Adobe, Microsoft, GitHub, JetBrains
- `Cloud`: AWS, GCP, Azure, Heroku
- `Music`: Spotify, Apple Music, YouTube Music
- `Gaming`: Steam, Xbox Live, PlayStation Plus
- `Other`: Custom or uncategorized services

### Subscription Model

**Purpose**: Stores individual subscription records with billing and trial information

```python
class Subscription(Base):
    __tablename__ = "subscriptions"
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign key relationship
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    
    # Subscription details
    account = Column(String, nullable=False)        # Account identifier (email, username)
    payment_date = Column(DateTime, nullable=False) # Next payment date
    cost = Column(Float, nullable=False)            # Original cost (monthly or yearly)
    billing_cycle = Column(Enum(BillingCycle), nullable=False, default=BillingCycle.monthly)
    monthly_cost = Column(Float, nullable=False)    # Normalized monthly cost for analytics
    
    # Trial period fields
    is_trial = Column(Boolean, default=False)       # Whether subscription is in trial
    trial_start_date = Column(DateTime, nullable=True)  # Trial start date
    trial_end_date = Column(DateTime, nullable=True)    # Trial end date
    trial_duration_days = Column(Integer, nullable=True) # Trial duration in days
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    service = relationship("Service", back_populates="subscriptions")
```

**Table Structure**:
```sql
CREATE TYPE billing_cycle AS ENUM ('monthly', 'yearly');

CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    service_id INTEGER NOT NULL REFERENCES services(id),
    account VARCHAR NOT NULL,
    payment_date TIMESTAMP NOT NULL,
    cost FLOAT NOT NULL,
    billing_cycle billing_cycle NOT NULL DEFAULT 'monthly',
    monthly_cost FLOAT NOT NULL,
    is_trial BOOLEAN DEFAULT FALSE,
    trial_start_date TIMESTAMP,
    trial_end_date TIMESTAMP,
    trial_duration_days INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX ix_subscriptions_id ON subscriptions (id);
CREATE INDEX ix_subscriptions_service_id ON subscriptions (service_id);
CREATE INDEX ix_subscriptions_payment_date ON subscriptions (payment_date);
CREATE INDEX ix_subscriptions_is_trial ON subscriptions (is_trial);
```

### Billing Cycle Enum

```python
class BillingCycle(enum.Enum):
    monthly = "monthly"
    yearly = "yearly"
```

**Monthly Cost Calculation**:
- Monthly subscriptions: `monthly_cost = cost`
- Yearly subscriptions: `monthly_cost = cost / 12`

## 🔗 Relationships

### One-to-Many: Service → Subscriptions

```python
# Service model
subscriptions = relationship("Subscription", back_populates="service")

# Subscription model  
service = relationship("Service", back_populates="subscriptions")
```

**Usage Examples**:
```python
# Get all subscriptions for a service
service = await session.get(Service, service_id)
subscriptions = service.subscriptions

# Get service information for a subscription
subscription = await session.get(Subscription, subscription_id)
service_name = subscription.service.name
```

### Foreign Key Constraints

- `subscriptions.service_id` → `services.id`
- Cascade behavior: `RESTRICT` (prevent deletion of service with active subscriptions)

## 📝 Database Operations

### Session Management

```python
# Dependency for FastAPI routes
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

# Usage in route
@app.get("/subscriptions")
async def get_subscriptions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Subscription))
    return result.scalars().all()
```

### Common Queries

#### Create Operations

```python
# Create new service
async def create_service(db: AsyncSession, name: str, category: str):
    service = Service(name=name, category=category)
    db.add(service)
    await db.commit()
    await db.refresh(service)
    return service

# Create subscription with service
async def create_subscription(db: AsyncSession, subscription_data: SubscriptionCreate):
    # Create or get service
    service_result = await db.execute(
        select(Service).where(Service.name == subscription_data.service.name)
    )
    service = service_result.scalar_one_or_none()
    
    if not service:
        service = Service(
            name=subscription_data.service.name,
            category=subscription_data.service.category
        )
        db.add(service)
        await db.flush()  # Get service.id without committing
    
    # Create subscription
    subscription = Subscription(
        service_id=service.id,
        account=subscription_data.account,
        payment_date=datetime.fromisoformat(subscription_data.payment_date),
        cost=subscription_data.cost,
        billing_cycle=subscription_data.billing_cycle,
        monthly_cost=subscription_data.monthly_cost
    )
    
    db.add(subscription)
    await db.commit()
    await db.refresh(subscription)
    return subscription
```

#### Read Operations

```python
# Get all subscriptions with services
async def get_all_subscriptions(db: AsyncSession):
    result = await db.execute(
        select(Subscription)
        .options(selectinload(Subscription.service))
        .order_by(Subscription.created_at.desc())
    )
    return result.scalars().all()

# Get subscriptions by category
async def get_subscriptions_by_category(db: AsyncSession, category: str):
    result = await db.execute(
        select(Subscription)
        .join(Service)
        .where(Service.category == category)
        .options(selectinload(Subscription.service))
    )
    return result.scalars().all()

# Get trial subscriptions
async def get_trial_subscriptions(db: AsyncSession):
    result = await db.execute(
        select(Subscription)
        .where(Subscription.is_trial == True)
        .where(Subscription.trial_end_date > datetime.utcnow())
        .options(selectinload(Subscription.service))
    )
    return result.scalars().all()
```

#### Update Operations

```python
# Update subscription
async def update_subscription(db: AsyncSession, subscription_id: int, update_data: SubscriptionUpdate):
    result = await db.execute(
        select(Subscription).where(Subscription.id == subscription_id)
    )
    subscription = result.scalar_one_or_none()
    
    if not subscription:
        raise ValueError("Subscription not found")
    
    # Update fields
    for field, value in update_data.dict(exclude_unset=True).items():
        if field == "payment_date" and value:
            value = datetime.fromisoformat(value)
        setattr(subscription, field, value)
    
    subscription.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(subscription)
    return subscription
```

#### Delete Operations

```python
# Delete subscription
async def delete_subscription(db: AsyncSession, subscription_id: int):
    result = await db.execute(
        select(Subscription).where(Subscription.id == subscription_id)
    )
    subscription = result.scalar_one_or_none()
    
    if not subscription:
        raise ValueError("Subscription not found")
    
    await db.delete(subscription)
    await db.commit()
    return {"message": "Subscription deleted successfully"}

# Soft delete (alternative approach)
async def soft_delete_subscription(db: AsyncSession, subscription_id: int):
    result = await db.execute(
        select(Subscription).where(Subscription.id == subscription_id)
    )
    subscription = result.scalar_one_or_none()
    
    if not subscription:
        raise ValueError("Subscription not found")
    
    subscription.is_active = False  # Add is_active field to model
    subscription.deleted_at = datetime.utcnow()  # Add deleted_at field
    await db.commit()
    return subscription
```

### Analytics Queries

```python
# Calculate total monthly spending
async def get_total_monthly_cost(db: AsyncSession):
    result = await db.execute(
        select(func.sum(Subscription.monthly_cost))
    )
    return result.scalar() or 0.0

# Get spending by category
async def get_category_breakdown(db: AsyncSession):
    result = await db.execute(
        select(
            Service.category,
            func.sum(Subscription.monthly_cost).label('total')
        )
        .join(Subscription)
        .group_by(Service.category)
        .order_by(desc('total'))
    )
    return [{"category": row.category, "total": float(row.total)} for row in result]

# Get subscription count by service
async def get_service_popularity(db: AsyncSession):
    result = await db.execute(
        select(
            Service.name,
            func.count(Subscription.id).label('count')
        )
        .join(Subscription)
        .group_by(Service.name)
        .order_by(desc('count'))
    )
    return [{"service": row.name, "count": row.count} for row in result]

# Get upcoming payments (next 30 days)
async def get_upcoming_payments(db: AsyncSession, days: int = 30):
    end_date = datetime.utcnow() + timedelta(days=days)
    result = await db.execute(
        select(Subscription)
        .where(Subscription.payment_date <= end_date)
        .where(Subscription.payment_date >= datetime.utcnow())
        .options(selectinload(Subscription.service))
        .order_by(Subscription.payment_date)
    )
    return result.scalars().all()
```

## 🔧 Database Initialization

### Automatic Table Creation

```python
# database.py
async def init_db():
    """Create all tables in the database"""
    async with engine.begin() as conn:
        from models import Base  # Import must be here to include all models
        await conn.run_sync(Base.metadata.create_all)

# main.py
@app.on_event("startup")
async def startup_event():
    await init_db()
```

### Manual Table Creation

```sql
-- Create services table
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    icon_url VARCHAR,
    category VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Create billing cycle enum
CREATE TYPE billing_cycle AS ENUM ('monthly', 'yearly');

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    service_id INTEGER NOT NULL REFERENCES services(id),
    account VARCHAR NOT NULL,
    payment_date TIMESTAMP NOT NULL,
    cost FLOAT NOT NULL,
    billing_cycle billing_cycle NOT NULL DEFAULT 'monthly',
    monthly_cost FLOAT NOT NULL,
    is_trial BOOLEAN DEFAULT FALSE,
    trial_start_date TIMESTAMP,
    trial_end_date TIMESTAMP,
    trial_duration_days INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX ix_services_id ON services (id);
CREATE INDEX ix_subscriptions_id ON subscriptions (id);
CREATE INDEX ix_subscriptions_service_id ON subscriptions (service_id);
CREATE INDEX ix_subscriptions_payment_date ON subscriptions (payment_date);
CREATE INDEX ix_subscriptions_is_trial ON subscriptions (is_trial);
```

## 🛡️ Data Integrity & Constraints

### Database Constraints

```sql
-- NOT NULL constraints
ALTER TABLE services ALTER COLUMN name SET NOT NULL;
ALTER TABLE services ALTER COLUMN category SET NOT NULL;
ALTER TABLE subscriptions ALTER COLUMN service_id SET NOT NULL;
ALTER TABLE subscriptions ALTER COLUMN account SET NOT NULL;
ALTER TABLE subscriptions ALTER COLUMN payment_date SET NOT NULL;
ALTER TABLE subscriptions ALTER COLUMN cost SET NOT NULL;
ALTER TABLE subscriptions ALTER COLUMN monthly_cost SET NOT NULL;

-- CHECK constraints
ALTER TABLE subscriptions ADD CONSTRAINT cost_positive CHECK (cost > 0);
ALTER TABLE subscriptions ADD CONSTRAINT monthly_cost_positive CHECK (monthly_cost > 0);
ALTER TABLE subscriptions ADD CONSTRAINT trial_duration_positive CHECK (trial_duration_days IS NULL OR trial_duration_days > 0);

-- Unique constraints (if needed)
-- ALTER TABLE services ADD CONSTRAINT unique_service_name UNIQUE (name);
```

### Application-Level Validation

```python
# Pydantic schemas provide validation
class SubscriptionCreate(BaseModel):
    service_id: int
    account: str = Field(..., min_length=1, max_length=255)
    payment_date: str = Field(..., regex=r'^\d{4}-\d{2}-\d{2}$')
    cost: float = Field(..., gt=0)
    billing_cycle: BillingCycle = BillingCycle.monthly
    monthly_cost: float = Field(..., gt=0)
    
    @validator('payment_date')
    def validate_payment_date(cls, v):
        try:
            datetime.fromisoformat(v)
            return v
        except ValueError:
            raise ValueError('Invalid date format. Use YYYY-MM-DD')
    
    @validator('monthly_cost')
    def validate_monthly_cost(cls, v, values):
        if 'cost' in values and 'billing_cycle' in values:
            if values['billing_cycle'] == BillingCycle.yearly:
                expected_monthly = values['cost'] / 12
                if abs(v - expected_monthly) > 0.01:  # Allow small rounding differences
                    raise ValueError('monthly_cost should be cost/12 for yearly subscriptions')
        return v
```

## 📈 Performance Optimization

### Indexing Strategy

```sql
-- Primary indexes (automatic)
CREATE INDEX ix_services_id ON services (id);
CREATE INDEX ix_subscriptions_id ON subscriptions (id);

-- Foreign key indexes
CREATE INDEX ix_subscriptions_service_id ON subscriptions (service_id);

-- Query optimization indexes
CREATE INDEX ix_subscriptions_payment_date ON subscriptions (payment_date);
CREATE INDEX ix_subscriptions_is_trial ON subscriptions (is_trial);
CREATE INDEX ix_subscriptions_created_at ON subscriptions (created_at);
CREATE INDEX ix_services_category ON services (category);

-- Composite indexes for common queries
CREATE INDEX ix_subscriptions_service_trial ON subscriptions (service_id, is_trial);
CREATE INDEX ix_subscriptions_payment_trial ON subscriptions (payment_date, is_trial);
```

### Query Optimization

```python
# Use eager loading to avoid N+1 queries
from sqlalchemy.orm import selectinload

# Bad: N+1 query problem
subscriptions = await db.execute(select(Subscription))
for sub in subscriptions.scalars():
    print(sub.service.name)  # This triggers a new query for each subscription

# Good: Eager loading
subscriptions = await db.execute(
    select(Subscription).options(selectinload(Subscription.service))
)
for sub in subscriptions.scalars():
    print(sub.service.name)  # Service data is already loaded

# Use specific column selection for large datasets
result = await db.execute(
    select(Subscription.id, Subscription.monthly_cost, Service.category)
    .join(Service)
    .where(Service.category == 'Streaming')
)
```

### Connection Pooling

```python
# Optimized engine configuration
engine = create_async_engine(
    DATABASE_URL,
    echo=False,                 # Disable SQL logging in production
    pool_size=20,              # Adjust based on concurrent load
    max_overflow=10,           # Allow some overflow connections
    pool_pre_ping=True,        # Validate connections
    pool_recycle=3600,         # Recycle connections every hour
    pool_timeout=30,           # Connection timeout
)
```

## 🔄 Database Migrations

### Using Alembic

```bash
# Initialize Alembic
alembic init alembic

# Create migration for new table
alembic revision --autogenerate -m "Add trial period fields to subscriptions"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1

# Show migration history
alembic history

# Show current revision
alembic current
```

**Migration Example**:
```python
# alembic/versions/001_add_trial_fields.py
from alembic import op
import sqlalchemy as sa

def upgrade():
    op.add_column('subscriptions', sa.Column('is_trial', sa.Boolean(), default=False))
    op.add_column('subscriptions', sa.Column('trial_start_date', sa.DateTime(), nullable=True))
    op.add_column('subscriptions', sa.Column('trial_end_date', sa.DateTime(), nullable=True))
    op.add_column('subscriptions', sa.Column('trial_duration_days', sa.Integer(), nullable=True))

def downgrade():
    op.drop_column('subscriptions', 'trial_duration_days')
    op.drop_column('subscriptions', 'trial_end_date')
    op.drop_column('subscriptions', 'trial_start_date')
    op.drop_column('subscriptions', 'is_trial')
```

## 🧪 Testing

### Database Testing Setup

```python
import pytest
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from database import Base

@pytest.fixture
async def test_db():
    # Use in-memory SQLite for tests
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=True)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        yield session
    
    await engine.dispose()

@pytest.mark.asyncio
async def test_create_subscription(test_db):
    service = Service(name="Test Service", category="Testing")
    test_db.add(service)
    await test_db.flush()
    
    subscription = Subscription(
        service_id=service.id,
        account="test@example.com",
        payment_date=datetime(2024, 1, 15),
        cost=19.99,
        monthly_cost=19.99
    )
    test_db.add(subscription)
    await test_db.commit()
    
    result = await test_db.execute(select(Subscription))
    assert len(result.scalars().all()) == 1
```

## 🔍 Monitoring & Maintenance

### Database Monitoring

```python
# Health check endpoint
@app.get("/health/database")
async def database_health_check(db: AsyncSession = Depends(get_db)):
    try:
        # Simple query to test database connectivity
        await db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        raise HTTPException(
            status_code=503, 
            detail=f"Database health check failed: {str(e)}"
        )

# Database statistics
@app.get("/admin/database/stats")
async def database_statistics(db: AsyncSession = Depends(get_db)):
    # Get table row counts
    services_count = await db.execute(select(func.count(Service.id)))
    subscriptions_count = await db.execute(select(func.count(Subscription.id)))
    
    # Get database size (PostgreSQL specific)
    db_size = await db.execute(text("SELECT pg_database_size(current_database())"))
    
    return {
        "services_count": services_count.scalar(),
        "subscriptions_count": subscriptions_count.scalar(),
        "database_size_bytes": db_size.scalar()
    }
```

### Backup and Recovery

```bash
# PostgreSQL backup
pg_dump -h hostname -U username -d database_name > backup.sql

# PostgreSQL restore
psql -h hostname -U username -d database_name < backup.sql

# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > "backup_$DATE.sql"
gzip "backup_$DATE.sql"
aws s3 cp "backup_$DATE.sql.gz" s3://backup-bucket/
```

## 🚨 Troubleshooting

### Common Issues

1. **Connection Pool Exhaustion**:
```python
# Increase pool size or check for connection leaks
engine = create_async_engine(
    DATABASE_URL,
    pool_size=30,      # Increase pool size
    max_overflow=20,   # Allow overflow
    pool_timeout=60    # Increase timeout
)
```

2. **N+1 Query Problem**:
```python
# Use eager loading
result = await db.execute(
    select(Subscription).options(selectinload(Subscription.service))
)
```

3. **Migration Conflicts**:
```bash
# Reset Alembic to current state
alembic stamp head

# Create new migration from current state
alembic revision --autogenerate -m "Sync with current schema"
```

4. **Deadlocks**:
```python
# Add retry logic for deadlocks
from sqlalchemy.exc import OperationalError
import asyncio

async def execute_with_retry(db: AsyncSession, query, max_retries=3):
    for attempt in range(max_retries):
        try:
            result = await db.execute(query)
            await db.commit()
            return result
        except OperationalError as e:
            if "deadlock" in str(e).lower() and attempt < max_retries - 1:
                await asyncio.sleep(0.1 * (2 ** attempt))  # Exponential backoff
                await db.rollback()
                continue
            raise
```