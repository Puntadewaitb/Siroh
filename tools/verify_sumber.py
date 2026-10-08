# Skrining: token kunci jawaban/penjelasan tiap soal dicari di teks OCR halaman rujukan. Pakai: python3 tools/verify_sumber.py <WORKDIR> (berisi q.json dan ocr/pg-NNN.txt).
import json,re,sys,difflib,os
W=sys.argv[1]
q=json.load(open(W+"/q.json"))
def norm(s):
    s=s.lower().replace("’","'").replace("'","")
    for a,b in (("qu","ku"),("ou","ku"),("oush","kush"),("gur","kur"),("q","k"),("c","k"),("dh","d"),("zh","z"),("sy","s"),("kh","k"),("th","t"),("gh","g"),("sh","s"),("ai","ay"),("ei","ay")): s=s.replace(a,b)
    return re.sub(r'[^a-z0-9]','',s)
STOP=set("yang dan dari untuk dengan buku bahwa atau pada itu ini oleh kepada telah tidak adalah dalam setelah karena sebagai kemudian menurut sampai hingga lalu ada para juga agar akan namun tetapi ketika saat beliau nabi rasulullah mereka dia ia kaum".split())
import glob
res=[]
for x in q:
    nums=[int(n) for n in re.findall(r'\d+',x['h'].split('hlm.')[-1])]
    if '–' in x['h'] and len(nums)==2 and ',' not in x['h']: nums=list(range(nums[0],nums[1]+1))
    # allow neighbor pages
    txt=""
    for p in set(nums):
        f="%s/ocr/pg-%03d.txt"%(W,p+33)
        if os.path.exists(f): txt+=open(f).read()+" "
    words=set(norm(w) for w in re.findall(r"[A-Za-z0-9’']+",txt))
    wl=list(words)
    toks=[t for t in re.findall(r"[A-Za-z0-9’']{3,}",x['a']+" "+x['e']) if t.lower() not in STOP]
    miss=[]
    for t in toks:
        n=norm(t)
        if not n: continue
        if n in words: continue
        if any(len(n)>4 and (n in w or (len(w)>4 and w in n)) for w in wl): continue
        if difflib.get_close_matches(n,wl,1,0.8): continue
        miss.append(t)
    cov=1-len(miss)/max(1,len(toks))
    res.append((cov,x,miss))
res.sort(key=lambda r:r[0])
json.dump([{"cov":round(c,2),"st":x['st'],"m":x['m'],"k":x['k'],"miss":m} for c,x,m in res],open(W+"/screen.json","w"),ensure_ascii=False)
for c,x,m in res:
    if c<0.8: print("%.2f st%d %s q%d %s | miss: %s"%(c,x['st'],x['m'],x['k'],x['h'],", ".join(m)))
print(sum(1 for c,_,_ in res if c>=0.8),"/",len(res),"coverage>=0.8")
