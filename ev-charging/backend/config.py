import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    FLASK_ENV = os.getenv("FLASK_ENV")
    FLASK_DEBUG = os.getenv("FLASK_DEBUG")
    SECRET_KEY = os.getenv("SECRET_KEY")
    FIREBASE_CREDENTIALS = os.getenv("FIREBASE_CREDENTIALS")
    VIOLATION_LIMIT = int(os.getenv("VIOLATION_LIMIT", 3))
    NO_SHOW_DEADLINE_MINUTES = int(os.getenv("NO_SHOW_DEADLINE_MINUTES", 120))
    DELAY_LIMIT = int(os.getenv("DELAY_LIMIT", 3))