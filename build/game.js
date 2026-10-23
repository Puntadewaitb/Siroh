/* ---------- Halaman utama: peta perjalanan 3D + timeline + adegan per stasiun (SC) + menu (latihan, album, tantangan, ujian) ----------
   State bersama di core.js (localStorage v2), mesin soal di quiz.js. Tanpa WebGL: kisah + soal tampil di jendela biasa. */
var P3={tok:0,city:null,story:null,gl:true};
function stDone3(i){return i===S.length?!!P().tl:isDone(i);}
function stOpen3(i){return i===S.length?(doneCount()===S.length||st.learn):unlocked(i);}
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
      h+=(m.r||[]).map(function(r){return '<p class="lg3"><i class="c-'+r.c+'"></i>'+esc(noHlm(r.l||""))+'</p>';}).join("")+'<p class="nt3">'+esc(noHlm(m.n))+'</p>';
      var sts=[];Object.keys(SM).forEach(function(k){if(SM[k].indexOf(P3.story)>-1)sts.push(+k);});
      h+=sts.map(function(j){return '<button class="go3" data-st="'+j+'">Stasiun '+(j+1)+': '+esc(S[j].t)+'</button>';}).join("");
    }
    return h;
  }
  var i=st.sel.i,k=NODE_OF[i],h='<p class="k3">Stasiun '+(i===S.length?"akhir":i+1)+' · '+esc(band3(i))+'</p><h2>'+esc(title3(i))+'</h2>';
  if(i<S.length)h+='<p class="mut3">'+esc(S[i].lok)+' · '+Math.min(got(i),NQ)+'/'+NQ+' soal</p>';
  else h+='<p class="mut3">Susun peristiwa-peristiwa besar sirah sesuai urutan waktunya.</p>';
  h+='<div class="act3">';
  if(!stOpen3(i))h+='<p class="fb err">Terkunci. '+(i===S.length?'Terbuka setelah semua stasiun selesai.':'Selesaikan stasiun '+(firstOpen()+1)+' dulu.')+'</p>';
  else if(i===S.length)h+='<button class="btn play3" data-mn="ujian">'+(stDone3(i)?"Ulangi ujian urutan":"★ Mulai ujian urutan")+'</button>';
  else h+='<button class="btn play3" data-a="play">'+(stDone3(i)?"Buka lagi adegan & ulasan":"▶ Mulai stasiun")+'</button>';
  if(M3.cityOf(k)&&P3.gl)h+='<button class="btn ghost" data-a="city">Lihat kota '+esc(M3.CITY[M3.cityOf(k)].n)+'</button>';
  h+='</div>';
  if(i<S.length&&isDone(i)&&kartuOf(i).length)h+='<p class="sm3 mut3">Kartu: '+esc(kartuNames(i))+'</p>';
  return h;
}
function hud3(){var p=P();document.getElementById("pts3").textContent=p.pts;document.getElementById("cnt3").textContent=doneCount();
  document.getElementById("ms3").setAttribute("aria-pressed",st.mode==="s");document.getElementById("md3").setAttribute("aria-pressed",st.mode==="d");
  var d=rvDue().length;document.getElementById("ltdue").textContent=d?d+" perlu diulang":(lh().last===today()?"hari ini selesai ✓":"5 soal");
  document.getElementById("kcnt").textContent=kartuCount()+"/"+kartuTotal();
  document.getElementById("stk3").textContent=ltStreak();}
function draw3(){document.getElementById("tl3").innerHTML=tlHTML();document.getElementById("info3").innerHTML=infoHTML();hud3();
  if(P3.gl)M3.setState({tokSt:P3.tok,sel:st.sel.i});
  var s=document.querySelector(".sc3.sel");if(s&&s.scrollIntoView)s.scrollIntoView({block:"nearest",inline:"center"});}
/* pilih stasiun: kalau itu stasiun terdepan di tempat lain, token berjalan dulu */
function pick3(i){
  if(!P3.gl){st.sel.i=i;if(i===firstOpen())P3.tok=i;draw3();return;}
  if(M3.traveling())return;if(P3.city)M3.exitCity();
  var fo=firstOpen();
  if(i===fo&&stOpen3(i)&&NODE_OF[P3.tok]!==NODE_OF[i]){var from=P3.tok;st.sel.i=i;draw3();M3.travel(from,i,function(){P3.tok=i;draw3();});return;}
  if(i===fo)P3.tok=i;
  st.sel.i=i;draw3();M3.focusNode(NODE_OF[i]);
}
function setMode3(m){if(SC.isOpen()||(P3.gl&&M3.traveling()))return;uq={};fl={};wrong=[];justOk={};lt={on:false};
  ch={on:false,qs:[],n:0,score:0,streak:0,maxStreak:0,pick:-1,log:[],fin:false};tl={seq:[],order:[],msg:"",ok:false};
  st.mode=m;save();P3.tok=firstOpen();st.sel.i=P3.tok;draw3();if(P3.gl)M3.focusNode(NODE_OF[P3.tok]);}
function setGfx3(g){st.gfx=g;save();gfxBtns();if(P3.gl&&M3.resize)M3.resize();}
function gfxBtns(){document.querySelectorAll("[data-gfx]").forEach(function(b){b.setAttribute("aria-pressed",b.getAttribute("data-gfx")===st.gfx);});
  document.getElementById("gfxnow").textContent=gfxLite()?"ringan":"tinggi";}

/* ---- Jendela (modal): latihan, album, tantangan, ujian, dan stasiun tanpa WebGL ---- */
var MD={v:null,i:0,back:null};
var MDT={latihan:"Latihan harian",album:"Album kartu",tantangan:"Tantangan acak",ujian:"Ujian urutan peristiwa"};
function mdBody(){
  if(MD.v==="latihan")return ltHTML();
  if(MD.v==="album")return albumHTML();
  if(MD.v==="tantangan")return chHTML();
  if(MD.v==="ujian")return stOpen3(S.length)?tlBody():'<p class="fb err">Terbuka setelah semua stasiun selesai, atau nyalakan Mode belajar.</p>';
  if(MD.v==="stasiun")return fbHTML(MD.i);
  return "";
}
function mdDraw(){document.getElementById("mdlc").innerHTML=mdBody();hud3();}
function mdOpen(v,i){MD.back=document.activeElement;MD.v=v;MD.i=i||0;
  document.getElementById("mdlt").textContent=v==="stasiun"?"Stasiun "+(MD.i+1)+" · "+S[MD.i].t:MDT[v];
  var m=document.getElementById("mdl");m.hidden=false;document.documentElement.classList.add("stg-on");mdDraw();
  var c=document.getElementById("mdlc");c.scrollTop=0;document.getElementById("mdlt").focus({preventScroll:true});}
function mdClose(){var m=document.getElementById("mdl");if(m.hidden)return;m.hidden=true;document.documentElement.classList.remove("stg-on");
  if(MD.v==="stasiun"){var fo=firstOpen();if(isDone(MD.i)&&fo!==MD.i&&fo<=S.length)st.sel.i=fo;}
  MD.v=null;draw3();if(MD.back&&MD.back.focus)MD.back.focus({preventScroll:true});}
/* stasiun tanpa adegan 3D: kilasan kisah sebagai teks, lalu soal */
function fbHTML(i){
  var ks=(KISAH3[i]||{})[st.mode]||[],h='<details class="fbk"'+(isDone(i)?'':' open')+'><summary>Kilasan kisah</summary>'+ks.map(function(b){return '<p>'+esc(b.t)+'</p>';}).join("")+'</details>';
  if(isDone(i)&&!justOk[i])h+='<p class="fb good">Stasiun selesai. Kartu baru: '+esc(kartuNames(i))+'.</p>';
  return h+qBlock(i);
}
function mdClick(e){
  if(e.target.id==="mdl"){mdClose();return;}
  var b=e.target.closest("button");if(!b)return;
  var k=parseInt(b.getAttribute("data-k"),10),a;
  if(b.getAttribute("data-m")==="x"){mdClose();return;}
  if((a=b.getAttribute("data-lt"))){ltAct(a,k);mdDraw();var n1=document.getElementById("ltnext");if(n1)n1.focus({preventScroll:true});return;}
  if((a=b.getAttribute("data-ch"))){chAct(a,k);mdDraw();var n2=document.getElementById("chnext");if(n2)n2.focus({preventScroll:true});return;}
  if((a=b.getAttribute("data-tl"))){tlAct(a,k);mdDraw();return;}
  if((a=b.getAttribute("data-act"))){var i=parseInt(b.getAttribute("data-i"),10);
    if(quizAct(a,i,k)){mdDraw();var nb=document.querySelector('#mdlc [data-act="nextq"]');if(nb)nb.focus({preventScroll:true});return;}
    if(a==="nextq"){justOk[i]=0;mdDraw();}}
}

function start3(){
  load();P3.tok=firstOpen();st.sel={i:P3.tok};
  var lb=document.getElementById("learn3");lb.checked=st.learn;lb.addEventListener("change",function(){st.learn=lb.checked;save();draw3();});
  gfxBtns();
  var box=document.getElementById("m3");
  var ok=M3.init(box,{done:stDone3,
    onPick:function(k){var sts=NODES[k].sts,fo=firstOpen(),j=sts.indexOf(fo)>-1?fo:sts[0];for(var n=0;n<sts.length&&sts.indexOf(fo)<0;n++)if(stOpen3(sts[n]))j=sts[n];pick3(j);},
    onCity:function(ck){P3.city=ck;P3.story=ck?M3.CITY[ck].maps[0]:null;if(ck)M3.story(P3.story);document.getElementById("back3").hidden=!ck;draw3();},
    ready:function(){box.classList.add("ready");}});
  if(!ok){P3.gl=false;document.querySelector(".m3wrap").classList.add("nogl");
    box.classList.add("ready");box.innerHTML='<p class="no3">Perangkat ini belum mendukung grafis 3D (WebGL), jadi peta tidak tampil. Kamu tetap bisa bermain: pilih stasiun di timeline, baca kilasan kisahnya, lalu jawab soal.</p>';}
  draw3();
  document.getElementById("ms3").addEventListener("click",function(){setMode3("s");});
  document.getElementById("md3").addEventListener("click",function(){setMode3("d");});
  var mdl=document.getElementById("mdl");mdl.addEventListener("click",mdClick);
  mdl.addEventListener("change",function(e){var s=e.target.closest&&e.target.closest("select[data-act=msl]");if(s){quizChange(s);mdDraw();}});
  document.addEventListener("keydown",function(e){if(e.key==="Escape"&&!mdl.hidden)mdClose();});
  document.querySelector(".w3").addEventListener("click",function(e){
    var b=e.target.closest("button");if(!b)return;
    if(b.dataset.st!=null){pick3(+b.dataset.st);return;}
    if(b.dataset.story){P3.story=b.dataset.story;M3.story(P3.story);draw3();return;}
    if(b.dataset.mn){mdOpen(b.dataset.mn);return;}
    if(b.dataset.gfx){setGfx3(b.dataset.gfx);return;}
    var a=b.dataset.a||b.dataset.c;
    if(a==="play"){var i=st.sel.i;if(i===firstOpen())P3.tok=i;
      var opened=P3.gl&&SC.open(i,{onProgress:hud3,onClose:function(){var fo=firstOpen();if(fo!==st.sel.i&&isDone(st.sel.i)&&fo<=S.length){st.sel.i=fo;}draw3();var pb=document.querySelector(".play3");if(pb)pb.focus({preventScroll:true});}});
      if(!opened)mdOpen("stasiun",i);}
    else if(!P3.gl)return;
    else if(a==="city")M3.enterCity(NODE_OF[st.sel.i]);
    else if(a==="back")M3.exitCity();
    else if(a==="zin")M3.zoom(.7);else if(a==="zout")M3.zoom(1.4);
    else if(a==="me")M3.focusNode(NODE_OF[P3.tok]);else if(a==="all")M3.overview();else if(a==="tilt")M3.tilt();
  });
}
document.addEventListener("DOMContentLoaded",start3);
