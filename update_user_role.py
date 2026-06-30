import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "backend", "sql_app.db")

if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # First, list all users to confirm
    cursor.execute("SELECT id, email, full_name, role FROM users;")
    users = cursor.fetchall()
    print("Current users:")
    for user in users:
        print(f"  ID: {user[0]}, Email: {user[1]}, Name: {user[2]}, Role: {user[3]}")
    
    # Now update the user
    print("\nUpdating role for baccarahmed07@gmail.com to 'admin'...")
    cursor.execute("UPDATE users SET role = 'admin' WHERE email = 'baccarahmed07@gmail.com';")
    conn.commit()
    print(f"Updated {cursor.rowcount} row(s)")
    
    # Verify the update
    cursor.execute("SELECT id, email, full_name, role FROM users WHERE email = 'baccarahmed07@gmail.com';")
    user = cursor.fetchone()
    if user:
        print(f"User now: ID: {user[0]}, Email: {user[1]}, Name: {user[2]}, Role: {user[3]}")
    
    conn.close()
    print("\nDone!")
