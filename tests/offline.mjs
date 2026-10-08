// Verifikasi mode offline: muat sekali lewat http, putuskan jaringan, muat ulang, lalu main.
import {chromium} from "playwright";import http from "node:http";import fs from "node:fs";import path from "node:path";
const types={".html":"text/html",".js":"text/javascript",".css":"text/css",".svg":"image/svg+xml",".woff2":"font/woff2",".webmanifest":"application/manifest+json"};
const srv=http.createServer((q,r)=>{let f=decodeURIComponent(q.url.split("?")[0]);if(f.endsWith("/"))f+="index.html";const p=path.join(process.cwd(),f);
  if(!fs.existsSync(p)||!p.startsWith(process.cwd())){r.writeHead(404).end();return;}r.writeHead(200,{"content-type":types[path.extname(p)]||"application/octet-stream"}).end(fs.readFileSync(p));}).listen(0);
const port=srv.address().port,base=`http://localhost:${port}/`;
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined});
const ctx=await browser.newContext();const pg=await ctx.newPage();
let fail=0;const ok=(c,m)=>{if(!c){console.error("FAIL",m);fail++}else console.log("ok  ",m)};
const ext=[];pg.on("request",r=>{if(!r.url().startsWith(base))ext.push(r.url());});
await pg.goto(base);await pg.evaluate(()=>navigator.serviceWorker.ready);await pg.waitForTimeout(1500);
ok(ext.length===0,"tidak ada request ke luar domain "+ext.join(","));
await ctx.setOffline(true);await pg.reload();
ok(await pg.locator(".nd").count()===9,"offline: papan peta tampil setelah reload");
ok(await pg.evaluate(()=>document.fonts.check("16px Marcellus")),"offline: font lokal termuat");
const a=await pg.evaluate(()=>QS(0)[0].a);await pg.click(`.opt[data-act="ans"][data-k="${a}"]`);
ok(await pg.evaluate(()=>got(0))===1,"offline: bisa menjawab soal");
await browser.close();srv.close();process.exit(fail?1:0);
