from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum

class BillingCycle(enum.Enum):
    monthly = "monthly"
    yearly = "yearly"

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
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    account = Column(String, nullable=False)
    payment_date = Column(DateTime, nullable=False)
    cost = Column(Float, nullable=False)  # 原始费用
    billing_cycle = Column(Enum(BillingCycle), nullable=False, default=BillingCycle.monthly)
    monthly_cost = Column(Float, nullable=False)  # 计算出的月费用
    
    # 试用期相关字段
    is_trial = Column(Boolean, default=False)
    trial_start_date = Column(DateTime, nullable=True)
    trial_end_date = Column(DateTime, nullable=True)
    trial_duration_days = Column(Integer, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    service = relationship("Service", back_populates="subscriptions")