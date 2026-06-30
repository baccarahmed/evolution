
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import List, Optional

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    level: str = "debutant"

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None

class UserAdminUpdate(UserUpdate):
    is_active: Optional[bool] = None
    role: Optional[str] = None
    level: Optional[str] = None

class User(UserBase):
    id: int
    is_active: bool
    role: str
    formations_completed: int
    lives_attended: int
    current_streak: int
    total_points: int
    accessible_formation_ids: List[int] = []

    class Config:
        from_attributes = True

# --- Notification Schemas ---

class NotificationBase(BaseModel):
    title: str
    message: str
    type: str = "info"

class NotificationCreate(NotificationBase):
    user_id: int

class Notification(NotificationBase):
    id: int
    user_id: int
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class UserRoleUpdate(BaseModel):
    role: str

class FormationBase(BaseModel):
    title: str
    description: str
    content: str
    category: str
    price: float
    level: str
    duration: str
    rating: float
    reviews: int
    image_url: Optional[str] = None
    learning_objectives: Optional[str] = None
    prerequisites: Optional[str] = None
    curriculum_data: Optional[str] = None

class FormationCreate(FormationBase):
    pass

class FormationUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    level: Optional[str] = None
    duration: Optional[str] = None
    rating: Optional[float] = None
    reviews: Optional[int] = None
    image_url: Optional[str] = None
    learning_objectives: Optional[str] = None
    prerequisites: Optional[str] = None
    curriculum_data: Optional[str] = None

class Formation(FormationBase):
    id: int
    image: Optional[str] = None
    can_access: bool = True
    is_locked: bool = False
    access_reason: Optional[str] = None

    class Config:
        from_attributes = True

class UserCourseAccessUpdate(BaseModel):
    level: str
    formation_ids: List[int] = []

class UserCourseAccessResponse(BaseModel):
    user_id: int
    level: str
    accessible_formation_ids: List[int]
    formations: List[Formation]

class LiveSessionBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    google_meet_link: str
    is_active: Optional[bool] = True
    is_archived: Optional[bool] = False
    replay_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    formation_id: Optional[int] = None

class LiveSessionCreate(LiveSessionBase):
    pass

class LiveSessionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    google_meet_link: Optional[str] = None
    is_active: Optional[bool] = None
    is_archived: Optional[bool] = None
    replay_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    formation_id: Optional[int] = None

class LiveSession(LiveSessionBase):
    id: int

    class Config:
        from_attributes = True

class UserLiveRegistration(BaseModel):
    id: int
    user_id: int
    live_id: int
    registered_at: datetime

    class Config:
        from_attributes = True

class CalendarEventBase(BaseModel):
    title: str
    day: str
    time: str
    category: str

class CalendarEvent(CalendarEventBase):
    id: int

    class Config:
        from_attributes = True

class SiteSettingBase(BaseModel):
    key: str
    value: str

class SiteSetting(SiteSettingBase):
    id: int

    class Config:
        from_attributes = True

class EliteCircleVideoBase(BaseModel):
    title: str
    description: str
    video_url: str
    thumbnail_url: Optional[str] = None

class EliteCircleVideo(EliteCircleVideoBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class SpotlightBase(BaseModel):
    title: str
    description: str
    image_url: str
    link: Optional[str] = None
    is_active: bool = True

class Spotlight(SpotlightBase):
    id: int

    class Config:
        from_attributes = True

class AuditLogBase(BaseModel):
    admin_email: str
    action: str
    details: str

class AuditLog(AuditLogBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class PricingPlanBase(BaseModel):
    name: str
    slug: str
    price_tnd: float
    price_usd: float
    duration_months: int = 1
    description: Optional[str] = None
    features: str
    is_popular: bool = False
    is_active: bool = True
    button_text: str = "Get Started"

class PricingPlanUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    price_tnd: Optional[float] = None
    price_usd: Optional[float] = None
    duration_months: Optional[int] = None
    description: Optional[str] = None
    features: Optional[str] = None
    is_popular: Optional[bool] = None
    is_active: Optional[bool] = None
    button_text: Optional[str] = None

class PricingPlan(PricingPlanBase):
    id: int
    class Config:
        from_attributes = True

class PromotionBase(BaseModel):
    code: str
    discount_percent: int
    expiry_date: datetime
    is_active: bool = True

class PromotionUpdate(BaseModel):
    code: Optional[str] = None
    discount_percent: Optional[int] = None
    expiry_date: Optional[datetime] = None
    is_active: Optional[bool] = None

class Promotion(PromotionBase):
    id: int
    class Config:
        from_attributes = True

class SubscriptionBase(BaseModel):
    package_name: str
    start_date: datetime
    end_date: datetime
    is_active: bool
    payment_status: str

class SubscriptionCreate(SubscriptionBase):
    user_id: int

class ManualSubscriptionCreate(BaseModel):
    user_email: EmailStr
    package_name: str
    duration_months: int

class SubscriptionUpdate(BaseModel):
    package_name: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: Optional[bool] = None
    payment_status: Optional[str] = None

class Subscription(SubscriptionBase):
    id: int
    user_id: int
    user_email: Optional[str] = None
    user_name: Optional[str] = None

    class Config:
        from_attributes = True

# --- Community Schemas ---

class CommentBase(BaseModel):
    content: str

class CommentCreate(CommentBase):
    post_id: int

class Comment(CommentBase):
    id: int
    post_id: int
    user_id: int
    timestamp: datetime
    author_name: Optional[str] = None

    class Config:
        from_attributes = True

class FormationReviewBase(BaseModel):
    rating: float
    comment: str

class FormationReviewCreate(FormationReviewBase):
    pass

class FormationReview(FormationReviewBase):
    id: int
    formation_id: int
    user_id: int
    created_at: datetime
    author_name: Optional[str] = None

    class Config:
        from_attributes = True

class CommunityPostBase(BaseModel):
    content: str
    type: str = "discussion"

class CommunityPostCreate(CommunityPostBase):
    pass

class CommunityPost(CommunityPostBase):
    id: int
    user_id: int
    is_approved: bool
    likes_count: int
    comments_count: int
    shares_count: int
    timestamp: datetime
    author_name: Optional[str] = None
    author_role: Optional[str] = None
    comments: List[Comment] = []

    class Config:
        from_attributes = True

class PostApprovalUpdate(BaseModel):
    is_approved: bool

# --- Payment Schemas ---

class PaymentOrderBase(BaseModel):
    amount: float
    currency: str
    payment_method: str

class PaymentOrderCreate(PaymentOrderBase):
    pass

class PaymentOrder(PaymentOrderBase):
    id: int
    user_id: int
    status: str
    gateway_order_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TransactionBase(BaseModel):
    amount: float
    currency: str
    status: str
    payment_method: str
    gateway_transaction_id: str

class Transaction(TransactionBase):
    id: int
    payment_order_id: int
    user_id: int
    processed_at: datetime

    class Config:
        from_attributes = True


# --- Course Content Schemas ---

class CourseLessonBase(BaseModel):
    title: str
    description: Optional[str] = None
    video_url: Optional[str] = None
    pdf_url: Optional[str] = None
    duration: Optional[str] = None
    order: int = 0


class CourseLessonCreate(CourseLessonBase):
    module_id: int


class CourseLessonUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    video_url: Optional[str] = None
    pdf_url: Optional[str] = None
    duration: Optional[str] = None
    order: Optional[int] = None


class CourseLesson(CourseLessonBase):
    id: int
    module_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class CourseModuleBase(BaseModel):
    title: str
    description: Optional[str] = None
    order: int = 0


class CourseModuleCreate(CourseModuleBase):
    formation_id: int


class CourseModuleUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    order: Optional[int] = None


class CourseModule(CourseModuleBase):
    id: int
    formation_id: int
    created_at: datetime
    lessons: List[CourseLesson] = []

    class Config:
        from_attributes = True

# --- Certificate Schemas ---

class CertificateBase(BaseModel):
    user_id: int
    formation_id: Optional[int] = None
    certificate_number: str
    certificate_type: str = "completion"
    custom_title: Optional[str] = None
    custom_message: Optional[str] = None
    issuer_name: Optional[str] = None
    issued_by_admin_email: Optional[str] = None

class CertificateCreate(CertificateBase):
    pass


class CertificateIssueRequest(BaseModel):
    user_id: int
    formation_id: Optional[int] = None
    certificate_type: str = "completion"
    custom_title: Optional[str] = None
    custom_message: Optional[str] = None
    issuer_name: Optional[str] = None

class Certificate(CertificateBase):
    id: int
    issued_at: datetime
    user_name: Optional[str] = None
    formation_title: Optional[str] = None

    class Config:
        from_attributes = True

# --- Private Calendar Schemas ---

class PrivateCalendarEventBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    is_group: bool = False

class PrivateCalendarEventCreate(PrivateCalendarEventBase):
    participant_user_ids: List[int] = []

class PrivateCalendarEventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    is_group: Optional[bool] = None
    participant_user_ids: Optional[List[int]] = None

class PrivateCalendarParticipant(BaseModel):
    id: int
    event_id: int
    user_id: int

    class Config:
        from_attributes = True

class PrivateCalendarEvent(PrivateCalendarEventBase):
    id: int
    created_by_id: int
    created_by_name: Optional[str] = None
    participants: List[PrivateCalendarParticipant] = []

    class Config:
        from_attributes = True

# --- Chat Schemas ---

class ChatRoomBase(BaseModel):
    name: str
    is_group: bool = False

class ChatRoomCreate(ChatRoomBase):
    participant_user_ids: List[int] = []

class ChatRoomUpdate(BaseModel):
    name: Optional[str] = None
    is_group: Optional[bool] = None

class ChatRoomParticipant(BaseModel):
    id: int
    chat_room_id: int
    user_id: int
    joined_at: datetime

    class Config:
        from_attributes = True

class ChatMessageBase(BaseModel):
    content: str

class ChatMessageCreate(ChatMessageBase):
    chat_room_id: int

class ChatMessage(ChatMessageBase):
    id: int
    chat_room_id: int
    sender_id: int
    sender_name: Optional[str] = None
    created_at: datetime
    is_read: bool

    class Config:
        from_attributes = True

class ChatRoom(ChatRoomBase):
    id: int
    created_by_id: int
    created_by_name: Optional[str] = None
    created_at: datetime
    participants: List[ChatRoomParticipant] = []
    messages: List[ChatMessage] = []

    class Config:
        from_attributes = True
