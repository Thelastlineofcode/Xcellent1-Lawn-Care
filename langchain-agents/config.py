import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    FLASK_ENV = os.getenv("FLASK_ENV", "production")
    DEBUG = FLASK_ENV == "development"

    # Perplexity
    PPLX_API_KEY = os.getenv("PPLX_API_KEY")
    PPLX_MODEL = os.getenv("PPLX_MODEL", "sonar")

    # Supabase
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY")

    # Zoho
    ZOHO_API_KEY = os.getenv("ZOHO_API_KEY")
    ZOHO_FROM_EMAIL = os.getenv("ZOHO_FROM_EMAIL", "info@xcellent1lawncare.com")

    # Business Pricing
    BASE_PRICE_PER_SQFT = float(os.getenv("BASE_PRICE_PER_SQFT", "0.02"))
    MINIMUM_JOB_PRICE = float(os.getenv("MINIMUM_JOB_PRICE", "35.0"))
