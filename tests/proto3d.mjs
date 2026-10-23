// Prototipe peta 3D: WebGL tampil, 9 simpul, masuk/keluar kota, simulasi perjalanan, tanpa error dan tanpa horizontal scroll.
import {chromium} from "playwright";import {answerCurrent} from "./solve.mjs";import {pathToFileURL} from "node:url";import path from "node:path";
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
  await pg.evaluate(()=>{for(let i=0;i<6;i++)P().qd[i]=3;P3.tok=5;st.sel.i=5;draw3();});
  await pg.click('.sc3[data-st="6"]');
  await pg.waitForFunction(()=>!M3.busy()&&P3.tok===6,null,{timeout:30000});
  ok(await pg.evaluate(()=>NODE_OF[P3.tok])==="th",`${rm}: token berjalan ke Thaif saat stasiun 7 dibuka`);
  /* adegan RPG: stasiun 1 -> kilasan -> 3 soal -> selesai -> token siap ke stasiun 2 */
  await pg.evaluate(()=>{st.prog={s:{qd:{},pts:0,tl:false},d:{qd:{},pts:0,tl:false}};st.mode="s";save();P3.tok=0;st.sel.i=0;draw3();});
  await pg.click('.sc3[data-st="0"]');await pg.click('[data-a="play"]');
  await pg.waitForSelector('.stdlg [data-sa="next"]',{timeout:30000});
  ok(await pg.locator(".stg:not([hidden]) canvas").count()===1,`${rm}: adegan tampil`);
  await pg.click('[data-sa="skip"]');
  for(let n=0;n<3;n++){await answerCurrent(pg,0);await pg.click('.stdlg [data-act="nextq"]');}
  ok(await pg.evaluate(()=>isDone(0)&&SC.mode()==="done"),`${rm}: stasiun 1 selesai di dalam adegan`);
  await pg.click('.stdlg [data-sa="close"]');
  ok(await pg.evaluate(()=>!SC.isOpen()&&st.sel.i===1),`${rm}: kembali ke peta, stasiun 2 terpilih`);
  ok(await pg.evaluate(()=>JSON.parse(localStorage.getItem("peta-sirah-v2")).prog.s.qd[0])===3,`${rm}: progres tersimpan (sama dengan versi utama)`);
  await pg.click('.sc3[data-st="2"]');
  ok(await pg.locator('[data-a="play"]').count()===0,`${rm}: stasiun 3 masih terkunci`);
  ok(!(await pg.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),`${rm}: tanpa horizontal scroll`);
  ok(errs.length===0,`${rm}: tanpa error JS ${errs.join("|")}`);
  await ctx.close();
}
await b.close();process.exit(fail?1:0);
