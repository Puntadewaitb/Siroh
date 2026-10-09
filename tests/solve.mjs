// Pembantu tes: menjawab soal yang sedang tampil sesuai tipenya.
export async function answerCurrent(pg,i,{wrong=false}={}){
  const q=await pg.evaluate(i=>{const q=QS(i)[got(i)];return q;},i);
  if(q.ty==="mc"){
    let k=q.a;if(wrong){const en=await pg.$$eval('.opt[data-act="ans"]:not([disabled])',els=>els.map(e=>+e.dataset.k));k=en.find(j=>j!==q.a);if(k===undefined)k=q.a;}
    await pg.click(`.opt[data-act="ans"][data-k="${k}"]`);
  }else if(q.ty==="mu"){
    let pick=q.a;if(wrong)pick=[0,1,2,3,4].filter(j=>!q.a.includes(j)).slice(0,2);
    for(const k of pick)await pg.click(`.opt[data-act="msel"][data-k="${k}"]`);
    await pg.click('.btn[data-act="mchk"]');
  }else if(q.ty==="or"){
    const order=q.it.map((_,k)=>k);if(wrong)order.reverse();
    for(const k of order)await pg.click(`button[data-act="opk"][data-k="${k}"]`);
    await pg.click('.btn[data-act="ochk"]');
  }else if(q.ty==="mt"){
    for(let l=0;l<q.l.length;l++){const v=wrong?(l+1)%q.l.length:l;await pg.selectOption(`select[data-l="${l}"]`,String(v));}
    await pg.click('.btn[data-act="mtchk"]');
  }
  return q.ty;
}
export async function solveStation(pg,i){
  for(let n=0;n<3;n++){await answerCurrent(pg,i);await pg.click('.btn[data-act="nextq"]');}
}
