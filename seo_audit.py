"""Audit rendered public pages without external services or credentials."""

from html.parser import HTMLParser
import json
import os
from xml.etree import ElementTree

from app import PUBLIC_URL, SEO_PAGES, app


class PageParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = ''
        self.meta = {}
        self.canonical = []
        self.headings = []
        self.images_without_alt = 0
        self.properties = {}
        self.structured_data = []
        self._json_ld = False
        self._title = False
        self._in_h1 = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'title':
            self._title = True
        elif tag == 'meta' and attrs.get('name'):
            self.meta[attrs['name'].lower()] = attrs.get('content', '')
        elif tag == 'meta' and attrs.get('property'):
            self.properties[attrs['property'].lower()] = attrs.get('content', '')
        elif tag == 'script' and attrs.get('type') == 'application/ld+json':
            self._json_ld = True
            self.structured_data.append('')
        elif tag == 'link' and attrs.get('rel') == 'canonical':
            self.canonical.append(attrs.get('href', ''))
        elif tag == 'h1':
            self.headings.append('')
            self._in_h1 = True
        elif tag == 'img' and not attrs.get('alt', '').strip():
            self.images_without_alt += 1

    def handle_data(self, data):
        if self._title:
            self.title += data
        if self._in_h1:
            self.headings[-1] += data
        if self._json_ld:
            self.structured_data[-1] += data

    def handle_endtag(self, tag):
        if tag == 'title':
            self._title = False
        elif tag == 'h1':
            self._in_h1 = False
        elif tag == 'script':
            self._json_ld = False


def audit(client=None):
    client = client or app.test_client()
    findings = []
    sitemap = client.get('/sitemap.xml')
    if sitemap.status_code != 200:
        findings.append('sitemap.xml: tidak dapat diakses')
    else:
        try:
            root = ElementTree.fromstring(sitemap.data)
            urls = {node.text for node in root.findall('.//{*}loc')}
            if urls != {PUBLIC_URL + path for path in SEO_PAGES}:
                findings.append('sitemap.xml: URL tidak sepadan dengan halaman awam')
        except ElementTree.ParseError:
            findings.append('sitemap.xml: XML tidak sah')
    robots = client.get('/robots.txt')
    if robots.status_code != 200 or 'Sitemap: ' + PUBLIC_URL + '/sitemap.xml' not in robots.get_data(as_text=True):
        findings.append('robots.txt: pautan sitemap tiada')

    for path in SEO_PAGES:
        response = client.get(path)
        if response.status_code != 200:
            findings.append(f'{path}: HTTP {response.status_code}')
            continue
        page = PageParser()
        page.feed(response.get_data(as_text=True))
        if not page.title.strip():
            findings.append(f'{path}: title kosong')
        if not page.meta.get('description', '').strip():
            findings.append(f'{path}: meta description kosong')
        if page.canonical != [PUBLIC_URL + path]:
            findings.append(f'{path}: canonical tidak sepadan')
        if 'noindex' in page.meta.get('robots', '').lower():
            findings.append(f'{path}: noindex pada halaman awam')
        if len(page.headings) != 1 or not page.headings[0].strip():
            findings.append(f'{path}: perlu satu h1 yang tidak kosong')
        if page.images_without_alt:
            findings.append(f'{path}: {page.images_without_alt} imej tanpa alt')
        if page.properties.get('og:url') != PUBLIC_URL + path or not page.properties.get('og:image'):
            findings.append(f'{path}: metadata perkongsian Open Graph tidak lengkap')
        if page.meta.get('twitter:card') != 'summary':
            findings.append(f'{path}: Twitter card tiada')
        try:
            if not any(json.loads(item).get('@type') == 'Organization' for item in page.structured_data):
                findings.append(f'{path}: data berstruktur Organization tiada')
        except (ValueError, AttributeError):
            findings.append(f'{path}: data berstruktur tidak sah')
    return findings


if __name__ == '__main__':
    # Local audit traffic must not change the production visitor total.
    os.environ['DATABASE_PUBLIC_URL_DB_ARCHITECH_CORE'] = ''
    problems = audit()
    if problems:
        for problem in problems:
            print('SEO:', problem)
        raise SystemExit(1)
    print('SEO: semua halaman awam lulus semakan asas.')