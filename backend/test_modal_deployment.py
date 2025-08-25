#!/usr/bin/env python3
"""
Modal Deployment Test Suite
Automated testing for all Modal deployment endpoints and functionality
"""

import asyncio
import json
import sys
from datetime import datetime
from typing import Dict, Any, List
import httpx

# Configuration
MODAL_URL = "https://yuanbopang--subscription-manager-fastapi-app.modal.run"
TIMEOUT = 30.0

# Test color output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'

def print_header(text: str):
    """Print test section header"""
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}")
    print(f"{text}")
    print(f"{'='*60}{Colors.END}")

def print_test(test_name: str):
    """Print test name"""
    print(f"\n{Colors.BOLD}[TEST] {test_name}{Colors.END}")

def print_success(message: str):
    """Print success message"""
    print(f"{Colors.GREEN}[OK] {message}{Colors.END}")

def print_error(message: str):
    """Print error message"""
    print(f"{Colors.RED}[ERROR] {message}{Colors.END}")

def print_warning(message: str):
    """Print warning message"""
    print(f"{Colors.YELLOW}[WARNING] {message}{Colors.END}")

def print_info(message: str):
    """Print info message"""
    print(f"{Colors.BLUE}[INFO] {message}{Colors.END}")

class ModalDeploymentTester:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.client = httpx.AsyncClient(timeout=TIMEOUT)
        self.test_results = []
        
    async def __aenter__(self):
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()
    
    def record_test(self, test_name: str, success: bool, message: str, details: Dict = None):
        """Record test result"""
        self.test_results.append({
            "test": test_name,
            "success": success,
            "message": message,
            "details": details or {},
            "timestamp": datetime.now().isoformat()
        })
        
        if success:
            print_success(f"{test_name}: {message}")
        else:
            print_error(f"{test_name}: {message}")
    
    async def test_basic_connectivity(self):
        """Test basic connectivity"""
        print_test("Basic Connectivity Test")
        
        try:
            response = await self.client.get(f"{self.base_url}/")
            if response.status_code == 200:
                data = response.json()
                self.record_test(
                    "Basic Connectivity",
                    True,
                    f"API responding: {data.get('message', 'Unknown')}",
                    {"status_code": response.status_code, "response": data}
                )
                return True
            else:
                self.record_test(
                    "Basic Connectivity",
                    False,
                    f"Unexpected status code: {response.status_code}",
                    {"status_code": response.status_code}
                )
                return False
        except Exception as e:
            self.record_test(
                "Basic Connectivity",
                False,
                f"Connection failed: {str(e)}"
            )
            return False
    
    async def test_api_schema(self):
        """Test API Schema"""
        print_test("API Schema Test")
        
        try:
            response = await self.client.get(f"{self.base_url}/openapi.json")
            if response.status_code == 200:
                schema = response.json()
                
                # Check critical schemas
                required_schemas = [
                    "ServiceResponse",
                    "SubscriptionResponse", 
                    "AnalyticsResponse",
                    "NLPSubscriptionResponse"
                ]
                
                missing_schemas = []
                for schema_name in required_schemas:
                    if schema_name not in schema.get("components", {}).get("schemas", {}):
                        missing_schemas.append(schema_name)
                
                if missing_schemas:
                    self.record_test(
                        "API Schema",
                        False,
                        f"Missing schemas: {', '.join(missing_schemas)}"
                    )
                    return False
                
                # Check if ServiceResponse contains icon_source_url
                service_schema = schema["components"]["schemas"]["ServiceResponse"]["properties"]
                if "icon_source_url" not in service_schema:
                    self.record_test(
                        "API Schema",
                        False,
                        "ServiceResponse missing icon_source_url field"
                    )
                    return False
                
                self.record_test(
                    "API Schema",
                    True,
                    f"All required schemas present, ServiceResponse includes icon_source_url",
                    {"schema_count": len(schema.get("components", {}).get("schemas", {}))}
                )
                return True
            else:
                self.record_test(
                    "API Schema",
                    False,
                    f"Failed to get OpenAPI schema: {response.status_code}"
                )
                return False
        except Exception as e:
            self.record_test(
                "API Schema",
                False,
                f"Schema test failed: {str(e)}"
            )
            return False
    
    async def test_icon_fetch_functionality(self):
        """Test icon fetch functionality"""
        print_test("Icon Fetch Functionality Test")
        
        test_urls = ["netflix.com", "spotify.com", "github.com"]
        
        for url in test_urls:
            # Test URL mode
            try:
                response = await self.client.get(
                    f"{self.base_url}/fetch-icon",
                    params={"url": url, "return_url_only": "true"}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success") and data.get("icon_url") and data.get("icon_source_url"):
                        self.record_test(
                            f"Icon Fetch URL Mode - {url}",
                            True,
                            f"Successfully fetched icon URL",
                            {"url": data.get("icon_url"), "source": data.get("icon_source_url")}
                        )
                    else:
                        self.record_test(
                            f"Icon Fetch URL Mode - {url}",
                            False,
                            f"Invalid response format: {data}"
                        )
                else:
                    self.record_test(
                        f"Icon Fetch URL Mode - {url}",
                        False,
                        f"HTTP {response.status_code}"
                    )
            except Exception as e:
                self.record_test(
                    f"Icon Fetch URL Mode - {url}",
                    False,
                    f"Error: {str(e)}"
                )
            
            # Test Base64 mode
            try:
                response = await self.client.get(
                    f"{self.base_url}/fetch-icon",
                    params={"url": url, "return_url_only": "false"}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success") and data.get("icon_url"):
                        icon_type = "base64" if data.get("icon_url", "").startswith("data:") else "url"
                        self.record_test(
                            f"Icon Fetch Base64 Mode - {url}",
                            True,
                            f"Successfully fetched icon ({icon_type})",
                            {"type": icon_type, "source": data.get("icon_source_url")}
                        )
                    else:
                        self.record_test(
                            f"Icon Fetch Base64 Mode - {url}",
                            False,
                            f"Invalid response format: {data}"
                        )
                else:
                    self.record_test(
                        f"Icon Fetch Base64 Mode - {url}",
                        False,
                        f"HTTP {response.status_code}"
                    )
            except Exception as e:
                self.record_test(
                    f"Icon Fetch Base64 Mode - {url}",
                    False,
                    f"Error: {str(e)}"
                )
    
    async def test_auth_endpoints(self):
        """Test authentication related endpoints"""
        print_test("Authentication Endpoints Test")
        
        # First test auth detection
        auth_config_test = await self.test_auth_configuration()
        
        # Test protected endpoints without auth
        endpoints = [
            "/user/profile",
            "/subscriptions", 
            "/analytics"
        ]
        
        for endpoint in endpoints:
            try:
                response = await self.client.get(f"{self.base_url}{endpoint}")
                
                if response.status_code in [200, 401, 403]:
                    if response.status_code == 200:
                        # Mock mode success
                        self.record_test(
                            f"Auth Endpoint - {endpoint}",
                            True,
                            "Mock authentication working",
                            {"status_code": response.status_code}
                        )
                    elif response.status_code == 401:
                        # Standard auth required (main.py mode)
                        self.record_test(
                            f"Auth Endpoint - {endpoint}",
                            True,
                            "Authentication required (401 - expected)",
                            {"status_code": response.status_code}
                        )
                    elif response.status_code == 403:
                        # HTTPBearer forced auth (modal_app.py mode)
                        self.record_test(
                            f"Auth Endpoint - {endpoint}",
                            True,
                            "Authentication required (403 - HTTPBearer enforced)",
                            {"status_code": response.status_code}
                        )
                else:
                    self.record_test(
                        f"Auth Endpoint - {endpoint}",
                        False,
                        f"Unexpected status code: {response.status_code}"
                    )
            except Exception as e:
                self.record_test(
                    f"Auth Endpoint - {endpoint}",
                    False,
                    f"Error: {str(e)}"
                )
    
    async def test_auth_configuration(self):
        """Test authentication configuration status"""
        print_test("Authentication Configuration Detection")
        
        try:
            # Try to get user profile, determine auth mode by response code
            response = await self.client.get(f"{self.base_url}/user/profile")
            
            if response.status_code == 200:
                # Mock mode
                data = response.json()
                auth_mode = "Mock Mode"
                self.record_test(
                    "Auth Configuration",
                    True,
                    f"{auth_mode} - Mock user detected",
                    {"mode": "mock", "user": data.get("auth0_user_id", "unknown")}
                )
                return "mock"
            elif response.status_code == 401:
                # Standard Auth0 with auto_error=False
                auth_mode = "Auth0 Mode (Standard)"
                self.record_test(
                    "Auth Configuration",
                    True,
                    f"{auth_mode} - Authentication required",
                    {"mode": "auth0_standard", "status_code": 401}
                )
                return "auth0_standard"
            elif response.status_code == 403:
                # HTTPBearer with auto_error=True (Modal default)
                auth_mode = "Auth0 Mode (Strict)"
                self.record_test(
                    "Auth Configuration",
                    True,
                    f"{auth_mode} - HTTPBearer enforced",
                    {"mode": "auth0_strict", "status_code": 403}
                )
                return "auth0_strict"
            else:
                self.record_test(
                    "Auth Configuration",
                    False,
                    f"Unknown auth mode: HTTP {response.status_code}"
                )
                return "unknown"
                
        except Exception as e:
            self.record_test(
                "Auth Configuration",
                False,
                f"Auth detection failed: {str(e)}"
            )
            return "error"
    
    async def test_nlp_endpoint(self):
        """Test NLP endpoints"""
        print_test("NLP Endpoints Test")
        
        # Test NLP text parsing
        test_data = {
            "text": "I subscribed to Netflix for $15.99 per month, my email is test@example.com"
        }
        
        try:
            response = await self.client.post(
                f"{self.base_url}/subscriptions/nlp",
                json=test_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code in [200, 401, 403]:
                if response.status_code == 200:
                    data = response.json()
                    if "success" in data and "message" in data:
                        self.record_test(
                            "NLP Text Parsing",
                            True,
                            f"NLP endpoint responsive: {data.get('message', '')}",
                            {"success": data.get("success"), "has_parsed_data": "parsed_data" in data}
                        )
                    else:
                        self.record_test(
                            "NLP Text Parsing",
                            False,
                            f"Invalid response format: {data}"
                        )
                elif response.status_code == 401:
                    self.record_test(
                        "NLP Text Parsing",
                        True,
                        "Authentication required (401 - expected for NLP)",
                        {"status_code": response.status_code}
                    )
                elif response.status_code == 403:
                    self.record_test(
                        "NLP Text Parsing",
                        True,
                        "Authentication required (403 - HTTPBearer enforced)",
                        {"status_code": response.status_code}
                    )
            else:
                self.record_test(
                    "NLP Text Parsing",
                    False,
                    f"Unexpected status code: {response.status_code}"
                )
        except Exception as e:
            self.record_test(
                "NLP Text Parsing",
                False,
                f"Error: {str(e)}"
            )
    
    async def run_all_tests(self):
        """Run all tests"""
        print_header("Modal Deployment Comprehensive Test Suite")
        print_info(f"Testing deployment at: {self.base_url}")
        print_info(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Basic connectivity test
        print_header("1. Basic Connectivity")
        connectivity_ok = await self.test_basic_connectivity()
        
        if not connectivity_ok:
            print_error("Basic connectivity failed. Stopping tests.")
            return False
        
        # API Schema test
        print_header("2. API Schema Validation")
        await self.test_api_schema()
        
        # Icon fetch functionality test
        print_header("3. Icon Fetch Functionality")
        await self.test_icon_fetch_functionality()
        
        # Auth configuration and endpoint test
        print_header("4. Authentication Configuration & Endpoints")
        await self.test_auth_endpoints()
        
        # NLP functionality test
        print_header("5. NLP Functionality")
        await self.test_nlp_endpoint()
        
        # Test results summary
        await self.print_test_summary()
        
        return True
    
    async def print_test_summary(self):
        """Print test results summary"""
        print_header("Test Results Summary")
        
        total_tests = len(self.test_results)
        successful_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - successful_tests
        
        print_info(f"Total Tests: {total_tests}")
        print_success(f"Successful: {successful_tests}")
        
        if failed_tests > 0:
            print_error(f"Failed: {failed_tests}")
            print_warning("Failed Tests:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['message']}")
        else:
            print_success("All tests passed!")
        
        success_rate = (successful_tests / total_tests) * 100
        print_info(f"Success Rate: {success_rate:.1f}%")
        
        # Save detailed results to JSON file
        with open("modal_test_results.json", "w", encoding="utf-8") as f:
            json.dump({
                "summary": {
                    "total_tests": total_tests,
                    "successful_tests": successful_tests,
                    "failed_tests": failed_tests,
                    "success_rate": success_rate,
                    "test_time": datetime.now().isoformat()
                },
                "detailed_results": self.test_results
            }, f, indent=2, ensure_ascii=False)
        
        print_info("Detailed results saved to: modal_test_results.json")

async def main():
    """Main function"""
    try:
        async with ModalDeploymentTester(MODAL_URL) as tester:
            success = await tester.run_all_tests()
            
            if success:
                print_success("\n[SUCCESS] Modal deployment test suite completed successfully!")
                sys.exit(0)
            else:
                print_error("\n[FAILED] Modal deployment test suite failed!")
                sys.exit(1)
                
    except KeyboardInterrupt:
        print_warning("\n[INTERRUPTED] Test suite interrupted by user")
        sys.exit(1)
    except Exception as e:
        print_error(f"\n[CRASH] Test suite crashed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())