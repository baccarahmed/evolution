
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
from sqlalchemy import inspect, text
from database import engine, SessionLocal

def table_exists(table_name):
    inspector = inspect(engine)
    return table_name in inspector.get_table_names()

def add_certificates_table():
    db = SessionLocal()
    try:
        if not table_exists("certificates"):
            db.execute(text("""
                CREATE TABLE certificates (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    formation_id INTEGER NOT NULL,
                    certificate_number TEXT UNIQUE NOT NULL,
                    issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(user_id) REFERENCES users(id),
                    FOREIGN KEY(formation_id) REFERENCES formations(id)
                )
            """))
            print("Created certificates table")
        else:
            print("certificates table already exists")
        db.commit()
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    add_certificates_table()
