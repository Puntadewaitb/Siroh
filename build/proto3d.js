/* ---------- Halaman peta 3D: peta perjalanan + timeline + adegan per stasiun (SC) ----------
   Memakai state bersama (core.js) dan mesin soal (quiz.js); progres sama dengan versi utama (localStorage v2). */
var P3={tok:0,city:null,story:null};
function stDone3(i){return i===S.length?!!P().tl:isDone(i);}
function stOpen3(i){return i===S.length?doneCount()===S.length:unlocked(i);}
function band3(i){for(var b=0;b<BANDS.length;b++)if(i>=BANDS[b].from&&i<=BANDS[b].to)return BANDS[b].t;return "Ujian akhir";}
function title3(i){return i===S.length?"Ujian urutan peristiwa":S[i].t;}
function tlHTML(){
  var h="";
  BANDS.concat([{t:"Penutup",from:S.length,to:S.length}]).forEach(function(b){
    h+='<div class="bd3"><span class="bt3">'+esc(b.t)+'</span><div class="ch3">';
    for(var i=b.from;i<=b.to;i++){
      var c=stDone3(i)?"done":i===P3.tok?"cur":stOpen3(i)?"":"lock";
      h+='<button class="sc3 '+c+(i===st.sel.i?" sel":"")+'" data-st="'+i+'" aria-pressed="'+(i===st.sel.i)+'" title="'+esc(title3(i))+'">'+
        '<b>'+(i===S.length?"★":i+1)+(c==="done"?" ✓":c==="lock"?" 🔒":"")+'</b><span>'+esc(title3(i))+'</span><i>'+esc(NODES[NODE_OF[i]].n)+'</i></button>';
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
  var i=st.sel.i,k=NODE_OF[i],h='<p class="k3">Stasiun '+(i===S.length?"akhir":i+1)+' · '+esc(band3(i))+'</p><h2>'+esc(title3(i))+'</h2>';
  if(i<S.length)h+='<p class="mut3">'+esc(S[i].lok)+' · hlm. '+esc(S[i].hlm)+' · '+Math.min(got(i),NQ)+'/'+NQ+' soal</p>';
  h+='<div class="act3">';
  if(i===S.length)h+=stOpen3(i)?'<a class="btn" href="index.html">Kerjakan ujian di versi utama</a>':'<p class="fb err">Terbuka setelah semua stasiun selesai.</p>';
  else if(stOpen3(i))h+='<button class="btn play3" data-a="play">'+(stDone3(i)?"Buka lagi adegan & ulasan":"▶ Mulai stasiun")+'</button>';
  else h+='<p class="fb err">Terkunci. Selesaikan stasiun '+(firstOpen()+1)+' dulu.</p>';
  if(M3.cityOf(k))h+='<button class="btn ghost" data-a="city">Lihat kota '+esc(M3.CITY[M3.cityOf(k)].n)+'</button>';
  h+='</div>';
  if(i<S.length&&SC.KISAH[i])h+='<p class="mut3 sm3">Adegan ini punya kilasan kisah khusus dari buku.</p>';
  return h;
}
function hud3(){var p=P();document.getElementById("pts3").textContent=p.pts;document.getElementById("cnt3").textContent=doneCount();
  document.getElementById("ms3").setAttribute("aria-pressed",st.mode==="s");document.getElementById("md3").setAttribute("aria-pressed",st.mode==="d");}
function draw3(){document.getElementById("tl3").innerHTML=tlHTML();document.getElementById("info3").innerHTML=infoHTML();hud3();
  M3.setState({tokSt:P3.tok,sel:st.sel.i});
  var s=document.querySelector(".sc3.sel");if(s&&s.scrollIntoView)s.scrollIntoView({block:"nearest",inline:"center"});}
/* pilih stasiun: kalau itu stasiun terdepan di tempat lain, token berjalan dulu */
function pick3(i){
  if(M3.traveling())return;if(P3.city)M3.exitCity();
  var fo=firstOpen();
  if(i===fo&&stOpen3(i)&&NODE_OF[P3.tok]!==NODE_OF[i]){var from=P3.tok;st.sel.i=i;draw3();M3.travel(from,i,function(){P3.tok=i;draw3();});return;}
  if(i===fo)P3.tok=i;
  st.sel.i=i;draw3();M3.focusNode(NODE_OF[i]);
}
function setMode3(m){if(SC.isOpen()||M3.traveling())return;uq={};fl={};st.mode=m;save();P3.tok=firstOpen();st.sel.i=P3.tok;draw3();M3.focusNode(NODE_OF[P3.tok]);}
function start3(){
  load();P3.tok=firstOpen();st.sel={i:P3.tok};
  var box=document.getElementById("m3");
  var ok=M3.init(box,{done:stDone3,
    onPick:function(k){var sts=NODES[k].sts,fo=firstOpen(),j=sts.indexOf(fo)>-1?fo:sts[0];for(var n=0;n<sts.length&&sts.indexOf(fo)<0;n++)if(stOpen3(sts[n]))j=sts[n];pick3(j);},
    onCity:function(ck){P3.city=ck;P3.story=ck?M3.CITY[ck].maps[0]:null;if(ck)M3.story(P3.story);document.getElementById("back3").hidden=!ck;draw3();},
    ready:function(){box.classList.add("ready");}});
  if(!ok){box.innerHTML='<p class="no3">Perangkat ini belum mendukung WebGL, jadi peta 3D tidak bisa tampil. <a href="index.html">Buka versi utama (peta 2D)</a>.</p>';}
  draw3();
  document.getElementById("ms3").addEventListener("click",function(){setMode3("s");});
  document.getElementById("md3").addEventListener("click",function(){setMode3("d");});
  document.querySelector(".w3").addEventListener("click",function(e){
    var b=e.target.closest("button");if(!b)return;
    if(b.dataset.st!=null){pick3(+b.dataset.st);return;}
    if(b.dataset.story){P3.story=b.dataset.story;M3.story(P3.story);draw3();return;}
    var a=b.dataset.a||b.dataset.c;
    if(a==="play"){var i=st.sel.i;if(i===firstOpen())P3.tok=i;
      SC.open(i,{onProgress:hud3,onClose:function(){var fo=firstOpen();if(fo!==st.sel.i&&isDone(st.sel.i)&&fo<=S.length){st.sel.i=fo;}draw3();var pb=document.querySelector(".play3");if(pb)pb.focus({preventScroll:true});}});}
    else if(a==="city")M3.enterCity(NODE_OF[st.sel.i]);
    else if(a==="back")M3.exitCity();
    else if(a==="zin")M3.zoom(.7);else if(a==="zout")M3.zoom(1.4);
    else if(a==="me")M3.focusNode(NODE_OF[P3.tok]);else if(a==="all")M3.overview();else if(a==="tilt")M3.tilt();
  });
}
document.addEventListener("DOMContentLoaded",start3);
