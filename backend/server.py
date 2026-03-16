from fastapi import FastAPI, APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import jwt
import bcrypt
import calendar
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

JWT_SECRET = os.environ.get('JWT_SECRET', 'postal-rd-agent-secret-2024')
JWT_ALGORITHM = "HS256"

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ==================== MODELS ====================

class UserLogin(BaseModel):
    username: str
    password: str

class CustomerCreate(BaseModel):
    name: str
    age: int
    monthly_amount: float
    tenure: int
    interest_rate: float = 7.6
    start_date: str

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    monthly_amount: Optional[float] = None
    tenure: Optional[int] = None
    interest_rate: Optional[float] = None
    start_date: Optional[str] = None

class PaymentUpdate(BaseModel):
    status: str
    amount_paid: Optional[float] = None
    payment_date: Optional[str] = None

class CalculatorInput(BaseModel):
    monthly_deposit: float
    tenure_years: int
    annual_rate: float = 7.6


# ==================== UTILITIES ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, username: str) -> str:
    payload = {
        "user_id": user_id,
        "username": username,
        "exp": datetime.now(timezone.utc) + timedelta(hours=24)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def add_months(date_str: str, months: int) -> str:
    dt = datetime.fromisoformat(date_str.split('T')[0])
    month = dt.month - 1 + months
    year = dt.year + month // 12
    month = month % 12 + 1
    day = min(dt.day, calendar.monthrange(year, month)[1])
    return datetime(year, month, day).isoformat()

def calculate_rd_maturity(monthly_deposit: float, tenure_years: int, annual_rate: float) -> dict:
    total_months = tenure_years * 12
    quarterly_rate = annual_rate / (4 * 100)
    maturity_amount = 0
    for month in range(1, total_months + 1):
        remaining_months = total_months - month
        remaining_quarters = remaining_months / 3.0
        maturity_amount += monthly_deposit * ((1 + quarterly_rate) ** remaining_quarters)
    total_deposit = monthly_deposit * total_months
    total_interest = maturity_amount - total_deposit
    return {
        "maturity_amount": round(maturity_amount, 2),
        "total_deposit": round(total_deposit, 2),
        "total_interest": round(total_interest, 2),
        "total_months": total_months,
        "monthly_deposit": monthly_deposit,
        "annual_rate": annual_rate,
        "tenure_years": tenure_years
    }


# ==================== AUTH ROUTES ====================

@api_router.post("/auth/login")
async def login(user: UserLogin):
    db_user = await db.users.find_one({"username": user.username}, {"_id": 0})
    if not db_user or not verify_password(user.password, db_user['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(db_user['id'], db_user['username'])
    return {"token": token, "username": db_user['username']}

@api_router.get("/auth/me")
async def get_me(user=Depends(get_current_user)):
    return {"user_id": user['user_id'], "username": user['username']}


# ==================== CUSTOMER ROUTES ====================

@api_router.get("/customers/export/data")
async def export_customers_data(user=Depends(get_current_user)):
    customers = await db.customers.find({}, {"_id": 0}).to_list(1000)
    return customers

@api_router.get("/customers")
async def get_customers(user=Depends(get_current_user)):
    customers = await db.customers.find({}, {"_id": 0}).to_list(1000)
    return customers

@api_router.post("/customers")
async def create_customer(customer: CustomerCreate, user=Depends(get_current_user)):
    if customer.tenure not in [5, 10]:
        raise HTTPException(status_code=400, detail="Tenure must be 5 or 10 years")
    maturity = calculate_rd_maturity(customer.monthly_amount, customer.tenure, customer.interest_rate)
    maturity_date = add_months(customer.start_date, customer.tenure * 12)
    customer_doc = {
        "id": str(uuid.uuid4()),
        "name": customer.name,
        "age": customer.age,
        "monthly_amount": customer.monthly_amount,
        "tenure": customer.tenure,
        "interest_rate": customer.interest_rate,
        "start_date": customer.start_date,
        "maturity_date": maturity_date,
        "maturity_amount": maturity["maturity_amount"],
        "total_deposit": maturity["total_deposit"],
        "total_interest": maturity["total_interest"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": user['user_id']
    }
    await db.customers.insert_one(customer_doc)
    # Generate payment records
    payments = []
    total_months = customer.tenure * 12
    for i in range(total_months):
        due_date_str = add_months(customer.start_date, i)
        due_dt = datetime.fromisoformat(due_date_str)
        payments.append({
            "id": str(uuid.uuid4()),
            "customer_id": customer_doc['id'],
            "customer_name": customer.name,
            "month": due_dt.month,
            "year": due_dt.year,
            "month_label": due_dt.strftime("%B %Y"),
            "amount_due": customer.monthly_amount,
            "amount_paid": 0,
            "payment_date": None,
            "status": "Unpaid",
            "due_date": due_date_str
        })
    if payments:
        await db.payments.insert_many(payments)
    customer_doc.pop('_id', None)
    return customer_doc

@api_router.get("/customers/{customer_id}")
async def get_customer(customer_id: str, user=Depends(get_current_user)):
    customer = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@api_router.put("/customers/{customer_id}")
async def update_customer(customer_id: str, update: CustomerUpdate, user=Depends(get_current_user)):
    customer = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    recalculate = any(k in update_data for k in ['monthly_amount', 'tenure', 'interest_rate', 'start_date'])
    if recalculate:
        merged = {**customer, **update_data}
        if merged['tenure'] not in [5, 10]:
            raise HTTPException(status_code=400, detail="Tenure must be 5 or 10 years")
        maturity = calculate_rd_maturity(merged['monthly_amount'], merged['tenure'], merged['interest_rate'])
        maturity_date = add_months(merged['start_date'], merged['tenure'] * 12)
        update_data.update({
            "maturity_date": maturity_date,
            "maturity_amount": maturity["maturity_amount"],
            "total_deposit": maturity["total_deposit"],
            "total_interest": maturity["total_interest"]
        })
        await db.payments.delete_many({"customer_id": customer_id})
        total_months = merged['tenure'] * 12
        payments = []
        for i in range(total_months):
            due_date_str = add_months(merged['start_date'], i)
            due_dt = datetime.fromisoformat(due_date_str)
            payments.append({
                "id": str(uuid.uuid4()),
                "customer_id": customer_id,
                "customer_name": merged.get('name', customer.get('name')),
                "month": due_dt.month,
                "year": due_dt.year,
                "month_label": due_dt.strftime("%B %Y"),
                "amount_due": merged['monthly_amount'],
                "amount_paid": 0,
                "payment_date": None,
                "status": "Unpaid",
                "due_date": due_date_str
            })
        if payments:
            await db.payments.insert_many(payments)
    if 'name' in update_data:
        await db.payments.update_many(
            {"customer_id": customer_id},
            {"$set": {"customer_name": update_data['name']}}
        )
    await db.customers.update_one({"id": customer_id}, {"$set": update_data})
    updated = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    return updated

@api_router.delete("/customers/{customer_id}")
async def delete_customer(customer_id: str, user=Depends(get_current_user)):
    result = await db.customers.delete_one({"id": customer_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    await db.payments.delete_many({"customer_id": customer_id})
    return {"message": "Customer deleted successfully"}


# ==================== PAYMENT ROUTES ====================

@api_router.get("/customers/{customer_id}/payments")
async def get_customer_payments(customer_id: str, user=Depends(get_current_user)):
    payments = await db.payments.find(
        {"customer_id": customer_id}, {"_id": 0}
    ).sort("due_date", 1).to_list(200)
    return payments

@api_router.put("/payments/{payment_id}")
async def update_payment(payment_id: str, update: PaymentUpdate, user=Depends(get_current_user)):
    payment = await db.payments.find_one({"id": payment_id})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    update_data = {"status": update.status}
    if update.status == "Paid":
        update_data["amount_paid"] = update.amount_paid or payment.get("amount_due", 0)
        update_data["payment_date"] = update.payment_date or datetime.now(timezone.utc).isoformat()
    else:
        update_data["amount_paid"] = 0
        update_data["payment_date"] = None
    await db.payments.update_one({"id": payment_id}, {"$set": update_data})
    updated = await db.payments.find_one({"id": payment_id}, {"_id": 0})
    return updated

@api_router.get("/payments/current-month")
async def get_current_month_payments(user=Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    payments = await db.payments.find(
        {"month": now.month, "year": now.year}, {"_id": 0}
    ).to_list(1000)
    return payments

@api_router.get("/payments/unpaid")
async def get_unpaid_payments(user=Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    payments = await db.payments.find(
        {"status": "Unpaid", "month": now.month, "year": now.year}, {"_id": 0}
    ).to_list(1000)
    return payments

@api_router.get("/payments/overdue")
async def get_overdue_payments(user=Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    payments = await db.payments.find(
        {"status": "Unpaid", "due_date": {"$lt": now}}, {"_id": 0}
    ).to_list(1000)
    return payments


# ==================== DASHBOARD ROUTES ====================

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(user=Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    cm, cy = now.month, now.year
    total_customers = await db.customers.count_documents({})
    agg = await db.customers.aggregate([
        {"$group": {"_id": None, "total": {"$sum": "$monthly_amount"}}}
    ]).to_list(1)
    total_monthly_expected = agg[0]["total"] if agg else 0
    paid_agg = await db.payments.aggregate([
        {"$match": {"month": cm, "year": cy, "status": "Paid"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount_paid"}, "count": {"$sum": 1}}}
    ]).to_list(1)
    total_paid_amount = paid_agg[0]["total"] if paid_agg else 0
    total_paid_count = paid_agg[0]["count"] if paid_agg else 0
    unpaid_count = await db.payments.count_documents({"month": cm, "year": cy, "status": "Unpaid"})
    overdue_count = await db.payments.count_documents({"status": "Unpaid", "due_date": {"$lt": now.isoformat()}})
    monthly_pipeline = [
        {"$match": {"status": "Paid"}},
        {"$group": {
            "_id": {"month": "$month", "year": "$year"},
            "total": {"$sum": "$amount_paid"},
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id.year": 1, "_id.month": 1}}
    ]
    monthly_data = await db.payments.aggregate(monthly_pipeline).to_list(24)
    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    monthly_chart = [
        {"month": f"{month_names[item['_id']['month']-1]} {item['_id']['year']}", "amount": item["total"], "count": item["count"]}
        for item in monthly_data
    ]
    paid_vs_unpaid = [
        {"name": "Paid", "value": total_paid_count},
        {"name": "Unpaid", "value": unpaid_count}
    ]
    six_months_later = add_months(now.isoformat(), 6)
    upcoming_maturity = await db.customers.find(
        {"maturity_date": {"$gte": now.isoformat(), "$lte": six_months_later}},
        {"_id": 0}
    ).to_list(100)
    recent_unpaid = await db.payments.find(
        {"status": "Unpaid", "month": cm, "year": cy}, {"_id": 0}
    ).sort("due_date", 1).to_list(10)
    return {
        "total_customers": total_customers,
        "total_monthly_expected": total_monthly_expected,
        "total_paid_amount": total_paid_amount,
        "total_paid_count": total_paid_count,
        "unpaid_count": unpaid_count,
        "overdue_count": overdue_count,
        "monthly_chart": monthly_chart,
        "paid_vs_unpaid": paid_vs_unpaid,
        "upcoming_maturity": upcoming_maturity,
        "recent_unpaid": recent_unpaid
    }


# ==================== CALCULATOR ROUTE ====================

@api_router.post("/calculator")
async def calculate(calc_input: CalculatorInput):
    if calc_input.tenure_years not in [5, 10]:
        raise HTTPException(status_code=400, detail="Tenure must be 5 or 10 years")
    result = calculate_rd_maturity(calc_input.monthly_deposit, calc_input.tenure_years, calc_input.annual_rate)
    return result


# ==================== STARTUP ====================

@app.on_event("startup")
async def startup():
    await db.customers.create_index("id", unique=True)
    await db.payments.create_index("id", unique=True)
    await db.payments.create_index("customer_id")
    await db.payments.create_index([("month", 1), ("year", 1)])
    await db.payments.create_index("status")
    await db.payments.create_index("due_date")
    await db.users.create_index("username", unique=True)
    admin = await db.users.find_one({"username": "admin"})
    if not admin:
        admin_doc = {
            "id": str(uuid.uuid4()),
            "username": "admin",
            "password": hash_password("admin123"),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_doc)
        logger.info("Default admin user created (admin/admin123)")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
