from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Cookie
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict
import uuid
import hashlib
import secrets
from datetime import datetime, timezone, timedelta
import httpx
import resend
import shippo

# Stripe imports
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout, 
    CheckoutSessionResponse, 
    CheckoutStatusResponse, 
    CheckoutSessionRequest
)


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Resend configuration
resend.api_key = os.environ.get('RESEND_API_KEY')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')

# Admin configuration
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'RazeAdmin2024!')

# Shippo configuration
SHIPPO_API_KEY = os.environ.get('SHIPPO_API_KEY')
shippo_client = None
if SHIPPO_API_KEY:
    shippo_client = shippo.Shippo(api_key_header=SHIPPO_API_KEY)

# n8n Webhook configuration
N8N_WEBHOOK_URL = os.environ.get('N8N_WEBHOOK_URL', 'https://raze11.app.n8n.cloud/webhook/raze-account-signup')

# Default sender address for RAZE (US address for Shippo test mode)
# Update this to your actual warehouse address in production
RAZE_ADDRESS = {
    "name": "RAZE Training",
    "street1": "965 Mission St",
    "city": "San Francisco",
    "state": "CA",
    "zip": "94103",
    "country": "US",
    "phone": "+14155551234",
    "email": "orders@razetraining.com"
}

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ============================================
# MODELS
# ============================================

class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Email Subscription Models
class EmailSubscription(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    source: str  # "giveaway_popup", "early_access", "notify_me"
    product_id: Optional[str] = None
    product_name: Optional[str] = None
    drop: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EmailSubscriptionCreate(BaseModel):
    email: EmailStr
    source: str
    product_id: Optional[str] = None
    product_name: Optional[str] = None
    drop: Optional[str] = None

class EmailResponse(BaseModel):
    success: bool
    message: str
    email: Optional[str] = None


# Order Models
class OrderItem(BaseModel):
    product_id: int
    product_name: str
    color: str
    size: str
    quantity: int
    price: float
    image: Optional[str] = None

class ShippingAddress(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    state: str
    postal_code: str
    country: str = "US"

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_number: str = Field(default_factory=lambda: f"RAZE-{str(uuid.uuid4())[:8].upper()}")
    items: List[OrderItem]
    shipping: ShippingAddress
    subtotal: float
    discount: float = 0
    discount_description: Optional[str] = None
    shipping_cost: float = 0
    total: float
    status: str = "pending"  # pending, confirmed, processing, shipped, delivered, cancelled
    tracking_number: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrderCreate(BaseModel):
    items: List[OrderItem]
    shipping: ShippingAddress
    subtotal: float
    discount: float = 0
    discount_description: Optional[str] = None
    shipping_cost: float = 0
    total: float

class OrderUpdate(BaseModel):
    status: Optional[str] = None
    tracking_number: Optional[str] = None
    carrier: Optional[str] = None  # UPS, FedEx, USPS, etc.
    estimated_delivery: Optional[str] = None  # Estimated delivery date
    notes: Optional[str] = None

# Shipping Models (Shippo)
class ShippingRateRequest(BaseModel):
    address_to: ShippingAddress
    weight: float = 0.5  # Default weight in lbs
    length: float = 10   # inches
    width: float = 8     # inches  
    height: float = 2    # inches

class ShippingRate(BaseModel):
    object_id: str
    provider: str
    service_level: str
    amount: float
    currency: str
    estimated_days: Optional[int] = None
    duration_terms: Optional[str] = None

class ShippingRatesResponse(BaseModel):
    success: bool
    rates: List[ShippingRate]
    message: Optional[str] = None

class CreateLabelRequest(BaseModel):
    rate_id: str
    order_id: str

class ShippingLabelResponse(BaseModel):
    success: bool
    tracking_number: Optional[str] = None
    label_url: Optional[str] = None
    carrier: Optional[str] = None
    message: Optional[str] = None

# Admin Models
class AdminLogin(BaseModel):
    password: str

class BulkEmailRequest(BaseModel):
    subject: str
    html_content: str
    target: str = "all"  # "all", "waitlist", "users", "early_access"

class AdminStatsResponse(BaseModel):
    total_users: int
    total_subscribers: int
    total_orders: int
    total_waitlist: int

# Waitlist Models
class WaitlistEntry(BaseModel):
    email: EmailStr
    product_id: int
    product_name: str
    variant: str
    size: str

class WaitlistResponse(BaseModel):
    success: bool
    message: str
    position: Optional[int] = None
    access_code: Optional[str] = None

class OrderResponse(BaseModel):
    success: bool
    message: str
    order: Optional[Order] = None
    order_number: Optional[str] = None


# Stripe Checkout Models
class CheckoutRequest(BaseModel):
    items: List[OrderItem]
    shipping: ShippingAddress
    subtotal: float
    discount: float = 0
    discount_description: Optional[str] = None
    shipping_cost: float = 0
    total: float
    origin_url: str  # Frontend URL for redirects

class PaymentTransaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    order_id: Optional[str] = None
    amount: float
    currency: str = "usd"
    status: str = "pending"  # pending, paid, failed, expired
    payment_status: str = "initiated"
    metadata: Dict[str, str] = {}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# User & Auth Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str = Field(default_factory=lambda: f"user_{uuid.uuid4().hex[:12]}")
    email: str
    name: str
    picture: Optional[str] = None
    password_hash: Optional[str] = None  # For email/password auth
    auth_provider: str = "email"  # "email" or "google"
    first_order_discount_code: Optional[str] = None  # Unique 10% off code for first order
    has_used_first_order_discount: bool = False  # Track if discount was used
    order_count: int = 0  # Number of orders placed
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSession(BaseModel):
    user_id: str
    session_token: str = Field(default_factory=lambda: secrets.token_urlsafe(32))
    expires_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc) + timedelta(days=7))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    auth_provider: str
    first_order_discount_code: Optional[str] = None
    has_used_first_order_discount: bool = False
    order_count: int = 0


# Inventory Models
class InventoryItem(BaseModel):
    product_id: int
    product_name: str
    color: str
    size: str
    quantity: int = 0
    reserved: int = 0  # Reserved during checkout
    low_stock_threshold: int = 5
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class InventoryUpdate(BaseModel):
    product_id: int
    color: str
    size: str
    quantity: int

class InventoryBulkUpdate(BaseModel):
    items: List[InventoryUpdate]


# Promo Code Models
class PromoCode(BaseModel):
    code: str
    discount_type: str = "percentage"  # "percentage" or "fixed"
    discount_value: float  # 10 = 10% or $10
    min_order: float = 0  # Minimum order amount
    max_uses: Optional[int] = None  # None = unlimited
    uses: int = 0
    active: bool = True
    expires_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PromoCodeValidate(BaseModel):
    code: str
    subtotal: float

class PromoCodeCreate(BaseModel):
    code: str
    discount_type: str = "percentage"
    discount_value: float
    min_order: float = 0
    max_uses: Optional[int] = None
    expires_at: Optional[str] = None


# Default promo codes
DEFAULT_PROMO_CODES = [
    {"code": "WELCOME10", "discount_type": "percentage", "discount_value": 10, "min_order": 0, "max_uses": None},
    {"code": "LAUNCH15", "discount_type": "percentage", "discount_value": 15, "min_order": 50, "max_uses": 100},
    {"code": "RAZE20", "discount_type": "percentage", "discount_value": 20, "min_order": 75, "max_uses": 50},
]


# ============================================
# HELPER FUNCTIONS
# ============================================

def hash_password(password: str) -> str:
    """Hash password with salt"""
    salt = secrets.token_hex(16)
    hash_obj = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
    return f"{salt}:{hash_obj.hex()}"

def verify_password(password: str, password_hash: str) -> bool:
    """Verify password against hash"""
    try:
        salt, hash_value = password_hash.split(':')
        hash_obj = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
        return hash_obj.hex() == hash_value
    except:
        return False

async def send_n8n_signup_webhook(email: str, name: str, discount_code: str, signup_method: str):
    """Send webhook to n8n when a user signs up"""
    try:
        payload = {
            "email": email,
            "name": name,
            "discount_code": discount_code,
            "signup_method": signup_method,
            "event_type": "account_signup",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                N8N_WEBHOOK_URL,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=10.0
            )
            
            if response.status_code == 200:
                logging.info(f"n8n webhook sent successfully for {email}")
            else:
                logging.warning(f"n8n webhook returned status {response.status_code} for {email}")
                
    except Exception as e:
        # Don't fail the registration if webhook fails
        logging.error(f"Failed to send n8n webhook for {email}: {str(e)}")

async def send_n8n_giveaway_webhook(email: str):
    """Send webhook to n8n when someone enters the giveaway"""
    try:
        # Use a different webhook URL for giveaway entries
        giveaway_webhook_url = os.environ.get('N8N_GIVEAWAY_WEBHOOK_URL', 'https://raze11.app.n8n.cloud/webhook/raze-giveaway-entry')
        
        payload = {
            "email": email,
            "event_type": "giveaway_entry",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                giveaway_webhook_url,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=10.0
            )
            
            if response.status_code == 200:
                logging.info(f"n8n giveaway webhook sent successfully for {email}")
            else:
                logging.warning(f"n8n giveaway webhook returned status {response.status_code} for {email}")
                
    except Exception as e:
        logging.error(f"Failed to send n8n giveaway webhook for {email}: {str(e)}")

async def get_current_user(request: Request) -> Optional[dict]:
    """Get current user from session token (cookie or header)"""
    # Try cookie first
    session_token = request.cookies.get("session_token")
    
    # Fallback to Authorization header
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header[7:]
    
    if not session_token:
        return None
    
    # Find session
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        return None
    
    # Check expiry
    expires_at = session.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        return None
    
    # Get user
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    return user

async def send_order_confirmation_email(order: dict):
    """Send order confirmation email"""
    if not resend.api_key:
        logger.warning("Resend API key not configured, skipping email")
        return
    
    shipping = order.get('shipping', {})
    customer_email = shipping.get('email')
    customer_name = shipping.get('first_name', 'Customer')
    
    if not customer_email:
        logger.warning("No customer email found, skipping email")
        return
    
    # Build items HTML
    items_html = ""
    for item in order.get('items', []):
        items_html += f"""
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #333;">{item.get('product_name', 'Product')}</td>
            <td style="padding: 12px; border-bottom: 1px solid #333;">{item.get('color', '')} / {item.get('size', '')}</td>
            <td style="padding: 12px; border-bottom: 1px solid #333;">{item.get('quantity', 1)}</td>
            <td style="padding: 12px; border-bottom: 1px solid #333;">${item.get('price', 0):.2f}</td>
        </tr>
        """
    
    # Email HTML template
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #fff; padding: 40px 20px; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background: #111; border-radius: 12px; padding: 40px;">
            <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="font-size: 32px; font-weight: 800; letter-spacing: 4px; margin: 0;">RAZE</h1>
                <p style="color: #4A9FF5; font-size: 12px; letter-spacing: 2px; margin-top: 4px;">BUILT BY DISCIPLINE</p>
            </div>
            
            <h2 style="font-size: 24px; margin: 0 0 8px 0;">Order Confirmed ✓</h2>
            <p style="color: #888; margin: 0 0 24px 0;">Thanks for your order, {customer_name}!</p>
            
            <div style="background: #1a1a1a; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px 0; color: #888; font-size: 14px;">Order Number</p>
                <p style="margin: 0; font-size: 18px; font-weight: 600;">{order.get('order_number', 'N/A')}</p>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <thead>
                    <tr style="background: #1a1a1a;">
                        <th style="padding: 12px; text-align: left; font-weight: 600;">Item</th>
                        <th style="padding: 12px; text-align: left; font-weight: 600;">Variant</th>
                        <th style="padding: 12px; text-align: left; font-weight: 600;">Qty</th>
                        <th style="padding: 12px; text-align: left; font-weight: 600;">Price</th>
                    </tr>
                </thead>
                <tbody>
                    {items_html}
                </tbody>
            </table>
            
            <div style="border-top: 1px solid #333; padding-top: 16px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #888;">Subtotal</span>
                    <span>${order.get('subtotal', 0):.2f}</span>
                </div>
                {"<div style='display: flex; justify-content: space-between; margin-bottom: 8px;'><span style='color: #4A9FF5;'>Discount</span><span style='color: #4A9FF5;'>-$" + f"{order.get('discount', 0):.2f}</span></div>" if order.get('discount', 0) > 0 else ""}
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #888;">Shipping</span>
                    <span>${order.get('shipping_cost', 0):.2f}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: 600; margin-top: 12px; padding-top: 12px; border-top: 1px solid #333;">
                    <span>Total</span>
                    <span>${order.get('total', 0):.2f}</span>
                </div>
            </div>
            
            <div style="margin-top: 32px; padding: 20px; background: #1a1a1a; border-radius: 8px;">
                <h3 style="margin: 0 0 12px 0; font-size: 16px;">Shipping Address</h3>
                <p style="margin: 0; color: #888; line-height: 1.6;">
                    {shipping.get('first_name', '')} {shipping.get('last_name', '')}<br>
                    {shipping.get('address_line1', '')}<br>
                    {shipping.get('city', '')}, {shipping.get('state', '')} {shipping.get('postal_code', '')}<br>
                    {shipping.get('country', 'US')}
                </p>
            </div>
            
            <p style="text-align: center; color: #666; font-size: 14px; margin-top: 32px;">
                We'll notify you when your order ships.<br>
                Questions? Reply to this email.
            </p>
        </div>
    </body>
    </html>
    """
    
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [customer_email],
            "subject": f"Order Confirmed - {order.get('order_number', 'RAZE')}",
            "html": html_content
        }
        # Run sync SDK in thread to keep FastAPI non-blocking
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Order confirmation email sent to {customer_email}")
    except Exception as e:
        logger.error(f"Failed to send order confirmation email: {str(e)}")


# ============================================
# STATUS ROUTES
# ============================================

@api_router.get("/")
async def root():
    return {"message": "RAZE API"}


# ============================================
# IMAGE PROXY ROUTE (for CORS bypass in canvas sanitization)
# ============================================

@api_router.get("/proxy-image")
async def proxy_image(url: str):
    """
    Proxy an image URL to bypass CORS restrictions for canvas operations.
    Returns the image with Access-Control-Allow-Origin header.
    """
    # Whitelist allowed domains for security
    allowed_domains = [
        'customer-assets.emergentagent.com',
        'images.unsplash.com',
        'i.imgur.com',
        'cdn.shopify.com',
        'localhost',
        '127.0.0.1'
    ]
    
    # Parse and validate URL
    from urllib.parse import urlparse
    parsed = urlparse(url)
    
    # Check if domain is allowed
    domain = parsed.netloc.lower()
    is_allowed = any(allowed in domain for allowed in allowed_domains)
    
    if not is_allowed:
        raise HTTPException(status_code=403, detail=f"Domain not allowed: {domain}")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url)
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch image")
            
            # Get content type
            content_type = response.headers.get('content-type', 'image/png')
            
            # Return image with CORS headers
            return Response(
                content=response.content,
                media_type=content_type,
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET",
                    "Cache-Control": "public, max-age=86400"
                }
            )
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Error fetching image: {str(e)}")


@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks


# ============================================
# EMAIL SUBSCRIPTION ROUTES
# ============================================

@api_router.post("/emails/subscribe", response_model=EmailResponse)
async def subscribe_email(input: EmailSubscriptionCreate):
    """
    Subscribe an email address.
    Sources: giveaway_popup, early_access, notify_me
    """
    # Check for duplicate email with same source
    existing = await db.email_subscriptions.find_one({
        "email": input.email.lower(),
        "source": input.source
    })
    
    if existing:
        # If notify_me, also check product_id
        if input.source == "notify_me" and existing.get("product_id") == input.product_id:
            return EmailResponse(
                success=False,
                message="This email is already subscribed for this product.",
                email=input.email
            )
        elif input.source != "notify_me":
            return EmailResponse(
                success=False,
                message="This email is already subscribed.",
                email=input.email
            )
    
    # Create subscription
    subscription = EmailSubscription(
        email=input.email.lower(),
        source=input.source,
        product_id=input.product_id,
        product_name=input.product_name,
        drop=input.drop or "Drop 01"
    )
    
    doc = subscription.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    await db.email_subscriptions.insert_one(doc)
    
    # If this is a giveaway entry, send webhook to n8n
    if input.source == "giveaway_popup":
        asyncio.create_task(send_n8n_giveaway_webhook(input.email.lower()))
    
    return EmailResponse(
        success=True,
        message="Successfully subscribed!",
        email=input.email
    )

@api_router.post("/webhook/giveaway-entry")
async def giveaway_entry_webhook(request: Request):
    """Webhook endpoint for giveaway entries - triggers n8n workflow"""
    try:
        body = await request.json()
        email = body.get('email', '')
        
        if email:
            # Send to n8n
            asyncio.create_task(send_n8n_giveaway_webhook(email))
            return {"success": True, "message": "Webhook triggered"}
        
        return {"success": False, "message": "Email required"}
    except Exception as e:
        logging.error(f"Giveaway webhook error: {str(e)}")
        return {"success": False, "message": str(e)}

@api_router.get("/emails/list", response_model=List[EmailSubscription])
async def get_email_subscriptions(source: Optional[str] = None):
    """
    Get all email subscriptions, optionally filtered by source.
    """
    query = {}
    if source:
        query["source"] = source
    
    subscriptions = await db.email_subscriptions.find(query, {"_id": 0}).to_list(10000)
    
    for sub in subscriptions:
        if isinstance(sub.get('timestamp'), str):
            sub['timestamp'] = datetime.fromisoformat(sub['timestamp'])
    
    return subscriptions

@api_router.get("/emails/stats")
async def get_email_stats():
    """
    Get email subscription statistics.
    """
    total = await db.email_subscriptions.count_documents({})
    giveaway = await db.email_subscriptions.count_documents({"source": "giveaway_popup"})
    early_access = await db.email_subscriptions.count_documents({"source": "early_access"})
    notify_me = await db.email_subscriptions.count_documents({"source": "notify_me"})
    
    return {
        "total": total,
        "giveaway_popup": giveaway,
        "early_access": early_access,
        "notify_me": notify_me
    }


# ============================================
# AUTHENTICATION ROUTES
# ============================================

@api_router.post("/auth/register")
async def register(user_data: UserRegister, response: Response):
    """Register a new user with email/password"""
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email.lower()}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Generate unique first order discount code for this user
    unique_code = f"WELCOME{uuid.uuid4().hex[:6].upper()}"
    
    # Create user
    user = User(
        email=user_data.email.lower(),
        name=user_data.name,
        password_hash=hash_password(user_data.password),
        auth_provider="email",
        first_order_discount_code=unique_code,
        has_used_first_order_discount=False,
        order_count=0
    )
    
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.users.insert_one(doc)
    
    # Send webhook to n8n for welcome email
    asyncio.create_task(send_n8n_signup_webhook(
        email=user.email,
        name=user.name,
        discount_code=unique_code,
        signup_method="email"
    ))
    
    # Create session
    session = UserSession(user_id=user.user_id)
    session_doc = session.model_dump()
    session_doc['expires_at'] = session_doc['expires_at'].isoformat()
    session_doc['created_at'] = session_doc['created_at'].isoformat()
    await db.user_sessions.insert_one(session_doc)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session.session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60  # 7 days
    )
    
    return {
        "success": True,
        "user": UserResponse(
            user_id=user.user_id,
            email=user.email,
            name=user.name,
            picture=user.picture,
            auth_provider=user.auth_provider,
            first_order_discount_code=user.first_order_discount_code,
            has_used_first_order_discount=user.has_used_first_order_discount,
            order_count=user.order_count
        )
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin, response: Response):
    """Login with email/password"""
    user = await db.users.find_one({"email": credentials.email.lower()}, {"_id": 0})
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if user.get('auth_provider') == 'google':
        raise HTTPException(status_code=400, detail="This account uses Google login. Please sign in with Google.")
    
    if not user.get('password_hash') or not verify_password(credentials.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create session
    session = UserSession(user_id=user['user_id'])
    session_doc = session.model_dump()
    session_doc['expires_at'] = session_doc['expires_at'].isoformat()
    session_doc['created_at'] = session_doc['created_at'].isoformat()
    await db.user_sessions.insert_one(session_doc)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session.session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    
    return {
        "success": True,
        "user": UserResponse(
            user_id=user['user_id'],
            email=user['email'],
            name=user['name'],
            picture=user.get('picture'),
            auth_provider=user['auth_provider'],
            first_order_discount_code=user.get('first_order_discount_code'),
            has_used_first_order_discount=user.get('has_used_first_order_discount', False),
            order_count=user.get('order_count', 0)
        )
    }

@api_router.post("/auth/session")
async def exchange_session(request: Request, response: Response):
    """Exchange Emergent session_id for user session (Google OAuth callback)"""
    body = await request.json()
    session_id = body.get('session_id')
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Call Emergent auth API to get user data
    try:
        async with httpx.AsyncClient() as client:
            auth_response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id},
                timeout=10.0
            )
            
            if auth_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            
            auth_data = auth_response.json()
    except httpx.RequestError as e:
        logger.error(f"Auth service error: {str(e)}")
        raise HTTPException(status_code=500, detail="Authentication service unavailable")
    
    # Check if user exists
    user = await db.users.find_one({"email": auth_data['email'].lower()}, {"_id": 0})
    
    is_new_user = False
    if user:
        # Update existing user
        await db.users.update_one(
            {"email": auth_data['email'].lower()},
            {"$set": {
                "name": auth_data.get('name', user['name']),
                "picture": auth_data.get('picture'),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        user_id = user['user_id']
    else:
        # Generate unique first order discount code for new user
        unique_code = f"WELCOME{uuid.uuid4().hex[:6].upper()}"
        is_new_user = True
        
        # Create new user
        new_user = User(
            email=auth_data['email'].lower(),
            name=auth_data.get('name', 'User'),
            picture=auth_data.get('picture'),
            auth_provider="google",
            first_order_discount_code=unique_code,
            has_used_first_order_discount=False,
            order_count=0
        )
        doc = new_user.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        doc['updated_at'] = doc['updated_at'].isoformat()
        await db.users.insert_one(doc)
        user_id = new_user.user_id
        user = doc
        
        # Send webhook to n8n for welcome email (only for new users)
        asyncio.create_task(send_n8n_signup_webhook(
            email=new_user.email,
            name=new_user.name,
            discount_code=unique_code,
            signup_method="google"
        ))
    
    # Create session
    session = UserSession(user_id=user_id)
    session_doc = session.model_dump()
    session_doc['expires_at'] = session_doc['expires_at'].isoformat()
    session_doc['created_at'] = session_doc['created_at'].isoformat()
    await db.user_sessions.insert_one(session_doc)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session.session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    
    return {
        "success": True,
        "user": UserResponse(
            user_id=user_id,
            email=auth_data['email'],
            name=auth_data.get('name', 'User'),
            picture=auth_data.get('picture'),
            auth_provider="google",
            first_order_discount_code=user.get('first_order_discount_code'),
            has_used_first_order_discount=user.get('has_used_first_order_discount', False),
            order_count=user.get('order_count', 0)
        )
    }

@api_router.get("/auth/me")
async def get_current_user_info(request: Request):
    """Get current authenticated user"""
    user = await get_current_user(request)
    
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    return UserResponse(
        user_id=user['user_id'],
        email=user['email'],
        name=user['name'],
        picture=user.get('picture'),
        auth_provider=user.get('auth_provider', 'email'),
        first_order_discount_code=user.get('first_order_discount_code'),
        has_used_first_order_discount=user.get('has_used_first_order_discount', False),
        order_count=user.get('order_count', 0)
    )

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout user"""
    session_token = request.cookies.get("session_token")
    
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    
    return {"success": True, "message": "Logged out"}

@api_router.post("/auth/validate-first-order-discount")
async def validate_first_order_discount(request: Request):
    """Validate user's unique first order discount code"""
    user = await get_current_user(request)
    
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    body = await request.json()
    code = body.get('code', '').upper()
    
    # Check if user has already used their first order discount
    if user.get('has_used_first_order_discount', False):
        return {
            "valid": False,
            "message": "You have already used your first order discount"
        }
    
    # Check if the code matches the user's unique code
    user_code = user.get('first_order_discount_code', '').upper()
    if not user_code or code != user_code:
        return {
            "valid": False,
            "message": "Invalid discount code for this account"
        }
    
    return {
        "valid": True,
        "discount_type": "percentage",
        "discount_value": 10,
        "message": "10% first order discount applied!"
    }

@api_router.post("/auth/use-first-order-discount")
async def use_first_order_discount(request: Request):
    """Mark first order discount as used after successful order"""
    user = await get_current_user(request)
    
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Update user to mark discount as used and increment order count
    await db.users.update_one(
        {"user_id": user['user_id']},
        {
            "$set": {
                "has_used_first_order_discount": True,
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            "$inc": {"order_count": 1}
        }
    )
    
    return {"success": True, "message": "First order discount marked as used"}

@api_router.get("/auth/orders")
async def get_user_orders(request: Request):
    """Get orders for current user"""
    user = await get_current_user(request)
    
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Find orders by user email
    orders = await db.orders.find(
        {"shipping.email": user['email']},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    for order in orders:
        if isinstance(order.get('created_at'), str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
        if isinstance(order.get('updated_at'), str):
            order['updated_at'] = datetime.fromisoformat(order['updated_at'])
    
    return orders


# ============================================
# INVENTORY ROUTES
# ============================================

# Default inventory data (seeded on first call)
DEFAULT_INVENTORY = [
    # Performance T-Shirt - Black (Unisex, XS-L)
    {"product_id": 1, "product_name": "Performance T-Shirt", "color": "Black", "size": "XS", "quantity": 15},
    {"product_id": 1, "product_name": "Performance T-Shirt", "color": "Black", "size": "S", "quantity": 20},
    {"product_id": 1, "product_name": "Performance T-Shirt", "color": "Black", "size": "M", "quantity": 25},
    {"product_id": 1, "product_name": "Performance T-Shirt", "color": "Black", "size": "L", "quantity": 20},
    # Performance T-Shirt - White (Unisex, XS-L)
    {"product_id": 1, "product_name": "Performance T-Shirt", "color": "White", "size": "XS", "quantity": 15},
    {"product_id": 1, "product_name": "Performance T-Shirt", "color": "White", "size": "S", "quantity": 20},
    {"product_id": 1, "product_name": "Performance T-Shirt", "color": "White", "size": "M", "quantity": 25},
    {"product_id": 1, "product_name": "Performance T-Shirt", "color": "White", "size": "L", "quantity": 20},
    # Performance Shorts - Placeholder (will update when images arrive)
    # Men's Shorts - Black
    {"product_id": 2, "product_name": "Performance Shorts (Men)", "color": "Black", "size": "XS", "quantity": 0},
    {"product_id": 2, "product_name": "Performance Shorts (Men)", "color": "Black", "size": "S", "quantity": 0},
    {"product_id": 2, "product_name": "Performance Shorts (Men)", "color": "Black", "size": "M", "quantity": 0},
    {"product_id": 2, "product_name": "Performance Shorts (Men)", "color": "Black", "size": "L", "quantity": 0},
    # Women's Shorts - Black (will be product_id 3)
    {"product_id": 3, "product_name": "Performance Shorts (Women)", "color": "Black", "size": "XS", "quantity": 0},
    {"product_id": 3, "product_name": "Performance Shorts (Women)", "color": "Black", "size": "S", "quantity": 0},
    {"product_id": 3, "product_name": "Performance Shorts (Women)", "color": "Black", "size": "M", "quantity": 0},
    {"product_id": 3, "product_name": "Performance Shorts (Women)", "color": "Black", "size": "L", "quantity": 0},
]

async def seed_inventory():
    """Seed inventory if empty"""
    count = await db.inventory.count_documents({})
    if count == 0:
        for item in DEFAULT_INVENTORY:
            item['reserved'] = 0
            item['low_stock_threshold'] = 5
            item['updated_at'] = datetime.now(timezone.utc).isoformat()
            await db.inventory.insert_one(item)
        logger.info(f"Seeded {len(DEFAULT_INVENTORY)} inventory items")

@api_router.get("/inventory")
async def get_inventory():
    """Get all inventory items"""
    await seed_inventory()
    items = await db.inventory.find({}, {"_id": 0}).to_list(1000)
    return items

@api_router.get("/inventory/stats")
async def get_inventory_stats():
    """Get inventory statistics for admin dashboard"""
    await seed_inventory()
    
    items = await db.inventory.find({}, {"_id": 0}).to_list(1000)
    
    total_items = sum(item['quantity'] for item in items)
    total_reserved = sum(item.get('reserved', 0) for item in items)
    low_stock_items = [item for item in items if item['quantity'] - item.get('reserved', 0) <= item.get('low_stock_threshold', 5)]
    out_of_stock = [item for item in items if item['quantity'] - item.get('reserved', 0) <= 0]
    
    return {
        "total_items": total_items,
        "total_reserved": total_reserved,
        "total_available": total_items - total_reserved,
        "low_stock_count": len(low_stock_items),
        "out_of_stock_count": len(out_of_stock),
        "low_stock_items": low_stock_items[:10],  # Top 10 low stock
        "out_of_stock_items": out_of_stock
    }

@api_router.get("/inventory/{product_id}")
async def get_product_inventory(product_id: int):
    """Get inventory for a specific product"""
    await seed_inventory()
    items = await db.inventory.find({"product_id": product_id}, {"_id": 0}).to_list(100)
    
    # Transform to nested format for frontend
    inventory = {}
    for item in items:
        color = item['color']
        size = item['size']
        available = item['quantity'] - item.get('reserved', 0)
        if color not in inventory:
            inventory[color] = {}
        inventory[color][size] = {
            "total": item['quantity'],
            "available": available,
            "low_stock": available <= item.get('low_stock_threshold', 5)
        }
    
    return inventory

@api_router.get("/inventory/check/{product_id}/{color}/{size}")
async def check_stock(product_id: int, color: str, size: str):
    """Check stock for a specific variant"""
    await seed_inventory()
    item = await db.inventory.find_one(
        {"product_id": product_id, "color": color, "size": size},
        {"_id": 0}
    )
    
    if not item:
        return {"in_stock": False, "available": 0, "low_stock": True}
    
    available = item['quantity'] - item.get('reserved', 0)
    return {
        "in_stock": available > 0,
        "available": available,
        "low_stock": available <= item.get('low_stock_threshold', 5)
    }

@api_router.post("/inventory/update")
async def update_inventory(update: InventoryUpdate):
    """Update inventory for a specific variant (admin only)"""
    result = await db.inventory.update_one(
        {"product_id": update.product_id, "color": update.color, "size": update.size},
        {"$set": {"quantity": update.quantity, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    
    return {"success": True, "message": "Inventory updated"}

@api_router.post("/inventory/bulk-update")
async def bulk_update_inventory(updates: InventoryBulkUpdate):
    """Bulk update inventory (admin only)"""
    updated = 0
    for update in updates.items:
        result = await db.inventory.update_one(
            {"product_id": update.product_id, "color": update.color, "size": update.size},
            {"$set": {"quantity": update.quantity, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        if result.matched_count > 0:
            updated += 1
    
    return {"success": True, "updated": updated}

@api_router.post("/inventory/reserve")
async def reserve_inventory(items: List[Dict]):
    """Reserve inventory during checkout"""
    reserved_items = []
    
    for item in items:
        result = await db.inventory.find_one_and_update(
            {
                "product_id": item['product_id'],
                "color": item['color'],
                "size": item['size'],
                "$expr": {"$gte": [{"$subtract": ["$quantity", "$reserved"]}, item['quantity']]}
            },
            {"$inc": {"reserved": item['quantity']}},
            return_document=True
        )
        
        if result:
            reserved_items.append(item)
        else:
            # Rollback previous reservations
            for reserved in reserved_items:
                await db.inventory.update_one(
                    {"product_id": reserved['product_id'], "color": reserved['color'], "size": reserved['size']},
                    {"$inc": {"reserved": -reserved['quantity']}}
                )
            raise HTTPException(
                status_code=400, 
                detail=f"Insufficient stock for {item.get('product_name', 'item')} ({item['color']}, {item['size']})"
            )
    
    return {"success": True, "reserved": len(reserved_items)}

@api_router.post("/inventory/release")
async def release_inventory(items: List[Dict]):
    """Release reserved inventory (e.g., checkout timeout/cancellation)"""
    for item in items:
        await db.inventory.update_one(
            {"product_id": item['product_id'], "color": item['color'], "size": item['size']},
            {"$inc": {"reserved": -item['quantity']}}
        )
    
    return {"success": True}

@api_router.post("/inventory/commit")
async def commit_inventory(items: List[Dict]):
    """Commit reserved inventory after successful payment"""
    for item in items:
        await db.inventory.update_one(
            {"product_id": item['product_id'], "color": item['color'], "size": item['size']},
            {
                "$inc": {"quantity": -item['quantity'], "reserved": -item['quantity']},
                "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
            }
        )
    
    return {"success": True}


# ============================================
# PROMO CODE ROUTES
# ============================================

async def seed_promo_codes():
    """Seed default promo codes if none exist"""
    count = await db.promo_codes.count_documents({})
    if count == 0:
        for code_data in DEFAULT_PROMO_CODES:
            code_data['uses'] = 0
            code_data['active'] = True
            code_data['expires_at'] = None
            code_data['created_at'] = datetime.now(timezone.utc).isoformat()
            await db.promo_codes.insert_one(code_data)
        logger.info(f"Seeded {len(DEFAULT_PROMO_CODES)} promo codes")

@api_router.post("/promo/validate")
async def validate_promo_code(data: PromoCodeValidate):
    """Validate a promo code and return discount info"""
    await seed_promo_codes()
    
    code = data.code.upper().strip()
    
    promo = await db.promo_codes.find_one({"code": code}, {"_id": 0})
    
    if not promo:
        raise HTTPException(status_code=400, detail="Invalid promo code")
    
    if not promo.get('active', True):
        raise HTTPException(status_code=400, detail="This promo code is no longer active")
    
    # Check expiry
    if promo.get('expires_at'):
        expires = promo['expires_at']
        if isinstance(expires, str):
            expires = datetime.fromisoformat(expires)
        if expires < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="This promo code has expired")
    
    # Check max uses
    if promo.get('max_uses') and promo.get('uses', 0) >= promo['max_uses']:
        raise HTTPException(status_code=400, detail="This promo code has reached its usage limit")
    
    # Check minimum order
    if data.subtotal < promo.get('min_order', 0):
        raise HTTPException(
            status_code=400, 
            detail=f"Minimum order of ${promo['min_order']:.2f} required for this code"
        )
    
    # Calculate discount
    if promo['discount_type'] == 'percentage':
        discount_amount = data.subtotal * (promo['discount_value'] / 100)
        discount_display = f"{int(promo['discount_value'])}% off"
    else:
        discount_amount = min(promo['discount_value'], data.subtotal)
        discount_display = f"${promo['discount_value']:.2f} off"
    
    return {
        "valid": True,
        "code": code,
        "discount_type": promo['discount_type'],
        "discount_value": promo['discount_value'],
        "discount_amount": round(discount_amount, 2),
        "discount_display": discount_display,
        "min_order": promo.get('min_order', 0)
    }

@api_router.post("/promo/use")
async def use_promo_code(data: PromoCodeValidate):
    """Mark a promo code as used (increment usage counter)"""
    code = data.code.upper().strip()
    
    result = await db.promo_codes.update_one(
        {"code": code},
        {"$inc": {"uses": 1}}
    )
    
    return {"success": result.modified_count > 0}

@api_router.get("/promo/list")
async def list_promo_codes():
    """List all promo codes (admin)"""
    await seed_promo_codes()
    codes = await db.promo_codes.find({}, {"_id": 0}).to_list(100)
    return codes

@api_router.post("/promo/create")
async def create_promo_code(data: PromoCodeCreate):
    """Create a new promo code (admin)"""
    code = data.code.upper().strip()
    
    # Check if exists
    existing = await db.promo_codes.find_one({"code": code})
    if existing:
        raise HTTPException(status_code=400, detail="Promo code already exists")
    
    promo = {
        "code": code,
        "discount_type": data.discount_type,
        "discount_value": data.discount_value,
        "min_order": data.min_order,
        "max_uses": data.max_uses,
        "uses": 0,
        "active": True,
        "expires_at": data.expires_at,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.promo_codes.insert_one(promo)
    
    return {"success": True, "code": code}

@api_router.patch("/promo/{code}")
async def update_promo_code(code: str, active: Optional[bool] = None):
    """Enable/disable a promo code (admin)"""
    update_data = {}
    if active is not None:
        update_data['active'] = active
    
    if not update_data:
        return {"success": False, "message": "No updates provided"}
    
    result = await db.promo_codes.update_one(
        {"code": code.upper()},
        {"$set": update_data}
    )
    
    return {"success": result.modified_count > 0}

@api_router.delete("/promo/{code}")
async def delete_promo_code(code: str):
    """Delete a promo code (admin)"""
    result = await db.promo_codes.delete_one({"code": code.upper()})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Promo code not found")
    
    return {"success": True, "message": f"Promo code {code.upper()} deleted"}


# ============================================
# ORDER ROUTES
# ============================================

@api_router.get("/orders/track/{order_number}")
async def track_order(order_number: str, email: Optional[str] = None):
    """
    Track an order by order number.
    For guest checkouts, email is required for verification.
    """
    query = {"order_number": order_number.upper()}
    
    order = await db.orders.find_one(query, {"_id": 0})
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # For security, verify email matches if provided
    if email:
        order_email = order.get('shipping', {}).get('email', '').lower()
        if order_email != email.lower():
            raise HTTPException(status_code=404, detail="Order not found")
    
    # Build status timeline
    status_timeline = [
        {"status": "confirmed", "label": "Order Confirmed", "completed": True, "date": order.get('created_at')},
        {"status": "processing", "label": "Processing", "completed": order.get('status') in ['processing', 'shipped', 'delivered']},
        {"status": "shipped", "label": "Shipped", "completed": order.get('status') in ['shipped', 'delivered']},
        {"status": "delivered", "label": "Delivered", "completed": order.get('status') == 'delivered'}
    ]
    
    # Add shipped/delivered dates if available
    if order.get('shipped_at'):
        status_timeline[2]['date'] = order.get('shipped_at')
    if order.get('delivered_at'):
        status_timeline[3]['date'] = order.get('delivered_at')
    
    return {
        "order_number": order.get('order_number'),
        "status": order.get('status'),
        "items": order.get('items', []),
        "subtotal": order.get('subtotal', 0),
        "discount": order.get('discount', 0),
        "shipping_cost": order.get('shipping_cost', 0),
        "total": order.get('total', 0),
        "shipping_address": {
            "name": f"{order.get('shipping', {}).get('first_name', '')} {order.get('shipping', {}).get('last_name', '')}",
            "address": order.get('shipping', {}).get('address_line1', ''),
            "city": order.get('shipping', {}).get('city', ''),
            "state": order.get('shipping', {}).get('state', ''),
            "postal_code": order.get('shipping', {}).get('postal_code', ''),
            "country": order.get('shipping', {}).get('country', 'US')
        },
        "tracking_number": order.get('tracking_number'),
        "carrier": order.get('carrier'),
        "timeline": status_timeline,
        "created_at": order.get('created_at'),
        "updated_at": order.get('updated_at'),
        "estimated_delivery": order.get('estimated_delivery')
    }

@api_router.post("/orders", response_model=OrderResponse)
async def create_order(input: OrderCreate):
    """
    Create a new order.
    """
    order = Order(
        items=input.items,
        shipping=input.shipping,
        subtotal=input.subtotal,
        discount=input.discount,
        discount_description=input.discount_description,
        shipping_cost=input.shipping_cost,
        total=input.total
    )
    
    doc = order.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    # Convert nested models to dicts
    doc['items'] = [item.model_dump() if hasattr(item, 'model_dump') else item for item in doc['items']]
    doc['shipping'] = doc['shipping'].model_dump() if hasattr(doc['shipping'], 'model_dump') else doc['shipping']
    
    await db.orders.insert_one(doc)
    
    return OrderResponse(
        success=True,
        message="Order created successfully!",
        order=order,
        order_number=order.order_number
    )

@api_router.get("/orders", response_model=List[Order])
async def get_orders(
    status: Optional[str] = None,
    email: Optional[str] = None,
    limit: int = 100,
    skip: int = 0
):
    """
    Get all orders with optional filters.
    Admin endpoint.
    """
    query = {}
    if status:
        query["status"] = status
    if email:
        query["shipping.email"] = email.lower()
    
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    for order in orders:
        if isinstance(order.get('created_at'), str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
        if isinstance(order.get('updated_at'), str):
            order['updated_at'] = datetime.fromisoformat(order['updated_at'])
    
    return orders

@api_router.get("/orders/stats")
async def get_order_stats():
    """
    Get order statistics.
    """
    total = await db.orders.count_documents({})
    pending = await db.orders.count_documents({"status": "pending"})
    confirmed = await db.orders.count_documents({"status": "confirmed"})
    processing = await db.orders.count_documents({"status": "processing"})
    shipped = await db.orders.count_documents({"status": "shipped"})
    delivered = await db.orders.count_documents({"status": "delivered"})
    cancelled = await db.orders.count_documents({"status": "cancelled"})
    
    # Calculate revenue
    pipeline = [
        {"$match": {"status": {"$nin": ["cancelled"]}}},
        {"$group": {"_id": None, "total_revenue": {"$sum": "$total"}}}
    ]
    revenue_result = await db.orders.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total_revenue"] if revenue_result else 0
    
    return {
        "total_orders": total,
        "pending": pending,
        "confirmed": confirmed,
        "processing": processing,
        "shipped": shipped,
        "delivered": delivered,
        "cancelled": cancelled,
        "total_revenue": round(total_revenue, 2)
    }

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str):
    """
    Get a specific order by ID or order number.
    """
    # Try by ID first
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    
    # If not found, try by order_number
    if not order:
        order = await db.orders.find_one({"order_number": order_id}, {"_id": 0})
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if isinstance(order.get('created_at'), str):
        order['created_at'] = datetime.fromisoformat(order['created_at'])
    if isinstance(order.get('updated_at'), str):
        order['updated_at'] = datetime.fromisoformat(order['updated_at'])
    
    return order

@api_router.patch("/orders/{order_id}", response_model=OrderResponse)
async def update_order(order_id: str, update: OrderUpdate):
    """
    Update an order (status, tracking, notes).
    Admin endpoint.
    """
    # Find order
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        order = await db.orders.find_one({"order_number": order_id}, {"_id": 0})
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Build update
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    
    if update.status:
        valid_statuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]
        if update.status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
        update_data["status"] = update.status
        
        # Add timestamp for status changes
        if update.status == "shipped" and not order.get("shipped_at"):
            update_data["shipped_at"] = datetime.now(timezone.utc).isoformat()
        elif update.status == "delivered" and not order.get("delivered_at"):
            update_data["delivered_at"] = datetime.now(timezone.utc).isoformat()
    
    if update.tracking_number is not None:
        update_data["tracking_number"] = update.tracking_number
    
    if update.notes is not None:
        update_data["notes"] = update.notes
    
    # Handle carrier if provided in the request body
    body = update.model_dump(exclude_unset=True)
    if "carrier" in body:
        update_data["carrier"] = body["carrier"]
    if "estimated_delivery" in body:
        update_data["estimated_delivery"] = body["estimated_delivery"]
    
    # Update in database
    await db.orders.update_one(
        {"id": order["id"]},
        {"$set": update_data}
    )
    
    # Get updated order
    updated_order = await db.orders.find_one({"id": order["id"]}, {"_id": 0})
    if isinstance(updated_order.get('created_at'), str):
        updated_order['created_at'] = datetime.fromisoformat(updated_order['created_at'])
    if isinstance(updated_order.get('updated_at'), str):
        updated_order['updated_at'] = datetime.fromisoformat(updated_order['updated_at'])
    
    return OrderResponse(
        success=True,
        message="Order updated successfully!",
        order=Order(**updated_order),
        order_number=updated_order["order_number"]
    )


# ============================================
# STRIPE CHECKOUT ROUTES
# ============================================

@api_router.post("/checkout/create-session")
async def create_checkout_session(checkout_data: CheckoutRequest, request: Request):
    """
    Create a Stripe checkout session.
    """
    stripe_api_key = os.environ.get("STRIPE_API_KEY")
    if not stripe_api_key:
        raise HTTPException(status_code=500, detail="Stripe API key not configured")
    
    # Build success and cancel URLs from frontend origin
    origin_url = checkout_data.origin_url.rstrip('/')
    success_url = f"{origin_url}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin_url}/cart"
    
    # Initialize Stripe checkout
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    # Create metadata for the order
    metadata = {
        "customer_email": checkout_data.shipping.email,
        "customer_name": f"{checkout_data.shipping.first_name} {checkout_data.shipping.last_name}",
        "items_count": str(len(checkout_data.items)),
        "discount": str(checkout_data.discount),
        "source": "raze_checkout"
    }
    
    # Create checkout session with the total amount
    checkout_request = CheckoutSessionRequest(
        amount=float(checkout_data.total),
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata=metadata
    )
    
    try:
        session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Store order data temporarily for later retrieval
        pending_order = {
            "session_id": session.session_id,
            "items": [item.model_dump() for item in checkout_data.items],
            "shipping": checkout_data.shipping.model_dump(),
            "subtotal": checkout_data.subtotal,
            "discount": checkout_data.discount,
            "discount_description": checkout_data.discount_description,
            "shipping_cost": checkout_data.shipping_cost,
            "total": checkout_data.total,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.pending_orders.insert_one(pending_order)
        
        # Create payment transaction record
        transaction = PaymentTransaction(
            session_id=session.session_id,
            amount=checkout_data.total,
            currency="usd",
            status="pending",
            payment_status="initiated",
            metadata=metadata
        )
        tx_doc = transaction.model_dump()
        tx_doc['created_at'] = tx_doc['created_at'].isoformat()
        tx_doc['updated_at'] = tx_doc['updated_at'].isoformat()
        await db.payment_transactions.insert_one(tx_doc)
        
        return {
            "success": True,
            "checkout_url": session.url,
            "session_id": session.session_id
        }
        
    except Exception as e:
        logger.error(f"Failed to create checkout session: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create checkout session: {str(e)}")


@api_router.get("/checkout/status/{session_id}")
async def get_checkout_status(session_id: str, request: Request):
    """
    Get the status of a checkout session and create order if paid.
    """
    stripe_api_key = os.environ.get("STRIPE_API_KEY")
    if not stripe_api_key:
        raise HTTPException(status_code=500, detail="Stripe API key not configured")
    
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    try:
        status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
        
        # Update payment transaction
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {
                "status": status.status,
                "payment_status": status.payment_status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # If paid, create the order
        if status.payment_status == "paid":
            # Check if order already created for this session
            existing_order = await db.orders.find_one({"stripe_session_id": session_id}, {"_id": 0})
            
            if not existing_order:
                # Get pending order data
                pending = await db.pending_orders.find_one({"session_id": session_id}, {"_id": 0})
                
                if pending:
                    # Create the order
                    order = Order(
                        items=[OrderItem(**item) for item in pending['items']],
                        shipping=ShippingAddress(**pending['shipping']),
                        subtotal=pending['subtotal'],
                        discount=pending['discount'],
                        discount_description=pending.get('discount_description'),
                        shipping_cost=pending['shipping_cost'],
                        total=pending['total'],
                        status="confirmed"
                    )
                    
                    doc = order.model_dump()
                    doc['stripe_session_id'] = session_id
                    doc['created_at'] = doc['created_at'].isoformat()
                    doc['updated_at'] = doc['updated_at'].isoformat()
                    doc['items'] = [item.model_dump() if hasattr(item, 'model_dump') else item for item in doc['items']]
                    doc['shipping'] = doc['shipping'].model_dump() if hasattr(doc['shipping'], 'model_dump') else doc['shipping']
                    
                    await db.orders.insert_one(doc)
                    
                    # Update payment transaction with order ID
                    await db.payment_transactions.update_one(
                        {"session_id": session_id},
                        {"$set": {"order_id": order.id}}
                    )
                    
                    # Clean up pending order
                    await db.pending_orders.delete_one({"session_id": session_id})
                    
                    # Commit inventory (deduct from stock)
                    inventory_items = [
                        {
                            "product_id": item.get("product_id"),
                            "color": item.get("color"),
                            "size": item.get("size"),
                            "quantity": item.get("quantity", 1)
                        }
                        for item in order.items
                    ]
                    for inv_item in inventory_items:
                        await db.inventory.update_one(
                            {"product_id": inv_item['product_id'], "color": inv_item['color'], "size": inv_item['size']},
                            {
                                "$inc": {"quantity": -inv_item['quantity']},
                                "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
                            }
                        )
                    
                    # Send order confirmation email (non-blocking)
                    asyncio.create_task(send_order_confirmation_email(doc))
                    
                    return {
                        "success": True,
                        "status": status.status,
                        "payment_status": status.payment_status,
                        "order_number": order.order_number,
                        "order_id": order.id
                    }
            else:
                return {
                    "success": True,
                    "status": status.status,
                    "payment_status": status.payment_status,
                    "order_number": existing_order.get("order_number"),
                    "order_id": existing_order.get("id")
                }
        
        return {
            "success": True,
            "status": status.status,
            "payment_status": status.payment_status
        }
        
    except Exception as e:
        logger.error(f"Failed to get checkout status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get checkout status: {str(e)}")


@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """
    Handle Stripe webhooks.
    """
    stripe_api_key = os.environ.get("STRIPE_API_KEY")
    if not stripe_api_key:
        raise HTTPException(status_code=500, detail="Stripe API key not configured")
    
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    try:
        body = await request.body()
        signature = request.headers.get("Stripe-Signature", "")
        
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        # Update payment transaction based on webhook
        if webhook_response.session_id:
            await db.payment_transactions.update_one(
                {"session_id": webhook_response.session_id},
                {"$set": {
                    "status": webhook_response.event_type,
                    "payment_status": webhook_response.payment_status,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
        
        return {"success": True, "event_type": webhook_response.event_type}
        
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        return {"success": False, "error": str(e)}


# ============================================
# WAITLIST ROUTES
# ============================================

# Waitlist configuration
WAITLIST_LIMIT = 100  # Limited spots

@api_router.post("/waitlist/join", response_model=WaitlistResponse)
async def join_waitlist(entry: WaitlistEntry):
    """
    Join the waitlist for Feb 2 drop.
    Limited spots available - only waitlisted users can purchase.
    """
    try:
        # Check if already on waitlist with same email and product
        existing = await db.waitlist.find_one({
            "email": entry.email.lower(),
            "product_id": entry.product_id,
            "variant": entry.variant
        })
        
        if existing:
            return WaitlistResponse(
                success=True,
                message="You're already on the waitlist for this item!",
                position=existing.get("position"),
                access_code=existing.get("access_code")
            )
        
        # Count current waitlist entries
        total_count = await db.waitlist.count_documents({})
        
        if total_count >= WAITLIST_LIMIT:
            return WaitlistResponse(
                success=False,
                message="Sorry, the waitlist is full! Follow us on Instagram for future drops."
            )
        
        # Generate unique access code for this user
        access_code = f"RAZE-{secrets.token_hex(4).upper()}"
        position = total_count + 1
        
        # Create waitlist entry
        waitlist_entry = {
            "id": str(uuid.uuid4()),
            "email": entry.email.lower(),
            "product_id": entry.product_id,
            "product_name": entry.product_name,
            "variant": entry.variant,
            "size": entry.size,
            "position": position,
            "access_code": access_code,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "notified": False,
            "purchased": False
        }
        
        await db.waitlist.insert_one(waitlist_entry)
        
        # Send confirmation email
        try:
            if resend.api_key:
                resend.Emails.send({
                    "from": SENDER_EMAIL,
                    "to": entry.email,
                    "subject": "🔥 You're on the RAZE Waitlist!",
                    "html": f"""
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ffffff; padding: 40px;">
                        <h1 style="color: #4A9FF5; margin-bottom: 20px;">You're In! 🎉</h1>
                        <p style="font-size: 16px; line-height: 1.6;">
                            You've secured spot <strong>#{position}</strong> on the waitlist for the Feb 2 drop.
                        </p>
                        <div style="background: #1a1a1a; padding: 20px; border-radius: 10px; margin: 20px 0;">
                            <p style="margin: 0 0 10px;"><strong>Your Item:</strong> {entry.product_name} - {entry.variant}</p>
                            <p style="margin: 0 0 10px;"><strong>Size:</strong> {entry.size}</p>
                            <p style="margin: 0;"><strong>Access Code:</strong> <span style="color: #4A9FF5; font-family: monospace;">{access_code}</span></p>
                        </div>
                        <p style="font-size: 14px; color: #888;">
                            Save this code — you'll need it to checkout on Feb 2.
                        </p>
                        <p style="font-size: 14px; margin-top: 30px;">
                            — Team RAZE
                        </p>
                    </div>
                    """
                })
        except Exception as email_error:
            logger.error(f"Failed to send waitlist email: {email_error}")
        
        return WaitlistResponse(
            success=True,
            message=f"You're #{position} on the waitlist! Check your email for your access code.",
            position=position,
            access_code=access_code
        )
        
    except Exception as e:
        logger.error(f"Waitlist error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/waitlist/status")
async def get_waitlist_status():
    """Get current waitlist status (spots remaining)"""
    total_count = await db.waitlist.count_documents({})
    spots_remaining = max(0, WAITLIST_LIMIT - total_count)
    
    return {
        "total_spots": WAITLIST_LIMIT,
        "spots_taken": total_count,
        "spots_remaining": spots_remaining,
        "is_full": spots_remaining == 0
    }

@api_router.get("/waitlist/verify/{access_code}")
async def verify_access_code(access_code: str):
    """Verify if an access code is valid for purchasing"""
    entry = await db.waitlist.find_one({"access_code": access_code.upper()})
    
    if not entry:
        return {"valid": False, "message": "Invalid access code"}
    
    if entry.get("purchased"):
        return {"valid": False, "message": "This code has already been used"}
    
    return {
        "valid": True,
        "email": entry["email"],
        "product_id": entry["product_id"],
        "variant": entry["variant"],
        "size": entry["size"]
    }

@api_router.get("/waitlist/admin")
async def get_all_waitlist_entries():
    """Admin: Get all waitlist entries"""
    entries = await db.waitlist.find({}, {"_id": 0}).sort("position", 1).to_list(1000)
    return {
        "total": len(entries),
        "entries": entries
    }


# ============================================
# SHIPPING ROUTES (Shippo)
# ============================================

@api_router.post("/shipping/rates", response_model=ShippingRatesResponse)
async def get_shipping_rates(request: ShippingRateRequest):
    """
    Get available shipping rates from Shippo for a destination address.
    """
    if not shippo_client:
        raise HTTPException(status_code=500, detail="Shipping service not configured")
    
    try:
        # Create address_to object
        address_to = {
            "name": f"{request.address_to.first_name} {request.address_to.last_name}",
            "street1": request.address_to.address_line1,
            "street2": request.address_to.address_line2 or "",
            "city": request.address_to.city,
            "state": request.address_to.state,
            "zip": request.address_to.postal_code,
            "country": request.address_to.country,
            "phone": request.address_to.phone or "",
            "email": request.address_to.email
        }
        
        # Package dimensions
        parcel = {
            "length": str(request.length),
            "width": str(request.width),
            "height": str(request.height),
            "distance_unit": "in",
            "weight": str(request.weight),
            "mass_unit": "lb"
        }
        
        # Create shipment to get rates
        shipment = shippo_client.shipments.create(
            shippo.components.ShipmentCreateRequest(
                address_from=shippo.components.AddressCreateRequest(**RAZE_ADDRESS),
                address_to=shippo.components.AddressCreateRequest(**address_to),
                parcels=[shippo.components.ParcelCreateRequest(**parcel)],
                async_=False
            )
        )
        
        # Parse rates from response
        rates = []
        if shipment and shipment.rates:
            for rate in shipment.rates:
                rates.append(ShippingRate(
                    object_id=rate.object_id,
                    provider=rate.provider or "Unknown",
                    service_level=rate.servicelevel.name if rate.servicelevel else "Standard",
                    amount=float(rate.amount) if rate.amount else 0,
                    currency=rate.currency or "USD",
                    estimated_days=rate.estimated_days,
                    duration_terms=rate.duration_terms
                ))
        
        # Sort by price
        rates.sort(key=lambda x: x.amount)
        
        return ShippingRatesResponse(
            success=True,
            rates=rates,
            message=f"Found {len(rates)} shipping options"
        )
        
    except Exception as e:
        logger.error(f"Error getting shipping rates: {str(e)}")
        return ShippingRatesResponse(
            success=False,
            rates=[],
            message=f"Error getting rates: {str(e)}"
        )

@api_router.post("/shipping/label", response_model=ShippingLabelResponse)
async def create_shipping_label(request: CreateLabelRequest):
    """
    Create a shipping label for a selected rate.
    """
    if not shippo_client:
        raise HTTPException(status_code=500, detail="Shipping service not configured")
    
    try:
        # Purchase the label/transaction
        transaction = shippo_client.transactions.create(
            shippo.components.TransactionCreateRequest(
                rate=request.rate_id,
                label_file_type=shippo.components.LabelFileTypeEnum.PDF_4X6,
                async_=False
            )
        )
        
        if transaction.status == "SUCCESS":
            # Update the order with tracking info
            await db.orders.update_one(
                {"id": request.order_id},
                {"$set": {
                    "tracking_number": transaction.tracking_number,
                    "label_url": transaction.label_url,
                    "carrier": transaction.rate.provider if transaction.rate else None,
                    "status": "processing",
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            return ShippingLabelResponse(
                success=True,
                tracking_number=transaction.tracking_number,
                label_url=transaction.label_url,
                carrier=transaction.rate.provider if transaction.rate else None,
                message="Label created successfully"
            )
        else:
            return ShippingLabelResponse(
                success=False,
                message=f"Label creation failed: {transaction.messages}"
            )
        
    except Exception as e:
        logger.error(f"Error creating label: {str(e)}")
        return ShippingLabelResponse(
            success=False,
            message=f"Error creating label: {str(e)}"
        )

@api_router.get("/shipping/tracking/{carrier}/{tracking_number}")
async def get_tracking_status(carrier: str, tracking_number: str):
    """
    Get tracking status for a shipment.
    """
    if not shippo_client:
        raise HTTPException(status_code=500, detail="Shipping service not configured")
    
    try:
        tracking = shippo_client.track.get_status(
            carrier=carrier.lower(),
            tracking_number=tracking_number
        )
        
        return {
            "success": True,
            "tracking_number": tracking.tracking_number,
            "carrier": tracking.carrier,
            "status": tracking.tracking_status.status if tracking.tracking_status else "unknown",
            "status_details": tracking.tracking_status.status_details if tracking.tracking_status else None,
            "location": tracking.tracking_status.location.city if tracking.tracking_status and tracking.tracking_status.location else None,
            "eta": tracking.eta,
            "history": [
                {
                    "status": event.status,
                    "status_details": event.status_details,
                    "date": event.status_date,
                    "location": event.location.city if event.location else None
                }
                for event in (tracking.tracking_history or [])
            ]
        }
        
    except Exception as e:
        logger.error(f"Error getting tracking: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error getting tracking: {str(e)}")


# ============================================
# ADMIN ROUTES
# ============================================

# Store admin sessions (in production, use Redis or database)
admin_sessions = set()

@api_router.post("/admin/login")
async def admin_login(credentials: AdminLogin, response: Response):
    """Admin login with password"""
    if credentials.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid admin password")
    
    # Generate admin session token
    admin_token = secrets.token_urlsafe(32)
    admin_sessions.add(admin_token)
    
    response.set_cookie(
        key="admin_token",
        value=admin_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=24*60*60  # 24 hours
    )
    
    # Return token in body as well for localStorage fallback
    return {"success": True, "message": "Admin logged in successfully", "token": admin_token}

async def verify_admin(request: Request):
    """Verify admin session"""
    admin_token = request.cookies.get("admin_token")
    if not admin_token or admin_token not in admin_sessions:
        # Also check header for API calls
        admin_token = request.headers.get("X-Admin-Token")
        if not admin_token or admin_token not in admin_sessions:
            raise HTTPException(status_code=401, detail="Admin authentication required")
    return True

@api_router.post("/admin/logout")
async def admin_logout(request: Request, response: Response):
    """Admin logout"""
    admin_token = request.cookies.get("admin_token")
    if admin_token and admin_token in admin_sessions:
        admin_sessions.discard(admin_token)
    
    response.delete_cookie("admin_token", path="/")
    return {"success": True, "message": "Admin logged out"}

@api_router.get("/admin/verify")
async def verify_admin_session(request: Request):
    """Verify if admin is logged in"""
    try:
        await verify_admin(request)
        return {"authenticated": True}
    except HTTPException:
        return {"authenticated": False}

@api_router.get("/admin/stats")
async def get_admin_stats(request: Request):
    """Get admin dashboard statistics"""
    await verify_admin(request)
    
    total_users = await db.users.count_documents({})
    total_subscribers = await db.email_subscriptions.count_documents({})
    total_orders = await db.orders.count_documents({})
    total_waitlist = await db.waitlist.count_documents({})
    
    # Get recent signups (last 7 days)
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    recent_users = await db.users.count_documents({"created_at": {"$gte": week_ago}})
    recent_subscribers = await db.email_subscriptions.count_documents({"timestamp": {"$gte": week_ago}})
    
    return {
        "total_users": total_users,
        "total_subscribers": total_subscribers,
        "total_orders": total_orders,
        "total_waitlist": total_waitlist,
        "recent_users_7d": recent_users,
        "recent_subscribers_7d": recent_subscribers
    }

@api_router.get("/admin/users")
async def get_all_users(request: Request, skip: int = 0, limit: int = 100):
    """Get all registered users"""
    await verify_admin(request)
    
    users = await db.users.find(
        {}, 
        {"_id": 0, "password_hash": 0}  # Exclude sensitive data
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    total = await db.users.count_documents({})
    
    return {
        "users": users,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@api_router.get("/admin/subscribers")
async def get_all_subscribers(request: Request, source: Optional[str] = None, skip: int = 0, limit: int = 100):
    """Get all email subscribers"""
    await verify_admin(request)
    
    query = {}
    if source:
        query["source"] = source
    
    subscribers = await db.email_subscriptions.find(
        query, 
        {"_id": 0}
    ).sort("timestamp", -1).skip(skip).limit(limit).to_list(limit)
    
    total = await db.email_subscriptions.count_documents(query)
    
    return {
        "subscribers": subscribers,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@api_router.get("/admin/waitlist")
async def get_all_waitlist(request: Request, skip: int = 0, limit: int = 100):
    """Get all waitlist entries"""
    await verify_admin(request)
    
    entries = await db.waitlist.find(
        {}, 
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    total = await db.waitlist.count_documents({})
    
    return {
        "waitlist": entries,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@api_router.get("/admin/orders")
async def get_all_orders(request: Request, skip: int = 0, limit: int = 100):
    """Get all orders"""
    await verify_admin(request)
    
    orders = await db.orders.find(
        {}, 
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    total = await db.orders.count_documents({})
    
    return {
        "orders": orders,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@api_router.post("/admin/send-bulk-email")
async def send_bulk_email(request: Request, email_request: BulkEmailRequest):
    """Send bulk email to subscribers"""
    await verify_admin(request)
    
    if not resend.api_key:
        raise HTTPException(status_code=500, detail="Email service not configured")
    
    # Get target emails based on target type
    emails = []
    
    if email_request.target == "all":
        # Get all unique emails from subscribers and users
        subscribers = await db.email_subscriptions.find({}, {"email": 1, "_id": 0}).to_list(10000)
        users = await db.users.find({}, {"email": 1, "_id": 0}).to_list(10000)
        emails = list(set([s["email"] for s in subscribers] + [u["email"] for u in users]))
    
    elif email_request.target == "subscribers":
        subscribers = await db.email_subscriptions.find({}, {"email": 1, "_id": 0}).to_list(10000)
        emails = list(set([s["email"] for s in subscribers]))
    
    elif email_request.target == "users":
        users = await db.users.find({}, {"email": 1, "_id": 0}).to_list(10000)
        emails = [u["email"] for u in users]
    
    elif email_request.target == "waitlist":
        waitlist = await db.waitlist.find({}, {"email": 1, "_id": 0}).to_list(10000)
        emails = list(set([w["email"] for w in waitlist]))
    
    elif email_request.target == "early_access":
        subscribers = await db.email_subscriptions.find({"source": "early_access"}, {"email": 1, "_id": 0}).to_list(10000)
        emails = [s["email"] for s in subscribers]
    
    if not emails:
        return {"success": False, "message": "No recipients found", "sent_count": 0}
    
    # Send emails in batches (Resend has rate limits)
    sent_count = 0
    failed_count = 0
    batch_size = 50
    
    for i in range(0, len(emails), batch_size):
        batch = emails[i:i+batch_size]
        
        for email in batch:
            try:
                params = {
                    "from": SENDER_EMAIL,
                    "to": [email],
                    "subject": email_request.subject,
                    "html": email_request.html_content
                }
                await asyncio.to_thread(resend.Emails.send, params)
                sent_count += 1
            except Exception as e:
                logger.error(f"Failed to send email to {email}: {str(e)}")
                failed_count += 1
        
        # Small delay between batches to respect rate limits
        if i + batch_size < len(emails):
            await asyncio.sleep(1)
    
    return {
        "success": True,
        "message": f"Bulk email sent",
        "sent_count": sent_count,
        "failed_count": failed_count,
        "total_recipients": len(emails)
    }

@api_router.delete("/admin/subscriber/{email}")
async def delete_subscriber(request: Request, email: str):
    """Delete a subscriber"""
    await verify_admin(request)
    
    result = await db.email_subscriptions.delete_many({"email": email.lower()})
    
    return {
        "success": True,
        "deleted_count": result.deleted_count
    }

@api_router.delete("/admin/user/{user_id}")
async def delete_user(request: Request, user_id: str):
    """Delete a user"""
    await verify_admin(request)
    
    # Delete user sessions
    await db.user_sessions.delete_many({"user_id": user_id})
    
    # Delete user
    result = await db.users.delete_one({"user_id": user_id})
    
    return {
        "success": True,
        "deleted": result.deleted_count > 0
    }


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()