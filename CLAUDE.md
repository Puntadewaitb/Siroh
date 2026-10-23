# Peta Sirah Nabawiyah — handoff

Game belajar sirah berbasis buku **Sirah Nabawiyah (Ar-Rahiqul Makhtum)** karya Syaikh Shafiyyurrahman Al-Mubarakfuri (nomor halaman mengikuti cetakan buku). Untuk siswa SMP dan dewasa. Satu file HTML statis, tanpa framework, tanpa fetch eksternal (font dibundel lokal).

Artifact live (claude.ai, v2): https://claude.ai/artifact/4BfaiLzU48mPSFqhxFvqfo

## Preferensi kerja (Yogi)
- Bahasa Indonesia santai, istilah teknis Inggris, to the point.
- Fakta harus dicek ke buku (hlm.) — jangan sampai ada klaim yang tidak ada di buku. Posisi peta yang tidak pasti wajib diberi label "perkiraan".
- Adab: tidak menggambar wajah Nabi/sahabat. Peta dan simbol saja.

## Struktur
```
peta3d.html            # PROTOTIPE peta 3D (dibuat assemble.py; JANGAN edit langsung): timeline + peta relief + tampilan kota
index.html             # hasil akhir (self-contained, ~140 KB) — dipublish via GitHub Pages; JANGAN edit langsung
manifest.webmanifest, sw.js, icon.svg   # PWA offline (sw precache fonts/)
fonts/                 # font lokal (tools/fetch_fonts.py); tanpa Google Fonts
capacitor.config.json  # bungkus APK; android/ dan www/ dibuat saat build (gitignored)
.github/workflows/apk.yml     # build APK debug (manual atau tag v*)
tests/                 # check_data.mjs (lint soal), e2e.mjs (Playwright), cited_pages.mjs
tools/                 # verify_sumber.sh (OCR + skrining soal vs PDF)
.github/workflows/pages.yml   # build+tes+deploy Pages
build/
  assemble.py          # rakit peta-sirah.html dari semua bagian di bawah
  s_block.js           # BANDS + S[18] (stasiun: ringkasan SMP/dewasa, chips, soal #1 per level)
  bank.py              # BANK[1..18]: 7 soal baru per level per stasiun (mc/mu/or/mt) -> bank 10 soal
  quiz.js              # mesin soal: bank, hati, rotasi set, render 4 tipe soal
  qdata.py             # ST[18]: 2 soal tambahan per level (tuple: soal, benar, [salah], penjelasan, "hlm. N")
  challenge.js         # Tantangan acak + lencana
  board.js             # Papan peta ala game: NODE_OF (stasiun -> tempat), NODES, kamera, token, rute, drag/zoom
  tl_block.js          # TL: data ujian urutan peristiwa (SMP 6, dewasa 8)
  maps.js              # PL (tempat), MP (24 peta), SM (stasiun -> peta), MTAB, OV (peta ringkasan)
  core.js              # state permainan bersama (load/save/P/got/isDone/unlocked/firstOpen) — dipakai index & peta3d
  app.js               # logika/render versi utama
  map3d.js, map3d.css  # mesin peta 3D (M3): terrain dari data ketinggian, rute, token, kamera, label anti-tumpuk, kota Makkah/Madinah
  scene3d.js           # adegan RPG per stasiun (SC): SCN.s0..s17 (zona multi-lokasi, kit low-poly), kilasan kisah, soal di dalam adegan
  kisah/kisahN.json    # kilasan kisah per stasiun: {s:[±4 beat], d:[±8 beat]}, beat {t, h (rujukan internal, tidak ditampilkan), shot, sky, fx?}
  proto3d.js           # halaman 3D: timeline + peta + adegan; progres SAMA dengan versi utama (localStorage v2)
  vendor/three_entry.js, vendor/three.min.js   # subset Three.js r186 (global T3), regenerasi: npm run vendor
  terrain/*.png, meta.json   # ketinggian (R*256+G-1000 m) wilayah, Makkah, Madinah; dari tools/fetch_terrain.py (Terrain Tiles AWS)
  css_old.txt, style_new.css
mapgen/
  clip.py              # shapely: clip land-10m/50m GeoJSON ke bbox + proyeksi -> path SVG
  reg-land.txt, wide-land.txt   # path daratan hasil clip (dipakai assemble.py)
```
Build: `npm run build` (= `python3 build/assemble.py`, output `index.html`) (path relatif ke repo; header `<head>` ada di `build/head.html`). `mapgen/clip.py` butuh `land-10m.geojson`/`land-50m.geojson` (dari npm `world-atlas` + `topojson-client`, tidak ikut di repo) dan `shapely`; hanya perlu dijalankan ulang kalau bbox/proyeksi berubah.

## Model data
- 18 stasiun (urut bab buku) + ujian urutan peristiwa. **Bank 10 soal per level per stasiun** (180/level, 360 total); tiap percobaan stasiun memakai 3 soal yang diundi dari bank.
- `S[i].q[m]` = soal 1 (opsi tetap, `a` = indeks benar). `X[i][m]` = 2 soal tambahan, dibuat `assemble.py` (opsi diacak seeded, `a` dihitung ulang). `Z[i][m]` = 7 soal baru dari `bank.py` (opsi mc/mu diacak seeded). Runtime menggabungkan jadi `BK[i][m]` (10 soal, field `ty`); `QS(i)` = 3 soal terundi dari `BK`. m = `s` (SMP, 3 opsi) / `d` (dewasa, 4 opsi).
- Tipe soal (`ty`): `mc` pilihan ganda (SMP 3 / dewasa 4 opsi), `mu` pilih 2 dari 5 (`a` = 2 indeks), `or` urutkan (`it` = urutan benar; SMP 3 / dewasa 4 item), `mt` jodohkan (`l`/`r` 3 pasang, `r` urutan sama dengan `l`). Komposisi bank per level: 6 mc, 2 mu, 1 or, 1 mt (3 mc di bank.py + 3 mc lama).
- Tiap soal punya `e` (penjelasan) dan `h` (rujukan "hlm. N" — nomor halaman cetakan buku = halaman PDF − 33). Rujukan hlm. hanya untuk verifikasi; tampilan memakai `noHlm()` (core.js) sehingga pemain tidak melihat nomor halaman.
- OCR buku: PDF hasil scan (tanpa text layer), TIDAK disimpan di repo (hak cipta). Untuk verifikasi fakta, taruh `Sirah Nabawiyah.pdf` di root repo secara lokal (di-gitignore) atau pakai Project "Siroh" di claude.ai, lalu OCR dengan tesseract.

## State & UX
- localStorage key `peta-sirah-v2` (`prog.{s,d}.qd[i]` = jumlah soal benar 0–3, `pts`, `tl`). Migrasi otomatis dari `peta-sirah-v1`.
- Stasiun terkunci sampai stasiun sebelumnya 3/3 (kecuali "Mode belajar"). Poin: SMP 4/soal, dewasa 8/soal, setengahnya kalau salah dulu; ujian urutan +30/+60.
- **Hati**: 3 hati per percobaan stasiun (`MAXH`), tiap jawaban salah −1. Hati habis -> hanya stasiun itu diulang (`qd[i]=0`), set soal diundi ulang tanpa tumpang tindih dengan set sebelumnya selama bank cukup, progres stasiun lain utuh. State di `prog.{s,d}`: `set[i]` (3 indeks bank), `seen`, `hp[i]`, `fail[i]`.
- Setelah benar: tombol "Soal berikutnya"; selesai 3 soal -> mode ulasan semua soal.
- Layout: papan peta sticky di atas (HP) / kolom kiri (desktop ≥900px), panel stasiun di bawah/kanan. `st.sel.i` = stasiun terpilih (18 = ujian). Klik simpul selesai membuka ulang stasiunnya; simpul terkunci menampilkan pesan.

## Sistem peta
- Dasar: `Lr` (regional, lon 31–48, lat 9–33, `x=(lon−31)·cos23°·60`, `y=(33−lat)·60`) dan `Lw` (lebar, lon 25–60, lat 9–39, `x=(lon−25)·cos27°·20`, `y=(39−lat)·20`). Path ada di `<defs>` svg tersembunyi, dipakai lewat `<use>`.
- Spesifikasi peta di `MP`: `b` dasar (r/w), `bx` bbox [lonB,lonT,latS,latU], `p` titik [kunci,label,dx,dy,anchor,"m"=utama], `r` rute {p, c:a|b|c, d:putus-putus, a:panah, l:legend}, `x` teks wilayah, `n` catatan (selalu cantumkan hlm. dan disclaimer skematis).
- `placeLabels()` menaruh label otomatis tanpa tabrak label/titik/garis rute (kandidat: dasar, tengah atas/bawah, flip, geser dy).
- Papan perjalanan (`board.js`): 9 simpul tempat (Makkah, Thaif, Madinah, Badr, Uhud, Hudaibiyah, Khaibar, Mu’tah, Hunain). `NODE_OF[i]` = tempat tiap stasiun (indeks 18 = ujian, di Madinah). Stasiun di tempat sama jadi tab di panel. Token = progres; saat stasiun terdepan dipilih dan tempatnya beda, token berjalan di rute bezier + kamera mengikuti (instan kalau prefers-reduced-motion). Posisi Uhud digeser skematis agar tidak menumpuk Madinah. `OV` di maps.js sudah tidak dipakai.
- Peta Abrahah ada di stasiun 2 (hlm. 44–45), Thaif + Isra' di stasiun 7 (hlm. 141–164). Stasiun 4 dan 6 (indeks 3 dan 5) belum punya peta.

## Peta 3D (prototipe, peta3d.html)
- Tema tetap peta + timeline sirah, bukan diorama. Tanpa sosok manusia; Ka’bah berupa simbol tidak berskala.
- Wilayah: lon 34.2–44.8, lat 19.4–31.9; skala 10 unit/derajat, ketinggian ×~8. Kota: Makkah & Madinah 340 unit/derajat, ×~2. Pinggir terrain melandai ke warna latar.
- Titik kota memakai `PL`; kisah kota = peta `MP` yang sudah ada (hira/abz/mnk, mad/uhud/ahz) beserta catatan hlm.-nya.
- Label HTML di atas kanvas, urut prioritas dan anti-tumpuk; simpul yang labelnya tersembunyi tetap bisa diketuk (raycast).
- Tes: `npm run test:3d` (SwiftShader). Screenshot manual: `node tests/shot3d.mjs <dir>`.
- Alur RPG: pilih stasiun di timeline/peta -> "Mulai stasiun" -> adegan layar penuh -> kilasan kisah (dialog, tiap beat ada hlm.) -> 3 soal (quiz.js, hati) di dalam adegan -> selesai -> kembali ke peta (token jalan ke stasiun berikutnya).
- Adegan khusus tiap stasiun `SCN.s0`..`SCN.s17` (shot sesuai `kisah/*.json`). Stasiun dengan dua tempat memakai zona berjauhan (±700 unit) dan transisi potong layar. Kit: rumah, Ka’bah, berhala (tugu batu, bisa runtuh), Darun Nadwah, kurma, tenda/kemah, panji berkibar (hijau = Muslimin, merah/ungu = lawan; simbol game, bukan warna sejarah), sumur, kolam, benteng, tembok kota, kebun anggur, parit, Masjid Nabawi sedang dibangun, pasar, perahu dan laut, bebatuan Al-Hijr, lampu malam, partikel (hujan, debu, angin, panah, burung dan batu, gulungan surat).
- Kisah: SMP ±4 beat, dewasa ±8 beat per stasiun, ditulis dari OCR bab dan diskrining (angka dan nama dicocokkan ke halaman rujukan `h`). Nomor halaman TIDAK ditampilkan di game (permintaan Yogi); sumber disebut sekali di header.
- Adab: tidak ada sosok manusia, wajah, atau malaikat; pasukan = panji, kafilah = muatan; wahyu = cahaya di gua.
- Belum: ujian urutan di 3D, menjadikan 3D versi utama (fallback 2D), uji performa di HP murah.

## Catatan akurasi (cek dulu sebelum rilis ke luar)
- Semua koordinat perkiraan. Paling perlu diverifikasi: Hunain (21.36, 40.08), Hudaibiyah, Qarnul Manazil, Jamratul Aqabah, Wadi Muhasshir, Bukit Sal'.
- Rute semua skematis (garis lurus/waypoint kasar). Jalur Shan'a–Makkah (Abrahah) tidak dirinci buku. Wadi Nakhlah (pulang dari Thaif, hlm. 144) sengaja tidak digambar.

## Belum dikerjakan / ide lanjut
1. Bab hlm. 578–596 belum tercakup.
2. Peta untuk stasiun 4 dan 6 (Syi'b Abu Thalib, dakwah sembunyi-sembunyi di Makkah).
3. Soal tambahan / bank soal acak; kuis ulang per stasiun.
4. Verifikasi koordinat di atas dengan sumber peta sirah; kemungkinan peta lokal lebih detail untuk Makkah–Mina.
5. Tes: sudah ada alur Playwright (klik tamat 18 stasiun x 2 level, cek scrollWidth, screenshot terang/gelap). Belum ada di repo — tulis ulang kalau mau dijadikan regression test.

## Aturan teknis yang dipegang
- Satu file HTML, tidak ada fetch eksternal, localStorage dibungkus try/catch, layout aman di 360px (tanpa horizontal scroll), token warna terang/gelap lewat CSS variables (`--sea/--land/--coast` untuk peta).

## Status verifikasi
- Bank 10 soal/stasiun (360 soal): soal asli 108 dicek seperti di bawah; 252 soal `bank.py` ditulis dari OCR bab dan diskrining dengan `tools/verify_sumber.sh` (token) + cek manual distraktor spesifik.
- 108 soal sudah dicek ke OCR PDF (Sirah Nabawiyah.pdf; file TIDAK ada di repo, hanya lokal/Project claude.ai; di-gitignore): skrining token + cek manual 25 soal berskor rendah; semua cocok. Koreksi: wording st15 dewasa q1, rujukan st9 dewasa q2 (hlm. 184–188).
- Belum diverifikasi: ringkasan stasiun, chips, data ujian urutan, dan koordinat peta.
