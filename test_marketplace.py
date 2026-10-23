"""Offline checks for the public read-only digital catalog."""
import os
import unittest
from unittest.mock import patch

import app as website


class Cursor:
    def __enter__(self): return self
    def __exit__(self, *args): return False
    def execute(self, sql): self.sql = sql
    def fetchall(self):
        return [(1, 'Koleksi Aset', 'Penerangan', 1990),
                (2, '<script>alert(1)</script>', 'https://drive.google.com/secret', 2500)]


class Connection:
    def __init__(self, cursor): self.test_cursor = cursor
    def __enter__(self): return self
    def __exit__(self, *args): return False
    def cursor(self): return self.test_cursor


class MarketplaceTests(unittest.TestCase):
    def setUp(self):
        self.client = website.app.test_client()

    def test_active_products_and_private_delivery_link_not_selected(self):
        cursor = Cursor()
        with patch.dict(os.environ, {'DATABASE_URL': 'postgresql://test/db'}), patch.object(
                website.psycopg2, 'connect', return_value=Connection(cursor)):
            response = self.client.get('/marketplace')
        self.assertEqual(response.status_code, 200)
        self.assertIn('WHERE active = TRUE', cursor.sql)
        self.assertNotIn('delivery_url', cursor.sql)
        self.assertIn(b'RM19.90', response.data)
        self.assertNotIn(b'<script>alert(1)</script>', response.data)
        self.assertIn(b'&lt;script&gt;', response.data)
        self.assertEqual(response.headers['Cache-Control'], 'no-store')

    def test_missing_database_shows_unavailable(self):
        with patch.dict(os.environ, {}, clear=True):
            response = self.client.get('/marketplace')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'The catalog is unavailable.', response.data)


if __name__ == '__main__':
    unittest.main()