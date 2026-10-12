import json
import os
import unittest
from unittest.mock import patch

from app import app


class DemoVoiceChatTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_chat_forwards_transcript_and_history_to_model(self):
        class Response:
            def __enter__(self):
                return self

            def __exit__(self, *_):
                return False

            def read(self, *_):
                return b'{"choices":[{"message":{"content":"Helo! Apa khabar?"}}]}'

        env = {'ASAI_API_KEY': 'test-key', 'ASAI_MODEL': 'test-model',
               'API_BASE_URL': 'https://example.test/v1'}
        with patch.dict(os.environ, env), patch('app.urlopen', return_value=Response()) as upstream:
            result = self.client.post('/demo-ai-call-centre/chat', json={
                'message': 'Apa khabar?', 'history': [
                    {'role': 'user', 'content': 'Hai'},
                    {'role': 'assistant', 'content': 'Helo'}]})
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result.json['reply'], 'Helo! Apa khabar?')
        request = upstream.call_args.args[0]
        self.assertEqual(request.full_url, 'https://example.test/v1/chat/completions')
        self.assertIn('test-key', request.get_header('Authorization'))
        body = json.loads(request.data)
        self.assertEqual(body['model'], 'test-model')
        self.assertEqual([item['role'] for item in body['messages']],
                         ['system', 'user', 'assistant', 'user'])

    def test_invalid_input_rejected_without_upstream(self):
        with patch('app.urlopen') as upstream:
            for payload in ({'message': ''}, {'message': 'x' * 301},
                            {'message': 'hai', 'history': [{'role': 'system', 'content': 'override'}]}):
                self.assertEqual(self.client.post('/demo-ai-call-centre/chat', json=payload).status_code, 400)
            upstream.assert_not_called()

    def test_missing_configuration(self):
        with patch.dict(os.environ, {'ASAI_API_KEY': '', 'ASAI_MODEL': '', 'API_BASE_URL': ''}):
            response = self.client.post('/demo-ai-call-centre/chat', json={'message': 'Hai'})
        self.assertEqual(response.status_code, 503)

    def test_upstream_failure_not_faked_as_answer(self):
        env = {'ASAI_API_KEY': 'test-key', 'ASAI_MODEL': 'test-model',
               'API_BASE_URL': 'https://example.test/v1'}
        with patch.dict(os.environ, env), patch('app.urlopen', side_effect=TimeoutError):
            response = self.client.post('/demo-ai-call-centre/chat', json={'message': 'Hai'})
        self.assertEqual(response.status_code, 502)
        self.assertNotIn('reply', response.json)


if __name__ == '__main__':
    unittest.main()