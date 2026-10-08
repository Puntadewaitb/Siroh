#!/bin/bash
# Verifikasi soal ke buku: OCR semua halaman yang dirujuk lalu skrining.
# Butuh: poppler-utils, tesseract-ocr + tesseract-ocr-ind, node, python3, dan "Sirah Nabawiyah.pdf" di root repo.
# Nomor halaman buku = nomor halaman PDF - 33.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; W="${1:-/tmp/sirah-verify}"; mkdir -p "$W/ocr"; export OMP_THREAD_LIMIT=1
node "$ROOT/tests/cited_pages.mjs" "$W/q.json"
python3 - "$W" <<'PY' > "$W/pages.txt"
import json,re,sys
q=json.load(open(sys.argv[1]+"/q.json"));s=set()
for x in q:
    n=[int(v) for v in re.findall(r'\d+',x['h'].split('hlm.')[-1])]
    if '–' in x['h'] and len(n)==2 and ',' not in x['h']: n=list(range(n[0],n[1]+1))
    s.update(n)
print("\n".join("%03d"%(p+33) for p in sorted(s)))
PY
cat "$W/pages.txt" | xargs -P4 -I{} bash -c "[ -s $W/ocr/pg-{}.txt ] || { pdftoppm -f \$((10#{})) -l \$((10#{})) -r 200 -gray -png '$ROOT/Sirah Nabawiyah.pdf' $W/ocr/pg; tesseract $W/ocr/pg-{}.png $W/ocr/pg-{} -l ind >/dev/null 2>&1; }"
python3 "$ROOT/tools/verify_sumber.py" "$W"
