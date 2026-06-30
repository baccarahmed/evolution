
import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "backend", "sql_app.db")

if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("=== Course Lessons ===")
    cursor.execute("SELECT id, title, video_url, pdf_url FROM course_lessons")
    lessons = cursor.fetchall()
    for lesson in lessons:
        print(f"ID: {lesson[0]}")
        print(f"Title: {lesson[1]}")
        print(f"Video URL: {lesson[2]}")
        print(f"PDF URL: {lesson[3]}")
        print("---")
    
    conn.close()
