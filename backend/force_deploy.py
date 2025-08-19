#!/usr/bin/env python3
"""
Force deploy script that rebuilds and deploys the latest code
"""
import modal
import os

def force_deploy():
    """Force deploy with rebuild"""
    try:
        print("Force deploying latest code...")
        
        # Import and deploy the app
        from modal_app import app
        
        # Force deployment
        app.deploy("subscription-manager")
        print("Deployment completed successfully!")
        print("App URL: https://yuanbopang--subscription-manager-fastapi-app.modal.run")
        
    except Exception as e:
        print(f"Deployment error: {e}")
        raise

if __name__ == "__main__":
    force_deploy()