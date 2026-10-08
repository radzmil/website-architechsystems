import logging
import os
import smtplib
import ssl
from email.message import EmailMessage
from email.utils import parseaddr
from xml.etree.ElementTree import Element, SubElement, tostring

from flask import Flask, render_template, request, flash, redirect, url_for, Response

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
    return render_template('pricing.html')

@app.route('/demo-dashboard')
def demo_dashboard():
    return render_template('demo_dashboard.html')

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