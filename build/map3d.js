/* ---------- Peta 3D (Three.js subset, global T3) ----------
   Terrain dari data ketinggian (build/terrain, lihat tools/fetch_terrain.py), rute antar tempat mengikuti urutan stasiun,
   token progres, kamera geser/zoom/miring, dan tampilan kota (Makkah, Madinah) dengan titik-titik dari PL/MP.
   Semua posisi tempat perkiraan; ketinggian dibesarkan agar relief terbaca. Tanpa sosok manusia. */
var M3=(function(){
var T=window.T3,R,scene,cam,el,cv,ov,W=0,H=0,dpr=1,raf=0,dirty=true,last=0;
var trav=false,view="region",world=null,worlds={},onPick=null,onCity=null,anim=[],reduceM=false,sel=-1,tokSt=0,doneF=function(){return false;};
var rig={x:0,z:0,d:60,phi:.82,az:0};
var COS=function(a){return Math.cos(a*Math.PI/180);};
function rm(){try{return matchMedia("(prefers-reduced-motion: reduce)").matches;}catch(e){return false;}}
function css(v,f){try{var c=getComputedStyle(document.documentElement).getPropertyValue(v).trim();return c||f;}catch(e){return f;}}
function lerp(a,b,t){return a+(b-a)*t;}
function ease(t){return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}

/* ---- Terrain ---- */
function decode(src,cb){
  var im=new Image();im.onload=function(){
    var c=document.createElement("canvas");c.width=im.width;c.height=im.height;var g=c.getContext("2d");g.drawImage(im,0,0);
    var d=g.getImageData(0,0,im.width,im.height).data,n=im.width*im.height,e=new Float32Array(n);
    for(var i=0;i<n;i++)e[i]=d[i*4]*256+d[i*4+1]-1000;cb(e,im.width,im.height);};
  im.src=src;
}
/* palet hipsometrik: [meter, warna] */
var PAL_REG=[[-1600,"#2d6a86"],[-300,"#4f93ad"],[-1,"#8cc3cf"],[0,"#efe3c6"],[250,"#e6d2a6"],[700,"#d6b783"],[1300,"#bf9461"],[1900,"#9c7348"],[2600,"#7d5b3c"]];
function palette(p,v){
  if(v<=p[0][0])return new T.Color(p[0][1]);
  for(var i=1;i<p.length;i++)if(v<=p[i][0]){var a=p[i-1],b=p[i],t=(v-a[0])/((b[0]-a[0])||1);return new T.Color(a[1]).lerp(new T.Color(b[1]),t);}
  return new T.Color(p[p.length-1][1]);
}
function makeWorld(key,def,cb){
  var md=TERR[key];
  decode(md.src,function(e,w,h){
    var bx=md.bx,lonC=(bx[0]+bx[1])/2,latC=(bx[2]+bx[3])/2,k=COS(latC),U=def.unit,
      base=def.base==null?Math.max(0,md.min):def.base;
    function P(lat,lon){return {x:(lon-lonC)*k*U,z:(latC-lat)*U};}
    function hy(v){return v>=0?(v-base)*def.ex:v*def.ex*.4;}
    var pos=new Float32Array(w*h*3),col=new Float32Array(w*h*3),bg=new T.Color(def.bg);
    for(var j=0;j<h;j++)for(var i=0;i<w;i++){
      var n=j*w+i,lon=lerp(bx[0],bx[1],i/(w-1)),lat=lerp(bx[3],bx[2],j/(h-1)),p=P(lat,lon),v=e[n];
      /* pinggir melandai dan dilebur ke warna latar agar tidak terlihat seperti potongan balok */
      var ed=Math.min(1,Math.min(i,j,w-1-i,h-1-j)/(Math.min(w,h)*def.edge)),sm=ed*ed*(3-2*ed);
      pos[n*3]=p.x;pos[n*3+1]=hy(v)*sm;pos[n*3+2]=p.z;
      var c=def.pal(v);if(ed<1)c.lerp(bg,1-sm);
      col[n*3]=c.r;col[n*3+1]=c.g;col[n*3+2]=c.b;
    }
    var idx=[];for(j=0;j<h-1;j++)for(i=0;i<w-1;i++){var a=j*w+i;idx.push(a,a+w,a+1,a+1,a+w,a+w+1);}
    var g=new T.BufferGeometry();g.setAttribute("position",new T.BufferAttribute(pos,3));g.setAttribute("color",new T.BufferAttribute(col,3));
    g.setIndex(idx);g.computeVertexNormals();
    var root=new T.Group();
    root.add(new T.Mesh(g,new T.MeshStandardMaterial({vertexColors:true,roughness:.95,metalness:0})));
    if(def.sea){
      var x0=P(bx[3],bx[0]),x1=P(bx[2],bx[1]),sg=new T.PlaneGeometry(x1.x-x0.x,x1.z-x0.z);sg.rotateX(-Math.PI/2);
      var sea=new T.Mesh(sg,new T.MeshStandardMaterial({color:def.sea,transparent:true,opacity:.62,roughness:.3,metalness:.05}));
      sea.position.set((x0.x+x1.x)/2,0,(x0.z+x1.z)/2);root.add(sea);
    }
    function hAt(x,z){
      var lon=x/(k*U)+lonC,lat=latC-z/U,fi=(lon-bx[0])/(bx[1]-bx[0])*(w-1),fj=(bx[3]-lat)/(bx[3]-bx[2])*(h-1);
      fi=clamp(fi,0,w-1.001);fj=clamp(fj,0,h-1.001);var i0=Math.floor(fi),j0=Math.floor(fj),u=fi-i0,t=fj-j0,
      a=e[j0*w+i0],b=e[j0*w+i0+1],c=e[(j0+1)*w+i0],d=e[(j0+1)*w+i0+1],v=(a*(1-u)+b*u)*(1-t)+(c*(1-u)+d*u)*t;
      var ed=Math.min(1,Math.min(fi,fj,w-1-fi,h-1-fj)/(Math.min(w,h)*def.edge)),sm=ed*ed*(3-2*ed);
      return Math.max(hy(v)*sm,def.sea?0:-99);}
    var x0=P(bx[3],bx[0]),x1=P(bx[2],bx[1]);
    cb({key:key,def:def,root:root,P:P,hAt:hAt,bounds:{x0:x0.x,x1:x1.x,z0:x0.z,z1:x1.z},objs:{},labels:[]});
  });
}

/* ---- Objek ---- */
function ribbon(wd,pts,rad,color,op){
  var cur=new T.CatmullRomCurve3(pts.map(function(p){return new T.Vector3(p.x,p.y,p.z);}));
  var g=new T.TubeGeometry(cur,Math.max(24,pts.length*2),rad,6,false);
  var m=new T.Mesh(g,new T.MeshBasicMaterial({color:color,transparent:op<1,opacity:op,depthWrite:op>=1}));
  m.userData.total=g.index.count;return m;
}
function drape(wd,xz,lift){return xz.map(function(p){return {x:p.x,z:p.z,y:wd.hAt(p.x,p.z)+lift};});}
function bezXZ(a,b,sg,n){
  var dx=b.x-a.x,dz=b.z-a.z,len=Math.sqrt(dx*dx+dz*dz)||1,off=Math.max(len*.2,.7)*sg,c={x:(a.x+b.x)/2-dz/len*off,z:(a.z+b.z)/2+dx/len*off},o=[];
  for(var s=0;s<=n;s++){var t=s/n,u=1-t;o.push({x:u*u*a.x+2*u*t*c.x+t*t*b.x,z:u*u*a.z+2*u*t*c.z+t*t*b.z});}return o;
}
function marker(color){
  var g=new T.Group();
  var ring=new T.Mesh(new T.TorusGeometry(.55,.1,8,32),new T.MeshStandardMaterial({color:color,roughness:.5,emissive:color,emissiveIntensity:.25}));
  ring.rotation.x=-Math.PI/2;g.add(ring);
  var disc=new T.Mesh(new T.CylinderGeometry(.45,.45,.08,24),new T.MeshStandardMaterial({color:"#fffaf0",roughness:.6}));g.add(disc);
  g.userData.ring=ring;return g;
}
function pinMesh(){
  var g=new T.Group(),gold=new T.MeshStandardMaterial({color:"#c98a1b",roughness:.35,metalness:.35,emissive:"#5a3a05",emissiveIntensity:.35});
  var cone=new T.Mesh(new T.ConeGeometry(.42,1.3,20),gold);cone.rotation.x=Math.PI;cone.position.y=.9;g.add(cone);
  var ball=new T.Mesh(new T.SphereGeometry(.5,24,16),gold);ball.position.y=1.75;g.add(ball);
  var dot=new T.Mesh(new T.SphereGeometry(.2,16,12),new T.MeshStandardMaterial({color:"#fffaf0"}));dot.position.set(0,1.78,.4);g.add(dot);
  var sh=new T.Mesh(new T.CircleGeometry(.6,24),new T.MeshBasicMaterial({color:"#000",transparent:true,opacity:.18,depthWrite:false}));sh.rotation.x=-Math.PI/2;sh.position.y=.05;g.add(sh);
  return g;
}
function kaabah(){
  var g=new T.Group(),b=new T.Mesh(new T.BoxGeometry(.9,1,.8),new T.MeshStandardMaterial({color:"#1d1d1d",roughness:.8}));b.position.y=.5;g.add(b);
  var band=new T.Mesh(new T.BoxGeometry(.92,.1,.82),new T.MeshStandardMaterial({color:"#c9a227",metalness:.5,roughness:.4}));band.position.y=.78;g.add(band);return g;
}

/* ---- Label HTML di atas kanvas ---- */
function addLabel(wd,html,cls,x,y,z,attrs,pri){
  var b=document.createElement(attrs&&attrs.btn?"button":"div");b.className="l3 "+cls;b.innerHTML=html;
  if(attrs)Object.keys(attrs).forEach(function(k){if(k!=="btn")b.setAttribute(k,attrs[k]);});
  b.style.display="none";ov.appendChild(b);var L={el:b,v:new T.Vector3(x,y,z),wd:wd,cls:cls,pri:pri||0,sz:{}};wd.labels.push(L);return L;
}
/* Label tidak boleh saling tumpuk: urut prioritas, coba di atas/bawah/kanan/kiri titik; kalau tetap tabrakan,
   label simpul diperkecil (hanya angka progres), label wilayah disembunyikan. */
var tmpV=null,GAP=14;
function rectOf(an,x,y,w,h){
  return an===0?[x-w/2,y-h-GAP,w,h]:an===1?[x-w/2,y+GAP*.6,w,h]:an===2?[x+GAP,y-h/2,w,h]:[x-GAP-w,y-h/2,w,h];
}
var ANT=["translate(-50%,calc(-100% - 14px))","translate(-50%,8px)","translate(14px,-50%)","translate(calc(-100% - 14px),-50%)"];
function hit(r,list){for(var i=0;i<list.length;i++){var q=list[i];if(r[0]<q[0]+q[2]+3&&q[0]<r[0]+r[2]+3&&r[1]<q[1]+q[3]+3&&q[1]<r[1]+r[3]+3)return true;}return false;}
function size(L,mini){var k=mini?"m":"f";if(!L.sz[k]){L.el.style.display="";L.el.classList.toggle("mini",!!mini);L.sz[k]=[L.el.offsetWidth,L.el.offsetHeight];}return L.sz[k];}
function placeLabels(){
  if(!world)return;tmpV=tmpV||new T.Vector3();
  Object.keys(worlds).forEach(function(k){worlds[k].labels.forEach(function(L){if(L.wd!==world)L.el.style.display="none";});});
  var vis=[];
  world.labels.forEach(function(L){
    tmpV.copy(L.v).project(cam);
    if(tmpV.z>1||Math.abs(tmpV.x)>1.1||Math.abs(tmpV.y)>1.1||L.hide){L.el.style.display="none";return;}
    L.x=(tmpV.x+1)/2*W;L.y=(1-tmpV.y)/2*H;vis.push(L);
  });
  vis.sort(function(a,b){return (b.pri+(b.el.classList.contains("sel")?3:0)+(b.el.classList.contains("cur")?2:0))-(a.pri+(a.el.classList.contains("sel")?3:0)+(a.el.classList.contains("cur")?2:0));});
  var placed=vis.map(function(L){return [L.x-9,L.y-9,18,18];});  /* titik penanda juga dihindari */
  vis.forEach(function(L){
    var mini=false,an=-1,s=size(L,false),cand=L.cls==="rg3"?[]:[0,1,2,3];
    if(L.cls==="rg3"){var r0=[L.x-s[0]/2,L.y-s[1]/2,s[0],s[1]];if(hit(r0,placed)){L.el.style.display="none";return;}placed.push(r0);
      L.el.style.display="";L.el.style.transform="translate("+L.x.toFixed(1)+"px,"+L.y.toFixed(1)+"px) translate(-50%,-50%)";return;}
    for(var c=0;c<cand.length&&an<0;c++){var r=rectOf(cand[c],L.x,L.y,s[0],s[1]);if(!hit(r,placed)){an=cand[c];placed.push(r);}}
    if(an<0){mini=true;s=size(L,true);for(c=0;c<cand.length&&an<0;c++){r=rectOf(cand[c],L.x,L.y,s[0],s[1]);if(!hit(r,placed)){an=cand[c];placed.push(r);}}
      if(an<0){L.el.style.display="none";return;}}   /* tetap bisa diketuk lewat penanda 3D (raycast) */
    L.el.classList.toggle("mini",mini);L.el.style.display="";
    L.el.style.transform="translate("+L.x.toFixed(1)+"px,"+L.y.toFixed(1)+"px) "+ANT[an];
  });
}

/* ---- Wilayah (peta perjalanan) ---- */
function buildRegion(wd){
  var N={};
  Object.keys(NODES).forEach(function(k){
    var n=NODES[k],p=wd.P(n.ll[0],n.ll[1]);
    if(k==="uh"){p.x+=.9;p.z-=.9;}            /* Uhud digeser skematis agar tidak menumpuk Madinah */
    p.y=wd.hAt(p.x,p.z);N[k]=p;
    var m=marker("#8a9690");m.position.set(p.x,p.y+.06,p.z);wd.root.add(m);wd.objs["m-"+k]=m;
    var L=addLabel(wd,'<span class="c"></span><span class="t">'+esc(n.n)+'</span>',"nd3",p.x,p.y+.1,p.z,{btn:1,id:"nd-"+k,"data-node":k,"aria-label":n.full},2);
    L.el.addEventListener("click",function(){if(onPick)onPick(k);});wd.objs["l-"+k]=L;
  });
  wd.N=N;wd.legs={};
  for(var i=0;i<S.length;i++){
    if(NODE_OF[i]===NODE_OF[i+1])continue;
    var a=N[NODE_OF[i]],b=N[NODE_OF[i+1]],pts=drape(wd,bezXZ(a,b,i%2?1:-1,48),.14);
    var base=ribbon(wd,pts,.085,"#fffaf0",.75),done=ribbon(wd,pts,.11,"#c98a1b",1);done.geometry.setDrawRange(0,0);
    wd.root.add(base);wd.root.add(done);wd.legs[i]={pts:pts,base:base,done:done};
  }
  [["LAUT MERAH",24.0,36.6],["HIJAZ",23.6,41.6],["NAJD",24.9,43.6],["SYAM",31.4,37.4]].forEach(function(r){
    var p=wd.P(r[1],r[2]);addLabel(wd,esc(r[0]),"rg3",p.x,wd.hAt(p.x,p.z)+.3,p.z);});
  var tok=pinMesh();wd.root.add(tok);wd.tok=tok;
}
function nodeState(k){
  var sts=NODES[k].sts,d=0;sts.forEach(function(j){if(doneF(j))d++;});
  var cur=sts.indexOf(tokSt)>-1;return {d:d,n:sts.length,cur:cur,all:d===sts.length};
}
function refreshRegion(){
  var wd=worlds.region;if(!wd)return;
  Object.keys(NODES).forEach(function(k){
    var s=nodeState(k),m=wd.objs["m-"+k],c=s.cur?"#c98a1b":s.all?"#1b6e45":s.d?"#58a07f":"#8a9690";
    m.userData.ring.material.color.set(c);m.userData.ring.material.emissive.set(c);
    var L=wd.objs["l-"+k],tx=s.d+"/"+s.n;if(L.el.querySelector(".c").textContent!==tx){L.el.querySelector(".c").textContent=tx;L.sz={};}
    L.el.classList.toggle("cur",s.cur);L.el.classList.toggle("done",s.all);L.el.classList.toggle("sel",sel>-1&&NODE_OF[sel]===k);
  });
  Object.keys(wd.legs).forEach(function(i){var L=wd.legs[i];if(L.anim)return;L.done.geometry.setDrawRange(0,(doneF(+i)||+i<tokSt)?L.done.userData.total:0);});
  var p=wd.N[NODE_OF[tokSt]];wd.tok.position.set(p.x,p.y,p.z);
  dirty=true;
}

/* ---- Kota ---- */
var CITY={
  mk:{t:"makkah",n:"Makkah",marks:[["mk","Ka’bah (Masjidil Haram)"],["hr","Gua Hira, Jabal Nur"],["ts","Gua Tsaur"],["mn","Mina"],["ja","Jamratul Aqabah"],["mh","Wadi Muhasshir"],["mz","Muzdalifah"],["ar","Arafah"]],maps:["hira","abz","mnk"]},
  md:{t:"madinah",n:"Madinah",marks:[["md","Masjid Nabawi"],["qb","Quba’"],["uh","Gunung Uhud"],["sl","Bukit Sal’"],["dh","Dzul Hulaifah"]],maps:["mad","uhud","ahz"]}
};
function cityOf(k){return k==="uh"?"md":CITY[k]?k:null;}
function buildCity(wd,ck){
  var C=CITY[ck];wd.marks={};
  C.marks.forEach(function(m){
    var ll=PL[m[0]],p=wd.P(ll[0],ll[1]);p.y=wd.hAt(p.x,p.z);wd.marks[m[0]]=p;
    if(m[0]==="mk"){var kb=kaabah();kb.position.set(p.x,p.y,p.z);wd.root.add(kb);}
    else{var mk=marker("#0e5a47");mk.scale.setScalar(.8);mk.position.set(p.x,p.y+.05,p.z);wd.root.add(mk);}
    addLabel(wd,'<span class="t">'+esc(m[1])+'</span>',"lm3",p.x,p.y+.2,p.z,null,m[0]===ck?2:1);
  });
  wd.route=new T.Group();wd.root.add(wd.route);
}
function cityStory(mk){
  var wd=world;if(!wd||!wd.route)return;
  while(wd.route.children.length)wd.route.remove(wd.route.children[0]);
  var m=MP[mk];if(!m||!m.r)return;
  var COLS={a:"#c98a1b",b:"#2f6f8f",c:"#a3362a"},all=[];
  (m.p||[]).forEach(function(q){var ll=PL[q[0]];if(ll)all.push(wd.P(ll[0],ll[1]));});
  m.r.forEach(function(r){
    var xz=r.p.map(function(q){var ll=typeof q==="string"?PL[q]:q;return wd.P(ll[0],ll[1]);}),pts=[];
    for(var i=0;i<xz.length-1;i++){var seg=bezXZ(xz[i],xz[i+1],0,24);if(i)seg.shift();pts=pts.concat(seg);}
    var rb=ribbon(wd,drape(wd,pts,.25),.16,COLS[r.c]||COLS.a,1);wd.route.add(rb);
    if(r.a){var e=pts[pts.length-1],f=pts[pts.length-3],cn=new T.Mesh(new T.ConeGeometry(.45,1.1,16),new T.MeshBasicMaterial({color:COLS[r.c]||COLS.a}));
      var ang=Math.atan2(e.x-f.x,e.z-f.z);cn.rotation.set(Math.PI/2,0,0);var g=new T.Group();g.add(cn);g.rotation.y=ang;g.position.set(e.x,wd.hAt(e.x,e.z)+.45,e.z);wd.route.add(g);}
  });
  if(all.length)fitPts(all,900);
  dirty=true;kick();
}

/* ---- Kamera ---- */
function applyCam(){
  var b=world.bounds;rig.x=clamp(rig.x,b.x0,b.x1);rig.z=clamp(rig.z,b.z0,b.z1);
  var dm=world.def.dist;rig.d=clamp(rig.d,dm[0],dm[1]);rig.phi=clamp(rig.phi,.15,1.12);
  var ty=world.hAt(rig.x,rig.z)*.6;
  cam.position.set(rig.x+Math.sin(rig.az)*Math.sin(rig.phi)*rig.d,ty+Math.cos(rig.phi)*rig.d,rig.z+Math.cos(rig.az)*Math.sin(rig.phi)*rig.d);
  cam.lookAt(rig.x,ty,rig.z);cam.near=rig.d*.02;cam.far=rig.d*8;cam.updateProjectionMatrix();
  scene.fog.near=rig.d*1.1;scene.fog.far=rig.d*3.6;
  var s=clamp(rig.d/world.def.mk,.35,2.6);
  if(world.tok)world.tok.scale.setScalar(s);
  world.root.traverse(function(o){if(o.userData.ring&&o.parent===world.root)o.scale.setScalar(s*(world.key==="region"?1:.8));});
  dirty=true;
}
function fly(to,ms,cb){
  var from={x:rig.x,z:rig.z,d:rig.d,phi:rig.phi};if(reduceM||!ms){Object.assign(rig,to);applyCam();if(cb)cb();return;}
  anim=anim.filter(function(a){return !a.fly;});
  anim.push({fly:1,t0:performance.now(),ms:ms,f:function(t){var e=ease(t);["x","z","d","phi"].forEach(function(k){if(to[k]!=null)rig[k]=lerp(from[k],to[k],e);});applyCam();},cb:cb});
  kick();
}

/* ---- Interaksi ---- */
var ptrs={},pinch=null,moved=0;
function wpp(){return 2*rig.d*Math.tan(cam.fov*Math.PI/360)/H;}
function bindInput(){
  cv.addEventListener("pointerdown",function(e){cv.setPointerCapture(e.pointerId);ptrs[e.pointerId]={x:e.clientX,y:e.clientY};moved=0;pinch=null;});
  cv.addEventListener("pointermove",function(e){
    var p=ptrs[e.pointerId];if(!p)return;var ids=Object.keys(ptrs);
    if(ids.length===1){var dx=e.clientX-p.x,dy=e.clientY-p.y,k=wpp();moved+=Math.abs(dx)+Math.abs(dy);
      rig.x-=(dx*Math.cos(rig.az)+dy*Math.sin(rig.az))*k;rig.z-=(dy*Math.cos(rig.az)-dx*Math.sin(rig.az))*k/Math.max(.45,Math.cos(rig.phi*.8));applyCam();kick();}
    p.x=e.clientX;p.y=e.clientY;
    if(ids.length===2){var a=ptrs[ids[0]],b=ptrs[ids[1]],dd=Math.hypot(a.x-b.x,a.y-b.y),my=(a.y+b.y)/2;
      if(pinch){rig.d*=pinch.dd/(dd||1);rig.phi+=(my-pinch.my)*.006;applyCam();kick();}pinch={dd:dd,my:my};}
  });
  function up(e){var one=Object.keys(ptrs).length===1;delete ptrs[e.pointerId];pinch=null;if(one&&moved<6&&e.type==="pointerup")tap(e);}
  cv.addEventListener("pointerup",up);cv.addEventListener("pointercancel",up);
  cv.addEventListener("wheel",function(e){e.preventDefault();rig.d*=Math.exp(e.deltaY*.0012);applyCam();kick();},{passive:false});
}
var ray=null;
function tap(e){
  if(view!=="region"||!onPick)return;var wd=worlds.region,r=cv.getBoundingClientRect();ray=ray||new T.Raycaster();
  ray.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),cam);
  var best=null,bd=1e9;Object.keys(NODES).forEach(function(k){var m=wd.objs["m-"+k],d=ray.ray.distanceToPoint(m.position),lim=1.4*m.scale.x;if(d<lim&&d<bd){bd=d;best=k;}});
  if(best)onPick(best);
}
function resize(){
  W=el.clientWidth;H=el.clientHeight;if(!W||!H)return;dpr=Math.min(window.devicePixelRatio||1,typeof gfxLite==="function"&&gfxLite()?1:1.75);
  R.setPixelRatio(dpr);R.setSize(W,H,false);cam.aspect=W/H;cam.updateProjectionMatrix();dirty=true;kick();
}
function frame(t){
  raf=0;var busy=anim.length>0;
  for(var i=anim.length-1;i>=0;i--){var a=anim[i],p=Math.min(1,(t-a.t0)/a.ms);a.f(p);if(p>=1){anim.splice(i,1);if(a.cb)a.cb();}}
  var bob=world&&world.tok&&!reduceM&&!document.hidden;
  if(bob&&(busy||t-last>40)){world.tok.children.forEach(function(c,ix){if(ix<3)c.position.y=[.9,1.75,1.78][ix]+Math.sin(t/380)*.12;});dirty=true;}
  if(dirty){R.render(scene,cam);placeLabels();dirty=false;last=t;}
  if(anim.length||bob)raf=requestAnimationFrame(frame);
}
function kick(){if(!raf)raf=requestAnimationFrame(frame);}

/* ---- API ---- */
function supported(){try{var c=document.createElement("canvas");return !!(window.WebGLRenderingContext&&(c.getContext("webgl2")||c.getContext("webgl")));}catch(e){return false;}}
var DEF={
  region:{unit:10,ex:.00075,base:0,edge:.08,pal:function(v){return palette(PAL_REG,v);},sea:"#5c9fb8",dist:[9,140],mk:45},
  makkah:{unit:340,ex:.0062,edge:.2,fit:78,pal:null,dist:[12,120],mk:45},
  madinah:{unit:340,ex:.0062,edge:.2,fit:78,pal:null,dist:[12,120],mk:45}
};
function cityPal(md){var lo=md.min,hi=md.max;return function(v){var t=(v-lo)/((hi-lo)||1);
  return palette([[0,"#efe1bf"],[.18,"#e2c999"],[.45,"#c9a271"],[.75,"#a7794b"],[1,"#86613f"]],t);};}
function init(container,opts){
  if(!supported()||!window.T3)return false;
  el=container;onPick=opts.onPick;onCity=opts.onCity;doneF=opts.done||doneF;reduceM=rm();
  R=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:"high-performance"});R.toneMapping=T.ACESFilmicToneMapping;R.toneMappingExposure=1.05;
  cv=R.domElement;cv.className="cv3";cv.setAttribute("role","img");cv.setAttribute("aria-label","Peta 3D Hijaz dan sekitarnya. Geser untuk menjelajah, cubit untuk zoom.");
  el.appendChild(cv);ov=document.createElement("div");ov.className="ov3";el.appendChild(ov);
  var bg=css("--bg","#ECEFE8");
  scene=new T.Scene();scene.background=new T.Color(bg);scene.fog=new T.Fog(bg,60,200);
  cam=new T.PerspectiveCamera(38,1,.1,1000);
  scene.add(new T.HemisphereLight("#fff4df","#7d6c55",1.1));
  var sun=new T.DirectionalLight("#fff0d4",2.4);sun.position.set(-60,70,-45);scene.add(sun);
  DEF.region.bg=DEF.makkah.bg=DEF.madinah.bg=bg;
  DEF.makkah.pal=cityPal(TERR.makkah);DEF.madinah.pal=cityPal(TERR.madinah);
  bindInput();window.addEventListener("resize",resize);document.addEventListener("visibilitychange",function(){dirty=true;kick();});
  if(window.ResizeObserver)new ResizeObserver(resize).observe(el);
  makeWorld("region",DEF.region,function(wd){
    worlds.region=wd;buildRegion(wd);scene.add(wd.root);world=wd;resize();refreshRegion();
    var p=wd.N[NODE_OF[tokSt]];rig.x=p.x;rig.z=p.z;rig.d=55;applyCam();kick();if(opts.ready)opts.ready();
  });
  return true;
}
function setState(o){if(o.tokSt!=null)tokSt=o.tokSt;if(o.sel!=null)sel=o.sel;refreshRegion();kick();}
function focusNode(k,ms){var wd=worlds.region;if(!wd||view!=="region")return;var p=wd.N[k];fly({x:p.x,z:p.z+2,d:Math.min(rig.d,34),phi:.85},ms==null?900:ms);}
function overview(){var wd=worlds.region;if(view!=="region"){exitCity();}fitPts(Object.keys(wd.N).map(function(k){return wd.N[k];}),900);}
/* Token berjalan dari stasiun a ke b, rute digambar bertahap, kamera mengikuti */
function travel(a,b,cb){
  var wd=worlds.region;if(!wd||view!=="region"){tokSt=b;refreshRegion();if(cb)cb();return;}
  var legs=[];for(var i=a;i<b;i++)if(wd.legs[i])legs.push(i);
  if(reduceM||!legs.length){tokSt=b;refreshRegion();focusNode(NODE_OF[b],0);if(cb)cb();return;}
  var n=0;trav=true;
  (function next(){
    if(n>=legs.length){trav=false;tokSt=b;refreshRegion();if(cb)cb();return;}
    var L=wd.legs[legs[n]],pts=L.pts,tot=L.done.userData.total,ms=clamp(6500/legs.length,900,1700);L.anim=true;
    rig.d=Math.max(Math.min(rig.d,40),24);
    anim.push({t0:performance.now(),ms:ms,f:function(t){
      var e=ease(t),f=e*(pts.length-1),i0=Math.floor(f),u=f-i0,p0=pts[i0],p1=pts[Math.min(i0+1,pts.length-1)];
      var x=lerp(p0.x,p1.x,u),z=lerp(p0.z,p1.z,u);wd.tok.position.set(x,wd.hAt(x,z),z);
      L.done.geometry.setDrawRange(0,Math.floor(tot*e/6)*6);rig.x=x;rig.z=z+2;applyCam();},
      cb:function(){L.anim=false;n++;next();}});
    kick();
  })();
}
function enterCity(k){
  var ck=cityOf(k);if(!ck)return false;var C=CITY[ck];
  function go(wd){
    worlds.region.root.visible=false;wd.root.visible=true;world=wd;view=ck;
    var p=wd.marks[ck==="mk"?"mk":"md"];rig.x=p.x;rig.z=p.z;rig.d=110;rig.phi=.4;applyCam();
    fitPts(Object.keys(wd.marks).map(function(k){return wd.marks[k];}),1300);
    el.classList.add("incity");if(onCity)onCity(ck);
  }
  if(worlds[ck])go(worlds[ck]);
  else makeWorld(C.t,DEF[C.t],function(wd){worlds[ck]=wd;buildCity(wd,ck);scene.add(wd.root);go(wd);});
  return true;
}
function exitCity(){
  if(view==="region")return;var k=view;worlds[k].root.visible=false;worlds.region.root.visible=true;world=worlds.region;view="region";
  el.classList.remove("incity");var p=worlds.region.N[k];rig.x=p.x;rig.z=p.z+1;rig.d=14;rig.phi=.7;applyCam();fly({d:34,phi:.85},reduceM?0:900);if(onCity)onCity(null);
}
/* Bingkai kamera agar semua titik (x,z) masuk layar */
function fitPts(pts,ms){
  var x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;pts.forEach(function(p){x0=Math.min(x0,p.x);x1=Math.max(x1,p.x);z0=Math.min(z0,p.z);z1=Math.max(z1,p.z);});
  var w=(x1-x0)*1.5+10,h=(z1-z0)*1.5+10,t=Math.tan(cam.fov*Math.PI/360),phi=.78,
      d=Math.max(h/(2*t)/Math.max(.55,Math.cos(phi*.6)),w/(2*t*cam.aspect));
  /* geser sedikit ke kanan agar isi peta tidak tertutup tombol kontrol di sisi kanan */
  var rg=world&&world.key==="region";if(!rg)d=Math.min(d,world.def.fit||d);
  fly({x:(x0+x1)/2+w*.05,z:(z0+z1)/2+(rg?d*.06:0),d:d,phi:rg?phi:.7},reduceM?0:(ms==null?900:ms));
}
function zoom(f){rig.d*=f;applyCam();kick();}
function tilt(){fly({phi:rig.phi>.5?.12:.85},600);}
return {resize:function(){if(R)resize();},init:init,setState:setState,focusNode:focusNode,overview:overview,travel:travel,enterCity:enterCity,exitCity:exitCity,
  cityOf:cityOf,CITY:CITY,fitPts:fitPts,story:cityStory,zoom:zoom,tilt:tilt,view:function(){return view;},busy:function(){return anim.length>0;},traveling:function(){return trav;}};
})();
