import os, stripe
from fastapi import APIRouter, Depends, HTTPException
from ..auth import get_user

router = APIRouter(prefix="/api", tags=["payments"])

def get_stripe_key():
    return os.environ["STRIPE_SECRET_KEY"]

@router.post("/checkout")
async def create_checkout(body: dict, user_id: str = Depends(get_user)):
    try:
        stripe.api_key = get_stripe_key()
        session = stripe.checkout.Session.create(
            mode="payment",
            client_reference_id=str(body["diagnostic_id"]),
            customer_email=None,  # optional; you rely on Firebase uid for auth
            line_items=[{"price_data":{
                "currency":"usd",
                "product_data":{"name":"DiagnosticPro AI Analysis"},
                "unit_amount":2999
            },"quantity":1}],
            success_url=body["success_url"],
            cancel_url=body["cancel_url"],
            metadata={"uid": user_id}
        )
        return {"url": session.url}
    except Exception as e:
        raise HTTPException(400, str(e))