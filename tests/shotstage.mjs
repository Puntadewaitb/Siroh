// Screenshot adegan RPG: tiap beat kisah untuk stasiun tertentu. Pakai: node tests/shotstage.mjs <dir> [stasiun0,...]
import {chromium} from "playwright";import {pathToFileURL} from "node:url";import path from "node:path";
const out=process.argv[2]||"tests",list=(process.argv[3]||"2,10").split(",").map(Number);
const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:["--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]});
const pg=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:1.5});const errs=[];
pg.on("pageerror",e=>errs.push(e.message));pg.on("console",m=>{if(m.type()==="error")errs.push(m.text())});
await pg.goto(pathToFileURL(path.resolve("peta3d.html")).href);await pg.waitForSelector(".m3.ready",{timeout:60000});
await pg.evaluate(()=>{st.learn=true;draw3();});
for(const i of list){
  await pg.evaluate(i=>{pick3(i);},i);await pg.waitForTimeout(1500);
  await pg.click('[data-a="play"]');await pg.waitForSelector('.stdlg [data-sa="next"]',{timeout:30000});
  const n=await pg.evaluate(i=>SC.beats(i).length,i);
  for(let k=0;k<n;k++){
    await pg.waitForTimeout(k?2600:1600);await pg.screenshot({path:`${out}/st${i+1}-b${k+1}.png`});
    await pg.click('[data-sa="next"]');if(await pg.locator('#dtx').count()&&k<n-1){await pg.waitForTimeout(100);}
    if(k<n-1&&await pg.evaluate(()=>!!document.querySelector('.stdlg [data-sa="next"]'))&&await pg.evaluate(k=>document.querySelectorAll('.dots i.on').length&&[...document.querySelectorAll('.dots i')].findIndex(x=>x.classList.contains("on"))===k,k))await pg.click('[data-sa="next"]');
  }
  await pg.waitForTimeout(800);await pg.screenshot({path:`${out}/st${i+1}-quiz.png`});
  await pg.click('.stx');await pg.waitForTimeout(500);
}
console.log(errs.length?"ERR "+errs.join(" | "):"tanpa error");await b.close();
