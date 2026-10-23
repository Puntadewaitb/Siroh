/* ---------- State permainan bersama (versi utama & peta 3D) ---------- */
var KEY="peta-sirah-v2",NQ=3;
var st={mode:"s",open:0,learn:false,mt:{},prog:{s:{qd:{},pts:0,tl:false},d:{qd:{},pts:0,tl:false}}};
var wrong=[],justOk={},tl={seq:[],order:[],msg:"",ok:false};

function load(){
  try{var v=JSON.parse(localStorage.getItem(KEY));if(v&&v.prog){st.prog=v.prog;st.mode=v.mode||"s";return;}}catch(e){}
  try{var o=JSON.parse(localStorage.getItem("peta-sirah-v1"));
    if(o&&o.prog){["s","d"].forEach(function(m){var p=o.prog[m];if(!p)return;Object.keys(p.done||{}).forEach(function(i){st.prog[m].qd[i]=1;});st.prog[m].pts=p.pts||0;st.prog[m].tl=false;});st.mode=o.mode||"s";}}catch(e){}
}
function save(){try{localStorage.setItem(KEY,JSON.stringify({prog:st.prog,mode:st.mode}));}catch(e){}}
function P(){return st.prog[st.mode];}
function got(i){return P().qd[i]||0;}
function isDone(i){return got(i)>=NQ;}
function doneCount(){var n=0;for(var i=0;i<S.length;i++)if(isDone(i))n++;return n;}
function qCount(){var n=0;for(var i=0;i<S.length;i++)n+=Math.min(got(i),NQ);return n;}
function unlocked(i){return st.learn||i===0||isDone(i-1);}
function esc(x){return String(x).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
function firstOpen(){for(var i=0;i<S.length;i++){if(!isDone(i))return i;}return S.length;}
function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}
function newTL(){var n=TL[st.mode].length;var idx=[];for(var i=0;i<n;i++)idx.push(i);var o=shuffle(idx);var tries=0;while(tries<5&&o.join()===idx.join()){o=shuffle(idx);tries++;}tl={seq:[],order:o,msg:"",ok:false};}

/* Nomor halaman buku disimpan di data untuk verifikasi, tetapi tidak ditampilkan ke pemain. */
function noHlm(s){
  s=String(s).replace(/\s*\((?:[^()]*?\s)?hlm\.[^)]*\)/gi,"")
    .replace(/(^|[.!?]\s+)Hlm\.\s*[\d–\-, ]+:\s*(\S)/g,function(_,a,c){return a+c.toUpperCase();})
    .replace(/,?\s*(?:bab\s+)?hlm\.\s*[\d–\-]+(?:\s*,\s*[\d–\-]+)*/gi,"")
    .replace(/\s+([.,;:])/g,"$1").replace(/\s{2,}/g," ").trim();
  return s;
}
