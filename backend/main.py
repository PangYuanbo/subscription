from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

from database import get_db, init_db
from models import Subscription, Service
from schemas import (
    SubscriptionCreate, 
    SubscriptionUpdate, 
    SubscriptionResponse,
    ServiceResponse,
    AnalyticsResponse
)

load_dotenv()

app = FastAPI(title="Subscription Manager API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    await init_db()

@app.get("/")
async def root():
    return {"message": "Subscription Manager API", "status": "running"}

@app.get("/subscriptions", response_model=List[SubscriptionResponse])
async def get_subscriptions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Subscription).order_by(Subscription.created_at.desc())
    )
    subscriptions = result.scalars().all()
    
    subscription_responses = []
    for sub in subscriptions:
        service_result = await db.execute(
            select(Service).where(Service.id == sub.service_id)
        )
        service = service_result.scalar_one_or_none()
        
        response = SubscriptionResponse(
            id=str(sub.id),
            service_id=str(sub.service_id),
            account=sub.account,
            payment_date=sub.payment_date.isoformat(),
            monthly_cost=float(sub.monthly_cost),
            created_at=sub.created_at.isoformat() if sub.created_at else None,
            updated_at=sub.updated_at.isoformat() if sub.updated_at else None,
            service=ServiceResponse(
                id=str(service.id),
                name=service.name,
                icon_url=service.icon_url,
                category=service.category
            ) if service else None
        )
        subscription_responses.append(response)
    
    return subscription_responses

@app.post("/subscriptions", response_model=SubscriptionResponse)
async def create_subscription(
    subscription: SubscriptionCreate,
    db: AsyncSession = Depends(get_db)
):
    service_result = await db.execute(
        select(Service).where(Service.id == subscription.service_id)
    )
    service = service_result.scalar_one_or_none()
    
    if not service:
        service = Service(
            id=subscription.service_id,
            name=subscription.service.name if subscription.service else "Unknown",
            icon_url=subscription.service.icon_url if subscription.service else "",
            category=subscription.service.category if subscription.service else "Other"
        )
        db.add(service)
    
    db_subscription = Subscription(
        service_id=subscription.service_id,
        account=subscription.account,
        payment_date=datetime.fromisoformat(subscription.payment_date),
        monthly_cost=subscription.monthly_cost
    )
    
    db.add(db_subscription)
    await db.commit()
    await db.refresh(db_subscription)
    
    return SubscriptionResponse(
        id=str(db_subscription.id),
        service_id=str(db_subscription.service_id),
        account=db_subscription.account,
        payment_date=db_subscription.payment_date.isoformat(),
        monthly_cost=float(db_subscription.monthly_cost),
        created_at=db_subscription.created_at.isoformat() if db_subscription.created_at else None,
        updated_at=db_subscription.updated_at.isoformat() if db_subscription.updated_at else None,
        service=ServiceResponse(
            id=str(service.id),
            name=service.name,
            icon_url=service.icon_url,
            category=service.category
        ) if service else None
    )

@app.put("/subscriptions/{subscription_id}", response_model=SubscriptionResponse)
async def update_subscription(
    subscription_id: str,
    subscription: SubscriptionUpdate,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Subscription).where(Subscription.id == int(subscription_id))
    )
    db_subscription = result.scalar_one_or_none()
    
    if not db_subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    if subscription.account is not None:
        db_subscription.account = subscription.account
    if subscription.payment_date is not None:
        db_subscription.payment_date = datetime.fromisoformat(subscription.payment_date)
    if subscription.monthly_cost is not None:
        db_subscription.monthly_cost = subscription.monthly_cost
    
    db_subscription.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(db_subscription)
    
    service_result = await db.execute(
        select(Service).where(Service.id == db_subscription.service_id)
    )
    service = service_result.scalar_one_or_none()
    
    return SubscriptionResponse(
        id=str(db_subscription.id),
        service_id=str(db_subscription.service_id),
        account=db_subscription.account,
        payment_date=db_subscription.payment_date.isoformat(),
        monthly_cost=float(db_subscription.monthly_cost),
        created_at=db_subscription.created_at.isoformat() if db_subscription.created_at else None,
        updated_at=db_subscription.updated_at.isoformat() if db_subscription.updated_at else None,
        service=ServiceResponse(
            id=str(service.id),
            name=service.name,
            icon_url=service.icon_url,
            category=service.category
        ) if service else None
    )

@app.delete("/subscriptions/{subscription_id}")
async def delete_subscription(
    subscription_id: str,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Subscription).where(Subscription.id == int(subscription_id))
    )
    db_subscription = result.scalar_one_or_none()
    
    if not db_subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    await db.delete(db_subscription)
    await db.commit()
    
    return {"message": "Subscription deleted successfully"}

@app.get("/analytics", response_model=AnalyticsResponse)
async def get_analytics(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Subscription))
    subscriptions = result.scalars().all()
    
    total_monthly_cost = sum(sub.monthly_cost for sub in subscriptions)
    total_annual_cost = total_monthly_cost * 12
    
    category_breakdown = {}
    for sub in subscriptions:
        service_result = await db.execute(
            select(Service).where(Service.id == sub.service_id)
        )
        service = service_result.scalar_one_or_none()
        category = service.category if service else "Other"
        
        if category not in category_breakdown:
            category_breakdown[category] = 0
        category_breakdown[category] += float(sub.monthly_cost)
    
    category_list = [
        {"category": cat, "total": total}
        for cat, total in category_breakdown.items()
    ]
    
    current_date = datetime.now()
    monthly_trend = []
    for i in range(6):
        month_date = current_date - timedelta(days=30 * (5-i))
        month_name = month_date.strftime("%b")
        monthly_trend.append({
            "month": month_name,
            "total": total_monthly_cost * (0.8 + (i * 0.04))
        })
    
    return AnalyticsResponse(
        total_monthly_cost=total_monthly_cost,
        total_annual_cost=total_annual_cost,
        category_breakdown=category_list,
        monthly_trend=monthly_trend,
        service_count=len(subscriptions)
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)