"""Zoho email tool using ZeptoMail API."""
import requests
import json
import os
import sys

# Attempt imports to handle different execution contexts
try:
    from config import Config
except ImportError:
    try:
        from ..config import Config
    except ImportError:
        # Fallback for direct execution
        sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        from config import Config


def send_email(to: str, subject: str, body: str):
    """
    Sends an email using the ZeptoMail API.

    Args:
        to (str): Recipient email address.
        subject (str): Email subject.
        body (str): HTML body of the email.

    Returns:
        dict: Status and response details.
    """
    # ZeptoMail API endpoint (US)
    url = "https://api.zeptomail.com/v1.1/email"

    api_key = Config.ZOHO_API_KEY
    from_email = Config.ZOHO_FROM_EMAIL
    from_name = getattr(Config, "ZOHO_FROM_NAME", "Xcellent1 Lawn Care")

    if not api_key:
        return {"status": "error", "message": "ZOHO_API_KEY not configured"}

    headers = {
        "Authorization": api_key,
        "Content-Type": "application/json",
        "Accept": "application/json"
    }

    payload = {
        "from": {
            "address": from_email,
            "name": from_name
        },
        "to": [
            {
                "email_address": {
                    "address": to
                }
            }
        ],
        "subject": subject,
        "htmlbody": body
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        response.raise_for_status()
        return {"status": "success", "data": response.json()}
    except requests.exceptions.RequestException as e:
        error_details = None
        if 'response' in locals() and response is not None:
            try:
                error_details = response.text
            except ValueError:
                pass

        return {
            "status": "error",
            "message": str(e),
            "details": error_details,
            "to": to
        }
