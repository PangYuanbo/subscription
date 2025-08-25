#!/usr/bin/env python3
"""
Database schema update script to add auto_pay column and weekly billing cycle
"""
import asyncio
from sqlalchemy import text
from database import engine, Base

async def update_database():
    """Update database schema to include new fields"""
    
    print("Starting database schema update...")
    
    async with engine.begin() as conn:
        # First, check if tables exist
        result = await conn.execute(text("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public'
        """))
        tables = [row[0] for row in result.fetchall()]
        print(f"Found existing tables: {tables}")
        
        if tables:
            # Drop all tables in correct dependency order
            print("Dropping existing tables...")
            await conn.execute(text('DROP TABLE IF EXISTS subscriptions CASCADE;'))
            await conn.execute(text('DROP TABLE IF EXISTS services CASCADE;')) 
            await conn.execute(text('DROP TABLE IF EXISTS users CASCADE;'))
            await conn.execute(text('DROP TABLE IF EXISTS user_analytics CASCADE;'))
            
            # Drop and recreate the enum type
            await conn.execute(text('DROP TYPE IF EXISTS billingcycle CASCADE;'))
            print("Dropped all tables and enum types")
        
        # Recreate all tables with updated schema
        print("Creating tables with new schema...")
        await conn.run_sync(Base.metadata.create_all)
        print("Database schema updated successfully!")
        
        # Verify the new schema
        result = await conn.execute(text("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'subscriptions' 
            ORDER BY ordinal_position
        """))
        columns = result.fetchall()
        print("\nSubscriptions table columns:")
        for col_name, col_type in columns:
            print(f"  - {col_name}: {col_type}")
            
        # Verify billing cycle enum values
        result = await conn.execute(text("""
            SELECT enumlabel 
            FROM pg_enum e
            JOIN pg_type t ON e.enumtypid = t.oid
            WHERE t.typname = 'billingcycle'
            ORDER BY enumsortorder
        """))
        enum_values = [row[0] for row in result.fetchall()]
        print(f"\nBillingCycle enum values: {enum_values}")
    
    await engine.dispose()
    print("\nDatabase update completed!")

if __name__ == "__main__":
    asyncio.run(update_database())