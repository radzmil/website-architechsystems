# Arrestruct di Website — Panduan Subsistem

Halaman jualan Arrestruct di website Architech Systems.

---

## Apa yang dibina

| Route | Kaedah | Fungsi |
|---|---|---|
| `/arrestruct` | GET | Halaman jualan: hero, ciri, keselamatan, harga, borang, muat turun |
| `/arrestruct/subscribe` | POST | Hantar permintaan langganan → redirect ke WhatsApp |

Fail:

| Fail | Peranan |
|---|---|
| `templates/arrestruct.html` | Template halaman (dwibahasa `data-ms` / `data-en`) |
| `app.py` — `arrestruct()` | Data pakej + render |
| `app.py` — `arrestruct_subscribe()` | Validasi + redirect WhatsApp |
| `templates/base.html` | Pautan nav (desktop + mobile) |
| `.env.example` | 6 pemboleh ubah baharu |

---

## Ciri halaman

1. **Hero** — tajuk, ringkasan, butang muat turun, versi/saiz
2. **Apa Yang Selesaikan** — 4 kad masalah → penyelesaian
3. **Keselamatan** — 4 jaminan (fail asal, quarantine, dry-run, lesen)
4. **Harga** — 3 kad pakej (Trial / Personal / Business)
5. **Borang Langganan** — nama, telefon, e-mel, pakej → WhatsApp
6. **Muat Turun** — butang `.exe` + amaran SmartScreen
7. **Dwibahasa** — BM/EN mengikut togol bahasa sedia ada

---

## Pemboleh ubah persekitaran

Tetapkan dalam **Vercel → Project → Settings → Environment Variables**:

| Nama | Wajib | Contoh |
|---|---|---|
| `ARRESTRUCT_DOWNLOAD_URL` | Ya (untuk butang aktif) | `https://github.com/.../Arrestruct.exe` |
| `ARRESTRUCT_WHATSAPP` | Tidak (lalai `60183172114`) | `60183172114` |
| `ARRESTRUCT_VERSION` | Tidak (lalai `1.0.0`) | `1.0.0` |
| `ARRESTRUCT_SIZE_MB` | Tidak (lalai `36`) | `36` |
| `ARRESTRUCT_PRICE_TRIAL` | Tidak (lalai `0`) | `0` |
| `ARRESTRUCT_PRICE_PERSONAL` | Tidak | `99` |
| `ARRESTRUCT_PRICE_BUSINESS` | Tidak | `249` |

Jika `ARRESTRUCT_DOWNLOAD_URL` kosong, halaman papar **"Download coming soon"**
— tidak rosak, hanya belum aktif.

Jika harga kosong, halaman papar **"Price on request"**.

---

## ⚠️ Di mana letak `.exe` — JANGAN dalam repo

Fail `Arrestruct.exe` ialah ~36 MB. Vercel had deployment **50 MB**; menyimpan
`.exe` dalam repo bermakna setiap deploy membawa 36 MB dan menghampiri had.

**Gunakan GitHub Releases:**

1. Cipta repo **Private** baharu: `arrestruct-releases`
2. Pergi ke **Releases** → **Draft a new release**
3. Tag: `v1.0.0`, Tajuk: `Arrestruct 1.0.0`
4. Muat naik `dist/Arrestruct.exe` sebagai asset
5. **Publish release**
6. Klik kanan pada asset → **Copy link address**

URL akan berbentuk:
```
https://github.com/radzmil/arrestruct-releases/releases/download/v1.0.0/Arrestruct.exe
```

Tampal URL itu ke `ARRESTRUCT_DOWNLOAD_URL` dalam Vercel.

> **Nota:** Jika repo Private, pautan muat turun memerlukan log masuk GitHub.
> Untuk muat turun awam, jadikan repo **Public** — tetapi simpan hanya `.exe`
> di situ, bukan kod sumber.

---

## Deploy subdomain `arrestruct.architechsystems.my`

Anda sudah daftar subdomain di Vercel. Sahkan dua perkara:

### 1. Domain ditambah pada projek yang betul

Vercel → projek website → **Settings** → **Domains** → mesti ada
`arrestruct.architechsystems.my` dengan status **Valid Configuration**.

### 2. Route boleh dicapai

Laman utama website di `arrestruct.architechsystems.my` akan papar **halaman
utama website** (bukan Arrestruct). Untuk terus ke halaman produk, guna:

```
https://arrestruct.architechsystems.my/arrestruct
```

**Jika anda mahu `/` pada subdomain itu terus papar halaman Arrestruct**,
tambah middleware dalam `app.py`:

```python
@app.before_request
def subdomain_landing():
    """Pada subdomain arrestruct, '/' memaparkan halaman produk."""
    host = (request.host or '').split(':')[0].lower()
    if host == 'arrestruct.architechsystems.my' and request.path == '/':
        return redirect('/arrestruct')
    return None
```

Letakkan **selepas** `check_post_origin()` supaya semakan asal POST masih jalan.

---

## Bagaimana aliran jualan berfungsi

```
Pengunjung buka arrestruct.architechsystems.my/arrestruct
        |
        v
Klik "Muat Turun" -> muat turun .exe (trial 14 hari terbina dalam)
        |
        v
Klik "Langgan Business" -> borang terisi pakej
        |
        v
Isi nama/telefon/e-mel -> "Hantar melalui WhatsApp"
        |
        v
WhatsApp terbuka dengan mesej sedia tulis
        |
        v
Anda terima mesej -> buka Admin-Panel -> jana kunci lesen
(/workspace=arrestruct) -> hantar kunci kepada pelanggan
        |
        v
Pelanggan masukkan kunci dalam .exe -> aktif
```

**Tiada gerbang pembayaran.** Pelanggan bayar melalui kaedah yang anda
tetapkan (pindahan bank / DuitNow) dan anda sahkan secara manual.
Ini sesuai untuk permulaan; tambah ToyyibPay/CHIP kemudian jika volum meningkat.

---

## Ujian

```powershell
cd "D:\Architech Systems\website architech laboratory"
python -m pytest . -q
```

Ujian merangkumi:
- Halaman 200 dan semua seksyen hadir
- 3 kad pakej, penanda "Most Popular"
- Nav desktop dan mobile ada pautan `/arrestruct`
- Borang tolak nama pendek / telefon invalid
- Borang berjaya → redirect `https://wa.me/60183172114?...`
- Pakej tidak sah → fallback ke `personal` (bukan disimpan mentah)

---

## Senarai semak sebelum go-live

- [ ] Muat naik `Arrestruct.exe` ke GitHub Releases
- [ ] Tetapkan `ARRESTRUCT_DOWNLOAD_URL` dalam Vercel
- [ ] Tetapkan `ARRESTRUCT_PRICE_PERSONAL` dan `ARRESTRUCT_PRICE_BUSINESS`
- [ ] Sahkan `ARRESTRUCT_WHATSAPP` betul
- [ ] Deploy dan buka `https://arrestruct.architechsystems.my/arrestruct`
- [ ] Uji butang muat turun (fail benar-benar dimuat turun)
- [ ] Uji borang (WhatsApp terbuka dengan mesej betul)
- [ ] Jana satu lesen ujian di Admin-Panel dan aktifkan melalui `.exe`
- [ ] Padam lesen ujian selepas sahkan
