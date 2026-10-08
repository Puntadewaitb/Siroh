// Lint data soal: struktur, indeks jawaban, rujukan halaman, duplikasi opsi.
import fs from "node:fs";import vm from "node:vm";
const html=fs.readFileSync(new URL("../index.html",import.meta.url),"utf8");
const js=html.split("<script>")[1].split("</script>")[0];
const stub={getElementById:()=>({addEventListener(){},setAttribute(){},style:{},clientWidth:360,innerHTML:""}),querySelector:()=>null,addEventListener(){}};
const ctx={document:stub,window:{addEventListener(){}},localStorage:{getItem:()=>null,setItem(){}},Math,JSON,console};
vm.createContext(ctx);
vm.runInContext(js.split("/* ---------- Peta ---------- */")[0].replace(/\nfunction load\(\)[\s\S]*$/,"")+";this.S=S;this.X=X;this.TL=TL;this.BANDS=BANDS;",ctx);
const {S,X,TL,BANDS}=ctx;let err=0;const bad=m=>{console.error("FAIL",m);err++;};
if(S.length!==18)bad("stasiun!=18");
const HLM=/hlm\. [\divx]+/;
S.forEach((s,i)=>{["s","d"].forEach(m=>{
  const qs=[s.q[m],...X[i][m]];if(qs.length!==3)bad(`st${i+1} ${m}: soal!=3`);
  const n=m==="s"?3:4;
  qs.forEach((q,k)=>{const id=`st${i+1} ${m} q${k+1}`;
    if(q.o.length<3||q.o.length>n)bad(id+": jumlah opsi");
    if(!(q.a>=0&&q.a<q.o.length))bad(id+": indeks a");
    if(new Set(q.o).size!==q.o.length)bad(id+": opsi duplikat");
    if(!q.e||q.e.length<10)bad(id+": penjelasan kosong");
    if(!HLM.test(q.h))bad(id+": rujukan hlm ("+q.h+")");
  });
  if(new Set(qs.map(q=>q.t)).size!==3)bad(`st${i+1} ${m}: soal kembar`);
});});
["s","d"].forEach(m=>TL[m].forEach((e,k)=>{if(!e[0]||!/\d/.test(String(e[1])))bad(`TL ${m}[${k}]`)}));
let prev=-1;BANDS.forEach(b=>{if(b.from!==prev+1)bad("BANDS gap "+b.t);prev=b.to});if(prev!==17)bad("BANDS tidak sampai 17");
console.log(err?`${err} masalah`:"Data OK: 18 stasiun x 3 soal x 2 level");process.exit(err?1:0);
