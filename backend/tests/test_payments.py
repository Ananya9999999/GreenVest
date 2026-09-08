import hmac
import hashlib
import json
import time
from fastapi.testclient import TestClient
from src.api.app import app
from src.core.config import get_settings
from src.db.database import get_user_by_id, get_user_subscriptions

client = TestClient(app)
settings = get_settings()


def _create_test_user(prefix: str, user_type: str = "landowner") -> str:
    uid = f"{prefix}_{int(time.time() * 1000)}"
    res = client.post("/api/auth/register", json={
        "user_id": uid,
        "name": f"Test {prefix.capitalize()}",
        "email": f"{uid}@greenvest.org",
        "password": "secretpassword",
        "user_type": user_type,
        "verified_area_ha": 10.0 if user_type == "landowner" else 0.0,
        "budget_inr": 500000.0,
    })
    assert res.status_code == 200
    assert res.json()["subscription_tier"] == "free"
    return uid


def test_create_order_landowner_and_corporate():
    uid = _create_test_user("order_user")

    # 1. Landowner Listing order
    res_land = client.post("/api/payments/create-order", json={
        "user_id": uid,
        "plan_type": "landowner_listing",
    })
    assert res_land.status_code == 200
    data_land = res_land.json()
    assert data_land["amount"] == 199900
    assert data_land["amount_inr"] == 1999.0
    assert data_land["order_id"].startswith("order_")
    assert data_land["plan_type"] == "landowner_listing"

    # 2. Corporate Access order
    corp_uid = _create_test_user("corp_order_user", user_type="corporate")
    res_corp = client.post("/api/payments/create-order", json={
        "user_id": corp_uid,
        "plan_type": "corporate_access",
    })
    assert res_corp.status_code == 200
    data_corp = res_corp.json()
    assert data_corp["amount"] == 999900
    assert data_corp["amount_inr"] == 9999.0
    assert data_corp["plan_type"] == "corporate_access"

    # 3. Invalid plan error
    res_err = client.post("/api/payments/create-order", json={
        "user_id": uid,
        "plan_type": "invalid_vip_tier",
    })
    assert res_err.status_code == 400


def test_verify_payment_success_and_failure():
    uid = _create_test_user("verify_user")
    initial_user = get_user_by_id(uid)
    initial_score = initial_user["credit_score"]

    order_res = client.post("/api/payments/create-order", json={
        "user_id": uid,
        "plan_type": "landowner_listing",
    })
    order_id = order_res.json()["order_id"]
    payment_id = f"pay_{int(time.time() * 1000)}"

    # 1. Invalid signature should be rejected and keep user as free
    bad_verify = client.post("/api/payments/verify", json={
        "razorpay_order_id": order_id,
        "razorpay_payment_id": payment_id,
        "razorpay_signature": "fraudulent_signature_xyz",
        "user_id": uid,
        "plan_type": "landowner_listing",
    })
    assert bad_verify.status_code == 400
    user_after_bad = get_user_by_id(uid)
    assert user_after_bad["subscription_tier"] == "free"

    # 2. Valid signature verification
    msg = f"{order_id}|{payment_id}".encode("utf-8")
    secret = settings.RAZORPAY_KEY_SECRET.encode("utf-8")
    valid_sig = hmac.new(secret, msg, hashlib.sha256).hexdigest()

    good_verify = client.post("/api/payments/verify", json={
        "razorpay_order_id": order_id,
        "razorpay_payment_id": payment_id,
        "razorpay_signature": valid_sig,
        "user_id": uid,
        "plan_type": "landowner_listing",
    })
    assert good_verify.status_code == 200
    verify_data = good_verify.json()
    assert verify_data["success"] is True
    assert verify_data["subscription_tier"] == "landowner_listing"
    assert verify_data["credit_score"] > initial_score

    # Check persistence in database
    db_user = get_user_by_id(uid)
    assert db_user["subscription_tier"] == "landowner_listing"
    subs = get_user_subscriptions(uid)
    assert len(subs) >= 1
    assert subs[0]["payment_id"] == payment_id
    assert subs[0]["status"] == "active"


def test_webhook_payment_captured_and_failed():
    uid = _create_test_user("webhook_user")
    corp_uid = _create_test_user("webhook_corp", user_type="corporate")

    order_id = f"order_hook_{int(time.time() * 1000)}"
    payment_id = f"pay_hook_{int(time.time() * 1000)}"

    # 1. Webhook with payment.captured
    payload = {
        "event": "payment.captured",
        "id": f"evt_{int(time.time() * 1000)}",
        "payload": {
            "payment": {
                "entity": {
                    "id": payment_id,
                    "order_id": order_id,
                    "amount": 999900,
                    "notes": {
                        "user_id": corp_uid,
                        "plan_type": "corporate_access",
                    }
                }
            }
        }
    }
    payload_bytes = json.dumps(payload).encode("utf-8")
    secret = settings.RAZORPAY_WEBHOOK_SECRET.encode("utf-8")
    sig = hmac.new(secret, payload_bytes, hashlib.sha256).hexdigest()

    hook_res = client.post(
        "/api/payments/webhook",
        content=payload_bytes,
        headers={"Content-Type": "application/json", "X-Razorpay-Signature": sig},
    )
    assert hook_res.status_code == 200
    assert hook_res.json()["status"] == "ok"

    # User in database should now be corporate_access
    updated_corp = get_user_by_id(corp_uid)
    assert updated_corp["subscription_tier"] == "corporate_access"

    # 2. Webhook with payment.failed
    fail_payload = {
        "event": "payment.failed",
        "id": f"evt_fail_{int(time.time() * 1000)}",
        "payload": {
            "payment": {
                "entity": {
                    "id": f"pay_failed_{int(time.time() * 1000)}",
                    "order_id": f"order_failed_{int(time.time() * 1000)}",
                    "amount": 199900,
                    "notes": {
                        "user_id": uid,
                        "plan_type": "landowner_listing",
                    }
                }
            }
        }
    }
    fail_bytes = json.dumps(fail_payload).encode("utf-8")
    fail_sig = hmac.new(secret, fail_bytes, hashlib.sha256).hexdigest()

    fail_res = client.post(
        "/api/payments/webhook",
        content=fail_bytes,
        headers={"Content-Type": "application/json", "X-Razorpay-Signature": fail_sig},
    )
    assert fail_res.status_code == 200
    # Tier should stay free
    user_after_fail = get_user_by_id(uid)
    assert user_after_fail["subscription_tier"] == "free"

    # 3. Invalid webhook signature
    bad_hook = client.post(
        "/api/payments/webhook",
        content=payload_bytes,
        headers={"Content-Type": "application/json", "X-Razorpay-Signature": "wrong_signature"},
    )
    assert bad_hook.status_code == 400


def test_gated_api_endpoints():
    free_user = _create_test_user("free_gate_user")
    paid_landowner = _create_test_user("paid_gate_landowner")
    paid_corp = _create_test_user("paid_gate_corp", user_type="corporate")

    # Upgrade paid landowner via verify
    order_id = f"order_gate_{int(time.time())}"
    pay_id = f"pay_gate_{int(time.time())}"
    sig = hmac.new(settings.RAZORPAY_KEY_SECRET.encode(), f"{order_id}|{pay_id}".encode(), hashlib.sha256).hexdigest()
    client.post("/api/payments/verify", json={
        "razorpay_order_id": order_id,
        "razorpay_payment_id": pay_id,
        "razorpay_signature": sig,
        "user_id": paid_landowner,
        "plan_type": "landowner_listing",
    })

    # Upgrade paid corp via verify
    corp_order = f"order_gate_c_{int(time.time())}"
    corp_pay = f"pay_gate_c_{int(time.time())}"
    corp_sig = hmac.new(settings.RAZORPAY_KEY_SECRET.encode(), f"{corp_order}|{corp_pay}".encode(), hashlib.sha256).hexdigest()
    client.post("/api/payments/verify", json={
        "razorpay_order_id": corp_order,
        "razorpay_payment_id": corp_pay,
        "razorpay_signature": corp_sig,
        "user_id": paid_corp,
        "plan_type": "corporate_access",
    })

    # Gated Listing: Free user cannot list land
    fail_listing = client.post("/api/marketplace/lands", json={
        "owner_user_id": free_user,
        "title": "Gated Test Parcel",
        "location": "Pune, MH",
        "area_hectares": 10.0,
    })
    assert fail_listing.status_code == 403

    # Paid landowner can list land
    pass_listing = client.post("/api/marketplace/lands", json={
        "owner_user_id": paid_landowner,
        "title": "Verified Active Agro Parcel",
        "location": "Pune, MH",
        "area_hectares": 12.0,
    })
    assert pass_listing.status_code == 200

    # Gated Marketplace load: Free user cannot load marketplace lands
    fail_browse = client.get(f"/api/marketplace/lands?user_id={free_user}")
    assert fail_browse.status_code == 403

    # Paid corporate user can load marketplace lands
    pass_browse = client.get(f"/api/marketplace/lands?user_id={paid_corp}")
    assert pass_browse.status_code == 200
    assert len(pass_browse.json()) >= 1

    # Gated Messaging: Free user cannot send message
    fail_msg = client.post("/api/messages", json={
        "sender_user_id": free_user,
        "recipient_user_id": paid_landowner,
        "content": "Hello from free user",
    })
    assert fail_msg.status_code == 403

    # Paid corporate user can send message
    pass_msg = client.post("/api/messages", json={
        "sender_user_id": paid_corp,
        "recipient_user_id": paid_landowner,
        "content": "Hello from corporate investor",
    })
    assert pass_msg.status_code == 200
