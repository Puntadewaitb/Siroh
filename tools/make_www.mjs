// Salin file web statis ke www/ (dipakai Capacitor untuk membungkus APK).
import fs from "node:fs";
fs.rmSync("www",{recursive:true,force:true});fs.mkdirSync("www/fonts",{recursive:true});
for(const f of ["index.html","manifest.webmanifest","sw.js","icon.svg"])fs.copyFileSync(f,"www/"+f);
for(const f of fs.readdirSync("fonts"))fs.copyFileSync("fonts/"+f,"www/fonts/"+f);
console.log("www/ siap:",fs.readdirSync("www").join(", "));
