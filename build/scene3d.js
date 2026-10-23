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
  var W=[[-6,8],[2,6],[9,10],[-14,12],[16,15]];W.forEach(function(w){well(w[0],h(w[0],w[1]),w[1]);});
  pool(-3,h(-3,14),14,5,3);
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
      after:{p:[-22,10,-2],l:[0,1,-30]}
    },
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
/* Pemetaan stasiun -> adegan */
var SKEY={2:"hira",10:"badr"};
function sceneFor(i){var k=SKEY[i];if(k)return {f:SCN[k]};var n=NODE_OF[i];
  if(n==="mk")return {f:SCN.makkah};if(n==="md")return {f:SCN.madinah};if(n==="bd")return {f:SCN.badr};return {f:SCN.place,arg:n};}

/* ---- Kisah (dari buku, dicek ke OCR) ---- */
var KISAH={
 2:[ {t:"Menjelang usia empat puluh tahun, Nabi paling suka menyendiri. Dengan bekal roti gandum dan air, beliau pergi ke Gua Hira di Jabal Nur, kira-kira dua mil dari Makkah.",h:"hlm. 61",shot:"wide"},
     {t:"Guanya kecil: panjangnya empat hasta. Selama bulan Ramadhan beliau beribadah di sana dan memberi makan orang miskin yang datang.",h:"hlm. 61",shot:"cave"},
     {t:"Tanda nubuwah diawali mimpi yang hakiki selama enam bulan. Setiap mimpi datang seperti fajar subuh yang menyingsing.",h:"hlm. 62",shot:"sky",sky:"dawn"},
     {t:"Lalu, menurut penetapan penulis, pada hari Senin malam 21 Ramadhan, Jibril datang di gua itu dan berkata, “Bacalah!” Turunlah ayat pertama, Al-‘Alaq 1–5.",h:"hlm. 62–64",shot:"cave",sky:"night",fx:"glowUp"},
     {t:"Beliau pulang dengan hati bergetar dan berkata kepada Khadijah, “Selimutilah aku!” Khadijah menenangkan beliau, lalu membawanya menemui Waraqah bin Naufal.",h:"hlm. 64",shot:"town",sky:"dawn",fx:"glowDown"} ],
 10:[ {t:"Kafilah dagang Quraisy pimpinan Abu Sufyan pulang dari Syam: 1.000 unta membawa harta tak kurang dari 5.000 dinar emas, dikawal tak lebih dari 40 orang.",h:"hlm. 233",shot:"route",fx:"caravan"},
      {t:"Rasulullah berangkat bersama 313 hingga 317 orang, dengan hanya dua kuda dan 70 unta. Panji hijau di layar melambangkan pasukan Muslimin.",h:"hlm. 234",shot:"mus",fx:"noCaravan"},
      {t:"Quraisy keluar dengan 1.300 orang, 100 kuda, dan 600 baju besi; yang terus maju ke Badr sekitar 1.000 orang. Panji merah melambangkan mereka.",h:"hlm. 235–237",shot:"qur"},
      {t:"Malam Jumat, 17 Ramadhan 2 H, hujan deras turun. Bagi kaum Muslimin pasir menjadi padat dan pijakan mantap; bagi musuh langkah terhambat.",h:"hlm. 242–244",shot:"wells",sky:"storm",fx:"rain"},
      {t:"Atas usul Al-Hubab bin Al-Mundzir, pasukan pindah ke mata air terdekat, membuat satu kolam berisi air, dan menimbun yang lain.",h:"hlm. 242–243",shot:"wells",sky:"night",fx:"dry"},
      {t:"Sa’d bin Mu’adz mengusulkan tenda komando. Tenda dibangun di tempat yang tinggi, di sebelah timur laut medan perang.",h:"hlm. 243",shot:"cmd",sky:"dawn"},
      {t:"Pagi harinya Quraisy turun dari Al-Udwatul-Qushwa ke lembah Badr. Pertempuran pecah; Rasulullah menaburkan segenggam pasir ke arah pasukan Quraisy.",h:"hlm. 244–251",shot:"field",sky:"day",fx:"battle",fx2:"sand"},
      {t:"Kemenangan nyata bagi kaum Muslimin. Empat belas orang Muslim syahid; dari pihak musyrik tujuh puluh tewas dan tujuh puluh tertawan.",h:"hlm. 261",shot:"after",fx:"fall"} ]
};
function beatsFor(i){
  if(KISAH[i])return KISAH[i];
  var s=S[i],txt=(s.r[st.mode]||s.r.s).split(/\.\s+/).map(function(x,k,a){return k<a.length-1?x+".":x;}),out=[],keys=["a","b","c","d"];
  for(var k=0;k<txt.length;k+=2)out.push({t:txt.slice(k,k+2).join(" "),h:"hlm. "+s.hlm,shot:keys[out.length%4]});
  return out.slice(0,4);
}

/* ---- Kamera ---- */
function V(a){return new T.Vector3(a[0],a[1],a[2]);}
function goShot(sh,ms){if(!sh)return;var p=cam.position.clone(),l=camA.l?camA.l.clone():V(sh.l);camA={p:p,l:l};camB={p:V(sh.p),l:V(sh.l)};camT0=performance.now();camMs=reduceM?1:(ms||2200);}
function camTick(t){
  if(!camB)return;var k=clamp((t-camT0)/camMs,0,1),e=ease(k);
  var p=camA.p.clone().lerp(camB.p,e),l=camA.l.clone().lerp(camB.l,e);
  if(!reduceM){var w=t/1000;p.x+=Math.sin(w*.23)*.6;p.y+=Math.sin(w*.31)*.25;p.z+=Math.cos(w*.19)*.6;}
  cam.position.copy(p);cam.lookAt(l);if(k>=1)camA.l=camB.l.clone();
  var sp=(skyTo||skyNow||SKY.day).pos;sun.target.position.copy(l);sun.position.set(l.x+sp[0],l.y+sp[1],l.z+sp[2]);
}

/* ---- Loop ---- */
function frame(t){
  raf=0;if(!live)return;var dt=Math.min(64,t-(lastT||t));lastT=t;
  skyTick(t);camTick(t);for(var i=upd.length-1;i>=0;i--){if(upd[i](t,dt)===true)upd.splice(i,1);}
  R.render(scene,cam);if(!document.hidden)raf=requestAnimationFrame(frame);
}
function resize(){if(!R||!host)return;var w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;R.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));R.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();}
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
    '<p class="stnote">Ilustrasi suasana, bukan rekonstruksi. Tanpa penggambaran tokoh.</p><div class="stdlg" role="region" aria-live="polite"></div>';
  document.body.appendChild(el);host=el.querySelector(".stc");
  el.addEventListener("click",onClick);el.addEventListener("change",function(e){var s=e.target.closest&&e.target.closest("select[data-act=msl]");if(s){quizChange(s);drawDlg();}});
  window.addEventListener("resize",resize);
  document.addEventListener("keydown",function(e){if(el.hidden)return;if(e.key==="Escape")close();});
}
function drawDlg(){
  var d=el.querySelector(".stdlg"),h="";
  d.classList.toggle("q",mode!=="story");
  if(mode==="story"){
    var b=beats[bi];
    h='<div class="dnar"><span>Kilasan kisah</span><span class="dots">'+beats.map(function(_,k){return '<i class="'+(k===bi?"on":k<bi?"was":"")+'"></i>';}).join("")+'</span></div>'+
      '<p class="dtx" id="dtx"></p><p class="dref">'+esc(b.h)+'</p><div class="dbt">'+
      '<button class="btn ghost" data-sa="skip">Lewati kisah</button>'+
      (bi>0?'<button class="btn ghost" data-sa="prev" aria-label="Sebelumnya">‹</button>':'')+
      '<button class="btn" data-sa="next">'+(bi<beats.length-1?"Lanjut ›":"Mulai uji ingatan ›")+'</button></div>';
    d.innerHTML=h;type(b.t);
  }else if(mode==="quiz"){
    if(isDone(stI)&&!justOk[stI]){mode="done";return drawDlg();}
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
  var b=beats[bi];if(!cur)return;
  goShot(cur.shots[b.shot]||cur.shots[Object.keys(cur.shots)[0]],bi===0?1:2200);
  if(b.sky)setSky(b.sky,1800);
  [b.fx,b.fx2].forEach(function(f,ix){if(f&&cur.fx&&cur.fx[f])setTimeout(cur.fx[f],ix?1200:0);});
  drawDlg();
}
function onClick(e){
  var b=e.target.closest("button");if(!b)return;var sa=b.getAttribute("data-sa");
  if(sa==="close"){close();return;}
  if(sa==="next"){if(typing){clearInterval(typing);typing=null;el.querySelector("#dtx").textContent=beats[bi].t;return;}
    if(bi<beats.length-1){bi++;playBeat();}else{mode="quiz";drawDlg();focusDlg();}return;}
  if(sa==="prev"){if(bi>0){bi--;playBeat();}return;}
  if(sa==="skip"){mode="quiz";drawDlg();focusDlg();return;}
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
  mode=isDone(i)?"done":"story";beats=beatsFor(i);bi=0;
  el.querySelector(".stdlg").innerHTML='<p class="dtx">Memuat adegan…</p>';
  var sf=sceneFor(i);
  sf.f(function(c){
    cur=c;setSky(c.sky,1);skyTick(performance.now()+5);var sh=c.shots[(beats[0]&&beats[0].shot)]||c.shots[Object.keys(c.shots)[0]];
    cam.position.copy(V(sh.p));camA={p:V(sh.p),l:V(sh.l)};camB=null;cam.lookAt(V(sh.l));
    live=true;lastT=0;if(!raf)raf=requestAnimationFrame(frame);
    if(mode==="story")playBeat();else drawDlg();
    var x=el.querySelector(".stx");if(x)x.focus({preventScroll:true});
  },sf.arg);
  return true;
}
function close(){
  if(!el||el.hidden)return;live=false;if(raf)cancelAnimationFrame(raf);raf=0;clearInterval(typing);
  el.hidden=true;document.documentElement.classList.remove("stg-on");clearScene();cur=null;
  if(hooks.onClose)hooks.onClose(stI);
}
document.addEventListener("visibilitychange",function(){if(live&&!document.hidden&&!raf)raf=requestAnimationFrame(frame);});
return {open:open,close:close,isOpen:function(){return !!(el&&!el.hidden);},beats:beatsFor,mode:function(){return mode;},KISAH:KISAH};
})();
