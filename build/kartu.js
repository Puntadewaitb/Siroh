/* ---------- Album kartu koleksi: 3 kartu (tokoh, tempat, peristiwa) per stasiun, didapat saat stasiun selesai ---------- */
var KJ={tokoh:{n:"Tokoh",i:"✦"},tempat:{n:"Tempat",i:"⌖"},peristiwa:{n:"Peristiwa",i:"✧"}};
function kartuOf(i){return KARTU[i]||[];}
function kartuCount(){var n=0;for(var i=0;i<S.length;i++)if(isDone(i))n+=kartuOf(i).length;return n;}
function kartuTotal(){var n=0;for(var i=0;i<S.length;i++)n+=kartuOf(i).length;return n;}
function kartuNames(i){return kartuOf(i).map(function(c){return c.n;}).join(", ");}
function albumHTML(){
  var h='<p class="mut3">Selesaikan stasiun untuk membuka kartunya. Terkumpul <b>'+kartuCount()+'</b> dari '+kartuTotal()+' kartu (level '+(st.mode==="s"?"SMP":"dewasa")+').</p>';
  BANDS.forEach(function(b){
    h+='<h3 class="kb">'+esc(b.t)+'</h3><div class="kg">';
    for(var i=b.from;i<=b.to;i++){
      if(!isDone(i)){h+='<article class="kc off"><p class="kk"><span aria-hidden="true">?</span> Stasiun '+(i+1)+' · '+kartuOf(i).length+' kartu</p><p>Selesaikan stasiun '+(i+1)+': '+esc(S[i].t)+'.</p></article>';continue;}
      kartuOf(i).forEach(function(c){var j=KJ[c.k]||KJ.peristiwa;
        h+='<article class="kc k-'+c.k+'"><p class="kk"><span aria-hidden="true">'+j.i+'</span> '+j.n+' · Stasiun '+(i+1)+'</p><h4>'+esc(c.n)+'</h4><p>'+esc(c.t)+'</p></article>';});
    }
    h+='</div>';
  });
  return h+'<h3 class="kb">Lencana</h3>'+badgesHTML();
}
