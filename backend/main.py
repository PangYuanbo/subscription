from fastapi import FastAPI, HTTPException, Depends, Header, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from datetime import datetime, timedelta, timezone
import os
import jwt
import httpx
import uuid
import base64
from urllib.parse import urlparse
import hashlib
from dotenv import load_dotenv

from database import get_db, init_db
from models import Subscription, Service, User, UserAnalytics
from openrouter_client import openrouter_client
from schemas import (
    SubscriptionCreate, 
    SubscriptionUpdate, 
    SubscriptionResponse,
    ServiceResponse,
    AnalyticsResponse,
    NLPSubscriptionRequest,
    NLPMultimodalSubscriptionRequest,
    NLPSubscriptionResponse
)

load_dotenv()

# Auth0 Configuration
AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN")
AUTH0_AUDIENCE = os.getenv("AUTH0_AUDIENCE")

app = FastAPI(title="Subscription Manager API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth0 JWT validation

async def get_auth0_public_key():
    """Get Auth0 public key for JWT verification"""
    url = f"https://{AUTH0_DOMAIN}/.well-known/jwks.json"
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        return response.json()

async def verify_jwt(credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))):
    """Verify JWT token and return user info"""
    if not AUTH0_DOMAIN or not AUTH0_AUDIENCE:
        # If Auth0 is not configured, return mock user
        return {"sub": "mock-user", "email": "test@example.com", "name": "Test User"}
    
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
        
    try:
        # Get the token from the Authorization header
        token = credentials.credentials
        
        # Get Auth0 public key
        jwks = await get_auth0_public_key()
        
        # Decode the token header to get the key ID
        unverified_header = jwt.get_unverified_header(token)
        key_id = unverified_header["kid"]
        
        # Find the public key
        public_key = None
        for key in jwks["keys"]:
            if key["kid"] == key_id:
                public_key = jwt.algorithms.RSAAlgorithm.from_jwk(key)
                break
        
        if not public_key:
            raise HTTPException(status_code=401, detail="Public key not found")
        
        # Verify and decode the token
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            audience=AUTH0_AUDIENCE,
            issuer=f"https://{AUTH0_DOMAIN}/"
        )
        
        return payload
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token validation failed: {str(e)}")

async def get_or_create_user(user_info: dict, db: AsyncSession):
    """Get or create user from Auth0 info"""
    auth0_user_id = user_info.get("sub")
    
    if not auth0_user_id:
        raise HTTPException(status_code=400, detail="Invalid user information: missing user ID")
    
    # Email is optional - Auth0 may not provide it in JWT token
    email = user_info.get("email")
    
    # Try to find existing user
    result = await db.execute(
        select(User).where(User.auth0_user_id == auth0_user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        # Create new user
        user = User(
            auth0_user_id=auth0_user_id,
            email=email,
            name=user_info.get("name"),
            picture=user_info.get("picture"),
            nickname=user_info.get("nickname"),
            last_login=datetime.now(timezone.utc)
        )
        db.add(user)
        await db.flush()
        await db.refresh(user)
    else:
        # Update last login
        user.last_login = datetime.now(timezone.utc)
        await db.flush()
    
    return user

async def calculate_and_cache_analytics(user: User, db: AsyncSession):
    """Calculate and cache user analytics data"""
    
    # Get user's all subscriptions
    result = await db.execute(
        select(Subscription).where(Subscription.user_id == user.id)
    )
    subscriptions = result.scalars().all()
    
    # Calculate basic statistics
    total_monthly_cost = sum(sub.monthly_cost for sub in subscriptions)
    total_annual_cost = total_monthly_cost * 12
    service_count = len(subscriptions)
    
    # Calculate category statistics
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
    
    # Generate monthly trend data
    monthly_trend = []
    if subscriptions:
        monthly_data = {}
        for sub in subscriptions:
            month_key = sub.created_at.strftime("%Y-%m")
            month_name = sub.created_at.strftime("%b")
            if month_key not in monthly_data:
                monthly_data[month_key] = {"month": month_name, "total": 0}
            monthly_data[month_key]["total"] += sub.monthly_cost
        
        sorted_months = sorted(monthly_data.keys())
        monthly_trend = [monthly_data[month] for month in sorted_months]
    
    # Find or create analytics record
    analytics_result = await db.execute(
        select(UserAnalytics).where(UserAnalytics.user_id == user.id)
    )
    analytics = analytics_result.scalar_one_or_none()
    
    if not analytics:
        analytics = UserAnalytics(user_id=user.id)
        db.add(analytics)
    
    # Update analytics data
    analytics.total_monthly_cost = total_monthly_cost
    analytics.total_annual_cost = total_annual_cost
    analytics.service_count = service_count
    analytics.category_breakdown = category_list
    analytics.monthly_trend = monthly_trend
    analytics.last_calculated = datetime.now(timezone.utc)
    
    await db.flush()
    await db.refresh(analytics)
    
    return analytics

@app.on_event("startup")
async def startup_event():
    # Create the user_analytics table if it doesn't exist
    await init_db()

@app.get("/")
async def root():
    return {"message": "Subscription Manager API", "status": "running"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "message": "API is running",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0"
    }

@app.get("/user/profile")
async def get_user_profile(
    db: AsyncSession = Depends(get_db),
    user_info: dict = Depends(verify_jwt)
):
    """Get current user profile"""
    current_user = await get_or_create_user(user_info, db)
    
    return {
        "id": str(current_user.id),
        "auth0_user_id": current_user.auth0_user_id,
        "email": current_user.email,
        "name": current_user.name,
        "picture": current_user.picture,
        "nickname": current_user.nickname,
        "last_login": current_user.last_login.isoformat() if current_user.last_login else None,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
        "updated_at": current_user.updated_at.isoformat() if current_user.updated_at else None
    }

@app.get("/subscriptions", response_model=List[SubscriptionResponse])
async def get_subscriptions(
    db: AsyncSession = Depends(get_db),
    user_info: dict = Depends(verify_jwt)
):
    # Get or create user
    current_user = await get_or_create_user(user_info, db)
    
    # Get user's subscriptions only
    result = await db.execute(
        select(Subscription).where(Subscription.user_id == current_user.id)
        .order_by(Subscription.created_at.desc())
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
            user_id=str(sub.user_id),
            service_id=str(sub.service_id),
            account=sub.account,
            payment_date=sub.payment_date.isoformat(),
            cost=float(sub.cost),
            billing_cycle=sub.billing_cycle,
            monthly_cost=float(sub.monthly_cost),
            is_trial=sub.is_trial,
            trial_start_date=sub.trial_start_date.isoformat() if sub.trial_start_date else None,
            trial_end_date=sub.trial_end_date.isoformat() if sub.trial_end_date else None,
            trial_duration_days=sub.trial_duration_days,
            auto_pay=sub.auto_pay,
            created_at=sub.created_at.isoformat() if sub.created_at else None,
            updated_at=sub.updated_at.isoformat() if sub.updated_at else None,
            service=ServiceResponse(
                id=str(service.id),
                name=service.name,
                icon_url=service.icon_url,
                icon_source_url=service.icon_source_url if hasattr(service, 'icon_source_url') else None,
                category=service.category
            ) if service else None
        )
        subscription_responses.append(response)
    
    return subscription_responses

@app.post("/subscriptions", response_model=SubscriptionResponse)
async def create_subscription(
    subscription: SubscriptionCreate,
    db: AsyncSession = Depends(get_db),
    user_info: dict = Depends(verify_jwt)
):
    # Get or create user
    current_user = await get_or_create_user(user_info, db)
    
    # Handle service creation/lookup
    # First try to find service by name (for predefined services)
    service = None
    if subscription.service:
        service_result = await db.execute(
            select(Service).where(Service.name == subscription.service.name)
        )
        service = service_result.scalar_one_or_none()
    
    if not service and subscription.service:
        # Create new service if not found
        service = Service(
            name=subscription.service.name,
            icon_url=subscription.service.icon_url if subscription.service.icon_url else "",
            icon_source_url=subscription.service.icon_source_url if hasattr(subscription.service, 'icon_source_url') and subscription.service.icon_source_url else None,
            category=subscription.service.category
        )
        db.add(service)
        await db.flush()  # Get the ID
        await db.refresh(service)
    
    if not service:
        raise HTTPException(status_code=422, detail="Service information is required")
    
    db_subscription = Subscription(
        user_id=current_user.id,  # Associate with current user
        service_id=service.id,
        account=subscription.account,
        payment_date=datetime.fromisoformat(subscription.payment_date),
        cost=subscription.cost,
        billing_cycle=subscription.billing_cycle,
        monthly_cost=subscription.monthly_cost,
        is_trial=subscription.is_trial,
        trial_start_date=datetime.fromisoformat(subscription.trial_start_date) if subscription.trial_start_date else None,
        trial_end_date=datetime.fromisoformat(subscription.trial_end_date) if subscription.trial_end_date else None,
        trial_duration_days=subscription.trial_duration_days,
        auto_pay=subscription.auto_pay
    )
    
    db.add(db_subscription)
    await db.commit()
    await db.refresh(db_subscription)
    
    # Update user analytics cache
    await calculate_and_cache_analytics(current_user, db)
    await db.commit()
    
    return SubscriptionResponse(
        id=str(db_subscription.id),
        user_id=str(db_subscription.user_id),
        service_id=str(db_subscription.service_id),
        account=db_subscription.account,
        payment_date=db_subscription.payment_date.isoformat(),
        cost=float(db_subscription.cost),
        billing_cycle=db_subscription.billing_cycle,
        monthly_cost=float(db_subscription.monthly_cost),
        is_trial=db_subscription.is_trial,
        trial_start_date=db_subscription.trial_start_date.isoformat() if db_subscription.trial_start_date else None,
        trial_end_date=db_subscription.trial_end_date.isoformat() if db_subscription.trial_end_date else None,
        trial_duration_days=db_subscription.trial_duration_days,
        auto_pay=db_subscription.auto_pay,
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
    db: AsyncSession = Depends(get_db),
    user_info: dict = Depends(verify_jwt)
):
    # Get or create user
    current_user = await get_or_create_user(user_info, db)
    
    # Convert subscription_id to UUID if it's a string
    try:
        subscription_uuid = uuid.UUID(subscription_id) if isinstance(subscription_id, str) else subscription_id
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid subscription ID format")
    
    result = await db.execute(
        select(Subscription).where(
            Subscription.id == subscription_uuid,
            Subscription.user_id == current_user.id  # Only user's own subscriptions
        )
    )
    db_subscription = result.scalar_one_or_none()
    
    if not db_subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    if subscription.account is not None:
        db_subscription.account = subscription.account
    if subscription.payment_date is not None:
        db_subscription.payment_date = datetime.fromisoformat(subscription.payment_date)
    if subscription.cost is not None:
        db_subscription.cost = subscription.cost
    if subscription.billing_cycle is not None:
        db_subscription.billing_cycle = subscription.billing_cycle
    if subscription.monthly_cost is not None:
        db_subscription.monthly_cost = subscription.monthly_cost
    if subscription.is_trial is not None:
        db_subscription.is_trial = subscription.is_trial
    if subscription.trial_start_date is not None:
        db_subscription.trial_start_date = datetime.fromisoformat(subscription.trial_start_date) if subscription.trial_start_date else None
    if subscription.trial_end_date is not None:
        db_subscription.trial_end_date = datetime.fromisoformat(subscription.trial_end_date) if subscription.trial_end_date else None
    if subscription.trial_duration_days is not None:
        db_subscription.trial_duration_days = subscription.trial_duration_days
    if subscription.auto_pay is not None:
        db_subscription.auto_pay = subscription.auto_pay
    
    db_subscription.updated_at = datetime.now(timezone.utc)
    
    await db.commit()
    await db.refresh(db_subscription)
    
    # Update user analytics cache
    await calculate_and_cache_analytics(current_user, db)
    await db.commit()
    
    service_result = await db.execute(
        select(Service).where(Service.id == db_subscription.service_id)
    )
    service = service_result.scalar_one_or_none()
    
    return SubscriptionResponse(
        id=str(db_subscription.id),
        user_id=str(db_subscription.user_id),
        service_id=str(db_subscription.service_id),
        account=db_subscription.account,
        payment_date=db_subscription.payment_date.isoformat(),
        cost=float(db_subscription.cost),
        billing_cycle=db_subscription.billing_cycle,
        monthly_cost=float(db_subscription.monthly_cost),
        is_trial=db_subscription.is_trial,
        trial_start_date=db_subscription.trial_start_date.isoformat() if db_subscription.trial_start_date else None,
        trial_end_date=db_subscription.trial_end_date.isoformat() if db_subscription.trial_end_date else None,
        trial_duration_days=db_subscription.trial_duration_days,
        auto_pay=db_subscription.auto_pay,
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
    db: AsyncSession = Depends(get_db),
    user_info: dict = Depends(verify_jwt)
):
    # Get or create user
    current_user = await get_or_create_user(user_info, db)
    
    # Convert subscription_id to UUID if it's a string
    try:
        subscription_uuid = uuid.UUID(subscription_id) if isinstance(subscription_id, str) else subscription_id
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid subscription ID format")
    
    result = await db.execute(
        select(Subscription).where(
            Subscription.id == subscription_uuid,
            Subscription.user_id == current_user.id  # Only user's own subscriptions
        )
    )
    db_subscription = result.scalar_one_or_none()
    
    if not db_subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    await db.delete(db_subscription)
    await db.commit()
    
    # Update user analytics cache
    await calculate_and_cache_analytics(current_user, db)
    await db.commit()
    
    return {"message": "Subscription deleted successfully"}

@app.get("/analytics", response_model=AnalyticsResponse)
async def get_analytics(
    db: AsyncSession = Depends(get_db),
    user_info: dict = Depends(verify_jwt),
    force_refresh: bool = False
):
    # Get or create user
    current_user = await get_or_create_user(user_info, db)
    
    # Try to get analytics data from cache
    analytics_result = await db.execute(
        select(UserAnalytics).where(UserAnalytics.user_id == current_user.id)
    )
    analytics = analytics_result.scalar_one_or_none()
    
    # Check if cache needs refresh
    should_refresh = (
        force_refresh or 
        not analytics or 
        not analytics.last_calculated or
        (datetime.now(timezone.utc) - analytics.last_calculated).total_seconds() > 3600  # Expires after 1 hour
    )
    
    if should_refresh:
        # Recalculate and cache data
        analytics = await calculate_and_cache_analytics(current_user, db)
        await db.commit()
    
    # Return cached data
    return AnalyticsResponse(
        total_monthly_cost=analytics.total_monthly_cost,
        total_annual_cost=analytics.total_annual_cost,
        category_breakdown=analytics.category_breakdown or [],
        monthly_trend=analytics.monthly_trend or [],
        service_count=analytics.service_count
    )

@app.post("/subscriptions/nlp", response_model=NLPSubscriptionResponse)
async def create_subscription_from_nlp(
    request: NLPSubscriptionRequest,
    db: AsyncSession = Depends(get_db),
    user_info: dict = Depends(verify_jwt)
):
    try:
        # Get or create user
        current_user = await get_or_create_user(user_info, db)
        
        parsed_data = await openrouter_client.parse_subscription_text(request.text)
        
        if not parsed_data or not parsed_data.get("service_name"):
            return NLPSubscriptionResponse(
                success=False,
                message="Unable to parse subscription information, please provide more details",
                parsed_data=parsed_data
            )
        
        if not parsed_data.get("monthly_cost"):
            return NLPSubscriptionResponse(
                success=False,
                message="Unable to determine monthly cost, please specify the amount",
                parsed_data=parsed_data
            )
        
        # Create or get service
        service_result = await db.execute(
            select(Service).where(Service.name == parsed_data["service_name"])
        )
        service = service_result.scalar_one_or_none()
        
        if not service:
            service = Service(
                name=parsed_data["service_name"],
                icon_url="",
                category=parsed_data["service_category"]
            )
            db.add(service)
            await db.flush()
            await db.refresh(service)
        
        # Calculate trial dates if trial is present
        trial_start_date = None
        trial_end_date = None
        if parsed_data.get("is_trial") and parsed_data.get("trial_duration_days", 0) > 0:
            trial_start_date = datetime.now()
            trial_end_date = trial_start_date + timedelta(days=parsed_data["trial_duration_days"])
        
        # Create subscription
        db_subscription = Subscription(
            user_id=current_user.id,  # Associate with current user
            service_id=service.id,
            account=parsed_data["account"],
            payment_date=datetime.fromisoformat(parsed_data["payment_date"]),
            cost=parsed_data["monthly_cost"],
            billing_cycle="monthly",
            monthly_cost=parsed_data["monthly_cost"],
            is_trial=parsed_data.get("is_trial", False),
            trial_start_date=trial_start_date,
            trial_end_date=trial_end_date,
            trial_duration_days=parsed_data.get("trial_duration_days", 0)
        )
        
        db.add(db_subscription)
        await db.commit()
        await db.refresh(db_subscription)
        
        # Update user analytics cache
        await calculate_and_cache_analytics(current_user, db)
        await db.commit()
        
        subscription_response = SubscriptionResponse(
            id=str(db_subscription.id),
            user_id=str(db_subscription.user_id),
            service_id=str(db_subscription.service_id),
            account=db_subscription.account,
            payment_date=db_subscription.payment_date.isoformat(),
            cost=float(db_subscription.cost),
            billing_cycle=db_subscription.billing_cycle,
            monthly_cost=float(db_subscription.monthly_cost),
            is_trial=db_subscription.is_trial,
            trial_start_date=db_subscription.trial_start_date.isoformat() if db_subscription.trial_start_date else None,
            trial_end_date=db_subscription.trial_end_date.isoformat() if db_subscription.trial_end_date else None,
            trial_duration_days=db_subscription.trial_duration_days,
            auto_pay=db_subscription.auto_pay,
            created_at=db_subscription.created_at.isoformat() if db_subscription.created_at else None,
            updated_at=db_subscription.updated_at.isoformat() if db_subscription.updated_at else None,
            service=ServiceResponse(
                id=str(service.id),
                name=service.name,
                icon_url=service.icon_url,
                category=service.category
            )
        )
        
        return NLPSubscriptionResponse(
            success=True,
            message="Subscription information added successfully",
            subscription=subscription_response,
            parsed_data=parsed_data
        )
        
    except Exception as e:
        print(f"Error creating subscription from NLP: {e}")
        return NLPSubscriptionResponse(
            success=False,
            message=f"Error processing request: {str(e)}",
            parsed_data=None
        )

@app.post("/subscriptions/nlp-multimodal", response_model=NLPSubscriptionResponse)
async def create_subscription_from_nlp_multimodal(
    request: NLPMultimodalSubscriptionRequest,
    db: AsyncSession = Depends(get_db),
    user_info: dict = Depends(verify_jwt)
):
    try:
        # Get or create user
        current_user = await get_or_create_user(user_info, db)
        
        # Parse subscription with image
        parsed_data = await openrouter_client.parse_subscription_text(request.text, request.image)
        
        if not parsed_data or not parsed_data.get("service_name"):
            return NLPSubscriptionResponse(
                success=False,
                message="Unable to parse subscription information from image, please provide more details",
                parsed_data=parsed_data
            )
        
        if not parsed_data.get("monthly_cost"):
            return NLPSubscriptionResponse(
                success=False,
                message="Unable to determine monthly cost from image, please specify the amount",
                parsed_data=parsed_data
            )
        
        # Create or get service
        service_result = await db.execute(
            select(Service).where(Service.name == parsed_data["service_name"])
        )
        service = service_result.scalar_one_or_none()
        
        if not service:
            service = Service(
                name=parsed_data["service_name"],
                icon_url="",
                category=parsed_data["service_category"]
            )
            db.add(service)
            await db.flush()
            await db.refresh(service)
        
        # Calculate trial dates if trial is present
        trial_start_date = None
        trial_end_date = None
        if parsed_data.get("is_trial") and parsed_data.get("trial_duration_days", 0) > 0:
            trial_start_date = datetime.now()
            trial_end_date = trial_start_date + timedelta(days=parsed_data["trial_duration_days"])
        
        # Create subscription
        db_subscription = Subscription(
            user_id=current_user.id,  # Associate with current user
            service_id=service.id,
            account=parsed_data["account"],
            payment_date=datetime.fromisoformat(parsed_data["payment_date"]),
            cost=parsed_data["monthly_cost"],
            billing_cycle="monthly",
            monthly_cost=parsed_data["monthly_cost"],
            is_trial=parsed_data.get("is_trial", False),
            trial_start_date=trial_start_date,
            trial_end_date=trial_end_date,
            trial_duration_days=parsed_data.get("trial_duration_days", 0)
        )
        
        db.add(db_subscription)
        await db.commit()
        await db.refresh(db_subscription)
        
        # Update user analytics cache
        await calculate_and_cache_analytics(current_user, db)
        await db.commit()
        
        subscription_response = SubscriptionResponse(
            id=str(db_subscription.id),
            user_id=str(db_subscription.user_id),
            service_id=str(db_subscription.service_id),
            account=db_subscription.account,
            payment_date=db_subscription.payment_date.isoformat(),
            cost=float(db_subscription.cost),
            billing_cycle=db_subscription.billing_cycle,
            monthly_cost=float(db_subscription.monthly_cost),
            is_trial=db_subscription.is_trial,
            trial_start_date=db_subscription.trial_start_date.isoformat() if db_subscription.trial_start_date else None,
            trial_end_date=db_subscription.trial_end_date.isoformat() if db_subscription.trial_end_date else None,
            trial_duration_days=db_subscription.trial_duration_days,
            auto_pay=db_subscription.auto_pay,
            created_at=db_subscription.created_at.isoformat() if db_subscription.created_at else None,
            updated_at=db_subscription.updated_at.isoformat() if db_subscription.updated_at else None,
            service=ServiceResponse(
                id=str(service.id),
                name=service.name,
                icon_url=service.icon_url,
                category=service.category
            )
        )
        
        return NLPSubscriptionResponse(
            success=True,
            message="Subscription information extracted from image and added successfully",
            subscription=subscription_response,
            parsed_data=parsed_data
        )
        
    except Exception as e:
        print(f"Error creating subscription from NLP multimodal: {e}")
        return NLPSubscriptionResponse(
            success=False,
            message=f"Error processing image and text: {str(e)}",
            parsed_data=None
        )

@app.get("/fetch-icon")
async def fetch_website_icon(url: str, return_url_only: bool = False):
    """Fetch favicon from a website URL
    
    Args:
        url: Website URL to fetch icon from
        return_url_only: If True, return the icon URL instead of base64 data
    """
    try:
        # Parse and validate URL
        if not url.startswith('http'):
            url = f"https://{url}"
        
        parsed_url = urlparse(url)
        domain = parsed_url.netloc
        
        if not domain:
            raise HTTPException(status_code=400, detail="Invalid URL")
        
        # Try different favicon URLs
        favicon_urls = [
            f"https://{domain}/favicon.ico",
            f"https://{domain}/favicon.png", 
            f"https://{domain}/apple-touch-icon.png",
            f"https://www.google.com/s2/favicons?domain={domain}&sz=128"
        ]
        
        if return_url_only:
            # Just return the URL that works
            async with httpx.AsyncClient(timeout=10.0) as client:
                for favicon_url in favicon_urls:
                    try:
                        response = await client.head(favicon_url)
                        if response.status_code == 200:
                            return {
                                "success": True,
                                "icon_url": favicon_url,
                                "icon_source_url": url,
                                "domain": domain
                            }
                    except Exception:
                        continue
            
            # Return Google's favicon service as fallback
            fallback_url = f"https://www.google.com/s2/favicons?domain={domain}&sz=128"
            return {
                "success": True,
                "icon_url": fallback_url,
                "icon_source_url": url,
                "domain": domain
            }
        else:
            # Return base64 data (backward compatibility)
            async with httpx.AsyncClient(timeout=10.0) as client:
                for favicon_url in favicon_urls:
                    try:
                        response = await client.get(favicon_url)
                        if response.status_code == 200 and len(response.content) > 0:
                            # Check if it's actually an image
                            content_type = response.headers.get('content-type', '')
                            if content_type.startswith('image/'):
                                # Convert to base64 for frontend
                                image_data = base64.b64encode(response.content).decode('utf-8')
                                return {
                                    "success": True,
                                    "icon_url": f"data:{content_type};base64,{image_data}",
                                    "icon_source_url": url,
                                    "domain": domain
                                }
                    except Exception:
                        continue
            
            # If all attempts fail, return Google's favicon service as fallback
            fallback_url = f"https://www.google.com/s2/favicons?domain={domain}&sz=128"
            return {
                "success": True,
                "icon_url": fallback_url,
                "icon_source_url": url,
                "domain": domain
            }
        
    except Exception as e:
        print(f"Error fetching icon: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch icon")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)