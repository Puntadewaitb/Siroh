// Lint bank soal: struktur tiap tipe, indeks jawaban, rujukan halaman, duplikasi, dan bias panjang opsi.
import fs from "node:fs";import vm from "node:vm";
const html=fs.readFileSync(new URL("../index.html",import.meta.url),"utf8");
const js=html.split("<script>")[1].split("</script>")[0];
const stub={getElementById:()=>({addEventListener(){},setAttribute(){},style:{},clientWidth:360,innerHTML:""}),querySelector:()=>null,addEventListener(){}};
const ctx={document:stub,window:{addEventListener(){}},localStorage:{getItem:()=>null,setItem(){}},Math,JSON,console};
vm.createContext(ctx);
vm.runInContext(js.split("/* ---------- Peta ---------- */")[0].replace(/\nfunction load\(\)[\s\S]*$/,"")+";this.S=S;this.BK=BK;this.TL=TL;this.BANDS=BANDS;",ctx);
const {S,BK,TL,BANDS}=ctx;let err=0;const bad=m=>{console.error("FAIL",m);err++;};
const BANKSIZE=10,HLM=/hlm\. [\divx]+/;
if(S.length!==18)bad("stasiun!=18");
const stats={s:{uniq:0,mc:0},d:{uniq:0,mc:0}},types={};
S.forEach((s,i)=>["s","d"].forEach(m=>{
  const b=BK[i][m];if(b.length!==BANKSIZE)bad(`st${i+1} ${m}: bank ${b.length} soal (harus ${BANKSIZE})`);
  if(new Set(b.map(q=>q.t)).size!==b.length)bad(`st${i+1} ${m}: soal kembar`);
  const ty={};b.forEach((q,k)=>{const id=`st${i+1} ${m} q${k+1} [${q.ty}]`;ty[q.ty]=(ty[q.ty]||0)+1;types[q.ty]=(types[q.ty]||0)+1;
    if(!q.e||q.e.length<10)bad(id+": penjelasan kosong");
    if(!HLM.test(q.h))bad(id+": rujukan hlm ("+q.h+")");
    if(q.ty==="mc"){
      const n=m==="s"?3:4;
      if(q.o.length<3||q.o.length>n)bad(id+": jumlah opsi");
      if(!(q.a>=0&&q.a<q.o.length))bad(id+": indeks a");
      if(new Set(q.o).size!==q.o.length)bad(id+": opsi duplikat");
      const L=q.o.map(o=>o.length),c=L[q.a],mx=Math.max(...L),oth=L.filter((_,j)=>j!==q.a),avg=oth.reduce((a,b)=>a+b,0)/oth.length;
      stats[m].mc++;if(c===mx&&L.filter(l=>l===mx).length===1)stats[m].uniq++;
      if(c>2.2*avg&&c>20)bad(id+": jawaban benar jauh lebih panjang dari opsi lain");
    }else if(q.ty==="mu"){
      if(q.o.length!==5||new Set(q.o).size!==5)bad(id+": harus 5 opsi berbeda");
      if(q.a.length!==2||q.a[0]===q.a[1]||q.a.some(k=>k<0||k>4))bad(id+": harus 2 jawaban benar");
    }else if(q.ty==="or"){
      const n=m==="s"?3:4;if(q.it.length!==n||new Set(q.it).size!==n)bad(id+`: harus ${n} item berbeda`);
    }else if(q.ty==="mt"){
      if(q.l.length!==3||q.r.length!==3||new Set(q.l).size!==3||new Set(q.r).size!==3)bad(id+": harus 3 pasangan berbeda");
    }else bad(id+": tipe tidak dikenal");
  });
  if(!ty.mu||!ty.or||!ty.mt)bad(`st${i+1} ${m}: bank harus memuat tipe mu, or, mt (${JSON.stringify(ty)})`);
}));
["s","d"].forEach(m=>{const t=stats[m];if(t.uniq/t.mc>0.4)bad(`level ${m}: jawaban benar jadi opsi terpanjang di ${t.uniq}/${t.mc} soal mc (>40%)`);});
["s","d"].forEach(m=>TL[m].forEach((e,k)=>{if(!e[0]||!/\d/.test(String(e[1])))bad(`TL ${m}[${k}]`)}));
let prev=-1;BANDS.forEach(b=>{if(b.from!==prev+1)bad("BANDS gap "+b.t);prev=b.to});if(prev!==17)bad("BANDS tidak sampai 17");
console.log(err?`${err} masalah`:`Data OK: 18 stasiun x ${BANKSIZE} soal x 2 level (${JSON.stringify(types)})`);process.exit(err?1:0);
