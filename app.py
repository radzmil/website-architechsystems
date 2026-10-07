from flask import Flask, render_template, request, flash, redirect, url_for

app = Flask(__name__)
# Secret key ni wajib ada untuk kita guna fungsi flash (keluarkan notis mesej berjaya)
app.secret_key = 'architech_super_secret_key' 

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

@app.route('/about')
def about():
    return render_template('about.html')
    
@app.route('/policy')
def policy():
    return render_template('policy.html')

@app.route('/contact', methods=['GET', 'POST'])
def contact():
    if request.method == 'POST':
        # Tangkap data yang pelanggan isi dari borang contact.html
        name = request.form.get('name')
        email = request.form.get('email')
        message = request.form.get('message')
        
        # Cetak log di terminal VS Code supaya tuan boleh nampak mesej masuk
        print(f"\n[*] Mesej baharu diterima!")
        print(f"Nama: {name}\nE-mel: {email}\nMesej: {message}\n")
        
        # Keluarkan notis pop-up berjaya dihantar
        flash('Terima kasih! Mesej anda telah berjaya dihantar. Kami akan balas segera.', 'success')
        return redirect(url_for('contact'))
        
    return render_template('contact.html')

if __name__ == '__main__':
    # Buka di port lalai 5000, tambah debug=True untuk mudah kesan error
    app.run(debug=True, port=5000)