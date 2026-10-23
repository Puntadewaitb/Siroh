// Prototipe peta 3D: WebGL tampil, 9 simpul, masuk/keluar kota, simulasi perjalanan, tanpa error dan tanpa horizontal scroll.
import {chromium} from "playwright";import {pathToFileURL} from "node:url";import path from "node:path";
const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:["--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]});
let fail=0;const ok=(c,m)=>{if(!c){console.error("FAIL",m);fail++}else console.log("ok  ",m)};
for(const rm of ["no-preference","reduce"]){
  const ctx=await b.newContext({viewport:{width:360,height:740},reducedMotion:rm});const pg=await ctx.newPage();
  const errs=[];pg.on("pageerror",e=>errs.push(e.message));
  await pg.goto(pathToFileURL(path.resolve("peta3d.html")).href);
  await pg.waitForSelector(".m3.ready",{timeout:60000});
  ok(await pg.locator(".nd3").count()===9,`${rm}: 9 simpul tempat`);
  ok(await pg.locator(".sc3").count()===19,`${rm}: timeline 18 stasiun + ujian`);
  await pg.click('[data-a="city"]');await pg.waitForFunction(()=>M3.view()==="mk"&&!M3.busy(),null,{timeout:20000});
  ok(await pg.locator(".lm3").count()>=8,`${rm}: kota Makkah dengan titik-titik tempat`);
  await pg.click('[data-story="mnk"]');ok(await pg.locator(".lg3").count()>=1,`${rm}: kisah kota menampilkan legenda`);
  await pg.click('#back3');await pg.waitForFunction(()=>M3.view()==="region",null,{timeout:20000});
  await pg.click('.sc3[data-st="10"]');await pg.click('[data-a="sim"]');
  await pg.waitForFunction(()=>!M3.busy()&&P3.tok===10,null,{timeout:30000});
  ok(await pg.evaluate(()=>NODE_OF[P3.tok])==="bd","simulasi: token tiba di Badr");
  ok(!(await pg.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),`${rm}: tanpa horizontal scroll`);
  ok(errs.length===0,`${rm}: tanpa error JS ${errs.join("|")}`);
  await ctx.close();
}
await b.close();process.exit(fail?1:0);
