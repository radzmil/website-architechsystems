import unittest
import os
from unittest.mock import patch

import app as website
from app import SEO_PAGES, app
from seo_audit import audit


class SeoAuditTests(unittest.TestCase):
    def setUp(self):
        self.database_env = patch.dict(os.environ, {'DATABASE_PUBLIC_URL_DB_ARCHITECH_CORE': ''})
        self.database_env.start()
        self.addCleanup(self.database_env.stop)

    def test_public_pages_pass_audit_and_use_unique_titles(self):
        with app.test_client() as client:
            self.assertEqual(audit(client), [])
            for path, (title, _) in SEO_PAGES.items():
                self.assertIn(f'<title>{title}</title>', client.get(path).get_data(as_text=True))

    def test_detects_missing_description(self):
        with app.test_client() as client:
            original_get = client.get

            def altered_get(path, *args, **kwargs):
                response = original_get(path, *args, **kwargs)
                if path == '/':
                    response.set_data(response.get_data(as_text=True).replace(
                        '<meta name="description"', '<meta name="missing-description"', 1))
                return response

            with patch.object(client, 'get', side_effect=altered_get):
                self.assertIn('/: meta description kosong', audit(client))

    def test_counter_starts_at_798_then_counts_one_per_session(self):
        class Cursor:
            total = None
            def __enter__(self): return self
            def __exit__(self, *args): return False
            def execute(self, sql):
                if 'INSERT INTO website_visitor_counter' in sql and self.total is None:
                    self.total = 797
                if 'UPDATE website_visitor_counter' in sql:
                    self.total += 1
            def fetchone(self): return (self.total,)

        class Connection:
            def __init__(self, cursor): self.cursor_instance = cursor
            def __enter__(self): return self
            def __exit__(self, *args): return False
            def cursor(self): return self.cursor_instance

        cursor = Cursor()
        with patch.dict(os.environ, {'DATABASE_PUBLIC_URL_DB_ARCHITECH_CORE': 'postgresql://test/db'}), \
                patch.object(website.psycopg2, 'connect', return_value=Connection(cursor)):
            client = app.test_client()
            self.assertIn('Visitors: 798', client.get('/').get_data(as_text=True))
            self.assertIn('Visitors: 798', client.get('/pricing').get_data(as_text=True))
            client.get('/robots.txt')
            client.get('/demo-gerak-gempur')
            client.get('/', headers={'User-Agent': 'Googlebot'})
            self.assertEqual(cursor.total, 798)
            self.assertIn('Visitors: 799', app.test_client().get('/').get_data(as_text=True))

    def test_no_database_hides_count_and_demos_are_noindex(self):
        with patch.dict(os.environ, {'DATABASE_PUBLIC_URL_DB_ARCHITECH_CORE': ''}):
            client = app.test_client()
            self.assertNotIn('Visitors:', client.get('/').get_data(as_text=True))
            self.assertIn('noindex, follow', client.get('/demo-gerak-gempur').get_data(as_text=True))
            self.assertNotIn('Disallow: /demo-gerak-gempur', client.get('/robots.txt').get_data(as_text=True))


if __name__ == '__main__':
    unittest.main()