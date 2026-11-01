"""Load judge and admin accounts from a CSV into the users table.

Usage (run from the nova-backend folder, the same place you run uvicorn):

    python load_users.py judges.csv

CSV headers: email, name, role, subteam
  - role is "judge" or "admin" (blank means judge)
  - judges need a subteam, and it must match the subteam spelling in the
    submissions sheet exactly (same capitalization)
  - re-running updates existing emails, so you can fix typos and reload
"""
import csv
import sys

from db import db, init_db


def main(path: str) -> int:
    rows = []
    problems = []

    with open(path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for line_no, raw in enumerate(reader, start=2):
            row = {(k or "").strip().lower(): (v or "").strip() for k, v in raw.items()}
            email = row.get("email", "").lower()
            name = row.get("name", "")
            role = (row.get("role") or "judge").lower()
            subteam = row.get("subteam", "")

            if not email and not name:
                continue  # blank line
            if "@" not in email:
                problems.append(f"line {line_no}: '{email}' is not a valid email")
            if not name:
                problems.append(f"line {line_no}: name is missing")
            if role not in ("judge", "admin"):
                problems.append(f"line {line_no}: role must be judge or admin")
            if role == "judge" and not subteam:
                problems.append(f"line {line_no}: judges need a subteam")
            rows.append((email, name, role, subteam))

    if problems:
        print("Nothing was loaded. Fix these and run again:")
        for p in problems:
            print(" ", p)
        return 1

    init_db()
    with db() as conn:
        for email, name, role, subteam in rows:
            conn.execute(
                "INSERT INTO users (email, name, role, subteam) VALUES (?, ?, ?, ?) "
                "ON CONFLICT(email) DO UPDATE SET "
                "name = excluded.name, role = excluded.role, subteam = excluded.subteam",
                (email, name, role, subteam),
            )
    print(f"Loaded {len(rows)} user(s).")
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python load_users.py judges.csv")
        sys.exit(2)
    sys.exit(main(sys.argv[1]))
