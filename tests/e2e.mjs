// Playwright: tamatkan 18 stasiun x 2 level + ujian urutan, cek tantangan acak & tanpa horizontal scroll.
import {chromium} from "playwright";import {pathToFileURL} from "node:url";import path from "node:path";
const url=pathToFileURL(path.resolve("index.html")).href;
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined});
let fail=0;const ok=(c,m)=>{if(!c){console.error("FAIL",m);fail++}else console.log("ok  ",m)};
for(const [mode,btn] of [["s","#m-smp"],["d","#m-dewasa"]]){
  const pg=await browser.newPage({viewport:{width:360,height:740}});
  const errs=[];pg.on("pageerror",e=>errs.push(e.message));
  await pg.goto(url);await pg.click(btn);
  for(let i=0;i<18;i++){
    for(let q=0;q<3;q++){
      const a=await pg.evaluate(([i])=>QS(i)[got(i)].a,[i]);
      await pg.click(`.opt[data-act="ans"][data-k="${a}"]`);
      await pg.click('.btn[data-act="nextq"]');
    }
    ok(await pg.evaluate(i=>isDone(i),i),`${mode} stasiun ${i+1} selesai`);
    if(i<17)await pg.click(`.btn[data-act="next"]`);
    ok(!(await pg.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),`${mode} st${i+1} tanpa horizontal scroll`);
  }
  await pg.click('.btn[data-act="next"]');
  const order=await pg.evaluate(()=>TL[st.mode].map((_,n)=>n));
  for(const n of order)await pg.click(`button[data-act="pick"][data-k="${n}"]`);
  await pg.click('.btn[data-act="check"]');
  ok(await pg.evaluate(()=>P().tl),`${mode} ujian urutan lulus`);
  ok((await pg.locator(".badges li.on").count())===6,`${mode} 6 lencana`);
  await pg.locator(".chbox summary").click();await pg.click('[data-ch="start"]');
  for(let n=0;n<10;n++){
    const a=await pg.evaluate(()=>ch.qs[ch.n].a);
    await pg.click(`[data-ch="ans"][data-k="${a}"]`);await pg.click('[data-ch="next"]');
  }
  ok(await pg.evaluate(()=>ch.fin&&ch.score===10&&P().chPerfect),`${mode} tantangan sempurna`);
  ok(errs.length===0,`${mode} tanpa error JS ${errs.join("|")}`);
  await pg.screenshot({path:`tests/shot-${mode}.png`,fullPage:false});
  await pg.close();
}
await browser.close();process.exit(fail?1:0);
