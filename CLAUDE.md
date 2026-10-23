# Peta Sirah Nabawiyah — handoff

Game belajar sirah berbasis buku **Sirah Nabawiyah (Ar-Rahiqul Makhtum)** karya Syaikh Shafiyyurrahman Al-Mubarakfuri (nomor halaman mengikuti cetakan buku). Untuk siswa SMP dan dewasa. Satu file HTML statis, tanpa framework, tanpa fetch eksternal (font dibundel lokal).

Artifact live (claude.ai, v2): https://claude.ai/artifact/4BfaiLzU48mPSFqhxFvqfo

## Preferensi kerja (Yogi)
- Bahasa Indonesia santai, istilah teknis Inggris, to the point.
- Fakta harus dicek ke buku (hlm.) — jangan sampai ada klaim yang tidak ada di buku. Posisi peta yang tidak pasti wajib diberi label "perkiraan".
- Adab: tidak menggambar wajah Nabi/sahabat. Peta dan simbol saja.

## Struktur
```
index.html             # GAME UTAMA, versi 3D (self-contained ~1,4 MB, dibuat assemble.py; JANGAN edit langsung) — dipublish via GitHub Pages
peta3d.html            # pengalih lama -> index.html (dibuat assemble.py)
manifest.webmanifest, sw.js, icon.svg   # PWA offline (sw precache fonts/)
fonts/                 # font lokal (tools/fetch_fonts.py); tanpa Google Fonts
capacitor.config.json  # bungkus APK; android/ dan www/ dibuat saat build (gitignored)
.github/workflows/apk.yml     # build APK debug (manual atau tag v*)
.github/workflows/pages.yml   # build+tes+deploy Pages
tests/                 # check_data.mjs (lint soal+kartu), e2e.mjs (tanpa WebGL: tamat 18x2, ujian, latihan, album, tantangan),
                       # game3d.mjs + interaktif.mjs (SwiftShader), offline.mjs, cited_pages.mjs, shot3d/shotstage (screenshot manual)
tools/                 # verify_sumber.sh (OCR + skrining soal vs PDF), fetch_terrain.py, fetch_fonts.py, make_www.mjs
build/
  assemble.py          # rakit index.html dari semua bagian di bawah (urutan JS: data, maps, nodes, quiz, challenge, core, latihan, ujian, kartu, /* Peta */ TERR, map3d, scene3d, game)
  s_block.js           # BANDS + S[18] (stasiun: ringkasan SMP/dewasa, chips, soal #1 per level)
  bank.py              # BANK[1..18]: 7 soal baru per level per stasiun (mc/mu/or/mt) -> bank 10 soal
  qdata.py             # ST[18]: 2 soal tambahan per level (tuple: soal, benar, [salah], penjelasan, "hlm. N")
  easy/easyN.json      # soal mudah (pilihan ganda saja) stasiun 1–5 -> EZ
  kisah/kisahN.json    # kilasan kisah per stasiun: {s:[±4 beat], d:[±8 beat]}, beat {t, h (rujukan internal, tidak ditampilkan), shot, sky, fx?}
  inter/interN.json    # langkah interaktif (tebak/jelajah/aksi) -> INTER3
  kartu.json           # KARTU: 3 kartu koleksi per stasiun {k: tokoh|tempat|peristiwa, n, t, h}
  tl_block.js          # TL: data ujian urutan peristiwa (SMP 6, dewasa 8)
  maps.js              # PL (tempat), MP (24 peta; dipakai sebagai "kisah kota" di tampilan kota 3D), SM (stasiun -> peta)
  nodes.js             # NODE_OF (stasiun -> tempat), NODES (9 simpul tempat)
  quiz.js              # mesin soal: bank, hati, rotasi set, render 4 tipe soal
  challenge.js         # Tantangan acak + lencana
  core.js              # state permainan bersama (load/save/P/got/isDone/unlocked/firstOpen, gfx/gfxLite)
  latihan.js           # Latihan harian (pengulangan berjarak; P().rv, P().lh)
  ujian.js             # Ujian urutan peristiwa (tlBody/tlAct)
  kartu.js             # Album kartu koleksi + lencana
  map3d.js, map3d.css  # mesin peta 3D (M3): terrain, rute, token, kamera, label anti-tumpuk, kota Makkah/Madinah; CSS halaman, menu, jendela, album
  scene3d.js           # adegan RPG per stasiun (SC): SCN.s0..s17, kilasan kisah, langkah interaktif, soal di dalam adegan
  game.js              # halaman utama: timeline + peta + adegan + menu + jendela (latihan/album/tantangan/ujian) + cadangan tanpa WebGL
  vendor/three_entry.js, vendor/three.min.js   # subset Three.js r186 (global T3), regenerasi: npm run vendor
  terrain/*.png, meta.json   # ketinggian (R*256+G-1000 m) wilayah, Makkah, Madinah; dari tools/fetch_terrain.py (Terrain Tiles AWS)
  css_old.txt, style_new.css # CSS dasar (token warna, tombol, soal)
```
Build: `npm run build` (= `python3 build/assemble.py`, output `index.html` + pengalih `peta3d.html`; header `<head>` ada di `build/head.html`). Versi 2D (papan SVG, app.js, board.js, mapgen/) sudah dihapus atas permintaan Yogi; 3D satu-satunya versi.

## Model data
- Stasiun 1–5 (indeks 0–4) memakai **soal mudah, hanya pilihan ganda** (`build/easy/easyN.json` -> `EZ`, menggantikan bank stasiun itu; diambil dari kilasan kisah level yang sama). Variasi tipe soal mulai stasiun 6.
- 18 stasiun (urut bab buku) + ujian urutan peristiwa. **Bank 10 soal per level per stasiun** (180/level, 360 total); tiap percobaan stasiun memakai 3 soal yang diundi dari bank.
- `S[i].q[m]` = soal 1 (opsi tetap, `a` = indeks benar). `X[i][m]` = 2 soal tambahan, dibuat `assemble.py` (opsi diacak seeded, `a` dihitung ulang). `Z[i][m]` = 7 soal baru dari `bank.py` (opsi mc/mu diacak seeded). Runtime menggabungkan jadi `BK[i][m]` (10 soal, field `ty`); `QS(i)` = 3 soal terundi dari `BK`. m = `s` (SMP, 3 opsi) / `d` (dewasa, 4 opsi).
- Tipe soal (`ty`): `mc` pilihan ganda (SMP 3 / dewasa 4 opsi), `mu` pilih 2 dari 5 (`a` = 2 indeks), `or` urutkan (`it` = urutan benar; SMP 3 / dewasa 4 item), `mt` jodohkan (`l`/`r` 3 pasang, `r` urutan sama dengan `l`). Komposisi bank per level: 6 mc, 2 mu, 1 or, 1 mt (3 mc di bank.py + 3 mc lama).
- Tiap soal punya `e` (penjelasan) dan `h` (rujukan "hlm. N" — nomor halaman cetakan buku = halaman PDF − 33). Rujukan hlm. hanya untuk verifikasi; tampilan memakai `noHlm()` (core.js) sehingga pemain tidak melihat nomor halaman.
- OCR buku: PDF hasil scan (tanpa text layer), TIDAK disimpan di repo (hak cipta). Untuk verifikasi fakta, taruh `Sirah Nabawiyah.pdf` di root repo secara lokal (di-gitignore) atau pakai Project "Siroh" di claude.ai, lalu OCR dengan tesseract.

## State & UX
- localStorage key `peta-sirah-v2` (`prog.{s,d}.qd[i]` = jumlah soal benar 0–3, `pts`, `tl`). Migrasi otomatis dari `peta-sirah-v1`.
- Stasiun terkunci sampai stasiun sebelumnya 3/3, kecuali "Mode belajar" (`st.learn`). SEMENTARA default `UNLOCK_DEFAULT=true` di core.js: semua stasiun terbuka; pilihan pemain disimpan (`learn` di localStorage). Ubah ke `false` untuk kembali ke mode berurutan. Poin: SMP 4/soal, dewasa 8/soal, setengahnya kalau salah dulu; ujian urutan +30/+60.
- **Hati**: 3 hati per percobaan stasiun (`MAXH`), tiap jawaban salah −1. Hati habis -> hanya stasiun itu diulang (`qd[i]=0`), set soal diundi ulang tanpa tumpang tindih dengan set sebelumnya selama bank cukup, progres stasiun lain utuh. State di `prog.{s,d}`: `set[i]` (3 indeks bank), `seen`, `hp[i]`, `fail[i]`.
- Setelah benar: tombol "Soal berikutnya"; selesai 3 soal -> mode ulasan semua soal.
- Layout: peta 3D di atas, timeline stasiun, panel info stasiun, menu (Latihan harian, Album kartu, Tantangan acak, Ujian urutan) yang membuka jendela `#mdl`, lalu Pengaturan grafis. `st.sel.i` = stasiun terpilih (18 = ujian, dikerjakan di jendela).
- Latihan harian (`latihan.js`): soal mc yang dijawab salah di stasiun masuk `P().rv["i:k"]={b,due}`; benar naik kotak (jeda 1/2/4/7/14 hari), salah kembali ke kotak 0. 5 soal: yang jatuh tempo dulu, sisanya acak dari stasiun yang sudah dikerjakan. Poin 2/soal benar, hanya latihan pertama tiap hari; rentetan hari di `P().lh` (lencana 7 hari).
- Kartu koleksi (`kartu.json`): terbuka saat stasiun selesai di level aktif; nama kartu muncul di layar "Stasiun selesai".
- Grafis (`st.gfx`: auto/tinggi/ringan): ringan = tanpa bayangan, partikel 1/3, pixelRatio 1. Auto turun ke ringan kalau `navigator.deviceMemory<=2` atau rata-rata frame adegan >45 ms (~3 detik).
- Tanpa WebGL: peta diganti pesan, "Mulai stasiun" membuka jendela berisi kilasan kisah (teks) + soal.

## Sistem peta
- Simpul tempat (`nodes.js`): 9 simpul (Makkah, Thaif, Madinah, Badr, Uhud, Hudaibiyah, Khaibar, Mu’tah, Hunain). `NODE_OF[i]` = tempat tiap stasiun (indeks 18 = ujian, di Madinah). Token = progres; saat stasiun terdepan dipilih dan tempatnya beda, token berjalan di rute + kamera mengikuti (instan kalau prefers-reduced-motion).
- Spesifikasi peta di `MP` (maps.js) dipakai sebagai kisah kota di tampilan 3D: `r` rute {p, c:a|b|c, l:legend}, `n` catatan (hlm. disimpan, disembunyikan lewat `noHlm`).

## Peta 3D (versi utama, index.html)
- Tema tetap peta + timeline sirah, bukan diorama. Tanpa sosok manusia; Ka’bah berupa simbol tidak berskala.
- Wilayah: lon 34.2–44.8, lat 19.4–31.9; skala 10 unit/derajat, ketinggian ×~8. Kota: Makkah & Madinah 340 unit/derajat, ×~2. Pinggir terrain melandai ke warna latar.
- Titik kota memakai `PL`; kisah kota = peta `MP` yang sudah ada (hira/abz/mnk, mad/uhud/ahz) beserta catatan hlm.-nya.
- Label HTML di atas kanvas, urut prioritas dan anti-tumpuk; simpul yang labelnya tersembunyi tetap bisa diketuk (raycast).
- Tes: `npm run test:3d` (SwiftShader). Screenshot manual: `node tests/shot3d.mjs <dir>`.
- Alur RPG: pilih stasiun di timeline/peta -> "Mulai stasiun" -> adegan layar penuh -> kilasan kisah (dialog, tiap beat ada hlm.) -> 3 soal (quiz.js, hati) di dalam adegan -> selesai -> kembali ke peta (token jalan ke stasiun berikutnya).
- Adegan khusus tiap stasiun `SCN.s0`..`SCN.s17` (shot sesuai `kisah/*.json`). Stasiun dengan dua tempat memakai zona berjauhan (±700 unit) dan transisi potong layar. Kit: rumah, Ka’bah, berhala (tugu batu, bisa runtuh), Darun Nadwah, kurma, tenda/kemah, panji berkibar (hijau = Muslimin, merah/ungu = lawan; simbol game, bukan warna sejarah), sumur, kolam, benteng, tembok kota, kebun anggur, parit, Masjid Nabawi sedang dibangun, pasar, perahu dan laut, bebatuan Al-Hijr, lampu malam, partikel (hujan, debu, angin, panah, burung dan batu, gulungan surat).
- Kisah interaktif (`INTER` di scene3d.js untuk Badr/Uhud/Khandaq; stasiun lain di `build/inter/interN.json` -> `INTER3`; semua 18 stasiun punya langkah interaktif): langkah `tebak` (tebak dulu lalu kisah melanjutkan), `jelajah` (ketuk tanda bersinar di adegan, `cur.spots`), `aksi` (mini-aksi, `cur.aksi[act]`; contoh timbun sumur & isi kolam, tempatkan pemanah, gali parit). Disisipkan sebelum beat ke-`before[level]`. Poin kecil sekali per langkah (`P().ix`). Sudut kamera langkah interaktif dihitung otomatis (`autoFit`) agar semua tanda terlihat di atas dialog; tes: `tests/interaktif.mjs`.
- Kisah: SMP ±4 beat, dewasa ±8 beat per stasiun, ditulis dari OCR bab dan diskrining (angka dan nama dicocokkan ke halaman rujukan `h`). Nomor halaman TIDAK ditampilkan di game (permintaan Yogi); sumber disebut sekali di header.
- Adab: tidak ada sosok manusia, wajah, atau malaikat; pasukan = panji, kafilah = muatan; wahyu = cahaya di gua.
- Belum: uji performa nyata di HP murah (mode grafis otomatis baru diuji di emulator/SwiftShader).

## Catatan akurasi (cek dulu sebelum rilis ke luar)
- Semua koordinat perkiraan. Paling perlu diverifikasi: Hunain (21.36, 40.08), Hudaibiyah, Qarnul Manazil, Jamratul Aqabah, Wadi Muhasshir, Bukit Sal'.
- Rute semua skematis (garis lurus/waypoint kasar). Jalur Shan'a–Makkah (Abrahah) tidak dirinci buku. Wadi Nakhlah (pulang dari Thaif, hlm. 144) sengaja tidak digambar.

## Belum dikerjakan / ide lanjut
1. Bab hlm. 578–596 belum tercakup.
2. Kunci stasiun berurutan: `UNLOCK_DEFAULT` masih `true` (ditunda Yogi, "nanti aj").
3. Verifikasi koordinat dengan sumber peta sirah; kemungkinan peta lokal lebih detail untuk Makkah–Mina.
4. Uji performa di HP murah (APK) dan atur ambang mode grafis otomatis.

## Aturan teknis yang dipegang
- Satu file HTML, tidak ada fetch eksternal, localStorage dibungkus try/catch, layout aman di 360px (tanpa horizontal scroll), token warna terang/gelap lewat CSS variables (`--sea/--land/--coast` untuk peta).

## Status verifikasi
- Bank 10 soal/stasiun (360 soal): soal asli 108 dicek seperti di bawah; 252 soal `bank.py` ditulis dari OCR bab dan diskrining dengan `tools/verify_sumber.sh` (token) + cek manual distraktor spesifik.
- 108 soal sudah dicek ke OCR PDF (Sirah Nabawiyah.pdf; file TIDAK ada di repo, hanya lokal/Project claude.ai; di-gitignore): skrining token + cek manual 25 soal berskor rendah; semua cocok. Koreksi: wording st15 dewasa q1, rujukan st9 dewasa q2 (hlm. 184–188).
- Belum diverifikasi: ringkasan stasiun, chips, data ujian urutan, dan koordinat peta.
