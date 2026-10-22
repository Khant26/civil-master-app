from django.test import TestCase


class ChatbotEndpointTests(TestCase):
    """Offline checks only - these tests never call the Gemini API."""

    def test_get_is_rejected(self):
        response = self.client.get('/api/chatbot/', secure=True)
        self.assertEqual(response.status_code, 405)
