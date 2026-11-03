import json
import os
import sqlite3
import tempfile
import unittest
import wave
from io import BytesIO
from unittest.mock import patch

import httpx
from google.genai import errors as genai_errors
from fastapi.testclient import TestClient

from app.main import app
from app.routes.auth import get_auth_store
from app.services.gemini import get_gemini_client


class ApiTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.previous_database = os.environ.get("DISHA_AUTH_DATABASE")
        os.environ["DISHA_AUTH_DATABASE"] = os.path.join(
            self.temp_dir.name, "accounts.sqlite3"
        )
        get_auth_store.cache_clear()
        self.client = TestClient(app)
        signup = self.client.post(
            "/api/auth/signup",
            json={
                "email": "test@example.com",
                "phone": "+14155550123",
                "password": "valid-123",
            },
        )
        self.assertEqual(signup.status_code, 201)
        self.client.headers.update(
            {"Authorization": f"Bearer {signup.json()['token']}"}
        )

    def tearDown(self):
        self.client.close()
        get_auth_store.cache_clear()
        if self.previous_database is None:
            os.environ.pop("DISHA_AUTH_DATABASE", None)
        else:
            os.environ["DISHA_AUTH_DATABASE"] = self.previous_database
        self.temp_dir.cleanup()

    def test_signup_accepts_email_or_phone_and_signs_in(self):
        signup = self.client.post(
            "/api/auth/signup",
            json={"phone": "+14155550124", "password": "six789"},
        )
        self.assertEqual(signup.status_code, 201)
        self.assertEqual(signup.json()["user"]["phone"], "+14155550124")

        login = self.client.post(
            "/api/auth/login",
            json={"identifier": "+14155550124", "password": "six789"},
        )
        self.assertEqual(login.status_code, 200)

    def test_signup_rejects_short_password(self):
        response = self.client.post(
            "/api/auth/signup",
            json={"email": "short@example.com", "password": "12345"},
        )
        self.assertEqual(response.status_code, 422)

    def test_signup_rejects_duplicate_identifier(self):
        response = self.client.post(
            "/api/auth/signup",
            json={"email": "TEST@example.com", "password": "valid-123"},
        )
        self.assertEqual(response.status_code, 409)

    def test_account_update_trigger_refreshes_timestamp(self):
        account = self.client.post(
            "/api/auth/signup",
            json={"email": "trigger@example.com", "password": "valid-123"},
        ).json()["user"]
        store = get_auth_store()
        connection = sqlite3.connect(store.path)
        try:
            with connection:
                connection.execute(
                    "UPDATE accounts SET updated_at = 0 WHERE id = ?",
                    (account["id"],),
                )
                connection.execute(
                    "UPDATE accounts SET name = 'Updated' WHERE id = ?",
                    (account["id"],),
                )
                updated_at = connection.execute(
                    "SELECT updated_at FROM accounts WHERE id = ?",
                    (account["id"],),
                ).fetchone()[0]
        finally:
            connection.close()
        self.assertGreater(updated_at, 0)

    def test_login_accepts_email_and_phone(self):
        for identifier in ("TEST@example.com", "+1 (415) 555-0123"):
            response = self.client.post(
                "/api/auth/login",
                json={"identifier": identifier, "password": "valid-123"},
            )
            self.assertEqual(response.status_code, 200)

    def test_login_rejects_invalid_credentials(self):
        response = self.client.post(
            "/api/auth/login",
            json={"identifier": "test@example.com", "password": "incorrect"},
        )
        self.assertEqual(response.status_code, 401)

    def test_api_routes_require_a_valid_session(self):
        with TestClient(app) as client:
            response = client.get("/api/careers")
        self.assertEqual(response.status_code, 401)

    def test_logout_revokes_the_session(self):
        response = self.client.post("/api/auth/logout")
        self.assertEqual(response.status_code, 204)
        response = self.client.get("/api/auth/me")
        self.assertEqual(response.status_code, 401)

    def test_gemini_client_is_reused_between_requests(self):
        get_gemini_client.cache_clear()
        try:
            with (
                patch.dict(os.environ, {"GEMINI_API_KEY": "test-key"}),
                patch("app.services.gemini.genai.Client") as client_factory,
            ):
                first_client = get_gemini_client()
                second_client = get_gemini_client()

            self.assertIs(first_client, second_client)
            client_factory.assert_called_once()
        finally:
            get_gemini_client.cache_clear()

    def test_health(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "healthy"})

    def test_career_catalog_matches_frontend_shape(self):
        response = self.client.get("/api/careers")
        self.assertEqual(response.status_code, 200)
        careers = response.json()["careers"]
        self.assertEqual(len(careers), 8)
        self.assertTrue(
            all(
                {
                    "slug",
                    "title",
                    "domain",
                    "description",
                    "mark",
                    "tone",
                    "skills",
                    "education",
                    "salary",
                }.issubset(career)
                for career in careers
            )
        )

    @patch("app.main.ask_career_ai", return_value="Explore civil engineering.")
    def test_chat_contract(self, ask_career_ai):
        response = self.client.post(
            "/api/career/chat",
            json={
                "question": "What does a civil engineer do?",
                "language": "English",
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {"answer": "Explore civil engineering.", "source": "gemini"},
        )
        ask_career_ai.assert_called_once_with(
            "What does a civil engineer do?", "English"
        )

    @patch(
        "app.main.recommend_careers",
        return_value=json.dumps(
            {
                "recommendations": [
                    {
                        "career": "Engineer",
                        "description": "Build useful things.",
                        "why_suitable": "Matches the student's interests.",
                        "skills_to_learn": ["Maths"],
                        "education_pathway": "Study engineering.",
                        "first_step": "Try a small project.",
                    }
                ]
            }
        ),
    )
    def test_recommendation_contract(self, recommend_careers):
        response = self.client.post(
            "/api/career/recommend",
            json={
                "interests": ["building"],
                "subjects": ["maths"],
                "skills": ["problem solving"],
                "class_level": "Class 12",
                "language": "English",
            },
        )
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["source"], "gemini")
        self.assertEqual(payload["recommendations"][0]["career"], "Engineer")
        recommend_careers.assert_called_once()

    def test_chat_rejects_empty_question(self):
        response = self.client.post("/api/career/chat", json={"question": ""})
        self.assertEqual(response.status_code, 422)

    def test_chat_distinguishes_network_quota_configuration_and_busy_errors(self):
        cases = [
            (httpx.ConnectError('getaddrinfo failed'), 'mentor_network'),
            (httpx.ReadTimeout('timed out'), 'mentor_network'),
            (genai_errors.APIError(429, {'error': {'message': 'private quota details'}}), 'mentor_rate_limited'),
            (genai_errors.APIError(403, {'error': {'message': 'private key details'}}), 'mentor_configuration'),
            (genai_errors.APIError(503, {'error': {'message': 'high demand'}}), 'mentor_busy'),
        ]
        for exception, code in cases:
            with self.subTest(code=code), patch('app.main.ask_career_ai', side_effect=exception):
                response = self.client.post('/api/career/chat', json={'question': 'How do I become an engineer?'})
            self.assertEqual(response.status_code, 503)
            self.assertEqual(response.json()['code'], code)
            self.assertNotIn('private', response.text)

    @patch('app.main.ask_career_ai', return_value='   ')
    def test_empty_chat_reply_keeps_specific_error(self, ask_career_ai):
        response = self.client.post('/api/career/chat', json={'question': 'Tell me about engineering.'})
        self.assertEqual(response.status_code, 502)
        self.assertIn('empty response', response.json()['detail'])

    @patch("app.main.ask_career_ai", return_value="ವೃತ್ತಿ ಆಯ್ಕೆಗಳ ಬಗ್ಗೆ ತಿಳಿಯೋಣ.")
    def test_chat_passes_kannada_language(self, ask_career_ai):
        response = self.client.post(
            "/api/career/chat",
            json={
                "question": "ವೃತ್ತಿ ಆಯ್ಕೆಗಳ ಬಗ್ಗೆ ತಿಳಿಸಿ",
                "language": "Kannada",
            },
        )
        self.assertEqual(response.status_code, 200)
        ask_career_ai.assert_called_once_with(
            "ವೃತ್ತಿ ಆಯ್ಕೆಗಳ ಬಗ್ಗೆ ತಿಳಿಸಿ", "Kannada"
        )

    def test_chat_rejects_unsupported_language(self):
        response = self.client.post(
            "/api/career/chat",
            json={"question": "What does a civil engineer do?", "language": "Hindi"},
        )
        self.assertEqual(response.status_code, 422)

    @patch("app.main.ask_career_ai", side_effect=RuntimeError("AI unavailable"))
    def test_chat_reports_ai_failure(self, ask_career_ai):
        response = self.client.post(
            "/api/career/chat",
            json={
                "question": "What does a civil engineer do?",
                "language": "English",
            },
        )
        self.assertEqual(response.status_code, 502)
        self.assertIn("temporarily unavailable", response.json()["detail"])
        ask_career_ai.assert_called_once_with(
            "What does a civil engineer do?", "English"
        )

    def test_video_rejects_non_youtube_urls(self):
        response = self.client.post(
            "/api/video/explore",
            json={"url": "https://example.com/watch?v=abcdefghijk"},
        )
        self.assertEqual(response.status_code, 400)

    def test_image_rejects_non_image_upload(self):
        response = self.client.post(
            "/api/image/analyze",
            files={"image": ("notes.txt", b"not an image", "text/plain")},
        )
        self.assertEqual(response.status_code, 400)

    def test_voice_rejects_non_wav_upload(self):
        response = self.client.post(
            "/api/voice/transcribe",
            files={"audio": ("voice.webm", b"not wav", "audio/webm")},
            data={"language": "en-IN"},
        )
        self.assertEqual(response.status_code, 415)

    @patch("app.routes.voice.get_gemini_client")
    def test_voice_transcription_returns_transcript(self, get_client):
        wav_data = BytesIO()
        with wave.open(wav_data, "wb") as wav:
            wav.setnchannels(1)
            wav.setsampwidth(2)
            wav.setframerate(16000)
            wav.writeframes(b"\x00\x00" * 160)

        get_client.return_value.models.generate_content.return_value.text = (
            "What does a civil engineer do?"
        )
        response = self.client.post(
            "/api/voice/transcribe",
            files={"audio": ("voice.wav", wav_data.getvalue(), "audio/wav")},
            data={"language": "en-IN"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {"transcript": "What does a civil engineer do?"},
        )

    def test_cors_allows_vite_default_origin(self):
        response = self.client.options(
            "/api/career/chat",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "POST",
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.headers["access-control-allow-origin"],
            "http://localhost:5173",
        )


if __name__ == "__main__":
    unittest.main()
