
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models, auth
from datetime import datetime, timedelta

def seed_db():
    # Recreate tables
    models.Base.metadata.drop_all(bind=engine)
    models.Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        print("Nettoyage et population de la base de données...")
        
        # 1. Création d'utilisateurs
        print("Création des utilisateurs...")
        hashed_pw = auth.get_password_hash("password123")
        
        users = [
            models.User(
                email='baccarahmed07@gmail.com',
                full_name='Ahmed Baccar',
                hashed_password=hashed_pw,
                role='admin',
                formations_completed=12,
                lives_attended=8,
                current_streak=15,
                total_points=2450
            ),
            models.User(
                email='test@example.com',
                full_name='Jean Test',
                hashed_password=hashed_pw,
                role='standard',
                formations_completed=2,
                lives_attended=1,
                current_streak=3,
                total_points=450
            ),
            models.User(
                email='pro@trader.com',
                full_name='Sophie Trader',
                hashed_password=hashed_pw,
                role='subscriber',
                formations_completed=25,
                lives_attended=45,
                current_streak=120,
                total_points=8900
            )
        ]
        db.add_all(users)
        db.commit()

        # 2. Création de formations
        print("Création des formations...")
        formations = [
            models.Formation(
                title='Trading pour Débutants',
                description='Apprenez les bases du trading, comprenez les marchés financiers et développez votre première stratégie.',
                content='Module 1: Histoire de la finance. Module 2: Les bougies japonaises. Module 3: Supports et Résistances.',
                category='analyse-technique',
                price=99.0,
                level='debutant',
                duration='8 heures',
                rating=4.8,
                reviews=234,
                image_url='https://images.unsplash.com/photo-1611974717482-48a66504b4c1?w=800&q=80'
            ),
            models.Formation(
                title='Analyse Technique Avancée',
                description='Maîtrisez les indicateurs techniques, les patterns chartistes et les stratégies de scalping.',
                content='Module 1: RSI et Divergences. Module 2: Les vagues d\'Elliott. Module 3: Ichimoku Kinko Hyo.',
                category='analyse-technique',
                price=199.0,
                level='avance',
                duration='12 heures',
                rating=4.9,
                reviews=156,
                image_url='https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=800&q=80'
            ),
            models.Formation(
                title='Gestion des Risques',
                description='Apprenez à protéger votre capital et optimiser vos ratios risque/rendement.',
                content='Module 1: Le Stop Loss. Module 2: Calcul de la taille de position. Module 3: Psychologie de la perte.',
                category='risk-management',
                price=79.0,
                level='intermediaire',
                duration='6 heures',
                rating=4.7,
                reviews=89,
                image_url='https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80'
            ),
            models.Formation(
                title='Psychologie du Trading',
                description='Développez la discipline mentale nécessaire pour réussir dans le trading.',
                content='Module 1: Biais cognitifs. Module 2: Discipline et routine. Module 3: Gestion du stress.',
                category='psychology',
                price=69.0,
                level='intermediaire',
                duration='4 heures',
                rating=4.6,
                reviews=67,
                image_url='https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&q=80'
            )
        ]
        db.add_all(formations)
        db.commit()

        # 3. Création d'abonnements
        print("Création des abonnements...")
        ahmed = db.query(models.User).filter(models.User.email == 'baccarahmed07@gmail.com').first()
        sophie = db.query(models.User).filter(models.User.email == 'pro@trader.com').first()
        
        subscriptions = [
            models.Subscription(
                user_id=ahmed.id,
                package_name='ULTIMATE PACKAGE',
                start_date=datetime.now() - timedelta(days=30),
                end_date=datetime.now() + timedelta(days=335),
                is_active=True,
                payment_status='paid'
            ),
            models.Subscription(
                user_id=sophie.id,
                package_name='PRO PACKAGE',
                start_date=datetime.now() - timedelta(days=10),
                end_date=datetime.now() + timedelta(days=355),
                is_active=True,
                payment_status='paid'
            )
        ]
        db.add_all(subscriptions)
        db.commit()

        # 4. Création des paramètres par défaut
        print("Création des paramètres par défaut...")
        default_settings = [
            models.SiteSettings(key='twitter_url', value='https://twitter.com/evolutionacademy'),
            models.SiteSettings(key='linkedin_url', value='https://linkedin.com/company/evolutionacademy'),
            models.SiteSettings(key='instagram_url', value='https://instagram.com/evolutionacademy'),
            models.SiteSettings(key='youtube_url', value='https://youtube.com/evolutionacademy'),
            models.SiteSettings(key='contact_email', value='contact@evolutionacademy.com'),
            models.SiteSettings(key='elite_circle_desc', value='Accès exclusif aux signaux de trading en temps réel.')
        ]
        for s in default_settings:
            # Check if exists to avoid unique constraint error
            if not db.query(models.SiteSettings).filter(models.SiteSettings.key == s.key).first():
                db.add(s)
        db.commit()

        # 5. Création des Spotlights
        print("Création des Spotlights...")
        spotlights = [
            models.Spotlight(
                title='Nouveau: Analyse Order Flow',
                description='Découvrez comment les institutions placent leurs ordres sur le marché.',
                image_url='https://images.unsplash.com/photo-1611974717482-48a66504b4c1?w=800&q=80',
                is_active=True
            ),
            models.Spotlight(
                title='Live de Demain: 09h00',
                description='Analyse de l\'ouverture des marchés européens en direct.',
                image_url='https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=800&q=80',
                is_active=True
            )
        ]
        db.add_all(spotlights)
        db.commit()

        # 6. Création des Plans de Tarification
        print("Création des Plans...")
        plans = [
            models.PricingPlan(
                name='BEGINNER PACKAGE',
                slug='beginner',
                price_tnd=199000.0,
                price_usd=65.0,
                duration_months=1,
                features='["Accès aux bases", "Communauté Discord", "Support 24/7"]',
                is_popular=False,
                button_text='Get Started'
            ),
            models.PricingPlan(
                name='PRO PACKAGE',
                slug='pro',
                price_tnd=499000.0,
                price_usd=165.0,
                duration_months=3,
                features='["Tout du pack Beginner", "Sessions Live Hebdo", "Analyse de Portefeuille"]',
                is_popular=True,
                button_text='Get Started'
            ),
            models.PricingPlan(
                name='ULTIMATE PACKAGE',
                slug='ultimate',
                price_tnd=999000.0,
                price_usd=330.0,
                duration_months=12,
                features='["Tout du pack Pro", "Coaching 1-on-1", "Signaux Elite"]',
                is_popular=False,
                button_text='Get Started'
            )
        ]
        db.add_all(plans)
        db.commit()

        # 7. Création des Promotions
        print("Création des Promotions...")
        promos = [
            models.Promotion(
                code='WELCOME20',
                discount_percent=20,
                expiry_date=datetime.now() + timedelta(days=30),
                is_active=True
            )
        ]
        db.add_all(promos)
        db.commit()

        # 8. Création des vidéos Elite Circle
        print("Création des vidéos Elite Circle...")
        elite_videos = [
            models.EliteCircleVideo(
                title='Stratégie Scalping S&P500',
                description='Masterclass exclusive sur le scalping d\'indices américains.',
                video_url='https://www.youtube.com/watch?v=dQw4w9WgXcQ'
            ),
            models.EliteCircleVideo(
                title='Psychologie du Trading Institutionnel',
                description='Comment pensent les traders de banques.',
                video_url='https://www.youtube.com/watch?v=dQw4w9WgXcQ'
            )
        ]
        db.add_all(elite_videos)
        db.commit()

        # 9. Création des modules et leçons de formation
        print("Création des modules et leçons...")
        # Récupérer les formations
        formation_debutant = db.query(models.Formation).filter(models.Formation.title == 'Trading pour Débutants').first()
        formation_avance = db.query(models.Formation).filter(models.Formation.title == 'Analyse Technique Avancée').first()
        
        if formation_debutant:
            # Modules pour Trading pour Débutants
            modules_debutant = [
                models.CourseModule(
                    formation_id=formation_debutant.id,
                    title='Introduction au Trading',
                    description='Les fondamentaux du trading et des marchés financiers',
                    order=1
                ),
                models.CourseModule(
                    formation_id=formation_debutant.id,
                    title='Les Bougies Japonaises',
                    description='Maîtrisez l\'analyse des chandeliers japonais',
                    order=2
                ),
                models.CourseModule(
                    formation_id=formation_debutant.id,
                    title='Supports et Résistances',
                    description='Identifier les niveaux clés du marché',
                    order=3
                )
            ]
            db.add_all(modules_debutant)
            db.commit()
            
            # Leçons pour chaque module
            lessons_module1 = [
                models.CourseLesson(
                    module_id=modules_debutant[0].id,
                    title='Qu\'est-ce que le Trading ?',
                    description='Découvrez les bases du trading et son fonctionnement',
                    video_url='https://www.w3schools.com/html/mov_bbb.mp4',
                    pdf_url='https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                    duration='15 min',
                    order=1
                ),
                models.CourseLesson(
                    module_id=modules_debutant[0].id,
                    title='Les Marchés Financiers',
                    description='Présentation des différents marchés financiers',
                    video_url='https://www.w3schools.com/html/mov_bbb.mp4',
                    duration='20 min',
                    order=2
                )
            ]
            lessons_module2 = [
                models.CourseLesson(
                    module_id=modules_debutant[1].id,
                    title='Les Bougies de Base',
                    description='Comprendre la structure d\'une bougie japonaise',
                    video_url='https://www.w3schools.com/html/mov_bbb.mp4',
                    pdf_url='https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                    duration='25 min',
                    order=1
                ),
                models.CourseLesson(
                    module_id=modules_debutant[1].id,
                    title='Les Patterns Clés',
                    description='Les patterns de bougies les plus puissants',
                    video_url='https://www.w3schools.com/html/mov_bbb.mp4',
                    duration='30 min',
                    order=2
                )
            ]
            lessons_module3 = [
                models.CourseLesson(
                    module_id=modules_debutant[2].id,
                    title='Identifier les Supports',
                    description='Techniques pour trouver les niveaux de support',
                    video_url='https://www.w3schools.com/html/mov_bbb.mp4',
                    pdf_url='https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                    duration='22 min',
                    order=1
                )
            ]
            
            db.add_all(lessons_module1 + lessons_module2 + lessons_module3)
            db.commit()
        
        if formation_avance:
            # Modules pour Analyse Technique Avancée
            modules_avance = [
                models.CourseModule(
                    formation_id=formation_avance.id,
                    title='RSI et Divergences',
                    description='Maîtrisez l\'indicateur RSI et ses divergences',
                    order=1
                ),
                models.CourseModule(
                    formation_id=formation_avance.id,
                    title='Les Vagues d\'Elliott',
                    description='Théorie des vagues et application pratique',
                    order=2
                )
            ]
            db.add_all(modules_avance)
            db.commit()
            
            # Leçons
            lessons_avance_module1 = [
                models.CourseLesson(
                    module_id=modules_avance[0].id,
                    title='Calcul et Interprétation du RSI',
                    description='Comprendre comment fonctionne le RSI',
                    video_url='https://www.w3schools.com/html/mov_bbb.mp4',
                    pdf_url='https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                    duration='35 min',
                    order=1
                )
            ]
            db.add_all(lessons_avance_module1)
            db.commit()

        print("Seeding terminé avec succès !")

    except Exception as e:
        print(f"Erreur lors du seeding : {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
