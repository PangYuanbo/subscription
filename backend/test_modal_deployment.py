#!/usr/bin/env python3
"""
Modal Deployment Test Suite
自动化测试Modal部署的所有端点和功能
"""

import asyncio
import json
import sys
from datetime import datetime
from typing import Dict, Any, List
import httpx

# 配置
MODAL_URL = "https://yuanbopang--subscription-manager-fastapi-app.modal.run"
TIMEOUT = 30.0

# 测试颜色输出
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'

def print_header(text: str):
    """打印测试部分标题"""
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}")
    print(f"{text}")
    print(f"{'='*60}{Colors.END}")

def print_test(test_name: str):
    """打印测试名称"""
    print(f"\n{Colors.BOLD}[TEST] {test_name}{Colors.END}")

def print_success(message: str):
    """打印成功信息"""
    print(f"{Colors.GREEN}[OK] {message}{Colors.END}")

def print_error(message: str):
    """打印错误信息"""
    print(f"{Colors.RED}[ERROR] {message}{Colors.END}")

def print_warning(message: str):
    """打印警告信息"""
    print(f"{Colors.YELLOW}[WARNING] {message}{Colors.END}")

def print_info(message: str):
    """打印信息"""
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
        """记录测试结果"""
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
        """测试基础连接"""
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
        """测试API Schema"""
        print_test("API Schema Test")
        
        try:
            response = await self.client.get(f"{self.base_url}/openapi.json")
            if response.status_code == 200:
                schema = response.json()
                
                # 检查关键schema
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
                
                # 检查ServiceResponse是否包含icon_source_url
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
        """测试图标获取功能"""
        print_test("Icon Fetch Functionality Test")
        
        test_urls = ["netflix.com", "spotify.com", "github.com"]
        
        for url in test_urls:
            # 测试URL模式
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
            
            # 测试Base64模式
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
        """测试认证相关端点"""
        print_test("Authentication Endpoints Test")
        
        # 首先测试认证检测
        auth_config_test = await self.test_auth_configuration()
        
        # 测试无认证访问受保护端点
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
                        # Mock模式成功
                        self.record_test(
                            f"Auth Endpoint - {endpoint}",
                            True,
                            "Mock authentication working",
                            {"status_code": response.status_code}
                        )
                    elif response.status_code == 401:
                        # 标准认证要求 (main.py模式)
                        self.record_test(
                            f"Auth Endpoint - {endpoint}",
                            True,
                            "Authentication required (401 - expected)",
                            {"status_code": response.status_code}
                        )
                    elif response.status_code == 403:
                        # HTTPBearer强制认证 (modal_app.py模式)
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
        """测试认证配置状态"""
        print_test("Authentication Configuration Detection")
        
        try:
            # 尝试获取用户资料，看响应码来判断认证模式
            response = await self.client.get(f"{self.base_url}/user/profile")
            
            if response.status_code == 200:
                # Mock模式
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
        """测试NLP端点"""
        print_test("NLP Endpoints Test")
        
        # 测试NLP文本解析
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
        """运行所有测试"""
        print_header("Modal Deployment Comprehensive Test Suite")
        print_info(f"Testing deployment at: {self.base_url}")
        print_info(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # 基础连接测试
        print_header("1. Basic Connectivity")
        connectivity_ok = await self.test_basic_connectivity()
        
        if not connectivity_ok:
            print_error("Basic connectivity failed. Stopping tests.")
            return False
        
        # API Schema测试
        print_header("2. API Schema Validation")
        await self.test_api_schema()
        
        # 图标获取功能测试
        print_header("3. Icon Fetch Functionality")
        await self.test_icon_fetch_functionality()
        
        # 认证配置和端点测试
        print_header("4. Authentication Configuration & Endpoints")
        await self.test_auth_endpoints()
        
        # NLP功能测试
        print_header("5. NLP Functionality")
        await self.test_nlp_endpoint()
        
        # 测试结果汇总
        await self.print_test_summary()
        
        return True
    
    async def print_test_summary(self):
        """打印测试结果汇总"""
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
        
        # 保存详细结果到JSON文件
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
    """主函数"""
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