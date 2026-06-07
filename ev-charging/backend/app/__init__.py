from flask import Flask #type:ignore
from firebase_admin import credentials, firestore, db #type:ignore
import firebase_admin #type:ignore
from config import Config

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

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(bookings_bp, url_prefix="/api/bookings")
    app.register_blueprint(queue_bp, url_prefix="/api/queue")
    app.register_blueprint(ports_bp, url_prefix="/api/ports")
    app.register_blueprint(notifications_bp, url_prefix="/api/notifications")
    app.register_blueprint(violations_bp, url_prefix="/api/violations")

    return app