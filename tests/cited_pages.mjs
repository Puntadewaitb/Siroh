// Cetak semua nomor halaman buku yang dirujuk soal/peta (untuk verifikasi ke PDF).
import fs from "node:fs";import vm from "node:vm";
const html=fs.readFileSync(new URL("../index.html",import.meta.url),"utf8");
const js=html.split("<script>")[1].split("</script>")[0];
const stub={getElementById:()=>({addEventListener(){},setAttribute(){},style:{},clientWidth:360,innerHTML:""}),querySelector:()=>null,addEventListener(){}};
const ctx={document:stub,window:{addEventListener(){}},localStorage:{getItem:()=>null,setItem(){}},Math,JSON,console};
vm.createContext(ctx);
vm.runInContext(js.split("/* ---------- Peta ---------- */")[0].replace(/\nfunction load\(\)[\s\S]*$/,"")+";this.S=S;this.BK=BK;",ctx);
const out=[];
const ans=q=>q.ty==="mc"?q.o[q.a]:q.ty==="mu"?q.a.map(k=>q.o[k]).join(" ; "):q.ty==="or"?q.it.join(" ; "):q.l.map((l,k)=>l+" = "+q.r[k]).join(" ; ");
ctx.S.forEach((s,i)=>["s","d"].forEach(m=>ctx.BK[i][m].forEach((q,k)=>out.push({st:i+1,m,k:k+1,ty:q.ty,h:q.h,t:q.t,a:ans(q),e:q.e}))));
fs.writeFileSync(process.argv[2],JSON.stringify(out,null,1));
