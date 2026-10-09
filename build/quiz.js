/* ---------- Bank soal, hati, rotasi soal, dan tipe soal ----------
   Tiap stasiun punya bank 10 soal per level. Satu percobaan = 3 soal acak dari bank.
   Salah = hilang 1 hati; hati habis -> stasiun diulang dengan 3 soal baru dari bank.
   Tipe: mc (pilihan ganda), mu (pilih 2 dari 5), or (urutkan), mt (jodohkan). */
var MAXH=3;
var BK=S.map(function(s,i){var o={};["s","d"].forEach(function(m){var b=[s.q[m]].concat(X[i][m],Z[i][m]);b.forEach(function(q){if(!q.ty)q.ty="mc";});o[m]=b;});return o;});
var fl={},uq={};
function pz(){var p=P();p.set=p.set||{};p.seen=p.seen||{};p.hp=p.hp||{};p.fail=p.fail||{};return p;}
function hp(i){var p=pz();return p.hp[i]==null?MAXH:p.hp[i];}
function drawSet(i,avoid){
  var p=pz(),n=BK[i][st.mode].length,seen=(p.seen[i]||[]).slice(),pool=[],k;avoid=avoid||[];
  for(k=0;k<n;k++)if(seen.indexOf(k)<0&&avoid.indexOf(k)<0)pool.push(k);
  if(pool.length<3){seen=[];pool=[];for(k=0;k<n;k++)if(avoid.indexOf(k)<0)pool.push(k);if(pool.length<3){pool=[];for(k=0;k<n;k++)pool.push(k);}}
  pool=shuffle(pool);var pick=pool.slice(0,3),b=BK[i][st.mode];
  function isMC(x){return b[x].ty==="mc";}
  if(!pick.some(isMC)){var alt=pool.slice(3).filter(isMC)[0];if(alt!=null)pick[2]=alt;}
  p.seen[i]=seen.concat(pick);return pick;
}
function QS(i){
  var p=pz(),b=BK[i][st.mode],s=p.set[i];
  if(!s){s=(p.qd[i]>0)?[0,1,2]:drawSet(i);p.set[i]=s;save();}
  return s.map(function(k){return b[k];});
}
function U(i,c){
  var u=uq[i];
  if(!u||u.c!==c){
    u=uq[i]={c:c,sel:[],seq:[],mt:{},tries:0,msg:"",ord:null,rord:null};
  }
  return u;
}
function ansText(q){
  if(q.ty==="mu")return q.a.map(function(k){return q.o[k];}).join(" · ");
  if(q.ty==="or")return q.it.join(" → ");
  if(q.ty==="mt")return q.l.map(function(l,k){return l+" = "+q.r[k];}).join("; ");
  return q.o[q.a];
}
function heartsHTML(i){
  var n=hp(i),s="";for(var k=0;k<MAXH;k++)s+=k<n?"♥":"♡";
  return '<span class="hearts" role="img" aria-label="Sisa hati '+n+' dari '+MAXH+'">'+s+'</span>';
}
function shuffled(n,keep){
  var idx=[],o,t=0;for(var k=0;k<n;k++)idx.push(k);
  o=shuffle(idx);while(t<6&&o.join()===idx.join()){o=shuffle(idx);t++;}return o;
}
var HINT={mc:"",mu:"Pilih 2 jawaban yang benar.",or:"Ketuk dari yang paling awal. Ketuk lagi untuk membatalkan.",mt:"Jodohkan setiap item di kiri dengan pasangannya."};

function qBlock(i){
  var m=st.mode,qs=QS(i),n=got(i),h="",lbl=(m==="s"?"SMP":"dewasa");
  if(fl[i]){
    return '<div class="q failbox"><span class="lbl">Hati habis</span><p class="qt">♡♡♡ Stasiun ini diulang dengan soal baru.</p><p>Baca lagi ringkasan dan peta di atas, lalu coba lagi. Soalnya diambil dari bank yang berbeda.</p><button class="btn" data-act="retry" data-i="'+i+'">Mulai lagi</button></div>';
  }
  if(isDone(i)&&!justOk[i]){
    h+='<div class="q"><span class="lbl">Ulasan · '+lbl+'</span>';
    qs.forEach(function(q,k){h+='<div class="rv"><p class="qt">'+(k+1)+'. '+esc(q.t)+'</p><p class="ans">Jawaban: '+esc(ansText(q))+'</p><p class="fb good">'+esc(q.e)+' <span class="ref">'+esc(q.h)+'</span></p></div>';});
    return h+'</div>';
  }
  var c=justOk[i]?n-1:n,q=qs[c],u=U(i,c),ok=!!justOk[i],w=wrong[i]||[];
  h+='<div class="q"><div class="qh"><span class="lbl">Pertanyaan '+(c+1)+' dari '+NQ+' · '+lbl+'</span>'+heartsHTML(i)+'</div><p class="qt" tabindex="-1" id="qt">'+esc(q.t)+'</p>';
  if(HINT[q.ty])h+='<p class="hint">'+HINT[q.ty]+'</p>';
  if(q.ty==="mc"){
    h+='<div class="opts">';
    q.o.forEach(function(o,k){
      var cls="opt",dis="";
      if(ok){dis=" disabled";if(k===q.a)cls+=" ok";}
      else if(w.indexOf(k)>-1){cls+=" bad";dis=" disabled";}
      h+='<button class="'+cls+'" data-act="ans" data-i="'+i+'" data-k="'+k+'"'+dis+'>'+esc(o)+'</button>';
    });
    h+='</div>';
  }else if(q.ty==="mu"){
    h+='<div class="opts">';
    q.o.forEach(function(o,k){
      var on=u.sel.indexOf(k)>-1,cls="opt"+(ok?(q.a.indexOf(k)>-1?" ok":""):(on?" pick":""));
      h+='<button class="'+cls+'" data-act="msel" data-i="'+i+'" data-k="'+k+'" aria-pressed="'+(ok?q.a.indexOf(k)>-1:on)+'"'+(ok?" disabled":"")+'>'+esc(o)+'</button>';
    });
    h+='</div>';
    if(!ok)h+='<button class="btn" data-act="mchk" data-i="'+i+'"'+(u.sel.length===2?"":" disabled")+'>Periksa jawaban</button>';
  }else if(q.ty==="or"){
    if(!u.ord)u.ord=shuffled(q.it.length);
    if(ok){h+='<ol class="seq">'+q.it.map(function(t,k){return '<li><span class="okrow"><span class="n">'+(k+1)+'.</span>'+esc(t)+'</span></li>';}).join("")+'</ol>';}
    else{
      h+='<span class="tag">Pilihan</span><ul class="pool">';
      u.ord.forEach(function(k){if(u.seq.indexOf(k)<0)h+='<li><button data-act="opk" data-i="'+i+'" data-k="'+k+'">'+esc(q.it[k])+'</button></li>';});
      h+='</ul><span class="tag">Urutanmu</span><ol class="seq">';
      u.seq.forEach(function(k,x){h+='<li><button data-act="ouk" data-i="'+i+'" data-k="'+k+'"><span class="n">'+(x+1)+'.</span>'+esc(q.it[k])+'</button></li>';});
      h+='</ol><button class="btn" data-act="ochk" data-i="'+i+'"'+(u.seq.length===q.it.length?"":" disabled")+'>Periksa urutan</button>';
    }
  }else if(q.ty==="mt"){
    if(!u.rord)u.rord=shuffled(q.r.length);
    h+='<div class="mtg">';
    q.l.forEach(function(l,k){
      h+='<div class="mtr"><span class="mtl">'+esc(l)+'</span><select data-act="msl" data-i="'+i+'" data-l="'+k+'" aria-label="Pasangan untuk '+esc(l)+'"'+(ok?" disabled":"")+'><option value="">Pilih…</option>'+
        u.rord.map(function(r){var sel=ok?(r===k):(String(u.mt[k])===String(r));return '<option value="'+r+'"'+(sel?" selected":"")+'>'+esc(q.r[r])+'</option>';}).join("")+'</select></div>';
    });
    h+='</div>';
    if(!ok)h+='<button class="btn" data-act="mtchk" data-i="'+i+'"'+(Object.keys(u.mt).filter(function(k){return u.mt[k]!==""&&u.mt[k]!=null;}).length===q.l.length?"":" disabled")+'>Periksa pasangan</button>';
  }
  h+='<div aria-live="polite">';
  if(ok)h+='<p class="fb good">'+esc(q.e)+' <span class="ref">'+esc(q.h)+'</span></p>';
  else if(u.msg)h+='<p class="fb err">'+u.msg+'</p>';
  h+='</div>';
  if(ok){
    if(c<NQ-1)h+='<button class="btn" data-act="nextq" data-i="'+i+'">Soal berikutnya</button>';
    else h+='<button class="btn" data-act="nextq" data-i="'+i+'">Selesai: lihat ulasan</button>';
  }
  return h+'</div>';
}
function solved(i,u){
  var p=pz();
  p.qd[i]=got(i)+1;p.pts+=(st.mode==="s"?4:8)/(u.tries>0?2:1);
  justOk[i]=1;wrong[i]=[];u.msg="";save();
}
function failStation(i){
  var p=pz();
  p.qd[i]=0;p.fail[i]=(p.fail[i]||0)+1;
  p.set[i]=drawSet(i,p.set[i]||[]);p.hp[i]=MAXH;
  justOk[i]=0;wrong[i]=[];delete uq[i];fl[i]=true;
}
function miss(i,u,msg,k){
  var p=pz();u.tries++;p.hp[i]=hp(i)-1;
  if(k!=null)wrong[i]=(wrong[i]||[]).concat([k]);
  u.msg=msg+" Buka "+esc(QS(i)[got(i)].h)+" di buku untuk memeriksa.";
  if(p.hp[i]<=0){failStation(i);}
  save();
}
/* Mengembalikan true bila aksi ini milik mesin soal */
function quizAct(act,i,k){
  var q,u,c;
  if(act==="retry"){fl[i]=false;return true;}
  if(["ans","msel","mchk","opk","ouk","ochk","mtchk"].indexOf(act)<0)return false;
  c=got(i);q=QS(i)[c];u=U(i,c);
  if(isDone(i)||justOk[i]||fl[i])return true;
  if(act==="ans"){if(k===q.a)solved(i,u);else miss(i,u,"Belum tepat.",k);return true;}
  if(act==="msel"){var x=u.sel.indexOf(k);if(x>-1)u.sel.splice(x,1);else if(u.sel.length<2)u.sel.push(k);else{u.sel.shift();u.sel.push(k);}u.msg="";return true;}
  if(act==="mchk"){
    var s=u.sel.slice().sort(function(a,b){return a-b;}),hit=s.filter(function(v){return q.a.indexOf(v)>-1;}).length;
    if(hit===2)solved(i,u);else{u.sel=[];miss(i,u,hit+" dari 2 pilihan sudah benar.");}
    return true;
  }
  if(act==="opk"){u.seq.push(k);u.msg="";return true;}
  if(act==="ouk"){u.seq=u.seq.filter(function(v){return v!==k;});u.msg="";return true;}
  if(act==="ochk"){
    var r=0;u.seq.forEach(function(v,x){if(v===x)r++;});
    if(r===q.it.length)solved(i,u);else{u.seq=[];miss(i,u,r+" dari "+q.it.length+" posisi sudah tepat.");}
    return true;
  }
  if(act==="mtchk"){
    var r2=0;q.l.forEach(function(_,x){if(String(u.mt[x])===String(x))r2++;});
    if(r2===q.l.length)solved(i,u);else{u.mt={};miss(i,u,r2+" dari "+q.l.length+" pasangan sudah tepat.");}
    return true;
  }
  return false;
}
function quizChange(sel){
  var i=parseInt(sel.getAttribute("data-i"),10),l=sel.getAttribute("data-l"),u=U(i,got(i));
  u.mt[l]=sel.value===""?null:sel.value;u.msg="";
}
