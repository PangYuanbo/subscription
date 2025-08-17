import httpx
import json
import os
from typing import Dict, Optional
from datetime import datetime
import re

class OpenRouterClient:
    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        if not self.api_key:
            raise ValueError("OPENROUTER_API_KEY environment variable is required")
        
        self.base_url = "https://openrouter.ai/api/v1"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    async def parse_subscription_text(self, text: str) -> Optional[Dict]:
        # Try pattern-based parsing first for common cases
        fallback_result = self._try_pattern_based_parsing(text)
        if fallback_result:
            return fallback_result
            
        # If pattern-based parsing fails, try OpenRouter
        prompt = f"""
Parse the following natural language text into structured subscription service data. Return JSON format with the following fields:
- service_name: Service name
- service_category: Service category (e.g., "Streaming", "Software", "Cloud", "Music", "Gaming", "Other")
- account: Account information
- monthly_cost: Monthly cost (number)
- payment_date: Next payment date (YYYY-MM-DD format)
- is_trial: Whether there is a trial period (true/false)
- trial_duration_days: Trial period duration in days

Notes:
1. If keywords like "free", "trial", "免费", "试用" are mentioned, set is_trial to true
2. If "first few months free" is mentioned, calculate trial_duration_days accordingly
3. Monthly cost should be the regular cost after trial period
4. If information is incomplete or cannot be parsed, use null for the respective fields

User input: {text}

Return only JSON, no other explanation.
"""
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=self.headers,
                    json={
                        "model": "openai/gpt-3.5-turbo",
                        "messages": [
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.1,
                        "max_tokens": 500
                    },
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    content = result["choices"][0]["message"]["content"]
                    
                    # Extract JSON from the response
                    json_match = re.search(r'\{.*\}', content, re.DOTALL)
                    if json_match:
                        parsed_data = json.loads(json_match.group())
                        return self._validate_and_normalize(parsed_data)
                    
                return fallback_result
                
        except Exception as e:
            print(f"Error parsing with OpenRouter: {e}")
            return fallback_result
    
    def _validate_and_normalize(self, data: Dict) -> Dict:
        """Validate and normalize the parsed data"""
        normalized = {
            "service_name": data.get("service_name", "").strip() if data.get("service_name") else None,
            "service_category": data.get("service_category", "Other"),
            "account": data.get("account", "").strip() if data.get("account") else "Default Account",
            "monthly_cost": None,
            "payment_date": None,
            "is_trial": data.get("is_trial", False),
            "trial_duration_days": data.get("trial_duration_days", 0)
        }
        
        # Validate monthly_cost
        try:
            if data.get("monthly_cost") is not None:
                normalized["monthly_cost"] = float(data["monthly_cost"])
        except (ValueError, TypeError):
            pass
        
        # Validate payment_date
        try:
            if data.get("payment_date"):
                # Try to parse the date to validate format
                datetime.fromisoformat(data["payment_date"])
                normalized["payment_date"] = data["payment_date"]
        except (ValueError, TypeError):
            # If no valid date provided, use next month's first day
            next_month = datetime.now().replace(day=1)
            if next_month.month == 12:
                next_month = next_month.replace(year=next_month.year + 1, month=1)
            else:
                next_month = next_month.replace(month=next_month.month + 1)
            normalized["payment_date"] = next_month.strftime("%Y-%m-%d")
        
        return normalized
    
    def _try_pattern_based_parsing(self, text: str) -> Optional[Dict]:
        """Try to parse common subscription patterns using regex"""
        text_lower = text.lower()
        
        # Amazon Prime pattern
        if "amazon" in text_lower and "prime" in text_lower:
            # Extract price
            price_match = re.search(r'(\d+\.?\d*)', text)
            monthly_cost = float(price_match.group(1)) if price_match else 6.99
            
            # Check for trial period
            is_trial = False
            trial_days = 0
            if any(word in text_lower for word in ["免费", "试用", "trial", "free"]):
                is_trial = True
                # Look for duration
                if "三个月" in text or "3个月" in text or "3 个月" in text:
                    trial_days = 90
                elif "一个月" in text or "1个月" in text or "1 个月" in text:
                    trial_days = 30
                elif "两个月" in text or "2个月" in text or "2 个月" in text:
                    trial_days = 60
            
            return {
                "service_name": "Amazon Prime",
                "service_category": "Streaming",
                "account": "Default Account",
                "monthly_cost": monthly_cost,
                "payment_date": self._get_default_payment_date(),
                "is_trial": is_trial,
                "trial_duration_days": trial_days
            }
        
        return None
    
    def _get_default_payment_date(self) -> str:
        """Get default payment date (next month's first day)"""
        next_month = datetime.now().replace(day=1)
        if next_month.month == 12:
            next_month = next_month.replace(year=next_month.year + 1, month=1)
        else:
            next_month = next_month.replace(month=next_month.month + 1)
        return next_month.strftime("%Y-%m-%d")

# Global instance
openrouter_client = OpenRouterClient()