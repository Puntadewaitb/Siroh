# Peta Sirah Nabawiyah

Game belajar sirah untuk **remaja (level SMP) dan dewasa**, berbasis buku *Sirah Nabawiyah* (Ar-Rahiqul Makhtum), karya Syaikh Shafiyyurrahman Al-Mubarakfuri. Satu halaman HTML statis, tanpa framework, jalan offline (PWA).

## Fitur
- **Peta perjalanan 3D**: relief Jazirah Arab dari data ketinggian nyata, timeline 18 stasiun, token progres yang berjalan di rute, dan tampilan detail kota Makkah dan Madinah.
- **Adegan per stasiun** (gaya RPG, tanpa sosok manusia): kilasan kisah singkat (SMP sekitar 4 bagian, dewasa sekitar 8), langkah interaktif (tebak dulu, jelajahi tempat, mini-aksi), lalu 3 soal di dalam adegan.
- **Bank 10 soal per level per stasiun** (360 soal). Tiap percobaan memakai 3 soal acak. Stasiun 1 sampai 5 hanya pilihan ganda; mulai stasiun 6 ada pilih 2 dari 5, urutkan, dan jodohkan. Ada **3 hati**; kalau habis, stasiun itu diulang dengan soal baru.
- **Latihan harian**: 5 soal sehari. Soal yang pernah salah muncul lagi dengan jeda makin panjang (1, 2, 4, 7, 14 hari), ada rentetan hari dan poin sekali sehari.
- **Album kartu koleksi**: 54 kartu (tokoh, tempat, peristiwa), 3 per stasiun, terbuka saat stasiun selesai. Juga menampilkan lencana.
- **Ujian urutan peristiwa** (stasiun akhir) dan **Tantangan acak** 10 soal.
- **Mode grafis**: Otomatis (turun ke ringan kalau HP lemah atau fps rendah), Tinggi, Ringan. Tanpa WebGL, game tetap bisa dimainkan: kisah tampil sebagai teks lalu soal.
- Progres tersimpan di `localStorage`; **Mode belajar** membuka semua stasiun.
- Nomor halaman buku disimpan di data untuk verifikasi, tetapi tidak ditampilkan ke pemain; sumber disebut sekali di header.
- Adab: tidak ada gambar wajah atau sosok Nabi, sahabat, dan malaikat; pasukan berupa panji, kafilah berupa muatan. Posisi peta perkiraan dan dilabeli.

## Offline dan APK
- **Offline penuh:** font dibundel lokal (`fonts/`), tidak ada request ke luar domain. Setelah dibuka sekali lewat http(s), service worker menyimpan semua file sehingga bisa dimainkan tanpa internet (diuji di `tests/offline.mjs`).
- **Install sebagai PWA:** buka situs di Chrome Android → menu ⋮ → *Install app* / *Add to Home screen*.
- **APK (Capacitor):** di GitHub buka tab *Actions → Build APK → Run workflow*. Setelah selesai, APK otomatis tampil di halaman **Releases** (tag `apk-terbaru`, link unduhan tetap) dan juga di Artifacts. Memberi tag `v*` membuat Release bernomor versi. Ini APK *debug* (ditandatangani kunci debug): cukup untuk sideload, belum untuk Play Store. Lokal: `npm run apk` (butuh JDK 21 + Android SDK).

## Menjalankan
```bash
python3 -m http.server 8080      # lalu buka http://localhost:8080
# atau cukup buka index.html langsung di browser
```
Deploy: push ke `main`/`master`, lalu di GitHub **Settings → Pages → Source: GitHub Actions**. Workflow `.github/workflows/pages.yml` menjalankan build, tes, lalu publish.

## Development
```bash
npm install
npm run build        # rakit index.html dari build/*
npm run test:data    # lint 360 soal + kartu (struktur, indeks jawaban, rujukan hlm.)
npm run test:e2e     # Playwright tanpa WebGL: 18 stasiun x 2 level, ujian, latihan, album, tantangan, 360px
npm run test:3d      # Playwright + SwiftShader: peta 3D, adegan, langkah interaktif
```
Edit sumber di `build/` (data: `s_block.js`, `qdata.py`, `bank.py`, `kisah/`, `inter/`, `easy/`, `kartu.json`; logika: `game.js`, `scene3d.js`, `map3d.js`, `quiz.js`, `latihan.js`, dst.), **jangan edit `index.html` langsung**. CI gagal kalau `index.html` tidak sama dengan hasil build.

## Akurasi terhadap buku
Nomor halaman = halaman cetakan buku (= halaman PDF − 33). Soal diverifikasi ke OCR PDF buku (`Sirah Nabawiyah.pdf`, tidak disertakan di repo; taruh sendiri di root repo untuk menjalankan tools):
```bash
sudo apt install poppler-utils tesseract-ocr tesseract-ocr-ind
tools/verify_sumber.sh /tmp/verify   # OCR halaman rujukan + skrining kecocokan token
python3 tools/lihat_konteks.py /tmp/verify 15 d 1 "Riqa|Khaibar"   # lihat konteks satu soal
```
Koordinat peta semuanya perkiraan dan rute skematis; lihat catatan akurasi di `CLAUDE.md`.
