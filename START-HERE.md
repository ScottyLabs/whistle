# Nova judge tool

Unzip this, then open two terminal tabs.

## Tab 1: backend

    cd nova-backend
    python3 -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt
    SHEET_CSV_URL="<published sheet link>" uvicorn main:app --reload --port 8000

## Tab 2: frontend

    cd nova-judge
    npm install
    npm run dev

Open the link the frontend tab prints (usually http://localhost:5173).

You need Node.js and Python 3 installed. Ask Elliott for the sheet link, or make your own sheet with these headers in row 1: timestamp, team name, subteam, members, GitHub link, slideshow link. Then use File > Share > Publish to web > CSV.

Each folder has its own README with more detail.
