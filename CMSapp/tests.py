from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient


class HealthTests(TestCase):
    def test_health_returns_ok_json(self):
        for url in ('/health', '/health/'):
            response = self.client.get(url, secure=True)
            self.assertEqual(response.status_code, 200, url)
            self.assertEqual(response.json(), {'status': 'ok'})


class PublicApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_public_list_endpoints(self):
        for url in (
            '/api/partnerships/',
            '/api/products/',
            '/api/projectreferences/',
            '/api/projectreferences/favorites/',
            '/api/news/',
            '/api/articles/',
        ):
            response = self.client.get(url, secure=True)
            self.assertEqual(response.status_code, 200, url)


class AdminApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        User = get_user_model()
        User.objects.create_superuser('admin', 'admin@example.com', 'test-pass-123')

    def test_admin_endpoints_require_auth(self):
        response = self.client.get('/api/admin/products/', secure=True)
        self.assertIn(response.status_code, (401, 403))

    def test_login_returns_tokens_and_grants_access(self):
        response = self.client.post(
            '/api/admin/login/',
            {'username': 'admin', 'password': 'test-pass-123'},
            format='json',
            secure=True,
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")
        response = self.client.get('/api/admin/products/', secure=True)
        self.assertEqual(response.status_code, 200)
