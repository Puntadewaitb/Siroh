/* ---------- Ujian urutan peristiwa (stasiun akhir) ---------- */
function tlBody(){
  var ev=TL[st.mode];
  if(!tl.order.length||tl.order.length!==ev.length)newTL();
  var h='<div class="tl"><p>Ketuk peristiwa dari yang paling awal. Ketuk lagi di urutanmu untuk membatalkan.</p>';
  h+='<span class="tag">Pilihan</span><ul class="pool">';
  tl.order.forEach(function(idx){if(tl.seq.indexOf(idx)<0)h+='<li><button data-tl="pick" data-k="'+idx+'">'+esc(ev[idx][0])+'</button></li>';});
  h+='</ul><span class="tag">Urutanmu</span><ol class="seq">';
  tl.seq.forEach(function(idx,n){h+='<li><button data-tl="unpick" data-k="'+idx+'"><span class="n">'+(n+1)+'.</span>'+esc(ev[idx][0])+'</button></li>';});
  h+='</ol><div aria-live="polite">'+(tl.msg?'<p class="fb '+(tl.ok?'good':'err')+'">'+tl.msg+'</p>':'')+'</div>';
  h+='<div class="row"><button class="btn" data-tl="check">Periksa urutan</button><button class="btn ghost" data-tl="reset">Acak ulang</button></div></div>';
  if(P().tl)h+='<div class="end"><h3>Jalur selesai</h3><p>Kamu menamatkan ujian urutan di level '+(st.mode==="s"?"SMP":"dewasa")+'. Poinmu '+P().pts+'. Coba level lain untuk pertanyaan yang lebih dalam.</p></div>';
  return h;
}
function tlAct(a,k){
  var m=st.mode,p=P(),ev=TL[m];
  if(a==="pick"){if(tl.seq.indexOf(k)<0)tl.seq.push(k);tl.msg="";}
  else if(a==="unpick"){tl.seq=tl.seq.filter(function(x){return x!==k;});tl.msg="";}
  else if(a==="reset")newTL();
  else if(a==="check"){
    if(tl.seq.length<ev.length){tl.msg="Pilih semua "+ev.length+" peristiwa dulu sebelum memeriksa.";tl.ok=false;return;}
    var right=0;tl.seq.forEach(function(idx,n){if(idx===n)right++;});
    if(right===ev.length){
      if(!p.tl){p.tl=true;p.pts+=(m==="s"?30:60);save();}
      tl.ok=true;tl.msg="Urutan benar: "+ev.map(function(x){return esc(x[0]);}).join(" → ")+".";
    }else{tl.ok=false;tl.msg=right+" dari "+ev.length+" posisi sudah tepat. Periksa lagi urutannya.";}
  }
}
