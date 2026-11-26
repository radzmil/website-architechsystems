"""Offline checks for the Arrestruct demo video section on /arrestruct."""
import os
import unittest
from unittest.mock import patch

import app as website


class DemoVideoResolveTests(unittest.TestCase):
    """URL env tidak boleh menjadi punca XSS — hanya bentuk dikenali diterima."""

    def test_youtube_forms_normalised_to_nocookie_embed(self):
        expected = {'kind': 'embed', 'provider': 'YouTube',
                    'src': 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'}
        for url in ('https://youtu.be/dQw4w9WgXcQ',
                    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                    'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s',
                    'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
                    'https://www.youtube.com/embed/dQw4w9WgXcQ',
                    'https://www.youtube.com/shorts/dQw4w9WgXcQ'):
            self.assertEqual(website.resolve_demo_video(url), expected, url)

    def test_vimeo_forms_normalised_to_player_embed(self):
        expected = {'kind': 'embed', 'provider': 'Vimeo',
                    'src': 'https://player.vimeo.com/video/123456789'}
        for url in ('https://vimeo.com/123456789',
                    'https://www.vimeo.com/123456789',
                    'https://player.vimeo.com/video/123456789'):
            self.assertEqual(website.resolve_demo_video(url), expected, url)

    def test_google_drive_share_link_normalised_to_preview_embed(self):
        expected = {'kind': 'embed', 'provider': 'Google Drive',
                    'src': 'https://drive.google.com/file/d/'
                           '1KnjiBpLkwEwFjB7HsQ2r3uZ-5diuKONR/preview'}
        # Pautan sebenar daripada pengguna + variasi biasa pautan kongsi.
        for url in (
                'https://drive.google.com/file/d/1KnjiBpLkwEwFjB7HsQ2r3uZ-5diuKONR/view?usp=drive_link',
                'https://drive.google.com/file/d/1KnjiBpLkwEwFjB7HsQ2r3uZ-5diuKONR/view?usp=sharing',
                'https://drive.google.com/file/d/1KnjiBpLkwEwFjB7HsQ2r3uZ-5diuKONR/preview',
                'https://drive.google.com/file/d/1KnjiBpLkwEwFjB7HsQ2r3uZ-5diuKONR/edit',
                'https://drive.google.com/open?id=1KnjiBpLkwEwFjB7HsQ2r3uZ-5diuKONR'):
            self.assertEqual(website.resolve_demo_video(url), expected, url)

    def test_google_drive_lookalike_or_invalid_links_rejected(self):
        for url in ('https://drive.google.com/drive/folders/1KnjiBpLkwEwFjB7HsQ2r3uZ-5diuKONR',
                    'https://drive.google.com/file/d/short/view',
                    'https://drive.google.com.evil.test/file/d/1KnjiBpLkwEwFjB7HsQ2r3uZ-5diuKONR/view',
                    'https://drive.google.com/'):
            self.assertIsNone(website.resolve_demo_video(url), url)

    def test_direct_video_file_keeps_url_and_mime(self):
        url = 'https://example.com/demo/arrestruct-demo.mp4'
        self.assertEqual(website.resolve_demo_video(url),
                         {'kind': 'file', 'mime': 'video/mp4', 'src': url})
        self.assertEqual(website.resolve_demo_video(
            'https://example.com/clip.WEBM')['mime'], 'video/webm')
        self.assertEqual(website.resolve_demo_video(
            'https://example.com/clip.ogv')['mime'], 'video/ogg')

    def test_unsafe_or_unknown_urls_rejected(self):
        for url in ('', None,
                    'javascript:alert(1)//arrestruct.mp4',
                    'http://example.com/demo.mp4',
                    'https://user:pass@example.com/demo.mp4',
                    'https://www.youtube.com/watch?v=' + 'x' * 40,
                    'https://evil.test/arrestruct-demo',
                    'https://evil.test/demo.html',
                    "https://example.com/demo.mp4' onerror='alert(1)"):
            self.assertIsNone(website.resolve_demo_video(url), url)


class ArrestructVideoPageTests(unittest.TestCase):
    def setUp(self):
        self.client = website.app.test_client()

    def test_video_section_hidden_when_not_configured(self):
        with patch.object(website, 'ARRESTRUCT_DEMO_VIDEO_URL', ''):
            page = self.client.get('/arrestruct').get_data(as_text=True)
        self.assertEqual(self.client.get('/arrestruct').status_code, 200)
        self.assertNotIn('id="demo"', page)
        self.assertNotIn('Watch Demo Video', page)

    def test_embed_video_rendered_without_cookies_iframe(self):
        with patch.object(website, 'ARRESTRUCT_DEMO_VIDEO_URL',
                          'https://youtu.be/dQw4w9WgXcQ'):
            response = self.client.get('/arrestruct')
        page = response.get_data(as_text=True)
        self.assertEqual(response.status_code, 200)
        self.assertIn('id="demo"', page)
        self.assertIn('href="#demo"', page)
        self.assertIn('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', page)
        self.assertIn('aspect-video', page)
        # Seksyen lain masih hadir — video tidak mengganggu aliran jualan.
        self.assertIn('id="harga"', page)
        self.assertIn('id="langgan"', page)

    def test_direct_file_rendered_with_video_tag(self):
        url = 'https://example.com/arrestruct-demo.mp4'
        with patch.object(website, 'ARRESTRUCT_DEMO_VIDEO_URL', url):
            page = self.client.get('/arrestruct').get_data(as_text=True)
        self.assertIn('<video', page)
        self.assertIn('src="' + url + '"', page)
        self.assertIn('type="video/mp4"', page)
        self.assertNotIn('<iframe', page)

    def test_invalid_url_falls_back_to_no_video(self):
        with patch.object(website, 'ARRESTRUCT_DEMO_VIDEO_URL',
                          'javascript:alert(1)'):
            response = self.client.get('/arrestruct')
        page = response.get_data(as_text=True)
        self.assertEqual(response.status_code, 200)
        self.assertNotIn('id="demo"', page)
        self.assertNotIn('<iframe', page)


if __name__ == '__main__':
    unittest.main()
