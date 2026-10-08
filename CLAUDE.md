# Peta Sirah Nabawiyah — handoff

Game belajar sirah berbasis buku **Sirah Nabawiyah (Ar-Rahiqul Makhtum)**, Al-Mubarakfuri, terj. Kathur Suhardi, Pustaka Al-Kautsar (633 hlm). Untuk siswa SMP dan dewasa. Satu file HTML statis, tanpa framework, tanpa fetch eksternal (hanya Google Fonts).

Artifact live (claude.ai, v2): https://claude.ai/artifact/4BfaiLzU48mPSFqhxFvqfo

## Preferensi kerja (Yogi)
- Bahasa Indonesia santai, istilah teknis Inggris, to the point.
- Fakta harus dicek ke buku (hlm.) — jangan sampai ada klaim yang tidak ada di buku. Posisi peta yang tidak pasti wajib diberi label "perkiraan".
- Adab: tidak menggambar wajah Nabi/sahabat. Peta dan simbol saja.

## Struktur
```
peta-sirah.html        # hasil akhir (self-contained, ~135 KB) — ini yang dipublish
build/
  assemble.py          # rakit peta-sirah.html dari semua bagian di bawah
  s_block.js           # BANDS + S[18] (stasiun: ringkasan SMP/dewasa, chips, soal #1 per level)
  qdata.py             # ST[18]: 2 soal tambahan per level (tuple: soal, benar, [salah], penjelasan, "hlm. N")
  tl_block.js          # TL: data ujian urutan peristiwa (SMP 6, dewasa 8)
  maps.js              # PL (tempat), MP (24 peta), SM (stasiun -> peta), MTAB, OV (peta ringkasan)
  app.js               # logika/render/state
  css_old.txt, style_new.css
mapgen/
  clip.py              # shapely: clip land-10m/50m GeoJSON ke bbox + proyeksi -> path SVG
  reg-land.txt, wide-land.txt   # path daratan hasil clip (dipakai assemble.py)
```
Build: `cd build && python3 -I assemble.py` (path relatif ke repo; header `<head>` ada di `build/head.html`). `mapgen/clip.py` butuh `land-10m.geojson`/`land-50m.geojson` (dari npm `world-atlas` + `topojson-client`, tidak ikut di repo) dan `shapely`; hanya perlu dijalankan ulang kalau bbox/proyeksi berubah.

## Model data
- 18 stasiun (urut bab buku) + ujian urutan peristiwa. 3 soal per level per stasiun = 54 soal/level.
- `S[i].q[m]` = soal 1 (opsi tetap, `a` = indeks benar). `X[i][m]` = 2 soal tambahan, dibuat `assemble.py` (opsi diacak seeded, `a` dihitung ulang). `QS(i)` = gabungan 3 soal. m = `s` (SMP, 3 opsi) / `d` (dewasa, 4 opsi).
- Tiap soal punya `e` (penjelasan) dan `h` (rujukan "hlm. N" — nomor halaman cetakan buku = halaman PDF − 33).
- OCR buku: PDF hasil scan (tanpa text layer). Teks OCR tidak ikut di bundle; kalau perlu verifikasi fakta, pakai PDF-nya (Project "Siroh" di claude.ai) atau OCR ulang dengan tesseract.

## State & UX
- localStorage key `peta-sirah-v2` (`prog.{s,d}.qd[i]` = jumlah soal benar 0–3, `pts`, `tl`). Migrasi otomatis dari `peta-sirah-v1`.
- Stasiun terkunci sampai stasiun sebelumnya 3/3 (kecuali "Mode belajar"). Poin: SMP 4/soal, dewasa 8/soal, setengahnya kalau salah dulu; ujian urutan +30/+60.
- Setelah benar: tombol "Soal berikutnya"; selesai 3 soal -> mode ulasan semua soal.
- Stasiun yang dibuka melebar penuh (node disembunyikan) supaya peta cukup lebar di HP.

## Sistem peta
- Dasar: `Lr` (regional, lon 31–48, lat 9–33, `x=(lon−31)·cos23°·60`, `y=(33−lat)·60`) dan `Lw` (lebar, lon 25–60, lat 9–39, `x=(lon−25)·cos27°·20`, `y=(39−lat)·20`). Path ada di `<defs>` svg tersembunyi, dipakai lewat `<use>`.
- Spesifikasi peta di `MP`: `b` dasar (r/w), `bx` bbox [lonB,lonT,latS,latU], `p` titik [kunci,label,dx,dy,anchor,"m"=utama], `r` rute {p, c:a|b|c, d:putus-putus, a:panah, l:legend}, `x` teks wilayah, `n` catatan (selalu cantumkan hlm. dan disclaimer skematis).
- `placeLabels()` menaruh label otomatis tanpa tabrak label/titik/garis rute (kandidat: dasar, tengah atas/bawah, flip, geser dy).
- Peta ringkasan (`OV`): titik tempat berwarna sesuai progres stasiun terkait.
- Peta Abrahah ada di stasiun 2 (hlm. 44–45), Thaif + Isra' di stasiun 7 (hlm. 141–164). Stasiun 4 dan 6 (indeks 3 dan 5) belum punya peta.

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
