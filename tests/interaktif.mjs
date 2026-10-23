// Kisah interaktif (Badr, Uhud, Khandaq): tebak, aksi, jelajah bisa diselesaikan; screenshot tiap langkah interaktif.
import {chromium} from "playwright";import {pathToFileURL} from "node:url";import path from "node:path";
const out=process.argv[2]||null;
const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:["--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]});
let fail=0;const ok=(c,m)=>{if(!c){console.error("FAIL",m);fail++}else console.log("ok  ",m)};
for(const mode of ["s","d"]){
  const pg=await b.newPage({viewport:{width:390,height:844}});const errs=[];pg.on("pageerror",e=>errs.push(e.message));
  await pg.goto(pathToFileURL(path.resolve("peta3d.html")).href);await pg.waitForSelector(".m3.ready",{timeout:60000});
  await pg.evaluate(m=>{st.prog={s:{qd:{},pts:0,tl:false},d:{qd:{},pts:0,tl:false}};st.learn=true;setMode3(m);},mode);
  const list=await pg.evaluate(()=>Object.keys(Object.assign({},INTER3)).map(Number).concat([10,11,12]).sort((a,b)=>a-b));
  for(const i of list){
    await pg.evaluate(i=>pick3(i),i);await pg.waitForTimeout(400);await pg.click('[data-a="play"]');
    await pg.waitForSelector('.stdlg [data-sa="next"]',{timeout:30000});
    const n=await pg.evaluate(i=>SC.beats(i).length,i);let seen={tebak:0,aksi:0,jelajah:0};
    for(let k=0;k<n;k++){
      const s=await pg.evaluate(()=>SC.step());
      if(s.k!=="beat"){await pg.waitForTimeout(2600);seen[s.k]++;
        if(s.k!=="tebak"){const vis=await pg.$$eval(".hs",els=>els.map(e=>{const r=e.getBoundingClientRect(),d=document.querySelector(".stdlg").getBoundingClientRect();return e.style.display!=="none"&&r.top>40&&r.bottom<d.top+4&&r.left>-4&&r.right<innerWidth+4;}));
          ok(vis.length>0&&vis.every(Boolean),`${mode} st${i+1} ${s.k}: semua tanda terlihat di atas dialog (${vis.filter(Boolean).length}/${vis.length})`);}
        if(s.k==="tebak"){await pg.click('.stdlg [data-sa="tb"]');}
        if(s.k==="jelajah"){const c=await pg.locator(".hs.jel").count();for(let j=0;j<c;j++)await pg.locator(".hs.jel").nth(j).dispatchEvent("click");
          ok(await pg.evaluate(()=>SC.step().found)===c,`${mode} st${i+1} jelajah: ${c} tanda ditemukan`);}
        if(s.k==="aksi"){for(let g=0;g<12&&!(await pg.evaluate(()=>SC.step().done));g++){
            const lab=await pg.locator(".hs.aks").evaluateAll(els=>els.map(e=>e.textContent));if(!lab.length)break;
            const want=await pg.evaluate(()=>SC.want&&SC.want());let j=lab.indexOf("Bukit kecil");if(j<0)j=lab.indexOf("Gua Tsaur");if(want&&lab.indexOf(want)>-1)j=lab.indexOf(want);await pg.locator(".hs.aks").nth(j>-1?j:0).dispatchEvent("click");await pg.waitForTimeout(150);}
          ok(await pg.evaluate(()=>SC.step().done),`${mode} st${i+1} aksi ${s.act} selesai`);}
        if(out)await pg.screenshot({path:`${out}/ix-${mode}-st${i+1}-${k}.png`});
      }
      await pg.click('.stdlg [data-sa="next"]');
      if(s.k==="beat"&&await pg.evaluate(k=>SC.mode()==="story"&&document.querySelectorAll(".dots i.on").length&&[...document.querySelectorAll(".dots i")].findIndex(x=>x.classList.contains("on"))===k,k))await pg.click('.stdlg [data-sa="next"]');
    }
    ok(seen.tebak+seen.aksi+seen.jelajah>=2,`${mode} st${i+1}: ${JSON.stringify(seen)}`);
    ok(await pg.evaluate(()=>SC.mode())==="quiz",`${mode} st${i+1}: lanjut ke soal`);
    await pg.click(".stx");
  }
  ok(await pg.evaluate(()=>P().pts)>0,`${mode} poin dari interaksi: ${await pg.evaluate(()=>P().pts)}`);
  ok(errs.length===0,`${mode} tanpa error JS ${errs.join("|")}`);await pg.close();
}
await b.close();process.exit(fail?1:0);
