var KEY="peta-sirah-v2",NQ=3;
var st={mode:"s",open:0,learn:false,mt:{},prog:{s:{qd:{},pts:0,tl:false},d:{qd:{},pts:0,tl:false}}};
var wrong=[],justOk={},tl={seq:[],order:[],msg:"",ok:false};

function load(){
  try{var v=JSON.parse(localStorage.getItem(KEY));if(v&&v.prog){st.prog=v.prog;st.mode=v.mode||"s";return;}}catch(e){}
  try{var o=JSON.parse(localStorage.getItem("peta-sirah-v1"));
    if(o&&o.prog){["s","d"].forEach(function(m){var p=o.prog[m];if(!p)return;Object.keys(p.done||{}).forEach(function(i){st.prog[m].qd[i]=1;});st.prog[m].pts=p.pts||0;st.prog[m].tl=false;});st.mode=o.mode||"s";}}catch(e){}
}
function save(){try{localStorage.setItem(KEY,JSON.stringify({prog:st.prog,mode:st.mode}));}catch(e){}}
function P(){return st.prog[st.mode];}
function QS(i){return [S[i].q[st.mode]].concat(X[i][st.mode]);}
function got(i){return P().qd[i]||0;}
function isDone(i){return got(i)>=NQ;}
function doneCount(){var n=0;for(var i=0;i<S.length;i++)if(isDone(i))n++;return n;}
function qCount(){var n=0;for(var i=0;i<S.length;i++)n+=Math.min(got(i),NQ);return n;}
function unlocked(i){return st.learn||i===0||isDone(i-1);}
function esc(x){return String(x).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
function firstOpen(){for(var i=0;i<S.length;i++){if(!isDone(i))return i;}return S.length;}
function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}
function newTL(){var n=TL[st.mode].length;var idx=[];for(var i=0;i<n;i++)idx.push(i);var o=shuffle(idx);var tries=0;while(tries<5&&o.join()===idx.join()){o=shuffle(idx);tries++;}tl={seq:[],order:o,msg:"",ok:false};}

/* ---------- Peta ---------- */
var C23=Math.cos(23*Math.PI/180),C27=Math.cos(27*Math.PI/180);
function proj(base,lat,lon){return base==="w"?[(lon-25)*C27*20,(39-lat)*20]:[(lon-31)*C23*60,(33-lat)*60];}
function pt(k){return typeof k==="string"?PL[k]:k;}
function boxPx(base,bx){var a=proj(base,bx[3],bx[0]),b=proj(base,bx[2],bx[1]);return {x0:a[0],y0:a[1],w:b[0]-a[0],h:b[1]-a[1]};}
function tw(s){return s.length*6.3+4;}
function overlap(a,b){return !(a.r<b.l||a.l>b.r||a.B<b.t||a.t>b.B);}
function placeLabels(items,W,H,occ){
  /* items: {x,y,l,dx,dy,an}; hasilkan posisi tanpa tabrakan dengan label lain dan titik */
  var boxes=occ.slice(),out=[];
  items.forEach(function(it){
    var w=tw(it.l),cands=[],an=it.an||"s",dx=an==="m"?0:(it.dx<0?Math.min(it.dx,-10):Math.max(it.dx,10)),dy=it.dy;
    var flip=an==="s"?"e":"s";
    var fl=function(a,d){return a==="s"?d:-Math.abs(d);};
    cands.push([an,dx,dy]);cands.push(["m",0,-12]);cands.push(["m",0,18]);cands.push([flip,-dx,dy]);
    [-14,14,-28,28,-42,42].forEach(function(s){cands.push([an,dx,dy+s]);cands.push([flip,-dx,dy+s]);});
    var best=null;
    for(var c=0;c<cands.length;c++){
      var a=cands[c][0],ddx=cands[c][1],ddy=cands[c][2];
      var x=it.x+ddx,y=it.y+ddy;
      var l=a==="s"?x:(a==="m"?x-w/2:x-w),r=a==="s"?x+w:(a==="m"?x+w/2:x);
      var bx={l:l,r:r,t:y-10,B:y+4};
      if(l<3||r>W-3||bx.t<3||bx.B>H-3)continue;
      var hit=false;for(var k=0;k<boxes.length;k++){if(overlap(bx,boxes[k])){hit=true;break;}}
      if(!hit){best={x:x,y:y,a:a,box:bx};break;}
    }
    if(!best){var a0=an,x0=it.x+dx,y0=it.y+dy,l0=a0==="s"?x0:x0-w;
      if(l0<3){a0="s";x0=3;}else if(l0+w>W-3){a0="e";x0=W-3;}
      best={x:x0,y:Math.max(12,Math.min(H-4,y0)),a:a0,box:{l:0,r:0,t:0,B:0}};}
    boxes.push(best.box);out.push(best);
  });
  return out;
}
function routePath(base,r,bp,k,W,H){
  var pts=r.p.map(function(q){var c=pt(q);var p=proj(base,c[0],c[1]);return [(p[0]-bp.x0)*k,(p[1]-bp.y0)*k];});
  if(r.a&&pts.length>1){var a=pts[pts.length-2],b=pts[pts.length-1];var dx=b[0]-a[0],dy=b[1]-a[1],d=Math.sqrt(dx*dx+dy*dy)||1;var cut=Math.min(8,d*0.4);pts[pts.length-1]=[b[0]-dx/d*cut,b[1]-dy/d*cut];}
  return "M"+pts.map(function(p){return p[0].toFixed(1)+","+p[1].toFixed(1);}).join("L");
}
function lineBoxes(d){
  var pts=d.slice(1).split("L").map(function(q){var z=q.split(",");return [parseFloat(z[0]),parseFloat(z[1])];}),out=[];
  for(var i=1;i<pts.length;i++){var a=pts[i-1],b=pts[i],dx=b[0]-a[0],dy=b[1]-a[1],n=Math.max(1,Math.ceil(Math.sqrt(dx*dx+dy*dy)/5));
    for(var j=0;j<=n;j++){var x=a[0]+dx*j/n,y=a[1]+dy*j/n;out.push({l:x-3,r:x+3,t:y-3,B:y+3});}}
  return out;
}
function mapSVG(m,W,opt){
  var bp=boxPx(m.b,m.bx),k=W/bp.w,H=Math.round(bp.h*k);
  var s='<svg class="map" viewBox="0 0 '+W+' '+H+'" width="'+W+'" height="'+H+'" role="img" aria-label="'+esc(m.t)+'">';
  s+='<rect width="'+W+'" height="'+H+'" class="sea"/>';
  s+='<g transform="scale('+k.toFixed(4)+') translate('+(-bp.x0).toFixed(1)+' '+(-bp.y0).toFixed(1)+')"><use href="#'+(m.b==="w"?"Lw":"Lr")+'" class="land"/></g>';
  var occ=[];
  (m.r||[]).forEach(function(r){occ=occ.concat(lineBoxes(routePath(m.b,r,bp,k,W,H)));});
  (m.r||[]).forEach(function(r){s+='<path class="rt rt-'+r.c+(r.d?" dash":"")+'" d="'+routePath(m.b,r,bp,k,W,H)+'"'+(r.a?' marker-end="url(#ma-'+r.c+')"':'')+'/>';});
  var items=[],dots="";
  (m.p||[]).forEach(function(p){
    var c=PL[p[0]],q=proj(m.b,c[0],c[1]),x=(q[0]-bp.x0)*k,y=(q[1]-bp.y0)*k;
    var main=p[5]==="m",r=main?6:4.5;
    dots+='<circle class="pt'+(main?" main":"")+'" cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+r+'"/>';
    occ.push({l:x-r-2,r:x+r+2,t:y-r-2,B:y+r+2});
    items.push({x:x,y:y,l:p[1],dx:p[2],dy:p[3],an:p[4]==="e"?"e":(p[4]==="m"?"m":"s")});
  });
  var tx="";
  (m.x||[]).forEach(function(z){var q=proj(m.b,z[1],z[2]),x=(q[0]-bp.x0)*k,y=(q[2-1]-bp.y0)*k;tx+='<text class="rg" x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" text-anchor="middle">'+esc(z[0])+'</text>';occ.push({l:x-tw(z[0])/2,r:x+tw(z[0])/2,t:y-10,B:y+4});});
  var pos=placeLabels(items,W,H,occ);
  var lb="";
  pos.forEach(function(p,i){lb+='<text class="lb" x="'+p.x.toFixed(1)+'" y="'+p.y.toFixed(1)+'" text-anchor="'+(p.a==="s"?"start":(p.a==="m"?"middle":"end"))+'">'+esc(items[i].l)+'</text>';});
  return s+tx+dots+lb+'</svg>';
}
function legendHTML(m){
  var L=(m.r||[]).filter(function(r){return r.l;});
  if(!L.length)return "";
  return '<ul class="leg">'+L.map(function(r){return '<li><svg width="30" height="8" aria-hidden="true"><line x1="1" y1="4" x2="29" y2="4" class="rt rt-'+r.c+(r.d?" dash":"")+'"/></svg><span>'+esc(r.l)+'</span></li>';}).join("")+'</ul>';
}
function appW(){var a=document.getElementById("app");return Math.max(240,a.clientWidth);}
function mapBlock(i){
  var ids=SM[i]||[];if(!ids.length)return "";
  var cur=Math.min(st.mt[i]||0,ids.length-1),m=MP[ids[cur]];
  var W=Math.min(appW()-30,560);
  var h='<div class="mapbox"><span class="lbl">Peta</span>';
  if(ids.length>1){h+='<div class="tabs" role="group" aria-label="Pilih peta">'+ids.map(function(id,k){return '<button data-act="mt" data-i="'+i+'" data-k="'+k+'" aria-pressed="'+(k===cur)+'">'+esc(MTAB[id])+'</button>';}).join("")+'</div>';}
  h+='<figure class="fig"><figcaption class="mt">'+esc(m.t)+'</figcaption>'+mapSVG(m,W)+legendHTML(m)+'<p class="mn">'+esc(m.n)+'</p></figure></div>';
  return h;
}
/* ---------- Stasiun ---------- */
function qBlock(i){
  var m=st.mode,qs=QS(i),n=got(i),h="";
  var lbl=(m==="s"?"SMP":"dewasa");
  if(isDone(i)&&!justOk[i]){
    h+='<div class="q"><span class="lbl">Ulasan · '+lbl+'</span>';
    qs.forEach(function(q,k){h+='<div class="rv"><p class="qt">'+(k+1)+'. '+esc(q.t)+'</p><p class="ans">Jawaban: '+esc(q.o[q.a])+'</p><p class="fb good">'+esc(q.e)+' <span class="ref">'+esc(q.h)+'</span></p></div>';});
    h+='</div>';
    return h;
  }
  var c=justOk[i]?n-1:n,q=qs[c],w=wrong[i]||[];
  h+='<div class="q"><span class="lbl">Pertanyaan '+(c+1)+' dari '+NQ+' · '+lbl+'</span><p class="qt" tabindex="-1" id="qt">'+esc(q.t)+'</p><div class="opts">';
  q.o.forEach(function(o,k){
    var cls="opt",dis="";
    if(justOk[i]){dis=" disabled";if(k===q.a)cls+=" ok";}
    else if(w.indexOf(k)>-1){cls+=" bad";dis=" disabled";}
    h+='<button class="'+cls+'" data-act="ans" data-i="'+i+'" data-k="'+k+'"'+dis+'>'+esc(o)+'</button>';
  });
  h+='</div><div aria-live="polite">';
  if(justOk[i])h+='<p class="fb good">'+esc(q.e)+' <span class="ref">'+esc(q.h)+'</span></p>';
  else if(w.length)h+='<p class="fb err">Belum tepat. Baca lagi ringkasan dan peta di atas atau buka '+esc(q.h)+' di buku, lalu coba lagi.</p>';
  h+='</div>';
  if(justOk[i]){
    if(c<NQ-1)h+='<button class="btn" data-act="nextq" data-i="'+i+'">Soal berikutnya</button>';
    else h+='<button class="btn" data-act="nextq" data-i="'+i+'">Selesai: lihat ulasan</button>';
  }
  return h+'</div>';
}
function stState(j){
  if(stDone(j))return "done";
  if(!stUnlocked(j))return "lock";
  return j===firstOpen()?"cur":"open";
}
function bandOf(i){for(var b=0;b<BANDS.length;b++)if(i>=BANDS[b].from&&i<=BANDS[b].to)return BANDS[b].t;return "Ujian akhir";}
function tlBody(){
  var ev=TL[st.mode];
  if(!tl.order.length||tl.order.length!==ev.length)newTL();
  var h='<div class="tl"><p>Ketuk peristiwa dari yang paling awal. Ketuk lagi di urutanmu untuk membatalkan.</p>';
  h+='<span class="tag">Pilihan</span><ul class="pool">';
  tl.order.forEach(function(idx){if(tl.seq.indexOf(idx)<0)h+='<li><button data-act="pick" data-k="'+idx+'">'+esc(ev[idx][0])+'</button></li>';});
  h+='</ul><span class="tag">Urutanmu</span><ol class="seq">';
  tl.seq.forEach(function(idx,n){h+='<li><button data-act="unpick" data-k="'+idx+'"><span class="n">'+(n+1)+'.</span>'+esc(ev[idx][0])+'</button></li>';});
  h+='</ol><div aria-live="polite">'+(tl.msg?'<p class="fb '+(tl.ok?'good':'err')+'">'+tl.msg+'</p>':'')+'</div>';
  h+='<div class="row"><button class="btn" data-act="check">Periksa urutan</button><button class="btn ghost" data-act="reset">Acak ulang</button></div></div>';
  if(P().tl)h+='<div class="end"><h2>Jalur selesai</h2><p>Kamu menamatkan 18 stasiun (54 soal) dan ujian urutan di level '+(st.mode==="s"?"SMP":"dewasa")+' dengan '+P().pts+' poin. Coba level lain untuk pertanyaan yang lebih dalam.</p></div>';
  return h;
}
function panelHTML(enter){
  var i=st.sel.i,nk=NODE_OF[i],nd=NODES[nk],ids=nd.sts,d=0;
  ids.forEach(function(j){if(stDone(j))d++;});
  var h='<div class="pn'+(enter?' enter':'')+'" id="pn"><div class="pnh"><span class="pl">'+esc(nd.full)+'</span><span class="pc">'+d+'/'+ids.length+' selesai</span></div>';
  h+='<div class="stabs" role="group" aria-label="Stasiun di '+esc(nd.full)+'">'+ids.map(function(j){
    var s=stState(j),ic={done:"✓",cur:"●",open:"○",lock:"🔒"}[s],lab=j===S.length?"★ Ujian":String(j+1);
    return '<button class="stab '+s+'" data-act="stab" data-i="'+j+'" aria-pressed="'+(j===i)+'" aria-label="'+(j===S.length?'Ujian urutan peristiwa':'Stasiun '+(j+1))+', '+({done:"selesai",cur:"sedang dikerjakan",open:"terbuka",lock:"terkunci"})[s]+'">'+lab+' <i aria-hidden="true">'+ic+'</i></button>';
  }).join("")+'</div>';
  if(i===S.length){
    h+='<h2 class="pt">Ujian: susun urutan peristiwa</h2><p class="pm">Semua bab · '+esc(bandOf(i))+'</p>';
    h+=stUnlocked(i)?'<div class="body">'+tlBody()+'</div>':lockMsg();
  }else{
    var s=S[i],m=st.mode;
    h+='<h2 class="pt">Stasiun '+(i+1)+' · '+esc(s.t)+'</h2><p class="pm">'+esc(bandOf(i))+' · '+esc(s.lok)+' · hlm. '+s.hlm+' · '+Math.min(got(i),NQ)+'/'+NQ+' soal</p>';
    if(!stUnlocked(i))h+=lockMsg();
    else{
      h+='<div class="body"><p>'+esc(s.r[m])+'</p><div class="chips">'+s.k.map(function(k){return '<span class="chip">'+esc(k)+'</span>';}).join("")+'</div>';
      h+=mapBlock(i)+qBlock(i);
      if(isDone(i)&&!justOk[i]){
        var to=i<S.length-1?i+1:S.length,go=NODE_OF[to]!==nk;
        h+='<button class="btn" data-act="next" data-i="'+i+'">'+(i<S.length-1?'Lanjut ke stasiun '+(i+2):'Ke ujian urutan peristiwa')+(go?' · menuju '+esc(NODES[NODE_OF[to]].n):'')+'</button>';
      }
      h+='</div>';
    }
  }
  return h+'<p class="bnote">Simbol dan rute pada papan bersifat skematis; posisi tempat perkiraan, bukan skala.</p></div>';
}
function lockMsg(){
  var fo=firstOpen();
  return '<div class="body"><p class="fb err">Terkunci. Selesaikan '+(fo>=S.length?'semua stasiun':'stasiun '+(fo+1))+' dulu, atau nyalakan Mode belajar.</p>'+(fo<=S.length?'<button class="btn ghost" data-act="stab" data-i="'+fo+'">Ke stasiun saat ini</button>':'')+'</div>';
}
function render(enter){
  var p=P(),n=doneCount();
  document.getElementById("pts").textContent=p.pts;
  document.getElementById("cnt").textContent=n;
  document.getElementById("qn").textContent=qCount();
  document.getElementById("bar").style.width=Math.round(qCount()/(S.length*NQ)*100)+"%";
  document.getElementById("m-smp").setAttribute("aria-pressed",st.mode==="s");
  document.getElementById("m-dewasa").setAttribute("aria-pressed",st.mode==="d");
  chRender();
  document.getElementById("app").innerHTML=panelHTML(enter);
  updateBoard();
}
function focusQ(){var q=document.getElementById("qt");if(q)q.focus({preventScroll:true});}
function toPanel(){var el=document.getElementById("pn");if(el&&el.scrollIntoView)el.scrollIntoView({block:"start",behavior:reduce()?"auto":"smooth"});}
/* pilih stasiun: kalau itu stasiun terdepan, token berjalan ke sana lebih dulu */
function select(i){
  if(BD.moving)return;
  var node=NODE_OF[i];
  if(i===firstOpen()&&stUnlocked(i)&&NODE_OF[BD.tokSt]!==node){
    travel(i,function(){st.sel.i=i;render(true);toPanel();});
    return;
  }
  st.sel.i=i;render(true);
  if(BD.view!=="focus"||Math.abs(wpos(node).x-BD.cam.x)+Math.abs(wpos(node).y-BD.cam.y)>2)focusNode(node);
  toPanel();
}
function nodeDefault(k){
  var ids=NODES[k].sts,fo=firstOpen(),j;
  if(ids.indexOf(fo)>-1)return fo;
  for(j=0;j<ids.length;j++)if(stUnlocked(ids[j])&&!stDone(ids[j]))return ids[j];
  for(j=0;j<ids.length;j++)if(stUnlocked(ids[j]))return ids[j];
  return ids[0];
}
function pickNode(k){if(BD.moving)return;select(nodeDefault(k));}

document.getElementById("app").addEventListener("click",function(e){
  var b=e.target.closest("button");if(!b)return;
  var act=b.getAttribute("data-act"),i=parseInt(b.getAttribute("data-i"),10),k=parseInt(b.getAttribute("data-k"),10);
  var m=st.mode,p=P();
  if(act==="stab"){select(i);return;}
  if(act==="mt"){st.mt[i]=k;render();return;}
  if(act==="ans"){
    if(isDone(i)||justOk[i])return;
    var q=QS(i)[got(i)];
    if(k===q.a){
      var first=!(wrong[i]&&wrong[i].length);
      p.qd[i]=got(i)+1;p.pts+=(m==="s"?4:8)/(first?1:2);save();
      justOk[i]=1;wrong[i]=[];render();
      var nb=document.querySelector('.btn[data-act="nextq"]');if(nb)nb.focus({preventScroll:true});
      return;
    }
    wrong[i]=(wrong[i]||[]).concat([k]);render();return;
  }
  if(act==="nextq"){justOk[i]=0;render();if(isDone(i)){var nb2=document.querySelector('.btn[data-act="next"]');if(nb2)nb2.focus({preventScroll:true});}else focusQ();return;}
  if(act==="next"){select(i<S.length-1?i+1:S.length);return;}
  if(act==="pick"){tl.seq.push(k);tl.msg="";render();return;}
  if(act==="unpick"){tl.seq=tl.seq.filter(function(x){return x!==k;});tl.msg="";render();return;}
  if(act==="reset"){newTL();render();return;}
  if(act==="check"){
    var ev=TL[m];
    if(tl.seq.length<ev.length){tl.msg="Pilih semua "+ev.length+" peristiwa dulu sebelum memeriksa.";tl.ok=false;render();return;}
    var right=0;tl.seq.forEach(function(idx,n){if(idx===n)right++;});
    if(right===ev.length){
      if(!p.tl){p.tl=true;p.pts+=(m==="s"?30:60);save();}
      tl.ok=true;tl.msg="Urutan benar: "+ev.map(function(x){return esc(x[0])+" ("+x[1]+")";}).join(" → ")+".";
    }else{tl.ok=false;tl.msg=right+" dari "+ev.length+" posisi sudah tepat. Periksa lagi urutannya.";}
    render();return;
  }
});
function setMode(m){
  if(BD.moving)return;
  ch={on:false,qs:[],n:0,score:0,streak:0,maxStreak:0,pick:-1,log:[],fin:false};
  st.mode=m;st.sel.i=firstOpen();BD.tokSt=firstOpen();wrong=[];justOk={};tl={seq:[],order:[],msg:"",ok:false};save();
  render(true);focusNode(NODE_OF[st.sel.i]);
}
document.getElementById("m-smp").addEventListener("click",function(){setMode("s");});
document.getElementById("m-dewasa").addEventListener("click",function(){setMode("d");});
document.getElementById("learn").addEventListener("change",function(e){st.learn=e.target.checked;render();});
var lastW=0,rt=null;
window.addEventListener("resize",function(){clearTimeout(rt);rt=setTimeout(function(){resizeBoard();var w=appW();if(Math.abs(w-lastW)>16){lastW=w;render();}},150);});
load();st.sel={i:firstOpen()};BD.tokSt=firstOpen();lastW=appW();initBoard();render();
