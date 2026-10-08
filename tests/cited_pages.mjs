// Cetak semua nomor halaman buku yang dirujuk soal/peta (untuk verifikasi ke PDF).
import fs from "node:fs";import vm from "node:vm";
const html=fs.readFileSync(new URL("../index.html",import.meta.url),"utf8");
const js=html.split("<script>")[1].split("</script>")[0];
const stub={getElementById:()=>({addEventListener(){},setAttribute(){},style:{},clientWidth:360,innerHTML:""}),querySelector:()=>null,addEventListener(){}};
const ctx={document:stub,window:{addEventListener(){}},localStorage:{getItem:()=>null,setItem(){}},Math,JSON,console};
vm.createContext(ctx);
vm.runInContext(js.split("/* ---------- Peta ---------- */")[0].replace(/\nfunction load\(\)[\s\S]*$/,"")+";this.S=S;this.X=X;",ctx);
const out=[];
ctx.S.forEach((s,i)=>["s","d"].forEach(m=>[s.q[m],...ctx.X[i][m]].forEach((q,k)=>out.push({st:i+1,m,k:k+1,h:q.h,t:q.t,a:q.o[q.a],e:q.e}))));
fs.writeFileSync(process.argv[2],JSON.stringify(out,null,1));
