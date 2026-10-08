# Peta Sirah Nabawiyah

Game belajar sirah untuk **remaja (level SMP) dan dewasa**, berbasis buku *Sirah Nabawiyah* (Ar-Rahiqul Makhtum), Al-Mubarakfuri, terj. Kathur Suhardi, Pustaka Al-Kautsar. Satu halaman HTML statis, tanpa framework, jalan offline (PWA).

## Fitur
- **18 stasiun** mengikuti bab buku, masing-masing punya ringkasan, peta skematis, dan **3 soal** per level (54 soal/level, 108 total). Tiap soal punya penjelasan dan rujukan **hlm.** buku.
- **Papan peta ala game**: peta daerah sebagai latar, token penanda progres berjalan di rute ke tempat berikutnya (kamera mengikuti), ketuk tempat untuk membuka stasiunnya; tempat yang sama (mis. Makkah) menampilkan tab nomor stasiun selesai/belum/terkunci. Bisa geser, zoom, dan "lihat semua".
- **24 peta detail** (rute hijrah, Isra' Mi'raj, Thaif, Abrahah, peperangan, dst.) di dalam tiap stasiun.
- **Ujian urutan peristiwa** setelah 18 stasiun.
- **Tantangan acak**: 10 soal acak dari stasiun yang sudah selesai (opsi diacak), skor, rentetan benar, dan daftar materi yang perlu diulang beserta halaman buku.
- **Lencana** per fase + ujian urutan + tantangan sempurna.
- Progres tersimpan di `localStorage`; **Mode belajar** membuka semua stasiun.
- Adab: tidak ada gambar wajah Nabi/sahabat; hanya peta dan simbol. Posisi peta bersifat perkiraan dan dilabeli.

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
npm run test:data    # lint 108 soal (struktur, indeks jawaban, rujukan hlm.)
npm run test:e2e     # Playwright: tamatkan 18 stasiun x 2 level, ujian, tantangan, cek horizontal scroll 360px
```
Edit sumber di `build/` (`s_block.js`, `qdata.py`, `tl_block.js`, `maps.js`, `challenge.js`, `app.js`, CSS), **jangan edit `index.html` langsung**. CI gagal kalau `index.html` tidak sama dengan hasil build.

## Akurasi terhadap buku
Nomor halaman = halaman cetakan buku (= halaman PDF − 33). Semua soal diverifikasi ke OCR PDF `Sirah Nabawiyah.pdf`:
```bash
sudo apt install poppler-utils tesseract-ocr tesseract-ocr-ind
tools/verify_sumber.sh /tmp/verify   # OCR halaman rujukan + skrining kecocokan token
python3 tools/lihat_konteks.py /tmp/verify 15 d 1 "Riqa|Khaibar"   # lihat konteks satu soal
```
Koordinat peta semuanya perkiraan dan rute skematis; lihat catatan akurasi di `CLAUDE.md`.
