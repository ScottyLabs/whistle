import time

import jwt
from fastapi import APIRouter, HTTPException, Request, Response
from google.auth.exceptions import GoogleAuthError
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from pydantic import BaseModel

from config import COOKIE_SECURE, GOOGLE_CLIENT_ID, SESSION_SECRET
from db import db

COOKIE_NAME = "nova_session"
SESSION_SECONDS = 12 * 60 * 60

router = APIRouter(prefix="/auth")


class LoginIn(BaseModel):
    credential: str


def get_user(email: str):
    with db() as conn:
        return conn.execute(
            "SELECT * FROM users WHERE email = ?", (email.strip().lower(),)
        ).fetchone()


def public_user(row) -> dict:
    return {
        "email": row["email"],
        "name": row["name"],
        "role": row["role"],
        "subteam": row["subteam"],
    }


def make_token(email: str) -> str:
    now = int(time.time())
    return jwt.encode(
        {"sub": email, "iat": now, "exp": now + SESSION_SECONDS},
        SESSION_SECRET,
        algorithm="HS256",
    )


def current_user(request: Request) -> dict:
    """FastAPI dependency: returns the signed-in user or raises 401."""
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="Not signed in")
    try:
        payload = jwt.decode(token, SESSION_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Session expired")
    # Look the user up every time so removing a judge takes effect immediately.
    row = get_user(payload.get("sub", ""))
    if not row:
        raise HTTPException(status_code=401, detail="Not signed in")
    return public_user(row)


@router.post("/google")
def google_login(body: LoginIn, response: Response):
    try:
        info = id_token.verify_oauth2_token(
            body.credential, google_requests.Request(), GOOGLE_CLIENT_ID
        )
    except ValueError:
        raise HTTPException(
            status_code=401, detail="Could not verify the Google sign-in"
        )
    except GoogleAuthError:
        raise HTTPException(
            status_code=502, detail="Could not reach Google to verify the sign-in"
        )

    if not info.get("email_verified"):
        raise HTTPException(status_code=401, detail="Google email is not verified")

    row = get_user(info.get("email", ""))
    if not row:
        raise HTTPException(
            status_code=403, detail="This email is not on the judge list"
        )

    response.set_cookie(
        COOKIE_NAME,
        make_token(row["email"]),
        max_age=SESSION_SECONDS,
        httponly=True,
        samesite="lax",
        secure=COOKIE_SECURE,
        path="/",
    )
    return public_user(row)


@router.get("/me")
def me(request: Request):
    try:
        return current_user(request)
    except HTTPException:
        # Not signed in is a normal state for this endpoint, not an error.
        return None


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(COOKIE_NAME, path="/")
    return {"ok": True}
