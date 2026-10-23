/* ---------- Latihan harian: soal yang pernah salah muncul lagi (pengulangan berjarak sederhana) ----------
   P().rv["i:k"] = {b: kotak 0-4, due: hari jatuh tempo}. Benar -> naik kotak (jeda 1/2/4/7/14 hari), salah -> kembali ke kotak 0.
   P().lh = {last: hari terakhir latihan, streak: hari berturut-turut}. Poin latihan hanya sekali sehari. */
var BOXD=[1,2,4,7,14],LTN=5,lt={on:false};
function today(){var d=new Date();return Math.floor((d.getTime()-d.getTimezoneOffset()*60000)/864e5);}
function rvs(){var p=P();p.rv=p.rv||{};return p.rv;}
function rvMiss(i,k){if(k==null||!BK[i][st.mode][k]||BK[i][st.mode][k].ty!=="mc")return;rvs()[i+":"+k]={b:0,due:today()};}
function rvGood(key){var r=rvs(),x=r[key];if(!x)return;x.b=Math.min(x.b+1,BOXD.length-1);x.due=today()+BOXD[x.b];}
function rvBad(key){rvs()[key]={b:0,due:today()+1};}
function rvDue(){var r=rvs(),t=today();return Object.keys(r).filter(function(k){return r[k].due<=t;});}
function lh(){var p=P();p.lh=p.lh||{last:-1,streak:0};return p.lh;}
function ltStreak(){var h=lh();return h.last>=today()-1?h.streak:0;}
function ltPool(){
  var due=shuffle(rvDue()),out=due.slice(0,LTN),have={};out.forEach(function(k){have[k]=1;});
  if(out.length<LTN){
    var fill=[];
    for(var i=0;i<S.length;i++){if(!got(i)&&!isDone(i))continue;BK[i][st.mode].forEach(function(q,k){if(q.ty==="mc"&&!have[i+":"+k])fill.push(i+":"+k);});}
    out=out.concat(shuffle(fill).slice(0,LTN-out.length));
  }
  return out;
}
function ltStart(){
  var keys=ltPool();
  lt={on:true,fin:false,n:0,score:0,pick:-1,due:rvDue().length,qs:keys.map(function(key){
    var ik=key.split(":"),i=+ik[0],q=BK[i][st.mode][+ik[1]],idx=shuffle(q.o.map(function(_,k){return k;}));
    return {key:key,i:i,t:q.t,o:idx.map(function(k){return q.o[k];}),a:idx.indexOf(q.a),e:q.e};})};
}
function ltAct(a,k){
  if(a==="start"){ltStart();return;}
  if(a==="ans"){var q=lt.qs[lt.n];if(lt.pick>-1)return;lt.pick=k;if(k===q.a){lt.score++;rvGood(q.key);}else rvBad(q.key);save();return;}
  if(a==="next"){lt.pick=-1;lt.n++;if(lt.n>=lt.qs.length)ltFinish();}
}
function ltFinish(){
  var h=lh(),t=today(),p=P();lt.fin=true;lt.first=h.last!==t;
  if(lt.first){h.streak=h.last===t-1?h.streak+1:1;h.best=Math.max(h.best||0,h.streak);h.last=t;lt.gain=lt.score*2;p.pts+=lt.gain;}
  save();
}
function ltHTML(){
  var h='';
  if(!lt.on){
    var due=rvDue().length,pool=ltPool().length,sk=ltStreak();
    h='<p>Lima soal sehari. Soal yang pernah kamu jawab salah muncul lagi di sini, jedanya makin panjang kalau kamu sudah ingat. Sisanya diambil acak dari stasiun yang sudah kamu kerjakan.</p>';
    h+='<p class="mut3">Perlu diulang hari ini: <b>'+due+'</b> soal · rentetan hari: <b>'+sk+'</b>'+(lh().last===today()?' · latihan hari ini sudah selesai (boleh main lagi, tanpa poin)':'')+'</p>';
    if(!pool)h+='<p class="fb err">Kerjakan minimal satu stasiun dulu.</p>';
    else h+='<button class="btn" data-lt="start">Mulai latihan</button>';
    return h;
  }
  if(lt.fin){
    h='<div aria-live="polite"><p class="chscore">Benar '+lt.score+' / '+lt.qs.length+'</p>';
    h+=lt.first?'<p class="fb good">+'+lt.gain+' poin. Rentetan latihan: '+lh().streak+' hari. Sampai jumpa besok!</p>':'<p class="mut3">Latihan tambahan hari ini (poin hanya sekali sehari).</p>';
    return h+'</div><button class="btn" data-lt="start">Latihan lagi</button>';
  }
  var q=lt.qs[lt.n],done=lt.pick>-1;
  h='<p class="mut3">Soal '+(lt.n+1)+' dari '+lt.qs.length+' · Stasiun '+(q.i+1)+': '+esc(S[q.i].t)+(rvs()[q.key]&&!done?' · <b>diulang</b>':'')+'</p><p class="qt">'+esc(q.t)+'</p><div class="opts">';
  q.o.forEach(function(o,k){var c="opt";if(done){if(k===q.a)c+=" ok";else if(k===lt.pick)c+=" bad";}
    h+='<button class="'+c+'" data-lt="ans" data-k="'+k+'"'+(done?' disabled':'')+'>'+esc(o)+'</button>';});
  h+='</div><div aria-live="polite">';
  if(done)h+='<p class="fb '+(lt.pick===q.a?'good':'err')+'">'+(lt.pick===q.a?'Benar. ':'Belum tepat, besok soal ini muncul lagi. ')+esc(noHlm(q.e))+'</p>';
  h+='</div>';
  if(done)h+='<button class="btn" data-lt="next" id="ltnext">'+(lt.n+1>=lt.qs.length?'Lihat hasil':'Soal berikutnya')+'</button>';
  return h;
}
