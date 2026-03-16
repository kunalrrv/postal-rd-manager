#!/usr/bin/env python3
"""
Comprehensive API Testing for RD Management System
Tests all backend endpoints and functionality
"""

import requests
import sys
import json
from datetime import datetime, timedelta
from typing import Dict, Any, List

class RDAPITester:
    def __init__(self, base_url: str = "https://postal-rd-manager.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_base = f"{base_url}/api"
        self.token = None
        self.test_customer_id = None
        self.test_payment_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_result(self, test_name: str, success: bool, details: str = ""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name}: PASSED {details}")
        else:
            self.failed_tests.append(f"{test_name}: {details}")
            print(f"❌ {test_name}: FAILED {details}")

    def make_request(self, method: str, endpoint: str, data: Dict = None, expected_status: int = 200) -> tuple:
        """Make API request with proper headers"""
        url = f"{self.api_base}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            else:
                return False, {}, f"Unsupported method: {method}"

            success = response.status_code == expected_status
            try:
                response_data = response.json()
            except:
                response_data = {}

            details = f"Status: {response.status_code}"
            if not success:
                details += f", Expected: {expected_status}, Response: {response.text[:200]}"

            return success, response_data, details

        except requests.exceptions.RequestException as e:
            return False, {}, f"Request failed: {str(e)}"
        except Exception as e:
            return False, {}, f"Error: {str(e)}"

    def test_auth_login(self):
        """Test login functionality"""
        print("\n🔐 Testing Authentication...")
        
        # Test valid login
        success, response, details = self.make_request(
            'POST', 
            'auth/login', 
            {'username': 'admin', 'password': 'admin123'}
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.log_result("Auth - Valid Login", True, f"Token received {details}")
        else:
            self.log_result("Auth - Valid Login", False, details)

        # Test invalid login
        success, _, details = self.make_request(
            'POST', 
            'auth/login', 
            {'username': 'invalid', 'password': 'wrong'},
            expected_status=401
        )
        self.log_result("Auth - Invalid Login", success, details)

        # Test /auth/me endpoint
        if self.token:
            success, response, details = self.make_request('GET', 'auth/me')
            if success and 'username' in response:
                self.log_result("Auth - Get User Info", True, f"User: {response.get('username')} {details}")
            else:
                self.log_result("Auth - Get User Info", False, details)
        
    def test_customers_crud(self):
        """Test customer CRUD operations"""
        print("\n👥 Testing Customer Management...")
        
        # Test get customers (initially empty)
        success, customers, details = self.make_request('GET', 'customers')
        self.log_result("Customers - Get All", success, f"Count: {len(customers) if isinstance(customers, list) else 0} {details}")

        # Test create customer
        customer_data = {
            "name": "Rajesh Kumar",
            "age": 45,
            "monthly_amount": 1000,
            "tenure": 5,
            "interest_rate": 7.6,
            "start_date": "2024-01-01"
        }
        
        success, customer, details = self.make_request(
            'POST', 
            'customers', 
            customer_data,
            expected_status=200
        )
        
        if success and 'id' in customer:
            self.test_customer_id = customer['id']
            self.log_result("Customers - Create", True, f"ID: {self.test_customer_id} {details}")
        else:
            self.log_result("Customers - Create", False, details)

        # Test get single customer
        if self.test_customer_id:
            success, customer, details = self.make_request('GET', f'customers/{self.test_customer_id}')
            if success and customer.get('name') == 'Rajesh Kumar':
                self.log_result("Customers - Get Single", True, f"Name: {customer.get('name')} {details}")
            else:
                self.log_result("Customers - Get Single", False, details)

        # Test update customer
        if self.test_customer_id:
            update_data = {"name": "Rajesh Kumar Updated", "age": 46}
            success, updated_customer, details = self.make_request(
                'PUT', 
                f'customers/{self.test_customer_id}', 
                update_data
            )
            if success and updated_customer.get('name') == 'Rajesh Kumar Updated':
                self.log_result("Customers - Update", True, f"Updated name: {updated_customer.get('name')} {details}")
            else:
                self.log_result("Customers - Update", False, details)

        # Test invalid tenure (should fail)
        invalid_customer = customer_data.copy()
        invalid_customer['tenure'] = 7  # Invalid tenure
        success, _, details = self.make_request(
            'POST', 
            'customers', 
            invalid_customer,
            expected_status=400
        )
        self.log_result("Customers - Invalid Tenure", success, details)

    def test_payments(self):
        """Test payment functionality"""
        print("\n💳 Testing Payment Management...")
        
        if not self.test_customer_id:
            print("❌ Skipping payment tests - no test customer available")
            return

        # Test get customer payments
        success, payments, details = self.make_request('GET', f'customers/{self.test_customer_id}/payments')
        if success and isinstance(payments, list):
            self.log_result("Payments - Get Customer Payments", True, f"Count: {len(payments)} {details}")
            if payments:
                self.test_payment_id = payments[0]['id']
        else:
            self.log_result("Payments - Get Customer Payments", False, details)

        # Test mark payment as paid
        if self.test_payment_id:
            payment_data = {
                "status": "Paid",
                "amount_paid": 1000,
                "payment_date": datetime.now().isoformat()
            }
            success, updated_payment, details = self.make_request(
                'PUT', 
                f'payments/{self.test_payment_id}', 
                payment_data
            )
            if success and updated_payment.get('status') == 'Paid':
                self.log_result("Payments - Mark as Paid", True, f"Status: {updated_payment.get('status')} {details}")
            else:
                self.log_result("Payments - Mark as Paid", False, details)

        # Test get current month payments
        success, current_payments, details = self.make_request('GET', 'payments/current-month')
        self.log_result("Payments - Current Month", success, f"Count: {len(current_payments) if isinstance(current_payments, list) else 0} {details}")

        # Test get unpaid payments
        success, unpaid_payments, details = self.make_request('GET', 'payments/unpaid')
        self.log_result("Payments - Unpaid", success, f"Count: {len(unpaid_payments) if isinstance(unpaid_payments, list) else 0} {details}")

        # Test get overdue payments
        success, overdue_payments, details = self.make_request('GET', 'payments/overdue')
        self.log_result("Payments - Overdue", success, f"Count: {len(overdue_payments) if isinstance(overdue_payments, list) else 0} {details}")

    def test_dashboard(self):
        """Test dashboard endpoint"""
        print("\n📊 Testing Dashboard...")
        
        success, stats, details = self.make_request('GET', 'dashboard/stats')
        if success and isinstance(stats, dict):
            required_fields = ['total_customers', 'total_monthly_expected', 'monthly_chart', 'paid_vs_unpaid']
            has_all_fields = all(field in stats for field in required_fields)
            
            if has_all_fields:
                self.log_result("Dashboard - Stats", True, f"Fields: {list(stats.keys())[:5]}... {details}")
            else:
                missing = [f for f in required_fields if f not in stats]
                self.log_result("Dashboard - Stats", False, f"Missing fields: {missing} {details}")
        else:
            self.log_result("Dashboard - Stats", False, details)

    def test_calculator(self):
        """Test RD calculator"""
        print("\n🧮 Testing RD Calculator...")
        
        calc_data = {
            "monthly_deposit": 1000,
            "tenure_years": 5,
            "annual_rate": 7.6
        }
        
        success, result, details = self.make_request('POST', 'calculator', calc_data)
        if success and isinstance(result, dict):
            required_fields = ['maturity_amount', 'total_deposit', 'total_interest', 'total_months']
            has_all_fields = all(field in result for field in required_fields)
            
            if has_all_fields and result['total_months'] == 60:
                self.log_result("Calculator - Valid Calculation", True, f"Maturity: {result.get('maturity_amount')} {details}")
            else:
                missing = [f for f in required_fields if f not in result]
                self.log_result("Calculator - Valid Calculation", False, f"Missing fields: {missing} {details}")
        else:
            self.log_result("Calculator - Valid Calculation", False, details)

        # Test invalid tenure
        invalid_calc = calc_data.copy()
        invalid_calc['tenure_years'] = 7  # Invalid tenure
        success, _, details = self.make_request(
            'POST', 
            'calculator', 
            invalid_calc,
            expected_status=400
        )
        self.log_result("Calculator - Invalid Tenure", success, details)

    def test_reports_export(self):
        """Test export functionality"""
        print("\n📄 Testing Reports/Export...")
        
        success, export_data, details = self.make_request('GET', 'customers/export/data')
        if success and isinstance(export_data, list):
            self.log_result("Reports - Export Data", True, f"Customers: {len(export_data)} {details}")
        else:
            self.log_result("Reports - Export Data", False, details)

    def cleanup(self):
        """Clean up test data"""
        print("\n🧹 Cleaning up test data...")
        
        if self.test_customer_id:
            success, _, details = self.make_request(
                'DELETE', 
                f'customers/{self.test_customer_id}',
                expected_status=200
            )
            self.log_result("Cleanup - Delete Customer", success, details)

    def run_all_tests(self):
        """Run complete test suite"""
        print("🚀 Starting RD Management System API Tests")
        print(f"📍 Testing endpoint: {self.base_url}")
        print("=" * 60)
        
        # Run authentication first - required for other tests
        self.test_auth_login()
        
        if not self.token:
            print("❌ Cannot continue - authentication failed")
            return self.generate_summary()
        
        # Run all other tests
        self.test_customers_crud()
        self.test_payments()
        self.test_dashboard()
        self.test_calculator()
        self.test_reports_export()
        
        # Cleanup
        self.cleanup()
        
        return self.generate_summary()

    def generate_summary(self):
        """Generate test summary"""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {len(self.failed_tests)}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100 if self.tests_run > 0 else 0:.1f}%")
        
        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in self.failed_tests:
                print(f"  - {test}")
        
        print("\n" + "=" * 60)
        
        return {
            "total_tests": self.tests_run,
            "passed": self.tests_passed,
            "failed": len(self.failed_tests),
            "success_rate": (self.tests_passed/self.tests_run)*100 if self.tests_run > 0 else 0,
            "failed_tests": self.failed_tests
        }

def main():
    """Main test execution"""
    tester = RDAPITester()
    summary = tester.run_all_tests()
    
    # Exit with appropriate code
    exit_code = 0 if summary["success_rate"] >= 90 else 1
    sys.exit(exit_code)

if __name__ == "__main__":
    main()