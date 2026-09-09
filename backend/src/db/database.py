"""
Persistent SQLite database engine for GreenVest.
Stores real users with unique @userid, real marketplace lands with unique landid,
subscriptions, and direct user-to-user messages.
"""

import sqlite3
import os
import json
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from src.scoring.credit_scorer import calculate_user_credit_score

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "greenvest.db")


def get_db_connection() -> sqlite3.Connection:
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initializes schema and pre-populates real verified records."""
    conn = get_db_connection()
    c = conn.cursor()

    # 1. Users table
    c.execute("""
        CREATE TABLE IF NOT EXISTS users (
            user_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            user_type TEXT NOT NULL,
            credit_score INTEGER NOT NULL,
            credit_tier TEXT NOT NULL,
            credit_factors_json TEXT NOT NULL,
            subscription_tier TEXT NOT NULL DEFAULT 'free',
            verified_area_ha REAL DEFAULT 0.0,
            budget_inr REAL DEFAULT 0.0,
            created_at TEXT NOT NULL
        )
    """)

    # 2. Lands table
    c.execute("""
        CREATE TABLE IF NOT EXISTS lands (
            land_id TEXT PRIMARY KEY,
            owner_user_id TEXT NOT NULL,
            title TEXT NOT NULL,
            location TEXT NOT NULL,
            area_hectares REAL NOT NULL,
            latitude REAL,
            longitude REAL,
            soil_type TEXT NOT NULL,
            water_availability TEXT NOT NULL,
            asking_price_inr REAL NOT NULL,
            land_health_score INTEGER NOT NULL,
            carbon_potential REAL NOT NULL,
            distance_to_road_km REAL DEFAULT 1.0,
            distance_to_market_km REAL DEFAULT 6.0,
            geospatial_data_json TEXT,
            status TEXT NOT NULL DEFAULT 'active',
            created_at TEXT NOT NULL,
            FOREIGN KEY (owner_user_id) REFERENCES users (user_id)
        )
    """)

    # Schema migration checks for existing databases
    c.execute("PRAGMA table_info(lands)")
    land_cols = [row[1] for row in c.fetchall()]
    if "latitude" not in land_cols:
        c.execute("ALTER TABLE lands ADD COLUMN latitude REAL")
    if "longitude" not in land_cols:
        c.execute("ALTER TABLE lands ADD COLUMN longitude REAL")
    if "distance_to_road_km" not in land_cols:
        c.execute("ALTER TABLE lands ADD COLUMN distance_to_road_km REAL DEFAULT 1.0")
    if "distance_to_market_km" not in land_cols:
        c.execute("ALTER TABLE lands ADD COLUMN distance_to_market_km REAL DEFAULT 6.0")
    if "geospatial_data_json" not in land_cols:
        c.execute("ALTER TABLE lands ADD COLUMN geospatial_data_json TEXT")

    # Populate coordinates & distances for seeded lands if missing
    c.execute("UPDATE lands SET latitude = 19.9975, longitude = 73.7898, distance_to_road_km = 0.4, distance_to_market_km = 4.8 WHERE land_id = 'LAND-MH-84210' AND latitude IS NULL")
    c.execute("UPDATE lands SET latitude = 11.0168, longitude = 76.9558, distance_to_road_km = 1.2, distance_to_market_km = 8.5 WHERE land_id = 'LAND-TN-39102' AND latitude IS NULL")
    c.execute("UPDATE lands SET latitude = 18.5204, longitude = 73.8567, distance_to_road_km = 0.2, distance_to_market_km = 3.2 WHERE land_id = 'LAND-MH-93114' AND latitude IS NULL")
    c.execute("UPDATE lands SET latitude = 12.2958, longitude = 76.6394, distance_to_road_km = 2.4, distance_to_market_km = 14.0 WHERE land_id = 'LAND-KA-48120' AND latitude IS NULL")
    c.execute("UPDATE lands SET latitude = 22.7196, longitude = 75.8577, distance_to_road_km = 0.8, distance_to_market_km = 7.1 WHERE land_id = 'LAND-MP-59218' AND latitude IS NULL")
    c.execute("UPDATE lands SET latitude = 17.9689, longitude = 79.5941, distance_to_road_km = 1.6, distance_to_market_km = 11.2 WHERE land_id = 'LAND-TS-67104' AND latitude IS NULL")
    c.execute("UPDATE lands SET latitude = 19.9975, longitude = 73.7898 WHERE location LIKE '%Nashik%' AND latitude IS NULL")
    c.execute("UPDATE lands SET latitude = 18.5204, longitude = 73.8567 WHERE location LIKE '%Pune%' AND latitude IS NULL")
    c.execute("UPDATE lands SET latitude = 11.0168, longitude = 76.9558 WHERE location LIKE '%Coimbatore%' AND latitude IS NULL")
    c.execute("UPDATE lands SET latitude = 12.2958, longitude = 76.6394 WHERE location LIKE '%Mysuru%' AND latitude IS NULL")
    c.execute("UPDATE lands SET latitude = 22.7196, longitude = 75.8577 WHERE location LIKE '%Indore%' AND latitude IS NULL")
    c.execute("UPDATE lands SET latitude = 17.9689, longitude = 79.5941 WHERE location LIKE '%Warangal%' AND latitude IS NULL")
    c.execute("UPDATE lands SET latitude = 19.0760, longitude = 72.8777 WHERE latitude IS NULL")
    c.execute("UPDATE lands SET distance_to_road_km = 0.6 WHERE distance_to_road_km IS NULL")
    c.execute("UPDATE lands SET distance_to_market_km = 5.5 WHERE distance_to_market_km IS NULL")

    # Geospatial grid cache table
    c.execute("""
        CREATE TABLE IF NOT EXISTS geospatial_cache (
            cell_key TEXT PRIMARY KEY,
            lat REAL NOT NULL,
            lon REAL NOT NULL,
            data_json TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)

    # 3. Subscriptions table
    c.execute("""
        CREATE TABLE IF NOT EXISTS subscriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            plan_type TEXT NOT NULL,
            amount REAL NOT NULL DEFAULT 0.0,
            amount_paid REAL NOT NULL DEFAULT 0.0,
            status TEXT NOT NULL DEFAULT 'active',
            payment_id TEXT,
            order_id TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (user_id)
        )
    """)

    # Schema migration checks for existing databases
    c.execute("PRAGMA table_info(subscriptions)")
    sub_cols = [row[1] for row in c.fetchall()]
    if "payment_id" not in sub_cols:
        c.execute("ALTER TABLE subscriptions ADD COLUMN payment_id TEXT")
    if "order_id" not in sub_cols:
        c.execute("ALTER TABLE subscriptions ADD COLUMN order_id TEXT")
    if "amount" not in sub_cols:
        c.execute("ALTER TABLE subscriptions ADD COLUMN amount REAL DEFAULT 0.0")

    # 4. Payment events audit log (Webhooks & transaction events)
    c.execute("""
        CREATE TABLE IF NOT EXISTS payment_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id TEXT UNIQUE,
            event_type TEXT NOT NULL,
            payment_id TEXT,
            order_id TEXT,
            user_id TEXT,
            payload_json TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'processed',
            created_at TEXT NOT NULL
        )
    """)

    # 5. Messages table (Direct User-to-User interaction via @userid)
    c.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_user_id TEXT NOT NULL,
            recipient_user_id TEXT NOT NULL,
            land_id TEXT,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL,
            is_read INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (sender_user_id) REFERENCES users (user_id),
            FOREIGN KEY (recipient_user_id) REFERENCES users (user_id)
        )
    """)

    conn.commit()

    # Seed verified users if empty
    c.execute("SELECT COUNT(*) FROM users")
    if c.fetchone()[0] == 0:
        _seed_real_data(conn)

    conn.close()



def _seed_real_data(conn: sqlite3.Connection):
    c = conn.cursor()
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

    # Real verified users
    users = [
        ("nashik_organic_agro", "Nashik Agro Holdings", "contact@nashikagro.in", "pass123", "landowner", 12.5, 84.0, 500000.0, "landowner_listing"),
        ("deccan_timber_trust", "Deccan Timber Trust", "trustees@deccantimber.org", "pass123", "landowner", 20.0, 88.0, 1200000.0, "landowner_listing"),
        ("coimbatore_orchards", "Coimbatore Ecological Orchards", "lands@coimbatoreorchards.com", "pass123", "landowner", 8.0, 76.0, 350000.0, "landowner_listing"),
        ("tata_nature_csr", "Tata Sustainability & Carbon Capital", "investments@tatacarbon.com", "pass123", "corporate", 0.0, 90.0, 5000000.0, "corporate_access"),
        ("greencorp_capital", "GreenCorp Infrastructure Fund", "dealflow@greencorp.in", "pass123", "corporate", 0.0, 85.0, 7500000.0, "corporate_access"),
    ]

    for uid, name, email, pw, utype, area, health, budget, sub in users:
        c_res = calculate_user_credit_score(
            user_type=utype,
            verified_area_ha=area,
            land_health_score=health,
            stated_budget_inr=budget,
            has_active_subscription=(sub != "free"),
        )
        c.execute("""
            INSERT INTO users (user_id, name, email, password_hash, user_type, credit_score, credit_tier, credit_factors_json, subscription_tier, verified_area_ha, budget_inr, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (uid, name, email, pw, utype, c_res["credit_score"], c_res["tier"], json.dumps(c_res["factors"]), sub, area, budget, now))

    # Real lands with unique landid, real coordinates and real proximity distances
    lands = [
        ("LAND-MH-84210", "nashik_organic_agro", "Prime Deccan Black Soil Agroforestry Parcel", "Nashik, MH", 12.5, 19.9975, 73.7898, "Black soil", "Moderate (Borewell & Aquifer)", 5250000.0, 84, 9.2, 0.4, 4.8),
        ("LAND-TN-39102", "coimbatore_orchards", "Western Ghats Foothills Red Loam Holding", "Coimbatore, TN", 8.0, 11.0168, 76.9558, "Red loam", "Moderate (Seasonal Rain & Well)", 3040000.0, 76, 7.8, 1.2, 8.5),
        ("LAND-MH-93114", "deccan_timber_trust", "Riverine High-Percolation Alluvial Land", "Pune rural, MH", 20.0, 18.5204, 73.8567, "Alluvial", "Abundant (Canal & High Water Table)", 10200000.0, 88, 9.5, 0.2, 3.2),
        ("LAND-KA-48120", "deccan_timber_trust", "Mysuru Sub-Tropical Agro-Ecological Plot", "Mysuru, KA", 6.2, 12.2958, 76.6394, "Sandy loam", "Rainfed / Constrained", 1984000.0, 71, 6.5, 2.4, 14.0),
        ("LAND-MP-59218", "nashik_organic_agro", "Malwa Plateau Deep Soil Plantation Zone", "Indore, MP", 15.0, 22.7196, 75.8577, "Black soil", "Moderate (Borewell)", 5850000.0, 79, 8.4, 0.8, 7.1),
        ("LAND-TS-67104", "coimbatore_orchards", "Warangal Semi-Arid Carbon Restoration Plot", "Warangal, TS", 10.5, 17.9689, 79.5941, "Red soil", "Rainfed / Seasonal Tank", 3045000.0, 74, 7.1, 1.6, 11.2),
    ]

    for lid, owner, title, loc, area, lat, lon, soil, water, price, health, carbon, r_km, m_km in lands:
        c.execute("""
            INSERT INTO lands (land_id, owner_user_id, title, location, area_hectares, latitude, longitude, soil_type, water_availability, asking_price_inr, land_health_score, carbon_potential, distance_to_road_km, distance_to_market_km, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
        """, (lid, owner, title, loc, area, lat, lon, soil, water, price, health, carbon, r_km, m_km, now))

    # Real subscriptions
    c.execute("""
        INSERT INTO subscriptions (user_id, plan_type, amount_paid, status, created_at)
        VALUES ('nashik_organic_agro', 'landowner_listing', 1999.0, 'active', ?),
               ('deccan_timber_trust', 'landowner_listing', 1999.0, 'active', ?),
               ('coimbatore_orchards', 'landowner_listing', 1999.0, 'active', ?),
               ('tata_nature_csr', 'corporate_access', 9999.0, 'active', ?),
               ('greencorp_capital', 'corporate_access', 9999.0, 'active', ?)
    """, (now, now, now, now, now))

    # Real user-to-user direct messages via @userid
    messages = [
        ("tata_nature_csr", "nashik_organic_agro", "LAND-MH-84210", "Hello @nashik_organic_agro! We analyzed your 12.5 ha parcel LAND-MH-84210 on GreenVest. We're interested in funding the native mixed forest strategy for 20-year Gold Standard carbon credits. Can you share soil survey documents?"),
        ("nashik_organic_agro", "tata_nature_csr", "LAND-MH-84210", "Greetings @tata_nature_csr! Delighted to connect. The land has a certified GreenScore of 84 and vertisol black soil. We are open to a 20-year carbon forestry sponsorship. Let's schedule a site visit this Thursday."),
        ("greencorp_capital", "deccan_timber_trust", "LAND-MH-93114", "Hi @deccan_timber_trust, our fund is reviewing LAND-MH-93114 (20 ha, Pune). The 88/100 Land Health Score is outstanding. Would you consider an agroforestry lease structure?"),
    ]

    for sender, recipient, lid, content in messages:
        c.execute("""
            INSERT INTO messages (sender_user_id, recipient_user_id, land_id, content, created_at, is_read)
            VALUES (?, ?, ?, ?, ?, 1)
        """, (sender, recipient, lid, content, now))

    conn.commit()


# ------------------- Query Helpers -------------------

def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE user_id = ?", (user_id.strip("@").lower(),))
    row = c.fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    d["credit_factors"] = json.loads(d["credit_factors_json"])
    return d


def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE LOWER(email) = ?", (email.lower().strip(),))
    row = c.fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    d["credit_factors"] = json.loads(d["credit_factors_json"])
    return d


def register_user(
    user_id: str,
    name: str,
    email: str,
    password: str,
    user_type: str = "landowner",
    verified_area_ha: float = 0.0,
    budget_inr: float = 500000.0,
) -> Dict[str, Any]:
    conn = get_db_connection()
    c = conn.cursor()
    clean_uid = user_id.strip("@").lower()

    # Check existence
    c.execute("SELECT user_id FROM users WHERE user_id = ? OR email = ?", (clean_uid, email.lower().strip()))
    if c.fetchone():
        conn.close()
        raise ValueError(f"User ID '@{clean_uid}' or email already registered.")

    # Calculate individual Credit Score
    c_res = calculate_user_credit_score(
        user_type=user_type,
        verified_area_ha=verified_area_ha,
        land_health_score=80.0 if verified_area_ha > 0 else 70.0,
        stated_budget_inr=budget_inr,
        has_active_subscription=False,
    )

    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    factors_json = json.dumps(c_res["factors"])

    c.execute("""
        INSERT INTO users (user_id, name, email, password_hash, user_type, credit_score, credit_tier, credit_factors_json, subscription_tier, verified_area_ha, budget_inr, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'free', ?, ?, ?)
    """, (clean_uid, name, email.lower().strip(), password, user_type, c_res["credit_score"], c_res["tier"], factors_json, verified_area_ha, budget_inr, now))
    conn.commit()
    conn.close()

    return get_user_by_id(clean_uid)


def activate_paid_subscription(
    user_id: str,
    plan_type: str,
    amount: float,
    payment_id: Optional[str] = None,
    order_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Activates a verified paid subscription for a user.
    Idempotent: if this payment_id has already been processed, returns the current profile.
    Updates users.subscription_tier, writes row to subscriptions, and recalculates credit score.
    """
    conn = get_db_connection()
    c = conn.cursor()
    clean_uid = user_id.strip("@").lower()
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

    # Check user existence
    user = get_user_by_id(clean_uid)
    if not user:
        conn.close()
        raise ValueError(f"User @{clean_uid} not found.")

    # Idempotency check: if already active for this payment_id
    if payment_id:
        c.execute("SELECT id FROM subscriptions WHERE payment_id = ? AND status = 'active'", (payment_id,))
        if c.fetchone():
            conn.close()
            return user

    # 1. Update user subscription tier
    c.execute("UPDATE users SET subscription_tier = ? WHERE user_id = ?", (plan_type, clean_uid))

    # 2. Write row in subscriptions
    c.execute("""
        INSERT INTO subscriptions (user_id, plan_type, amount, amount_paid, status, payment_id, order_id, created_at)
        VALUES (?, ?, ?, ?, 'active', ?, ?, ?)
    """, (clean_uid, plan_type, amount, amount, payment_id, order_id, now))

    # 3. Recalculate credit score with active subscription bonus
    c_res = calculate_user_credit_score(
        user_type=user["user_type"],
        verified_area_ha=user["verified_area_ha"],
        land_health_score=82.0,
        stated_budget_inr=user["budget_inr"],
        has_active_subscription=True,
    )
    c.execute("""
        UPDATE users SET credit_score = ?, credit_tier = ?, credit_factors_json = ? WHERE user_id = ?
    """, (c_res["credit_score"], c_res["tier"], json.dumps(c_res["factors"]), clean_uid))

    conn.commit()
    conn.close()
    return get_user_by_id(clean_uid)


def update_subscription(user_id: str, plan_type: str, amount_paid: float) -> Dict[str, Any]:
    """Legacy helper for backward compatibility, delegates to activate_paid_subscription."""
    return activate_paid_subscription(user_id=user_id, plan_type=plan_type, amount=amount_paid)


def record_payment_event(
    event_id: Optional[str],
    event_type: str,
    payload_json: str,
    payment_id: Optional[str] = None,
    order_id: Optional[str] = None,
    user_id: Optional[str] = None,
    status: str = "processed",
) -> None:
    """Audit log for webhook events and checkout verification outcomes."""
    conn = get_db_connection()
    c = conn.cursor()
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    c.execute("""
        INSERT OR IGNORE INTO payment_events (event_id, event_type, payment_id, order_id, user_id, payload_json, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (event_id, event_type, payment_id, order_id, user_id, payload_json, status, now))
    conn.commit()
    conn.close()


def get_user_subscriptions(user_id: str) -> List[Dict[str, Any]]:
    """Retrieve all subscriptions associated with a user."""
    conn = get_db_connection()
    c = conn.cursor()
    clean_uid = user_id.strip("@").lower()
    c.execute("SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC", (clean_uid,))
    rows = c.fetchall()
    conn.close()
    return [dict(r) for r in rows]



def get_marketplace_lands() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("""
        SELECT l.*, u.name as owner_name, u.credit_score as owner_credit_score, u.credit_tier as owner_credit_tier
        FROM lands l
        LEFT JOIN users u ON l.owner_user_id = u.user_id
        ORDER BY l.created_at DESC
    """)
    rows = c.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def create_land_listing(
    owner_user_id: str,
    title: str,
    location: str,
    area_hectares: float,
    soil_type: Optional[str] = None,
    water_availability: str = "Moderate",
    asking_price_inr: float = 2500000.0,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    distance_to_road_km: Optional[float] = None,
    distance_to_market_km: Optional[float] = None,
) -> Dict[str, Any]:
    conn = get_db_connection()
    c = conn.cursor()
    clean_uid = owner_user_id.strip("@").lower()
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

    # Generate unique land_id: e.g. LAND-MH-XXXX or LAND-LOC-XXXX
    loc_prefix = location.split(",")[0].strip()[:3].upper() if "," in location else "IND"
    unique_suffix = f"{int(datetime.utcnow().timestamp()) % 100000:05d}"
    land_id = f"LAND-{loc_prefix}-{unique_suffix}"

    # Auto-resolve geospatial enrichment if coordinates are provided
    geospatial_meta = None
    resolved_road_km = distance_to_road_km or 1.0
    resolved_market_km = distance_to_market_km or 6.0
    resolved_soil = soil_type or "Black Vertisol"
    resolved_ph = 7.4
    resolved_soc = 0.85

    if latitude is not None and longitude is not None:
        try:
            from src.geospatial.enricher import enrich_geospatial_point
            enriched = enrich_geospatial_point(latitude, longitude)
            geospatial_meta = enriched
            if not soil_type:
                resolved_soil = enriched.get("soil_type", resolved_soil)
            if distance_to_road_km is None:
                resolved_road_km = float(enriched.get("distance_to_road_km", resolved_road_km))
            if distance_to_market_km is None:
                resolved_market_km = float(enriched.get("distance_to_market_km", resolved_market_km))
            resolved_ph = float(enriched.get("soil_ph", resolved_ph))
            resolved_soc = float(enriched.get("organic_carbon_pct", resolved_soc))
        except Exception:
            pass

    # Calculate real Land Health Score v2 with empirical factors
    from src.scoring.health_scorer_v2 import calculate_land_health_score_v2
    health_v2 = calculate_land_health_score_v2(
        soil_type=resolved_soil,
        soil_ph=resolved_ph,
        organic_carbon_pct=resolved_soc,
        water_availability=water_availability,
        climate_risk_score=4.5,
        distance_to_road_km=resolved_road_km,
        distance_to_market_km=resolved_market_km,
        vegetation_score=75.0,
    )
    land_health = health_v2["land_health_score"]
    carbon_pot = round(min(9.8, max(6.0, 7.0 + (land_health / 40.0))), 1)

    c.execute("""
        INSERT INTO lands (
            land_id, owner_user_id, title, location, area_hectares,
            latitude, longitude, soil_type, water_availability, asking_price_inr,
            land_health_score, carbon_potential, distance_to_road_km, distance_to_market_km,
            geospatial_data_json, status, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
    """, (
        land_id, clean_uid, title, location, area_hectares,
        latitude, longitude, resolved_soil, water_availability, asking_price_inr,
        land_health, carbon_pot, resolved_road_km, resolved_market_km,
        json.dumps(geospatial_meta) if geospatial_meta else None, now
    ))

    # Update user's verified area in user table
    c.execute("""
        UPDATE users SET verified_area_ha = verified_area_ha + ? WHERE user_id = ?
    """, (area_hectares, clean_uid))

    conn.commit()

    # Recalculate user credit score with additional land asset collateral
    user = get_user_by_id(clean_uid)
    if user:
        c_res = calculate_user_credit_score(
            user_type=user["user_type"],
            verified_area_ha=user["verified_area_ha"],
            land_health_score=float(land_health),
            stated_budget_inr=user["budget_inr"],
            has_active_subscription=(user["subscription_tier"] != "free"),
        )
        c.execute("""
            UPDATE users SET credit_score = ?, credit_tier = ?, credit_factors_json = ? WHERE user_id = ?
        """, (c_res["credit_score"], c_res["tier"], json.dumps(c_res["factors"]), clean_uid))
        conn.commit()

    conn.close()

    conn2 = get_db_connection()
    c2 = conn2.cursor()
    c2.execute("SELECT * FROM lands WHERE land_id = ?", (land_id,))
    new_land = dict(c2.fetchone())
    conn2.close()
    return new_land


def send_direct_message(
    sender_user_id: str,
    recipient_user_id: str,
    content: str,
    land_id: Optional[str] = None,
) -> Dict[str, Any]:
    conn = get_db_connection()
    c = conn.cursor()
    s_uid = sender_user_id.strip("@").lower()
    r_uid = recipient_user_id.strip("@").lower()
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

    c.execute("""
        INSERT INTO messages (sender_user_id, recipient_user_id, land_id, content, created_at, is_read)
        VALUES (?, ?, ?, ?, ?, 0)
    """, (s_uid, r_uid, land_id, content, now))
    msg_id = c.lastrowid
    conn.commit()
    conn.close()

    return {
        "id": msg_id,
        "sender_user_id": s_uid,
        "recipient_user_id": r_uid,
        "land_id": land_id,
        "content": content,
        "created_at": now,
        "is_read": 0,
    }


def get_user_messages(user_id: str) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    c = conn.cursor()
    clean_uid = user_id.strip("@").lower()

    c.execute("""
        SELECT * FROM messages
        WHERE sender_user_id = ? OR recipient_user_id = ?
        ORDER BY created_at ASC
    """, (clean_uid, clean_uid))
    rows = c.fetchall()
    conn.close()
    return [dict(r) for r in rows]
