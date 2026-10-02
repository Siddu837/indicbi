import sqlite3
import re
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "indicbi.db")

class SafeDatabase:
    BLOCKED_PATTERNS = [
        r'\bDROP\b', r'\bDELETE\b', r'\bUPDATE\b', r'\bINSERT\b',
        r'\bALTER\b', r'\bTRUNCATE\b', r'\bEXEC\b', r'\bATTACH\b',
        r'\bDETACH\b', r'--', r';--'
    ]

    @staticmethod
    def get_connection():
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn

    @classmethod
    def execute_read_query(cls, sql: str) -> dict:
        """
        Executes strictly read-only SELECT queries with AST guardrail.
        """
        clean_sql = sql.strip().rstrip(';')
        sql_upper = clean_sql.upper()

        if not sql_upper.startswith("SELECT"):
            return {
                "success": False,
                "error": "Security Alert: Only SELECT queries are permitted in BI Mode.",
                "rows": [],
                "columns": []
            }

        for pattern in cls.BLOCKED_PATTERNS:
            if re.search(pattern, sql_upper):
                return {
                    "success": False,
                    "error": f"Security Alert: Destructive query detected and blocked ({pattern}).",
                    "rows": [],
                    "columns": []
                }

        try:
            conn = cls.get_connection()
            cur = conn.cursor()
            cur.execute(clean_sql)
            results = cur.fetchall()
            columns = [col[0] for col in cur.description] if cur.description else []
            rows = [dict(r) for r in results]
            conn.close()
            return {
                "success": True,
                "rows": rows,
                "columns": columns,
                "row_count": len(rows),
                "error": None
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Database Execution Error: {str(e)}",
                "rows": [],
                "columns": []
            }

    @classmethod
    def insert_visit(cls, client_name: str, action: str, amount: float = 0.0, status: str = "completed", notes: str = None, follow_up_date: str = None, rep_name: str = "Gopi") -> dict:
        """
        Inserts structured CRM visit log.
        """
        try:
            conn = cls.get_connection()
            cur = conn.cursor()
            cur.execute("""
            INSERT INTO visits (rep_name, client_name, action, amount, status, notes, follow_up_date)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (rep_name, client_name, action, amount, status, notes, follow_up_date))
            conn.commit()
            new_id = cur.lastrowid
            conn.close()
            return {"success": True, "id": new_id}
        except Exception as e:
            return {"success": False, "error": str(e)}

    @classmethod
    def get_recent_visits(cls, limit: int = 10) -> list:
        conn = cls.get_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM visits ORDER BY id DESC LIMIT ?", (limit,))
        rows = [dict(r) for r in cur.fetchall()]
        conn.close()
        return rows

    @classmethod
    def get_dashboard_summary(cls) -> dict:
        conn = cls.get_connection()
        cur = conn.cursor()
        
        cur.execute("SELECT COUNT(*), SUM(amount) FROM orders WHERE status != 'returned'")
        total_orders, total_sales = cur.fetchone()
        
        cur.execute("SELECT COUNT(*) FROM visits")
        total_visits = cur.fetchone()[0]

        cur.execute("""
        SELECT p.name, SUM(o.quantity) as total_qty, SUM(o.amount) as total_revenue
        FROM orders o
        JOIN products p ON o.product_id = p.id
        WHERE o.status != 'returned'
        GROUP BY p.id
        ORDER BY total_revenue DESC
        LIMIT 5
        """)
        top_products = [dict(r) for r in cur.fetchall()]

        cur.execute("""
        SELECT state, SUM(amount) as sales
        FROM orders
        WHERE status != 'returned'
        GROUP BY state
        ORDER BY sales DESC
        """)
        state_sales = [dict(r) for r in cur.fetchall()]

        conn.close()
        return {
            "total_sales": total_sales or 0,
            "total_orders": total_orders or 0,
            "total_visits": total_visits or 0,
            "top_products": top_products,
            "state_sales": state_sales
        }
