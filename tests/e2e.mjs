// Playwright (tanpa WebGL, jalur cadangan): 18 stasiun x 2 level lewat jendela soal, kunci urutan, hati, ujian urutan,
// latihan harian, album kartu, tantangan acak, tanpa horizontal scroll 360px, screenshot terang/gelap.
import {chromium} from "playwright";import {answerCurrent,solveStation} from "./solve.mjs";import {pathToFileURL} from "node:url";import path from "node:path";
const url=pathToFileURL(path.resolve("index.html")).href;
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined});
let fail=0;const ok=(c,m)=>{if(!c){console.error("FAIL",m);fail++}else console.log("ok  ",m)};
const noGL=()=>{const g=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...a){return /webgl/i.test(t)?null:g.call(this,t,...a);};};
const wide=pg=>pg.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
async function newPage(o={}){const ctx=await browser.newContext({viewport:{width:360,height:740},...o});await ctx.addInitScript(noGL);const pg=await ctx.newPage();
  const errs=[];pg.on("pageerror",e=>errs.push(e.message));await pg.goto(url);return {pg,ctx,errs};}
async function playStation(pg,i){
  await pg.click(`.sc3[data-st="${i}"]`);await pg.click('[data-a="play"]');await pg.waitForSelector("#mdl:not([hidden])");
  await solveStation(pg,i);await pg.click('[data-m="x"]');
}

/* 1. Jalur cadangan tanpa WebGL + kunci urutan + hati */
{
  const {pg,ctx,errs}=await newPage();
  ok(await pg.locator(".no3").count()===1,"tanpa WebGL: pesan cadangan tampil");
  ok(await pg.locator(".sc3").count()===19,"timeline 18 stasiun + ujian");
  await pg.uncheck("#learn3");
  ok(await pg.locator(".sc3.lock").count()===18,"mode berurutan: 17 stasiun + ujian terkunci");
  await pg.click('[data-a="play"]');await pg.waitForSelector("#mdl:not([hidden])");
  ok(await pg.locator(".fbk p").count()>=3,"kilasan kisah tampil sebagai teks");
  ok(!(await pg.evaluate(()=>/hlm\./i.test(document.getElementById("mdl").innerText))),"tanpa nomor halaman");
  await answerCurrent(pg,0,{wrong:true});
  ok(await pg.evaluate(()=>hp(0))===2,"jawaban salah: hati berkurang");
  ok(await pg.evaluate(()=>Object.keys(P().rv||{}).length)===1,"soal salah masuk antrean latihan harian");
  await pg.click('[data-m="x"]');
  ok(!(await wide(pg)),"tanpa horizontal scroll");
  ok(errs.length===0,"tanpa error JS "+errs.join("|"));
  await ctx.close();
}

/* 2. Tamat 18 stasiun x 2 level + ujian urutan + menu */
for(const m of ["s","d"]){
  const {pg,ctx,errs}=await newPage();await pg.uncheck("#learn3");
  if(m==="d")await pg.click("#md3");
  for(let i=0;i<18;i++){await playStation(pg,i);}
  ok(await pg.evaluate(()=>doneCount())===18,`${m}: 18 stasiun tamat`);
  ok(await pg.evaluate(()=>st.sel.i)===18,`${m}: ujian urutan terpilih`);
  await pg.click('#info3 [data-mn="ujian"]');
  const n=await pg.evaluate(()=>TL[st.mode].length);
  for(let k=0;k<n;k++)await pg.click(`#mdlc [data-tl="pick"][data-k="${k}"]`);
  await pg.click('#mdlc [data-tl="check"]');
  ok(await pg.evaluate(()=>P().tl===true),`${m}: ujian urutan lulus`);
  await pg.click('[data-m="x"]');
  await pg.click('[data-mn="album"]');
  ok(await pg.locator("#mdlc .kc:not(.off)").count()===54,`${m}: album 54 kartu terbuka`);
  ok(await pg.locator("#mdlc .badges li.on").count()>=6,`${m}: lencana bab diraih`);
  await pg.click('[data-m="x"]');
  await pg.click('[data-mn="tantangan"]');await pg.click('#mdlc [data-ch="start"]');
  for(let k=0;k<10;k++){const a=await pg.evaluate(()=>ch.qs[ch.n].a);await pg.click(`#mdlc [data-ch="ans"][data-k="${a}"]`);await pg.click("#chnext");}
  ok(await pg.evaluate(()=>P().chPerfect===true),`${m}: tantangan acak sempurna`);
  await pg.click('[data-m="x"]');
  await pg.click('[data-mn="latihan"]');await pg.click('#mdlc [data-lt="start"]');
  const pts0=await pg.evaluate(()=>P().pts);
  for(let k=0;k<5;k++){const a=await pg.evaluate(()=>lt.qs[lt.n].a);await pg.click(`#mdlc [data-lt="ans"][data-k="${a}"]`);await pg.click("#ltnext");}
  ok(await pg.evaluate(p=>P().pts===p+10&&lh().streak===1,pts0),`${m}: latihan harian +10 poin, rentetan 1 hari`);
  await pg.click('#mdlc [data-lt="start"]');for(let k=0;k<5;k++){await pg.click('#mdlc [data-lt="ans"][data-k="0"]');await pg.click("#ltnext");}
  ok(await pg.evaluate(p=>P().pts===p+10,pts0),`${m}: latihan kedua di hari yang sama tanpa poin`);
  await pg.click('[data-m="x"]');
  ok(!(await wide(pg)),`${m}: tanpa horizontal scroll`);
  ok(errs.length===0,`${m}: tanpa error JS `+errs.join("|"));
  if(m==="s"){await pg.screenshot({path:"tests/shot-s.png",fullPage:true});}
  await ctx.close();
}

/* 3. Pengulangan berjarak: soal salah jatuh tempo besok, benar -> jeda makin panjang */
{
  const {pg,ctx}=await newPage();
  const r=await pg.evaluate(()=>{P().qd[5]=3;rvMiss(5,0);const t=today(),k="5:0",a=[rvDue().includes(k)];rvGood(k);a.push(rvs()[k].due===t+2);rvBad(k);a.push(rvs()[k].due===t+1&&rvs()[k].b===0);return a;});
  ok(r.every(Boolean),"kotak latihan: jatuh tempo, naik kotak, turun lagi saat salah");
  await ctx.close();
}

/* 4. Tema gelap + pengaturan grafis */
{
  const {pg,ctx,errs}=await newPage({colorScheme:"dark"});
  await pg.evaluate(()=>{for(let i=0;i<4;i++)P().qd[i]=3;save();draw3();});await pg.click(".set3 summary");await pg.click('[data-gfx="ringan"]');
  ok(await pg.evaluate(()=>gfxLite()&&JSON.parse(localStorage.getItem("peta-sirah-v2")).gfx==="ringan"),"mode grafis ringan tersimpan");
  await pg.click('[data-mn="album"]');await pg.screenshot({path:"tests/shot-d.png"});
  ok(errs.length===0,"gelap: tanpa error JS "+errs.join("|"));
  await ctx.close();
}
await browser.close();process.exit(fail?1:0);
