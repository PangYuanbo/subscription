from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum

class BillingCycle(enum.Enum):
    monthly = "monthly"
    yearly = "yearly"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    auth0_user_id = Column(String, unique=True, nullable=False, index=True)  # Auth0 user ID (sub)
    email = Column(String, unique=True, nullable=False, index=True)
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
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    icon_url = Column(String)
    category = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    subscriptions = relationship("Subscription", back_populates="service")

class Subscription(Base):
    __tablename__ = "subscriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)  # Associated user
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
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