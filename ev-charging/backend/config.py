import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    FLASK_ENV = os.getenv("FLASK_ENV")
    FLASK_DEBUG = os.getenv("FLASK_DEBUG")
    FLASK_HOST = os.getenv("FLASK_HOST", "127.0.0.1")
    FLASK_PORT = int(os.getenv("FLASK_PORT", 5000))
    SECRET_KEY = os.getenv("SECRET_KEY")
    FIREBASE_CREDENTIALS = os.getenv("FIREBASE_CREDENTIALS")
    FIREBASE_DATABASE_URL = os.getenv(
        "FIREBASE_DATABASE_URL",
        "https://ev-charger-project-1e881-default-rtdb.europe-west1.firebasedatabase.app",
    )
    VIOLATION_LIMIT = int(os.getenv("VIOLATION_LIMIT", 3))
    NO_SHOW_DEADLINE_MINUTES = int(os.getenv("NO_SHOW_DEADLINE_MINUTES", 120))
    DELAY_LIMIT = int(os.getenv("DELAY_LIMIT", 3))