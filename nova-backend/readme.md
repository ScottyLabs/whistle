# Nova judge tool: backend

FastAPI server that reads hackathon submissions from a published Google Sheet and stores judge notes in SQLite.

## Setup

    cd backend
    python3 -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt

## Run

Publish the submissions sheet as CSV (File > Share > Publish to web > CSV), then start the server with the link:

    SHEET_CSV_URL="<published csv link>" uvicorn main:app --reload --port 8000

The sheet needs these headers in row 1: `timestamp`, `team name`, `subteam`, `members`, `GitHub link`, `slideshow link`.

Do not commit the CSV link or `notes.db`. The link is public to anyone who has it.

## Endpoints

- `GET /api/health`: returns `{"ok": true}`.
- `GET /projects`: one entry per team, built from the sheet. The team name becomes the id, so a duplicate row replaces the earlier one. A blank subteam becomes "Unassigned". Summary fields are empty until the AI step exists.
- `GET /projects/{id}/notes?subteam=...`: shared notes plus that subteam's private notes.
- `POST /projects/{id}/notes`: body is `author`, `subteam`, `feature`, `text`, `shared`.

Interactive docs are at `http://localhost:8000/docs` while the server runs.

## Known gaps

- Subteam is sent by the browser, so private notes are not secure yet. Google sign-in (RFC auth section) should set it server-side.
- The sheet is fetched on every `/projects` request. Add caching if traffic grows.
- AI summaries are not built.