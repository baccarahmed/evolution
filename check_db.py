
import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "backend", "sql_app.db")

if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("=== TABLES IN DATABASE ===")
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    
    for table_name in tables:
        table_name = table_name[0]
        print(f"\n--- {table_name} ---")
        
        # Show columns
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = cursor.fetchall()
        print("Columns:")
        for col in columns:
            print(f"  - {col[1]} ({col[2]})")
        
        # Show row count
        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        count = cursor.fetchone()[0]
        print(f"Total rows: {count}")
        
        # Show some sample data for course tables
        if table_name in ['course_modules', 'course_lessons', 'formations'] and count > 0:
            cursor.execute(f"SELECT * FROM {table_name} LIMIT 10")
            rows = cursor.fetchall()
            print(f"Sample data (first {min(10, count)} rows):")
            for row in rows:
                print(f"  {row}")
    
    conn.close()
