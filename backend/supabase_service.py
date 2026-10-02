import os
import sqlite3
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

# Load backend .env
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip()
SUPABASE_KEY = os.getenv("SUPABASE_KEY", os.getenv("SUPABASE_ANON_KEY", "")).strip()

DB_PATH = os.path.join(os.path.dirname(__file__), "indicbi.db")

supabase_client = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        from supabase import create_client, Client
        supabase_client: Optional[Client] = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("[Supabase] Successfully initialized Supabase Cloud Client!")
    except Exception as e:
        print(f"[Supabase] Init warning: {e}")
        supabase_client = None
else:
    print("[Supabase] SUPABASE_URL / SUPABASE_KEY not detected in .env. Running in SQLite local mode with automatic Supabase readiness.")

def init_guest_db():
    """Ensure local SQLite has the guest_activities table ready."""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("""
    CREATE TABLE IF NOT EXISTS guest_activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guest_id TEXT NOT NULL,
        client_name TEXT NOT NULL,
        action TEXT DEFAULT 'order',
        amount REAL DEFAULT 0.0,
        status TEXT DEFAULT 'completed',
        notes TEXT,
        follow_up_date TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)
    conn.commit()
    conn.close()

# Auto-initialize table on import
init_guest_db()

class GuestStorageService:
    @staticmethod
    def get_status() -> Dict[str, Any]:
        global supabase_client
        return {
            "supabase_connected": supabase_client is not None,
            "supabase_url": SUPABASE_URL if SUPABASE_URL else None,
            "storage_mode": "supabase_cloud" if supabase_client else "local_sqlite",
            "table": "guest_activities",
            "schema_sql": """
CREATE TABLE IF NOT EXISTS guest_activities (
  id BIGSERIAL PRIMARY KEY,
  guest_id TEXT NOT NULL,
  client_name TEXT NOT NULL,
  action TEXT DEFAULT 'order',
  amount NUMERIC DEFAULT 0.0,
  status TEXT DEFAULT 'completed',
  notes TEXT,
  follow_up_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS & permit anonymous read/write operations
ALTER TABLE guest_activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all on guest_activities" ON guest_activities;
CREATE POLICY "Allow anon all on guest_activities"
ON guest_activities FOR ALL TO anon
USING (true)
WITH CHECK (true);
            """.strip()
        }

    @staticmethod
    def set_supabase_config(url: str, key: str) -> Dict[str, Any]:
        global supabase_client, SUPABASE_URL, SUPABASE_KEY
        try:
            from supabase import create_client
            test_client = create_client(url.strip(), key.strip())
            
            # Verify table accessibility
            try:
                test_client.table("guest_activities").select("id").limit(1).execute()
            except Exception as tbl_err:
                return {
                    "success": False,
                    "error": f"Connected to Supabase, but table 'guest_activities' was not found! Please create it in your Supabase SQL Editor using the provided schema snippet. Error: {str(tbl_err)}"
                }

            supabase_client = test_client
            SUPABASE_URL = url.strip()
            SUPABASE_KEY = key.strip()

            # Sync all local SQLite records to Supabase
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            cur = conn.cursor()
            cur.execute("SELECT guest_id, client_name, action, amount, status, notes, follow_up_date FROM guest_activities")
            local_records = [dict(r) for r in cur.fetchall()]
            conn.close()

            synced_count = 0
            for r in local_records:
                try:
                    test_client.table("guest_activities").insert(r).execute()
                    synced_count += 1
                except Exception as sync_e:
                    print(f"[Supabase sync skip]: {sync_e}")

            # Persist to backend .env
            env_path = os.path.join(os.path.dirname(__file__), ".env")
            lines = []
            if os.path.exists(env_path):
                with open(env_path, "r", encoding="utf-8") as f:
                    lines = [l for l in f.readlines() if not l.startswith("SUPABASE_")]
            lines.append(f"SUPABASE_URL={SUPABASE_URL}\n")
            lines.append(f"SUPABASE_KEY={SUPABASE_KEY}\n")
            with open(env_path, "w", encoding="utf-8") as f:
                f.writelines(lines)

            return {
                "success": True,
                "synced_count": synced_count,
                "message": f"Connected to Supabase Cloud! Successfully synced {synced_count} local records to your cloud database."
            }
        except Exception as e:
            return {"success": False, "error": f"Supabase connection test failed: {str(e)}"}

    @staticmethod
    def insert_activity(
        guest_id: str,
        client_name: str,
        action: str,
        amount: float,
        status: str = "completed",
        notes: str = None,
        follow_up_date: str = None
    ) -> Dict[str, Any]:
        """Saves guest activity to Supabase (if connected) and local SQLite."""
        # 1. Always record in local SQLite for resilience & offline speed
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute("""
        INSERT INTO guest_activities (guest_id, client_name, action, amount, status, notes, follow_up_date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (guest_id, client_name, action, amount, status, notes, follow_up_date))
        conn.commit()
        local_id = cur.lastrowid
        conn.close()

        # 2. Sync to Supabase Cloud if available
        supabase_id = None
        if supabase_client:
            try:
                data = {
                    "guest_id": guest_id,
                    "client_name": client_name,
                    "action": action,
                    "amount": amount,
                    "status": status,
                    "notes": notes,
                    "follow_up_date": follow_up_date
                }
                res = supabase_client.table("guest_activities").insert(data).execute()
                if res.data:
                    supabase_id = res.data[0].get("id")
            except Exception as e:
                print(f"[Supabase Cloud Sync Warning] {e}")

        return {
            "success": True,
            "id": local_id,
            "supabase_id": supabase_id,
            "guest_id": guest_id,
            "synced_to_supabase": supabase_id is not None
        }

    @staticmethod
    def get_activities(guest_id: str) -> List[Dict[str, Any]]:
        """Fetches all past records for a specific guest ID."""
        # If Supabase is active, attempt to fetch latest from cloud
        if supabase_client:
            try:
                res = supabase_client.table("guest_activities")\
                    .select("*")\
                    .eq("guest_id", guest_id)\
                    .order("created_at", desc=True)\
                    .execute()
                if res.data and len(res.data) > 0:
                    return res.data
            except Exception as e:
                print(f"[Supabase Fetch Warning] {e}, falling back to local SQLite")

        # Fallback to local SQLite
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute("""
        SELECT id, guest_id, client_name, action, amount, status, notes, follow_up_date, created_at
        FROM guest_activities
        WHERE guest_id = ?
        ORDER BY id DESC
        """, (guest_id,))
        rows = [dict(r) for r in cur.fetchall()]
        conn.close()
        return rows

    @staticmethod
    def delete_activity(guest_id: str, activity_id: int) -> bool:
        """Deletes a guest activity."""
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute("DELETE FROM guest_activities WHERE guest_id = ? AND id = ?", (guest_id, activity_id))
        conn.commit()
        conn.close()

        if supabase_client:
            try:
                supabase_client.table("guest_activities").delete().eq("guest_id", guest_id).eq("id", activity_id).execute()
            except Exception as e:
                print(f"[Supabase Delete Warning] {e}")

        return True
