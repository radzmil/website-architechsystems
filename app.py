import logging
import json
import os
import smtplib
import ssl
from email.message import EmailMessage
from email.utils import parseaddr
from xml.etree.ElementTree import Element, SubElement, tostring
from urllib.parse import urlsplit
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from pathlib import Path

from flask import Flask, render_template, request, flash, redirect, url_for, Response, jsonify

# Local development only: hosting environment variables take precedence.
_local_env = Path(__file__).with_name('.env')
if _local_env.is_file():
    for _line in _local_env.read_text(encoding='utf-8-sig').splitlines():
        _line = _line.strip()
        if not _line or _line.startswith('#') or '=' not in _line:
            continue
        _name, _value = _line.split('=', 1)
        _name = _name.strip()
        if _name in ('ASAI_API_KEY', 'ASAI_MODEL', 'API_BASE_URL',
                     'DEEPGRAM_API_KEY', 'CARTESIA_API_KEY', 'CARTESIA_VOICE_ID'):
            os.environ.setdefault(_name, _value.strip().strip('"\''))

app = Flask(__name__)
# Require a persistent secret in production; never use a publicly known fallback.
app.secret_key = os.environ.get('SECRET_KEY') or os.urandom(32)

SUPPORT_EMAIL = 'support@architechsystems.my'
PUBLIC_URL = 'https://www.architechsystems.my'
SEO_PAGES = {
    '/': ('Architech Systems | Business Automation in Malaysia', 'Architech Systems builds business automation, WhatsApp solutions and software systems for Malaysian organisations.'),
    '/solutions': ('Business Automation Solutions | Architech Systems Malaysia', 'Explore software engineering, WhatsApp automation and business system solutions by Architech Systems in Malaysia.'),
    '/pricing': ('Products and Subscriptions | Architech Systems Malaysia', 'Explore Architech Systems products, subscriptions and interactive demonstrations for businesses in Malaysia.'),
    '/about': ('About Architech Systems | Malaysian Software Engineering', 'Learn about Architech Systems, a registered software engineering business in Malaysia.'),
    '/policy': ('Privacy Policy and Terms | Architech Systems', 'Read the privacy policy and service terms for Architech Systems.'),
    '/contact': ('Contact Architech Systems | Malaysia', 'Contact Architech Systems about business automation and software solutions in Malaysia.'),
}


@app.context_processor
def seo_context():
    title, description = SEO_PAGES.get(request.path, ('Architech Systems Demo', 'Explore a simulated Architech Systems product demonstration.'))
    return dict(seo_title=title, seo_description=description,
                seo_canonical=PUBLIC_URL + request.path,
                seo_noindex=request.path not in SEO_PAGES,
                analytics_enabled=os.environ.get('VERCEL_WEB_ANALYTICS') == 'true')


@app.route('/robots.txt')
def robots():
    return Response('User-agent: *\nAllow: /\nDisallow: /demo-dashboard\nDisallow: /demo-gerak-gempur\nSitemap: ' + PUBLIC_URL + '/sitemap.xml\n', mimetype='text/plain')


@app.route('/sitemap.xml')
def sitemap():
    root = Element('urlset', xmlns='http://www.sitemaps.org/schemas/sitemap/0.9')
    for path in SEO_PAGES:
        SubElement(SubElement(root, 'url'), 'loc').text = PUBLIC_URL + path
    return Response(tostring(root, encoding='utf-8', xml_declaration=True), mimetype='application/xml')


def send_contact_emails(name, email, message):
    host = os.environ.get('SMTP_HOST')
    username = os.environ.get('SMTP_USERNAME')
    password = os.environ.get('SMTP_PASSWORD')
    if not all((host, username, password)):
        raise RuntimeError('SMTP_HOST, SMTP_USERNAME and SMTP_PASSWORD must be configured')

    port = int(os.environ.get('SMTP_PORT', '587'))
    use_ssl = os.environ.get('SMTP_SSL', 'false').lower() == 'true'

    incoming = EmailMessage()
    incoming['From'] = SUPPORT_EMAIL
    incoming['To'] = SUPPORT_EMAIL
    incoming['Reply-To'] = email
    incoming['Subject'] = 'Mesej baharu daripada borang Hubungi Architech Systems'
    incoming.set_content(f'Nama: {name}\nE-mel: {email}\n\nMesej:\n{message}')

    reply = EmailMessage()
    reply['From'] = SUPPORT_EMAIL
    reply['To'] = email
    reply['Subject'] = 'Terima kasih kerana menghubungi Architech Systems'
    reply.set_content(
        f'Hai {name},\n\nTerima kasih kerana menghubungi Architech Systems. '
        'Kami telah menerima mesej anda dan pasukan kami akan membalas secepat mungkin.\n\n'
        'Salam,\nPasukan Architech Systems\n'
    )

    connection = (smtplib.SMTP_SSL(host, port, timeout=15) if use_ssl
                  else smtplib.SMTP(host, port, timeout=15))
    with connection as smtp:
        if not use_ssl:
            smtp.starttls(context=ssl.create_default_context())
        smtp.login(username, password)
        smtp.send_message(incoming)
        try:
            smtp.send_message(reply)
        except smtplib.SMTPException:
            app.logger.exception('Contact received, but automatic reply failed')
            return False
    return True

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/solutions')
def solutions():
    return render_template('solutions.html')

@app.route('/pricing')
def pricing():
    demo_url = os.environ.get('VOICE_DEMO_URL', '').strip().rstrip('/')
    parsed = urlsplit(demo_url)
    if (parsed.scheme != 'https' or not parsed.hostname or parsed.username or parsed.password
            or parsed.path or parsed.query or parsed.fragment):
        demo_url = None
    return render_template('pricing.html', voice_demo_url=demo_url)

@app.route('/demo-dashboard')
def demo_dashboard():
    return render_template('demo_dashboard.html')

@app.route('/demo-ai-call-centre')
def demo_ai_call_centre():
    return render_template('demo_ai_call_centre.html')


@app.post('/demo-ai-call-centre/chat')
def demo_voice_chat():
    if request.content_length is None or request.content_length > 4096:
        return jsonify(error='Permintaan terlalu besar.'), 413
    payload = request.get_json(silent=True)
    message = payload.get('message') if isinstance(payload, dict) else None
    history = payload.get('history', []) if isinstance(payload, dict) else None
    if not isinstance(message, str) or not message.strip() or len(message) > 300:
        return jsonify(error='Mesej tidak sah.'), 400
    if (not isinstance(history, list) or len(history) > 8 or
            any(not isinstance(item, dict) or item.get('role') not in ('user', 'assistant') or
                not isinstance(item.get('content'), str) or not item['content'].strip() or
                len(item['content']) > 700 for item in history)):
        return jsonify(error='Sejarah perbualan tidak sah.'), 400
    key = os.environ.get('ASAI_API_KEY', '').strip()
    model = os.environ.get('ASAI_MODEL', '').strip()
    base = os.environ.get('API_BASE_URL', '').strip().rstrip('/')
    parsed = urlsplit(base)
    if (not key or not model or parsed.scheme != 'https' or not parsed.hostname or
            parsed.username or parsed.password or parsed.query or parsed.fragment or
            parsed.path not in ('', '/v1')):
        return jsonify(error='API chat belum dikonfigurasi dengan betul.'), 503
    messages = [{'role': 'system', 'content': (
        'Anda Leea Bot, pembantu demo suara Architech Systems. Berbual secara mesra dalam Bahasa Melayu, '
        'jawab ringkas (1-2 ayat) supaya sesuai untuk suara. Jika ditanya harga atau fakta yang tidak '
        'disahkan, jangan reka jawapan; sarankan hubungi pasukan Architech Systems. '
        'Jangan minta data peribadi atau rahsia. Ini simulasi, bukan panggilan telefon sebenar.'
    )}, *[{'role': item['role'], 'content': item['content']} for item in history],
                {'role': 'user', 'content': message.strip()}]
    upstream = Request(base + '/chat/completions', data=json.dumps({
        'model': model, 'messages': messages, 'max_tokens': 200,
    }).encode('utf-8'), headers={
        'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json'
    }, method='POST')
    try:
        with urlopen(upstream, timeout=20) as result:
            data = json.load(result)
        reply = data['choices'][0]['message']['content']
        if not isinstance(reply, str) or not reply.strip():
            raise ValueError('Empty chat response')
    except (HTTPError, URLError, TimeoutError, OSError, ValueError, KeyError, IndexError, TypeError):
        app.logger.warning('Demo chat provider unavailable')
        return jsonify(error='Leea Bot tidak dapat menjawab sekarang. Sila cuba lagi.'), 502
    return jsonify(reply=reply.strip()[:700])


@app.post('/demo-ai-call-centre/transcribe')
def demo_voice_transcribe():
    if request.content_length is None or request.content_length > 2 * 1024 * 1024:
        return jsonify(error='Rakaman terlalu besar atau kosong.'), 413
    content_type = request.content_type.split(';')[0].lower() if request.content_type else ''
    if content_type not in ('audio/webm', 'audio/ogg', 'audio/mp4'):
        return jsonify(error='Format rakaman tidak disokong.'), 400
    audio = request.get_data(cache=False)
    if not audio:
        return jsonify(error='Rakaman kosong.'), 400
    key = os.environ.get('DEEPGRAM_API_KEY')
    if not key:
        return jsonify(error='Deepgram belum dikonfigurasi.'), 503
    upstream = Request('https://api.deepgram.com/v1/listen?' + urlencode({
        'model': 'nova-3', 'language': 'ms', 'smart_format': 'true'
    }), data=audio, headers={'Authorization': 'Token ' + key, 'Content-Type': content_type}, method='POST')
    try:
        with urlopen(upstream, timeout=25) as result:
            transcript = json.load(result)['results']['channels'][0]['alternatives'][0]['transcript']
        if not isinstance(transcript, str):
            raise ValueError('Invalid transcript')
    except (HTTPError, URLError, TimeoutError, OSError, ValueError, KeyError, IndexError):
        app.logger.exception('Deepgram transcription failed')
        return jsonify(error='Transkripsi gagal. Sila taip soalan.'), 502
    return jsonify(transcript=transcript[:300])


@app.post('/demo-ai-call-centre/tts')
def demo_voice_tts():
    if request.content_length is None or request.content_length > 4096:
        return jsonify(error='Teks terlalu panjang.'), 413
    payload = request.get_json(silent=True)
    text = payload.get('text') if isinstance(payload, dict) else None
    if not isinstance(text, str) or not text.strip() or len(text) > 1000:
        return jsonify(error='Teks tidak sah.'), 400
    key = os.environ.get('CARTESIA_API_KEY')
    voice = os.environ.get('CARTESIA_VOICE_ID')
    if not key or not voice:
        return jsonify(error='Cartesia belum dikonfigurasi.'), 503
    upstream = Request('https://api.cartesia.ai/tts/bytes', data=json.dumps({
        'model_id': 'sonic-3.6', 'transcript': text, 'voice': voice, 'language': 'ms',
        'output_format': {'container': 'wav', 'encoding': 'pcm_s16le', 'sample_rate': 44100}
    }).encode('utf-8'), headers={
        'Authorization': 'Bearer ' + key, 'Cartesia-Version': '2026-08-14',
        'Content-Type': 'application/json'
    }, method='POST')
    try:
        with urlopen(upstream, timeout=20) as result:
            audio = result.read(10 * 1024 * 1024 + 1)
        if not audio or len(audio) > 10 * 1024 * 1024:
            raise ValueError('Invalid audio')
    except (HTTPError, URLError, TimeoutError, OSError, ValueError):
        app.logger.exception('Cartesia synthesis failed')
        return jsonify(error='Audio Cartesia gagal; jawapan teks masih tersedia.'), 502
    return Response(audio, mimetype='audio/wav', headers={'Cache-Control': 'no-store'})

@app.route('/demo-gerak-gempur')
def demo_gerak_gempur():
    return render_template('demo_gerak_gempur.html')

@app.route('/about')
def about():
    return render_template('about.html')
    
@app.route('/policy')
def policy():
    return render_template('policy.html')

@app.route('/contact', methods=['GET', 'POST'])
def contact():
    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        email = request.form.get('email', '').strip()
        message = request.form.get('message', '').strip()
        if not name or not message or not email or parseaddr(email)[1] != email or '@' not in email or '\n' in email or '\r' in email:
            flash('invalid', 'error')
            return render_template('contact.html'), 400

        try:
            replied = send_contact_emails(name, email, message)
        except (OSError, smtplib.SMTPException, RuntimeError, ValueError):
            app.logger.exception('Contact email delivery failed')
            flash('delivery_failed', 'error')
            return render_template('contact.html'), 503

        if replied:
            flash('sent', 'success')
        else:
            flash('reply_failed', 'error')
        return redirect(url_for('contact'))
        
    return render_template('contact.html')

if __name__ == '__main__':
    # Buka di port lalai 5000, tambah debug=True untuk mudah kesan error
    app.run(debug=True, port=5000)