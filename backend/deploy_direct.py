#!/usr/bin/env python3
"""
Direct deployment using Modal Python API
"""
import modal

def deploy_app():
    """Deploy the app directly using Modal API"""
    try:
        # Import the app from modal_app
        from modal_app import app
        
        # Deploy the app
        print("Starting deployment...")
        
        # This will deploy the app
        with app.run():
            print("App deployed successfully!")
            print(f"App URL: https://yuanbopang--subscription-manager-fastapi-app.modal.run")
            
    except Exception as e:
        print(f"Deployment error: {e}")
        raise

if __name__ == "__main__":
    deploy_app()