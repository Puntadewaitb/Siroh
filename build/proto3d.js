/* ---------- Halaman prototipe peta 3D: timeline stasiun, kartu info, tampilan kota ----------
   Membaca progres dari localStorage versi utama (hanya baca). Simulasi perjalanan tidak disimpan. */
function esc(x){return String(x).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
var P3={mode:"s",qd:{},tl:false,sel:0,tok:0,city:null};
(function(){try{var o=JSON.parse(localStorage.getItem("peta-sirah-v2")||"null");if(o&&o.prog){P3.mode=o.mode==="d"?"d":"s";var p=o.prog[P3.mode]||{};P3.qd=p.qd||{};P3.tl=!!p.tl;}}catch(e){}})();
function done3(i){return i===S.length?P3.tl:(P3.qd[i]||0)>=3;}
function front3(){for(var i=0;i<S.length;i++)if(!done3(i))return i;return S.length;}
P3.tok=front3();P3.sel=P3.tok;
function band3(i){for(var b=0;b<BANDS.length;b++)if(i>=BANDS[b].from&&i<=BANDS[b].to)return BANDS[b].t;return "Ujian akhir";}
function title3(i){return i===S.length?"Ujian urutan peristiwa":S[i].t;}
function tlHTML(){
  var h="";
  BANDS.concat([{t:"Penutup",from:S.length,to:S.length}]).forEach(function(b){
    h+='<div class="bd3"><span class="bt3">'+esc(b.t)+'</span><div class="ch3">';
    for(var i=b.from;i<=b.to;i++){
      var c=done3(i)?"done":i===P3.tok?"cur":"";
      h+='<button class="sc3 '+c+(i===P3.sel?" sel":"")+'" data-st="'+i+'" aria-pressed="'+(i===P3.sel)+'" title="'+esc(title3(i))+'">'+
        '<b>'+(i===S.length?"✓":i+1)+'</b><span>'+esc(title3(i))+'</span><i>'+esc(NODES[NODE_OF[i]].n)+'</i></button>';
    }
    h+='</div></div>';
  });
  return h;
}
function infoHTML(){
  if(P3.city){
    var C=M3.CITY[P3.city];
    var h='<p class="k3">Kota · tampilan detail</p><h2>'+esc(C.n)+'</h2><p class="mut3">Relief dari data ketinggian nyata (dibesarkan agar terbaca). Titik tempat perkiraan'+(P3.city==="mk"?"; Ka’bah berupa simbol, tidak berskala":"")+'.</p>';
    h+='<div class="sty3" role="group" aria-label="Kisah di kota ini">'+C.maps.map(function(m){return '<button data-story="'+m+'" aria-pressed="'+(P3.story===m)+'">'+esc(MP[m].t)+'</button>';}).join("")+'</div>';
    if(P3.story){var m=MP[P3.story];
      h+=(m.r||[]).map(function(r){return '<p class="lg3"><i class="c-'+r.c+'"></i>'+esc(r.l||"")+'</p>';}).join("")+'<p class="nt3">'+esc(m.n)+'</p>';
      var sts=[];Object.keys(SM).forEach(function(k){if(SM[k].indexOf(P3.story)>-1)sts.push(+k);});
      h+=sts.map(function(j){return '<button class="go3" data-st="'+j+'">Stasiun '+(j+1)+': '+esc(S[j].t)+'</button>';}).join("");
    }
    return h;
  }
  var i=P3.sel,k=NODE_OF[i],h='<p class="k3">Stasiun '+(i===S.length?"akhir":i+1)+' · '+esc(band3(i))+'</p><h2>'+esc(title3(i))+'</h2>';
  if(i<S.length){
    h+='<p class="mut3">'+esc(S[i].lok)+' · hlm. '+esc(S[i].hlm)+'</p><p>'+esc(S[i].r[P3.mode]||S[i].r.s)+'</p>';
  }else h+='<p>Susun peristiwa-peristiwa sirah sesuai urutannya. Terbuka setelah semua stasiun selesai.</p>';
  h+='<div class="act3">';
  if(M3.cityOf(k))h+='<button class="btn" data-a="city">Masuk kota '+esc(M3.CITY[M3.cityOf(k)].n)+'</button>';
  if(i!==P3.tok)h+='<button class="btn ghost" data-a="sim">Simulasikan perjalanan ke sini</button>';
  h+='</div><p class="mut3 sm3">Status: '+(done3(i)?"selesai":i===P3.tok?"posisi sekarang":i<P3.tok?"terbuka":"terkunci di versi utama")+'.</p>';
  return h;
}
function draw3(){document.getElementById("tl3").innerHTML=tlHTML();document.getElementById("info3").innerHTML=infoHTML();
  var s=document.querySelector(".sc3.sel");if(s&&s.scrollIntoView)s.scrollIntoView({block:"nearest",inline:"center"});}
function pick3(i,fly){P3.sel=i;M3.setState({sel:i});if(fly!==false&&M3.view()==="region")M3.focusNode(NODE_OF[i]);draw3();}
function start3(){
  var box=document.getElementById("m3");
  var ok=M3.init(box,{done:done3,
    onPick:function(k){var sts=NODES[k].sts,j=sts.indexOf(P3.tok)>-1?P3.tok:sts[0];pick3(j);},
    onCity:function(ck){P3.city=ck;P3.story=ck?M3.CITY[ck].maps[0]:null;if(ck)M3.story(P3.story);document.getElementById("back3").hidden=!ck;draw3();},
    ready:function(){document.getElementById("m3").classList.add("ready");}});
  if(!ok){box.innerHTML='<p class="no3">Perangkat ini belum mendukung WebGL, jadi peta 3D tidak bisa tampil. <a href="index.html">Buka versi utama (peta 2D)</a>.</p>';}
  M3.setState({tokSt:P3.tok,sel:P3.sel});draw3();
  document.addEventListener("click",function(e){
    var b=e.target.closest("button");if(!b)return;
    if(b.dataset.st!=null){if(P3.city)M3.exitCity();pick3(+b.dataset.st);return;}
    if(b.dataset.story){P3.story=b.dataset.story;M3.story(P3.story);draw3();return;}
    var a=b.dataset.a||b.dataset.c;
    if(a==="city")M3.enterCity(NODE_OF[P3.sel]);
    else if(a==="sim"){var to=P3.sel,from=P3.tok;if(to<from){P3.tok=to;M3.setState({tokSt:to});M3.focusNode(NODE_OF[to]);draw3();return;}
      M3.travel(from,to,function(){P3.tok=to;draw3();});}
    else if(a==="back")M3.exitCity();
    else if(a==="zin")M3.zoom(.7);else if(a==="zout")M3.zoom(1.4);
    else if(a==="me")M3.focusNode(NODE_OF[P3.tok]);else if(a==="all")M3.overview();else if(a==="tilt")M3.tilt();
  });
}
document.addEventListener("DOMContentLoaded",start3);
