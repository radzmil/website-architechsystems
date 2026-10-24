# Semakan SEO website

Jalankan `python seo_audit.py` dari folder website sebelum upload. Skrip ini semak
halaman awam dalam `SEO_PAGES`: status HTTP, title, meta description, canonical,
robots, satu h1, alt imej, serta kewujudan sitemap dan pautannya dalam robots.txt.
Ia tidak menghantar data ke servis luar dan tidak mengukur kedudukan Google.

Selepas deploy, sahkan domain `https://www.architechsystems.my` milik anda dalam
Google Search Console dan hantar `https://www.architechsystems.my/sitemap.xml`.
Semak laporan pengindeksan dan prestasi di sana; `robots.txt` dan sitemap hanya
membantu penemuan halaman, bukan jaminan ranking. Jika domain sebenar berbeza,
kemas kini `PUBLIC_URL` dalam `app.py` sebelum deploy.

Counter pelawat pada footer guna `DATABASE_PUBLIC_URL_DB_ARCHITECH_CORE` PostgreSQL
(asing daripada `DATABASE_URL` untuk katalog). Jadual
`website_visitor_counter` dicipta automatik (pengguna DB perlu hak CREATE),
memaparkan 798 kepada pelawat pertama dan bertambah sekali bagi setiap sesi pelayar yang membuka
halaman awam. Bot biasa, API, aset statik dan halaman demo tidak dikira.
Nilai dalaman awal 797 supaya paparan pertama ialah 798.
Tanpa DB atau jika DB gagal, angka tidak dipaparkan; cookie sesi memerlukan
`SECRET_KEY` kekal sama selepas deploy. Angka ini bukan pengguna unik mutlak:
cookie yang dipadam atau pelayar berlainan dikira semula. Vercel memerlukan
PostgreSQL luaran; fail lokal tidak menjamin kiraan kekal.