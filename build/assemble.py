import sys,os;sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import json,random,re,sys
sys.path.insert(0,'.')
from qdata import ST
import os
B=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..')+'/'
sblock=open(B+'build/s_block.js').read()
v1=set(re.findall(r'\{t:"([^"]+)",o:\[',sblock))
X=[]
for si,st in enumerate(ST):
    row={}
    for m in 's','d':
        qs=[]
        assert len(st[m])==2,(si,m)
        for qi,(q,ok,wr,ex,h) in enumerate(st[m]):
            assert q not in v1,('dup',q)
            assert len(wr)==(2 if m=='s' else 3),(si,m,qi)
            assert ok not in wr
            opts=[ok]+list(wr)
            rnd=random.Random("sirah-%d-%s-%d"%(si,m,qi))
            rnd.shuffle(opts)
            qs.append({'t':q,'o':opts,'a':opts.index(ok),'e':ex,'h':h})
        row[m]=qs
    X.append(row)
assert len(X)==18
# Bank soal tambahan (tipe: pilihan ganda, pilih 2 dari 5, urutkan, jodohkan)
from bank import BANK
Z=[]
for si in range(18):
    row={}
    for m in 's','d':
        out=[]
        for qi,q in enumerate(BANK.get(si+1,{}).get(m,[])):
            rnd=random.Random("bank-%d-%s-%d"%(si,m,qi))
            ty=q['ty']
            if ty=='mc':
                nw=2 if m=='s' else 3
                assert len(q['w'])==nw and q['b'] not in q['w'],(si,m,qi,'mc')
                o=[q['b']]+list(q['w']);rnd.shuffle(o)
                out.append({'ty':'mc','t':q['t'],'o':o,'a':o.index(q['b']),'e':q['e'],'h':q['h']})
            elif ty=='mu':
                assert len(q['b'])==2 and len(q['w'])==3 and not set(q['b'])&set(q['w']),(si,m,qi,'mu')
                o=list(q['b'])+list(q['w']);rnd.shuffle(o)
                out.append({'ty':'mu','t':q['t'],'o':o,'a':sorted(o.index(x) for x in q['b']),'e':q['e'],'h':q['h']})
            elif ty=='or':
                n=3 if m=='s' else 4
                assert len(q['it'])==n and len(set(q['it']))==n,(si,m,qi,'or')
                out.append({'ty':'or','t':q['t'],'it':q['it'],'e':q['e'],'h':q['h']})
            elif ty=='mt':
                assert len(q['pairs'])==3 and len({a for a,_ in q['pairs']})==3 and len({b for _,b in q['pairs']})==3,(si,m,qi,'mt')
                out.append({'ty':'mt','t':q['t'],'l':[a for a,_ in q['pairs']],'r':[b for _,b in q['pairs']],'e':q['e'],'h':q['h']})
            else: raise Exception(ty)
        row[m]=out
    Z.append(row)
# Soal mudah (hanya pilihan ganda) untuk stasiun awal: build/easy/easyN.json menggantikan bank stasiun itu
EZ={}
for si in range(18):
    f=B+'build/easy/easy%d.json'%si
    if not os.path.exists(f):continue
    d=json.load(open(f));row={}
    for m in 's','d':
        nw=2 if m=='s' else 3;out=[]
        assert len(d[m])==10,(si,m)
        for qi,q in enumerate(d[m]):
            assert len(q['w'])==nw and q['b'] not in q['w'] and 'hlm' not in (q['t']+q['e']).lower(),(si,m,qi)
            o=[q['b']]+list(q['w']);random.Random("easy-%d-%s-%d"%(si,m,qi)).shuffle(o)
            out.append({'ty':'mc','t':q['t'],'o':o,'a':o.index(q['b']),'e':q['e'],'h':q['h']})
        row[m]=out
    EZ[si]=row
css=open(B+'build/css_old.txt').read()+open(B+'build/style_new.css').read()
head=open(B+'build/head.html').read()
tl=open(B+'build/tl_block.js').read()
# Kartu koleksi: 3 kartu per stasiun (tokoh/tempat/peristiwa); h = rujukan hlm. (tidak ditampilkan)
KARTU=json.load(open(B+'build/kartu.json'))
assert sorted(KARTU,key=int)==[str(i) for i in range(18)]
for i,L in KARTU.items():
    assert len(L)==3 and {c['k'] for c in L}=={'tokoh','tempat','peristiwa'},i
    for c in L: assert c['n'] and c['t'] and 'hlm' not in (c['n']+c['t']).lower() and '"' not in c['t'] and c['h'].startswith('hlm. '),(i,c['n'])
# ---- Game utama (index.html): peta 3D + timeline + adegan; data stasiun, Three.js subset, terrain tertanam ----
import base64
tmeta=json.load(open(B+'build/terrain/meta.json'))
TERR={k:dict(v,src='data:image/png;base64,'+base64.b64encode(open(B+'build/terrain/%s.png'%k,'rb').read()).decode()) for k,v in tmeta.items()}
body3='''<div class="wrap w3">
  <header class="top3"><h1>Peta Sirah Nabawiyah</h1><p class="src">Bersumber dari buku <i>Sirah Nabawiyah</i> (Ar-Rahiqul Makhtum) karya Syaikh Shafiyyurrahman Al-Mubarakfuri.</p>
    <div class="hud3"><div class="seg" role="group" aria-label="Pilih level"><button id="ms3" aria-pressed="true">SMP</button><button id="md3" aria-pressed="false">Dewasa</button></div>
    <span>Poin <b id="pts3">0</b></span><span>Stasiun <b id="cnt3">0</b>/18</span><span title="Hari latihan berturut-turut">Rentetan <b id="stk3">0</b> hari</span>
    <label class="learn"><input type="checkbox" id="learn3"> Buka semua stasiun (Mode belajar)</label></div></header>
  <div class="m3wrap"><div id="m3" class="m3"></div>
    <div class="c3"><button data-c="me" aria-label="Ke posisiku" title="Ke posisiku">◎</button><button data-c="zin" aria-label="Perbesar" title="Perbesar">+</button><button data-c="zout" aria-label="Perkecil" title="Perkecil">−</button><button data-c="tilt" aria-label="Miring atau tegak" title="Miring/tegak">⛰</button><button data-c="all" aria-label="Lihat semua" title="Lihat semua">▣</button></div>
    <button id="back3" class="back3" data-a="back" hidden>← Peta perjalanan</button>
  </div>
  <nav id="tl3" class="tl3" aria-label="Timeline stasiun sirah"></nav>
  <section id="info3" class="info3" aria-live="polite"></section>
  <section class="menu3" aria-label="Mode bermain lain">
    <button data-mn="latihan"><b>Latihan harian</b><small id="ltdue">5 soal</small></button>
    <button data-mn="album"><b>Album kartu</b><small id="kcnt">0/54</small></button>
    <button data-mn="tantangan"><b>Tantangan acak</b><small>10 soal</small></button>
    <button data-mn="ujian"><b>Ujian urutan</b><small>stasiun akhir</small></button>
  </section>
  <details class="set3"><summary>Pengaturan grafis</summary>
    <div class="seg" role="group" aria-label="Kualitas grafis"><button data-gfx="auto">Otomatis</button><button data-gfx="tinggi">Tinggi</button><button data-gfx="ringan">Ringan</button></div>
    <p class="mut3 sm3">Sekarang: <b id="gfxnow">tinggi</b>. Mode ringan mematikan bayangan, mengurangi partikel, dan menurunkan resolusi agar lancar di HP sederhana.</p></details>
  <p class="foot3">Relief: data ketinggian Terrain Tiles (AWS Open Data; sumber antara lain SRTM, ETOPO1), ketinggian dibesarkan. Posisi tempat dan rute perkiraan, skematis.</p>
</div>
<div id="mdl" class="mdl" hidden><div class="mdlb" role="dialog" aria-modal="true" aria-labelledby="mdlt"><div class="mdlh"><h2 id="mdlt" tabindex="-1"></h2><button class="mdx" data-m="x" aria-label="Tutup">×</button></div><div id="mdlc" class="mdlc"></div></div></div>
'''
KIS={i:json.load(open(B+'build/kisah/kisah%d.json'%i)) for i in range(18) if os.path.exists(B+'build/kisah/kisah%d.json'%i)}
for i,k in KIS.items():
    for m in 's','d':
        for b in k[m]: assert b['t'] and 'hlm' not in b['t'].lower() and '"' not in b['t'],(i,m,b['t'][:40])
IXS={}
for i in range(18):
    f=B+'build/inter/inter%d.json'%i
    if not os.path.exists(f):continue
    L=json.load(open(f))
    for st_ in L:
        assert st_['k'] in ('tebak','jelajah','aksi') and set(st_['before'])=={'s','d'},(i,st_)
        txt=json.dumps(st_,ensure_ascii=False)
        for fld in ('q','r','t','no'):
            assert 'hlm' not in str(st_.get(fld,'')).lower() and '"' not in str(st_.get(fld,'')),(i,fld)
        if st_['k']=='tebak':assert len(st_['o'])==3 and 0<=st_['a']<3,(i,st_['q'])
        if st_['k']=='jelajah':
            for sp in st_['spots']:assert 'hlm' not in sp[2].lower() and '"' not in sp[2],(i,sp)
    IXS[i]=L
J=lambda f:open(B+'build/'+f).read()
js3=(sblock+'\nvar INTER3='+json.dumps(IXS,ensure_ascii=False)+';\nvar KISAH3='+json.dumps(KIS,ensure_ascii=False)+';\nvar KARTU='+json.dumps(KARTU,ensure_ascii=False)+';\n'
  +'var X='+json.dumps(X,ensure_ascii=False)+';\nvar Z='+json.dumps(Z,ensure_ascii=False)+';\nvar EZ='+json.dumps(EZ,ensure_ascii=False)+';\n'+tl+'\n'
  +'\n'.join(J(f) for f in ['maps.js','nodes.js','quiz.js','challenge.js','core.js','latihan.js','ujian.js','kartu.js'])
  +'\n/* ---------- Peta ---------- */\nvar TERR='+json.dumps(TERR)+';\n'+'\n'.join(J(f) for f in ['map3d.js','scene3d.js','game.js']))
out3=head+'<style>\n'+css.replace('<style>','').replace('</style>','')+open(B+'build/map3d.css').read()+'</style>\n</head>\n<body>\n'+body3+'<script>\n'+J('vendor/three.min.js')+'\n</script>\n<script>\n'+js3+'\n</script>\n<script>if("serviceWorker" in navigator&&/^https?:/.test(location.protocol)){try{navigator.serviceWorker.register("sw.js").catch(function(){});}catch(e){}}</script>\n</body>\n</html>\n'
open(B+'index.html','w').write(out3)
print('index.html',len(out3.encode()))
# peta3d.html lama -> alihkan ke versi utama (tautan lama tetap jalan)
open(B+'peta3d.html','w').write('<!doctype html>\n<html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Peta Sirah Nabawiyah</title><meta http-equiv="refresh" content="0;url=index.html"><link rel="canonical" href="index.html"></head>\n<body><p><a href="index.html">Buka Peta Sirah Nabawiyah</a></p><script>location.replace("index.html"+location.hash);</script></body></html>\n')
