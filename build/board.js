/* ---------- Papan peta perjalanan ----------
   Peta daerah (Lr) jadi latar. Tiap tempat = satu simpul; stasiun di tempat yang sama jadi tab di panel.
   Token penanda progres berjalan di sepanjang rute saat stasiun berikutnya dibuka. Semua posisi skematis. */
var NODE_OF=["mk","mk","mk","mk","mk","mk","th","mk","mk","md","bd","uh","md","hd","kh","mu","hu","md","md"];
var NODES={
 mk:{n:"Makkah",full:"Makkah dan sekitarnya",ll:PL.mk,dx:0,dy:0},
 th:{n:"Thaif",full:"Thaif",ll:PL.th,dx:0,dy:0},
 md:{n:"Madinah",full:"Madinah",ll:PL.md,dx:0,dy:6},
 bd:{n:"Badr",full:"Badr",ll:PL.bd,dx:0,dy:0},
 uh:{n:"Uhud",full:"Uhud",ll:PL.uh,dx:11,dy:-13},
 hd:{n:"Hudaibiyah",full:"Hudaibiyah",ll:PL.hd,dx:0,dy:0},
 kh:{n:"Khaibar",full:"Khaibar",ll:PL.kh,dx:0,dy:0},
 mu:{n:"Mu’tah",full:"Mu’tah",ll:PL.mu,dx:0,dy:0},
 hu:{n:"Hunain",full:"Hunain",ll:PL.hu,dx:0,dy:0}
};
(function(){Object.keys(NODES).forEach(function(k){NODES[k].sts=[];});
  NODE_OF.forEach(function(k,i){NODES[k].sts.push(i);});})();
var BB=null;
function initBoard(){BB=boxPx("r",[34.5,44.5,20.8,31.6]);buildBoard();updateBoard();}
var BD={cw:0,ch:0,cam:{x:0,y:0,z:1},tokSt:0,moving:false,view:"focus",drag:null,drg:false};
var SVGNS="http://www.w3.org/2000/svg";

function reduce(){try{return window.matchMedia("(prefers-reduced-motion: reduce)").matches;}catch(e){return false;}}
function wpos(k){var n=NODES[k],q=proj("r",n.ll[0],n.ll[1]);return {x:q[0]+n.dx,y:q[1]+n.dy};}
function bez(a,b,sg){
  var dx=b.x-a.x,dy=b.y-a.y,len=Math.sqrt(dx*dx+dy*dy)||1,off=Math.max(len*0.2,7)*sg;
  var c={x:(a.x+b.x)/2-dy/len*off,y:(a.y+b.y)/2+dx/len*off};
  return {len:len*1.08,d:"M"+a.x.toFixed(1)+" "+a.y.toFixed(1)+" Q"+c.x.toFixed(1)+" "+c.y.toFixed(1)+" "+b.x.toFixed(1)+" "+b.y.toFixed(1),
    at:function(t){var u=1-t;return {x:u*u*a.x+2*u*t*c.x+t*t*b.x,y:u*u*a.y+2*u*t*c.y+t*t*b.y};}};
}
function legSign(i){return i%2?1:-1;}
function legCurve(i){return bez(wpos(NODE_OF[i]),wpos(NODE_OF[i+1]),legSign(i));}
function ease(t){return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;}
function lerp(a,b,t){return a+(b-a)*t;}
function stDone(j){return j===S.length?!!P().tl:isDone(j);}
function stUnlocked(j){return j===S.length?(doneCount()===S.length||st.learn):unlocked(j);}
function fitZ(){return Math.min(BD.cw/BB.w,BD.ch/BB.h)*0.96;}
function focusZ(){return Math.max(fitZ()*1.2,Math.min(BD.cw/110,5.5));}

function buildBoard(){
  var el=document.getElementById("board");if(!el)return;
  var s='<svg id="bsv" class="map bmap" width="100%" height="100%" role="group" aria-label="Papan peta perjalanan sirah. Ketuk tempat untuk membuka stasiunnya.">';
  s+='<g id="cam"><rect x="-3000" y="-3000" width="8000" height="8000" class="sea"/><use href="#Lr" class="land"/>';
  [["LAUT MERAH",24.0,36.3],["HIJAZ",23.0,41.9],["SYAM",31.3,37.6]].forEach(function(r){
    var q=proj("r",r[1],r[2]);s+='<text class="rg bz" style="transform:translate('+q[0].toFixed(1)+'px,'+q[1].toFixed(1)+'px) scale(calc(var(--iz) * var(--ns,1)))">'+r[0]+'</text>';});
  for(var i=0;i<S.length;i++){
    if(NODE_OF[i]===NODE_OF[i+1])continue;
    var c=legCurve(i);
    s+='<path class="lgc" d="'+c.d+'"/><path class="lg" id="lg-'+i+'" d="'+c.d+'"/>';
  }
  Object.keys(NODES).forEach(function(k){
    var p=wpos(k);
    s+='<g class="nd" id="nd-'+k+'" data-node="'+k+'" role="button" tabindex="0" style="transform:translate('+p.x.toFixed(1)+'px,'+p.y.toFixed(1)+'px) scale(calc(var(--iz) * var(--ns,1)))">'+
      '<circle class="pulse" r="17"/><circle class="nr" r="19"/><circle class="np" r="19" pathLength="100" stroke-dasharray="0 100" transform="rotate(-90)"/>'+
      '<circle class="nb" r="15"/><text class="nt" y="4"></text><text class="nl" y="36">'+esc(NODES[k].n)+'</text></g>';
  });
  s+='<g id="tok" class="tk" style="transform:translate(0px,0px) scale(calc(var(--iz) * var(--ns,1)))"><g class="bob"><path class="pin" d="M0 -20 C-9 -31 -13 -38 -13 -45 a13 13 0 1 1 26 0 C13 -38 9 -31 0 -20z"/><circle class="pdot" cx="0" cy="-45" r="5"/></g></g>';
  s+='</g></svg>';
  s+='<div class="bctl"><button data-bc="me" aria-label="Ke posisiku" title="Ke posisiku">◎</button><button data-bc="zin" aria-label="Perbesar" title="Perbesar">+</button><button data-bc="zout" aria-label="Perkecil" title="Perkecil">−</button><button data-bc="all" aria-label="Lihat semua" title="Lihat semua">▣</button></div>';
  el.innerHTML=s;
  resizeBoard(true);
}
function applyCam(){
  var c=BD.cam,cam=document.getElementById("cam"),sv=document.getElementById("bsv");if(!cam)return;
  cam.setAttribute("transform","translate("+(BD.cw/2-c.x*c.z).toFixed(2)+" "+(BD.ch/2-c.y*c.z).toFixed(2)+") scale("+c.z.toFixed(4)+")");
  sv.style.setProperty("--iz",(1/c.z).toFixed(4));
  sv.style.setProperty("--ns",Math.max(.55,Math.min(1,.45+c.z/focusZ()*.8)).toFixed(3));
}
function setCam(x,y,z){
  var mn=fitZ()*0.9;z=Math.max(mn,Math.min(7,z));
  x=Math.max(BB.x0-60,Math.min(BB.x0+BB.w+60,x));y=Math.max(BB.y0-60,Math.min(BB.y0+BB.h+60,y));
  BD.cam={x:x,y:y,z:z};applyCam();
}
function tokPos(){return wpos(NODE_OF[BD.tokSt]);}
function placeTok(p){var t=document.getElementById("tok");if(t)t.style.transform="translate("+p.x.toFixed(1)+"px,"+p.y.toFixed(1)+"px) scale(calc(var(--iz) * var(--ns,1)))";}
function resizeBoard(first){
  var el=document.getElementById("board");if(!el)return;
  BD.cw=el.clientWidth||360;BD.ch=el.clientHeight||300;
  if(first){var p=tokPos();setCam(p.x,p.y,focusZ());BD.view="focus";placeTok(p);}
  else if(BD.view==="all")fitAll(0);
  else setCam(BD.cam.x,BD.cam.y,BD.cam.z);
  document.documentElement.style.setProperty("--bh",(window.innerWidth<900?el.offsetHeight+10:0)+"px");
}
function run(dur,step,done){
  if(!dur){step(1);if(done)done();return;}
  var t0=null;
  (function f(ts){
    if(t0===null)t0=ts;var t=Math.min(1,(ts-t0)/dur);step(t);
    if(t<1)requestAnimationFrame(f);else if(done)done();
  })(performance.now());
}
function flyTo(x,y,z,dur,cb){
  var c0={x:BD.cam.x,y:BD.cam.y,z:BD.cam.z};if(reduce())dur=0;
  BD.moving=true;
  run(dur,function(t){var e=ease(t);setCam(lerp(c0.x,x,e),lerp(c0.y,y,e),lerp(c0.z,z,e));},function(){BD.moving=false;if(cb)cb();});
}
function focusNode(k,dur){var p=wpos(k);BD.view="focus";flyTo(p.x,p.y,focusZ(),dur===undefined?700:dur);}
function fitAll(dur){BD.view="all";flyTo(BB.x0+BB.w/2,BB.y0+BB.h/2,fitZ(),dur===undefined?600:dur);}
function travel(i,cb){
  var from=NODE_OF[BD.tokSt],to=NODE_OF[i];
  if(from===to){BD.tokSt=i;updateBoard();if(cb)cb();return;}
  var A=wpos(from),B=wpos(to),b=bez(A,B,legSign(i-1)),dur=reduce()?0:Math.min(2800,1100+b.len*6);
  var c0={x:BD.cam.x,y:BD.cam.y,z:BD.cam.z},zf=focusZ(),app=document.getElementById("app");
  BD.moving=true;BD.view="focus";app.classList.add("is-moving");
  run(dur,function(t){
    var e=ease(t),p=b.at(e);placeTok(p);
    var f=Math.min(1,t*4),z=lerp(c0.z,zf,e)*(1-.3*Math.sin(Math.PI*t));
    setCam(lerp(c0.x,p.x,f),lerp(c0.y,p.y,f),z);
  },function(){
    BD.moving=false;BD.tokSt=i;app.classList.remove("is-moving");
    var p=wpos(to);placeTok(p);setCam(p.x,p.y,zf);updateBoard();if(cb)cb();
  });
}
function updateBoard(){
  if(!document.getElementById("bsv"))return;
  var fo=firstOpen(),selNode=NODE_OF[st.sel.i];
  Object.keys(NODES).forEach(function(k){
    var nd=NODES[k],g=document.getElementById("nd-"+k),tot=nd.sts.length,d=0,unl=0,cur=false;
    nd.sts.forEach(function(j){if(stDone(j))d++;if(stUnlocked(j))unl++;if(j===fo)cur=true;});
    var state=d===tot?"done":(unl===0?"lock":(cur?"cur":"part"));
    g.setAttribute("class","nd "+state+(k===selNode?" sel":""));
    g.querySelector(".np").setAttribute("stroke-dasharray",(d/tot*100).toFixed(1)+" 100");
    g.querySelector(".nt").textContent=state==="done"?"✓":(state==="lock"?"🔒":(tot===1?String(nd.sts[0]+1):d+"/"+tot));
    g.setAttribute("aria-label",nd.full+": "+d+" dari "+tot+" stasiun selesai"+(state==="lock"?", terkunci":(state==="cur"?", sedang dikerjakan":"")));
  });
  for(var i=0;i<S.length;i++){
    var lg=document.getElementById("lg-"+i);if(!lg)continue;
    lg.setAttribute("class","lg"+(BD.tokSt>i?" done":(i===fo-1?" next":"")));
  }
  if(!BD.moving)placeTok(tokPos());
}
/* ----- interaksi papan ----- */
(function(){
  var el=document.getElementById("board");if(!el)return;
  el.addEventListener("click",function(e){
    if(BD.drg){return;}
    var bc=e.target.closest("[data-bc]");
    if(bc){
      if(BD.moving)return;
      var a=bc.getAttribute("data-bc"),c=BD.cam;
      if(a==="me"){var p=tokPos();BD.view="focus";flyTo(p.x,p.y,focusZ(),500);}
      else if(a==="all")fitAll(500);
      else{BD.view="free";flyTo(c.x,c.y,c.z*(a==="zin"?1.5:1/1.5),250);}
      return;
    }
    var nd=e.target.closest("[data-node]");if(nd)pickNode(nd.getAttribute("data-node"));
  });
  el.addEventListener("keydown",function(e){
    if(e.key!=="Enter"&&e.key!==" ")return;
    var nd=e.target.closest&&e.target.closest("[data-node]");if(nd){e.preventDefault();pickNode(nd.getAttribute("data-node"));}
  });
  el.addEventListener("pointerdown",function(e){
    if(BD.moving||e.target.closest("[data-bc]"))return;
    BD.drag={x:e.clientX,y:e.clientY,cx:BD.cam.x,cy:BD.cam.y,id:e.pointerId,on:false};
  });
  el.addEventListener("pointermove",function(e){
    var d=BD.drag;if(!d)return;
    var dx=e.clientX-d.x,dy=e.clientY-d.y;
    if(!d.on&&Math.abs(dx)+Math.abs(dy)>6){d.on=true;try{el.setPointerCapture(d.id);}catch(x){}}
    if(d.on){BD.view="free";setCam(d.cx-dx/BD.cam.z,d.cy-dy/BD.cam.z,BD.cam.z);}
  });
  function end(){var d=BD.drag;BD.drag=null;if(d&&d.on){BD.drg=true;setTimeout(function(){BD.drg=false;},0);}}
  el.addEventListener("pointerup",end);el.addEventListener("pointercancel",end);
  el.addEventListener("wheel",function(e){
    if(BD.moving)return;e.preventDefault();BD.view="free";
    var c=BD.cam;setCam(c.x,c.y,c.z*(e.deltaY<0?1.15:1/1.15));
  },{passive:false});
})();
