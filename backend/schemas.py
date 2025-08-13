from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

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
    monthly_cost: float

class SubscriptionCreate(SubscriptionBase):
    service: Optional[ServiceBase] = None

class SubscriptionUpdate(BaseModel):
    account: Optional[str] = None
    payment_date: Optional[str] = None
    monthly_cost: Optional[float] = None

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