
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
from database import SessionLocal, engine
from sqlalchemy import text, inspect  # Import inspect here

def migrate():
    db = SessionLocal()
    try:
        # Check if columns exist on users table
        inspector = inspect(engine)
        columns = [col['name'] for col in inspector.get_columns('users')]
        
        # Add missing columns to users table
        if 'total_points' not in columns:
            db.execute(text("ALTER TABLE users ADD COLUMN total_points INTEGER DEFAULT 0"))
            print("Added total_points to users")
        
        if 'current_streak' not in columns:
            db.execute(text("ALTER TABLE users ADD COLUMN current_streak INTEGER DEFAULT 0"))
            print("Added current_streak to users")
        
        if 'max_streak' not in columns:
            db.execute(text("ALTER TABLE users ADD COLUMN max_streak INTEGER DEFAULT 0"))
            print("Added max_streak to users")
        
        if 'last_activity_date' not in columns:
            db.execute(text("ALTER TABLE users ADD COLUMN last_activity_date DATE"))
            print("Added last_activity_date to users")
        
        # Check user_lesson_progress table
        ulp_columns = [col['name'] for col in inspector.get_columns('user_lesson_progress')]
        
        if 'points_earned' not in ulp_columns:
            db.execute(text("ALTER TABLE user_lesson_progress ADD COLUMN points_earned INTEGER DEFAULT 0"))
            print("Added points_earned to user_lesson_progress")
        
        # Fix user_daily_activity date column (change from DateTime to Date)
        uda_columns = inspector.get_columns('user_daily_activity')
        date_col = next(col for col in uda_columns if col['name'] == 'date')
        if str(date_col['type']).startswith('DATETIME'):
            print("Fixing user_daily_activity date column...")
            # SQLite doesn't have ALTER COLUMN, so we'll recreate the table
            db.execute(text("""
                CREATE TABLE user_daily_activity_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    date DATE,
                    points_earned INTEGER DEFAULT 0,
                    lessons_completed INTEGER DEFAULT 0,
                    time_spent_minutes INTEGER DEFAULT 0,
                    FOREIGN KEY (user_id) REFERENCES users(id),
                    UNIQUE(user_id, date)
                )
            """))
            db.execute(text("INSERT INTO user_daily_activity_new SELECT id, user_id, DATE(date), points_earned, lessons_completed, time_spent_minutes FROM user_daily_activity"))
            db.execute(text("DROP TABLE user_daily_activity"))
            db.execute(text("ALTER TABLE user_daily_activity_new RENAME TO user_daily_activity"))
            print("Fixed user_daily_activity date column")
        
        db.commit()
        print("Migration complete!")
        
    except Exception as e:
        print(f"Error migrating: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
