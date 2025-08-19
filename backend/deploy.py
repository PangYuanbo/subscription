#!/usr/bin/env python3
"""
Deployment script for Modal app
"""
import subprocess
import sys
import os

def main():
    """Deploy the Modal app"""
    try:
        # Change to backend directory
        os.chdir(os.path.dirname(os.path.abspath(__file__)))
        
        # Run modal deploy
        result = subprocess.run([
            sys.executable, "-m", "modal", "deploy", "modal_app.py"
        ], capture_output=True, text=True, encoding='utf-8')
        
        print("STDOUT:")
        print(result.stdout)
        
        if result.stderr:
            print("STDERR:")
            print(result.stderr)
        
        print(f"Return code: {result.returncode}")
        
        if result.returncode == 0:
            print("Deployment successful!")
        else:
            print("Deployment failed!")
            
    except Exception as e:
        print(f"Error during deployment: {e}")

if __name__ == "__main__":
    main()