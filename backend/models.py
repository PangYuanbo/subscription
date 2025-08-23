from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Boolean, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum
import uuid

class BillingCycle(enum.Enum):
    monthly = "monthly"
    yearly = "yearly"

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    auth0_user_id = Column(String, unique=True, nullable=False, index=True)  # Auth0 user ID (sub)
    email = Column(String, nullable=True, index=True)  # Email is optional since Auth0 may not provide it
    name = Column(String, nullable=True)
    picture = Column(String, nullable=True)  # Profile picture URL
    nickname = Column(String, nullable=True)
    last_login = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    subscriptions = relationship("Subscription", back_populates="user", cascade="all, delete-orphan")

class Service(Base):
    __tablename__ = "services"
    
    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    icon_url = Column(String)
    category = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    subscriptions = relationship("Subscription", back_populates="service")

class Subscription(Base):
    __tablename__ = "subscriptions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)  # Associated user
    service_id = Column(UUID(as_uuid=True), ForeignKey("services.id"), nullable=False)
    account = Column(String, nullable=False)
    payment_date = Column(DateTime, nullable=False)
    cost = Column(Float, nullable=False)  # Original cost
    billing_cycle = Column(Enum(BillingCycle), nullable=False, default=BillingCycle.monthly)
    monthly_cost = Column(Float, nullable=False)  # Calculated monthly cost
    
    # Trial period related fields
    is_trial = Column(Boolean, default=False)
    trial_start_date = Column(DateTime, nullable=True)
    trial_end_date = Column(DateTime, nullable=True)
    trial_duration_days = Column(Integer, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="subscriptions")
    service = relationship("Service", back_populates="subscriptions")

class UserAnalytics(Base):
    """User analytics data cache table"""
    __tablename__ = "user_analytics"
    
    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True, index=True)
    
    # Basic statistics
    total_monthly_cost = Column(Float, nullable=False, default=0.0)
    total_annual_cost = Column(Float, nullable=False, default=0.0)
    service_count = Column(Integer, nullable=False, default=0)
    
    # JSON storage for complex data structures
    category_breakdown = Column(JSON, nullable=True)  # [{"category": "Entertainment", "total": 25.99}, ...]
    monthly_trend = Column(JSON, nullable=True)       # [{"month": "Jan", "total": 25.99}, ...]
    
    # Cache timestamps
    last_calculated = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", backref="analytics")