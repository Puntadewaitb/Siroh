/* ---------- Adegan lokasi ala RPG: latar 3D khas tempat -> kilasan kisah -> soal ----------
   Adab: tidak ada sosok manusia, wajah, maupun malaikat. Pasukan = panji/tenda, kafilah = muatan.
   Kisah khusus (KISAH) ditulis dari buku dan dicek ke OCR (hlm. tercantum). Stasiun tanpa kisah khusus
   memakai ringkasan stasiun. Latar adalah ilustrasi suasana, bukan rekonstruksi. */
var SC=(function(){
var T=window.T3,R=null,scene,cam,host,cv,raf=0,lastT=0,upd=[],reduceM=false,live=false;
var cur=null,hooks={},sky=null,stars=null,hemi=null,sun=null,camA={p:null,l:null},camB=null,camT0=0,camMs=1;
function lerp(a,b,t){return a+(b-a)*t;}
function ease(t){return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function rm(){try{return matchMedia("(prefers-reduced-motion: reduce)").matches;}catch(e){return false;}}
function hash(i,j){var h=Math.imul(i,374761393)+Math.imul(j,668265263)|0;h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967295;}
function vn(x,z){var i=Math.floor(x),j=Math.floor(z),fx=x-i,fz=z-j,u=fx*fx*(3-2*fx),v=fz*fz*(3-2*fz);
  return lerp(lerp(hash(i,j),hash(i+1,j),u),lerp(hash(i,j+1),hash(i+1,j+1),u),v);}
function fbm(x,z,o){var a=0,f=1,amp=1,n=0;for(var k=0;k<(o||4);k++){a+=vn(x*f+k*17.3,z*f-k*9.1)*amp;n+=amp;f*=2.03;amp*=.5;}return a/n;}
function seeded(s){return function(){s=Math.imul(s^(s>>>15),2246822507)+1013904223|0;return ((s>>>0)%100000)/100000;};}
function C(c){return new T.Color(c);}
function std(c,o){o=o||{};return new T.MeshStandardMaterial({color:c,roughness:o.r==null?.9:o.r,metalness:o.m||0,flatShading:o.flat!==false,emissive:o.e||"#000",emissiveIntensity:o.ei||0});}

/* ---- Langit & cahaya: preset waktu ---- */
var SKY={
  day:  {top:"#6c9fcf",hor:"#efe2c6",sun:"#fff0d2",si:2.3,hi:1.0,star:0,fog:"#eadcc0",pos:[-60,90,-40]},
  dusk: {top:"#33466f",hor:"#eda46a",sun:"#ffad6b",si:1.5,hi:.55,star:.15,fog:"#d99a6c",pos:[-90,25,-30]},
  night:{top:"#081128",hor:"#2a3a63",sun:"#a9bcff",si:.75,hi:.42,star:1,fog:"#1d2846",pos:[40,80,-60]},
  dawn: {top:"#22355f",hor:"#f2b48a",sun:"#ffc59c",si:1.0,hi:.45,star:.35,fog:"#c99a86",pos:[90,18,-20]},
  storm:{top:"#30363f",hor:"#7f8586",sun:"#c3c8cf",si:.6,hi:.5,star:0,fog:"#6d7375",pos:[-30,80,-40]}
};
var skyNow=null,skyFrom=null,skyTo=null,skyT0=0,skyMs=1;
function mkSky(){
  var g=new T.SphereGeometry(900,32,16),n=g.attributes.position.count;g.setAttribute("color",new T.BufferAttribute(new Float32Array(n*3),3));
  sky=new T.Mesh(g,new T.MeshBasicMaterial({vertexColors:true,side:T.BackSide,fog:false,depthWrite:false}));sky.renderOrder=-1;scene.add(sky);
  var r=seeded(7),sp=new Float32Array(900*3);
  for(var i=0;i<900;i++){var a=r()*Math.PI*2,e=Math.asin(.08+r()*.92),d=850;sp[i*3]=Math.cos(a)*Math.cos(e)*d;sp[i*3+1]=Math.sin(e)*d;sp[i*3+2]=Math.sin(a)*Math.cos(e)*d;}
  var sg=new T.BufferGeometry();sg.setAttribute("position",new T.BufferAttribute(sp,3));
  stars=new T.Points(sg,new T.PointsMaterial({color:"#fff",size:1.8,sizeAttenuation:false,transparent:true,opacity:0,fog:false,depthWrite:false}));scene.add(stars);
  hemi=new T.HemisphereLight("#fff4df","#7d6c55",1);scene.add(hemi);
  sun=new T.DirectionalLight("#fff",2);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
  var sc=sun.shadow.camera;sc.left=-70;sc.right=70;sc.top=70;sc.bottom=-70;sc.near=1;sc.far=400;sun.shadow.bias=-.0015;sun.shadow.normalBias=.4;
  scene.add(sun);scene.add(sun.target);
}
function skyMix(a,b,t){
  var o={};["top","hor","sun","fog"].forEach(function(k){o[k]=C(a[k]).lerp(C(b[k]),t);});
  ["si","hi","star"].forEach(function(k){o[k]=lerp(a[k],b[k],t);});o.pos=a.pos.map(function(v,i){return lerp(v,b.pos[i],t);});return o;
}
function skyApply(s){
  var p=sky.geometry.attributes.position,c=sky.geometry.attributes.color;
  for(var i=0;i<p.count;i++){var y=p.getY(i)/900,k=y<=0?0:Math.pow(y,.55),col=s.hor.clone().lerp(s.top,k);c.setXYZ(i,col.r,col.g,col.b);}
  c.needsUpdate=true;stars.material.opacity=s.star;sun.color.copy(s.sun);sun.intensity=s.si;
  var tg=camB?camB.l:(camA.l||new T.Vector3());sun.target.position.copy(tg);sun.position.set(tg.x+s.pos[0],tg.y+s.pos[1],tg.z+s.pos[2]);
  hemi.intensity=s.hi;hemi.color.copy(C("#fff4df").lerp(s.top,.35));scene.fog.color.copy(s.fog);scene.background=s.fog;
}
function setSky(name,ms){
  var to=SKY[name]||SKY.day;skyFrom=skyNow||to;skyTo=to;skyT0=performance.now();skyMs=reduceM?1:(ms||1500);
}
function skyTick(t){if(!skyTo)return;var k=clamp((t-skyT0)/skyMs,0,1);skyApply(skyMix(skyFrom,skyTo,ease(k)));if(k>=1){skyNow=skyTo;skyTo=null;}}

/* ---- Tanah ---- */
function ground(size,seg,hf,cf){
  var g=new T.PlaneGeometry(size,size,seg,seg);g.rotateX(-Math.PI/2);
  var p=g.attributes.position,n=p.count,col=new Float32Array(n*3);
  for(var i=0;i<n;i++){var x=p.getX(i),z=p.getZ(i),y=hf(x,z);p.setY(i,y);var c=cf(x,z,y);col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b;}
  g.setAttribute("color",new T.BufferAttribute(col,3));g.computeVertexNormals();
  var m=new T.Mesh(g,new T.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:1}));m.receiveShadow=true;scene.add(m);return m;
}
function ramp(stops){return function(v){v=clamp(v,0,1);for(var i=1;i<stops.length;i++)if(v<=stops[i][0]){var a=stops[i-1],b=stops[i];return C(a[1]).lerp(C(b[1]),(v-a[0])/((b[0]-a[0])||1));}return C(stops[stops.length-1][1]);};}
/* data ketinggian (TERR) -> fungsi tinggi lokal; dimuat sekali */
var DEM={};
function loadDem(key,cb){
  if(DEM[key])return cb(DEM[key]);var md=TERR[key],im=new Image();
  im.onload=function(){var c=document.createElement("canvas");c.width=im.width;c.height=im.height;var x=c.getContext("2d");x.drawImage(im,0,0);
    var d=x.getImageData(0,0,im.width,im.height).data,e=new Float32Array(im.width*im.height);for(var i=0;i<e.length;i++)e[i]=d[i*4]*256+d[i*4+1]-1000;
    DEM[key]={e:e,w:im.width,h:im.height,bx:md.bx};cb(DEM[key]);};
  im.src=md.src;
}
function demAt(D,lat,lon){
  var fi=clamp((lon-D.bx[0])/(D.bx[1]-D.bx[0])*(D.w-1),0,D.w-1.001),fj=clamp((D.bx[3]-lat)/(D.bx[3]-D.bx[2])*(D.h-1),0,D.h-1.001),
    i=Math.floor(fi),j=Math.floor(fj),u=fi-i,v=fj-j,e=D.e,w=D.w;
  return (e[j*w+i]*(1-u)+e[j*w+i+1]*u)*(1-v)+(e[(j+1)*w+i]*(1-u)+e[(j+1)*w+i+1]*u)*v;
}
/* proyeksi lokal: pusat (lat0,lon0), "u" unit per derajat */
function local(lat0,lon0,u){var k=Math.cos(lat0*Math.PI/180);
  return {xz:function(lat,lon){return {x:(lon-lon0)*k*u,z:(lat0-lat)*u};},ll:function(x,z){return {lat:lat0-z/u,lon:lon0+x/(k*u)};}};}

/* ---- Kit objek ---- */
function inst(geo,mat,list){ /* list: [{x,y,z,s:[sx,sy,sz],r,c}] */
  var m=new T.InstancedMesh(geo,mat,list.length),o=new T.Object3D();
  list.forEach(function(it,i){o.position.set(it.x,it.y,it.z);o.rotation.set(0,it.r||0,0);var s=it.s||[1,1,1];o.scale.set(s[0],s[1],s[2]);o.updateMatrix();m.setMatrixAt(i,o.matrix);if(it.c)m.setColorAt(i,C(it.c));});
  m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;
}
function houses(cx,cz,rad,n,h,seed,avoid){
  var r=seeded(seed||3),L=[],box=new T.BoxGeometry(1,1,1);box.translate(0,.5,0);
  var cols=["#e9dcc2","#dccaa8","#cdb48c","#efe6d2","#d8c19b"];
  for(var k=0;k<n*3&&L.length<n;k++){
    var a=r()*Math.PI*2,d=Math.sqrt(r())*rad,x=cx+Math.cos(a)*d,z=cz+Math.sin(a)*d*.8;
    if(avoid&&avoid(x,z))continue;var w=.5+r()*.7;
    L.push({x:x,y:h(x,z)-.1,z:z,s:[w,.35+r()*.5,w*(.7+r()*.6)],r:r()*.6,c:cols[Math.floor(r()*cols.length)]});
  }
  return inst(box,std("#fff",{r:.95}),L);
}
function kaabah(x,y,z,s){
  var g=new T.Group(),b=new T.Mesh(new T.BoxGeometry(1,1.15,.9),std("#151515",{r:.85}));b.position.y=.575;g.add(b);
  var band=new T.Mesh(new T.BoxGeometry(1.02,.1,.92),std("#c9a227",{r:.4,m:.5}));band.position.y=.86;g.add(band);
  var yard=new T.Mesh(new T.CylinderGeometry(3.2,3.4,.1,32),std("#f4efe4",{r:.7}));yard.position.y=.02;g.add(yard);
  g.position.set(x,y,z);g.scale.setScalar(s||1);scene.add(g);return g;
}
function palms(list,seed){
  var r=seeded(seed||5),tr=[],lf=[],tg=new T.CylinderGeometry(.06,.1,1,5);tg.translate(0,.5,0);
  var lg=new T.ConeGeometry(.55,.18,7);lg.translate(0,0,0);
  list.forEach(function(p){var h=1.6+r()*1.4;tr.push({x:p.x,y:p.y,z:p.z,s:[1,h,1],r:r()*3});
    lf.push({x:p.x,y:p.y+h,z:p.z,s:[1.6,1.2,1.6],r:r()*3,c:["#4f7a3a","#5d8a40","#47703a"][Math.floor(r()*3)]});});
  inst(tg,std("#7a5a3a"),tr);inst(lg,std("#fff",{r:.8}),lf);
}
function tents(list,col){
  var g=new T.ConeGeometry(1,1,4);g.translate(0,.5,0);
  return inst(g,std(col||"#efe4cc",{r:.85}),list.map(function(p){return {x:p.x,y:p.y-.05,z:p.z,s:[p.s||1.4,p.h||1.1,p.s||1.4],r:Math.PI/4+(p.r||0),c:p.c};}));
}
function well(x,y,z){
  var g=new T.Group(),ring=new T.Mesh(new T.CylinderGeometry(.85,.95,.55,12),std("#b3a58c"));ring.position.y=.27;g.add(ring);
  var w=new T.Mesh(new T.CircleGeometry(.68,12),new T.MeshStandardMaterial({color:"#3f7f97",roughness:.15}));w.rotation.x=-Math.PI/2;w.position.y=.56;g.add(w);
  g.position.set(x,y,z);scene.add(g);return g;
}
function pool(x,y,z,w,d){var rim=new T.Mesh(new T.BoxGeometry(w+.6,.5,d+.6),std("#b3a58c"));rim.position.set(x,y+.1,z);rim.castShadow=rim.receiveShadow=true;scene.add(rim);
  var m=new T.Mesh(new T.PlaneGeometry(w,d),new T.MeshStandardMaterial({color:"#3d7f98",roughness:.15,metalness:.1}));
  m.rotation.x=-Math.PI/2;m.position.set(x,y+.37,z);scene.add(m);upd.push(function(t){m.material.color.setHSL(.55,.42,.38+Math.sin(t/700)*.03);});return m;}
/* panji: tiang + kain berkibar. warna sisi dibedakan, dengan label keterangan di dialog */
function banners(list,col){
  var pg=new T.CylinderGeometry(.05,.05,1,5);pg.translate(0,.5,0);var items=[];
  list.forEach(function(p,ix){
    var g=new T.Group(),h=p.h||4.6,pole=new T.Mesh(pg,std("#5b4632"));pole.scale.y=h;g.add(pole);
    var cg=new T.PlaneGeometry(2.2,1.3,8,3);cg.translate(1.1,0,0);var cloth=new T.Mesh(cg,new T.MeshStandardMaterial({color:col,side:T.DoubleSide,roughness:.8,flatShading:true}));
    cloth.position.y=h-.7;g.add(cloth);pole.castShadow=cloth.castShadow=true;g.position.set(p.x,p.y,p.z);g.rotation.y=p.r||0;scene.add(g);
    var base=cg.attributes.position.array.slice(),ph=ix*1.7;
    items.push({g:g,cloth:cloth,base:base,ph:ph,home:{x:p.x,z:p.z},fall:0});
  });
  upd.push(function(t){items.forEach(function(it){var a=it.cloth.geometry.attributes.position;
    for(var i=0;i<a.count;i++){var x=it.base[i*3];a.setZ(i,Math.sin(t/260+x*2.2+it.ph)*.14*x);}a.needsUpdate=true;
    it.g.rotation.z=-it.fall*1.35;});});
  return items;
}
function hill(x,z,r,h,col,seed){
  var g=new T.SphereGeometry(1,14,8,0,Math.PI*2,0,Math.PI/2),p=g.attributes.position;
  for(var i=0;i<p.count;i++){var px=p.getX(i),py=p.getY(i),pz=p.getZ(i),n=fbm(px*2+seed,pz*2-seed,3);
    p.setXYZ(i,px*r*(.8+n*.4),Math.pow(py,1.3)*h*(.7+n*.6),pz*r*(.8+n*.4));}
  g.computeVertexNormals();var m=new T.Mesh(g,std(col||"#c9a476"));m.position.set(x,-.5,z);m.receiveShadow=true;scene.add(m);return m;
}
function fort(x,y,z,w,col){
  var g=new T.Group(),m=std(col||"#b79a74");
  var wall=new T.Mesh(new T.BoxGeometry(w,1.2,w*.8),m);wall.position.y=.6;g.add(wall);
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(function(q){var t=new T.Mesh(new T.CylinderGeometry(.45,.5,2,8),m);t.position.set(q[0]*w/2,1,q[1]*w*.4);g.add(t);});
  g.position.set(x,y,z);scene.add(g);return g;
}
function bigTree(x,y,z){
  var g=new T.Group(),tr=new T.Mesh(new T.CylinderGeometry(.25,.4,2.4,7),std("#6b4e33"));tr.position.y=1.2;g.add(tr);
  [[0,3.1,0,1.9],[.9,2.7,.3,1.3],[-.8,2.8,-.4,1.4]].forEach(function(b){var c=new T.Mesh(new T.SphereGeometry(b[3],7,5),std("#5f7f3c"));c.position.set(b[0],b[1],b[2]);g.add(c);});
  g.position.set(x,y,z);scene.add(g);return g;
}
/* batu dan semak tersebar (ciri gurun berbatu) */
function clutter(h,area,n,seed,bushCol,avoid){
  var r=seeded(seed||13),rk=[],bs=[],rg=new T.SphereGeometry(1,6,4),bg=new T.ConeGeometry(.6,.7,6);bg.translate(0,.3,0);
  for(var i=0;i<n;i++){var x=(r()-.5)*area,z=(r()-.5)*area;if(avoid&&avoid(x,z))continue;var y=h(x,z);
    if(r()<.55)rk.push({x:x,y:y,z:z,s:[.3+r()*.9,.2+r()*.4,.3+r()*.8],r:r()*3,c:["#a08a6c","#8d7860","#b49d7c"][Math.floor(r()*3)]});
    else bs.push({x:x,y:y,z:z,s:[.6+r()*.8,.5+r()*.6,.6+r()*.8],r:r()*3,c:bushCol||["#7b8450","#6c7646","#8a8a55"][Math.floor(r()*3)]});}
  if(rk.length)inst(rg,std("#fff"),rk);if(bs.length)inst(bg,std("#fff",{r:1}),bs);
}
/* cincin bukit di kejauhan agar lembah terasa terbingkai */
function ringHills(rad,n,hmin,hmax,col,seed){var r=seeded(seed||19);for(var i=0;i<n;i++){var a=i/n*Math.PI*2+r()*.2,d=rad*(.9+r()*.25);hill(Math.cos(a)*d,Math.sin(a)*d,18+r()*22,hmin+r()*(hmax-hmin),col,seed+i);}}
/* partikel: hujan, debu, pasir terlempar */
function particles(n,size,col,op,spawn,step,blend){
  var a=new Float32Array(n*3),v=[];for(var i=0;i<n;i++){var p=spawn(i,true);a[i*3]=p.x;a[i*3+1]=p.y;a[i*3+2]=p.z;v.push(p);}
  var g=new T.BufferGeometry();g.setAttribute("position",new T.BufferAttribute(a,3));
  var m=new T.Points(g,new T.PointsMaterial({color:col,size:size,transparent:true,opacity:op,depthWrite:false,blending:blend?T.AdditiveBlending:undefined}));scene.add(m);
  var on={v:0};upd.push(function(t,dt){m.visible=on.v>0.01;if(!m.visible)return;m.material.opacity=op*on.v;
    for(var i=0;i<n;i++){var p=v[i];step(p,dt);if(p.dead){p=v[i]=spawn(i,false);}a[i*3]=p.x;a[i*3+1]=p.y;a[i*3+2]=p.z;}g.attributes.position.needsUpdate=true;});
  m.visible=false;return on;
}
var haloTex=null;
function halo(){if(haloTex)return haloTex;var c=document.createElement("canvas");c.width=c.height=64;var g=c.getContext("2d"),r=g.createRadialGradient(32,32,0,32,32,32);
  r.addColorStop(0,"rgba(255,255,255,1)");r.addColorStop(.25,"rgba(255,255,255,.55)");r.addColorStop(1,"rgba(255,255,255,0)");g.fillStyle=r;g.fillRect(0,0,64,64);haloTex=new T.CanvasTexture(c);return haloTex;}
function glow(x,y,z,col,inten,dist,size){var l=new T.PointLight(col,inten,dist||30,1.6);l.position.set(x,y,z);scene.add(l);
  var s=new T.Sprite(new T.SpriteMaterial({map:halo(),color:col,transparent:true,blending:T.AdditiveBlending,depthWrite:false,fog:false}));s.position.set(x,y,z);s.scale.setScalar(size||2.4);scene.add(s);
  var o={l:l,s:s,base:inten,size:size||2.4};upd.push(function(){s.scale.setScalar(o.size*(.6+o.l.intensity/(o.base*2+.01)));});return o;}
function fade(o,to,ms,cb){var from=o.v;var t0=performance.now();upd.push(function(t){var k=clamp((t-t0)/(reduceM?1:ms||1200),0,1);o.v=lerp(from,to,ease(k));if(cb)cb(o.v);return k>=1;});}

/* ---- Adegan ---- */
var SCN={};
/* Gua Hira: Jabal Nur dari data ketinggian, malam Ramadhan, cahaya kecil di gua, Makkah di kejauhan */
SCN.hira=function(done){
  loadDem("makkah",function(D){
    var c=PL.hr,L=local(c[0],c[1],2600),base=demAt(D,c[0],c[1])-260;
    function h(x,z){var q=L.ll(x,z),e=(demAt(D,q.lat,q.lon)-base)*.034;return Math.max(e,0)+fbm(x*.12,z*.12,3)*.9;}
    var pal=ramp([[0,"#d9c29a"],[.25,"#c4a276"],[.55,"#9d7a55"],[.8,"#7d5f45"],[1,"#5f4a3a"]]);
    ground(260,170,h,function(x,z,y){return pal(y/14);});
    var mk=L.xz(PL.mk[0],PL.mk[1]),cave={x:0,z:0,y:-1e9};
    for(var gx=-6;gx<=6;gx+=.5)for(var gz=-6;gz<=6;gz+=.5){var yy=h(gx,gz);if(yy>cave.y){cave={x:gx,z:gz,y:yy};}}cave.y+=.5;
    houses(mk.x,mk.z,10,260,h,11,function(x,z){return Math.hypot(x-mk.x,z-mk.z)<2.2;});
    kaabah(mk.x,h(mk.x,mk.z),mk.z,.7);
    var town=glow(mk.x,h(mk.x,mk.z)+2,mk.z,"#ffcf8a",1.6,50,9);
    var g=glow(cave.x,cave.y,cave.z,"#ffd9a0",2.2,22,1.6);clutter(h,200,380,29,"#6f6a4a");
    upd.push(function(t){g.l.intensity=g.base*(.85+Math.sin(t/900)*.15);});
    done({
      sky:"night",
      shots:{
        wide:{p:[cave.x+(mk.x-cave.x)*.55,h(cave.x+(mk.x-cave.x)*.55,cave.z+(mk.z-cave.z)*.55)+5,cave.z+(mk.z-cave.z)*.55],l:[cave.x,cave.y-2,cave.z]},
        cave:{p:[cave.x+9,cave.y+3,cave.z+10],l:[cave.x,cave.y-.5,cave.z]},
        sky:{p:[cave.x+14,cave.y+2,cave.z+18],l:[cave.x-20,cave.y+4,cave.z-30]},
        town:{p:[cave.x+3,cave.y+4,cave.z+4],l:[mk.x,h(mk.x,mk.z),mk.z]}
      },
      spots:{gua:[cave.x,cave.y+1.2,cave.z],makkah:[mk.x,h(mk.x,mk.z)+2.5,mk.z]},
      fx:{glowUp:function(){fade({v:g.base},6,1500,function(v){g.base=v;});},glowDown:function(){fade({v:g.base},2.2,1500,function(v){g.base=v;});}}
    });
  });
};
/* Badr: lembah berpasir, sumur-sumur, kolam, tenda komando di tempat tinggi, panji kedua pihak */
SCN.badr=function(done){
  function h(x,z){var d=fbm(x*.03,z*.03,4)*4.2-1.4;var ridgeS=Math.max(0,1-Math.abs(z+48)/16)*7,ridgeN=Math.max(0,1-Math.abs(z-46)/14)*4;
    var side=Math.max(0,(Math.abs(x)-55)/20)*6;return d+ridgeS*(.7+fbm(x*.05,3)*.6)+ridgeN*(.6+fbm(x*.06,9)*.5)+side;}
  var pal=ramp([[0,"#ecd8ad"],[.35,"#e2c592"],[.6,"#d0ad78"],[1,"#b48d5e"]]);
  ground(320,150,h,function(x,z,y){return pal((y+1)/9+fbm(x*.2,z*.2,2)*.15);});
  var W=[[-6,8],[2,6],[9,10],[-14,12],[16,15]],WG=W.map(function(w){return well(w[0],h(w[0],w[1]),w[1]);});
  var water=pool(-3,h(-3,14),14,5,3);water.visible=false;
  var cmd={x:24,z:30};cmd.y=h(cmd.x,cmd.z);tents([{x:cmd.x,y:cmd.y,z:cmd.z,s:1.7,h:1.5}],"#f3ead7");
  var mus=[],qur=[];
  for(var i=0;i<3;i++)mus.push({x:-8+i*7,y:0,z:20+(i%2)*2,r:0});
  for(i=0;i<10;i++)qur.push({x:-30+i*6.6,y:0,z:-44+(i%3)*2.4,r:Math.PI});
  mus.forEach(function(p){p.y=h(p.x,p.z);});qur.forEach(function(p){p.y=h(p.x,p.z);});
  var M=banners(mus,"#2f9a6e"),Q=banners(qur,"#c4472d");
  clutter(h,240,520,23,null,function(x,z){return Math.abs(z-15)<14&&Math.abs(x)<22;});ringHills(150,14,18,34,"#c09868",61);
  var qt=[];for(i=0;i<16;i++){var x=-36+i*4.6,z=-56-(i%3)*3;qt.push({x:x,y:h(x,z),z:z,s:1.3,h:1});}tents(qt,"#e6d3b3");
  var mt=[{x:-12,z:26},{x:-4,z:28},{x:6,z:27},{x:14,z:25}].map(function(p){p.y=h(p.x,p.z);return p;});tents(mt,"#f1e7d2");
  /* kafilah: deretan muatan bergerak di kejauhan (abstrak, tanpa makhluk) */
  var car=[],cg=new T.BoxGeometry(1.8,1.3,1.2);cg.translate(0,.65,0);var cm=std("#8a6a45");
  for(i=0;i<14;i++){var b=new T.Mesh(cg,cm);scene.add(b);car.push(b);}
  var carOn={v:0};upd.push(function(t){car.forEach(function(b,k){var s=((t/14000+k*.03)%1),x=lerp(-120,60,s),z=lerp(-78,-96,s);b.visible=carOn.v>.5;b.position.set(x,h(x,z)+Math.abs(Math.sin(t/300+k))*.05,z);});});
  var rain=particles(1800,.3,"#e4f0f8",.85,function(i,first){return {x:(Math.random()-.5)*120,y:first?Math.random()*40:40,z:(Math.random()-.5)*100+10};},function(p,dt){p.y-=dt*.045;if(p.y<h(p.x,p.z))p.dead=1;});
  var dust=particles(700,.5,"#d9bf8f",.45,function(){return {x:(Math.random()-.5)*110,y:Math.random()*6,z:(Math.random()-.5)*60-8,vx:.004+Math.random()*.006};},function(p,dt){p.x+=dt*p.vx;p.y+=dt*.0006;if(p.x>60||p.y>9)p.dead=1;});
  var sand=particles(500,.32,"#e8cf9b",.8,function(){return {x:-2+(Math.random()-.5)*6,y:2+Math.random()*2,z:16+(Math.random()-.5)*4,vz:-.03-Math.random()*.02,vx:(Math.random()-.5)*.01};},function(p,dt){p.z+=dt*p.vz;p.x+=dt*p.vx;p.y+=dt*.0005;if(p.z<-50)p.dead=1;});
  function march(list,toZ,ms){list.forEach(function(it){var z0=it.g.position.z,t0=performance.now();upd.push(function(t){var k=clamp((t-t0)/(reduceM?1:ms),0,1),z=lerp(z0,toZ,ease(k));it.g.position.z=z;it.g.position.y=h(it.g.position.x,z);return k>=1;});});}
  done({
    sky:"day",
    shots:{
      route:{p:[-6,17,-44],l:[-24,0,-84]},
      mus:{p:[10,9,44],l:[0,2,18]},
      qur:{p:[-6,12,-12],l:[0,3,-48]},
      wells:{p:[-2,7,26],l:[2,0,9]},
      cmd:{p:[34,8,42],l:[cmd.x,cmd.y+1,cmd.z]},
      field:{p:[30,15,16],l:[0,2,-12]},
      after:{p:[-22,10,-2],l:[0,1,-30]},
      kolamAksi:fitShot(W.map(function(w){return [w[0],h(w[0],w[1])+1,w[1]];}).concat([[-3,h(-3,14)+1,14]]),1.2),
      overview:fitShot([[-3,h(-3,14),14],[cmd.x,cmd.y,cmd.z],[-1,h(-1,21),21],[0,h(0,-43),-43],[-20,h(-20,-48),-48]])
    },
    spots:{kolam:[-3,h(-3,14)+1,14],cmd:[cmd.x,cmd.y+2.4,cmd.z],mus:[-1,h(-1,21)+5,21],qur:[0,h(0,-43)+5,-43],bukit:[-20,h(-20,-48)+2,-48]},
    aksi:{kolam:function(A){
      water.visible=false;var left=4;
      [0,2,3,4].forEach(function(ix){var g=WG[ix],w=W[ix];A.target([w[0],h(w[0],w[1])+1.2,w[1]],"Timbun",function(){
        g.children[1].visible=false;g.children[0].scale.y=.25;var mnd=new T.Mesh(new T.SphereGeometry(.9,10,6,0,Math.PI*2,0,Math.PI/2),std("#d9bf8f"));mnd.position.set(w[0],h(w[0],w[1]),w[1]);scene.add(mnd);
        if(--left===0)A.target([-3,h(-3,14)+1.2,14],"Isi kolam",function(){water.visible=true;var y0=water.position.y-.35,t0=performance.now();water.position.y=y0;
          upd.push(function(t){var k=clamp((t-t0)/(reduceM?1:1200),0,1);water.position.y=y0+.35*ease(k);return k>=1;});A.done();});
      });});
    },kolamFinish:function(){water.visible=true;}},
    fx:{
      caravan:function(){carOn.v=1;},noCaravan:function(){carOn.v=0;},
      rain:function(){fade(rain,1,800);},dry:function(){fade(rain,0,1200);},
      battle:function(){fade(dust,1,1000);march(M,6,3500);march(Q,-14,3500);},
      sand:function(){fade(sand,1,600);setTimeout(function(){fade(sand,0,1500);},2600);},
      fall:function(){fade(dust,.35,2000);Q.forEach(function(it,k){var t0=performance.now()+k*120;upd.push(function(t){var kk=clamp((t-t0)/(reduceM?1:900),0,1);it.fall=ease(kk);return kk>=1;});});}
    }
  });
};
/* Kota Makkah umum: lembah dengan rumah, Ka'bah di dasar lembah, pegunungan di sekeliling */
SCN.makkah=function(done){
  loadDem("makkah",function(D){
    var c=PL.mk,L=local(c[0],c[1],2600),base=demAt(D,c[0],c[1])-8;
    function h(x,z){var q=L.ll(x,z);return Math.max((demAt(D,q.lat,q.lon)-base)*.024,0)+fbm(x*.12,z*.12,3)*.7;}
    var pal=ramp([[0,"#e6d2ab"],[.25,"#cfb084"],[.55,"#a98460"],[1,"#6f5640"]]);
    ground(240,160,h,function(x,z,y){return pal(y/12);});
    houses(0,0,22,520,h,21,function(x,z){return Math.hypot(x,z)<3.6||h(x,z)>3.2;});clutter(h,200,300,31,null,function(x,z){return Math.hypot(x,z)<24;});
    kaabah(0,h(0,0),0,.9);
    done({sky:"dusk",shots:{a:{p:[-16,14,26],l:[0,1,0]},b:{p:[22,10,14],l:[0,1,0]},c:{p:[6,30,40],l:[0,0,-8]},d:{p:[-26,8,-6],l:[0,1,0]}}});
  });
};
/* Kota Madinah umum: kebun kurma, rumah, Uhud di utara */
SCN.madinah=function(done){
  loadDem("madinah",function(D){
    var c=PL.md,L=local(c[0],c[1],1800),base=demAt(D,c[0],c[1])-10;
    function h(x,z){var q=L.ll(x,z);return Math.max((demAt(D,q.lat,q.lon)-base)*.03,-.5)+fbm(x*.1,z*.1,3)*.6;}
    var pal=ramp([[0,"#e3d0a6"],[.2,"#d2b88a"],[.5,"#8f6e52"],[1,"#5c4636"]]);
    ground(260,160,h,function(x,z,y){var g=fbm(x*.08,z*.08,3);var col=pal(y/16);if(y<2&&g>.55)col.lerp(C("#7f9a5a"),.55);return col;});
    houses(0,0,12,260,h,31,function(x,z){return Math.hypot(x,z)<2.5;});
    var r=seeded(17),P=[];for(var i=0;i<260;i++){var x=(r()-.5)*90,z=(r()-.5)*70+8;if(Math.hypot(x,z)<14)continue;var y=h(x,z);if(y<2&&fbm(x*.08,z*.08,3)>.5)P.push({x:x,y:y,z:z});}
    palms(P,17);
    var uh=L.xz(PL.uh[0],PL.uh[1]);
    var m=new T.Mesh(new T.BoxGeometry(3.2,.4,2.6),std("#efe6d2"));m.position.set(0,h(0,0)+.2,0);scene.add(m);
    done({sky:"day",shots:{a:{p:[-14,12,22],l:[0,1,0]},b:{p:[10,16,30],l:[uh.x,3,uh.z]},c:{p:[24,9,6],l:[0,1,0]},d:{p:[-30,20,-10],l:[0,0,10]}}});
  });
};
/* Tempat lain (sementara, generik): palet dan ciri sesuai buku/geografi umum */
var PLACE={
  th:{sky:"day",pal:[[0,"#c8b58a"],[.4,"#8f9a62"],[.7,"#6f7c4c"],[1,"#5a5844"]],relief:14,green:.5,houses:120,walls:1},
  hd:{sky:"day",pal:[[0,"#ead6ad"],[.6,"#cfae7e"],[1,"#a78360"]],relief:4,tree:1,tents:16,wells:2},
  kh:{sky:"day",pal:[[0,"#d8c6a0"],[.5,"#a88a6a"],[1,"#5f4c40"]],relief:6,palms:220,forts:4},
  mu:{sky:"dusk",pal:[[0,"#cdbb8f"],[.5,"#a6a06a"],[1,"#7a7458"]],relief:10,banners:14},
  hu:{sky:"dawn",pal:[[0,"#cdb184"],[.5,"#9e7f5c"],[1,"#5d4a3c"]],relief:16,valley:1,banners:8},
  uh:{sky:"day",pal:[[0,"#dcc59a"],[.5,"#9b6e4e"],[1,"#5e3f33"]],relief:18,banners:6}
};
SCN.place=function(done,k){
  var P=PLACE[k]||PLACE.hd,pal=ramp(P.pal);
  function h(x,z){var v=fbm(x*.025,z*.025,5);var y=Math.pow(v,1.6)*P.relief;if(P.valley)y+=Math.min(12,Math.abs(x)*.25);return y-Math.max(0,1-Math.hypot(x,z)/30)*P.relief*.25;}
  ground(300,150,h,function(x,z,y){var col=pal(y/P.relief);if(P.green&&fbm(x*.1,z*.1,2)>.55)col.lerp(C("#6e8f48"),P.green);return col;});
  var r=seeded(41),i;clutter(h,240,420,43,P.green?"#5f7f3c":null);ringHills(160,12,16,30,P.pal[P.pal.length-1][1],71);
  if(P.houses)houses(0,0,16,P.houses,h,43);
  if(P.walls){var wg=new T.Group();for(i=0;i<28;i++){var a=i/28*Math.PI*2,x=Math.cos(a)*18,z=Math.sin(a)*14;var b=new T.Mesh(new T.BoxGeometry(4.2,1.4,.5),std("#a89170"));b.position.set(x,h(x,z)+.6,z);b.rotation.y=-a+Math.PI/2;wg.add(b);}scene.add(wg);}
  if(P.tree)bigTree(4,h(4,-2),-2);
  if(P.tents){var tl=[];for(i=0;i<P.tents;i++){var tx=(r()-.5)*50,tz=10+r()*25;tl.push({x:tx,y:h(tx,tz),z:tz});}tents(tl,"#efe4cc");}
  if(P.wells)for(i=0;i<P.wells;i++)well(-6+i*9,h(-6+i*9,4),4);
  if(P.palms){var pl=[];for(i=0;i<P.palms;i++){var px=(r()-.5)*110,pz=(r()-.5)*90;if(fbm(px*.06,pz*.06,2)>.48)pl.push({x:px,y:h(px,pz),z:pz});}palms(pl,47);}
  if(P.forts)for(i=0;i<P.forts;i++){var fx=-24+i*16,fz=-14+(i%2)*10;fort(fx,h(fx,fz),fz,4.5);}
  if(P.banners){var bl=[];for(i=0;i<P.banners;i++){var bx=-26+i*(52/P.banners),bz=-12+(i%2)*3;bl.push({x:bx,y:h(bx,bz),z:bz,r:Math.PI});}banners(bl,"#8a6f4a");}
  done({sky:P.sky,shots:{a:{p:[-18,16,34],l:[0,2,0]},b:{p:[26,12,20],l:[0,2,-4]},c:{p:[0,34,46],l:[0,0,-6]},d:{p:[-30,10,-6],l:[0,2,0]}}});
};
/* ---- Zona: beberapa lokasi dalam satu adegan, berjauhan (kabut menyembunyikan yang lain); kamera "potong" antar zona ---- */
var PAL_MK=ramp([[0,"#e6d2ab"],[.25,"#cfb084"],[.55,"#a98460"],[1,"#6f5640"]]),
    PAL_MD=ramp([[0,"#e3d0a6"],[.2,"#d2b88a"],[.5,"#8f6e52"],[1,"#5c4636"]]);
function need(keys,cb){var n=keys.length;if(!n)return cb();keys.forEach(function(k){loadDem(k,function(){if(--n===0)cb();});});}
function demZone(key,ll,U,ex,ox,oz,o){
  o=o||{};var D=DEM[key],L=local(ll[0],ll[1],U),base=demAt(D,ll[0],ll[1])-(o.floor||8),size=o.size||260,pal=o.pal||(key==="madinah"?PAL_MD:PAL_MK),norm=o.norm||12;
  function hl(x,z){var q=L.ll(x,z);return Math.max((demAt(D,q.lat,q.lon)-base)*ex,0)+fbm(x*.12,z*.12,3)*.7;}
  var m=ground(size,o.seg||150,hl,function(x,z,y){var c=pal(y/norm);if(o.green&&y<2&&fbm(x*.08,z*.08,3)>.55)c.lerp(C("#7f9a5a"),.55);return c;});m.position.set(ox,0,oz);
  return {h:function(x,z){return hl(x-ox,z-oz);},P:function(lat,lon){var p=L.xz(lat,lon);return {x:p.x+ox,z:p.z+oz};},ox:ox,oz:oz};
}
function procZone(ox,oz,o){
  var pal=ramp(o.pal||[[0,"#ecd8ad"],[.5,"#d6b583"],[1,"#a98460"]]),R=o.relief||6;
  function hl(x,z){var y=Math.pow(fbm(x*.025+ox*.001,z*.025,5),1.6)*R;
    if(o.valley)y+=Math.min(18,Math.pow(Math.abs(x)*.11,1.6));
    if(o.sea)y=y*.4+(x*.06)-1.5;
    return y;}
  var m=ground(o.size||300,o.seg||140,hl,function(x,z,y){if(o.sea&&y<.3)return C("#d9c9a4").lerp(C("#b7a77f"),clamp(-y/3,0,1));var c=pal(y/(R+(o.valley?14:0)));if(o.green&&fbm(x*.1,z*.1,2)>.5)c.lerp(C("#6e8f48"),o.green);return c;});
  m.position.set(ox,0,oz);
  if(o.sea){var s=new T.Mesh(new T.PlaneGeometry(o.size||300,o.size||300),new T.MeshStandardMaterial({color:"#3f8fb0",roughness:.25,metalness:.05,transparent:true,opacity:.88}));
    s.rotation.x=-Math.PI/2;s.position.set(ox,0,oz);scene.add(s);upd.push(function(t){s.position.y=Math.sin(t/900)*.05;});}
  return {h:function(x,z){return Math.max(hl(x-ox,z-oz),o.sea?0:-99);},ox:ox,oz:oz};
}
/* kamera: titik (x,z) dilihat dari offset (dx,dy,dz); tinggi kamera selalu di atas tanah */
function shotAt(h,x,z,dx,dy,dz,up){var px=x+dx,pz=z+dz;return {p:[px,Math.max(h(px,pz),h(x,z))+dy,pz],l:[x,h(x,z)+(up||1),z]};}
/* sudut kamera yang memuat semua titik (untuk langkah jelajah/aksi) */
function fitShot(pts,tilt){var x0=1e9,x1=-1e9,z0=1e9,z1=-1e9,y=0;pts.forEach(function(p){x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);z0=Math.min(z0,p[2]);z1=Math.max(z1,p[2]);y=Math.max(y,p[1]);});
  return {pts:pts,dir:[.1,tilt||1.15,.7]};}
/* hitung sudut nyata saat dipakai: mundur sampai semua titik masuk area layar di atas kotak dialog */
var fitCam=null;
function autoFit(pts,dir){
  fitCam=fitCam||new T.PerspectiveCamera();fitCam.copy(cam);
  var c=[0,0,0];pts.forEach(function(p){c[0]+=p[0]/pts.length;c[1]+=p[1]/pts.length;c[2]+=p[2]/pts.length;});c[1]*=.6;
  var dv=new T.Vector3(dir[0],dir[1],dir[2]).normalize(),L=V(c),v=new T.Vector3(),H=host.clientHeight||1,
      dl=el.querySelector(".stdlg"),yMin=dl?1-2*Math.max(0,dl.getBoundingClientRect().top-host.getBoundingClientRect().top)/H+.14:-.85,D=12;
  for(var k=0;k<60;k++,D*=1.09){fitCam.position.copy(L).addScaledVector(dv,D);fitCam.lookAt(L);fitCam.updateMatrixWorld();
    var ok=pts.every(function(p){v.set(p[0],p[1],p[2]).project(fitCam);return v.z<1&&Math.abs(v.x)<.82&&v.y<.78&&v.y>yMin;});if(ok)break;}
  var P=L.clone().addScaledVector(dv,D);return {p:[P.x,P.y,P.z],l:c};}
function shotOf(sh,b){if(!sh)return sh;if(sh.pts)return autoFit(sh.pts,sh.dir);if(b&&(b.k==="jelajah"||b.k==="aksi"))return wideShot(sh);return sh;}
function highest(h,cx,cz,r){var b={x:cx,z:cz,y:-1e9};for(var x=-r;x<=r;x+=r/12)for(var z=-r;z<=r;z+=r/12){var y=h(cx+x,cz+z);if(y>b.y)b={x:cx+x,z:cz+z,y:y};}return b;}
/* ---- Kit tambahan ---- */
function lamps(list,col,size){
  var a=new Float32Array(list.length*3);list.forEach(function(p,i){a[i*3]=p.x;a[i*3+1]=p.y;a[i*3+2]=p.z;});
  var g=new T.BufferGeometry();g.setAttribute("position",new T.BufferAttribute(a,3));
  var m=new T.Points(g,new T.PointsMaterial({map:halo(),color:col||"#ffc677",size:size||1.6,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));scene.add(m);
  upd.push(function(t){m.material.opacity=.85+Math.sin(t/430)*.12;});return m;
}
function townLamps(h,cx,cz,rad,n,seed){var r=seeded(seed||5),L=[];for(var i=0;i<n;i++){var a=r()*Math.PI*2,d=Math.sqrt(r())*rad,x=cx+Math.cos(a)*d,z=cz+Math.sin(a)*d*.8;L.push({x:x,y:h(x,z)+.7,z:z});}return lamps(L,"#ffc677",1.3);}
/* tugu batu kecil melingkari Ka'bah: lambang berhala (bisa runtuh) */
function idols(h,cx,cz,rad,n){
  var items=[],g=new T.CylinderGeometry(.16,.2,1,6);g.translate(0,.5,0);var m=std("#8d8578");
  for(var i=0;i<n;i++){var a=i/n*Math.PI*2,x=cx+Math.cos(a)*rad,z=cz+Math.sin(a)*rad,o=new T.Mesh(g,m);o.position.set(x,h(x,z),z);o.scale.y=.7+((i*7)%5)*.12;o.castShadow=true;scene.add(o);items.push({o:o,a:a});}
  return {fall:function(){items.forEach(function(it,k){var t0=performance.now()+k*90;upd.push(function(t){var kk=clamp((t-t0)/(reduceM?1:700),0,1);it.o.rotation.set(Math.sin(it.a)*ease(kk)*1.5,0,-Math.cos(it.a)*ease(kk)*1.5);return kk>=1;});});}};
}
function nadwah(x,y,z){var b=new T.Mesh(new T.BoxGeometry(3,1.2,2.2),std("#d8c49c"));b.position.set(x,y+.6,z);b.castShadow=b.receiveShadow=true;scene.add(b);}
function scrollOn(x,y,z){var s=new T.Mesh(new T.CylinderGeometry(.08,.08,.5,8),std("#f3ecd8"));s.rotation.z=Math.PI/2;s.position.set(x,y,z);scene.add(s);}
function boats(list,moving){
  var items=[];list.forEach(function(p,k){var g=new T.Group();
    var hull=new T.Mesh(new T.BoxGeometry(3,.6,1.1),std("#7a5434"));hull.position.y=.2;g.add(hull);
    var mast=new T.Mesh(new T.CylinderGeometry(.05,.05,2.6,5),std("#5b4632"));mast.position.y=1.5;g.add(mast);
    var sh=new T.Shape();sh.moveTo(0,0);sh.lineTo(0,2);sh.lineTo(1.3,0);sh.lineTo(0,0);
    var sail=new T.Mesh(new T.ShapeGeometry(sh),new T.MeshStandardMaterial({color:"#f2ead6",side:T.DoubleSide,roughness:.8}));sail.position.set(.05,.45,0);g.add(sail);
    g.position.set(p.x,0,p.z);g.rotation.y=p.r||0;scene.add(g);items.push({g:g,x0:p.x,k:k,go:0});});
  upd.push(function(t,dt){items.forEach(function(it){it.g.position.y=Math.sin(t/700+it.k)*.12;it.g.rotation.z=Math.sin(t/900+it.k)*.04;
    if(moving.v)it.g.position.x=it.x0+((t/120+it.k*30)%160)-20;else if(it.go)it.g.position.x=Math.max(it.g.position.x-dt*.012,it.x0-90);});});
  return items;
}
function trench(h,pts){
  var m=std("#5a4632"),mm=std("#c9ad80"),segs=[];
  for(var i=0;i<pts.length-1;i++){var a=pts[i],b=pts[i+1],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz),mx=(a.x+b.x)/2,mz=(a.z+b.z)/2,ang=Math.atan2(dx,dz);
    var t=new T.Mesh(new T.BoxGeometry(1.6,.5,len),m);t.position.set(mx,h(mx,mz)-.15,mz);t.rotation.y=ang;t.receiveShadow=true;scene.add(t);
    var d=new T.Mesh(new T.BoxGeometry(.9,.45,len),mm);d.position.set(mx-Math.cos(ang)*1.4,h(mx,mz)+.15,mz+Math.sin(ang)*1.4);d.rotation.y=ang;d.castShadow=true;scene.add(d);
    segs.push({t:t,d:d,x:mx,z:mz,y:h(mx,mz)});}
  return segs;
}
function tentField(h,cx,cz,w,d,n,seed,col){var r=seeded(seed||9),L=[];for(var i=0;i<n;i++){var x=cx+(r()-.5)*w,z=cz+(r()-.5)*d;L.push({x:x,y:h(x,z),z:z,s:.9+r()*.6,h:.8+r()*.5});}return tents(L,col||"#f3ecdc");}
function vineyard(h,cx,cz,rows,len){var L=[];for(var r=0;r<rows;r++)for(var k=0;k<len;k++){var x=cx+k*1.2-len*.6,z=cz+r*2.2;L.push({x:x,y:h(x,z),z:z,s:[1,.7,.8],c:["#5f8a3f","#6d9845","#567d38"][(r+k)%3]});}
  var g=new T.SphereGeometry(.55,6,4);g.translate(0,.4,0);inst(g,std("#fff",{r:1}),L);}
function walls(h,cx,cz,rx,rz,col){for(var i=0;i<30;i++){var a=i/30*Math.PI*2,x=cx+Math.cos(a)*rx,z=cz+Math.sin(a)*rz;var b=new T.Mesh(new T.BoxGeometry(rx*.23,1.6,.6),std(col||"#a89170"));b.position.set(x,h(x,z)+.6,z);b.rotation.y=-a+Math.PI/2;b.castShadow=true;scene.add(b);}}
function hijrRocks(h,cx,cz){var r=seeded(77);for(var i=0;i<10;i++){var x=cx+(r()-.5)*70,z=cz+(r()-.5)*44,rr=3+r()*4,hh=7+r()*9;
  var m=hill(x,z,rr,hh,"#b9774f",80+i);m.position.y=h(x,z)-.4;
  var dr=new T.Mesh(new T.PlaneGeometry(.9,1.5),new T.MeshBasicMaterial({color:"#3b2418"}));dr.position.set(x,h(x,z)+1.1,z+rr*.85);scene.add(dr);}}
function masjidBuild(h,x,z){
  var g=new T.Group(),y=h(x,z),wm=std("#cdb48c"),parts={walls:[],cols:[],roof:null};
  [[0,-4,9,.6],[0,4,9,.6],[-4.5,0,.6,8],[4.5,0,.6,8]].forEach(function(w,i){var b=new T.Mesh(new T.BoxGeometry(w[2],i%2?1.4:1.6,w[3]),wm);b.position.set(w[0],.75,w[1]);b.castShadow=b.receiveShadow=true;g.add(b);parts.walls.push(b);});
  for(var cx=-3;cx<=3;cx+=2)for(var cz=-3;cz<=-1;cz+=2){var c=new T.Mesh(new T.CylinderGeometry(.12,.14,2.4,6),std("#7a5a3a"));c.position.set(cx,1.2,cz);c.castShadow=true;g.add(c);parts.cols.push(c);}
  var roof=new T.Mesh(new T.BoxGeometry(8.2,.15,3.4),std("#8a9a5a"));roof.position.set(0,2.45,-2.2);roof.castShadow=true;g.add(roof);parts.roof=roof;
  var bricks=[];for(var i=0;i<14;i++)bricks.push({x:x+5.5+(i%4)*.5,y:y,z:z+2+Math.floor(i/4)*.45,s:[.45,.25,.3],c:"#c7a678"});
  var bg=new T.BoxGeometry(1,1,1);bg.translate(0,.5,0);inst(bg,std("#fff"),bricks);
  g.position.set(x,y,z);scene.add(g);return parts;
}
function awnings(h,cx,cz,n){var r=seeded(31),cols=["#b5543a","#d8a24a","#3f7a6a","#e9dcc2","#8a5a8a"];for(var i=0;i<n;i++){var x=cx+(i%5)*3.2-6,z=cz+Math.floor(i/5)*3.6;
  var g=new T.Group(),top=new T.Mesh(new T.BoxGeometry(2.4,.12,2),std(cols[i%5]));top.position.y=1.6;g.add(top);
  [[-1,-.8],[1,-.8],[-1,.8],[1,.8]].forEach(function(q){var p=new T.Mesh(new T.CylinderGeometry(.05,.05,1.6,4),std("#6b4e33"));p.position.set(q[0],.8,q[1]);g.add(p);});
  var bx=new T.Mesh(new T.BoxGeometry(1.4,.5,.9),std("#a4855c"));bx.position.y=.25;g.add(bx);g.position.set(x,h(x,z),z);g.rotation.y=(r()-.5)*.3;g.traverse(function(o){o.castShadow=true;});scene.add(g);}}
function caravanLine(h,x0,z0,x1,z1,n,speed){
  var car=[],cg=new T.BoxGeometry(1.8,1.3,1.2);cg.translate(0,.65,0);var cm=std("#8a6a45"),on={v:1};
  for(var i=0;i<n;i++){var b=new T.Mesh(cg,cm);b.castShadow=true;scene.add(b);car.push(b);}
  var ang=Math.atan2(x1-x0,z1-z0);
  upd.push(function(t){car.forEach(function(b,k){var s=((t/(speed||16000)+k/n)%1),x=lerp(x0,x1,s),z=lerp(z0,z1,s);b.visible=on.v>.5;b.rotation.y=ang;b.position.set(x,h(x,z)+Math.abs(Math.sin(t/300+k))*.05,z);});});
  return on;
}
function marchTo(h,items,tx,tz,ms){items.forEach(function(it){var x0=it.g.position.x,z0=it.g.position.z,t0=performance.now();upd.push(function(t){var k=clamp((t-t0)/(reduceM?1:ms),0,1),e=ease(k),x=lerp(x0,x0+(tx-x0)*.55,e),z=lerp(z0,z0+(tz-z0)*.55,e);it.g.position.set(x,h(x,z),z);return k>=1;});});}
function rankBanners(h,cx,cz,cols,rows,gap,rot,col){var L=[];for(var r=0;r<rows;r++)for(var c=0;c<cols;c++){var x=cx+(c-(cols-1)/2)*gap+(r%2)*gap*.5,z=cz+r*gap*.8*(rot?-1:1);L.push({x:x,y:h(x,z),z:z,r:rot||0,h:3.6});}return banners(L,col);}
/* partikel khusus */
function dustAt(cx,cz,w,strong){return particles(strong?1100:600,strong?.6:.5,"#d9bf8f",strong?.6:.45,function(){return {x:cx+(Math.random()-.5)*w,y:Math.random()*(strong?10:6),z:cz+(Math.random()-.5)*w*.6,vx:(strong?.02:.005)+Math.random()*.008};},function(p,dt){p.x+=dt*p.vx;p.y+=dt*.0006;if(p.x>cx+w/2||p.y>12)p.dead=1;});}
function arrowsAt(cx,cz){return particles(260,.22,"#2a2118",.95,function(){var s=Math.random()<.5?-1:1;return {x:cx+s*(22+Math.random()*6),y:8+Math.random()*4,z:cz+(Math.random()-.5)*30,vx:-s*(.05+Math.random()*.02),vy:-.006};},function(p,dt){p.x+=dt*p.vx;p.y+=dt*p.vy;if(Math.abs(p.x-cx)<2||p.y<0)p.dead=1;});}
function flockAt(cx,cz){return particles(220,.5,"#2b2620",.9,function(i){return {x:cx-60+Math.random()*12,y:22+Math.random()*6,z:cz-10+(Math.random()-.5)*14,vx:.025+Math.random()*.008,ph:Math.random()*6};},function(p,dt){p.x+=dt*p.vx;p.y+=Math.sin(performance.now()/300+p.ph)*.01;if(p.x>cx+60)p.dead=1;});}
function stonesAt(cx,cz){return particles(240,.25,"#4a3c30",.95,function(){return {x:cx+(Math.random()-.5)*40,y:20+Math.random()*6,z:cz+(Math.random()-.5)*20};},function(p,dt){p.y-=dt*.03;if(p.y<0)p.dead=1;});}
function scrollsFrom(cx,cy,cz){return particles(40,.7,"#fff6dc",1,function(){var a=Math.random()*Math.PI*2;return {x:cx,y:cy,z:cz,vx:Math.cos(a)*.012,vz:Math.sin(a)*.012};},function(p,dt){p.x+=dt*p.vx;p.z+=dt*p.vz;p.y+=dt*.004;if(p.y>cy+16)p.dead=1;},true);}
function grow(o,ms){o.visible=true;var t0=performance.now(),s0=o.scale.y||1;o.scale.y=.01;upd.push(function(t){var k=clamp((t-t0)/(reduceM?1:ms||700),0,1);o.scale.y=Math.max(.01,ease(k))*s0;return k>=1;});}
function on(o){fade(o,1,900);}function off(o){fade(o,0,900);}
function only(map,key){Object.keys(map).forEach(function(k){if(k!==key&&map[k].v>0)off(map[k]);});if(map[key])on(map[key]);}

/* ---- Adegan per stasiun (kunci shot sesuai kisah) ---- */
SCN.s0=function(done){need(["makkah"],function(){
  var A=procZone(0,0,{relief:7}),B=demZone("makkah",PL.mk,2600,.024,700,0),mk=B.P(PL.mk[0],PL.mk[1]),hA=A.h,hB=B.h;
  tentField(hA,34,-30,26,14,14,3,"#e8dcc4");clutter(hA,240,300,5);caravanLine(hA,-90,8,90,14,12);
  houses(mk.x,mk.z,22,420,hB,21,function(x,z){return Math.hypot(x-mk.x,z-mk.z)<4.4||hB(x,z)>3.2;});kaabah(mk.x,hB(mk.x,mk.z),mk.z,.9);
  idols(hB,mk.x,mk.z,2.6,18);nadwah(mk.x,hB(mk.x,mk.z-6),mk.z-6);
  done({sky:"day",shots:{gurun:shotAt(hA,34,-30,-44,14,56,2),kafilah:shotAt(hA,0,10,16,5,20,1),kabah:shotAt(hB,mk.x,mk.z,9,5,11,1),kota:shotAt(hB,mk.x,mk.z,-30,20,40,0)}});
});};
SCN.s1=function(done){need(["makkah"],function(){
  var A=demZone("makkah",PL.mk,2600,.024,0,0),mk=A.P(PL.mk[0],PL.mk[1]),h=A.h,B=procZone(700,0,{relief:5,green:.25}),C=procZone(-700,0,{relief:7});
  houses(mk.x,mk.z,22,420,h,21,function(x,z){return Math.hypot(x-mk.x,z-mk.z)<3.6||h(x,z)>3.2;});kaabah(mk.x,h(mk.x,mk.z),mk.z,.9);
  tentField(B.h,700,-10,40,24,18,7,"#e2d2b4");clutter(B.h,220,260,9,"#7d8a50");caravanLine(C.h,-790,0,-610,10,18,30000);clutter(C.h,220,200,11);
  var ab={x:mk.x+40,z:mk.z},F={fl:flockAt(ab.x,ab.z),st:stonesAt(ab.x+10,ab.z)};
  done({sky:"day",shots:{abrahah:shotAt(h,ab.x,ab.z,-30,10,26,6),kota:shotAt(h,mk.x,mk.z,-28,18,36,0),badiyah:shotAt(B.h,700,-10,-16,6,22,1),kafilah:shotAt(C.h,-700,5,14,6,20,1),kabah:shotAt(h,mk.x,mk.z,9,5,11,1)},
    onShot:{abrahah:function(){on(F.fl);setTimeout(function(){on(F.st);},1400);},"*":function(){off(F.fl);off(F.st);}}});
});};
SCN.s2=function(done){SCN.hira(done);};
SCN.s3=function(done){need(["makkah"],function(){
  var A=demZone("makkah",PL.mk,2600,.024,0,0),mk=A.P(PL.mk[0],PL.mk[1]),h=A.h;
  houses(mk.x,mk.z,22,420,h,21,function(x,z){return Math.hypot(x-mk.x,z-mk.z)<3.6||h(x,z)>3.2;});kaabah(mk.x,h(mk.x,mk.z),mk.z,.9);
  townLamps(h,mk.x,mk.z,18,70,3);var rm={x:mk.x+6,z:mk.z-9};var g=glow(rm.x,h(rm.x,rm.z)+1.2,rm.z,"#ffcf8a",2.4,16,2.2);
  done({sky:"night",shots:{kota_malam:shotAt(h,mk.x,mk.z,-26,16,30,0),rumah:shotAt(h,rm.x,rm.z,8,4,9,1),kabah:shotAt(h,mk.x,mk.z,8,4,10,1),lembah:shotAt(h,mk.x+30,mk.z-30,-20,8,24,2)}});
});};
SCN.s4=function(done){need(["makkah"],function(){
  var A=demZone("makkah",PL.mk,2600,.024,0,0),mk=A.P(PL.mk[0],PL.mk[1]),h=A.h,B=procZone(700,0,{relief:4,sea:1});
  houses(mk.x,mk.z,22,420,h,21,function(x,z){return Math.hypot(x-mk.x,z-mk.z)<3.6||h(x,z)>3.2;});kaabah(mk.x,h(mk.x,mk.z),mk.z,.9);
  hill(mk.x-4.5,mk.z+1.5,2.2,1.6,"#b89a72",5);var mv={v:0},BT=boats([{x:690,z:-8,r:.1},{x:684,z:6,r:-.2},{x:676,z:-2,r:.05}],mv);
  done({sky:"day",shots:{shafa:shotAt(h,mk.x-4.5,mk.z+1.5,-8,4,10,1.5),kabah:shotAt(h,mk.x,mk.z,9,5,11,1),kota:shotAt(h,mk.x,mk.z,-30,20,40,0),pantai:{p:[700,4,16],l:[684,1,0]},laut:{p:[700,10,40],l:[690,0,0]}},
    spots:{shafa:[mk.x-4.5,h(mk.x-4.5,mk.z+1.5)+2.6,mk.z+1.5],kabah:[mk.x,h(mk.x,mk.z)+2,mk.z],perahu:[684,2.2,0]},
    aksi:{berlayar:function(A){var left=BT.length;BT.forEach(function(it){A.target([it.g.position.x,2.2,it.g.position.z],"Perahu",function(){it.go=1;if(--left===0)A.done();});});},
      berlayarFinish:function(){BT.forEach(function(it){it.go=1;});}},
    onShot:{laut:function(){mv.v=1;},"*":function(){mv.v=0;}}});
});};
SCN.s5=function(done){need(["makkah"],function(){
  var A=demZone("makkah",PL.mk,2600,.024,0,0),mk=A.P(PL.mk[0],PL.mk[1]),h=A.h;
  houses(mk.x,mk.z,22,420,h,21,function(x,z){return Math.hypot(x-mk.x,z-mk.z)<3.6||h(x,z)>3.2;});var kb=kaabah(mk.x,h(mk.x,mk.z),mk.z,.9);
  scrollOn(mk.x,h(mk.x,mk.z)+.75,mk.z+.42);townLamps(h,mk.x,mk.z,18,22,8);
  var sy=highest(h,mk.x+26,mk.z+4,10);var sv={x:(sy.x+mk.x)/2+6,z:sy.z+4};
  done({sky:"dusk",shots:{syib:shotAt(h,sv.x,sv.z,-10,4,12,1),kabah:shotAt(h,mk.x,mk.z,4,2.5,6,.8),rumah_sunyi:shotAt(h,mk.x,mk.z,22,7,22,0),kota:shotAt(h,mk.x,mk.z,-30,20,40,0)}});
});};
SCN.s6=function(done){need(["makkah"],function(){
  var A=procZone(0,0,{relief:14,green:.55,pal:[[0,"#c8b58a"],[.4,"#8f9a62"],[.7,"#6f7c4c"],[1,"#5a5844"]]}),h=A.h,B=demZone("makkah",PL.mk,2600,.024,700,0),mk=B.P(PL.mk[0],PL.mk[1]);
  houses(0,0,14,140,h,43);walls(h,0,0,19,15);vineyard(h,26,10,4,10);clutter(h,240,300,43,"#5f7f3c");
  var road=[];for(var i=0;i<14;i++)road.push({x:-70+i*4.2,z:40-Math.sin(i*.8)*6});road.forEach(function(p){var s=new T.Mesh(new T.BoxGeometry(4.6,.08,1.6),std("#d9c6a0"));s.position.set(p.x,h(p.x,p.z)+.05,p.z);s.rotation.y=.3;scene.add(s);});
  houses(mk.x,mk.z,22,420,B.h,21,function(x,z){return Math.hypot(x-mk.x,z-mk.z)<3.6||B.h(x,z)>3.2;});kaabah(mk.x,B.h(mk.x,mk.z),mk.z,.9);townLamps(B.h,mk.x,mk.z,18,40,6);
  done({sky:"day",shots:{jalan:shotAt(h,-50,38,-14,7,16,1),thaif:shotAt(h,0,0,-30,16,38,1),kebun:shotAt(h,32,12,8,4,12,.5),langit:{p:[mk.x+10,B.h(mk.x,mk.z)+6,mk.z+16],l:[mk.x-10,60,mk.z-60]},kabah:shotAt(B.h,mk.x,mk.z,8,4,10,1)},
    spots:{thaif:[0,h(0,0)+3,0],kebun:[32,h(32,12)+2,12]}});
});};
SCN.s7=function(done){need(["madinah"],function(){
  var A=procZone(0,0,{relief:10,valley:1}),h=A.h,B=demZone("madinah",PL.md,1800,.03,700,0,{green:1});
  tentField(h,0,10,14,40,40,5);var L=[];for(var i=0;i<40;i++){var x=(Math.random()-.5)*14,z=(Math.random()-.5)*40+10;L.push({x:x,y:h(x,z)+.8,z:z});}lamps(L,"#ffc677",1.2);
  var gap={x:-6,z:-34};lamps([{x:gap.x,y:h(gap.x,gap.z)+1,z:gap.z},{x:gap.x+2,y:h(gap.x+2,gap.z)+1,z:gap.z+1},{x:gap.x-1.5,y:h(gap.x-1.5,gap.z)+1,z:gap.z+2}],"#ffd9a0",2.4);
  var md=B.P(PL.md[0],PL.md[1]),r=seeded(17),P=[];for(i=0;i<220;i++){var px=md.x+(r()-.5)*90,pz=md.z+(r()-.5)*70;var y=B.h(px,pz);if(y<2&&fbm(px*.08,pz*.08,3)>.5)P.push({x:px,y:y,z:pz});}palms(P,17);
  done({sky:"night",shots:{mina:shotAt(h,0,10,-6,12,40,0),aqabah:shotAt(h,gap.x,gap.z,6,4,12,1),kemah:shotAt(h,2,16,8,4,10,.5),madinah_jauh:shotAt(B.h,md.x,md.z,-30,12,40,1)}});
});};
SCN.s8=function(done){need(["makkah","madinah"],function(){
  var A=demZone("makkah",PL.mk,2600,.024,0,0),mk=A.P(PL.mk[0],PL.mk[1]),h=A.h,ts=A.P(PL.ts[0],PL.ts[1]),
      B=procZone(700,0,{relief:4,sea:1}),Cz=demZone("madinah",PL.qb,1800,.03,-700,0,{green:1}),qb=Cz.P(PL.qb[0],PL.qb[1]),md=Cz.P(PL.md[0],PL.md[1]);
  houses(mk.x,mk.z,22,420,h,21,function(x,z){return Math.hypot(x-mk.x,z-mk.z)<3.6||h(x,z)>3.2;});kaabah(mk.x,h(mk.x,mk.z),mk.z,.9);townLamps(h,mk.x,mk.z,18,40,9);
  var hs={x:mk.x+7,z:mk.z+8},ring=[];for(var i=0;i<10;i++){var a=i/10*Math.PI*2,x=hs.x+Math.cos(a)*2.4,z=hs.z+Math.sin(a)*2.4;ring.push({x:x,y:h(x,z)+.9,z:z});}lamps(ring,"#ff9e4a",1.4);
  var cv=highest(h,ts.x,ts.z,6),gTs=glow(cv.x,cv.y+.5,cv.z,"#ffd9a0",1.6,18,1.4),hr=A.P(PL.hr[0],PL.hr[1]),hv=highest(h,hr.x,hr.z,6);
  caravanLine(B.h,640,22,780,26,3,26000);
  houses(md.x,md.z,12,200,Cz.h,31,function(x,z){return Math.hypot(x-md.x,z-md.z)<2.5;});
  var r=seeded(17),P=[];for(i=0;i<300;i++){var px=qb.x+(r()-.5)*120,pz=qb.z+(r()-.5)*90;var y=Cz.h(px,pz);if(y<2.5&&fbm(px*.08,pz*.08,3)>.48)P.push({x:px,y:y,z:pz});}palms(P,17);
  var sq=new T.Mesh(new T.BoxGeometry(2.4,.35,2.4),std("#efe6d2"));sq.position.set(qb.x,Cz.h(qb.x,qb.z)+.17,qb.z);scene.add(sq);
  done({sky:"night",shots:{kota_malam:shotAt(h,hs.x,hs.z,-12,8,14,0),tsaur:shotAt(h,cv.x,cv.z,10,3,12,0),pesisir:{p:[700,7,46],l:[700,1,22]},quba:shotAt(Cz.h,qb.x,qb.z,-14,9,20,1),madinah:shotAt(Cz.h,md.x,md.z,-20,14,28,0)},
    spots:{rumah:[hs.x,h(hs.x,hs.z)+2.2,hs.z],tsaur:[cv.x,cv.y+1.6,cv.z]},
    aksi:{sembunyi:function(A){
      A.target([cv.x,cv.y+1.6,cv.z],"Gua Tsaur",function(){fade({v:gTs.base},5,1200,function(v){gTs.base=v;});A.done();});
      A.target([hv.x,hv.y+1.6,hv.z],"Gua Hira",function(){A.fail();},true);
      A.target([hs.x,h(hs.x,hs.z)+2.2,hs.z],"Rumah di Makkah",function(){A.fail();},true);}}});
});};
SCN.s9=function(done){need(["madinah"],function(){
  var A=demZone("madinah",PL.md,1800,.03,0,0,{green:1}),md=A.P(PL.md[0],PL.md[1]),h=A.h;
  houses(md.x,md.z,14,240,h,31,function(x,z){return Math.hypot(x-md.x,z-md.z)<7;});var MB=masjidBuild(h,md.x,md.z);function mbVis(v){MB.walls.concat(MB.cols,[MB.roof]).forEach(function(o){o.visible=v;});}awnings(h,md.x+12,md.z+8,10);
  var r=seeded(17),P=[];for(var i=0;i<260;i++){var x=md.x+(r()-.5)*100,z=md.z+(r()-.5)*80+6;if(Math.hypot(x-md.x,z-md.z)<14)continue;var y=h(x,z);if(y<2&&fbm(x*.08,z*.08,3)>.5)P.push({x:x,y:y,z:z});}palms(P,17);
  done({sky:"day",shots:{madinah:shotAt(h,md.x,md.z,-24,16,32,0),masjid:shotAt(h,md.x,md.z,7,5,9,1),pasar:shotAt(h,md.x+16,md.z+11,-6,4,9,1),kampung:shotAt(h,md.x-22,md.z+14,10,6,14,1)},
    spots:{masjid:[md.x,h(md.x,md.z)+3.4,md.z],pasar:[md.x+16,h(md.x+16,md.z+11)+2.6,md.z+11],kampung:[md.x-22,h(md.x-22,md.z+14)+2.2,md.z+14]},
    aksi:{bangun:function(A){mbVis(false);var y=h(md.x,md.z);
      A.target([md.x+4.5,y+1.6,md.z+4],"Dinding",function(){MB.walls.forEach(function(o){grow(o);});
        A.target([md.x,y+2.6,md.z-2],"Tiang",function(){MB.cols.forEach(function(o){grow(o);});
          A.target([md.x,y+3.4,md.z-2.2],"Atap",function(){MB.roof.visible=true;grow(MB.roof,500);A.done();});});});},
      bangunFinish:function(){mbVis(true);}}});
});};
SCN.s10=function(done){SCN.badr(done);};
SCN.s11=function(done){need(["madinah"],function(){
  var c=[(PL.md[0]+PL.uh[0])/2,(PL.md[1]+PL.uh[1])/2],A=demZone("madinah",c,2600,.034,0,0,{green:1,norm:16}),h=A.h,md=A.P(PL.md[0],PL.md[1]),uh=A.P(PL.uh[0],PL.uh[1]);
  houses(md.x,md.z,16,260,h,31,function(x,z){return Math.hypot(x-md.x,z-md.z)<2.5;});
  var top=highest(h,uh.x,uh.z,14),ph={x:uh.x+(md.x-uh.x)*.3,z:uh.z+(md.z-uh.z)*.3};hill(ph.x,ph.z,4,3.2,"#a58560",9);
  var AR=[];for(var k=0;k<5;k++){var a=k/5*Math.PI*2;AR.push({x:ph.x+Math.cos(a)*1.4,y:h(ph.x,ph.z)+2.2,z:ph.z+Math.sin(a)*1.2,h:2.4});}
  var ARB=banners(AR,"#2f9a6e");function arch(v){ARB.forEach(function(it){it.g.visible=v;});}arch(false);
  var fx=(ph.x+uh.x)/2,fz=ph.z+3,M=rankBanners(h,fx,fz-4,3,2,3.2,0,"#2f9a6e"),Q=rankBanners(h,fx,fz+12,6,2,3.2,Math.PI,"#c4472d");
  var ds=dustAt(fx,fz+4,50);clutter(h,200,240,13);
  var val={x:(ph.x+fx)/2+8,z:fz+8};
  done({sky:"day",shots:{madinah:shotAt(h,md.x,md.z,-14,12,22,6),uhud:shotAt(h,top.x,top.z,-20,10,46,-4),pemanah:shotAt(h,ph.x,ph.z,16,8,20,2.5),medan:shotAt(h,fx,fz+4,24,10,22,1),lereng:shotAt(h,top.x,top.z+10,12,6,20,-2),
      pilih:fitShot([[top.x,top.y,top.z],[ph.x,h(ph.x,ph.z)+3,ph.z],[md.x,h(md.x,md.z),md.z],[val.x,h(val.x,val.z),val.z]])},
    spots:{uhud:[top.x,top.y+2,top.z],bukit:[ph.x,h(ph.x,ph.z)+3.6,ph.z],madinah:[md.x,h(md.x,md.z)+3,md.z]},
    aksi:{pemanah:function(A){arch(false);
      A.target([ph.x,h(ph.x,ph.z)+3.6,ph.z],"Bukit kecil",function(){arch(true);A.done();});
      A.target([val.x,h(val.x,val.z)+1.2,val.z],"Tengah lembah",function(){A.fail();},true);
      A.target([md.x,h(md.x,md.z)+2,md.z+6],"Dekat Madinah",function(){A.fail();},true);
    },pemanahFinish:function(){arch(true);}},
    fx:{turun:function(){ARB.forEach(function(it,k){if(k===0)return;var x0=it.g.position.x,z0=it.g.position.z,tx=fx+(k-2)*3,tz=fz+2,t0=performance.now()+k*200;
      upd.push(function(t){var kk=clamp((t-t0)/(reduceM?1:2200),0,1),e=ease(kk),x=lerp(x0,tx,e),z=lerp(z0,tz,e);it.g.position.set(x,h(x,z),z);return kk>=1;});});}},
    onShot:{medan:function(){on(ds);marchTo(h,M,fx,fz+8,3200);marchTo(h,Q,fx,fz,3200);},"*":function(){off(ds);}}});
});};
SCN.s12=function(done){need(["madinah"],function(){
  var A=demZone("madinah",PL.md,2200,.03,0,0,{green:1}),h=A.h,md=A.P(PL.md[0],PL.md[1]),sl=A.P(PL.sl[0],PL.sl[1]);
  houses(md.x,md.z,16,260,h,31,function(x,z){return Math.hypot(x-md.x,z-md.z)<2.5;});
  var tz=Math.min(sl.z,md.z)-12,pts=[];for(var i=0;i<=10;i++)pts.push({x:md.x-46+i*9.2,z:tz-Math.sin(i*.6)*3});var SG=trench(h,pts);
  function segVis(j,v){SG[j].t.visible=SG[j].d.visible=v;}SG.forEach(function(_,j){segVis(j,false);});
  tentField(h,md.x,tz-30,90,26,70,4,"#d9c3a0");var Q=rankBanners(h,md.x,tz-20,8,2,9,Math.PI,"#c4472d");
  var qf={x:md.x+30,z:md.z+26};fort(qf.x,h(qf.x,qf.z),qf.z,5);fort(qf.x+9,h(qf.x+9,qf.z+4),qf.z+4,4);
  var wd=dustAt(md.x,tz-26,120,true);
  done({sky:"day",shots:{gali:fitShot([[md.x-46,h(md.x-46,tz),tz],[md.x+46,h(md.x+46,tz),tz]],.8),parit:shotAt(h,md.x,tz,-14,7,12,0),sekutu:fitShot([[SG[5].x,SG[5].y+3,SG[5].z],[md.x,h(md.x,tz-30)+5,tz-30],[sl.x,h(sl.x,sl.z)+5,sl.z]]),angin:shotAt(h,md.x,tz-28,18,8,20,1),quraizhah:shotAt(h,qf.x,qf.z,-12,7,14,1),madinah:shotAt(h,md.x,md.z,-20,16,30,0)},
    spots:{parit:[SG[5].x,SG[5].y+1.5,SG[5].z],sekutu:[md.x,h(md.x,tz-30)+3,tz-30],sal:[sl.x,h(sl.x,sl.z)+3,sl.z]},
    aksi:{parit:function(A){var left=5;SG.forEach(function(_,j){segVis(j,false);});
      for(var g=0;g<5;g++)(function(g){var a=SG[g*2],b=SG[g*2+1];A.target([(a.x+b.x)/2,a.y+1.4,(a.z+b.z)/2],"Gali",function(){
        [g*2,g*2+1].forEach(function(j){segVis(j,true);var o=SG[j],t0=performance.now();o.t.scale.y=.01;upd.push(function(t){var k=clamp((t-t0)/(reduceM?1:600),0,1);o.t.scale.y=Math.max(.01,k);return k>=1;});});
        if(--left===0)A.done();});})(g);
    },paritFinish:function(){SG.forEach(function(_,j){segVis(j,true);SG[j].t.scale.y=1;});}},
    onShot:{angin:function(){on(wd);Q.forEach(function(it){it.ph+=3;});},"*":function(){off(wd);}}});
});};
SCN.s13=function(done){
  var A=procZone(0,0,{relief:5}),h=A.h;tentField(h,0,14,50,24,22,13);var WL=well(-6,h(-6,4),4);well(5,h(5,6),6);var wt=WL.children[1],wy=wt.position.y;var tr=bigTree(10,h(10,-4),-4);clutter(h,240,300,17);ringHills(160,12,16,30,"#b08860",71);
  var cv=caravanLine(h,-120,40,-10,22,12,22000),M=rankBanners(h,-30,30,3,1,4,0,"#2f9a6e");
  done({sky:"day",shots:{perjalanan:shotAt(h,-50,32,14,6,20,1),kemah:shotAt(h,0,14,-18,9,26,0),sumur:shotAt(h,-6,4,5,3,7,.5),pohon:shotAt(h,10,-4,-9,4,10,2.2),makkah_jauh:{p:[0,h(0,0)+10,30],l:[0,8,-160]}},
    spots:{pohon:[10,h(10,-4)+4.4,-4],kemah:[0,h(0,14)+2.4,14],sumur:[-6,h(-6,4)+1.6,4]},
    aksi:{air:function(A){wt.position.y=wy-.4;wt.material.color.set("#6b5a40");
      A.target([-6,h(-6,4)+1.6,4],"Sumur",function(){var t0=performance.now();wt.material.color.set("#3f7f97");upd.push(function(t){var k=clamp((t-t0)/(reduceM?1:1400),0,1);wt.position.y=wy-.4+.4*ease(k);return k>=1;});A.done();});},
      airFinish:function(){wt.position.y=wy;wt.material.color.set("#3f7f97");}}});
};
SCN.s14=function(done){need(["madinah"],function(){
  var A=demZone("madinah",PL.md,1800,.03,0,0,{green:1}),md=A.P(PL.md[0],PL.md[1]),h=A.h,B=procZone(-700,0,{relief:7}),Cz=procZone(700,0,{relief:6,pal:[[0,"#d8c6a0"],[.5,"#a88a6a"],[1,"#5f4c40"]]});
  houses(md.x,md.z,14,240,h,31,function(x,z){return Math.hypot(x-md.x,z-md.z)<3;});var sc=scrollsFrom(md.x,h(md.x,md.z)+2,md.z);
  caravanLine(B.h,-780,10,-620,4,4,30000);clutter(B.h,220,220,7);
  var r=seeded(47),P=[];for(var i=0;i<260;i++){var x=700+(r()-.5)*110,z=(r()-.5)*90;if(fbm(x*.06,z*.06,2)>.46)P.push({x:x,y:Cz.h(x,z),z:z});}palms(P,47);
  var FT=[];for(i=0;i<4;i++){var fx=676+i*16,fz=-14+(i%2)*10;fort(fx,Cz.h(fx,fz),fz,4.5);FT.push({x:fx,z:fz,y:Cz.h(fx,fz)});}banners([{x:700+16,y:Cz.h(716,-4)+0,z:-1.5,h:4.2}],"#2f9a6e");
  done({sky:"day",shots:{madinah:shotAt(h,md.x,md.z,-16,10,22,2),jalan:shotAt(B.h,-700,6,16,6,22,1),khaibar:shotAt(Cz.h,700,-6,-34,14,40,1),benteng:shotAt(Cz.h,716,-4,-14,7,18,2),kebun:shotAt(Cz.h,690,20,10,4,12,1)},
    spots:{madinah:[md.x,h(md.x,md.z)+3,md.z],benteng:[716,Cz.h(716,-4)+3.4,-4]},
    aksi:{benteng:function(A,b){var urut=(b&&b.urut)||["Benteng 1","Benteng 2","Benteng 3"],nx=0,lbl=urut.slice().sort();sx.want=urut[0];
      lbl.forEach(function(name,k){var f=FT[k%FT.length];A.target([f.x,f.y+3.2,f.z],name,function(o){if(name!==urut[nx]){A.fail();return;}
        banners([{x:f.x,y:f.y+1.2,z:f.z,h:3.4}],"#2f9a6e");o.el.classList.add("got");o.el.disabled=true;sx.want=urut[++nx];if(nx===urut.length)A.done();},true);});}},
    onShot:{madinah:function(){on(sc);},"*":function(){off(sc);}}});
});};
SCN.s15=function(done){need(["makkah"],function(){
  var A=procZone(-700,0,{relief:12,green:.35,pal:[[0,"#cdbb8f"],[.5,"#a6a06a"],[1,"#7a7458"]]}),hA=A.h,B=demZone("makkah",PL.mk,2600,.024,0,0),mk=B.P(PL.mk[0],PL.mk[1]),h=B.h;
  var R=rankBanners(hA,-700,-24,10,3,4,Math.PI,"#7c2a4a"),M=rankBanners(hA,-700,8,3,2,4,0,"#2f9a6e"),ds=dustAt(-700,-8,60);
  houses(mk.x,mk.z,22,420,h,21,function(x,z){return Math.hypot(x-mk.x,z-mk.z)<4.4||h(x,z)>3.2;});kaabah(mk.x,h(mk.x,mk.z),mk.z,.9);var id=idols(h,mk.x,mk.z,2.6,24);
  var G=[],GG=[];[[-34,-10],[30,-18],[22,30],[-26,26]].forEach(function(o){var g=rankBanners(h,mk.x+o[0],mk.z+o[1],2,1,3,Math.atan2(-o[0],-o[1]),"#2f9a6e");GG.push({g:g,x:mk.x+o[0],z:mk.z+o[1]});G=G.concat(g);});
  done({sky:"day",shots:{mutah:shotAt(hA,-700,-20,-30,12,44,1),mutah_tempur:shotAt(hA,-700,-6,22,9,22,1),fathu:shotAt(h,mk.x,mk.z,-30,24,44,0),kabah:shotAt(h,mk.x,mk.z,8,4,10,1),kota:shotAt(h,mk.x,mk.z,-26,18,34,0)},
    spots:{mutah:[-700,hA(-700,-24)+5,-24],kabah:[mk.x,h(mk.x,mk.z)+2.2,mk.z],kota:[mk.x-14,h(mk.x-14,mk.z+12)+3,mk.z+12]},
    aksi:{masuk:function(A){var left=GG.length;GG.forEach(function(q){A.target([q.x,h(q.x,q.z)+4.6,q.z],"Pasukan",function(){marchTo(h,q.g,mk.x,mk.z,3000);if(--left===0)A.done();});});},
      masukFinish:function(){}},
    onShot:{mutah_tempur:function(){on(ds);marchTo(hA,M,-700,-14,3000);marchTo(hA,R,-700,4,3000);},fathu:function(){marchTo(h,G,mk.x,mk.z,4200);},kabah:function(){setTimeout(id.fall,700);},"*":function(){off(ds);}}});
});};
SCN.s16=function(done){
  var A=procZone(0,0,{relief:8,valley:1}),h=A.h,B=procZone(700,0,{relief:14,green:.5,pal:[[0,"#c8b58a"],[.4,"#8f9a62"],[1,"#5a5844"]]}),Cz=procZone(-700,0,{relief:5,pal:[[0,"#efc98f"],[.5,"#dca46a"],[1,"#b9774f"]]});
  var M=rankBanners(h,0,24,3,2,3.4,Math.PI,"#2f9a6e"),ar=arrowsAt(0,8);clutter(h,200,220,19);
  var SC4=[[-14,4],[12,-2],[-9,-12],[15,14]].map(function(p){return banners([{x:p[0],y:h(p[0],p[1]),z:p[1],h:3.2,r:p[0]*.2}],"#2f9a6e")[0];});
  houses(700,0,12,110,B.h,43);walls(B.h,700,0,18,14);var s=[];for(var i=0;i<6;i++)s.push({x:700-15+i*6,y:B.h(700-15+i*6,26),z:26,r:Math.PI,h:3.4});banners(s,"#2f9a6e");
  hijrRocks(Cz.h,-700,-30);caravanLine(Cz.h,-780,30,-620,20,6,26000);
  done({sky:"dawn",shots:{hunain:shotAt(h,0,10,0,8,34,1),sergap:shotAt(h,0,8,12,5,16,3),thaif:shotAt(B.h,700,0,-26,14,40,1),tabuk:shotAt(Cz.h,-700,20,20,7,24,1),hijr:shotAt(Cz.h,-700,-30,22,9,42,4)},
    spots:{lereng:[18,h(18,8)+2.5,8],thaif:[700,B.h(700,0)+4,0],hijr:[-700,Cz.h(-700,-30)+9,-30]},
    aksi:{kumpul:function(A){var left=SC4.length;SC4.forEach(function(it,k){var p=it.g.position;A.target([p.x,p.y+3.6,p.z],"Panji",function(){marchTo(h,[it],(k%2?1:-1)*2,6,1600);if(--left===0)A.done();});});}},
    onShot:{sergap:function(){on(ar);},"*":function(){off(ar);}}});
};
SCN.s17=function(done){need(["makkah","madinah"],function(){
  var c=[(PL.mk[0]+PL.ar[0])/2,(PL.mk[1]+PL.ar[1])/2],A=demZone("makkah",c,1500,.02,0,0,{size:320,seg:170,norm:10}),h=A.h,mk=A.P(PL.mk[0],PL.mk[1]),ar=A.P(PL.ar[0],PL.ar[1]),mn=A.P(PL.mn[0],PL.mn[1]),
      B=demZone("madinah",PL.md,1800,.03,700,0,{green:1}),md=B.P(PL.md[0],PL.md[1]);
  houses(mk.x,mk.z,12,240,h,21,function(x,z){return Math.hypot(x-mk.x,z-mk.z)<2.6||h(x,z)>2.4;});kaabah(mk.x,h(mk.x,mk.z),mk.z,.6);
  tentField(h,ar.x,ar.z,40,30,140,21);hill(ar.x+6,ar.z-8,4,2.6,"#9c7b58",3);tentField(h,mn.x,mn.z,18,10,70,23);
  houses(md.x,md.z,14,240,B.h,31,function(x,z){return Math.hypot(x-md.x,z-md.z)<3;});var m=new T.Mesh(new T.BoxGeometry(3.2,.4,2.6),std("#efe6d2"));m.position.set(md.x,B.h(md.x,md.z)+.2,md.z);scene.add(m);
  var r=seeded(17),P=[];for(var i=0;i<220;i++){var x=md.x+(r()-.5)*100,z=md.z+(r()-.5)*80;if(Math.hypot(x-md.x,z-md.z)<12)continue;var y=B.h(x,z);if(y<2&&fbm(x*.08,z*.08,3)>.5)P.push({x:x,y:y,z:z});}palms(P,17);
  done({sky:"day",shots:{arafah:shotAt(h,ar.x,ar.z,-26,12,30,0),mina:shotAt(h,mn.x,mn.z,-14,8,16,0),kabah:shotAt(h,mk.x,mk.z,6,3.5,8,.8),madinah:shotAt(B.h,md.x,md.z,-18,10,24,1)},
    spots:{arafah:[ar.x,h(ar.x,ar.z)+3,ar.z],mina:[mn.x,h(mn.x,mn.z)+2.5,mn.z],kabah:[mk.x,h(mk.x,mk.z)+2,mk.z],madinah:[md.x,B.h(md.x,md.z)+3,md.z]}});
});};

/* Pemetaan stasiun -> adegan */
function sceneFor(i){if(SCN["s"+i])return {f:SCN["s"+i]};var n=NODE_OF[i];
  if(n==="mk")return {f:SCN.makkah};if(n==="md")return {f:SCN.madinah};return {f:SCN.place,arg:n};}

/* ---- Kisah: KISAH3[i].s (SMP ±4 beat) / .d (dewasa ±8 beat), dari build/kisah/*.json; h = rujukan internal, tidak ditampilkan ---- */
function beatsFor(i){
  var K=typeof KISAH3!=="undefined"&&KISAH3[i];if(K&&K[st.mode]&&K[st.mode].length)return K[st.mode];
  var s=S[i],txt=(s.r[st.mode]||s.r.s).split(/\.\s+/).map(function(x,k,a){return k<a.length-1?x+".":x;}),out=[],keys=["a","b","c","d"];
  for(var k=0;k<txt.length;k+=2)out.push({t:txt.slice(k,k+2).join(" "),shot:keys[out.length%4]});
  return out.slice(0,4);
}

/* ---- Kisah interaktif: tebak dulu, jelajah adegan, aksi kecil. Disisipkan sebelum beat ke-`before[level]`.
   Teks dari buku (h = rujukan internal, tidak ditampilkan). ---- */
var INTER={
 10:[
  {k:"tebak",before:{s:3,d:5},shot:"wells",q:"Al-Hubab bin Al-Mundzir bertanya: apakah tempat berhenti ini perintah Allah, atau siasat perang? Menurutmu, apa usulnya?",
   o:["Pindah ke mata air terdekat dan menimbun sumur lain","Bertahan di tempat semula sambil menunggu musuh","Kembali ke Madinah sebelum musuh datang"],a:0,
   r:"Rasulullah menjawab itu siasat perang. Al-Hubab mengusulkan pindah ke mata air terdekat, dan beliau bersabda, “Engkau telah menyampaikan pendapat yang jitu.”",h:"hlm. 242"},
  {k:"aksi",before:{s:3,d:5},shot:"kolamAksi",act:"kolam",t:"Lakukan usul Al-Hubab: ketuk sumur-sumur yang bersinar untuk menimbunnya, lalu ketuk kolam untuk mengisinya dengan air.",
   r:"Kaum Muslimin bisa minum, sedangkan musuh tidak.",h:"hlm. 242–243"},
  {k:"jelajah",before:{s:4,d:7},shot:"overview",t:"Jelajahi medan Badr sebelum pertempuran. Ketuk tanda yang bersinar.",spots:[
   ["kolam","Kolam","Kolam berisi air dibuat di dekat mata air Badr, dan sumur-sumur lain ditimbun.","hlm. 242–243"],
   ["cmd","Tenda komando","Atas usul Sa’d bin Mu’adz, tenda untuk Rasulullah dibangun di tempat yang tinggi, di sebelah timur laut medan perang, dijaga beberapa pemuda Anshar.","hlm. 243"],
   ["mus","Pasukan Muslimin","313 hingga 317 orang, hanya dengan dua kuda dan 70 unta.","hlm. 234"],
   ["qur","Pasukan Quraisy","Awalnya 1.300 orang, 100 kuda, dan 600 baju besi; yang terus maju ke Badr sekitar 1.000 orang.","hlm. 235–237"],
   ["bukit","Al-Udwatul-Qushwa","Quraisy bermalam di Al-Udwatul-Qushwa, lalu pagi harinya turun ke lembah Badr.","hlm. 244"]]},
  {k:"tebak",before:{s:4,d:9},shot:"field",q:"Pasukan Muslimin jauh lebih sedikit daripada pasukan Quraisy. Menurutmu, bagaimana akhir Perang Badr?",
   o:["Kaum Muslimin menang","Pasukan Quraisy menang","Kedua pihak pulang tanpa bertempur"],a:0,r:"Dengan pertolongan Allah, kaum Muslimin meraih kemenangan yang nyata.",h:"hlm. 261"}],
 11:[
  {k:"jelajah",before:{s:1,d:3},shot:"pilih",t:"Lihat medan Uhud dari atas. Ketuk tanda yang bersinar.",spots:[
   ["uhud","Gunung Uhud","Pasukan Muslimin mengambil posisi dengan memunggungi Gunung Uhud dan menghadap ke arah Madinah.","hlm. 299"],
   ["bukit","Bukit kecil","Bukit di sebelah selatan Wadi Qanat, kelak dikenal sebagai Jabal Rumat, kira-kira 150 meter dari posisi pasukan Muslimin.","hlm. 299"],
   ["madinah","Madinah","Dengan posisi itu, pasukan musuh berada di antara pasukan Muslimin dan Madinah.","hlm. 299"]]},
  {k:"aksi",before:{s:1,d:3},shot:"pilih",act:"pemanah",t:"Rasulullah menunjuk satu pasukan pemanah ulung. Ketuk tempat yang menurutmu paling tepat untuk mereka.",
   r:"Tepat! Pasukan pemanah di bawah Abdullah bin Jubair ditempatkan di atas bukit. Pesan beliau: lindungi punggung kami dan tetaplah di tempat, menang atau kalah.",
   no:"Belum tepat. Pemanah butuh tempat tinggi agar bisa melindungi punggung pasukan dari serangan dari belakang. Coba lagi.",h:"hlm. 299–300"},
  {k:"tebak",before:{s:2,d:5},shot:"medan",fx:"turun",q:"Kaum Muslimin unggul dan musuh mulai lari meninggalkan harta. Apa yang dilakukan sebagian besar pemanah?",
   o:["Turun dari bukit untuk mengumpulkan harta rampasan","Tetap di atas bukit sesuai perintah Rasulullah","Kembali ke Madinah membawa kabar kemenangan"],a:0,
   r:"Empat puluh pemanah turun, tinggal Abdullah bin Jubair dan sembilan rekannya. Khalid bin Al-Walid memutar dan menyerang dari belakang.",h:"hlm. 310"}],
 12:[
  {k:"tebak",before:{s:1,d:1},shot:"madinah",q:"Sekitar sepuluh ribu pasukan sekutu bergerak ke Madinah. Salman Al-Farisi mengusulkan cara bertahan orang Persia. Menurutmu apa?",
   o:["Menggali parit","Membangun tembok batu tinggi","Menyerang lebih dulu ke Makkah"],a:0,
   r:"Salman berkata, “Dulu jika kami orang-orang Persia dikepung musuh, kami membuat parit di sekitar kami.” Cara ini belum dikenal bangsa Arab.",h:"hlm. 358"},
  {k:"aksi",before:{s:1,d:2},shot:"gali",act:"parit",t:"Ayo menggali! Ketuk tiap bagian parit yang bersinar. Setiap sepuluh orang mendapat bagian sepanjang empat puluh hasta.",
   r:"Parit selesai sebelum pasukan musuh tiba.",h:"hlm. 358–361"},
  {k:"jelajah",before:{s:2,d:4},shot:"sekutu",t:"Lihat keadaan saat pengepungan. Ketuk tanda yang bersinar.",spots:[
   ["parit","Parit","Dibuat atas usul Salman Al-Farisi. Rasulullah ikut menggali dan mengangkut tanah.","hlm. 358–359"],
   ["sekutu","Kemah sekutu","Quraisy 4.000 orang, sedangkan Ghathafan dan penduduk Najd 6.000 orang.","hlm. 361"],
   ["sal","Gunung Sal’","Kaum Muslimin, 3.000 orang, berlindung dengan Gunung Sal’ di belakang mereka.","hlm. 361"]]},
  {k:"tebak",before:{s:3,d:6},shot:"angin",q:"Musuh tidak bisa menyeberangi parit. Menurutmu, bagaimana pengepungan ini berakhir?",
   o:["Angin kencang memporak-porandakan kemah musuh","Musuh berhasil menyeberangi parit","Kaum Muslimin keluar menyerang ke Makkah"],a:0,
   r:"Setelah barisan musuh terpecah, Allah mengirim angin kencang sehingga kemah-kemah mereka porak-poranda.",h:"hlm. 370"}]
};
function stepsFor(i){var B=beatsFor(i),L=INTER[i]||(typeof INTER3!=="undefined"&&INTER3[i]),m=st.mode,out=[];if(!L)return B;
  for(var k=0;k<=B.length;k++){L.forEach(function(x,ix){if(x.before[m]===k)out.push(Object.assign({ix:ix},x));});if(k<B.length)out.push(B[k]);}
  return out;}

/* ---- Kamera ---- */
function V(a){return new T.Vector3(a[0],a[1],a[2]);}
function goShot(sh,ms){if(!sh)return;var p=cam.position.clone(),l=camA.l?camA.l.clone():V(sh.l);camA={p:p,l:l};camB={p:V(sh.p),l:V(sh.l)};camT0=performance.now();camMs=reduceM?1:(ms||2200);}
function camTick(t){
  if(!camB)return;var k=clamp((t-camT0)/camMs,0,1),e=ease(k);
  var p=camA.p.clone().lerp(camB.p,e),l=camA.l.clone().lerp(camB.l,e);
  if(!reduceM){var w=t/1000;p.x+=Math.sin(w*.23)*.6;p.y+=Math.sin(w*.31)*.25;p.z+=Math.cos(w*.19)*.6;}
  cam.position.copy(p);cam.lookAt(l);if(k>=1)camA.l=camB.l.clone();
  var dd=p.distanceTo(l);scene.fog.near=Math.max(60,dd*.9);scene.fog.far=Math.max(260,dd*3.2);
  var sp=(skyTo||skyNow||SKY.day).pos;sun.target.position.copy(l);sun.position.set(l.x+sp[0],l.y+sp[1],l.z+sp[2]);
}

/* ---- Loop ---- */
function frame(t){
  raf=0;if(!live)return;var dt=Math.min(64,t-(lastT||t));lastT=t;
  skyTick(t);camTick(t);for(var i=upd.length-1;i>=0;i--){if(upd[i](t,dt)===true)upd.splice(i,1);}
  R.render(scene,cam);hsPlace();if(!document.hidden)raf=requestAnimationFrame(frame);
}
function resize(){if(!R||!host)return;var w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;R.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));R.setSize(w,h,false);layoutCam();}
/* pusat pandang digeser ke area di atas kotak dialog, supaya objek yang diceritakan tidak tertutup */
function layoutCam(){if(!cam||!host)return;var w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;
  var dl=el&&el.querySelector(".stdlg"),d=dl?Math.min(dl.offsetHeight*.8,h*.5):0;cam.aspect=w/(h+d);cam.setViewOffset(w,h+d,0,d,w,h);cam.updateProjectionMatrix();}
function clearScene(){
  upd=[];if(!scene)return;
  scene.traverse(function(o){if(o.geometry)o.geometry.dispose();if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(function(m){m.dispose();});}});
  while(scene.children.length)scene.remove(scene.children[0]);
}

/* ---- Panggung (DOM) ---- */
var el=null,mode="story",beats=[],bi=0,typing=null,stI=0;
function ensureDom(){
  if(el)return;el=document.createElement("div");el.id="stage";el.className="stg";el.hidden=true;
  el.innerHTML='<div class="stc"></div><div class="sttop"><span class="stt"></span><button class="stx" data-sa="close" aria-label="Tutup adegan">×</button></div>'+
    '<div class="stov"></div><div class="stcut"></div><p class="stnote">Ilustrasi suasana, bukan rekonstruksi. Tanpa penggambaran tokoh.</p><div class="stdlg" role="region" aria-live="polite"></div>';
  document.body.appendChild(el);host=el.querySelector(".stc");
  el.addEventListener("click",onClick);el.addEventListener("change",function(e){var s=e.target.closest&&e.target.closest("select[data-act=msl]");if(s){quizChange(s);drawDlg();}});
  window.addEventListener("resize",resize);
  document.addEventListener("keydown",function(e){if(el.hidden)return;if(e.key==="Escape")close();});
}
/* tanda yang bisa diketuk di atas adegan */
var hs=[],hv=null;
function hsClear(){hs.forEach(function(o){o.el.remove();});hs=[];}
function hsAdd(pos,label,cls,cb){var b=document.createElement("button");b.className="hs "+(cls||"");b.innerHTML='<i aria-hidden="true"></i><span>'+esc(label)+'</span>';
  var o={el:b,v:V(pos)};b.addEventListener("click",function(e){e.stopPropagation();cb(o);});el.querySelector(".stov").appendChild(b);hs.push(o);return o;}
function hsPlace(){if(!hs.length)return;hv=hv||new T.Vector3();var w=host.clientWidth,h=host.clientHeight;
  hs.forEach(function(o){hv.copy(o.v).project(cam);if(hv.z>1||Math.abs(hv.x)>1.05||Math.abs(hv.y)>1.05){o.el.style.display="none";return;}
    o.el.style.display="";o.el.style.transform="translate("+((hv.x+1)/2*w).toFixed(1)+"px,"+((1-hv.y)/2*h).toFixed(1)+"px) translate(-50%,-50%)";});}
var sx={};
function award(n){var p=P(),key=stI+":"+beats[bi].ix+":"+beats[bi].k;p.ix=p.ix||{};if(p.ix[key])return;p.ix[key]=1;p.pts+=n;save();if(hooks.onProgress)hooks.onProgress();}
function finishAksi(stp){if(stp&&stp.k==="aksi"&&!sx.done&&cur&&cur.aksi&&cur.aksi[stp.act+"Finish"])cur.aksi[stp.act+"Finish"]();}
function drawDlg(){
  var d=el.querySelector(".stdlg"),h="";
  d.classList.toggle("q",mode!=="story");
  if(mode==="story"){
    var b=beats[bi],last=bi===beats.length-1,dots='<span class="dots">'+beats.map(function(x,k){return '<i class="'+(x.k?"ix ":"")+(k===bi?"on":k<bi?"was":"")+'"></i>';}).join("")+'</span>';
    var nav=function(lbl){return '<div class="dbt"><button class="btn ghost" data-sa="skip">Lewati kisah</button>'+(bi>0?'<button class="btn ghost" data-sa="prev" aria-label="Sebelumnya">‹</button>':'')+
      '<button class="btn" data-sa="next">'+(lbl||(last?"Mulai uji ingatan ›":"Lanjut ›"))+'</button></div>';};
    setTimeout(layoutCam,0);
    if(!b.k){d.innerHTML='<div class="dnar"><span>Kilasan kisah</span>'+dots+'</div><p class="dtx" id="dtx"></p>'+nav();type(b.t);return;}
    if(b.k==="tebak"){
      h='<div class="dnar"><span>Tebak dulu</span>'+dots+'</div><p class="dtx dq">'+esc(b.q)+'</p><div class="opts">'+b.o.map(function(o,k){
        var c="opt"+(sx.pick>-1?(k===b.a?" ok":k===sx.pick?" bad":""):"");return '<button class="'+c+'" data-sa="tb" data-k="'+k+'"'+(sx.pick>-1?" disabled":"")+'>'+esc(o)+'</button>';}).join("")+'</div>';
      if(sx.pick>-1)h+='<p class="fb '+(sx.pick===b.a?"good":"err")+'">'+(sx.pick===b.a?"Tebakanmu tepat! ":"Ternyata bukan itu. ")+esc(b.r)+'</p>';
      d.innerHTML=h+nav(sx.pick>-1?null:"Lewati");d.classList.add("q");return;}
    if(b.k==="jelajah"){
      var n=Object.keys(sx.found||{}).length;
      var tot=sx.total||b.spots.length;h='<div class="dnar"><span>Jelajahi</span>'+dots+'</div><p class="dtx dq">'+esc(b.t)+' <b class="cnt">'+n+'/'+tot+' ditemukan</b></p>';
      if(sx.msg)h+='<p class="fb good"><b>'+esc(sx.msgT)+'.</b> '+esc(sx.msg)+'</p>';
      if(n===tot)h+='<p class="fb good">Semua tempat sudah kamu jelajahi.</p>';
      d.innerHTML=h+nav();d.classList.add("q");return;}
    if(b.k==="aksi"){
      h='<div class="dnar"><span>Coba lakukan</span>'+dots+'</div><p class="dtx dq">'+esc(b.t)+'</p>';
      if(sx.done)h+='<p class="fb good">'+esc(b.r)+'</p>';else if(sx.msg)h+='<p class="fb err">'+esc(sx.msg)+'</p>';
      d.innerHTML=h+nav(sx.done?null:"Lewati");d.classList.add("q");return;}
  }else if(mode==="quiz"){
    if(isDone(stI)&&!justOk[stI]){mode="done";return drawDlg();}
    setTimeout(layoutCam,0);
    d.innerHTML=qBlock(stI)+'<div class="dbt"><button class="btn ghost" data-sa="replay">Ulangi kisah</button></div>';
  }else{
    var nx=stI<S.length-1?stI+1:S.length;
    d.innerHTML='<div class="dnar"><span>Stasiun selesai</span></div><p class="dtx">Alhamdulillah, stasiun '+(stI+1)+' selesai. Poinmu sekarang '+P().pts+'.</p>'+
      '<div class="dbt"><button class="btn ghost" data-sa="replay">Ulangi kisah</button><button class="btn" data-sa="close">'+(nx<S.length?"Kembali ke peta: lanjut ke stasiun "+(nx+1):"Kembali ke peta")+'</button></div>';
  }
}
function type(s){
  var p=el.querySelector("#dtx");clearInterval(typing);
  if(reduceM){p.textContent=s;return;}var n=0;p.textContent="";
  typing=setInterval(function(){n+=2;p.textContent=s.slice(0,n);if(n>=s.length){clearInterval(typing);typing=null;}},18);
}
function playBeat(){
  var b=beats[bi];if(!cur)return;hsClear();sx={pick:-1,found:{},done:false,msg:"",total:0};drawDlg();layoutCam();
  var sh=shotOf(cur.shots[b.shot]||cur.shots[Object.keys(cur.shots)[0]],b);
  if(b.k==="jelajah"||b.k==="aksi"){setupStep(b);
    if(hs.length){var f0=hs[0].v,pts=hs.filter(function(o){return o.v.distanceTo(f0)<260;}).map(function(o){return o.v.toArray();});sh=autoFit(pts,[.1,1.15,.7]);}}
  var far=cam&&sh&&cam.position.distanceTo(V(sh.p))>180;
  function go(){
    if(far){cam.position.copy(V(sh.p));camA={p:V(sh.p),l:V(sh.l)};camB=null;cam.lookAt(V(sh.l));}
    else goShot(sh,bi===0?1:2200);
    if(b.sky)setSky(b.sky,far?1:1800);
    if(!b.k&&cur.onShot){if(cur.onShot["*"])cur.onShot["*"](b.shot);if(cur.onShot[b.shot])cur.onShot[b.shot]();}
    [b.fx,b.fx2].forEach(function(f,ix){if(!b.k&&f&&cur.fx&&cur.fx[f])setTimeout(cur.fx[f],ix?1200:0);});
  }
  if(far&&!reduceM){var c=el.querySelector(".stcut");c.classList.add("on");setTimeout(function(){go();setTimeout(function(){c.classList.remove("on");},120);},320);}else go();
}
/* layar tegak = sudut horizontal sempit: mundurkan kamera agar semua tanda masuk layar */
function wideShot(sh){var a=cam.aspect||.5,f=clamp(.95/a,1,2.6);if(f<=1.01)return sh;var l=sh.l,p=sh.p;
  return {p:[l[0]+(p[0]-l[0])*f,l[1]+(p[1]-l[1])*f,l[2]+(p[2]-l[2])*f],l:l};}
function setupStep(b){
  if(b.k==="jelajah"){var f0=null;b.spots.forEach(function(sp){var pos=cur.spots&&cur.spots[sp[0]];if(!pos)return;var v=V(pos);if(f0&&v.distanceTo(f0)>=260)return;f0=f0||v;sx.total++;
    hsAdd(pos,sp[1],"jel",function(o){sx.found[sp[0]]=1;sx.msgT=sp[1];sx.msg=sp[2];o.el.classList.add("got");if(Object.keys(sx.found).length===sx.total)award(2);drawDlg();});});}
  if(b.k==="aksi"){
    var A={target:function(pos,label,cb,keep){var o=hsAdd(pos,label,"aks",function(){if(!keep){o.el.remove();hs.splice(hs.indexOf(o),1);}cb(o);});return o;},
      done:function(){sx.done=true;hsClear();award(2);drawDlg();},fail:function(){sx.msg=b.no||"Belum tepat, coba lagi.";drawDlg();}};
    if(cur.aksi&&cur.aksi[b.act])cur.aksi[b.act](A,b);else sx.done=true;}
}
function leaveStep(){var b=beats[bi];finishAksi(b);hsClear();}
function onClick(e){
  var b=e.target.closest("button");if(!b)return;var sa=b.getAttribute("data-sa");
  if(sa==="close"){close();return;}
  if(sa==="tb"){var st0=beats[bi];if(sx.pick>-1)return;sx.pick=+b.getAttribute("data-k");if(sx.pick===st0.a)award(1);if(st0.fx&&cur.fx&&cur.fx[st0.fx])cur.fx[st0.fx]();drawDlg();return;}
  if(sa==="next"){if(typing){clearInterval(typing);typing=null;el.querySelector("#dtx").textContent=beats[bi].t;return;}
    leaveStep();if(bi<beats.length-1){bi++;playBeat();}else{mode="quiz";drawDlg();focusDlg();}return;}
  if(sa==="prev"){if(bi>0){leaveStep();bi--;playBeat();}return;}
  if(sa==="skip"){leaveStep();if(cur&&cur.aksi)Object.keys(cur.aksi).forEach(function(k){if(/Finish$/.test(k))cur.aksi[k]();});mode="quiz";drawDlg();focusDlg();return;}
  if(sa==="replay"){mode="story";bi=0;playBeat();return;}
  var act=b.getAttribute("data-act"),i=parseInt(b.getAttribute("data-i"),10),k=parseInt(b.getAttribute("data-k"),10);
  if(!act)return;
  if(quizAct(act,i,k)){drawDlg();if(hooks.onProgress)hooks.onProgress();var nb=el.querySelector('[data-act="nextq"]');if(nb)nb.focus({preventScroll:true});return;}
  if(act==="nextq"){justOk[i]=0;if(isDone(i)){mode="done";if(cur&&cur.fx&&cur.fx.win)cur.fx.win();}drawDlg();if(hooks.onProgress)hooks.onProgress();focusDlg();}
}
function focusDlg(){var q=el.querySelector("#qt")||el.querySelector(".dtx");if(q){q.setAttribute("tabindex","-1");q.focus({preventScroll:true});}}
function open(i,h){
  if(!T)return false;ensureDom();hooks=h||{};stI=i;reduceM=rm();
  if(!R){try{R=new T.WebGLRenderer({antialias:true,powerPreference:"high-performance"});}catch(e){return false;}
    R.toneMapping=T.ACESFilmicToneMapping;R.toneMappingExposure=1.05;R.shadowMap.enabled=true;R.shadowMap.type=T.PCFSoftShadowMap;cv=R.domElement;cv.className="stcv";host.appendChild(cv);}
  clearScene();scene=scene||new T.Scene();scene.fog=new T.Fog("#eadcc0",60,260);cam=new T.PerspectiveCamera(46,1,.1,2000);
  skyNow=null;mkSky();
  el.querySelector(".stt").textContent="Stasiun "+(i+1)+" · "+S[i].t;
  el.hidden=false;document.documentElement.classList.add("stg-on");resize();
  mode=isDone(i)?"done":"story";beats=stepsFor(i);bi=0;hsClear();
  el.querySelector(".stdlg").innerHTML='<p class="dtx">Memuat adegan…</p>';
  var sf=sceneFor(i);
  sf.f(function(c){
    cur=c;setSky(c.sky,1);skyTick(performance.now()+5);var sh=shotOf(c.shots[(beats[0]&&beats[0].shot)]||c.shots[Object.keys(c.shots)[0]]);
    cam.position.copy(V(sh.p));camA={p:V(sh.p),l:V(sh.l)};camB=null;cam.lookAt(V(sh.l));
    live=true;lastT=0;if(!raf)raf=requestAnimationFrame(frame);
    if(mode==="story")playBeat();else drawDlg();
    var x=el.querySelector(".stx");if(x)x.focus({preventScroll:true});
  },sf.arg);
  return true;
}
function close(){
  if(!el||el.hidden)return;hsClear();live=false;if(raf)cancelAnimationFrame(raf);raf=0;clearInterval(typing);
  el.hidden=true;document.documentElement.classList.remove("stg-on");clearScene();cur=null;
  if(hooks.onClose)hooks.onClose(stI);
}
document.addEventListener("visibilitychange",function(){if(live&&!document.hidden&&!raf)raf=requestAnimationFrame(frame);});
return {open:open,close:close,isOpen:function(){return !!(el&&!el.hidden);},_dbg:function(){var v=new T.Vector3();return {cam:cam.position.toArray().map(Math.round),off:cam.view,hs:hs.map(function(o){v.copy(o.v).project(cam);return v.toArray().map(function(x){return +x.toFixed(2);});})};},want:function(){return sx.want;},beats:stepsFor,step:function(){return beats[bi]&&{k:beats[bi].k||"beat",act:beats[bi].act,done:!!sx.done,found:Object.keys(sx.found||{}).length};},mode:function(){return mode;},KISAH:typeof KISAH3!=="undefined"?KISAH3:{}};
})();
