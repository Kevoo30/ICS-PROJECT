from flask import Flask
from firebase_admin import credentials, firestore, db
import firebase_admin
from config import Config
from apscheduler.schedulers.background import BackgroundScheduler

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize Firebase Admin SDK
    cred = credentials.Certificate(app.config["FIREBASE_CREDENTIALS"])
    firebase_admin.initialize_app(cred, {
        "databaseURL": "https://ev-charger-project-1e881-default-rtdb.europe-west1.firebasedatabase.app"
    })

    # Initialize Firestore
    app.db = firestore.client()

    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.bookings import bookings_bp
    from app.routes.queue import queue_bp
    from app.routes.ports import ports_bp
    from app.routes.notifications import notifications_bp
    from app.routes.violations import violations_bp
    from app.routes.sessions import sessions_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(bookings_bp, url_prefix="/api/bookings")
    app.register_blueprint(queue_bp, url_prefix="/api/queue")
    app.register_blueprint(ports_bp, url_prefix="/api/ports")
    app.register_blueprint(notifications_bp, url_prefix="/api/notifications")
    app.register_blueprint(violations_bp, url_prefix="/api/violations")
    app.register_blueprint(sessions_bp, url_prefix="/api/sessions")

    # Start background scheduler
    scheduler = BackgroundScheduler()

    from app.services.queue_service import check_no_show_deadlines
    scheduler.add_job(
        func=check_no_show_deadlines,
        trigger="interval",
        minutes=10,
        id="no_show_checker",
        replace_existing=True
    )

    scheduler.start()

    return app