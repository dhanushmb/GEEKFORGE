import unittest
from unittest.mock import patch

import httpx
from google import genai
from google.genai import errors, types

from app.services.career_ai import ask_career_ai


class MentorRecoveryTests(unittest.TestCase):
    def run_transport(self, failures):
        calls = []

        def handle(request):
            calls.append(request)
            if len(calls) <= len(failures):
                failure = failures[len(calls) - 1]
                if isinstance(failure, Exception):
                    raise failure
                return httpx.Response(failure, json={"error": {"code": failure, "message": "Test provider error"}})
            return httpx.Response(200, json={"candidates": [{
                "content": {"role": "model", "parts": [{"text": "Explore civil engineering."}]},
                "finishReason": "STOP",
            }]})

        client = genai.Client(api_key="test-key", http_options=types.HttpOptions(
            httpx_client=httpx.Client(transport=httpx.MockTransport(handle)),
        ))
        self.addCleanup(client.close)
        self.calls = calls
        with patch('app.services.career_ai.get_gemini_client', return_value=client), patch('time.sleep'):
            return ask_career_ai('What does a civil engineer do?')

    def test_dns_failure_recovers_without_changing_model(self):
        answer = self.run_transport([httpx.ConnectError('getaddrinfo failed'), httpx.ConnectError('getaddrinfo failed')])
        self.assertEqual(answer, 'Explore civil engineering.')
        self.assertEqual(len(self.calls), 3)
        self.assertEqual(len({str(request.url) for request in self.calls}), 1)

    def test_busy_provider_is_retried(self):
        self.assertEqual(self.run_transport([503]), 'Explore civil engineering.')
        self.assertEqual(len(self.calls), 2)

    def test_persistent_network_failure_stops_after_three_attempts(self):
        with self.assertRaises(httpx.ConnectError):
            self.run_transport([httpx.ConnectError('offline')] * 5)
        self.assertEqual(len(self.calls), 3)

    def test_invalid_key_is_not_retried(self):
        with self.assertRaises(errors.ClientError):
            self.run_transport([403])
        self.assertEqual(len(self.calls), 1)


if __name__ == '__main__':
    unittest.main()
