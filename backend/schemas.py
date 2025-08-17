from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum

class BillingCycle(str, Enum):
    monthly = "monthly"
    yearly = "yearly"

class ServiceBase(BaseModel):
    name: str
    icon_url: Optional[str] = None
    category: str

class ServiceCreate(ServiceBase):
    pass

class ServiceResponse(ServiceBase):
    id: str
    
    class Config:
        from_attributes = True

class SubscriptionBase(BaseModel):
    service_id: int
    account: str
    payment_date: str
    cost: float
    billing_cycle: BillingCycle = BillingCycle.monthly
    monthly_cost: float
    
    # 试用期相关字段
    is_trial: Optional[bool] = False
    trial_start_date: Optional[str] = None
    trial_end_date: Optional[str] = None
    trial_duration_days: Optional[int] = None

class SubscriptionCreate(SubscriptionBase):
    service: Optional[ServiceBase] = None

class SubscriptionUpdate(BaseModel):
    account: Optional[str] = None
    payment_date: Optional[str] = None
    cost: Optional[float] = None
    billing_cycle: Optional[BillingCycle] = None
    monthly_cost: Optional[float] = None
    
    # 试用期相关字段
    is_trial: Optional[bool] = None
    trial_start_date: Optional[str] = None
    trial_end_date: Optional[str] = None
    trial_duration_days: Optional[int] = None

class SubscriptionResponse(SubscriptionBase):
    id: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    service: Optional[ServiceResponse] = None
    
    class Config:
        from_attributes = True

class CategoryBreakdown(BaseModel):
    category: str
    total: float

class MonthlyTrend(BaseModel):
    month: str
    total: float

class AnalyticsResponse(BaseModel):
    total_monthly_cost: float
    total_annual_cost: float
    category_breakdown: List[CategoryBreakdown]
    monthly_trend: List[MonthlyTrend]
    service_count: int

class NLPSubscriptionRequest(BaseModel):
    text: str

class NLPSubscriptionResponse(BaseModel):
    success: bool
    message: str
    subscription: Optional[SubscriptionResponse] = None
    parsed_data: Optional[dict] = None