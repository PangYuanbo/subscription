from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://user:password@localhost/subscriptions")

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)

engine = create_async_engine(
    DATABASE_URL, 
    echo=False,  # Disable SQL logging for better performance
    pool_size=5,  # Reduce pool size for Neon's connection limits
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=1800,  # 30 minutes
    connect_args={
        "command_timeout": 5,
        "server_settings": {
            "application_name": "subscription_app",
            "jit": "off"
        }
    }
)

AsyncSessionLocal = async_sessionmaker(
    engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db():
    async with engine.begin() as conn:
        from models import Base
        await conn.run_sync(Base.metadata.create_all)