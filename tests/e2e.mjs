// Playwright: papan peta, perpindahan token, tab per tempat, 18 stasiun x 2 level, ujian, tantangan, tanpa horizontal scroll 360px.
import {chromium} from "playwright";import {pathToFileURL} from "node:url";import path from "node:path";
const url=pathToFileURL(path.resolve("index.html")).href;
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined});
let fail=0;const ok=(c,m)=>{if(!c){console.error("FAIL",m);fail++}else console.log("ok  ",m)};
const idle=pg=>pg.waitForFunction(()=>!BD.moving,null,{timeout:10000});
const answer=async(pg,i)=>{for(let q=0;q<3;q++){const a=await pg.evaluate(i=>QS(i)[got(i)].a,i);await pg.click(`.opt[data-act="ans"][data-k="${a}"]`);await pg.click('.btn[data-act="nextq"]');}};

/* 1. Animasi nyata: token berjalan Makkah -> Thaif */
{
  const pg=await browser.newPage({viewport:{width:360,height:740}});const errs=[];pg.on("pageerror",e=>errs.push(e.message));
  await pg.goto(url);
  ok(await pg.locator(".nd").count()===9,"papan punya 9 simpul tempat");
  ok(await pg.evaluate(()=>NODE_OF[BD.tokSt])==="mk","token mulai di Makkah");
  ok(await pg.locator(".stab").count()===8,"tab Makkah menampilkan 8 stasiun");
  ok(await pg.locator(".stab.cur").count()===1&&await pg.locator(".stab.lock").count()===7,"tab: 1 sedang, 7 terkunci");
  for(let i=0;i<6;i++){await answer(pg,i);await pg.click('.btn[data-act="next"]');await idle(pg);}
  ok(await pg.evaluate(()=>st.sel.i)===6&&await pg.evaluate(()=>NODE_OF[BD.tokSt])==="th","selesai stasiun 6: token berjalan ke Thaif (animasi)");
  ok(await pg.locator("#lg-5.done").count()===1,"rute Makkah-Thaif ditandai selesai");
  await pg.click('#nd-mk');
  ok(await pg.evaluate(()=>st.sel.i)===5||await pg.evaluate(()=>NODE_OF[st.sel.i])==="mk","klik simpul yang selesai membuka stasiunnya");
  ok(await pg.locator(".stab.done").count()===6,"tab Makkah: 6 selesai");
  await pg.click('[data-bc="all"]');await idle(pg);await pg.locator('#nd-md').dispatchEvent('click');
  ok(await pg.locator(".fb.err",{hasText:"Terkunci"}).count()===1,"simpul terkunci menampilkan pesan");
  ok(errs.length===0,"tanpa error JS (animasi) "+errs.join("|"));
  await pg.close();
}
/* 2. Tamatkan semua (gerak dikurangi -> instan) */
for(const [mode,btn] of [["s","#m-smp"],["d","#m-dewasa"]]){
  const ctx=await browser.newContext({viewport:{width:360,height:740},reducedMotion:"reduce"});const pg=await ctx.newPage();
  const errs=[];pg.on("pageerror",e=>errs.push(e.message));
  await pg.goto(url);await pg.click(btn);
  for(let i=0;i<18;i++){
    await answer(pg,i);
    ok(await pg.evaluate(i=>isDone(i),i),`${mode} stasiun ${i+1} selesai`);
    await pg.click('.btn[data-act="next"]');await idle(pg);
    ok(!(await pg.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),`${mode} st${i+1} tanpa horizontal scroll`);
  }
  const order=await pg.evaluate(()=>TL[st.mode].map((_,n)=>n));
  for(const n of order)await pg.click(`button[data-act="pick"][data-k="${n}"]`);
  await pg.click('.btn[data-act="check"]');
  ok(await pg.evaluate(()=>P().tl),`${mode} ujian urutan lulus`);
  ok(await pg.locator("#nd-md.done").count()===1,`${mode} simpul Madinah selesai`);
  ok((await pg.locator(".badges li.on").count())===6,`${mode} 6 lencana`);
  await pg.locator(".chbox summary").click();await pg.click('[data-ch="start"]');
  for(let n=0;n<10;n++){
    const a=await pg.evaluate(()=>ch.qs[ch.n].a);
    await pg.click(`[data-ch="ans"][data-k="${a}"]`);await pg.click('[data-ch="next"]');
  }
  ok(await pg.evaluate(()=>ch.fin&&ch.score===10&&P().chPerfect),`${mode} tantangan sempurna`);
  ok(errs.length===0,`${mode} tanpa error JS ${errs.join("|")}`);
  await pg.screenshot({path:`tests/shot-${mode}.png`,fullPage:false});
  await ctx.close();
}
await browser.close();process.exit(fail?1:0);
