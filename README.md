# GEEKFORGE-AARAMBH
GEEKFORGE AARAMBH - AI Innovation Hackathon Project | 36-hour development 

## Run the application

The React frontend is in `frontend/`; the FastAPI and Gemini backend is in
`ai-engine/`.

1. Copy `ai-engine/.env.example` to `ai-engine/.env` and set `GEMINI_API_KEY`
   to your own Gemini API key. Set `FRONTEND_ORIGINS` to the comma-separated
   frontend origins that should be allowed. Keep the key out of source control.
2. Install backend requirements with Python 3.11 or newer:

   ```powershell
   python -m pip install -r ai-engine/requirements.txt
   ```

3. Start the API from the repository root:

   ```powershell
   python -m uvicorn app.main:app --app-dir ai-engine --reload --host 127.0.0.1 --port 8000
   ```

4. Configure the persistent local account database if you do not want the
   default `~/.disha/accounts.sqlite3` location:

   ```text
   DISHA_AUTH_DATABASE=/path/to/accounts.sqlite3
   ```

5. Install and start the frontend in another terminal:

   ```powershell
   cd frontend
   npm install
   Copy-Item .env.example .env.local
   npm run dev
   ```

   Set `VITE_API_BASE_URL=http://localhost:8000` in `frontend/.env.local`.
   Vite's default `http://localhost:5173` is allowed by the API.

Create an account or sign in at `/login`. Registration accepts an email, a
phone number, or both; sign-in accepts either. Passwords must be at least six
characters. Account passwords are stored as salted PBKDF2 hashes, and the API
uses expiring bearer sessions. Keep the database file private and back it up.

The API exposes `/health`, `/api/auth/signup`, `/api/auth/login`,
`/api/auth/me`, `/api/auth/logout`, `/api/careers`, `/api/career/chat`,
`/api/career/recommend`, `/api/image/analyze`, `/api/video/explore`, and
`/api/voice/transcribe`. Voice recordings are limited to 30 seconds and sent
to the configured Gemini API for transcription. API endpoints other than
health and account creation/sign-in require an authenticated session.
Profiles and saved careers remain in the browser's local storage.

## Dataset-assisted career matching

The Career Finder on `/discover` now retrieves relevant education pathways and
learning courses from the five supplied CSV snapshots in
`ai-engine/app/data/datasets/`. Select an exam and category to add college cutoff
references; an optional rank enables a historical comparison. Each recommendation
can expand its supporting records, including the original source row and course
provider link. English and Kannada guidance are supported.

Cutoff references preserve exam, category, quota, year and round. Missing dates
stay unknown, mock rounds remain labelled, and rank comparisons do not establish
admission eligibility. The file named `KCET_cutoff_combined.csv` contains PGCET
records and is handled accordingly. See the dataset folder's README for source
interpretation and refresh instructions. Restart the API after replacing a CSV.

Run backend checks with `python -m unittest discover -s tests -v` from `ai-engine/`;
run `npm run build` and `npm run lint` from `frontend/`.
"# GEEKFORGE-AAHRAMBH" 
