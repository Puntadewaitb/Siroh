# Tampilkan konteks OCR sebuah soal. Pakai: python3 tools/lihat_konteks.py <WORKDIR> <stasiun> <s|d> <no> "kata|kunci"
import json,re,sys,os
W=sys.argv[1]; st=int(sys.argv[2]); m=sys.argv[3]; k=int(sys.argv[4]); kws=sys.argv[5].split("|"); extra=[int(p) for p in sys.argv[6:]]
q=json.load(open(W+"/q.json"))
x=[y for y in q if y['st']==st and y['m']==m and y['k']==k][0]
print("Q:",x['t'],"\nA:",x['a'],"\nE:",x['e'],"\nH:",x['h'])
nums=[int(n) for n in re.findall(r'\d+',x['h'].split('hlm.')[-1])]
if '–' in x['h'] and len(nums)==2 and ',' not in x['h']: nums=list(range(nums[0],nums[1]+1))
for p in sorted(set(nums+extra)):
    f="%s/ocr/pg-%03d.txt"%(W,p+33)
    if not os.path.exists(f):
        os.system('pdftoppm -f %d -l %d -r 200 -gray -png "/home/user/Siroh/Sirah Nabawiyah.pdf" %s/ocr/pg && OMP_THREAD_LIMIT=1 tesseract %s/ocr/pg-%03d.png %s/ocr/pg-%03d -l ind >/dev/null 2>&1'%(p+33,p+33,W,W,p+33,W,p+33))
    lines=open(f).read().split("\n")
    hit=set()
    for i,l in enumerate(lines):
        if any(re.search(kw,l,re.I) for kw in kws):
            hit.update(range(max(0,i-1),min(len(lines),i+2)))
    if hit:
        print("--- hlm",p,"---")
        prev=-9
        for i in sorted(hit):
            if i-prev>1: print("   ...")
            print(lines[i]); prev=i
