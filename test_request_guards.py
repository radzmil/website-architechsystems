import unittest
from unittest.mock import patch

from app import app


class RequestGuardTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_cross_origin_post_rejected_before_provider_call(self):
        with patch('app.urlopen') as upstream:
            response = self.client.post('/demo-ai-call-centre/chat',
                                        json={'message': 'Hai'},
                                        headers={'Origin': 'https://other.example'})
        self.assertEqual(response.status_code, 403)
        upstream.assert_not_called()

    def test_same_origin_post_reaches_validation(self):
        response = self.client.post('/demo-ai-call-centre/chat',
                                    json={'message': ''},
                                    headers={'Origin': 'http://localhost'})
        self.assertEqual(response.status_code, 400)

    def test_contact_rejects_oversized_input_without_smtp(self):
        with patch('app.send_contact_emails') as send:
            for data in ({'name': 'n' * 121, 'email': 'a@example.com', 'message': 'Hello'},
                         {'name': 'Name', 'email': 'a@example.com', 'message': 'm' * 4001}):
                response = self.client.post('/contact', data=data)
                self.assertEqual(response.status_code, 400)
            response = self.client.post('/contact', data={'name': 'Name',
                                        'email': 'a@example.com', 'message': 'm' * 9000})
            self.assertEqual(response.status_code, 413)
            send.assert_not_called()

    def test_contact_honeypot_rejected_without_smtp(self):
        with patch('app.send_contact_emails') as send:
            response = self.client.post('/contact', data={
                'name': 'Name', 'email': 'a@example.com', 'message': 'Hello',
                'website': 'spam.example'})
            self.assertEqual(response.status_code, 400)
            send.assert_not_called()


if __name__ == '__main__':
    unittest.main()