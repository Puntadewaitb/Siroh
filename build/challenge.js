/* ---------- Tantangan acak + lencana ---------- */
var CHN=10,ch={on:false,qs:[],n:0,score:0,streak:0,maxStreak:0,pick:-1,log:[],fin:false};
function chPool(){
  var pool=[];
  for(var i=0;i<S.length;i++){
    if(!(st.learn||isDone(i)))continue;
    BK[i][st.mode].forEach(function(q){if(q.ty==="mc")pool.push({i:i,q:q});});
  }
  return pool;
}
function chStart(){
  var pool=shuffle(chPool()).slice(0,CHN);
  ch={on:true,fin:false,n:0,score:0,streak:0,maxStreak:0,pick:-1,log:[],qs:pool.map(function(p){
    var idx=shuffle(p.q.o.map(function(_,k){return k;}));
    return {i:p.i,t:p.q.t,o:idx.map(function(k){return p.q.o[k];}),a:idx.indexOf(p.q.a),e:p.q.e,h:p.q.h};
  })};
}
function chAnswer(k){
  var q=ch.qs[ch.n];if(ch.pick>-1)return;
  ch.pick=k;
  if(k===q.a){ch.score++;ch.streak++;if(ch.streak>ch.maxStreak)ch.maxStreak=ch.streak;}
  else{ch.streak=0;ch.log.push(q);}
}
function chNext(){
  ch.pick=-1;ch.n++;
  if(ch.n>=ch.qs.length){
    ch.fin=true;var p=P();
    p.chBest=Math.max(p.chBest||0,ch.score);
    if(ch.score===ch.qs.length)p.chPerfect=true;
    save();
  }
}
function badgeList(){
  var p=P(),b=BANDS.map(function(x){
    var ok=true;for(var i=x.from;i<=x.to;i++)if(!isDone(i))ok=false;
    return {t:x.t,ok:ok};
  });
  b.push({t:"Ujian urutan peristiwa",ok:!!p.tl});
  b.push({t:"Tantangan acak sempurna",ok:!!p.chPerfect});
  return b;
}
function badgesHTML(){
  return '<ul class="badges" aria-label="Lencana">'+badgeList().map(function(b){
    return '<li class="'+(b.ok?'on':'off')+'"><span aria-hidden="true">'+(b.ok?'★':'☆')+'</span> '+esc(b.t)+'<span class="sr"> '+(b.ok?'diraih':'belum')+'</span></li>';
  }).join("")+'</ul>';
}
function chHTML(){
  var p=P(),pool=chPool(),h='';
  if(!ch.on){
    var n=Math.min(CHN,pool.length);
    h='<p>Soal acak dari stasiun yang sudah kamu selesaikan (opsi diacak, satu soal satu kali). Cocok buat mengulang sebelum lanjut.</p>';
    if(!pool.length)h+='<p class="fb err">Selesaikan minimal satu stasiun dulu, atau nyalakan Mode belajar.</p>';
    else h+='<p class="muted">'+pool.length+' soal tersedia · tantangan '+n+' soal'+(p.chBest?' · skor terbaik '+p.chBest+'':'')+'</p><button class="btn" data-ch="start">Mulai tantangan</button>';
    return h;
  }
  if(ch.fin){
    h='<div aria-live="polite"><p class="chscore">Skor '+ch.score+' / '+ch.qs.length+' · rentetan benar terpanjang '+ch.maxStreak+'</p></div>';
    if(ch.log.length){
      h+='<p>Perlu diulang (rujuk buku):</p><ul class="chlog">'+ch.log.map(function(q){return '<li><b>'+esc(S[q.i].t)+'</b> · '+esc(q.h)+'<br>'+esc(q.t)+' <i>→ '+esc(q.o[q.a])+'</i></li>';}).join("")+'</ul>';
    }else h+='<p class="fb good">Sempurna. Semua jawaban benar.</p>';
    return h+'<div class="row"><button class="btn" data-ch="start">Main lagi</button><button class="btn ghost" data-ch="close">Tutup</button></div>';
  }
  var q=ch.qs[ch.n],done=ch.pick>-1;
  h='<p class="muted">Soal '+(ch.n+1)+' dari '+ch.qs.length+' · skor '+ch.score+' · rentetan '+ch.streak+'</p>';
  h+='<p class="qt">'+esc(q.t)+'</p><div class="opts">';
  q.o.forEach(function(o,k){
    var cls="opt";if(done){if(k===q.a)cls+=" ok";else if(k===ch.pick)cls+=" bad";}
    h+='<button class="'+cls+'" data-ch="ans" data-k="'+k+'"'+(done?' disabled':'')+'>'+esc(o)+'</button>';
  });
  h+='</div><div aria-live="polite">';
  if(done)h+='<p class="fb '+(ch.pick===q.a?'good':'err')+'">'+(ch.pick===q.a?'Benar. ':'Belum tepat. ')+esc(q.e)+' <span class="ref">'+esc(q.h)+'</span></p>';
  h+='</div>';
  if(done)h+='<button class="btn" data-ch="next" id="chnext">'+(ch.n+1>=ch.qs.length?'Lihat hasil':'Soal berikutnya')+'</button>';
  return h;
}
function chRender(){
  var el=document.getElementById("ch");if(el)el.innerHTML=chHTML();
  var bd=document.getElementById("badges");if(bd)bd.innerHTML=badgesHTML();
}
document.getElementById("ch").addEventListener("click",function(e){
  var b=e.target.closest("button");if(!b)return;
  var a=b.getAttribute("data-ch");
  if(a==="start")chStart();
  else if(a==="close")ch.on=false;
  else if(a==="ans")chAnswer(parseInt(b.getAttribute("data-k"),10));
  else if(a==="next")chNext();
  chRender();
  var nb=document.getElementById("chnext");if(nb)nb.focus({preventScroll:true});
});
