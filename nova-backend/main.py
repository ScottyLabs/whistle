import csv
import io
import re

import httpx
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from auth import current_user
from auth import router as auth_router
from config import FRONTEND_ORIGIN, SHEET_CSV_URL
from db import db, init_db

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
app.include_router(auth_router)

init_db()


class NoteIn(BaseModel):
    # Author and subteam come from the signed-in user, not from the request.
    feature: str = Field(default="", max_length=200)
    text: str = Field(min_length=1, max_length=2000)
    shared: bool = False


def note_row(r):
    return {
        "id": r["id"],
        "projectId": r["project_id"],
        "author": r["author"],
        "subteam": r["subteam"],
        "feature": r["feature"],
        "text": r["text"],
        "shared": bool(r["shared"]),
    }


def slugify(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


@app.get("/api/health")
def health():
    return {"ok": True}


@app.get("/projects")
def projects(user: dict = Depends(current_user)):
    if not SHEET_CSV_URL:
        raise HTTPException(status_code=500, detail="SHEET_CSV_URL is not set")
    try:
        resp = httpx.get(SHEET_CSV_URL, follow_redirects=True, timeout=15)
        resp.raise_for_status()
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Could not fetch the sheet")

    text = resp.content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))

    latest = {}
    for raw in reader:
        row = {(k or "").strip().lower(): (v or "").strip() for k, v in raw.items()}
        team = row.get("team name", "")
        if not team:
            continue
        latest[slugify(team)] = row

    return [
        {
            "id": pid,
            "teamName": row.get("team name", ""),
            "subteam": row.get("subteam") or "Unassigned",
            "githubLink": row.get("github link", ""),
            "slideshowLink": row.get("slideshow link", ""),
            "oneLiner": "",
            "whatItDoes": "",
            "features": [],
            "gaps": [],
        }
        for pid, row in latest.items()
    ]


@app.get("/projects/{project_id}/notes")
def list_notes(project_id: str, user: dict = Depends(current_user)):
    with db() as conn:
        if user["role"] == "admin":
            rows = conn.execute(
                "SELECT * FROM notes WHERE project_id = ? ORDER BY id",
                (project_id,),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM notes WHERE project_id = ? "
                "AND (shared = 1 OR subteam = ?) ORDER BY id",
                (project_id, user["subteam"]),
            ).fetchall()
    return [note_row(r) for r in rows]


@app.post("/projects/{project_id}/notes")
def add_note(project_id: str, note: NoteIn, user: dict = Depends(current_user)):
    with db() as conn:
        cur = conn.execute(
            "INSERT INTO notes (project_id, author, subteam, feature, text, shared) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (
                project_id,
                user["name"],
                user["subteam"],
                note.feature,
                note.text,
                int(note.shared),
            ),
        )
        row = conn.execute(
            "SELECT * FROM notes WHERE id = ?", (cur.lastrowid,)
        ).fetchone()
    return note_row(row)
