import os
import shutil
from datetime import datetime, timedelta
from typing import Annotated, List, Optional

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, HTTPException, Request, UploadFile, status

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import func, text

import auth
import database
import models
import schemas
import email_service
from payments.router import router as payment_router
from auth import ACCESS_TOKEN_EXPIRE_MINUTES

UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

app = FastAPI(title="Trading Master API")

# Add CORS middleware FIRST, before any routes
origins = [
    FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]
print(f"DEBUG main.py: CORS origins configured: {origins}")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    print(f"DEBUG main.py: Middleware processing request for path: {request.url.path}")
    try:
        response = await call_next(request)
        print(f"DEBUG main.py: Middleware processed response with status: {response.status_code}")
    except Exception as e:
        print(f"DEBUG main.py: Middleware caught exception: {type(e).__name__}: {e}")
        from fastapi.responses import JSONResponse
        import traceback
        traceback.print_exc()
        # Return error response with CORS headers
        status_code = 500
        detail = "Internal server error"
        if hasattr(e, 'status_code'):
            status_code = e.status_code
        if hasattr(e, 'detail'):
            detail = e.detail
        response = JSONResponse(
            status_code=status_code,
            content={"detail": detail}
        )
    # Ensure CORS headers are present on all responses, including errors
    origin = request.headers.get("origin")
    if origin and origin in origins:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS,PATCH"
        response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Cross-Origin-Resource-Policy"] = "cross-origin"
    return response

# Now add routes and static files
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
app.include_router(payment_router, prefix="/api")

# Levels hierarchy for access control
LEVEL_HIERARCHY = {
    "debutant": 0,
    "intermediaire": 1,
    "avance": 2
}

def check_formation_access(user: models.User, formation: models.Formation, db: Session) -> bool:
    """
    Check if a user has access to a formation based on:
    1. Admin role
    2. Manual access grant
    3. Active subscription AND User level >= Formation level
    """
    if user.role == "admin":
        return True
    
    # Check manual access
    manual_access = db.query(models.UserFormationAccess).filter(
        models.UserFormationAccess.user_id == user.id,
        models.UserFormationAccess.formation_id == formation.id
    ).first()
    if manual_access:
        return True
    
    # Check for active subscription
    active_subscription = db.query(models.Subscription).filter(
        models.Subscription.user_id == user.id,
        models.Subscription.is_active == True
    ).first()
    if not active_subscription:
        return False
    
    # Check level-based access
    user_level_score = LEVEL_HIERARCHY.get(user.level, 0)
    formation_level_score = LEVEL_HIERARCHY.get(formation.level, 0)
    
    return user_level_score >= formation_level_score


def ensure_table_column(db: Session, table_name: str, column_name: str, column_sql: str):
    columns = db.execute(text(f"PRAGMA table_info({table_name})")).fetchall()
    existing_columns = {column[1] for column in columns}
    if column_name not in existing_columns:
        try:
            db.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_sql}"))
            db.commit()
        except Exception as e:
            # If ALTER TABLE fails (like with DEFAULT CURRENT_TIMESTAMP), rebuild the table!
            existing_col_names = [col[1] for col in columns]
            existing_col_defs = []
            for col in columns:
                col_def = f"{col[1]} {col[2]}"
                if col[3]:  # not null
                    col_def += " NOT NULL"
                if col[4] is not None:  # default
                    col_def += f" DEFAULT {col[4]}"
                if col[5]:  # primary key
                    col_def += " PRIMARY KEY"
                existing_col_defs.append(col_def)
            all_col_defs = existing_col_defs + [f"{column_name} {column_sql}"]
            new_table_name = f"{table_name}_new"
            db.execute(text(f"CREATE TABLE {new_table_name} ({', '.join(all_col_defs)})"))
            db.execute(text(f"INSERT INTO {new_table_name} ({', '.join(existing_col_names)}) SELECT {', '.join(existing_col_names)} FROM {table_name}"))
            db.execute(text(f"DROP TABLE {table_name}"))
            db.execute(text(f"ALTER TABLE {new_table_name} RENAME TO {table_name}"))
            db.commit()

@app.get("/api/health")
def health_check():
    return {"status": "ok"}


def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.post("/admin/users/{user_id}/grant-access/{formation_id}", tags=["Admin"])
def admin_grant_formation_access(
    user_id: int,
    formation_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin_user),
):
    user = get_user_or_404(db, user_id)
    formation = get_formation_or_404(db, formation_id)
    
    existing_access = db.query(models.UserFormationAccess).filter(
        models.UserFormationAccess.user_id == user.id,
        models.UserFormationAccess.formation_id == formation.id
    ).first()
    
    if existing_access:
        return {"message": "Access already granted"}
    
    db_access = models.UserFormationAccess(
        user_id=user.id,
        formation_id=formation.id,
        granted_by_admin_email=admin_user.email
    )
    db.add(db_access)
    log_admin_action(db, admin_user.email, "grant_access", f"Granted user #{user.id} access to formation #{formation.id}")
    db.commit()
    return {"message": f"Access granted to {formation.title} for {user.email}"}


@app.delete("/admin/users/{user_id}/revoke-access/{formation_id}", tags=["Admin"])
def admin_revoke_formation_access(
    user_id: int,
    formation_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin_user),
):
    user = get_user_or_404(db, user_id)
    formation = get_formation_or_404(db, formation_id)
    
    db.query(models.UserFormationAccess).filter(
        models.UserFormationAccess.user_id == user.id,
        models.UserFormationAccess.formation_id == formation.id
    ).delete()
    
    log_admin_action(db, admin_user.email, "revoke_access", f"Revoked user #{user.id} access to formation #{formation.id}")
    db.commit()
    return {"message": f"Access revoked for {formation.title} for {user.email}"}


@app.on_event("startup")
def startup_event():
    models.Base.metadata.create_all(bind=database.engine)
    # Fix database URLs if they have wrong port
    db = database.SessionLocal()
    try:
        from datetime import datetime
        ensure_table_column(db, "certificates", "certificate_type", "VARCHAR DEFAULT 'completion'")
        ensure_table_column(db, "certificates", "custom_title", "VARCHAR")
        ensure_table_column(db, "certificates", "custom_message", "VARCHAR")
        ensure_table_column(db, "certificates", "issuer_name", "VARCHAR")
        ensure_table_column(db, "certificates", "issued_by_admin_email", "VARCHAR")
        ensure_table_column(db, "users", "created_at", "DATETIME DEFAULT CURRENT_TIMESTAMP")
        # Correct formations
        db.execute(text("UPDATE formations SET image_url = REPLACE(image_url, '8001', '8000')"))
        # Correct spotlights
        db.execute(text("UPDATE spotlights SET image_url = REPLACE(image_url, '8001', '8000')"))
        db.commit()
        
        # Ensure admin user is admin
        admin_user = db.query(models.User).filter(models.User.email == 'baccarahmed07@gmail.com').first()
        if admin_user:
            if admin_user.role != 'admin':
                admin_user.role = 'admin'
                db.commit()
                print(f"Set {admin_user.email} role to admin!")
        
        # Add sample course content if no modules exist
        modules_count = db.query(models.CourseModule).count()
        if modules_count == 0:
            print("No course modules found. Adding sample course content...")
            
            # Get first two formations
            formations = db.query(models.Formation).limit(2).all()
            
            if len(formations) > 0:
                # Add modules for first formation
                modules1 = [
                    models.CourseModule(
                        formation_id=formations[0].id,
                        title='Introduction au Trading',
                        description='Les fondamentaux du trading et des marchés financiers',
                        order=1
                    ),
                    models.CourseModule(
                        formation_id=formations[0].id,
                        title='Les Bougies Japonaises',
                        description='Maîtrisez l\'analyse des chandeliers japonais',
                        order=2
                    )
                ]
                db.add_all(modules1)
                db.commit()
                
                # Add lessons
                lessons1 = [
                    models.CourseLesson(
                        module_id=modules1[0].id,
                        title='Qu\'est-ce que le Trading ?',
                        description='Découvrez les bases du trading et son fonctionnement',
                        video_url='https://www.w3schools.com/html/mov_bbb.mp4',
                        pdf_url='https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                        duration='15 min',
                        order=1
                    ),
                    models.CourseLesson(
                        module_id=modules1[0].id,
                        title='Les Marchés Financiers',
                        description='Présentation des différents marchés financiers',
                        video_url='https://www.w3schools.com/html/mov_bbb.mp4',
                        duration='20 min',
                        order=2
                    )
                ]
                db.add_all(lessons1)
                db.commit()
                
                if len(formations) > 1:
                    modules2 = [
                        models.CourseModule(
                            formation_id=formations[1].id,
                            title='RSI et Divergences',
                            description='Maîtrisez l\'indicateur RSI et ses divergences',
                            order=1
                        )
                    ]
                    db.add_all(modules2)
                    db.commit()
                    
                    lessons2 = [
                        models.CourseLesson(
                            module_id=modules2[0].id,
                            title='Calcul et Interprétation du RSI',
                            description='Comprendre comment fonctionne le RSI',
                            video_url='https://www.w3schools.com/html/mov_bbb.mp4',
                            pdf_url='https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                            duration='35 min',
                            order=1
                        )
                    ]
                    db.add_all(lessons2)
                    db.commit()
            
            print("Sample course content added!")
        
        # Add sample community posts if no approved posts exist
        approved_posts_count = db.query(models.CommunityPost).filter(models.CommunityPost.is_approved == True).count()
        if approved_posts_count == 0:
            print("No approved community posts found. Adding sample community posts...")
            
            # Get first two users
            users = db.query(models.User).limit(2).all()
            
            if len(users) > 0:
                sample_posts = [
                    models.CommunityPost(
                        user_id=users[0].id,
                        content="Just closed a beautiful long position on EUR/USD! The 1.08 level held perfectly as support. Remember to always wait for confirmation before entering trades! 📈",
                        type="signal",
                        is_approved=True,
                        likes_count=47,
                        comments_count=12,
                        shares_count=5,
                        timestamp=datetime.now() - timedelta(hours=2)
                    ),
                    models.CommunityPost(
                        user_id=users[0].id,
                        content="Hey traders! I'm working on a new strategy combining RSI and Fibonacci retracements. Has anyone tried this combination before? I'd love to hear your experiences! 📊",
                        type="discussion",
                        is_approved=True,
                        likes_count=32,
                        comments_count=8,
                        shares_count=2,
                        timestamp=datetime.now() - timedelta(hours=5)
                    ),
                    models.CommunityPost(
                        user_id=users[1].id if len(users) > 1 else users[0].id,
                        content="Just finished the Risk Management course! Highly recommended for everyone. The section on position sizing changed my trading completely. 💪",
                        type="analysis",
                        is_approved=True,
                        likes_count=89,
                        comments_count=15,
                        shares_count=12,
                        timestamp=datetime.now() - timedelta(days=1)
                    ),
                    models.CommunityPost(
                        user_id=users[0].id,
                        content="Question: What's your favorite time frame for day trading? I'm currently using 15min but thinking of switching to 1h for less noise. Thoughts? 🤔",
                        type="question",
                        is_approved=True,
                        likes_count=28,
                        comments_count=23,
                        shares_count=3,
                        timestamp=datetime.now() - timedelta(days=2)
                    ),
                    models.CommunityPost(
                        user_id=users[1].id if len(users) > 1 else users[0].id,
                        content="Breaking: FED just announced interest rate decision! Be careful with volatility today. Stay hydrated and don't overtrade! 🚨",
                        type="signal",
                        is_approved=True,
                        likes_count=156,
                        comments_count=45,
                        shares_count=34,
                        timestamp=datetime.now() - timedelta(days=3)
                    )
                ]
                db.add_all(sample_posts)
                db.commit()
                
                # Add sample comments
                posts = db.query(models.CommunityPost).filter(models.CommunityPost.is_approved == True).all()
                if len(posts) > 0:
                    sample_comments = [
                        models.Comment(
                            post_id=posts[0].id,
                            user_id=users[1].id if len(users) > 1 else users[0].id,
                            content="Great trade! Congratulations! 🔥",
                            timestamp=datetime.now() - timedelta(hours=1)
                        ),
                        models.Comment(
                            post_id=posts[0].id,
                            user_id=users[0].id,
                            content="Thank you! It was a textbook setup.",
                            timestamp=datetime.now() - timedelta(minutes=30)
                        ),
                        models.Comment(
                            post_id=posts[2].id,
                            user_id=users[0].id,
                            content="Totally agree! The Risk Management course is a game-changer.",
                            timestamp=datetime.now() - timedelta(hours=20)
                        )
                    ]
                    db.add_all(sample_comments)
                    db.commit()
            
            print("Sample community posts added!")
            
    except Exception as e:
        print(f"Database startup failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


def get_user_or_404(db: Session, user_id: int) -> models.User:
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def get_formation_or_404(db: Session, formation_id: int) -> models.Formation:
    formation = db.query(models.Formation).filter(models.Formation.id == formation_id).first()
    if formation is None:
        raise HTTPException(status_code=404, detail="Formation not found")
    return formation


def get_subscription_or_404(db: Session, subscription_id: int) -> models.Subscription:
    subscription = db.query(models.Subscription).filter(models.Subscription.id == subscription_id).first()
    if subscription is None:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return subscription


def get_live_or_404(db: Session, live_id: int) -> models.LiveSession:
    live = db.query(models.LiveSession).filter(models.LiveSession.id == live_id).first()
    if live is None:
        raise HTTPException(status_code=404, detail="Live not found")
    return live


def ensure_email_available(db: Session, email: str, excluded_user_id: Optional[int] = None):
    existing_user = db.query(models.User).filter(models.User.email == email).first()
    if existing_user and existing_user.id != excluded_user_id:
        raise HTTPException(status_code=400, detail="Email already registered")


def ensure_live_payload_valid(
    db: Session,
    google_meet_link: Optional[str],
    formation_id: Optional[int],
    excluded_live_id: Optional[int] = None,
):
    if google_meet_link:
        existing_live = db.query(models.LiveSession).filter(
            models.LiveSession.google_meet_link == google_meet_link
        ).first()
        if existing_live and existing_live.id != excluded_live_id:
            raise HTTPException(status_code=400, detail="Google Meet link already exists")

    if formation_id is not None:
        get_formation_or_404(db, formation_id)


def log_admin_action(db: Session, admin_email: str, action: str, details: str):
    db.add(
        models.AuditLog(
            admin_email=admin_email,
            action=action,
            details=details,
        )
    )

async def create_notification(db: Session, user_id: int, title: str, message: str, type: str = "info"):
    notification = models.Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=type
    )
    db.add(notification)
    db.commit()
    return notification


def build_certificate_response(db: Session, certificate: models.Certificate) -> schemas.Certificate:
    cert_data = schemas.Certificate.model_validate(certificate)
    user = db.query(models.User).filter(models.User.id == certificate.user_id).first()
    formation = db.query(models.Formation).filter(models.Formation.id == certificate.formation_id).first() if certificate.formation_id else None
    if user:
        cert_data.user_name = user.full_name or user.email.split("@")[0]
    if formation:
        cert_data.formation_title = formation.title
    return cert_data

def build_chat_message_response(db: Session, message: models.ChatMessage):
    msg_data = schemas.ChatMessage.model_validate(message)
    sender = db.query(models.User).filter(models.User.id == message.sender_id).first()
    if sender:
        msg_data.sender_name = sender.full_name or sender.email.split('@')[0]
    return msg_data

def build_chat_room_response(db: Session, room: models.ChatRoom):
    room_data = schemas.ChatRoom.model_validate(room)
    creator = db.query(models.User).filter(models.User.id == room.created_by_id).first()
    if creator:
        room_data.created_by_name = creator.full_name or creator.email.split('@')[0]
    room_data.messages = [build_chat_message_response(db, m) for m in room.messages]
    return room_data

def build_private_calendar_event_response(db: Session, event: models.PrivateCalendarEvent):
    event_data = schemas.PrivateCalendarEvent.model_validate(event)
    creator = db.query(models.User).filter(models.User.id == event.created_by_id).first()
    if creator:
        event_data.created_by_name = creator.full_name or creator.email.split('@')[0]
    # Get participants
    participants = db.query(models.PrivateCalendarParticipant).filter(models.PrivateCalendarParticipant.event_id == event.id).all()
    event_data.participants = participants
    return event_data


def get_formation_completion_stats(db: Session, user_id: int, formation_id: int) -> tuple[int, int]:
    modules = db.query(models.CourseModule).filter(
        models.CourseModule.formation_id == formation_id
    ).order_by(models.CourseModule.order).all()

    total_lessons = 0
    completed_lessons = 0

    for module in modules:
        lessons = db.query(models.CourseLesson).filter(
            models.CourseLesson.module_id == module.id
        ).order_by(models.CourseLesson.order).all()

        for lesson in lessons:
            total_lessons += 1
            progress = db.query(models.UserLessonProgress).filter(
                models.UserLessonProgress.user_id == user_id,
                models.UserLessonProgress.lesson_id == lesson.id,
                models.UserLessonProgress.is_completed == True
            ).first()
            if progress:
                completed_lessons += 1

    return total_lessons, completed_lessons


def issue_certificate_record(
    db: Session,
    user: models.User,
    formation: Optional[models.Formation] = None,
    certificate_type: str = "completion",
    custom_title: Optional[str] = None,
    custom_message: Optional[str] = None,
    issuer_name: Optional[str] = None,
    issued_by_admin_email: Optional[str] = None,
) -> tuple[models.Certificate, bool]:
    normalized_type = (certificate_type or "completion").strip().lower()
    if normalized_type not in {"completion", "custom"}:
        raise HTTPException(status_code=400, detail="Invalid certificate type")

    if normalized_type == "completion" and formation is None:
        raise HTTPException(status_code=400, detail="Formation is required for a completion certificate")

    if normalized_type == "completion" and formation is not None:
        existing_cert = db.query(models.Certificate).filter(
            models.Certificate.user_id == user.id,
            models.Certificate.formation_id == formation.id,
            models.Certificate.certificate_type == "completion"
        ).first()
        if existing_cert:
            return existing_cert, False

    certificate = models.Certificate(
        user_id=user.id,
        formation_id=formation.id if formation else None,
        certificate_number=f"CERT-{uuid.uuid4().hex[:8].upper()}",
        certificate_type=normalized_type,
        custom_title=custom_title.strip() if custom_title else None,
        custom_message=custom_message.strip() if custom_message else None,
        issuer_name=(issuer_name or "TradeMaster Academy").strip(),
        issued_by_admin_email=issued_by_admin_email,
    )

    db.add(certificate)
    db.commit()
    db.refresh(certificate)

    if normalized_type == "completion":
        user.formations_completed = (user.formations_completed or 0) + 1
        db.commit()
        db.refresh(user)

    return certificate, True

@app.get("/notifications/", response_model=List[schemas.Notification], tags=["Notifications"])
async def read_notifications(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
    unread_only: bool = False
):
    query = db.query(models.Notification).filter(models.Notification.user_id == current_user.id)
    if unread_only:
        query = query.filter(models.Notification.is_read == False)
    return query.order_by(models.Notification.created_at.desc()).all()

@app.post("/notifications/{notification_id}/read", tags=["Notifications"])
async def mark_notification_read(
    notification_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    notification = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.user_id == current_user.id
    ).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.is_read = True
    db.commit()
    return {"message": "Marked as read"}

@app.post("/lessons/{lesson_id}/progress", tags=["Lessons"])
async def update_lesson_progress(
    lesson_id: int,
    progress_data: dict,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    lesson = db.query(models.CourseLesson).filter(models.CourseLesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
        
    # Get or create progress record
    progress = db.query(models.UserLessonProgress).filter(
        models.UserLessonProgress.user_id == current_user.id,
        models.UserLessonProgress.lesson_id == lesson_id
    ).first()
    
    was_completed_before = progress.is_completed if progress else False
    
    if not progress:
        progress = models.UserLessonProgress(
            user_id=current_user.id,
            lesson_id=lesson_id,
            progress_percent=0,
            time_spent_seconds=0,
            points_earned=0,
            is_completed=False,
        )
        db.add(progress)
        
    # Update progress
    if "progress_percent" in progress_data:
        progress.progress_percent = progress_data["progress_percent"]
    if "time_spent_seconds" in progress_data:
        progress.time_spent_seconds = (progress.time_spent_seconds or 0) + max(int(progress_data["time_spent_seconds"]), 0)
    if "is_completed" in progress_data and progress_data["is_completed"] and not progress.is_completed:
        progress.is_completed = True
        progress.completed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(progress)
    
    # --- Points and Streak Logic ---
    today = datetime.utcnow().date()
    today_start = datetime.combine(today, datetime.min.time())
    
    # Update daily activity
    daily_activity = db.query(models.UserDailyActivity).filter(
        models.UserDailyActivity.user_id == current_user.id,
        func.date(models.UserDailyActivity.date) == today.isoformat()
    ).first()
    
    if not daily_activity:
        daily_activity = models.UserDailyActivity(
            user_id=current_user.id,
            date=today_start,
            points_earned=0,
            lessons_completed=0,
            time_spent_minutes=0,
        )
        db.add(daily_activity)
    
    # Add time spent
    if "time_spent_seconds" in progress_data:
        daily_activity.time_spent_minutes = (daily_activity.time_spent_minutes or 0) + (max(int(progress_data["time_spent_seconds"]), 0) // 60)
    
    # If lesson was just completed, give points
    if not was_completed_before and progress.is_completed:
        # Give points for completing the lesson (10-50 points based on lesson)
        lesson_points = 20  # Base points
        progress.points_earned = lesson_points
        current_user.total_points = (current_user.total_points or 0) + lesson_points
        daily_activity.points_earned = (daily_activity.points_earned or 0) + lesson_points
        daily_activity.lessons_completed = (daily_activity.lessons_completed or 0) + 1
        
        # --- Streak Logic ---
        yesterday = today - timedelta(days=1)
        last_activity_date = current_user.last_activity_date.date() if current_user.last_activity_date else None
        
        if last_activity_date == yesterday:
            # Continue streak
            current_user.current_streak = (current_user.current_streak or 0) + 1
            if current_user.current_streak > (current_user.max_streak or 0):
                current_user.max_streak = current_user.current_streak
            # Bonus points for streak
            streak_bonus = min(current_user.current_streak * 5, 50)  # Max 50 bonus points
            current_user.total_points += streak_bonus
            daily_activity.points_earned += streak_bonus
        elif last_activity_date != today:
            # New streak or reset
            current_user.current_streak = 1
        
        current_user.last_activity_date = today_start
        
        db.commit()

        formation = lesson.module.formation if lesson.module else None
        if formation:
            total_lessons, completed_lessons = get_formation_completion_stats(db, current_user.id, formation.id)
            if total_lessons > 0 and completed_lessons == total_lessons:
                completion_certificate, created = issue_certificate_record(
                    db=db,
                    user=current_user,
                    formation=formation,
                    certificate_type="completion",
                    custom_title=f"Certificat de fin de formation - {formation.title}",
                    custom_message=f"Felicitations ! Vous avez termine avec succes la formation {formation.title}.",
                    issuer_name="TradeMaster Academy",
                )
                if created:
                    await create_notification(
                        db,
                        current_user.id,
                        "Nouveau certificat disponible",
                        f"Votre certificat de fin de formation pour {formation.title} est maintenant disponible.",
                        "success"
                    )
    
    return {
        "progress": progress,
        "points_earned": progress.points_earned if not was_completed_before and progress.is_completed else 0,
        "current_streak": current_user.current_streak,
        "total_points": current_user.total_points,
    }


@app.get("/lessons/{lesson_id}/progress", tags=["Lessons"])
async def get_lesson_progress(
    lesson_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    progress = db.query(models.UserLessonProgress).filter(
        models.UserLessonProgress.user_id == current_user.id,
        models.UserLessonProgress.lesson_id == lesson_id
    ).first()
    
    return progress or {}


@app.post("/notifications/read-all", tags=["Notifications"])
async def mark_all_notifications_read(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id,
        models.Notification.is_read == False
    ).update({models.Notification.is_read: True})
    db.commit()
    return {"message": "All marked as read"}


@app.get("/", tags=["Root"])
async def read_root():
    return {"message": "Welcome to TradeMaster Backend!"}


@app.post("/token", tags=["Auth"])
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Session = Depends(get_db),
):
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/users/", response_model=schemas.User, tags=["Users"])
async def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    ensure_email_available(db, str(user.email))

    db_user = models.User(
        email=str(user.email),
        full_name=user.full_name,
        hashed_password=auth.get_password_hash(user.password),
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Notifications & Emails
    await create_notification(
        db, db_user.id, 
        "Bienvenue !", 
        "Bienvenue sur TradeMaster ! Votre compte a été créé avec succès.",
        "success"
    )
    await email_service.send_welcome_email(db_user.email, db_user.full_name or "Utilisateur")

    return db_user


@app.get("/users/me", response_model=schemas.User, tags=["Users"])
async def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    user_dict = {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "is_active": current_user.is_active,
        "role": current_user.role,
        "level": current_user.level,
        "formations_completed": current_user.formations_completed,
        "lives_attended": current_user.lives_attended,
        "current_streak": current_user.current_streak,
        "total_points": current_user.total_points,
        "accessible_formation_ids": [fa.formation_id for fa in current_user.formation_accesses]
    }
    return user_dict


import uuid

@app.get("/users/me/certificates", response_model=list[schemas.Certificate], tags=["Users"])
def get_my_certificates(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    certificates = db.query(models.Certificate).filter(
        models.Certificate.user_id == current_user.id
    ).order_by(models.Certificate.issued_at.desc()).all()
    return [build_certificate_response(db, cert) for cert in certificates]

@app.get("/users/me/formation-progress", tags=["Users"])
def get_my_formation_progress(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    # Récupérer les formations accessibles par l'utilisateur
    accessible_formations = []
    
    # Récupérer toutes les formations (on filtrera plus tard pour celles accessibles)
    all_formations = db.query(models.Formation).all()
    
    for formation in all_formations:
        # Vérifier si l'utilisateur a accès à cette formation
        has_access = check_formation_access(current_user, formation, db)
        if not has_access:
            continue
            
        # Calculer l'avancement
        # 1. Récupérer tous les modules de la formation
        modules = db.query(models.CourseModule).filter(
            models.CourseModule.formation_id == formation.id
        ).order_by(models.CourseModule.order).all()
        
        total_lessons = 0
        completed_lessons = 0
        total_time_spent = 0
        
        for module in modules:
            # Récupérer les leçons du module
            lessons = db.query(models.CourseLesson).filter(
                models.CourseLesson.module_id == module.id
            ).order_by(models.CourseLesson.order).all()
            
            for lesson in lessons:
                total_lessons += 1
                
                # Vérifier si l'utilisateur a complété cette leçon
                progress = db.query(models.UserLessonProgress).filter(
                    models.UserLessonProgress.user_id == current_user.id,
                    models.UserLessonProgress.lesson_id == lesson.id
                ).first()
                
                if progress and progress.is_completed:
                    completed_lessons += 1
                
                if progress:
                    total_time_spent += progress.time_spent_seconds
        
        # Calculer le pourcentage
        progress_percent = 0
        if total_lessons > 0:
            progress_percent = int((completed_lessons / total_lessons) * 100)
        
        accessible_formations.append({
            "id": formation.id,
            "title": formation.title,
            "description": formation.description,
            "image_url": formation.image_url,
            "total_lessons": total_lessons,
            "completed_lessons": completed_lessons,
            "progress_percent": progress_percent,
            "total_time_spent_seconds": total_time_spent,
            "total_time_spent_minutes": int(total_time_spent / 60)
        })
    
    return accessible_formations

@app.get("/certificates/{certificate_id}", response_model=schemas.Certificate, tags=["Certificates"])
def get_certificate(
    certificate_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(auth.get_optional_current_user),
):
    certificate = db.query(models.Certificate).filter(
        models.Certificate.id == certificate_id
    ).first()
    if not certificate:
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    return build_certificate_response(db, certificate)

@app.post("/admin/certificates", response_model=schemas.Certificate, tags=["Admin"])
def issue_certificate(
    payload: schemas.CertificateIssueRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_admin_user),
):
    user = db.query(models.User).filter(models.User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    formation = None
    if payload.formation_id is not None:
        formation = db.query(models.Formation).filter(models.Formation.id == payload.formation_id).first()
        if not formation:
            raise HTTPException(status_code=404, detail="Formation not found")

    certificate, created = issue_certificate_record(
        db=db,
        user=user,
        formation=formation,
        certificate_type=payload.certificate_type,
        custom_title=payload.custom_title,
        custom_message=payload.custom_message,
        issuer_name=payload.issuer_name,
        issued_by_admin_email=current_user.email,
    )

    if not created and (payload.certificate_type or "completion").strip().lower() == "completion":
        raise HTTPException(status_code=400, detail="Certificate already issued for this formation")

    log_admin_action(
        db,
        current_user.email,
        "issue_certificate",
        f"Issued {certificate.certificate_type} certificate #{certificate.id} to user #{user.id}"
    )
    db.commit()

    return build_certificate_response(db, certificate)


@app.get("/admin/analytics", tags=["Admin"])
def get_admin_analytics(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_admin_user),
):
    # Total users
    total_users = db.query(models.User).count()
    active_users = db.query(models.User).filter(
        models.User.last_activity_date >= (datetime.utcnow().date() - timedelta(days=7))
    ).count()
    
    # Total points
    total_points = db.query(func.sum(models.User.total_points)).scalar() or 0
    
    # Total lessons completed
    total_lessons_completed = db.query(func.sum(models.UserDailyActivity.lessons_completed)).scalar() or 0
    
    # Leaderboard
    leaderboard = db.query(models.User).order_by(
        models.User.total_points.desc()
    ).limit(10).all()
    
    leaderboard_data = [
        {
            "id": user.id,
            "name": user.full_name or user.email.split("@")[0],
            "points": user.total_points,
            "streak": user.current_streak,
            "formations_completed": user.formations_completed
        }
        for user in leaderboard
    ]
    
    # Daily activity for last 7 days (all users)
    daily_activity_all = []
    for i in range(6, -1, -1):
        date = datetime.utcnow().date() - timedelta(days=i)
        activities = db.query(models.UserDailyActivity).filter(
            func.date(models.UserDailyActivity.date) == date.isoformat()
        ).all()
        
        total_points_day = sum(a.points_earned for a in activities)
        total_lessons_day = sum(a.lessons_completed for a in activities)
        total_time_day = sum(a.time_spent_minutes for a in activities)
        
        daily_activity_all.append({
            "date": date.isoformat(),
            "day": date.strftime("%a"),
            "points": total_points_day,
            "lessons_completed": total_lessons_day,
            "time_spent_minutes": total_time_day,
            "active_users": len(activities)
        })
    
    # --- Subscription Analytics ---
    total_subscriptions = db.query(models.Subscription).count()
    active_subscriptions = db.query(models.Subscription).filter(models.Subscription.is_active == True).count()
    
    # Subscriptions per plan
    subscriptions_per_plan = []
    plans = db.query(models.PricingPlan).all()
    for plan in plans:
        count = db.query(models.Subscription).filter(models.Subscription.package_name == plan.name).count()
        subscriptions_per_plan.append({
            "plan": plan.name,
            "count": count
        })
    
    # --- Subscription Growth Over Time ---
    subscription_growth = []
    for i in range(13, -1, -1):
        date = datetime.utcnow().date() - timedelta(days=i)
        next_day = date + timedelta(days=1)
        daily_subs = db.query(models.Subscription).filter(
            func.date(models.Subscription.start_date) >= date.isoformat(),
            func.date(models.Subscription.start_date) < next_day.isoformat()
        ).all()
        
        # Group daily subscriptions by plan
        daily_subs_by_plan = {}
        for sub in daily_subs:
            if sub.package_name not in daily_subs_by_plan:
                daily_subs_by_plan[sub.package_name] = 0
            daily_subs_by_plan[sub.package_name] += 1
        
        subscription_growth.append({
            "date": date.isoformat(),
            "day": date.strftime("%a"),
            "new_subscriptions": len(daily_subs),
            "by_plan": daily_subs_by_plan
        })
    
    # --- Revenue Analytics ---
    total_revenue = 0
    revenue_per_currency = {}
    completed_payments = db.query(models.PaymentOrder).filter(models.PaymentOrder.status == "completed").all()
    for payment in completed_payments:
        if payment.currency not in revenue_per_currency:
            revenue_per_currency[payment.currency] = 0
        revenue_per_currency[payment.currency] += payment.amount
        total_revenue += payment.amount
    
    # --- Formation Analytics ---
    formation_stats = []
    formations = db.query(models.Formation).all()
    for formation in formations:
        # Calculate completion rate
        total_lessons = db.query(func.count(models.CourseLesson.id)).filter(
            models.CourseModule.formation_id == formation.id,
            models.CourseLesson.module_id == models.CourseModule.id
        ).scalar() or 0
        
        completed_lessons = db.query(func.count(models.UserLessonProgress.id)).filter(
            models.CourseModule.formation_id == formation.id,
            models.CourseLesson.module_id == models.CourseModule.id,
            models.UserLessonProgress.lesson_id == models.CourseLesson.id,
            models.UserLessonProgress.is_completed == True
        ).scalar() or 0
        
        # Count users with access (manual grants OR active subscription with sufficient level)
        # 1. Users with manual access
        manual_access_user_ids = db.query(models.UserFormationAccess.user_id).filter(
            models.UserFormationAccess.formation_id == formation.id
        ).all()
        manual_access_user_ids = {uid[0] for uid in manual_access_user_ids}
        
        # 2. Users with active subscription AND level >= formation level
        formation_level_score = LEVEL_HIERARCHY.get(formation.level, 0)
        active_sub_users = db.query(models.User).join(
            models.Subscription, models.User.id == models.Subscription.user_id
        ).filter(
            models.Subscription.is_active == True
        ).all()
        active_sub_access_user_ids = set()
        for user in active_sub_users:
            user_level_score = LEVEL_HIERARCHY.get(user.level, 0)
            if user_level_score >= formation_level_score:
                active_sub_access_user_ids.add(user.id)
        
        # Combine both sets of users
        all_access_user_ids = manual_access_user_ids.union(active_sub_access_user_ids)
        users_with_access = len(all_access_user_ids)
        
        # Total time spent on this formation
        total_time_spent = db.query(func.sum(models.UserLessonProgress.time_spent_seconds)).filter(
            models.CourseModule.formation_id == formation.id,
            models.CourseLesson.module_id == models.CourseModule.id,
            models.UserLessonProgress.lesson_id == models.CourseLesson.id
        ).scalar() or 0
        
        formation_stats.append({
            "id": formation.id,
            "title": formation.title,
            "total_lessons": total_lessons,
            "completed_lessons": completed_lessons,
            "completion_rate": (completed_lessons / total_lessons * 100) if total_lessons > 0 else 0,
            "users_with_access": users_with_access,
            "rating": formation.rating,
            "total_time_spent_minutes": total_time_spent // 60  # Convert seconds to minutes
        })
    
    # --- Most Used Formations (Sorted by usage) ---
    # Sort formations by users with access, then by time spent, then by completed lessons
    most_used_formations = sorted(
        formation_stats,
        key=lambda x: (-x["users_with_access"], -x["total_time_spent_minutes"], -x["completed_lessons"])
    )
    
    # --- Live Session Analytics ---
    total_lives = db.query(models.LiveSession).count()
    active_lives = db.query(models.LiveSession).filter(models.LiveSession.is_active == True, models.LiveSession.is_archived == False).count()
    archived_lives = db.query(models.LiveSession).filter(models.LiveSession.is_archived == True).count()
    
    # --- User Growth Analytics ---
    user_growth = []
    for i in range(13, -1, -1):  # Last 14 days
        date = datetime.utcnow().date() - timedelta(days=i)
        next_day = date + timedelta(days=1)
        count = db.query(func.count(models.User.id)).filter(
            func.date(models.User.created_at) >= date.isoformat(),
            func.date(models.User.created_at) < next_day.isoformat()
        ).scalar() or 0
        user_growth.append({
            "date": date.isoformat(),
            "day": date.strftime("%a"),
            "new_users": count
        })
    
    return {
        "total_users": total_users,
        "active_users_7d": active_users,
        "total_points": total_points,
        "total_lessons_completed": total_lessons_completed,
        "leaderboard": leaderboard_data,
        "daily_activity": daily_activity_all,
        
        "subscriptions": {
            "total": total_subscriptions,
            "active": active_subscriptions,
            "per_plan": subscriptions_per_plan,
            "growth": subscription_growth  # NEW: Subscription growth over time!
        },
        
        "revenue": {
            "total": total_revenue,
            "per_currency": revenue_per_currency
        },
        
        "formations": formation_stats,
        "most_used_formations": most_used_formations,  # NEW: Most used formations!
        
        "live_sessions": {
            "total": total_lives,
            "active": active_lives,
            "archived": archived_lives
        },
        
        "user_growth": user_growth
    }

@app.put("/users/me", response_model=schemas.User, tags=["Users"])
async def update_user_me(
    user_update: schemas.UserUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    update_data = user_update.dict(exclude_unset=True)
    if "email" in update_data:
        ensure_email_available(db, str(update_data["email"]), excluded_user_id=current_user.id)
        update_data["email"] = str(update_data["email"])

    for key, value in update_data.items():
        setattr(current_user, key, value)

    db.commit()
    db.refresh(current_user)
    return current_user


@app.post("/users/{user_id}/reset-password", tags=["Admin"])
def admin_reset_user_password(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin_user),
):
    user = get_user_or_404(db, user_id)
    return {
        "message": f"Password reset flow requested for {user.email}",
        "user_id": user.id,
    }


@app.delete("/users/me", tags=["Users"])
async def delete_user_me(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    db.query(models.Subscription).filter(models.Subscription.user_id == current_user.id).delete(
        synchronize_session=False
    )
    db.query(models.UserLiveRegistration).filter(
        models.UserLiveRegistration.user_id == current_user.id
    ).delete(synchronize_session=False)
    db.delete(current_user)
    db.commit()
    return {"message": "User and associated data deleted"}


@app.post("/subscriptions/me/cancel", tags=["Subscriptions"])
def cancel_my_subscription(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    active_subscriptions = db.query(models.Subscription).filter(
        models.Subscription.user_id == current_user.id,
        models.Subscription.is_active == True,
    ).all()
    if not active_subscriptions:
        raise HTTPException(status_code=404, detail="No active subscription found")

    for subscription in active_subscriptions:
        subscription.is_active = False
        if subscription.payment_status == "paid":
            subscription.payment_status = "cancelled"

    db.commit()
    return {"message": "Subscription cancelled successfully"}


@app.get("/users/me/dashboard", tags=["Users"])
async def read_user_dashboard(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    try:
        subscriptions = db.query(models.Subscription).filter(
            models.Subscription.user_id == current_user.id,
            models.Subscription.is_active == True,
        ).order_by(models.Subscription.end_date.desc()).all()
        active_subscription = subscriptions[0] if subscriptions else None
        fallback_created_at = getattr(active_subscription, "start_date", datetime.utcnow())

        # Get accessible formations with progress
        accessible_formations = []
        for access in current_user.formation_accesses:
            formation = db.query(models.Formation).filter(models.Formation.id == access.formation_id).first()
            if formation:
                # Calculate progress
                total_lessons = 0
                completed_lessons = 0
                for module in formation.modules:
                    total_lessons += len(module.lessons)
                    for lesson in module.lessons:
                        progress = db.query(models.UserLessonProgress).filter(
                            models.UserLessonProgress.user_id == current_user.id,
                            models.UserLessonProgress.lesson_id == lesson.id,
                            models.UserLessonProgress.is_completed == True
                        ).first()
                        if progress:
                            completed_lessons +=1
                
                progress_percent = (completed_lessons / total_lessons * 100) if total_lessons >0 else 0
                accessible_formations.append({
                    "id": formation.id,
                    "title": formation.title,
                    "progress": round(progress_percent),
                    "description": formation.description,
                    "image_url": formation.image_url,
                    "instructor": "TradeMaster Expert",
                    "duration": formation.duration,
                    "students": 1200,
                    "rating": formation.rating or 4.8,
                    "color": "purple"
                })
        
        in_progress_courses = [f for f in accessible_formations if f['progress'] < 100]
        completed_courses = [f for f in accessible_formations if f['progress'] >= 100]
        
        # Get daily activity for last 7 days
        daily_activity = []
        for i in range(6, -1, -1):
            date = datetime.utcnow().date() - timedelta(days=i)
            activity = db.query(models.UserDailyActivity).filter(
                models.UserDailyActivity.user_id == current_user.id,
                func.date(models.UserDailyActivity.date) == date.isoformat()
            ).first()
            
            daily_activity.append({
                "date": date.isoformat(),
                "day": date.strftime("%a"),
                "points": activity.points_earned if activity else 0,
                "lessons_completed": activity.lessons_completed if activity else 0,
                "time_spent": activity.time_spent_minutes if activity else 0,
            })

        # Calculate hours this week
        hours_this_week = sum(a['time_spent'] for a in daily_activity) / 60

        # Payment history
        payment_history = [
            {
                "id": subscription.id,
                "description": subscription.package_name,
                "date": subscription.start_date,
                "amount": 0,
                "status": subscription.payment_status,
            }
            for subscription in subscriptions
        ]

        return {
            "user": {
                "email": current_user.email,
                "full_name": current_user.full_name or current_user.email.split("@")[0],
                "role": current_user.role,
                "created_at": fallback_created_at,
                "total_points": current_user.total_points,
            },
            "stats": {
                "formationsCompleted": current_user.formations_completed,
                "livesAttended": current_user.lives_attended,
                "currentStreak": current_user.current_streak,
                "totalPoints": current_user.total_points,
                "totalHours": round(hours_this_week,1),
                "lessonsThisWeek": sum(a['lessons_completed'] for a in daily_activity),
            },
            "dailyActivity": daily_activity,
            "inProgressCourses": in_progress_courses if in_progress_courses else [{"id": 1, "title": "Introduction au Trading (Demo)", "progress": 10}],
            "completedCourses": completed_courses,
            "recentAchievements": [
                {
                    "id": 1,
                    "title": "Apprenti Trader",
                    "description": "Inscrit sur TradeMaster",
                    "icon": "graduation-cap",
                    "unlocked": True,
                }
            ],
            "recentActivities": [
                {
                    "id": 1,
                    "title": "Connexion au tableau de bord",
                    "time": "A l'instant",
                    "icon": "check-circle",
                    "points": 5,
                }
            ],
            "learningPath": [
                {
                    "id": 1,
                    "title": "Introduction au Trading",
                    "description": "Les bases du marche et des actifs.",
                    "completed": True,
                },
                {
                    "id": 2,
                    "title": "Analyse Technique 101",
                    "description": "Supports, resistances et tendances.",
                    "completed": False,
                },
            ],
            "savedCourses": [],
            "subscription": {
                "package_name": active_subscription.package_name,
                "start_date": active_subscription.start_date,
                "end_date": active_subscription.end_date,
                "payment_status": active_subscription.payment_status,
                "is_active": active_subscription.is_active,
                "status": "active" if active_subscription.is_active else active_subscription.payment_status,
            } if active_subscription else None,
            "paymentHistory": payment_history,
            "communityStats": {
                "rank": 124,
                "totalMembers": db.query(models.User).count(),
                "weeklyLeader": "Admin",
            },
            "leaderboard": [
                {"id": 1, "name": "Admin", "points": 5240, "change": 120},
                {"id": 2, "name": "TraderPro", "points": 4890, "change": -45},
                {
                    "id": 3,
                    "name": current_user.full_name or current_user.email.split("@")[0],
                    "points": current_user.total_points,
                    "change": 10,
                },
            ],
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/admin/users/", response_model=List[schemas.User], tags=["Admin"])
def admin_read_users(
    skip: int = 0,
    limit: int = 100,
    email: Optional[str] = None,
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin_user),
):
    query = db.query(models.User)
    if email:
        query = query.filter(models.User.email.contains(email))
    if role:
        query = query.filter(models.User.role == role)
    if is_active is not None:
        query = query.filter(models.User.is_active == is_active)
    return query.offset(skip).limit(limit).all()


@app.get("/admin/users/{user_id}", response_model=schemas.User, tags=["Admin"])
def admin_read_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin_user),
):
    return get_user_or_404(db, user_id)


@app.put("/admin/users/{user_id}", response_model=schemas.User, tags=["Admin"])
def admin_update_user(
    user_id: int,
    user_update: schemas.UserAdminUpdate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin_user),
):
    user = get_user_or_404(db, user_id)
    update_data = user_update.dict(exclude_unset=True)

    if "email" in update_data:
        ensure_email_available(db, str(update_data["email"]), excluded_user_id=user.id)
        update_data["email"] = str(update_data["email"])

    for key, value in update_data.items():
        setattr(user, key, value)

    log_admin_action(db, admin_user.email, "update_user", f"Updated user #{user.id} ({user.email})")
    db.commit()
    db.refresh(user)
    return user


@app.delete("/admin/users/{user_id}", tags=["Admin"])
def admin_delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin_user),
):
    user = get_user_or_404(db, user_id)
    db.query(models.Subscription).filter(models.Subscription.user_id == user.id).delete(
        synchronize_session=False
    )
    db.query(models.UserLiveRegistration).filter(
        models.UserLiveRegistration.user_id == user.id
    ).delete(synchronize_session=False)
    log_admin_action(db, admin_user.email, "delete_user", f"Deleted user #{user.id} ({user.email})")
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}


@app.post("/admin/formations/", response_model=schemas.Formation, tags=["Admin"])
def admin_create_formation(
    formation: schemas.FormationCreate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin_user),
):
    db_formation = models.Formation(**formation.dict())
    db.add(db_formation)
    db.flush()
    log_admin_action(db, admin_user.email, "create_formation", f"Created formation #{db_formation.id} ({db_formation.title})")
    db.commit()
    db.refresh(db_formation)
    return db_formation


@app.put("/admin/formations/{formation_id}", response_model=schemas.Formation, tags=["Admin"])
def admin_update_formation(
    formation_id: int,
    formation_update: schemas.FormationUpdate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin_user),
):
    formation = get_formation_or_404(db, formation_id)
    for key, value in formation_update.dict(exclude_unset=True).items():
        setattr(formation, key, value)
    log_admin_action(db, admin_user.email, "update_formation", f"Updated formation #{formation.id} ({formation.title})")
    db.commit()
    db.refresh(formation)
    return formation


@app.delete("/admin/formations/{formation_id}", tags=["Admin"])
def admin_delete_formation(
    formation_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin_user),
):
    formation = get_formation_or_404(db, formation_id)
    live_ids = [live.id for live in formation.live_sessions]
    if live_ids:
        db.query(models.UserLiveRegistration).filter(
            models.UserLiveRegistration.live_id.in_(live_ids)
        ).delete(synchronize_session=False)
        db.query(models.LiveSession).filter(models.LiveSession.id.in_(live_ids)).delete(
            synchronize_session=False
        )
    log_admin_action(db, admin_user.email, "delete_formation", f"Deleted formation #{formation.id} ({formation.title})")
    db.delete(formation)
    db.commit()
    return {"message": "Formation deleted successfully"}


@app.get("/formations/", response_model=List[schemas.Formation], tags=["Formations"])
def read_formations(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(auth.get_optional_current_user)
):
    formations = db.query(models.Formation).offset(skip).limit(limit).all()
    
    if not current_user:
        # If no user, all formations are locked except maybe public ones
        # For now, let's assume they can see them but they are locked
        for f in formations:
            f.is_locked = True
            f.can_access = False
        return formations

    for f in formations:
        f.can_access = check_formation_access(current_user, f, db)
        f.is_locked = not f.can_access
        if f.is_locked:
            # Check why access is denied
            active_subscription = db.query(models.Subscription).filter(
                models.Subscription.user_id == current_user.id,
                models.Subscription.is_active == True
            ).first()
            if not active_subscription:
                f.access_reason = "Requis: Abonnement actif"
            else:
                f.access_reason = f"Requis: Niveau {f.level.capitalize()}"
        else:
            f.access_reason = "Déverrouillé"
            
    return formations


@app.get("/formations/{formation_id}", response_model=schemas.Formation, tags=["Formations"])
def read_formation(
    formation_id: int, 
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(auth.get_optional_current_user)
):
    formation = get_formation_or_404(db, formation_id)
    
    if current_user:
        formation.can_access = check_formation_access(current_user, formation, db)
        formation.is_locked = not formation.can_access
        if formation.is_locked:
            # Check why access is denied
            active_subscription = db.query(models.Subscription).filter(
                models.Subscription.user_id == current_user.id,
                models.Subscription.is_active == True
            ).first()
            if not active_subscription:
                formation.access_reason = "Requis: Abonnement actif"
            else:
                formation.access_reason = f"Requis: Niveau {formation.level.capitalize()}"
        else:
            formation.access_reason = "Déverrouillé"
    else:
        formation.can_access = False
        formation.is_locked = True
        formation.access_reason = "Veuillez vous connecter"
        
    return formation

@app.get("/formations/{formation_id}/reviews", response_model=List[schemas.FormationReview], tags=["Formations"])
def read_formation_reviews(
    formation_id: int,
    db: Session = Depends(get_db)
):
    reviews = db.query(models.FormationReview).filter(models.FormationReview.formation_id == formation_id).all()
    for review in reviews:
        review.author_name = review.user.full_name or review.user.email.split("@")[0]
    return reviews

@app.post("/formations/{formation_id}/reviews", response_model=schemas.FormationReview, tags=["Formations"])
def create_formation_review(
    formation_id: int,
    review: schemas.FormationReviewCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Check if user has access to the formation
    formation = get_formation_or_404(db, formation_id)
    if not check_formation_access(current_user, formation, db):
        raise HTTPException(status_code=403, detail="Vous devez posséder cette formation pour laisser un avis")

    # Check if user already reviewed
    existing_review = db.query(models.FormationReview).filter(
        models.FormationReview.formation_id == formation_id,
        models.FormationReview.user_id == current_user.id
    ).first()
    if existing_review:
        raise HTTPException(status_code=400, detail="Vous avez déjà laissé un avis pour cette formation")

    db_review = models.FormationReview(
        formation_id=formation_id,
        user_id=current_user.id,
        rating=review.rating,
        comment=review.comment
    )
    db.add(db_review)
    
    # Update formation average rating and reviews count
    all_reviews = db.query(models.FormationReview).filter(models.FormationReview.formation_id == formation_id).all()
    total_rating = sum([r.rating for r in all_reviews]) + review.rating
    count = len(all_reviews) + 1
    
    formation.rating = round(total_rating / count, 1)
    formation.reviews = count
    
    db.commit()
    db.refresh(db_review)
    db_review.author_name = current_user.full_name or current_user.email.split("@")[0]
    return db_review


@app.post("/subscriptions/", response_model=schemas.Subscription, tags=["Subscriptions"])
def create_subscription(
    subscription: schemas.SubscriptionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    db_subscription = models.Subscription(
        user_id=current_user.id,
        package_name=subscription.package_name,
        start_date=subscription.start_date,
        end_date=subscription.end_date,
        is_active=subscription.is_active,
        payment_status=subscription.payment_status,
    )
    db.add(db_subscription)
    db.commit()
    db.refresh(db_subscription)
    return db_subscription


@app.get("/subscriptions/", response_model=List[schemas.Subscription], tags=["Subscriptions"])
def read_subscriptions(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    return db.query(models.Subscription).filter(
        models.Subscription.user_id == current_user.id
    ).offset(skip).limit(limit).all()


@app.get("/subscriptions/{subscription_id}", response_model=schemas.Subscription, tags=["Subscriptions"])
def read_subscription(
    subscription_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    subscription = get_subscription_or_404(db, subscription_id)
    if subscription.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return subscription


@app.get("/admin/subscriptions/", response_model=List[schemas.Subscription], tags=["Admin"])
def admin_read_subscriptions(
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    payment_status: Optional[str] = None,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin_user),
):
    query = db.query(models.Subscription)
    if user_id is not None:
        query = query.filter(models.Subscription.user_id == user_id)
    if is_active is not None:
        query = query.filter(models.Subscription.is_active == is_active)
    if payment_status:
        query = query.filter(models.Subscription.payment_status == payment_status)
    
    subscriptions = query.offset(skip).limit(limit).all()
    
    # Enrich subscriptions with user data manually for the response
    enriched_subscriptions = []
    for sub in subscriptions:
        user = db.query(models.User).filter(models.User.id == sub.user_id).first()
        sub_dict = {
            "id": sub.id,
            "user_id": sub.user_id,
            "package_name": sub.package_name,
            "start_date": sub.start_date,
            "end_date": sub.end_date,
            "is_active": sub.is_active,
            "payment_status": sub.payment_status,
            "user_email": user.email if user else "Inconnu",
            "user_name": user.full_name if user else "Utilisateur Supprimé"
        }
        enriched_subscriptions.append(sub_dict)
        
    return enriched_subscriptions


@app.get("/admin/subscriptions/{subscription_id}", response_model=schemas.Subscription, tags=["Admin"])
def admin_read_subscription(
    subscription_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin_user),
):
    return get_subscription_or_404(db, subscription_id)


@app.post("/admin/subscriptions/", response_model=schemas.Subscription, tags=["Admin"])
def admin_create_subscription(
    subscription: schemas.SubscriptionCreate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin_user),
):
    get_user_or_404(db, subscription.user_id)
    db_subscription = models.Subscription(**subscription.dict())
    db.add(db_subscription)
    db.flush()
    log_admin_action(
        db,
        admin_user.email,
        "create_subscription",
        f"Created subscription #{db_subscription.id} for user #{db_subscription.user_id}",
    )
    db.commit()
    db.refresh(db_subscription)
    return db_subscription


@app.post("/admin/subscriptions/manual", response_model=schemas.Subscription, tags=["Admin"])
def admin_create_manual_subscription(
    sub_data: schemas.ManualSubscriptionCreate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin_user),
):
    user = db.query(models.User).filter(models.User.email == sub_data.user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User with this email not found")

    start_date = datetime.now()
    end_date = start_date + timedelta(days=30 * sub_data.duration_months)

    db_subscription = models.Subscription(
        user_id=user.id,
        package_name=sub_data.package_name,
        start_date=start_date,
        end_date=end_date,
        is_active=True,
        payment_status="paid",
    )
    db.add(db_subscription)
    db.flush()
    
    # Update user role to subscriber if they are standard
    if user.role == "standard":
        user.role = "subscriber"
        
    log_admin_action(
        db,
        admin_user.email,
        "create_manual_subscription",
        f"Manually created subscription for {sub_data.user_email} ({sub_data.package_name})",
    )
    db.commit()
    db.refresh(db_subscription)
    
    # Enrich response for frontend
    return {
        **db_subscription.__dict__,
        "user_email": user.email,
        "user_name": user.full_name
    }


@app.put("/admin/subscriptions/{subscription_id}", response_model=schemas.Subscription, tags=["Admin"])
def admin_update_subscription(
    subscription_id: int,
    subscription_update: schemas.SubscriptionUpdate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin_user),
):
    subscription = get_subscription_or_404(db, subscription_id)
    for key, value in subscription_update.dict(exclude_unset=True).items():
        setattr(subscription, key, value)
    log_admin_action(
        db,
        admin_user.email,
        "update_subscription",
        f"Updated subscription #{subscription.id} for user #{subscription.user_id}",
    )
    db.commit()
    db.refresh(subscription)
    return subscription


@app.delete("/admin/subscriptions/{subscription_id}", tags=["Admin"])
def admin_delete_subscription(
    subscription_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin_user),
):
    subscription = get_subscription_or_404(db, subscription_id)
    log_admin_action(
        db,
        admin_user.email,
        "delete_subscription",
        f"Deleted subscription #{subscription.id} for user #{subscription.user_id}",
    )
    db.delete(subscription)
    db.commit()
    return {"message": "Subscription deleted successfully"}


@app.post("/admin/lives/", response_model=schemas.LiveSession, tags=["Admin"])
def admin_create_live(
    live: schemas.LiveSessionCreate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin_user),
):
    ensure_live_payload_valid(db, live.google_meet_link, live.formation_id)
    db_live = models.LiveSession(**live.dict())
    db.add(db_live)
    db.flush()
    log_admin_action(db, admin_user.email, "create_live", f"Created live #{db_live.id} ({db_live.title})")
    db.commit()
    db.refresh(db_live)
    return db_live


@app.get("/admin/lives/", response_model=List[schemas.LiveSession], tags=["Admin"])
def admin_read_lives(
    skip: int = 0,
    limit: int = 100,
    formation_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    upcoming_only: bool = False,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin_user),
):
    print("DEBUG main.py: Entering admin_read_lives")
    query = db.query(models.LiveSession)
    if formation_id is not None:
        query = query.filter(models.LiveSession.formation_id == formation_id)
    if is_active is not None:
        query = query.filter(models.LiveSession.is_active == is_active)
    if upcoming_only:
        query = query.filter(models.LiveSession.start_time >= datetime.utcnow())
    lives = query.order_by(models.LiveSession.start_time.asc()).offset(skip).limit(limit).all()
    print(f"DEBUG main.py: Fetched {len(lives)} lives for admin")
    return lives

@app.get("/admin/lives/{live_id}", response_model=schemas.LiveSession, tags=["Admin"])
def admin_read_live(
    live_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin_user),
):
    return get_live_or_404(db, live_id)


@app.put("/admin/lives/{live_id}", response_model=schemas.LiveSession, tags=["Admin"])
def admin_update_live(
    live_id: int,
    live_update: schemas.LiveSessionUpdate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin_user),
):
    live = get_live_or_404(db, live_id)
    update_data = live_update.dict(exclude_unset=True)

    ensure_live_payload_valid(
        db,
        update_data.get("google_meet_link"),
        update_data.get("formation_id"),
        excluded_live_id=live.id,
    )

    for key, value in update_data.items():
        setattr(live, key, value)

    log_admin_action(db, admin_user.email, "update_live", f"Updated live #{live.id} ({live.title})")
    db.commit()
    db.refresh(live)
    return live


@app.delete("/admin/lives/{live_id}", tags=["Admin"])
def admin_delete_live(
    live_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin_user),
):
    live = get_live_or_404(db, live_id)
    db.query(models.UserLiveRegistration).filter(
        models.UserLiveRegistration.live_id == live.id
    ).delete(synchronize_session=False)
    log_admin_action(db, admin_user.email, "delete_live", f"Deleted live #{live.id} ({live.title})")
    db.delete(live)
    db.commit()
    return {"message": "Live deleted successfully"}


@app.get("/lives/", response_model=List[schemas.LiveSession], tags=["Lives"])
def read_lives_public(db: Session = Depends(get_db)):
    return db.query(models.LiveSession).filter(models.LiveSession.is_active == True).all()


@app.get("/lives/upcoming", response_model=List[schemas.LiveSession], tags=["Lives"])
def read_upcoming_lives(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    # Auto-archive lives that have ended
    now = datetime.utcnow()
    ended_lives = db.query(models.LiveSession).filter(
        models.LiveSession.is_active == True,
        models.LiveSession.end_time <= now,
        models.LiveSession.is_archived == False
    ).all()
    
    for live in ended_lives:
        live.is_active = False
        live.is_archived = True
    
    db.commit()
    
    return db.query(models.LiveSession).filter(
        models.LiveSession.is_active == True,
        models.LiveSession.start_time >= now,
    ).order_by(models.LiveSession.start_time.asc()).all()


@app.get("/lives/archived", response_model=List[schemas.LiveSession], tags=["Lives"])
def read_archived_lives(
    db: Session = Depends(get_db),
):
    print("DEBUG main.py: Entering read_archived_lives")
    lives = db.query(models.LiveSession).filter(
        models.LiveSession.is_archived == True
    ).order_by(models.LiveSession.start_time.desc()).all()
    print(f"DEBUG main.py: Fetched {len(lives)} archived lives")
    return lives

@app.get("/lives/{live_id}", response_model=schemas.LiveSession, tags=["Lives"])
def read_live_user(
    live_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    live = get_live_or_404(db, live_id)
    if not live.is_active and not live.is_archived and current_user.role != "admin":
        raise HTTPException(status_code=404, detail="Live not found")
    return live


@app.post("/lives/{live_id}/register", response_model=schemas.UserLiveRegistration, tags=["Lives"])
def register_for_live(
    live_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    live = get_live_or_404(db, live_id)
    if not live.is_active:
        raise HTTPException(status_code=400, detail="This live session is not active")

    existing_registration = db.query(models.UserLiveRegistration).filter(
        models.UserLiveRegistration.user_id == current_user.id,
        models.UserLiveRegistration.live_id == live.id,
    ).first()
    if existing_registration:
        return existing_registration

    registration = models.UserLiveRegistration(user_id=current_user.id, live_id=live.id)
    db.add(registration)
    db.commit()
    db.refresh(registration)
    return registration


@app.post("/lives/{live_id}/attended", tags=["Lives"])
def mark_live_attended(
    live_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    live = get_live_or_404(db, live_id)
    if live.start_time > datetime.utcnow():
        raise HTTPException(status_code=400, detail="This live session has not started yet")

    current_user.lives_attended += 1
    current_user.total_points += 50
    db.commit()
    db.refresh(current_user)
    return {
        "message": "Attendance recorded",
        "live_id": live.id,
        "total_lives": current_user.lives_attended,
        "total_points": current_user.total_points,
    }



@app.get("/calendar/", response_model=List[schemas.CalendarEvent], tags=["Calendar"])
def read_calendar_events(db: Session = Depends(get_db)):
    return db.query(models.CalendarEvent).order_by(models.CalendarEvent.id.desc()).all()


@app.post("/calendar/", response_model=schemas.CalendarEvent, tags=["Calendar"])
def create_calendar_event(
    event: schemas.CalendarEventBase,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin_user),
):
    db_event = models.CalendarEvent(**event.dict())
    db.add(db_event)
    db.flush()
    log_admin_action(db, admin_user.email, "create_calendar_event", f"Created calendar event #{db_event.id} ({db_event.title})")
    db.commit()
    db.refresh(db_event)
    return db_event


@app.delete("/calendar/{event_id}", tags=["Calendar"])
def delete_calendar_event(
    event_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin_user),
):
    event = db.query(models.CalendarEvent).filter(models.CalendarEvent.id == event_id).first()
    if event is None:
        raise HTTPException(status_code=404, detail="Calendar event not found")
    log_admin_action(db, admin_user.email, "delete_calendar_event", f"Deleted calendar event #{event.id} ({event.title})")
    db.delete(event)
    db.commit()
    return {"message": "Calendar event deleted successfully"}

# --- Private Calendar Endpoints ---
@app.get("/private-calendar/events", response_model=List[schemas.PrivateCalendarEvent], tags=["Private Calendar"])
def get_private_calendar_events(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    # Get all events where current_user is creator or participant
    events = db.query(models.PrivateCalendarEvent).filter(
        (models.PrivateCalendarEvent.created_by_id == current_user.id) |
        (models.PrivateCalendarEvent.participants.any(user_id=current_user.id))
    ).all()
    return [build_private_calendar_event_response(db, evt) for evt in events]

@app.post("/private-calendar/events", response_model=schemas.PrivateCalendarEvent, tags=["Private Calendar"])
def create_private_calendar_event(
    event_data: schemas.PrivateCalendarEventCreate,
    current_user: models.User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db),
):
    event = models.PrivateCalendarEvent(
        title=event_data.title,
        description=event_data.description,
        start_time=event_data.start_time,
        end_time=event_data.end_time,
        is_group=event_data.is_group,
        created_by_id=current_user.id,
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    # Add participants
    for user_id in event_data.participant_user_ids:
        user = get_user_or_404(db, user_id)
        participant = models.PrivateCalendarParticipant(
            event_id=event.id,
            user_id=user_id,
        )
        db.add(participant)
    db.commit()
    db.refresh(event)

    return build_private_calendar_event_response(db, event)

@app.put("/private-calendar/events/{event_id}", response_model=schemas.PrivateCalendarEvent, tags=["Private Calendar"])
def update_private_calendar_event(
    event_id: int,
    event_data: schemas.PrivateCalendarEventUpdate,
    current_user: models.User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db),
):
    event = db.query(models.PrivateCalendarEvent).filter(models.PrivateCalendarEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event_data.title:
        event.title = event_data.title
    if event_data.description is not None:
        event.description = event_data.description
    if event_data.start_time:
        event.start_time = event_data.start_time
    if event_data.end_time:
        event.end_time = event_data.end_time
    if event_data.is_group is not None:
        event.is_group = event_data.is_group
    
    # Mettre à jour les participants si fournis
    if event_data.participant_user_ids is not None:
        # Supprimer les participants existants
        db.query(models.PrivateCalendarParticipant).filter(models.PrivateCalendarParticipant.event_id == event_id).delete()
        # Ajouter les nouveaux participants
        for user_id in event_data.participant_user_ids:
            participant = models.PrivateCalendarParticipant(
                event_id=event.id,
                user_id=user_id,
            )
            db.add(participant)
    
    db.commit()
    db.refresh(event)
    return build_private_calendar_event_response(db, event)

@app.delete("/private-calendar/events/{event_id}", tags=["Private Calendar"])
def delete_private_calendar_event(
    event_id: int,
    current_user: models.User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db),
):
    event = db.query(models.PrivateCalendarEvent).filter(models.PrivateCalendarEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(event)
    db.commit()
    return {"message": "Event deleted successfully"}

# --- Chat Endpoints ---
@app.get("/chat/rooms", response_model=List[schemas.ChatRoom], tags=["Chat"])
def get_chat_rooms(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    rooms = db.query(models.ChatRoom).filter(
        (models.ChatRoom.created_by_id == current_user.id) |
        (models.ChatRoom.participants.any(user_id=current_user.id))
    ).all()
    return [build_chat_room_response(db, room) for room in rooms]

@app.post("/chat/rooms", response_model=schemas.ChatRoom, tags=["Chat"])
def create_chat_room(
    room_data: schemas.ChatRoomCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    room = models.ChatRoom(
        name=room_data.name,
        is_group=room_data.is_group,
        created_by_id=current_user.id,
    )
    db.add(room)
    db.commit()
    db.refresh(room)

    # Add participants
    for user_id in room_data.participant_user_ids:
        user = get_user_or_404(db, user_id)
        participant = models.ChatRoomParticipant(
            chat_room_id=room.id,
            user_id=user_id,
        )
        db.add(participant)
    db.commit()
    db.refresh(room)
    return build_chat_room_response(db, room)

@app.get("/chat/rooms/{room_id}", response_model=schemas.ChatRoom, tags=["Chat"])
def get_chat_room(
    room_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    room = db.query(models.ChatRoom).filter(models.ChatRoom.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Chat room not found")
    # Check access: user must be creator or participant
    is_creator = room.created_by_id == current_user.id
    is_participant = any(p.user_id == current_user.id for p in room.participants)
    if not is_creator and not is_participant:
        raise HTTPException(status_code=403, detail="Not authorized to view this room")
    return build_chat_room_response(db, room)

@app.post("/chat/rooms/{room_id}/messages", response_model=schemas.ChatMessage, tags=["Chat"])
def send_chat_message(
    room_id: int,
    message_data: schemas.ChatMessageCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    room = db.query(models.ChatRoom).filter(models.ChatRoom.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Chat room not found")
    is_creator = room.created_by_id == current_user.id
    is_participant = any(p.user_id == current_user.id for p in room.participants)
    if not is_creator and not is_participant:
        raise HTTPException(status_code=403, detail="Not authorized to send messages to this room")
    message = models.ChatMessage(
        chat_room_id=room_id,
        sender_id=current_user.id,
        content=message_data.content,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return build_chat_message_response(db, message)


@app.get("/settings/", response_model=List[schemas.SiteSetting], tags=["Settings"])
def read_settings(
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin_user),
):
    return db.query(models.SiteSettings).order_by(models.SiteSettings.key.asc()).all()


@app.put("/settings/", response_model=schemas.SiteSetting, tags=["Settings"])
def update_setting(
    setting: schemas.SiteSettingBase,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin_user),
):
    db_setting = db.query(models.SiteSettings).filter(models.SiteSettings.key == setting.key).first()
    if db_setting is None:
        db_setting = models.SiteSettings(**setting.dict())
        db.add(db_setting)
        action = "create_setting"
    else:
        db_setting.value = setting.value
        action = "update_setting"

    db.flush()
    log_admin_action(db, admin_user.email, action, f"Saved setting '{db_setting.key}'")
    db.commit()
    db.refresh(db_setting)
    return db_setting


@app.get("/spotlights/", response_model=List[schemas.Spotlight], tags=["Spotlights"])
def read_spotlights(db: Session = Depends(get_db)):
    return db.query(models.Spotlight).order_by(models.Spotlight.id.desc()).all()


@app.post("/spotlights/", response_model=schemas.Spotlight, tags=["Spotlights"])
def create_spotlight(
    spotlight: schemas.SpotlightBase,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin_user),
):
    db_spotlight = models.Spotlight(**spotlight.dict())
    db.add(db_spotlight)
    db.flush()
    log_admin_action(db, admin_user.email, "create_spotlight", f"Created spotlight #{db_spotlight.id} ({db_spotlight.title})")
    db.commit()
    db.refresh(db_spotlight)
    return db_spotlight


@app.delete("/spotlights/{spotlight_id}", tags=["Spotlights"])
def delete_spotlight(
    spotlight_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin_user),
):
    spotlight = db.query(models.Spotlight).filter(models.Spotlight.id == spotlight_id).first()
    if spotlight is None:
        raise HTTPException(status_code=404, detail="Spotlight not found")
    log_admin_action(db, admin_user.email, "delete_spotlight", f"Deleted spotlight #{spotlight.id} ({spotlight.title})")
    db.delete(spotlight)
    db.commit()
    return {"message": "Spotlight deleted successfully"}


@app.get("/elite-videos/", response_model=List[schemas.EliteCircleVideo], tags=["EliteVideos"])
def read_elite_videos(db: Session = Depends(get_db)):
    return db.query(models.EliteCircleVideo).order_by(models.EliteCircleVideo.created_at.desc()).all()


@app.post("/elite-videos/", response_model=schemas.EliteCircleVideo, tags=["EliteVideos"])
def create_elite_video(
    video: schemas.EliteCircleVideoBase,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin_user),
):
    db_video = models.EliteCircleVideo(**video.dict())
    db.add(db_video)
    db.flush()
    log_admin_action(db, admin_user.email, "create_elite_video", f"Created elite video #{db_video.id} ({db_video.title})")
    db.commit()
    db.refresh(db_video)
    return db_video


@app.delete("/elite-videos/{video_id}", tags=["EliteVideos"])
def delete_elite_video(
    video_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin_user),
):
    video = db.query(models.EliteCircleVideo).filter(models.EliteCircleVideo.id == video_id).first()
    if video is None:
        raise HTTPException(status_code=404, detail="Elite video not found")
    log_admin_action(db, admin_user.email, "delete_elite_video", f"Deleted elite video #{video.id} ({video.title})")
    db.delete(video)
    db.commit()
    return {"message": "Elite video deleted successfully"}


@app.get("/admin/audit-logs", response_model=List[schemas.AuditLog], tags=["Admin"])
def read_audit_logs(
    limit: int = 100,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin_user),
):
    safe_limit = max(1, min(limit, 500))
    return db.query(models.AuditLog).order_by(models.AuditLog.created_at.desc()).limit(safe_limit).all()


# --- Community Endpoints ---

@app.get("/community/stats", tags=["Community"])
def get_community_stats(db: Session = Depends(get_db)):
    from datetime import datetime, timedelta
    now = datetime.now()
    yesterday = now - timedelta(days=1)
    
    total_members = db.query(models.User).count()
    daily_posts = db.query(models.CommunityPost).filter(
        models.CommunityPost.timestamp >= yesterday,
        models.CommunityPost.is_approved == True
    ).count()
    daily_comments = db.query(models.Comment).filter(
        models.Comment.timestamp >= yesterday
    ).count()
    online_now = 156  # Mock for now, can be expanded later
    
    return {
        "totalMembers": total_members,
        "dailyMessages": daily_posts + daily_comments,
        "onlineNow": online_now
    }

@app.get("/community/posts", response_model=List[schemas.CommunityPost], tags=["Community"])
def read_community_posts(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    posts = db.query(models.CommunityPost).filter(models.CommunityPost.is_approved == True).order_by(models.CommunityPost.timestamp.desc()).offset(skip).limit(limit).all()
    
    # Manually enrich with author info for the response model
    for post in posts:
        post.author_name = post.author.full_name or post.author.email.split("@")[0]
        post.author_role = post.author.role
        for comment in post.comments:
            comment.author_name = comment.author.full_name or comment.author.email.split("@")[0]
            
    return posts

@app.post("/community/posts", response_model=schemas.CommunityPost, tags=["Community"])
def create_community_post(
    post: schemas.CommunityPostCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_post = models.CommunityPost(
        **post.dict(),
        user_id=current_user.id,
        is_approved=False # Must be approved by admin
    )
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return db_post

@app.post("/community/posts/{post_id}/like", tags=["Community"])
def like_community_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    post = db.query(models.CommunityPost).filter(models.CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    post.likes_count += 1
    db.commit()
    return {"message": "Post liked", "likes": post.likes_count}

@app.post("/community/posts/{post_id}/comment", response_model=schemas.Comment, tags=["Community"])
def comment_community_post(
    post_id: int,
    comment: schemas.CommentBase,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    post = db.query(models.CommunityPost).filter(models.CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    db_comment = models.Comment(
        post_id=post_id,
        user_id=current_user.id,
        content=comment.content
    )
    post.comments_count += 1
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    
    # Enrich with author name for frontend display
    db_comment.author_name = current_user.full_name or current_user.email.split("@")[0]
    
    return db_comment

@app.post("/community/posts/{post_id}/share", tags=["Community"])
def share_community_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    post = db.query(models.CommunityPost).filter(models.CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    post.shares_count += 1
    db.commit()
    return {"message": "Post shared", "shares": post.shares_count}

# --- Admin Community Endpoints ---

@app.get("/admin/community/pending", response_model=List[schemas.CommunityPost], tags=["Admin"])
def admin_read_pending_posts(
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin_user)
):
    posts = db.query(models.CommunityPost).filter(models.CommunityPost.is_approved == False).all()
    for post in posts:
        post.author_name = post.author.full_name or post.author.email.split("@")[0]
    return posts

@app.post("/admin/community/posts/{post_id}/approve", tags=["Admin"])
def admin_approve_post(
    post_id: int,
    approval: schemas.PostApprovalUpdate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin_user)
):
    post = db.query(models.CommunityPost).filter(models.CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    post.is_approved = approval.is_approved
    log_admin_action(db, admin_user.email, "approve_post" if approval.is_approved else "reject_post", f"Post #{post.id} by {post.author.email}")
    db.commit()
    return {"message": "Post updated", "is_approved": post.is_approved}

@app.delete("/admin/community/posts/{post_id}", tags=["Admin"])
def admin_delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin_user)
):
    post = db.query(models.CommunityPost).filter(models.CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    log_admin_action(db, admin_user.email, "delete_post", f"Deleted post #{post.id} by {post.author.email}")
    db.delete(post)
    db.commit()
    return {"message": "Post deleted successfully"}

@app.delete("/admin/community/comments/{comment_id}", tags=["Admin"])
def admin_delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin_user)
):
    comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    post = comment.post
    post.comments_count -= 1
    log_admin_action(db, admin_user.email, "delete_comment", f"Deleted comment #{comment.id} on post #{post.id}")
    db.delete(comment)
    db.commit()
    return {"message": "Comment deleted successfully"}


@app.get("/admin/promotions/", response_model=List[schemas.Promotion], tags=["Admin"])
def admin_read_promotions(
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin_user),
):
    return db.query(models.Promotion).all()


@app.post("/admin/promotions/", response_model=schemas.Promotion, tags=["Admin"])
def admin_create_promotion(
    promotion: schemas.PromotionBase,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin_user),
):
    db_promotion = models.Promotion(**promotion.dict())
    db.add(db_promotion)
    db.flush()
    log_admin_action(db, admin_user.email, "create_promotion", f"Created promotion code '{db_promotion.code}'")
    db.commit()
    db.refresh(db_promotion)
    return db_promotion


@app.delete("/admin/promotions/{promotion_id}", tags=["Admin"])
def admin_delete_promotion(
    promotion_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin_user),
):
    promotion = db.query(models.Promotion).filter(models.Promotion.id == promotion_id).first()
    if promotion is None:
        raise HTTPException(status_code=404, detail="Promotion not found")
    log_admin_action(db, admin_user.email, "delete_promotion", f"Deleted promotion code '{promotion.code}'")
    db.delete(promotion)
    db.commit()
    return {"message": "Promotion deleted successfully"}


def get_plan_or_404(db: Session, plan_id: int) -> models.PricingPlan:
    plan = db.query(models.PricingPlan).filter(models.PricingPlan.id == plan_id).first()
    if plan is None:
        raise HTTPException(status_code=404, detail="Pricing plan not found")
    return plan


@app.get("/plans/", response_model=List[schemas.PricingPlan], tags=["Plans"])
def read_pricing_plans_public(db: Session = Depends(get_db)):
    return db.query(models.PricingPlan).filter(models.PricingPlan.is_active == True).all()


@app.get("/admin/pricing-plans/", response_model=List[schemas.PricingPlan], tags=["Admin"])
def admin_read_pricing_plans(
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin_user),
):
    return db.query(models.PricingPlan).all()


@app.post("/admin/pricing-plans/", response_model=schemas.PricingPlan, tags=["Admin"])
def admin_create_pricing_plan(
    plan: schemas.PricingPlanBase,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin_user),
):
    db_plan = models.PricingPlan(**plan.dict())
    db.add(db_plan)
    db.flush()
    log_admin_action(db, admin_user.email, "create_pricing_plan", f"Created pricing plan '{db_plan.name}'")
    db.commit()
    db.refresh(db_plan)
    return db_plan


@app.put("/admin/pricing-plans/{plan_id}", response_model=schemas.PricingPlan, tags=["Admin"])
def admin_update_pricing_plan(
    plan_id: int,
    plan_update: schemas.PricingPlanUpdate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin_user),
):
    plan = get_plan_or_404(db, plan_id)
    for key, value in plan_update.dict(exclude_unset=True).items():
        setattr(plan, key, value)
    log_admin_action(db, admin_user.email, "update_pricing_plan", f"Updated pricing plan '{plan.name}'")
    db.commit()
    db.refresh(plan)
    return plan


@app.delete("/admin/pricing-plans/{plan_id}", tags=["Admin"])
def admin_delete_pricing_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin_user),
):
    plan = get_plan_or_404(db, plan_id)
    log_admin_action(db, admin_user.email, "delete_pricing_plan", f"Deleted pricing plan '{plan.name}'")
    db.delete(plan)
    db.commit()
    return {"message": "Pricing plan deleted successfully"}


@app.get("/promotions/", response_model=List[schemas.Promotion], tags=["Promotions"])
def read_promotions_public(db: Session = Depends(get_db)):
    return db.query(models.Promotion).all()


@app.get("/admin/stats", tags=["Admin"], dependencies=[Depends(auth.get_current_admin_user)])
def read_admin_stats(db: Session = Depends(get_db)):
    total_users = db.query(models.User).count()
    total_formations = db.query(models.Formation).count()
    total_active_subscriptions = db.query(models.Subscription).filter(
        models.Subscription.is_active == True
    ).count()

    return {
        "total_users": total_users,
        "total_formations": total_formations,
        "total_active_subscriptions": total_active_subscriptions,
        "recent_users": db.query(models.User).order_by(models.User.id.desc()).limit(5).all(),
    }


ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".mp4", ".webm", ".pdf"}


@app.post("/upload/", tags=["Admin"], dependencies=[Depends(auth.get_current_admin_user)])
async def upload_file(request: Request, file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed extensions: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    clean_name = file.filename.replace(" ", "_")
    filename = f"{timestamp}_{clean_name}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    base_url = str(request.base_url).rstrip("/")
    return {"url": f"{base_url}/uploads/{filename}"}





# --- Course Content Endpoints ---

@app.get("/debug/lessons", tags=["Debug"])
def debug_lessons(db: Session = Depends(get_db)):
    lessons = db.query(models.CourseLesson).all()
    return [
        {
            "id": l.id,
            "title": l.title,
            "video_url": l.video_url,
            "pdf_url": l.pdf_url
        }
        for l in lessons
    ]

@app.post("/debug/reset-lessons", tags=["Debug"])
def reset_lessons(db: Session = Depends(get_db)):
    # Reset all lessons to use sample content
    lessons = db.query(models.CourseLesson).all()
    for lesson in lessons:
        lesson.video_url = "https://www.w3schools.com/html/mov_bbb.mp4"
        lesson.pdf_url = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    db.commit()
    return {"message": "Lessons reset to sample content!"}

@app.get("/formations/{formation_id}/modules", response_model=List[schemas.CourseModule], tags=["Formations"])
def read_formation_modules(
    formation_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    formation = get_formation_or_404(db, formation_id)
    # Allow admin users to access without personal formation access
    if not (current_user.role == "admin") and not check_formation_access(current_user, formation, db):
        raise HTTPException(status_code=403, detail="You don't have access to this formation")
    
    modules = db.query(models.CourseModule).filter(
        models.CourseModule.formation_id == formation_id
    ).order_by(models.CourseModule.order).all()
    
    for module in modules:
        module.lessons = db.query(models.CourseLesson).filter(
            models.CourseLesson.module_id == module.id
        ).order_by(models.CourseLesson.order).all()
    
    return modules


@app.post("/admin/formations/{formation_id}/modules", response_model=schemas.CourseModule, tags=["Admin"])
def admin_create_module(
    formation_id: int,
    module_data: schemas.CourseModuleBase,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin_user)
):
    get_formation_or_404(db, formation_id)
    db_module = models.CourseModule(
        **module_data.dict(),
        formation_id=formation_id
    )
    db.add(db_module)
    db.flush()
    log_admin_action(db, admin_user.email, "create_module", f"Created module #{db_module.id} ({db_module.title}) for formation #{formation_id}")
    db.commit()
    db.refresh(db_module)
    return db_module


@app.put("/admin/modules/{module_id}", response_model=schemas.CourseModule, tags=["Admin"])
def admin_update_module(
    module_id: int,
    module_update: schemas.CourseModuleUpdate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin_user)
):
    module = db.query(models.CourseModule).filter(models.CourseModule.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    for key, value in module_update.dict(exclude_unset=True).items():
        setattr(module, key, value)
    log_admin_action(db, admin_user.email, "update_module", f"Updated module #{module_id}")
    db.commit()
    db.refresh(module)
    return module


@app.delete("/admin/modules/{module_id}", tags=["Admin"])
def admin_delete_module(
    module_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin_user)
):
    module = db.query(models.CourseModule).filter(models.CourseModule.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    log_admin_action(db, admin_user.email, "delete_module", f"Deleted module #{module_id} ({module.title})")
    db.delete(module)
    db.commit()
    return {"message": "Module deleted successfully"}


@app.post("/admin/modules/{module_id}/lessons", response_model=schemas.CourseLesson, tags=["Admin"])
def admin_create_lesson(
    module_id: int,
    lesson_data: schemas.CourseLessonBase,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin_user)
):
    module = db.query(models.CourseModule).filter(models.CourseModule.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    db_lesson = models.CourseLesson(
        **lesson_data.dict(),
        module_id=module_id
    )
    db.add(db_lesson)
    db.flush()
    log_admin_action(db, admin_user.email, "create_lesson", f"Created lesson #{db_lesson.id} ({db_lesson.title}) for module #{module_id}")
    db.commit()
    db.refresh(db_lesson)
    return db_lesson


@app.put("/admin/lessons/{lesson_id}", response_model=schemas.CourseLesson, tags=["Admin"])
def admin_update_lesson(
    lesson_id: int,
    lesson_update: schemas.CourseLessonUpdate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin_user)
):
    lesson = db.query(models.CourseLesson).filter(models.CourseLesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    for key, value in lesson_update.dict(exclude_unset=True).items():
        setattr(lesson, key, value)
    log_admin_action(db, admin_user.email, "update_lesson", f"Updated lesson #{lesson_id}")
    db.commit()
    db.refresh(lesson)
    return lesson


@app.delete("/admin/lessons/{lesson_id}", tags=["Admin"])
def admin_delete_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin_user)
):
    lesson = db.query(models.CourseLesson).filter(models.CourseLesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    log_admin_action(db, admin_user.email, "delete_lesson", f"Deleted lesson #{lesson_id} ({lesson.title})")
    db.delete(lesson)
    db.commit()
    return {"message": "Lesson deleted successfully"}


# --- End of API ---
