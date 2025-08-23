#!/usr/bin/env python3
"""
Test script to verify database connection on Modal
"""
import modal

app = modal.App("test-db-connection")

image = modal.Image.debian_slim().pip_install(
    "sqlalchemy[asyncio]", 
    "asyncpg", 
    "python-dotenv"
)

@app.function(
    image=image,
    secrets=[modal.Secret.from_name("neon-db-url")]
)
def test_database():
    import asyncio
    import os
    from sqlalchemy.ext.asyncio import create_async_engine
    from sqlalchemy import text
    
    async def test_connection():
        DATABASE_URL = os.getenv("DATABASE_URL")
        print(f"Testing connection to: {DATABASE_URL[:50]}...")
        
        try:
            engine = create_async_engine(DATABASE_URL, echo=False)
            
            async with engine.begin() as conn:
                # Test basic connection
                result = await conn.execute(text("SELECT 1 as test"))
                test_value = result.scalar()
                print(f"SUCCESS: Basic connection test: {test_value}")
                
                # Check if tables exist
                result = await conn.execute(text("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name IN ('users', 'services', 'subscriptions', 'user_analytics')
                    ORDER BY table_name;
                """))
                
                tables = result.fetchall()
                print(f"TABLES: Found tables: {[row[0] for row in tables]}")
                
                # Check if UUID extension exists
                result = await conn.execute(text("""
                    SELECT EXISTS(
                        SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp'
                    ) as has_uuid_extension;
                """))
                has_uuid = result.scalar()
                print(f"UUID: UUID extension installed: {has_uuid}")
                
                # Test UUID generation
                if has_uuid:
                    result = await conn.execute(text("SELECT uuid_generate_v4() as test_uuid;"))
                    test_uuid = result.scalar()
                    print(f"TEST: UUID test: {test_uuid}")
                
            await engine.dispose()
            print("SUCCESS: Database connection test completed successfully!")
            return True
            
        except Exception as e:
            print(f"ERROR: Database connection failed: {e}")
            return False
    
    return asyncio.run(test_connection())

if __name__ == "__main__":
    # This allows running the test locally or on Modal
    with app.run():
        result = test_database.remote()
        print(f"Database test result: {result}")