import modal

app = modal.App("subscription-manager")

image = modal.Image.debian_slim().pip_install_from_requirements("requirements.txt")

@app.function(
    image=image,
    secrets=[
        modal.Secret.from_name("neon-db-url"), 
        modal.Secret.from_name("openrouter-api-key"),
        modal.Secret.from_name("auth0-config")
    ],
    scaledown_window=300,
)
@modal.asgi_app()
def fastapi_app():
    from fastapi import FastAPI, HTTPException, Depends, Header
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
    from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
    from sqlalchemy.orm import declarative_base
    from sqlalchemy import select, Column, Integer, String, Float, DateTime, ForeignKey, func, Boolean, Text
    from pydantic import BaseModel
    from typing import List, Optional
    from datetime import datetime, timedelta
    from enum import Enum
    import os
    import jwt
    import httpx
    from functools import wraps
    
    # Auth0 Configuration
    AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN")
    AUTH0_AUDIENCE = os.getenv("AUTH0_AUDIENCE")
    
    # Database setup
    DATABASE_URL = os.getenv("DATABASE_URL")
    
    engine = create_async_engine(
        DATABASE_URL, 
        echo=True,
        pool_size=20,
        max_overflow=0,
        pool_pre_ping=True,
        pool_recycle=300
    )
    
    AsyncSessionLocal = async_sessionmaker(
        engine, 
        class_=AsyncSession, 
        expire_on_commit=False
    )
    
    Base = declarative_base()
    
    # Models
    class User(Base):
        __tablename__ = "users"
        
        id = Column(Integer, primary_key=True, index=True)
        auth0_user_id = Column(String, unique=True, nullable=False, index=True)
        email = Column(String, unique=True, nullable=False, index=True)
        name = Column(String, nullable=True)
        picture = Column(String, nullable=True)
        nickname = Column(String, nullable=True)
        last_login = Column(DateTime, nullable=True)
        created_at = Column(DateTime, default=func.now())
        updated_at = Column(DateTime)

    class Service(Base):
        __tablename__ = "services"
        
        id = Column(Integer, primary_key=True, index=True)
        name = Column(String, nullable=False)
        icon_url = Column(String)
        category = Column(String, nullable=False)
        created_at = Column(DateTime, default=func.now())
        updated_at = Column(DateTime)
    
    class Subscription(Base):
        __tablename__ = "subscriptions"
        
        id = Column(Integer, primary_key=True, index=True)
        user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
        service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
        account = Column(String, nullable=False)
        payment_date = Column(DateTime, nullable=False)
        cost = Column(Float, nullable=False, default=0.0)
        billing_cycle = Column(String, default="monthly")
        monthly_cost = Column(Float, nullable=False)
        is_trial = Column(Boolean, default=False)
        trial_start_date = Column(DateTime, nullable=True)
        trial_end_date = Column(DateTime, nullable=True)
        trial_duration_days = Column(Integer, default=0)
        created_at = Column(DateTime, default=func.now())
        updated_at = Column(DateTime)
    
    # Schemas
    class BillingCycle(str, Enum):
        monthly = "monthly"
        yearly = "yearly"
    
    class ServiceResponse(BaseModel):
        id: str
        name: str
        icon_url: Optional[str]
        category: str
    
    class ServiceBase(BaseModel):
        name: str
        icon_url: Optional[str] = None
        category: str
    
    class SubscriptionResponse(BaseModel):
        id: str
        service_id: str
        account: str
        payment_date: str
        cost: float
        billing_cycle: str
        monthly_cost: float
        is_trial: bool
        trial_start_date: Optional[str]
        trial_end_date: Optional[str]
        trial_duration_days: Optional[int]
        created_at: Optional[str]
        updated_at: Optional[str]
        service: Optional[ServiceResponse]
    
    class SubscriptionCreate(BaseModel):
        service_id: int
        account: str
        payment_date: str
        cost: float
        billing_cycle: str = "monthly"
        monthly_cost: float
        is_trial: Optional[bool] = False
        trial_start_date: Optional[str] = None
        trial_end_date: Optional[str] = None
        trial_duration_days: Optional[int] = 0
        service: Optional[ServiceBase] = None
    
    class SubscriptionUpdate(BaseModel):
        account: Optional[str] = None
        payment_date: Optional[str] = None
        cost: Optional[float] = None
        billing_cycle: Optional[str] = None
        monthly_cost: Optional[float] = None
        is_trial: Optional[bool] = None
        trial_start_date: Optional[str] = None
        trial_end_date: Optional[str] = None
        trial_duration_days: Optional[int] = None
    
    class AnalyticsResponse(BaseModel):
        total_monthly_cost: float
        total_annual_cost: float
        category_breakdown: List[dict]
        monthly_trend: List[dict]
        service_count: int
    
    class NLPSubscriptionRequest(BaseModel):
        text: str
    
    class NLPSubscriptionResponse(BaseModel):
        success: bool
        message: str
        subscription: Optional[SubscriptionResponse] = None
        parsed_data: Optional[dict] = None
    
    # Auth0 JWT validation
    security = HTTPBearer()
    
    async def get_auth0_public_key():
        """Get Auth0 public key for JWT verification"""
        url = f"https://{AUTH0_DOMAIN}/.well-known/jwks.json"
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            return response.json()
    
    async def verify_jwt(credentials: HTTPAuthorizationCredentials = Depends(security)):
        """Verify JWT token and return user info"""
        if not AUTH0_DOMAIN or not AUTH0_AUDIENCE:
            # If Auth0 is not configured, return mock user
            return {"sub": "mock-user", "email": "test@example.com", "name": "Test User"}
            
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
        email = user_info.get("email")
        
        if not auth0_user_id or not email:
            raise HTTPException(status_code=400, detail="Invalid user information")
        
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
                last_login=datetime.utcnow()
            )
            db.add(user)
            await db.flush()
            await db.refresh(user)
        else:
            # Update last login
            user.last_login = datetime.utcnow()
            await db.flush()
        
        return user

    # Database helper
    async def get_db():
        async with AsyncSessionLocal() as session:
            try:
                yield session
            finally:
                await session.close()
    
    async def init_db():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    
    # FastAPI app
    fastapi_app = FastAPI(title="Subscription Manager API")
    
    fastapi_app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    @fastapi_app.on_event("startup")
    async def startup_event():
        await init_db()
    
    @fastapi_app.get("/")
    async def root():
        return {"message": "Subscription Manager API", "status": "running"}
    
    @fastapi_app.get("/user/profile")
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
    
    @fastapi_app.get("/subscriptions", response_model=List[SubscriptionResponse])
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
    
    @fastapi_app.post("/subscriptions", response_model=SubscriptionResponse)
    async def create_subscription(
        subscription: SubscriptionCreate,
        db: AsyncSession = Depends(get_db),
        user_info: dict = Depends(verify_jwt)
    ):
        # Get or create user
        current_user = await get_or_create_user(user_info, db)
        
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
            user_id=current_user.id,  # Associate with current user
            service_id=subscription.service_id,
            account=subscription.account,
            payment_date=datetime.fromisoformat(subscription.payment_date),
            cost=subscription.cost,
            billing_cycle=subscription.billing_cycle,
            monthly_cost=subscription.monthly_cost,
            is_trial=subscription.is_trial,
            trial_start_date=datetime.fromisoformat(subscription.trial_start_date) if subscription.trial_start_date else None,
            trial_end_date=datetime.fromisoformat(subscription.trial_end_date) if subscription.trial_end_date else None,
            trial_duration_days=subscription.trial_duration_days
        )
        
        db.add(db_subscription)
        await db.commit()
        await db.refresh(db_subscription)
        
        return SubscriptionResponse(
            id=str(db_subscription.id),
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
            created_at=db_subscription.created_at.isoformat() if db_subscription.created_at else None,
            updated_at=db_subscription.updated_at.isoformat() if db_subscription.updated_at else None,
            service=ServiceResponse(
                id=str(service.id),
                name=service.name,
                icon_url=service.icon_url,
                category=service.category
            ) if service else None
        )
    
    @fastapi_app.put("/subscriptions/{subscription_id}", response_model=SubscriptionResponse)
    async def update_subscription(
        subscription_id: str,
        subscription: SubscriptionUpdate,
        db: AsyncSession = Depends(get_db),
        user_info: dict = Depends(verify_jwt)
    ):
        # Get or create user
        current_user = await get_or_create_user(user_info, db)
        
        result = await db.execute(
            select(Subscription).where(
                Subscription.id == int(subscription_id),
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
            cost=float(db_subscription.cost),
            billing_cycle=db_subscription.billing_cycle,
            monthly_cost=float(db_subscription.monthly_cost),
            is_trial=db_subscription.is_trial,
            trial_start_date=db_subscription.trial_start_date.isoformat() if db_subscription.trial_start_date else None,
            trial_end_date=db_subscription.trial_end_date.isoformat() if db_subscription.trial_end_date else None,
            trial_duration_days=db_subscription.trial_duration_days,
            created_at=db_subscription.created_at.isoformat() if db_subscription.created_at else None,
            updated_at=db_subscription.updated_at.isoformat() if db_subscription.updated_at else None,
            service=ServiceResponse(
                id=str(service.id),
                name=service.name,
                icon_url=service.icon_url,
                category=service.category
            ) if service else None
        )
    
    @fastapi_app.delete("/subscriptions/{subscription_id}")
    async def delete_subscription(
        subscription_id: str,
        db: AsyncSession = Depends(get_db),
        user_info: dict = Depends(verify_jwt)
    ):
        # Get or create user
        current_user = await get_or_create_user(user_info, db)
        
        result = await db.execute(
            select(Subscription).where(
                Subscription.id == int(subscription_id),
                Subscription.user_id == current_user.id  # Only user's own subscriptions
            )
        )
        db_subscription = result.scalar_one_or_none()
        
        if not db_subscription:
            raise HTTPException(status_code=404, detail="Subscription not found")
        
        await db.delete(db_subscription)
        await db.commit()
        
        return {"message": "Subscription deleted successfully"}
    
    @fastapi_app.get("/analytics", response_model=AnalyticsResponse)
    async def get_analytics(
        db: AsyncSession = Depends(get_db),
        user_info: dict = Depends(verify_jwt)
    ):
        # Get or create user
        current_user = await get_or_create_user(user_info, db)
        
        # Get user's subscriptions only
        result = await db.execute(
            select(Subscription).where(Subscription.user_id == current_user.id)
        )
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
    
    # OpenRouter NLP Client
    import httpx
    import json
    
    class OpenRouterClient:
        def __init__(self):
            self.api_key = os.getenv("OPENROUTER_API_KEY")
            self.base_url = "https://openrouter.ai/api/v1"
            self.headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://yuanbopang--subscription-manager-fastapi-app.modal.run",
                "X-Title": "Subscription Manager"
            }
        
        async def parse_subscription_text(self, text: str) -> dict:
            prompt = f"""Parse the following subscription service description and extract key information in JSON format:

            Input text: {text}

            Please return JSON in the following format (JSON only, no other content):
            {{
                "service_name": "service name",
                "service_category": "service category (Entertainment, Productivity, Development, etc.)",
                "account": "account/email (if mentioned)",
                "monthly_cost": monthly cost amount (number),
                "payment_date": "payment date (YYYY-MM-DD format, use first day of next month if no specific date)",
                "is_trial": trial period (true/false),
                "trial_duration_days": trial period days (if trial)
            }}

            Notes:
            - If no clear amount, set monthly_cost to null
            - If no clear account info, set account to empty string
            - Categories: Entertainment, Productivity, Development, Cloud, Design, etc.
            """

            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        f"{self.base_url}/chat/completions",
                        headers=self.headers,
                        json={
                            "model": "meta-llama/llama-3.3-70b-instruct",
                            "messages": [
                                {"role": "user", "content": prompt}
                            ],
                            "temperature": 0.1
                        },
                        timeout=30.0
                    )
                    
                    if response.status_code == 200:
                        result = response.json()
                        content = result['choices'][0]['message']['content'].strip()
                        
                        # Extract JSON from the response
                        if content.startswith('```json'):
                            content = content[7:-3].strip()
                        elif content.startswith('```'):
                            content = content[3:-3].strip()
                        
                        try:
                            parsed_data = json.loads(content)
                            return parsed_data
                        except json.JSONDecodeError:
                            return {"error": "Failed to parse JSON response"}
                    else:
                        return {"error": f"API request failed: {response.status_code}"}
                        
            except Exception as e:
                return {"error": f"Request failed: {str(e)}"}
    
    openrouter_client = OpenRouterClient()
    
    @fastapi_app.post("/subscriptions/nlp", response_model=NLPSubscriptionResponse)
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
            
            subscription_response = SubscriptionResponse(
                id=str(db_subscription.id),
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
    
    return fastapi_app