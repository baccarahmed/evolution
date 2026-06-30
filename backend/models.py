
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    full_name = Column(String)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    role = Column(String, default="standard") # e.g., "standard", "subscriber", "admin"
    level = Column(String, default="debutant")
    
    # Stats fields
    formations_completed = Column(Integer, default=0)
    lives_attended = Column(Integer, default=0)
    current_streak = Column(Integer, default=0)
    max_streak = Column(Integer, default=0)
    total_points = Column(Integer, default=0)
    last_activity_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.now())

    @property
    def accessible_formation_ids(self):
        return [access.formation_id for access in self.formation_accesses]

    subscriptions = relationship("Subscription", back_populates="owner", cascade="all, delete-orphan")
    live_registrations = relationship("UserLiveRegistration", back_populates="user", cascade="all, delete-orphan")
    payment_orders = relationship("PaymentOrder", back_populates="user", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    formation_accesses = relationship("UserFormationAccess", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    posts = relationship("CommunityPost", back_populates="author", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="author", cascade="all, delete-orphan")

class Formation(Base):
    __tablename__ = "formations"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String)
    content = Column(String) # Detailed course content
    category = Column(String)
    price = Column(Float)
    
    # New fields to match frontend
    level = Column(String) # e.g., "debutant", "intermediaire", "avance"
    duration = Column(String)
    rating = Column(Float, default=0.0)
    reviews = Column(Integer, default=0)
    image_url = Column(String)
    
    # Extra fields for detailed view
    learning_objectives = Column(String, nullable=True) # JSON or newline separated
    prerequisites = Column(String, nullable=True)
    curriculum_data = Column(String, nullable=True) # JSON format for sections/lessons

    live_sessions = relationship("LiveSession", back_populates="formation")
    user_accesses = relationship("UserFormationAccess", back_populates="formation", cascade="all, delete-orphan")
    reviews_list = relationship("FormationReview", back_populates="formation", cascade="all, delete-orphan")
    modules = relationship("CourseModule", back_populates="formation", cascade="all, delete-orphan")

class UserFormationAccess(Base):
    __tablename__ = "user_formation_accesses"
    __table_args__ = (
        UniqueConstraint("user_id", "formation_id", name="uq_user_formation_access"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    formation_id = Column(Integer, ForeignKey("formations.id"))
    granted_at = Column(DateTime, default=func.now())
    granted_by_admin_email = Column(String, nullable=True)

    user = relationship("User", back_populates="formation_accesses")
    formation = relationship("Formation", back_populates="user_accesses")

class LiveSession(Base):
    __tablename__ = "lives"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String)
    start_time = Column(DateTime, default=func.now())
    end_time = Column(DateTime)
    google_meet_link = Column(String, unique=True)
    is_active = Column(Boolean, default=True)
    is_archived = Column(Boolean, default=False)
    replay_url = Column(String, nullable=True)
    thumbnail_url = Column(String, nullable=True)
    formation_id = Column(Integer, ForeignKey("formations.id"), nullable=True)
    
    formation = relationship("Formation", back_populates="live_sessions")
    registrations = relationship("UserLiveRegistration", back_populates="live", cascade="all, delete-orphan")

class UserLiveRegistration(Base):
    __tablename__ = "user_live_registrations"
    __table_args__ = (
        UniqueConstraint("user_id", "live_id", name="uq_user_live_registration"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    live_id = Column(Integer, ForeignKey("lives.id"))
    registered_at = Column(DateTime, default=func.now())
    
    user = relationship("User", back_populates="live_registrations")
    live = relationship("LiveSession", back_populates="registrations")

class CalendarEvent(Base):
    __tablename__ = "calendar"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    day = Column(String) # "Lundi", "Mardi", etc.
    time = Column(String)
    category = Column(String)

class SiteSettings(Base):
    __tablename__ = "settings"
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True)
    value = Column(String)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    admin_email = Column(String, index=True)
    action = Column(String, index=True)
    details = Column(String)
    created_at = Column(DateTime, default=func.now(), index=True)

class CommunityPost(Base):
    __tablename__ = "posts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    content = Column(String)
    type = Column(String, default="discussion") # signal, analysis, discussion, question
    is_approved = Column(Boolean, default=False)
    likes_count = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)
    shares_count = Column(Integer, default=0)
    timestamp = Column(DateTime, default=datetime.now)

    author = relationship("User", back_populates="posts")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")

class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    content = Column(String)
    timestamp = Column(DateTime, default=datetime.now)

    post = relationship("CommunityPost", back_populates="comments")
    author = relationship("User", back_populates="comments")

class FormationReview(Base):
    __tablename__ = "formation_reviews"
    id = Column(Integer, primary_key=True, index=True)
    formation_id = Column(Integer, ForeignKey("formations.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    rating = Column(Float)
    comment = Column(String)
    created_at = Column(DateTime, default=datetime.now)
    
    formation = relationship("Formation", back_populates="reviews_list")
    user = relationship("User")

class EliteCircleVideo(Base):
    __tablename__ = "elite_circle_videos"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(String)
    video_url = Column(String)
    thumbnail_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.now)

class Spotlight(Base):
    __tablename__ = "spotlights"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(String)
    image_url = Column(String)
    link = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)

class PricingPlan(Base):
    __tablename__ = "pricing_plans"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    slug = Column(String, unique=True) # e.g., "starter", "pro", "ultimate"
    price_tnd = Column(Float) # Price in millimes for Flouci
    price_usd = Column(Float) # Price in USD for Binance
    duration_months = Column(Integer, default=1)
    description = Column(String, nullable=True)
    features = Column(String) # Stored as JSON string
    is_popular = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    button_text = Column(String, default="Get Started")

class Promotion(Base):
    __tablename__ = "promotions"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True)
    discount_percent = Column(Integer)
    expiry_date = Column(DateTime)
    is_active = Column(Boolean, default=True)

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    package_name = Column(String) # e.g., "BEGINNER PACKAGE", "PRO PACKAGE", "ULTIMATE PACKAGE"
    start_date = Column(DateTime, default=func.now())
    end_date = Column(DateTime)
    is_active = Column(Boolean, default=True)
    payment_status = Column(String, default="pending") # e.g., "pending", "paid", "failed"

    owner = relationship("User", back_populates="subscriptions")

class PaymentOrder(Base):
    __tablename__ = "payment_orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    amount = Column(Float)
    currency = Column(String)  # TND, USDT, etc.
    status = Column(String, default="pending")  # pending, initiated, completed, failed, cancelled
    payment_method = Column(String)  # flouci, binance_pay
    gateway_order_id = Column(String, unique=True, nullable=True)
    gateway_response = Column(String, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="payment_orders")
    transactions = relationship("Transaction", back_populates="payment_order")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    payment_order_id = Column(Integer, ForeignKey("payment_orders.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    amount = Column(Float)
    currency = Column(String)
    status = Column(String)  # success, failed, refunded
    payment_method = Column(String)
    gateway_transaction_id = Column(String, unique=True)
    processed_at = Column(DateTime, default=func.now())

    payment_order = relationship("PaymentOrder", back_populates="transactions")
    user = relationship("User", back_populates="transactions")

class CourseModule(Base):
    __tablename__ = "course_modules"
    id = Column(Integer, primary_key=True, index=True)
    formation_id = Column(Integer, ForeignKey("formations.id"))
    title = Column(String, index=True)
    description = Column(String, nullable=True)
    order = Column(Integer, default=0)
    created_at = Column(DateTime, default=func.now())

    formation = relationship("Formation", back_populates="modules")
    lessons = relationship("CourseLesson", back_populates="module", cascade="all, delete-orphan")


class CourseLesson(Base):
    __tablename__ = "course_lessons"
    id = Column(Integer, primary_key=True, index=True)
    module_id = Column(Integer, ForeignKey("course_modules.id"))
    title = Column(String, index=True)
    description = Column(String, nullable=True)
    video_url = Column(String, nullable=True)
    pdf_url = Column(String, nullable=True)
    duration = Column(String, nullable=True)
    order = Column(Integer, default=0)
    created_at = Column(DateTime, default=func.now())

    module = relationship("CourseModule", back_populates="lessons")
    progresses = relationship("UserLessonProgress", back_populates="lesson", cascade="all, delete-orphan")


class UserLessonProgress(Base):
    __tablename__ = "user_lesson_progress"
    __table_args__ = (
        UniqueConstraint("user_id", "lesson_id", name="uq_user_lesson_progress"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    lesson_id = Column(Integer, ForeignKey("course_lessons.id"))
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)
    progress_percent = Column(Float, default=0.0)  # 0 to 100
    last_accessed_at = Column(DateTime, default=func.now(), onupdate=func.now())
    time_spent_seconds = Column(Integer, default=0)
    points_earned = Column(Integer, default=0)

    user = relationship("User")
    lesson = relationship("CourseLesson", back_populates="progresses")


class UserDailyActivity(Base):
    __tablename__ = "user_daily_activity"
    __table_args__ = (
        UniqueConstraint("user_id", "date", name="uq_user_daily_activity_date"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(DateTime(timezone=False), default=func.current_date())
    points_earned = Column(Integer, default=0)
    lessons_completed = Column(Integer, default=0)
    time_spent_minutes = Column(Integer, default=0)

    user = relationship("User")


class Certificate(Base):
    __tablename__ = "certificates"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    formation_id = Column(Integer, ForeignKey("formations.id"), nullable=True)
    certificate_number = Column(String, unique=True, index=True)
    issued_at = Column(DateTime, default=func.now())
    certificate_type = Column(String, default="completion")
    custom_title = Column(String, nullable=True)
    custom_message = Column(String, nullable=True)
    issuer_name = Column(String, nullable=True)
    issued_by_admin_email = Column(String, nullable=True)
    
    user = relationship("User")
    formation = relationship("Formation")

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)
    message = Column(String)
    type = Column(String) # info, success, warning, error
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())

    user = relationship("User", back_populates="notifications")

class PrivateCalendarEvent(Base):
    __tablename__ = "private_calendar_events"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_group = Column(Boolean, default=False) # True if for group, False if private with single student

    created_by = relationship("User", foreign_keys=[created_by_id])
    participants = relationship("PrivateCalendarParticipant", back_populates="event", cascade="all, delete-orphan")

class PrivateCalendarParticipant(Base):
    __tablename__ = "private_calendar_participants"
    __table_args__ = (
        UniqueConstraint("event_id", "user_id", name="uq_event_user"),
    )
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("private_calendar_events.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    event = relationship("PrivateCalendarEvent", back_populates="participants")
    user = relationship("User")

class ChatRoom(Base):
    __tablename__ = "chat_rooms"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    is_group = Column(Boolean, default=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=func.now())

    created_by = relationship("User", foreign_keys=[created_by_id])
    participants = relationship("ChatRoomParticipant", back_populates="chat_room", cascade="all, delete-orphan")
    messages = relationship("ChatMessage", back_populates="chat_room", cascade="all, delete-orphan")

class ChatRoomParticipant(Base):
    __tablename__ = "chat_room_participants"
    __table_args__ = (
        UniqueConstraint("chat_room_id", "user_id", name="uq_chat_room_user"),
    )
    id = Column(Integer, primary_key=True, index=True)
    chat_room_id = Column(Integer, ForeignKey("chat_rooms.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    joined_at = Column(DateTime, default=func.now())

    chat_room = relationship("ChatRoom", back_populates="participants")
    user = relationship("User")

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True, index=True)
    chat_room_id = Column(Integer, ForeignKey("chat_rooms.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(String, nullable=False)
    created_at = Column(DateTime, default=func.now())
    is_read = Column(Boolean, default=False)

    chat_room = relationship("ChatRoom", back_populates="messages")
    sender = relationship("User")
