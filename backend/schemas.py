from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum

class BillingCycle(str, Enum):
    weekly = "weekly"
    monthly = "monthly"
    yearly = "yearly"

# User schemas
class UserBase(BaseModel):
    email: str
    name: Optional[str] = None
    picture: Optional[str] = None
    nickname: Optional[str] = None

class UserCreate(UserBase):
    auth0_user_id: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    picture: Optional[str] = None
    nickname: Optional[str] = None
    last_login: Optional[datetime] = None

class UserResponse(UserBase):
    id: str
    auth0_user_id: str
    last_login: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    
    class Config:
        from_attributes = True

class ServiceBase(BaseModel):
    name: str
    icon_url: Optional[str] = None
    icon_source_url: Optional[str] = None  # URL where icon was fetched from
    category: str

class ServiceCreate(ServiceBase):
    pass

class ServiceResponse(ServiceBase):
    id: str
    
    class Config:
        from_attributes = True

class SubscriptionBase(BaseModel):
    service_id: str  # Changed from int to str to match frontend
    account: str
    payment_date: str
    cost: float
    billing_cycle: BillingCycle = BillingCycle.monthly
    monthly_cost: float
    
    # Trial period related fields
    is_trial: Optional[bool] = False
    trial_start_date: Optional[str] = None
    trial_end_date: Optional[str] = None
    trial_duration_days: Optional[int] = None
    
    # Auto-renewal settings
    auto_pay: Optional[bool] = False

class SubscriptionCreate(SubscriptionBase):
    service: Optional[ServiceBase] = None

class SubscriptionUpdate(BaseModel):
    account: Optional[str] = None
    payment_date: Optional[str] = None
    cost: Optional[float] = None
    billing_cycle: Optional[BillingCycle] = None
    monthly_cost: Optional[float] = None
    
    # Trial period related fields
    is_trial: Optional[bool] = None
    trial_start_date: Optional[str] = None
    trial_end_date: Optional[str] = None
    trial_duration_days: Optional[int] = None
    
    # Auto-renewal settings
    auto_pay: Optional[bool] = None

class SubscriptionResponse(SubscriptionBase):
    id: str
    user_id: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    service: Optional[ServiceResponse] = None
    user: Optional[UserResponse] = None
    
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

class NLPMultimodalSubscriptionRequest(BaseModel):
    text: str
    image: str  # Base64 encoded image

class NLPSubscriptionResponse(BaseModel):
    success: bool
    message: str
    subscription: Optional[SubscriptionResponse] = None
    parsed_data: Optional[dict] = None