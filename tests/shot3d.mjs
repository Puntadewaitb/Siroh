// Screenshot prototipe peta 3D (WebGL lewat SwiftShader di headless).
import {chromium} from "playwright";import {pathToFileURL} from "node:url";import path from "node:path";
const out=process.argv[2]||"tests";
const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:["--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]});
const errs=[];
for(const [w,h,tag] of [[390,844,"hp"],[1280,800,"desktop"]]){
  const pg=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:w<500?2:1});pg.on("pageerror",e=>errs.push(e.message));pg.on("console",m=>{if(m.type()==="error")errs.push(m.text())});
  await pg.goto(pathToFileURL(path.resolve("index.html")).href);
  await pg.waitForSelector(".m3.ready",{timeout:30000});await pg.waitForTimeout(1500);
  await pg.locator(".m3wrap").screenshot({path:`${out}/p3-${tag}-region.png`});
  await pg.click('[data-c="all"]');await pg.waitForTimeout(1500);await pg.locator(".m3wrap").screenshot({path:`${out}/p3-${tag}-all.png`});
  await pg.click('[data-a="city"]');await pg.waitForTimeout(2500);await pg.locator(".m3wrap").screenshot({path:`${out}/p3-${tag}-makkah.png`});
  await pg.click('[data-story="mnk"]');await pg.waitForTimeout(800);await pg.locator(".m3wrap").screenshot({path:`${out}/p3-${tag}-makkah-mnk.png`});
  await pg.click('#back3');await pg.waitForTimeout(1200);
  await pg.click('.sc3[data-st="9"]');await pg.waitForTimeout(1300);await pg.click('[data-a="city"]');await pg.waitForTimeout(2500);
  await pg.click('[data-story="uhud"]');await pg.waitForTimeout(800);await pg.locator(".m3wrap").screenshot({path:`${out}/p3-${tag}-madinah.png`});
  await pg.click('#back3');await pg.waitForTimeout(1200);
  await pg.click('.sc3[data-st="0"]');await pg.waitForTimeout(1000);await pg.click('.sc3[data-st="11"]');await pg.waitForTimeout(900);
  await pg.click('[data-a="sim"]');await pg.waitForTimeout(3500);await pg.locator(".m3wrap").screenshot({path:`${out}/p3-${tag}-travel.png`});
  console.log(tag,"scrollW>W:",await pg.evaluate(()=>document.documentElement.scrollWidth>innerWidth));
  await pg.close();
}
console.log(errs.length?"ERR "+errs.join(" | "):"tanpa error");
await b.close();
