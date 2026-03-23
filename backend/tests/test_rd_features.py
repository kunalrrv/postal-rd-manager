"""
Backend API Tests for RD Management System
Tests: Auth, Role-based access, Customer accounts, Calculator, CRUD operations
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAuthAndRoles:
    """Authentication and role-based access tests"""
    
    def test_admin_login_returns_role_admin(self):
        """Admin login should return role=admin"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["role"] == "admin"
        assert data["username"] == "admin"
    
    def test_customer_login_returns_role_customer(self):
        """Customer login should return role=customer and customer_id"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "testcustomer",
            "password": "test123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["role"] == "customer"
        assert "customer_id" in data
        assert len(data["customer_id"]) > 0
    
    def test_invalid_login_returns_401(self):
        """Invalid credentials should return 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "wronguser",
            "password": "wrongpass"
        })
        assert response.status_code == 401


class TestAdminEndpoints:
    """Admin-only endpoint tests"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        return response.json()["token"]
    
    @pytest.fixture
    def customer_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "testcustomer",
            "password": "test123"
        })
        return response.json()["token"]
    
    def test_admin_can_access_customer_accounts(self, admin_token):
        """Admin should be able to access /api/admin/customer-accounts"""
        response = requests.get(
            f"{BASE_URL}/api/admin/customer-accounts",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_customer_cannot_access_admin_endpoints(self, customer_token):
        """Customer should get 403 when accessing admin endpoints"""
        response = requests.get(
            f"{BASE_URL}/api/admin/customer-accounts",
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        assert response.status_code == 403
        assert "Admin access required" in response.json().get("detail", "")


class TestCustomerDashboard:
    """Customer dashboard endpoint tests"""
    
    @pytest.fixture
    def customer_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "testcustomer",
            "password": "test123"
        })
        return response.json()["token"]
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        return response.json()["token"]
    
    def test_customer_can_access_dashboard(self, customer_token):
        """Customer should be able to access their dashboard"""
        response = requests.get(
            f"{BASE_URL}/api/customer/dashboard",
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "customer" in data
        assert "payments" in data
        assert "summary" in data
        # Verify summary fields
        summary = data["summary"]
        assert "total_payments" in summary
        assert "paid_count" in summary
        assert "unpaid_count" in summary
        assert "maturity_amount" in summary
        assert "next_payment" in summary
    
    def test_admin_cannot_access_customer_dashboard(self, admin_token):
        """Admin should get 403 when accessing customer dashboard"""
        response = requests.get(
            f"{BASE_URL}/api/customer/dashboard",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 403


class TestCalculator:
    """Calculator endpoint tests - interest rate should default to 6.7"""
    
    def test_calculator_default_rate_is_6_7(self):
        """Calculator should use 6.7% as default rate"""
        response = requests.post(f"{BASE_URL}/api/calculator", json={
            "monthly_deposit": 1000,
            "tenure_years": 5
        })
        assert response.status_code == 200
        data = response.json()
        assert data["annual_rate"] == 6.7
        assert data["monthly_deposit"] == 1000
        assert data["tenure_years"] == 5
        assert data["total_months"] == 60
        assert data["maturity_amount"] > 0
    
    def test_calculator_with_custom_rate(self):
        """Calculator should accept custom rate"""
        response = requests.post(f"{BASE_URL}/api/calculator", json={
            "monthly_deposit": 1000,
            "tenure_years": 5,
            "annual_rate": 7.6
        })
        assert response.status_code == 200
        data = response.json()
        assert data["annual_rate"] == 7.6


class TestCustomerCRUD:
    """Customer CRUD operations - interest rate default should be 6.7"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        return response.json()["token"]
    
    def test_create_customer_default_rate_6_7(self, admin_token):
        """Creating customer without rate should default to 6.7"""
        response = requests.post(
            f"{BASE_URL}/api/customers",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "name": "TEST_DefaultRate",
                "age": 30,
                "monthly_amount": 500,
                "tenure": 5,
                "start_date": "2026-01-01"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["interest_rate"] == 6.7
        assert data["name"] == "TEST_DefaultRate"
        
        # Cleanup
        customer_id = data["id"]
        requests.delete(
            f"{BASE_URL}/api/customers/{customer_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
    
    def test_get_customers_list(self, admin_token):
        """Should return list of customers"""
        response = requests.get(
            f"{BASE_URL}/api/customers",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestCustomerAccountCreation:
    """Admin creating customer login accounts"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        return response.json()["token"]
    
    def test_create_customer_account_validation(self, admin_token):
        """Should validate customer account creation fields"""
        # Test with non-existent customer
        response = requests.post(
            f"{BASE_URL}/api/admin/customer-accounts",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "customer_id": "non-existent-id",
                "username": "testuser",
                "password": "testpass123"
            }
        )
        assert response.status_code == 404
        
        # Test with short username
        response = requests.post(
            f"{BASE_URL}/api/admin/customer-accounts",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "customer_id": "some-id",
                "username": "ab",
                "password": "testpass123"
            }
        )
        assert response.status_code in [400, 404]


class TestDashboardStats:
    """Dashboard statistics endpoint"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        return response.json()["token"]
    
    def test_dashboard_stats(self, admin_token):
        """Dashboard stats should return expected fields"""
        response = requests.get(
            f"{BASE_URL}/api/dashboard/stats",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_customers" in data
        assert "total_monthly_expected" in data
        assert "total_paid_amount" in data
        assert "unpaid_count" in data
        assert "monthly_chart" in data
        assert "paid_vs_unpaid" in data


class TestPaymentEndpoints:
    """Payment management endpoints"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        return response.json()["token"]
    
    def test_get_current_month_payments(self, admin_token):
        """Should return current month payments"""
        response = requests.get(
            f"{BASE_URL}/api/payments/current-month",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_get_unpaid_payments(self, admin_token):
        """Should return unpaid payments"""
        response = requests.get(
            f"{BASE_URL}/api/payments/unpaid",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_get_overdue_payments(self, admin_token):
        """Should return overdue payments"""
        response = requests.get(
            f"{BASE_URL}/api/payments/overdue",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)


class TestExportEndpoints:
    """Export data endpoints"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        return response.json()["token"]
    
    def test_export_customers_data(self, admin_token):
        """Should return customer data for export"""
        response = requests.get(
            f"{BASE_URL}/api/customers/export/data",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
