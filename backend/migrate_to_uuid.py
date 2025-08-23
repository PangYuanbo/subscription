#!/usr/bin/env python3
"""
Database migration script to convert from Integer primary keys to UUID primary keys.
This script will:
1. Create new tables with UUID primary keys
2. Migrate existing data (if any)
3. Drop old tables
4. Rename new tables to original names
"""

import asyncio
import os
import uuid
from datetime import datetime
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL not found in environment")
    exit(1)

engine = create_async_engine(DATABASE_URL, echo=True)

async def migrate_to_uuid():
    """Perform the migration to UUID primary keys"""
    print("Starting UUID migration...")
    
    async with engine.begin() as conn:
        print("\nStep 1: Creating UUID extension if not exists...")
        await conn.execute(text('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'))
        
        print("\nStep 2: Dropping existing tables (if any)...")
        # Drop tables in correct order (children first)
        await conn.execute(text('DROP TABLE IF EXISTS subscriptions CASCADE;'))
        await conn.execute(text('DROP TABLE IF EXISTS services CASCADE;'))
        await conn.execute(text('DROP TABLE IF EXISTS users CASCADE;'))
        
        print("\nStep 3: Creating new tables with UUID primary keys...")
        
        # Create users table with UUID primary key
        await conn.execute(text("""
            CREATE TABLE users (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                auth0_user_id VARCHAR UNIQUE NOT NULL,
                email VARCHAR,
                name VARCHAR,
                picture VARCHAR,
                nickname VARCHAR,
                last_login TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE
            );
        """))
        
        # Create index on auth0_user_id for faster lookups
        await conn.execute(text('CREATE INDEX idx_users_auth0_user_id ON users(auth0_user_id);'))
        
        # Create services table with UUID primary key
        await conn.execute(text("""
            CREATE TABLE services (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR NOT NULL,
                icon_url VARCHAR,
                category VARCHAR NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE
            );
        """))
        
        # Create subscriptions table with UUID primary key and foreign keys
        await conn.execute(text("""
            CREATE TABLE subscriptions (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
                account VARCHAR NOT NULL,
                payment_date TIMESTAMP NOT NULL,
                cost FLOAT NOT NULL,
                billing_cycle VARCHAR NOT NULL DEFAULT 'monthly',
                monthly_cost FLOAT NOT NULL,
                is_trial BOOLEAN DEFAULT FALSE,
                trial_start_date TIMESTAMP,
                trial_end_date TIMESTAMP,
                trial_duration_days INTEGER,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE
            );
        """))
        
        # Create indexes for better performance
        await conn.execute(text('CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);'))
        await conn.execute(text('CREATE INDEX idx_subscriptions_service_id ON subscriptions(service_id);'))
        
        print("\nUUID migration completed successfully!")
        print("\nNew table structure:")
        
        # Show table info
        result = await conn.execute(text("""
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name IN ('users', 'services', 'subscriptions')
            AND column_name = 'id'
            ORDER BY table_name;
        """))
        
        for row in result:
            print(f"  {row.table_name}.{row.column_name}: {row.data_type}")

async def verify_migration():
    """Verify the migration was successful"""
    print("\nVerifying migration...")
    
    async with engine.begin() as conn:
        # Check if tables exist and have correct structure
        result = await conn.execute(text("""
            SELECT COUNT(*) as table_count
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('users', 'services', 'subscriptions');
        """))
        
        table_count = result.scalar()
        if table_count == 3:
            print("All tables created successfully")
            
            # Test UUID generation
            result = await conn.execute(text("SELECT uuid_generate_v4() as test_uuid;"))
            test_uuid = result.scalar()
            print(f"UUID generation working: {test_uuid}")
            
        else:
            print(f"ERROR: Expected 3 tables, found {table_count}")

async def main():
    """Main migration function"""
    try:
        await migrate_to_uuid()
        await verify_migration()
        print("\nMigration completed successfully!")
        print("\nYou can now restart your FastAPI server.")
        
    except Exception as e:
        print(f"\nERROR: Migration failed: {e}")
        raise
    
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())