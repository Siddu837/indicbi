import sqlite3
import random
from datetime import datetime, timedelta

def init_and_seed_database(db_path="indicbi.db"):
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # Drop existing tables
    cur.executescript("""
    DROP TABLE IF EXISTS returns;
    DROP TABLE IF EXISTS orders;
    DROP TABLE IF EXISTS products;
    DROP TABLE IF EXISTS visits;
    DROP TABLE IF EXISTS sales_reps;

    CREATE TABLE products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        stock INTEGER NOT NULL
    );

    CREATE TABLE orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT NOT NULL,
        product_id INTEGER REFERENCES products(id),
        quantity INTEGER NOT NULL,
        amount REAL NOT NULL,
        order_date DATE NOT NULL,
        status TEXT NOT NULL,
        state TEXT NOT NULL,
        city TEXT NOT NULL
    );

    CREATE TABLE returns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER REFERENCES orders(id),
        reason TEXT NOT NULL,
        refund_amount REAL NOT NULL,
        return_date DATE NOT NULL
    );

    CREATE TABLE sales_reps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        region TEXT NOT NULL,
        target_amount REAL NOT NULL
    );

    CREATE TABLE visits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rep_name TEXT DEFAULT 'Gopi',
        client_name TEXT NOT NULL,
        action TEXT NOT NULL,
        amount REAL DEFAULT 0,
        status TEXT NOT NULL,
        notes TEXT,
        follow_up_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 1. Seed Products (Indian Commerce categories)
    products_data = [
        ("Tata Salt 1kg", "FMCG", 28.0, 1200),
        ("Parle-G Gold Biscuit", "FMCG", 35.0, 1500),
        ("Aashirvaad Atta 5kg", "FMCG", 245.0, 800),
        ("Fortune Mustard Oil 1L", "FMCG", 155.0, 600),
        ("Surf Excel Quick Wash 1kg", "FMCG", 140.0, 950),
        ("Dolo 650 Strip", "Pharma", 32.0, 2500),
        ("Azithral 500mg Strip", "Pharma", 125.0, 1100),
        ("Pan-D Capsule Strip", "Pharma", 195.0, 900),
        ("Becosules Z Capsules", "Pharma", 45.0, 1800),
        ("Surat Cotton Sarees (Pack of 5)", "Textiles", 2500.0, 300),
        ("Ahmedabad Linen Fabric Roll", "Textiles", 4200.0, 150),
        ("Kanchipuram Silk Saree", "Textiles", 8500.0, 90),
        ("Ludhiana Woolen Shawl", "Textiles", 1100.0, 400),
        ("boAt Airdopes 141", "Electronics", 1299.0, 750),
        ("Samsung Galaxy M15 5G", "Electronics", 13499.0, 220),
        ("Mi Power Bank 20000mAh", "Electronics", 1899.0, 450),
        ("Prestige Induction Cooktop", "Electronics", 2650.0, 310),
    ]

    cur.executemany("INSERT INTO products (name, category, price, stock) VALUES (?, ?, ?, ?)", products_data)

    # 2. Seed Sales Reps
    reps_data = [
        ("Ramesh Kumar", "North (UP & Delhi)", 500000.0),
        ("Suresh Reddy", "South (Telangana & AP)", 600000.0),
        ("Kavitha Murugan", "South (Tamil Nadu)", 550000.0),
        ("Jignesh Patel", "West (Gujarat)", 700000.0),
        ("Amitabh Sen", "East (West Bengal)", 450000.0)
    ]
    cur.executemany("INSERT INTO sales_reps (name, region, target_amount) VALUES (?, ?, ?)", reps_data)

    # 3. Seed Realistic Orders (500+ records)
    customers = [
        "Sharma Kirana Store", "Gupta Provision Store", "Sri Krishna Medicals",
        "Balaji Traders", "Raju Supermarket", "Mehta General Store",
        "Reddy Pharmacy", "Patel Textiles", "Lakshmi Agencies",
        "Apex Hospital Supply", "Kolkata Wholesale Mart", "Chennai Retailers",
        "Surat Fashion House", "Warangal Medical Hall", "Lucknow Mart"
    ]

    states_cities = [
        ("Telangana", "Hyderabad"), ("Telangana", "Warangal"), ("Telangana", "Karimnagar"),
        ("Uttar Pradesh", "Lucknow"), ("Uttar Pradesh", "Varanasi"), ("Uttar Pradesh", "Kanpur"),
        ("Tamil Nadu", "Chennai"), ("Tamil Nadu", "Coimbatore"), ("Tamil Nadu", "Madurai"),
        ("Gujarat", "Surat"), ("Gujarat", "Ahmedabad"), ("Gujarat", "Vadodara"),
        ("Maharashtra", "Mumbai"), ("Maharashtra", "Pune"), ("Maharashtra", "Nagpur"),
        ("West Bengal", "Kolkata"), ("Karnataka", "Bangalore")
    ]

    base_date = datetime.now() - timedelta(days=120)
    orders = []

    for i in range(550):
        cust = random.choice(customers)
        prod_id = random.randint(1, len(products_data))
        unit_price = products_data[prod_id - 1][2]
        
        # High volume for FMCG/Pharma, lower for high value electronics
        if unit_price > 5000:
            qty = random.randint(1, 5)
        elif unit_price > 1000:
            qty = random.randint(2, 15)
        else:
            qty = random.randint(10, 80)
            
        amount = round(qty * unit_price, 2)
        days_offset = random.randint(0, 120)
        order_date = (base_date + timedelta(days=days_offset)).strftime("%Y-%m-%d")
        
        state, city = random.choice(states_cities)
        status = random.choices(["delivered", "shipped", "returned"], weights=[85, 10, 5])[0]
        
        orders.append((cust, prod_id, qty, amount, order_date, status, state, city))

    cur.executemany("""
    INSERT INTO orders (customer_name, product_id, quantity, amount, order_date, status, state, city)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, orders)

    # 4. Seed Returns
    cur.execute("SELECT id, amount, order_date FROM orders WHERE status = 'returned'")
    returned_orders = cur.fetchall()
    reasons = ["Defective Item", "Size Mismatch", "Packaging Damaged", "Delayed Delivery", "Incorrect Quantity"]
    returns_data = []
    for r_id, r_amt, r_date in returned_orders:
        reason = random.choice(reasons)
        returns_data.append((r_id, reason, r_amt, r_date))

    cur.executemany("INSERT INTO returns (order_id, reason, refund_amount, return_date) VALUES (?, ?, ?, ?)", returns_data)

    # 5. Seed Initial CRM Visits
    visits_data = [
        ("Gopi", "Sri Krishna Medicals", "order_placed", 14500.0, "completed", "50 strips Dolo + 20 strips Pan-D", "2026-10-05", "2026-10-01 09:30:00"),
        ("Gopi", "Sharma Kirana Store", "payment_collected", 4500.0, "completed", "Previous invoice cleared via Cheque", None, "2026-10-01 11:15:00"),
        ("Gopi", "Patel Textiles", "follow_up", 0.0, "pending", "Linen fabric sample shown; decision next Monday", "2026-10-06", "2026-10-01 13:45:00"),
        ("Gopi", "Reddy Pharmacy", "order_placed", 8900.0, "completed", "Urgent stock required by Friday", "2026-10-03", "2026-10-01 15:20:00")
    ]
    cur.executemany("""
    INSERT INTO visits (rep_name, client_name, action, amount, status, notes, follow_up_date, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, visits_data)

    conn.commit()
    conn.close()
    print(f"Database successfully created & seeded at: {db_path} (550+ Orders, 17 Products, 4 Seeded Visits)")

if __name__ == "__main__":
    init_and_seed_database()
