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
css=open(B+'build/css_old.txt').read()+open(B+'build/style_new.css').read()
land_r=open(B+'mapgen/reg-land.txt').read(); land_w=open(B+'mapgen/wide-land.txt').read()
defs='<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs><path id="Lr" fill-rule="evenodd" d="%s"/><path id="Lw" fill-rule="evenodd" d="%s"/>'%(land_r,land_w)
for c in 'abc':
    defs+='<marker id="ma-%s" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0L10,5L0,10z" class="ma-%s"/></marker>'%(c,c)
defs+='</defs></svg>'
# CSS lama: ambil seluruhnya (sudah berisi <style> pembuka?) -> lihat di bawah
head=open(B+'build/head.html').read()
body='''<div class="wrap">
  <header class="top">
    <h1>Peta Sirah Nabawiyah</h1>
    <p class="src"><a class="try3" href="peta3d.html">Coba peta 3D (prototipe) →</a></p>
    <p class="src">Dari buku <i>Sirah Nabawiyah</i> (Ar-Rahiqul Makhtum) karya Syaikh Shafiyyurrahman Al-Mubarakfuri.</p>
    <div class="ctrl">
      <div class="seg" role="group" aria-label="Pilih level">
        <button id="m-smp" aria-pressed="true">Level SMP</button>
        <button id="m-dewasa" aria-pressed="false">Level dewasa</button>
      </div>
      <div class="stats" aria-live="polite"><span>Poin <b id="pts">0</b></span><span>Soal <b id="qn">0</b>/54</span><span>Stasiun <b id="cnt">0</b>/18</span></div>
    </div>
    <div class="bar" aria-hidden="true"><i id="bar" style="width:0%"></i></div>
    <label class="learn"><input type="checkbox" id="learn"> Mode belajar: buka semua stasiun tanpa urutan</label>
  </header>
  <div class="game"><div class="boardw"><div id="board"></div></div><main id="app" aria-live="off"></main></div>
  <section class="extras" aria-label="Lencana dan tantangan"><div id="badges"></div><details class="ovbox chbox"><summary>Tantangan acak</summary><div id="ch"></div></details></section>
</div>
'''
tl=open(B+'build/tl_block.js').read()
js=sblock+'\nvar X='+json.dumps(X,ensure_ascii=False)+';\nvar Z='+json.dumps(Z,ensure_ascii=False)+';\n'+tl+'\n'+open(B+'build/maps.js').read()+'\n'+open(B+'build/challenge.js').read()+'\n'+open(B+'build/board.js').read()+'\n'+open(B+'build/quiz.js').read()+'\n'+open(B+'build/core.js').read()+'\n'+open(B+'build/app.js').read()
out=head+'<style>\n'+css.replace('<style>','').replace('</style>','')+'</style>\n</head>\n<body>\n'+defs+'\n'+body+'<script>\n'+js+'\n</script>\n<script>if("serviceWorker" in navigator&&/^https?:/.test(location.protocol)){try{navigator.serviceWorker.register("sw.js").catch(function(){});}catch(e){}}</script>\n</body>\n</html>\n'
open(B+'index.html','w').write(out)
print(len(out.encode()))

# ---- Prototipe peta 3D (peta3d.html): data stasiun + peta, Three.js subset, terrain tertanam ----
import base64
tmeta=json.load(open(B+'build/terrain/meta.json'))
TERR={k:dict(v,src='data:image/png;base64,'+base64.b64encode(open(B+'build/terrain/%s.png'%k,'rb').read()).decode()) for k,v in tmeta.items()}
body3='''<div class="wrap w3">
  <header class="top3"><h1>Peta Sirah Nabawiyah</h1><p class="src">Bersumber dari buku <i>Sirah Nabawiyah</i> (Ar-Rahiqul Makhtum) karya Syaikh Shafiyyurrahman Al-Mubarakfuri.</p><p class="src">Versi 3D (uji coba) · <a href="index.html">versi utama</a></p>
    <div class="hud3"><div class="seg" role="group" aria-label="Pilih level"><button id="ms3" aria-pressed="true">SMP</button><button id="md3" aria-pressed="false">Dewasa</button></div>
    <span>Poin <b id="pts3">0</b></span><span>Stasiun <b id="cnt3">0</b>/18</span></div></header>
  <div class="m3wrap"><div id="m3" class="m3"></div>
    <div class="c3"><button data-c="me" aria-label="Ke posisiku" title="Ke posisiku">◎</button><button data-c="zin" aria-label="Perbesar" title="Perbesar">+</button><button data-c="zout" aria-label="Perkecil" title="Perkecil">−</button><button data-c="tilt" aria-label="Miring atau tegak" title="Miring/tegak">⛰</button><button data-c="all" aria-label="Lihat semua" title="Lihat semua">▣</button></div>
    <button id="back3" class="back3" data-a="back" hidden>← Peta perjalanan</button>
  </div>
  <nav id="tl3" class="tl3" aria-label="Timeline stasiun sirah"></nav>
  <section id="info3" class="info3" aria-live="polite"></section>
  <p class="foot3">Relief: data ketinggian Terrain Tiles (AWS Open Data; sumber antara lain SRTM, ETOPO1), ketinggian dibesarkan. Posisi tempat dan rute perkiraan, skematis.</p>
</div>
'''
js3=sblock+'\nvar X='+json.dumps(X,ensure_ascii=False)+';\nvar Z='+json.dumps(Z,ensure_ascii=False)+';\n'+tl+'\n'+open(B+'build/maps.js').read()+'\n'+open(B+'build/board.js').read()+'\n'+open(B+'build/quiz.js').read()+'\n'+open(B+'build/core.js').read()+'\nvar TERR='+json.dumps(TERR)+';\n'+open(B+'build/map3d.js').read()+'\n'+open(B+'build/scene3d.js').read()+'\n'+open(B+'build/proto3d.js').read()
css3=open(B+'build/map3d.css').read()
out3=head.replace('<title>Peta Sirah Nabawiyah</title>','<title>Peta Sirah 3D</title>')+'<style>\n'+css.replace('<style>','').replace('</style>','')+css3+'</style>\n</head>\n<body>\n'+body3+'<script>\n'+open(B+'build/vendor/three.min.js').read()+'\n</script>\n<script>\n'+js3+'\n</script>\n</body>\n</html>\n'
open(B+'peta3d.html','w').write(out3)
print('peta3d.html',len(out3.encode()))
