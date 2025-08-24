#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Database migration script: Add icon_source_url field to services table
"""
import asyncio
import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL environment variable not found")
    exit(1)

engine = create_async_engine(DATABASE_URL, echo=False)

async def migrate_icon_source():
    """Add icon_source_url field to services table"""
    print("Starting migration: Adding icon_source_url field...")
    
    async with engine.begin() as conn:
        # Step 1: Check if field already exists
        print("Step 1: Checking if icon_source_url field already exists...")
        try:
            result = await conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'services' 
                AND column_name = 'icon_source_url';
            """))
            
            column_exists = result.fetchone()
            if column_exists:
                print("INFO: icon_source_url field already exists")
                return
            
        except Exception as e:
            print(f"Error checking field: {e}")
        
        # Step 2: Add icon_source_url field
        print("Step 2: Adding icon_source_url field to services table...")
        try:
            await conn.execute(text("""
                ALTER TABLE services 
                ADD COLUMN icon_source_url VARCHAR;
            """))
            print("SUCCESS: Added icon_source_url field to services table")
        except Exception as e:
            if "already exists" in str(e) or "duplicate column" in str(e):
                print("INFO: icon_source_url field already exists")
            else:
                print(f"ERROR adding icon_source_url field: {e}")
        
        # Step 3: Set comments for existing records
        print("Step 3: Adding notes for existing records...")
        try:
            result = await conn.execute(text("""
                UPDATE services 
                SET icon_source_url = 'Legacy icon - no source URL recorded'
                WHERE icon_source_url IS NULL AND icon_url IS NOT NULL AND icon_url != '';
            """))
            print(f"SUCCESS: Updated {result.rowcount} existing records")
        except Exception as e:
            print(f"ERROR updating existing records: {e}")
        
        # Step 4: Verify changes
        print("Step 4: Verifying schema changes...")
        try:
            # Check field information
            result = await conn.execute(text("""
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = 'services' 
                AND column_name IN ('icon_url', 'icon_source_url')
                ORDER BY column_name;
            """))
            columns_info = result.fetchall()
            print("Icon-related fields in services table:")
            for col in columns_info:
                print(f"  {col[0]} ({col[1]}, nullable: {col[2]})")
            
            # Check record count
            result = await conn.execute(text("""
                SELECT 
                    COUNT(*) as total,
                    COUNT(icon_url) as with_icon,
                    COUNT(icon_source_url) as with_source
                FROM services;
            """))
            stats = result.fetchone()
            if stats:
                print(f"Services table stats: total {stats[0]}, with icon {stats[1]}, with source {stats[2]}")
        
        except Exception as e:
            print(f"ERROR verifying changes: {e}")
    
    await engine.dispose()
    print("Migration completed!")

if __name__ == "__main__":
    asyncio.run(migrate_icon_source())