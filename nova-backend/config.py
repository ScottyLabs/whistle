import os

from dotenv import load_dotenv

load_dotenv()

SHEET_CSV_URL = os.environ.get("SHEET_CSV_URL", "")
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
SESSION_SECRET = os.environ.get("SESSION_SECRET", "")
FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173")
# Set COOKIE_SECURE=1 once the site is served over https.
COOKIE_SECURE = os.environ.get("COOKIE_SECURE", "") == "1"

for _name, _value in (
    ("GOOGLE_CLIENT_ID", GOOGLE_CLIENT_ID),
    ("SESSION_SECRET", SESSION_SECRET),
):
    if not _value:
        raise RuntimeError(
            f"{_name} is not set. Add it to nova-backend/.env (see env.example)."
        )
